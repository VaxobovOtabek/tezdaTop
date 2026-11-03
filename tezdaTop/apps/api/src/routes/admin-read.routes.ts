import type { Request, Response, NextFunction } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { supabase, isSupabaseConfigured, hydrateDatabase } from '../db/supabase.js';
import { InMemoryDatabase } from '../db/in-memory-db.js';
import { verifySignedSessionToken, SESSION_TTL_MS, revokedTokens } from '../services/session.service.js';
import { organizationListOptions, type OrganizationListOptions } from '../services/organization-list.service.js';

type Row = Record<string, any>;
const paths = new Set(['overview', 'organizations', 'users', 'stores', 'audit']);
const fail = (status: number, message: string) => Object.assign(new Error(message), { status });
const quoted = (value: string) => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const pattern = (value: string) => quoted(`%${value.replace(/[\\%_]/g, '\\$&')}%`);

/** Table-specific reads never load/clone/commit the global database snapshot. */
export class AdminReadRepository {
  constructor(private client: SupabaseClient) {}

  async rows(table: string, columns = '*', filter?: (query: any) => any): Promise<Row[]> {
    const rows: Row[] = [];
    for (let offset = 0; ; offset += 500) {
      let query = this.client.from(table).select(columns).order('id');
      if (filter) query = filter(query);
      const result = await query.range(offset, offset + 499);
      if (result.error) throw fail(503, 'Ma’lumotlarni yuklab bo‘lmadi. Qayta urinib ko‘ring.');
      rows.push(...(result.data || []));
      if (!result.data || result.data.length < 500) return rows;
    }
  }

  async authenticate(req: Request) {
    const header = req.headers.authorization;
    const token = (header?.startsWith('Bearer ') ? header.slice(7) : header) || req.cookies?.session_token;
    if (typeof token !== 'string' || token.length > 512 || !/^yqt_[^.]+\.\d+\.\d+\.[a-f0-9]{32}\.[\w-]+$/.test(token.trim())) throw fail(401, 'Tizimga kiring');
    const cleanToken = token.trim(), userId = cleanToken.slice(4).split('.')[0];
    // Reject forged signatures before making any database request. The version
    // is checked again against the persisted user before granting access.
    if (!verifySignedSessionToken(cleanToken, Date.now(), { tokenVersion: Number(cleanToken.slice(4).split('.')[2]), revoked: false })) throw fail(401, 'Tizimga kiring');
    const hash = crypto.createHash('sha256').update(cleanToken).digest('hex');
    const [userResult, revokedResult] = await Promise.all([
      this.client.from('users').select('*').eq('id', userId).maybeSingle(),
      this.client.from('application_records').select('payload').eq('id', `revocations:${hash}`).maybeSingle()
    ]);
    if (userResult.error || revokedResult.error) throw fail(503, 'Sessiyani tekshirib bo‘lmadi. Qayta urinib ko‘ring.');
    const row = userResult.data;
    if (!row || row.status !== 'ACTIVE') throw fail(401, 'Tizimga kiring');
    const verified = verifySignedSessionToken(cleanToken, Date.now(), {
      tokenVersion: Number(row.app_data?.tokenVersion || 0),
      revoked: Number(revokedResult.data?.payload || 0) > Date.now() || revokedTokens.has(cleanToken)
    });
    if (!verified) throw fail(401, 'Tizimga kiring');
    return { row, token: cleanToken, expiresAt: verified.createdAt + SESSION_TTL_MS };
  }

  hydrate(tables: Record<string, Row[]>) {
    const scoped = new InMemoryDatabase();
    hydrateDatabase(scoped, tables);
    return scoped;
  }

  async organizations(options: OrganizationListOptions) {
    let query = this.client.from('organizations').select('*', { count: 'exact' }).order('created_at', { ascending: false }).order('id');
    if (options.paged) {
      query = options.status === 'ALL' ? query.neq('status', 'DELETED') : query.eq('status', options.status);
      if (options.q) query = query.or(['name','inn','type','region','city'].map(field => `${field}.ilike.${pattern(options.q)}`).join(','));
      if (options.region) {
        const regionFilter = (q: any) => options.region === 'Toshkent shahri' ? q.or(`region.eq.${quoted(options.region)},region.is.null,region.eq."",region.ilike."%Toshkent%"`) : q.eq('region', options.region);
        const matching = await this.rows('stores', 'id,organization_id', regionFilter);
        const ids = [...new Set(matching.map(store => store.organization_id))];
        const own = options.region === 'Toshkent shahri' ? `region.eq.${quoted(options.region)},region.is.null,region.eq."",region.ilike."%Toshkent%"` : `region.eq.${quoted(options.region)}`;
        query = query.or(own + (ids.length ? `,id.in.(${ids.map(quoted).join(',')})` : ''));
      }
      if (options.city) {
        const matching = await this.rows('stores', 'id,organization_id', q => q.or(`app_data->>city.eq.${quoted(options.city)},address.ilike.${pattern(options.city)}`));
        const ids = [...new Set(matching.map(store => store.organization_id))];
        query = query.or(`city.ilike.${pattern(options.city)}` + (ids.length ? `,id.in.(${ids.map(quoted).join(',')})` : ''));
      }
    }
    if (!options.paged) {
      const orgs = await this.rows('organizations');
      return this.organizationDetails(orgs);
    }
    const start = (options.page - 1) * options.limit;
    let result = await query.range(start, start + options.limit - 1);
    if (result.error) throw fail(503, 'Tashkilotlarni yuklab bo‘lmadi.');
    const total = result.count || 0, totalPages = Math.max(1, Math.ceil(total / options.limit));
    const page = Math.min(options.page, totalPages);
    if (page !== options.page) {
      result = await query.range((page - 1) * options.limit, page * options.limit - 1);
      if (result.error) throw fail(503, 'Tashkilotlarni yuklab bo‘lmadi.');
    }
    return { ...await this.organizationDetails(result.data || []), total, page, limit: options.limit, totalPages };
  }

  private async organizationDetails(orgs: Row[]) {
    const ids = orgs.map(org => org.id);
    if (!ids.length) return { organizations: [] };
    const [stores, memberships] = await Promise.all([
      this.rows('stores', '*', q => q.in('organization_id', ids)),
      this.rows('memberships', 'id,user_id,organization_id', q => q.in('organization_id', ids))
    ]);
    const userIds = [...new Set(memberships.map(m => m.user_id))];
    const users = userIds.length ? await this.rows('users', 'id,status', q => q.in('id', userIds).neq('status','DELETED')) : [];
    const activeIds = new Set(users.map(user => user.id));
    const scoped = this.hydrate({ organizations: orgs, stores });
    return { organizations: [...scoped.organizations.values()].map(org => ({
      ...org, stores: [...scoped.stores.values()].filter(store => store.organizationId === org.id),
      userCount: new Set(memberships.filter(m => m.organization_id === org.id && activeIds.has(m.user_id)).map(m => m.user_id)).size
    })) };
  }

  async users() {
    const [users, memberships, organizations] = await Promise.all([this.rows('users'), this.rows('memberships'), this.rows('organizations')]);
    const scoped = this.hydrate({ users, memberships, organizations });
    const byUser = new Map<string, any>();
    for (const member of scoped.memberships.values()) if (!byUser.has(member.userId)) byUser.set(member.userId, member);
    return { users: [...scoped.users.values()].map((user: any) => {
      const { passwordHash, plainPassword, verificationCode, ...clean } = user;
      const organizationId = byUser.get(user.id)?.organizationId || user.organizationId;
      return { ...clean, organizationId, organizationName: scoped.organizations.get(organizationId)?.name };
    }) };
  }

  async audit(limit = 100) {
    const result = await this.client.from('audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).order('id').limit(limit);
    if (result.error) throw fail(503, 'Audit tarixini yuklab bo‘lmadi.');
    const ids = [...new Set((result.data || []).map((row: any) => row.user_id).filter(Boolean))];
    const users = ids.length ? await this.rows('users', 'id,full_name', q => q.in('id', ids)) : [];
    const names = new Map(users.map(user => [user.id, user.full_name]));
    const scoped = this.hydrate({ audit_logs: result.data || [] });
    return { auditLogs: scoped.auditLogs.map(log => ({ ...log, actorName: names.get(log.actorId) || log.actorEmail })), total: result.count || 0 };
  }

  async stores() {
    const [stores, organizations, reports, corrections, offers] = await Promise.all([
      this.rows('stores'), this.rows('organizations'), this.rows('reports','id,target_id,status'),
      this.rows('corrections','id,target_id,status'), this.rows('offers','id,store_id,is_available,domain_status:app_data->>status')
    ]);
    const scoped = this.hydrate({ stores, organizations });
    const countBy = (rows: Row[], key: string, predicate: (row: Row) => boolean) => {
      const counts = new Map<string, number>();
      for (const row of rows) if (predicate(row)) counts.set(row[key], (counts.get(row[key]) || 0) + 1);
      return counts;
    };
    const reportCounts = countBy(reports,'target_id',r => r.status === 'OPEN');
    const correctionCounts = countBy(corrections,'target_id',r => r.status === 'OPEN');
    const offerCounts = countBy(offers,'store_id',r => r.is_available && (!r.domain_status || r.domain_status === 'ACTIVE'));
    return { stores: [...scoped.stores.values()].map((store: any) => {
      const org = scoped.organizations.get(store.organizationId) as any;
      const openReportsCount = reportCounts.get(store.id) || 0, openCorrectionsCount = correctionCounts.get(store.id) || 0;
      return { ...store, inn: store.inn || org?.inn || '300000000', region: store.region || org?.region || '', city: store.city || org?.city || '', district: store.district || org?.district || '', organizationName: org?.name || 'Noma‘lum tashkilot', openReportsCount, openCorrectionsCount, activeOffersCount: offerCounts.get(store.id) || 0, hasPendingModeration: ['PENDING','NEEDS_CHANGES'].includes(store.status) || openReportsCount > 0 || openCorrectionsCount > 0 };
    }) };
  }

  async overview() {
    const [stores, users, reports, corrections, credentials, inquiries, reviews, audit] = await Promise.all([
      this.rows('stores','id,status'), this.rows('users','id,role,status'), this.rows('reports','id,status,target_type,target_id'),
      this.rows('corrections','id,status,target_id,deadline:app_data->>deadline'), this.rows('credential_requests','id,status'),
      this.rows('inquiries','id,status'), this.rows('reviews','id,status'), this.audit(5)
    ]);
    const pending = (rows: Row[]) => rows.filter(row => row.status === 'PENDING').length;
    const pendingItemProposals = pending(reports.filter(r => r.target_type === 'ITEM_PROPOSAL'));
    const pendingPhotoProposals = pending(reports.filter(r => r.target_type === 'PHOTO_PROPOSAL'));
    const complaints = reports.filter(r => !['ITEM_PROPOSAL','PHOTO_PROPOSAL'].includes(r.target_type));
    const pendingCredentialRequests = pending(credentials);
    const pendingInquiries = inquiries.filter(i => ['MERCHANT_SUBMITTED','PENDING','PENDING_MERCHANT_REPLY'].includes(i.status)).length;
    const moderationIds = new Set([
      ...stores.filter(s => ['PENDING','NEEDS_CHANGES'].includes(s.status)).map(s => s.id),
      ...complaints.filter(r => r.status === 'OPEN').map(r => r.target_id),
      ...corrections.filter(c => c.status === 'OPEN').map(c => c.target_id)
    ]);
    return { pendingApps: pending(stores), applicationCount: stores.filter(s => ['PENDING','NEEDS_CHANGES'].includes(s.status)).length,
      openReports: complaints.filter(r => r.status === 'OPEN').length, totalReports: complaints.length,
      overdueCorrections: corrections.filter(c => c.status === 'OPEN' && new Date(c.deadline).getTime() < Date.now()).length,
      pendingCredentialRequests, pendingInquiries, pendingItemProposals, pendingPhotoProposals, totalPendingProposals: pendingItemProposals + pendingPhotoProposals,
      pendingRequests: pendingCredentialRequests + pendingInquiries + pendingItemProposals + pendingPhotoProposals,
      pendingReviews: reviews.filter(r => ['PENDING','HIDDEN'].includes(r.status)).length, totalReviews: reviews.length,
      totalStores: stores.length, activeStores: stores.filter(s => s.status === 'ACTIVE').length, moderationStores: stores.filter(s => moderationIds.has(s.id)).length,
      totalUsers: users.length, ownerCount: users.filter(u => u.role === 'OWNER').length, latestAudit: audit.auditLogs, auditTotal: audit.total };
  }
}

export function createAdminReadMiddleware(client: SupabaseClient) {
 return async (req: Request, res: Response, next: NextFunction) => {
  const endpoint = req.path.replace('/api/v1/admin/', '');
  const me = req.path === '/api/v1/auth/me';
  if (req.method !== 'GET' || (!me && (!req.path.startsWith('/api/v1/admin/') || !paths.has(endpoint)))) return next();
  try {
    const repository = new AdminReadRepository(client);
    const session = await repository.authenticate(req);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Request-Id', String(req.headers['x-request-id'] || crypto.randomUUID()));
    res.setHeader('X-Data-Access', 'targeted-read');
    if (me) {
      const scoped = repository.hydrate({ users: [session.row] });
      const { passwordHash, plainPassword, verificationCode, ...user } = scoped.users.get(session.row.id) as any;
      return void res.json({ user, token: session.token, expiresAt: session.expiresAt });
    }
    if (!['ADMIN','SUPERADMIN','MODERATOR'].includes(session.row.role)) throw fail(403, 'Ushbu amal uchun ruxsat yo‘q.');
    const result = endpoint === 'organizations'
      ? req.query.options === '1'
        ? { organizations: [...repository.hydrate({ organizations: await repository.rows('organizations','id,name,inn,type,status,region,city,district,created_at') }).organizations.values()] }
        : await repository.organizations(organizationListOptions(req.query))
      : await repository[endpoint as 'overview'|'users'|'stores'|'audit']();
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 503).json({ code: error.status === 401 ? 'UNAUTHORIZED' : error.status === 403 ? 'FORBIDDEN' : 'READ_FAILED', message: error.message || 'Ma’lumotlarni yuklab bo‘lmadi.' });
  }
 };
}

export function adminReadMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!isSupabaseConfigured()) return next();
  return createAdminReadMiddleware(supabase!)(req, res, next);
}
