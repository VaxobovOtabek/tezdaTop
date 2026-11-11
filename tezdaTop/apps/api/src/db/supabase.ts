import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import Decimal from 'decimal.js';
import type { InMemoryDatabase } from './in-memory-db.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

const isValidUrl = (u?: string) => !!u && u.startsWith('http') && !u.includes('your-project-ref');
export const supabase: SupabaseClient | null = isValidUrl(url) && key && key !== 'your_supabase_service_role_key'
  ? createClient(url!, key, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

export const isSupabaseConfigured = () => !!supabase;

/**
 * Localhost Guard:
 * Prevents local development changes from polluting production Supabase database.
 * Writes to Supabase are ONLY permitted in production (Vercel) or when ALLOW_LOCAL_SUPABASE_WRITE=true.
 */
export const isSupabaseWriteAllowed = () => isSupabaseConfigured() && (isProduction || process.env.ALLOW_LOCAL_SUPABASE_WRITE === 'true');

// ================= SUPABASE INTELLIGENT CACHE & QUOTA GUARD =================
// Standart kesh muddati: 24 soat (86,400,000 ms).
// Bu Supabase Free Tier limitlarini (egress va request limit) to'liq tejaydi.
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const envTtlMs = process.env.SUPABASE_CACHE_TTL_MS ? parseInt(process.env.SUPABASE_CACHE_TTL_MS, 10) : undefined;
const envTtlHours = process.env.SUPABASE_CACHE_TTL_HOURS ? parseFloat(process.env.SUPABASE_CACHE_TTL_HOURS) * 60 * 60 * 1000 : undefined;
export const CACHE_TTL_MS = envTtlMs || envTtlHours || DEFAULT_CACHE_TTL_MS;

const cacheMetaDir = process.env.VERCEL ? path.join(os.tmpdir(), 'yaqintop-data') : path.resolve(process.cwd(), 'data');
const cacheMetaPath = path.join(cacheMetaDir, 'supabase_sync_meta.json');

interface CacheMetadata {
  lastSyncTime: number;
  version: number;
  recordsCount?: number;
}

function readCacheMeta(): CacheMetadata | null {
  try {
    if (fs.existsSync(cacheMetaPath)) {
      const raw = fs.readFileSync(cacheMetaPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch {
    // Ignore error
  }
  return null;
}

function writeCacheMeta(meta: CacheMetadata) {
  try {
    if (!fs.existsSync(cacheMetaDir)) fs.mkdirSync(cacheMetaDir, { recursive: true });
    fs.writeFileSync(cacheMetaPath, JSON.stringify(meta, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Supabase Cache] Kesh metama‘lumotlarini yozishda xatolik:', err);
  }
}

let lastSyncTime = 0;
type Rows = Record<string, Record<string, any>[]>;
type Mapping = { table: string; fields: Record<string, string> };
const mappings: Record<string, Mapping> = {
  organizations: { table: 'organizations', fields: { name:'name', inn:'inn', type:'type', status:'status', region:'region', city:'city', district:'district', created_at:'createdAt' } },
  users: { table:'users', fields:{ email:'email', phone:'phone', full_name:'fullName', role:'role', status:'status', password_hash:'passwordHash', created_at:'createdAt', updated_at:'updatedAt' } },
  memberships: { table:'memberships', fields:{ user_id:'userId', organization_id:'organizationId', role:'role', status:'status' } },
  stores: { table:'stores', fields:{ organization_id:'organizationId', name:'name', address:'address', phone:'phone', telegram:'telegram', working_hours:'hours', photos:'photos', status:'status', region:'region', district:'district', rating:'rating', review_count:'reviewCount', created_at:'createdAt', updated_at:'updatedAt' } },
  variants: { table:'variants', fields:{ organization_id:'organizationId', name:'title', barcode:'barcode', sku:'sku', category:'category', unit:'packUnit', image_url:'photoUrl', description:'description', created_at:'createdAt' } },
  offers: { table:'offers', fields:{ store_id:'storeId', variant_id:'variantId', price:'price', original_price:'originalPrice', currency:'currency', stock_on_hand:'stockOnHand', stock_verified_at:'stockVerifiedAt', updated_at:'priceUpdatedAt' } },
  balances: { table:'inventory_balances', fields:{ quantity:'onHand', average_unit_cost:'averageUnitCost', version:'version', updated_at:'lastVerifiedAt' } },
  stockDocuments: { table:'stock_documents', fields:{ organization_id:'organizationId', store_id:'storeId', type:'docType', document_number:'documentNumber', lines:'lines', note:'notes', created_by:'createdBy', created_at:'createdAt' } },
  expenses: { table:'expenses', fields:{ organization_id:'organizationId', store_id:'storeId', amount:'amount', category:'category', note:'description', date:'date', created_at:'createdAt' } },
  reviews: { table:'reviews', fields:{ store_id:'storeId', user_id:'reviewerUserId', user_name:'reviewerName', rating:'rating', comment:'comment', status:'status', merchant_reply:'merchantReply', merchant_replied_at:'merchantRepliedAt', created_at:'createdAt' } },
  reports: { table:'reports', fields:{ target_id:'storeId', target_type:'targetType', user_id:'reporterUserId', reason:'reason', details:'details', status:'status', created_at:'createdAt' } },
  corrections: { table:'corrections', fields:{ target_id:'storeId', target_type:'targetType', user_id:'userId', status:'status', created_at:'createdAt' } },
  inquiries: { table:'inquiries', fields:{ name:'name', phone:'phone', message:'message', status:'status', created_at:'createdAt' } },
  credentialRequests: { table:'credential_requests', fields:{ organization_id:'organizationId', user_id:'userId', reason:'reason', status:'status', created_at:'createdAt' } },
  bookmarks: { table:'bookmarks', fields:{ user_id:'userId', created_at:'createdAt' } },
  notifications: { table:'notifications', fields:{ user_id:'userId', title:'title', message:'message', is_read:'isRead', type:'type', created_at:'createdAt' } },
  auditLogs: { table:'audit_logs', fields:{ user_id:'actorId', action:'action', entity:'entityType', entity_id:'entityId', details:'diff', created_at:'timestamp' } }
};
const extras = ['dealers','dealerStores','dealerProducts','supplyOrders','debtTransactions','saleSnapshots','idempotencyRecords','revocations','searchEvents'];
const clone = (v: any) => JSON.parse(JSON.stringify(v));
let version = 0;
let baseline: Rows = {};

/** Preserve domain fields in app_data; relational columns remain compatible with existing readers. */
export function projectDatabase(db: InMemoryDatabase): Rows {
  const state = clone(db.exportSnapshot());
  const result: Rows = {};
  for (const [collection, { table, fields }] of Object.entries(mappings)) {
    const entries = collection === 'auditLogs' ? state.auditLogs.map((v: any) => [v.id,v]) : state[collection];
    result[table] = entries.map(([id, value]: [string, any]) => {
      const v = { ...value }; delete v.plainPassword; if (collection === 'users') delete v.verificationCode;
      const row: any = { id, app_data: v };
      for (const [column, field] of Object.entries(fields)) if (v[field] !== undefined) row[column] = v[field];
      switch (collection) {
        case 'users': row.password_hash = v.passwordHash || null; break;
        case 'stores': Object.assign(row,{ latitude:v.location.lat, longitude:v.location.lng, is_active:v.status==='ACTIVE', photos:v.photos || (v.photoUrl ? [v.photoUrl] : []), rating:v.rating ?? 0, review_count:v.reviewCount ?? 0 }); break;
        case 'variants': {
          const off = [...db.offers.values()].find(o => o.variantId===id);
          row.organization_id = v.organizationId || (off && db.stores.get(off.storeId)?.organizationId);
          if (!row.organization_id) throw new Error(`Variant ${id} has no organization`);
          row.attributes = { brand:v.brand, packSize:v.packSize, aliases:v.aliases, kind:v.kind, durationMinutes:v.durationMinutes }; break;
        }
        case 'offers': Object.assign(row,{ price:String(v.price), original_price:v.originalPrice == null ? null : String(v.originalPrice), currency:v.currency || 'UZS', stock_count:String(v.stockOnHand), stock_on_hand:String(v.stockOnHand), in_stock:v.stockOnHand>0, is_available:!['INACTIVE','SUSPENDED','DELETED'].includes(v.status) }); break;
        case 'balances': {
          const off=db.offers.get(id); if (!off) throw new Error(`Balance ${id} has no offer`);
          Object.assign(row,{ store_id:off.storeId, variant_id:off.variantId, quantity:String(v.onHand), average_unit_cost:String(v.averageUnitCost) }); break;
        }
        case 'stockDocuments': row.document_number=v.documentNumber || v.docNumber || `DOC-${id}`; row.created_by=v.createdBy || null; break;
        case 'expenses': row.amount=String(v.amount); row.date=v.date?.split('T')[0]; break;
        case 'reviews': row.user_id=v.reviewerUserId || v.userId || null; row.user_name=v.reviewerName || v.userName || 'Foydalanuvchi'; row.status=v.status || 'PUBLISHED'; break;
        case 'reports': row.target_type=v.targetType || 'STORE'; row.user_id=v.reporterUserId || v.userId || null; break;
        case 'corrections': row.target_type=v.targetType || 'STORE'; row.user_id=v.userId || null; row.proposed_data=v.proposedData || { affectedFields:v.affectedFields,message:v.message }; break;
        case 'inquiries': row.name=v.name || v.storeName || v.organizationName || 'Murojaat'; row.phone=v.phone || ''; row.message=v.message || v.subject || ''; break;
        case 'credentialRequests': row.organization_id=v.organizationId || null; row.reason=v.reason || v.type || 'CREDENTIAL_CHANGE'; break;
        case 'bookmarks': row.target_id=v.offerId || v.storeId; row.target_type=v.offerId ? 'OFFER' : 'STORE'; break;
        case 'auditLogs': row.user_id=db.users.has(v.actorId) ? v.actorId : null; break;
      }
      return clone(row);
    });
  }
  for (const [collection,targetType] of [['itemProposals','ITEM_PROPOSAL'],['photoProposals','PHOTO_PROPOSAL']]) for (const [id,v] of state[collection]) result.reports.push({ id,target_id:v.storeId,target_type:targetType,user_id:v.userId || null,reason:v.title || 'Photo proposal',details:JSON.stringify(v),status:v.status,created_at:v.createdAt,app_data:v });
  result.application_records=extras.flatMap(collection => state[collection].map(([id,payload]: [string,any]) => ({ id:`${collection}:${id}`,collection,record_id:id,payload })));
  return result;
}

export function hydrateDatabase(db: InMemoryDatabase, rows: Rows) {
  const state: any=Object.fromEntries([...Object.keys(mappings),...extras,'itemProposals','photoProposals','sessions'].map(k=>[k,[]]));
  for (const [collection,{table,fields}] of Object.entries(mappings)) for (const r of rows[table] || []) {
    const v: any={ ...r.app_data,id:r.id };
    for (const [column,field] of Object.entries(fields)) if (r[column] !== undefined) v[field]=r[column];
    switch (collection) {
      case 'users': v.passwordHash=r.password_hash || ''; v.email=r.email || ''; delete v.plainPassword; delete v.verificationCode; break;
      case 'stores': v.location={lat:r.latitude,lng:r.longitude}; v.hours=Array.isArray(r.working_hours) ? r.working_hours : []; v.photoUrl=v.photoUrl || r.photos?.[0]; break;
      case 'variants': Object.assign(v,r.attributes || {}); break;
      case 'offers': v.price=String(r.price); v.stockOnHand=Number(r.stock_on_hand ?? r.stock_count ?? 0); v.status=r.is_available ? (v.status || 'ACTIVE') : 'INACTIVE'; v.version=v.version || 1; v.wholesaleTiers=v.wholesaleTiers || []; v.minOrderQuantity=v.minOrderQuantity || 1; break;
      case 'balances': v.offerId=r.id; v.onHand=String(r.quantity); v.averageUnitCost=String(r.average_unit_cost ?? 0); v.version=Number(r.version || 1); break;
      case 'stockDocuments': v.status=v.status || 'POSTED'; v.date=v.date || r.created_at; v.totalAmount=v.totalAmount ?? (r.lines || []).reduce((sum: Decimal,line: any)=>sum.plus(line.subtotal ?? new Decimal(line.quantity).times(line.unitPriceOrCost)),new Decimal(0)).toFixed(2); break;
      case 'corrections': Object.assign(v,r.proposed_data || {}); break;
      case 'bookmarks': v[r.target_type==='OFFER' ? 'offerId' : 'storeId']=r.target_id; break;
      case 'reports': if (['ITEM_PROPOSAL','PHOTO_PROPOSAL'].includes(r.target_type)) { const proposal=r.app_data || JSON.parse(r.details || '{}'); state[r.target_type==='ITEM_PROPOSAL' ? 'itemProposals' : 'photoProposals'].push([r.id,{...proposal,id:r.id,status:r.status}]); continue; } break;
    }
    if (collection==='auditLogs') state.auditLogs.push(v); else state[collection].push([r.id,v]);
  }
  for (const r of rows.application_records || []) if (extras.includes(r.collection)) state[r.collection].push([r.record_id,r.payload]);
  db.restoreSnapshot(state);
  for (const store of db.stores.values()) store.type=store.type || db.organizations.get(store.organizationId)?.type || 'RETAIL';
  for (const offer of db.offers.values()) { const variant=db.variants.get(offer.variantId); if (!variant) throw new Error(`Offer ${offer.id} has no variant`); offer.variant=variant; offer.freshness=db.computeFreshness(offer.stockVerifiedAt); }
}

export async function syncAllFromSupabase(db: InMemoryDatabase, force = false): Promise<boolean> {
  if (!supabase) return false;
  const now = Date.now();

  // 1. In-memory kesh tekshiruvi: TTL muddati tugamagan bo'lsa, tarmoq orqali so'rov yuborilmaydi
  if (!force && lastSyncTime > 0 && now - lastSyncTime < CACHE_TTL_MS) {
    return true;
  }

  // 2. Disk kesh tekshiruvi: agar diskda saqlangan kesh yangi bo'lsa, Supabase Free Tier limitini tejab, diskdan o'qiydi
  if (!force) {
    const meta = readCacheMeta();
    if (meta && meta.lastSyncTime > 0 && now - meta.lastSyncTime < CACHE_TTL_MS) {
      if (db.stores.size > 0 || db.loadFromFile()) {
        lastSyncTime = meta.lastSyncTime;
        version = meta.version || 0;
        baseline = projectDatabase(db);
        const minutesAgo = Math.round((now - meta.lastSyncTime) / 60000);
        console.log(`[Supabase Cache] ✅ Disk keshidan yuklandi (${minutesAgo} daqiqa oldin sinxronlangan). Supabase Free Tier limiti tejaldi.`);
        return true;
      }
    }
  }

  // 3. Kesh muddati o'tgan bo'lsa yoki force=true bo'lsa, Supabase'dan tortib oladi
  try {
    console.log('[Supabase Cache] Supabase bilan sinxronlanmoqda...');
    const { data, error } = await supabase.rpc('read_database_snapshot');
    if (error) throw error;
    if (!data?.tables) throw new Error('Supabase snapshot formati noto‘g‘ri yoki bo‘sh qaytdi');

    hydrateDatabase(db, data.tables);
    version = Number(data.version || 0);
    baseline = projectDatabase(db);
    lastSyncTime = now;

    // Lokal disk keshini yangilash
    db.saveToFile();
    writeCacheMeta({
      lastSyncTime: now,
      version,
      recordsCount: db.stores.size + db.offers.size
    });

    console.log(`[Supabase Cache] ✅ Supabase muvaffaqiyatli sinxronlandi va disk keshiga saqlandi (versiya: ${version}, do‘konlar: ${db.stores.size}, takliflar: ${db.offers.size}).`);
    return true;
  } catch (err: any) {
    // 4. Quota Guard / Graceful Fallback:
    // Supabase limiti to'lgan yoki xato bergan taqdirda server to'xtab qolmaydi, lokal disk keshidan ishlashda davom etadi!
    const isQuotaError = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('quota') || err?.message?.includes('limit');
    console.warn(`[Supabase Quota Guard] ⚠️ Supabase ulanishida xatolik (${isQuotaError ? 'LIMIT OSHIB KETGAN' : err.message}).`);
    console.warn(`[Supabase Quota Guard] 🛡️ Tizim avtomatik ravishda lokal disk keshidan ishlashda davom etmoqda.`);

    if (db.stores.size === 0) {
      db.loadFromFile();
    }

    lastSyncTime = now; // Qayta-qayta Supabasega murojaat qilib limitni battar yeb qo'ymaslik uchun
    return true;
  }
}

/** One PostgreSQL transaction; stale writers receive 409 instead of overwriting newer data. */
export async function syncAllToSupabase(db: InMemoryDatabase): Promise<boolean> {
  if (!supabase) return false;
  if (!isSupabaseWriteAllowed()) {
    return false;
  }

  try {
    // Mirror relational cascades before computing the transaction, so permanent
    // deletions cannot leave dangling in-memory rows or resurrect deleted parents.
    for (const [id, store] of db.stores) if (!db.organizations.has(store.organizationId)) db.stores.delete(id);
    for (const [id, offer] of db.offers) if (!db.stores.has(offer.storeId) || !db.variants.has(offer.variantId)) db.offers.delete(id);
    for (const [id] of db.balances) if (!db.offers.has(id)) db.balances.delete(id);
    for (const [id, member] of db.memberships) if (!db.users.has(member.userId) || !db.organizations.has(member.organizationId)) db.memberships.delete(id);
    for (const collection of [db.expenses, db.stockDocuments]) for (const [id, row] of collection as Map<string, any>) if (!db.organizations.has(row.organizationId) || (row.storeId && !db.stores.has(row.storeId))) collection.delete(id);
    for (const [id, row] of db.reviews) if (!db.stores.has(row.storeId)) db.reviews.delete(id);
    for (const [id, row] of db.variants) if ((row as any).organizationId && !db.organizations.has((row as any).organizationId)) {
      const offer = [...db.offers.values()].find(o => o.variantId === id);
      if (offer) (row as any).organizationId = db.stores.get(offer.storeId)!.organizationId;
      else db.variants.delete(id);
    }
    const current = projectDatabase(db);
    const changes: Rows = {};
    const deleted: Record<string, string[]> = {};
    for (const [table, rows] of Object.entries(current)) {
      const old = new Map((baseline[table] || []).map(r => [r.id, JSON.stringify(r)]));
      const ids = new Set(rows.map(r => r.id));
      changes[table] = rows.filter(r => old.get(r.id) !== JSON.stringify(r));
      deleted[table] = [...old.keys()].filter(id => !ids.has(id));
    }
    if (!Object.values(changes).some(r => r.length) && !Object.values(deleted).some(r => r.length)) return true;

    const { data, error } = await supabase.rpc('commit_database_snapshot', { expected_version: version, changes, deleted });
    if (error) {
      const conflict = error.code === '40001';
      if (!conflict) {
        console.warn(`[Supabase Quota Guard] ⚠️ Supabase saqlash xatosi: ${error.message}. Lokal diskka saqlanmoqda.`);
        db.saveToFile();
        return true;
      }
      throw Object.assign(new Error('Ma’lumot yangilandi. So‘rovni qayta yuboring.'), { status: 409, code: 'WRITE_CONFLICT' });
    }
    version = Number(data);
    baseline = current;
    lastSyncTime = Date.now();
    writeCacheMeta({ lastSyncTime, version, recordsCount: db.stores.size + db.offers.size });
    return true;
  } catch (err: any) {
    if (err?.status === 409) throw err;
    console.warn(`[Supabase Quota Guard] ⚠️ Supabase saqlashda limit yoki xatolik: ${err?.message}. O‘zgarishlar faqat lokal diskda saqlandi.`);
    db.saveToFile();
    return true;
  }
}

// Committed together with the HTTP operation by the persistence middleware.
export async function insertRegisteredCustomer(_user: unknown): Promise<void> {}
export async function persistItemProposalToSupabase(_proposal: unknown): Promise<void> {}
export async function persistPhotoProposalToSupabase(_proposal: unknown): Promise<void> {}
