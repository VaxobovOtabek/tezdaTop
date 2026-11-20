import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { db } from '../db/in-memory-db.js';
import { SEED_IDS } from '../db/seed-ids.js';
import { getCurrentUser, requireStaffRole } from '../middleware/auth.middleware.js';
import {
  organizationListOptions,
  paginateOrganizations
} from '../services/organization-list.service.js';
import { prepareAdminOrganizationExtras } from '../services/admin-organization.service.js';
import { revokeToken, revokeUserSessions } from '../services/session.service.js';
import { getSupabaseUsage } from '../services/supabase-usage.service.js';
import { supabase, isSupabaseConfigured, syncAllToSupabase } from '../db/supabase.js';
import { findStoreByParam } from './stores.routes.js';
import { getSearchLogs } from './search.routes.js';

export const adminOrgsRouter = Router();

// ================= SUPABASE USAGE MONITORING =================
adminOrgsRouter.get('/supabase-usage', async (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  if (!user || user.status === 'SUSPENDED') return res.status(401).json({ message: 'Tizimga kiring.' });
  if (!['ADMIN', 'SUPERADMIN'].includes(user.role)) return res.status(403).json({ message: 'Faqat administrator uchun.' });
  const period = req.query.period || 'day';
  if (period !== 'day' && period !== 'week' && period !== 'month') return res.status(400).json({ message: 'Davr noto‘g‘ri.' });
  res.setHeader('Cache-Control', 'no-store');
  try {
    return res.json(await getSupabaseUsage(period as 'day' | 'week' | 'month'));
  } catch {
    return res.status(503).json({ message: 'Supabase monitoringi vaqtincha mavjud emas. Lokal sozlamalarni tekshiring.' });
  }
});

// ================= ADMIN ORGANIZATIONS =================
adminOrgsRouter.get('/organizations', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  try {
    const options = organizationListOptions(req.query);
    const users = [...db.users.values()].map((user: any) => ({
      ...user,
      organizationId: [...db.memberships.values()].find(m => m.userId === user.id)?.organizationId || user.organizationId
    }));
    res.json(paginateOrganizations([...db.organizations.values()], [...db.stores.values()], users, options));
  } catch (error: any) {
    res.status(error.status || 400).json({ message: error.message });
  }
});

adminOrgsRouter.post('/organizations', requireStaffRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  const { name, inn, region, city, district, type = 'RETAIL', status = 'ACTIVE', storeName, address, phone, lat, lng, hours, photoUrl } = req.body;
  if (typeof type !== 'string' || !type.trim() || type.trim().length > 80) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Tashkilot turi 1–80 belgidan iborat bo‘lishi kerak' });
    return;
  }
  if (!name) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Tashkilot nomi kiritilishi shart' });
    return;
  }

  let extras: ReturnType<typeof prepareAdminOrganizationExtras>;
  try {
    extras = prepareAdminOrganizationExtras(db, req.body);
  } catch (error: any) {
    return void res.status(error.status || 400).json({ code: 'INVALID_INPUT', message: error.message });
  }

  // Validate an optional offer before creating any of the linked records.
  if (req.body.initialOffer) {
    const io = req.body.initialOffer;
    const price = Number(io.price);
    const stock = Number(io.stockOnHand ?? (io.type === 'SERVICE' ? 999 : 10));
    if (
      typeof io.title !== 'string' ||
      !io.title.trim() ||
      io.price === '' ||
      io.price == null ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      return void res.status(400).json({ code: 'INVALID_INPUT', message: 'Tovar yoki xizmat nomi, narxi va miqdorini tekshiring.' });
    }
  }

  const orgId = uuidv4();
  const newOrg: any = {
    id: orgId,
    name,
    inn: inn || '',
    region: region || 'Toshkent shahri',
    city: city || 'Yunusobod',
    district: district || '',
    type: type.trim(),
    status: status || 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  db.organizations.set(orgId, newOrg);

  const finalStoreName = (storeName || name).trim();
  const finalAddress = (address || [region || 'Toshkent shahri', city || 'Yunusobod', district].filter(Boolean).join(', ')).trim();

  const storeId = uuidv4();
  const newStore: any = {
    id: storeId,
    organizationId: orgId,
    name: finalStoreName,
    inn: inn || '',
    region: region || 'Toshkent shahri',
    city: city || 'Yunusobod',
    district: district || '',
    address: finalAddress || 'O‘zbekiston',
    phone: phone || '+998 90 123 45 67',
    location: {
      lat: parseFloat(lat || '41.311081'),
      lng: parseFloat(lng || '69.240562')
    },
    rating: 5.0,
    reviewCount: 0,
    isVerified: true,
    status: 'ACTIVE' as const,
    type: type.trim(),
    photoUrl: extras.photoUrl,
    hours: extras.hours || [
      { dayOfWeek: 1, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 2, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 3, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 4, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 5, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 6, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 0, openTime: '09:00', closeTime: '21:00', isClosed: false }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.stores.set(storeId, newStore);

  let createdOffer: any = null;
  if (
    req.body.initialOffer &&
    req.body.initialOffer.title &&
    req.body.initialOffer.price !== undefined &&
    req.body.initialOffer.price !== null &&
    req.body.initialOffer.price !== ''
  ) {
    const io = req.body.initialOffer;
    const isService = io.type === 'SERVICE' || io.type === 'Xizmat';
    const variantId = uuidv4();
    const offerId = uuidv4();
    const finalPhotoUrl = io.photoUrl || io.imageUrl || '';
    const variant: any = {
      id: variantId,
      productId: uuidv4(),
      organizationId: orgId,
      title: io.title.trim(),
      brand: io.brand?.trim() || (isService ? 'Xizmat' : 'Boshqa'),
      category: io.category?.trim() || (isService ? 'Xizmat' : 'Umumiy'),
      packSize: isService ? '1 ta' : '1 dona',
      packUnit: io.packUnit || (isService ? 'xizmat' : 'dona'),
      barcode: io.barcode?.trim() || (isService ? '' : `${Math.floor(10000000 + Math.random() * 90000000)}`),
      sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
      photoUrl: finalPhotoUrl,
      type: isService ? 'SERVICE' : 'PRODUCT',
      aliases: [io.title.toLowerCase()]
    };
    db.variants.set(variantId, variant);

    const initialStock = io.stockOnHand !== undefined ? parseInt(io.stockOnHand, 10) : (isService ? 999 : 10);
    const offer: any = {
      id: offerId,
      storeId,
      variantId,
      variant,
      price: new Decimal(io.price).toFixed(2),
      minOrderQuantity: 1,
      stockOnHand: initialStock,
      stockVerifiedAt: new Date().toISOString(),
      priceUpdatedAt: new Date().toISOString(),
      freshness: 'NEW',
      status: 'ACTIVE',
      wholesaleTiers: [],
      version: 1
    };
    db.offers.set(offerId, offer);
    db.balances.set(offerId, {
      offerId,
      onHand: new Decimal(initialStock),
      averageUnitCost: new Decimal(io.price).times(0.75),
      lastVerifiedAt: new Date(),
      version: 1
    });

    createdOffer = offer;
  }

  let createdOwner: any = undefined;
  if (extras.owner) {
    const userId = uuidv4();
    const membershipId = uuidv4();
    const now = new Date().toISOString();
    const owner = {
      ...extras.owner,
      id: userId,
      role: 'OWNER',
      status: 'ACTIVE',
      isVerified: true,
      organizationId: orgId,
      organizationName: newOrg.name,
      createdAt: now,
      updatedAt: now
    };
    db.users.set(userId, owner as any);
    db.memberships.set(membershipId, { id: membershipId, organizationId: orgId, userId, role: 'OWNER', status: 'ACTIVE' });
    const { passwordHash, ...safeOwner } = owner;
    createdOwner = safeOwner;
  }

  const caller = getCurrentUser(req);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: caller?.id || SEED_IDS.adminUserId,
    actorEmail: caller?.email || 'admin@yaqintop.uz',
    action: 'CREATE_ORGANIZATION',
    entityType: 'ORGANIZATION',
    entityId: orgId,
    diff: { name, inn, region, type, storeId: newStore?.id, ownerId: createdOwner?.id },
    timestamp: new Date().toISOString()
  });

  db.scheduleSave();

  res.status(201).json({ organization: newOrg, store: newStore, offer: createdOffer, owner: createdOwner });
});

adminOrgsRouter.patch('/organizations/:id', requireStaffRole(['ADMIN', 'SUPERADMIN']), (req, res) => {
  const org = db.organizations.get(req.params.id);
  if (!org) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Tashkilot topilmadi' });
    return;
  }

  const { name, inn, region, city, district, type, status } = req.body;
  if (name !== undefined) org.name = name;
  if (inn !== undefined) (org as any).inn = inn;
  if (region !== undefined) (org as any).region = region;
  if (city !== undefined) (org as any).city = city;
  if (district !== undefined) (org as any).district = district;
  if (type !== undefined) org.type = type;
  if (status !== undefined) {
    org.status = status;
    if (status === 'SUSPENDED' || status === 'DELETED') {
      for (const store of db.stores.values()) {
        if (store.organizationId === org.id) {
          store.status = status === 'DELETED' ? 'DELETED' : 'SUSPENDED';
          store.updatedAt = new Date().toISOString();
        }
      }
      const orgUserIds = new Set(
        Array.from(db.memberships.values())
          .filter(m => m.organizationId === org.id)
          .map(m => m.userId)
      );
      for (const user of db.users.values()) {
        if (user.organizationId === org.id) orgUserIds.add(user.id);
      }
      for (const [token, sess] of db.sessions.entries()) {
        if (orgUserIds.has(sess.userId)) {
          db.sessions.delete(token);
        }
      }
    } else if (status === 'ACTIVE') {
      delete (org as any).deletedAt;
      for (const store of db.stores.values()) {
        if (store.organizationId === org.id && (store.status === 'DELETED' || store.status === 'SUSPENDED')) {
          store.status = 'ACTIVE';
          delete (store as any).deletedAt;
          store.updatedAt = new Date().toISOString();
        }
      }
    }
  }

  const caller = getCurrentUser(req);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: caller?.id || SEED_IDS.adminUserId,
    actorEmail: caller?.email || 'admin@yaqintop.uz',
    action: 'UPDATE_ORGANIZATION',
    entityType: 'ORGANIZATION',
    entityId: org.id,
    diff: req.body,
    timestamp: new Date().toISOString()
  });

  db.scheduleSave();

  res.json({ organization: org });
});

adminOrgsRouter.delete('/organizations/:id', requireStaffRole(['SUPERADMIN']), (req, res) => {
  const org = db.organizations.get(req.params.id);
  if (!org) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Tashkilot topilmadi' });
    return;
  }

  const isPermanent = req.query.permanent === 'true';
  const caller = getCurrentUser(req);

  const orgUserIds = new Set(
    Array.from(db.memberships.values())
      .filter(m => m.organizationId === org.id)
      .map(m => m.userId)
  );
  for (const user of db.users.values()) {
    if (user.organizationId === org.id) orgUserIds.add(user.id);
  }
  for (const [token, sess] of db.sessions.entries()) {
    if (orgUserIds.has(sess.userId)) {
      revokeToken(token);
      db.sessions.delete(token);
    }
  }

  if (isPermanent) {
    db.organizations.delete(org.id);
    for (const [storeId, store] of db.stores.entries()) {
      if (store.organizationId === org.id) {
        db.stores.delete(storeId);
      }
    }
    for (const [membId, memb] of db.memberships.entries()) {
      if (memb.organizationId === org.id) {
        db.memberships.delete(membId);
      }
    }
    db.auditLogs.push({
      id: uuidv4(),
      actorId: caller?.id || SEED_IDS.adminUserId,
      actorEmail: caller?.email || 'admin@yaqintop.uz',
      action: 'PERMANENT_DELETE_ORGANIZATION',
      entityType: 'ORGANIZATION',
      entityId: org.id,
      timestamp: new Date().toISOString()
    });
  } else {
    (org as any).status = 'DELETED';
    (org as any).deletedAt = new Date().toISOString();

    for (const store of db.stores.values()) {
      if (store.organizationId === org.id) {
        store.status = 'DELETED';
        (store as any).deletedAt = new Date().toISOString();
        store.updatedAt = new Date().toISOString();
      }
    }

    db.auditLogs.push({
      id: uuidv4(),
      actorId: caller?.id || SEED_IDS.adminUserId,
      actorEmail: caller?.email || 'admin@yaqintop.uz',
      action: 'DELETE_ORGANIZATION',
      entityType: 'ORGANIZATION',
      entityId: org.id,
      timestamp: new Date().toISOString()
    });
  }

  db.scheduleSave();
  res.json({
    success: true,
    message: isPermanent ? 'Tashkilot butunlay o‘chirildi' : 'Tashkilot muvaffaqiyatli o‘chirildi',
    organization: org
  });
});

// ================= ADMIN STORES =================
adminOrgsRouter.get('/stores', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  const region = String(req.query.region || '').trim();
  const city = String(req.query.city || '').trim();

  let storeList = Array.from(db.stores.values());

  if (region && region !== 'Barcha viloyatlar') {
    const rLower = region.toLowerCase();
    storeList = storeList.filter(s => {
      const org = db.organizations.get(s.organizationId);
      const sReg = String((s as any).region || (org as any)?.region || '').toLowerCase();
      if (rLower === 'toshkent shahri') {
        return sReg === 'toshkent shahri' || !sReg || sReg.includes('toshkent') || (s.address || '').toLowerCase().includes('toshkent');
      }
      return (
        sReg === rLower ||
        sReg.includes(rLower.replace(/\s+(viloyati|respublikasi)$/i, '')) ||
        (s.address || '').toLowerCase().includes(rLower.replace(/\s+(viloyati|respublikasi)$/i, ''))
      );
    });
  }

  if (city && city !== 'Barcha tumanlar') {
    const cleanTarget = city
      .toLowerCase()
      .replace(/[‘’ʻʼ'`]/g, '')
      .replace(/\s*(tumani|tuman|shahri|shahar|viloyati|viloyat|respublikasi|\(.*?\))\s*/gi, '')
      .replace(/[/\\(),-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleanTarget) {
      storeList = storeList.filter(s => {
        const org = db.organizations.get(s.organizationId);
        const cleanText = (v = '') =>
          String(v)
            .toLowerCase()
            .replace(/[‘’ʻʼ'`]/g, '')
            .replace(/\s*(tumani|tuman|shahri|shahar|viloyati|viloyat|respublikasi|\(.*?\))\s*/gi, '')
            .replace(/[/\\(),-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const sCity = cleanText((s as any).city || (org as any)?.city || '');
        const sDist = cleanText((s as any).district || (org as any)?.district || '');
        const sAddr = cleanText(s.address || '');
        const sName = cleanText((s as any).name || (org as any)?.name || '');
        const matchesCity = Boolean(sCity && (sCity === cleanTarget || sCity.includes(cleanTarget) || cleanTarget.includes(sCity)));
        const matchesDist = Boolean(sDist && (sDist === cleanTarget || sDist.includes(cleanTarget) || cleanTarget.includes(sDist)));

        if (matchesCity || matchesDist) return true;
        if (!sCity && !sDist) {
          return sAddr.includes(cleanTarget) || sName.includes(cleanTarget);
        }
        return false;
      });
    }
  }

  const requestedStoreIds = new Set(storeList.map(store => store.id));
  const countByStore = (rows: Iterable<{ storeId: string; status: string }>, status: string) => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      if (row.status === status && requestedStoreIds.has(row.storeId)) {
        counts.set(row.storeId, (counts.get(row.storeId) ?? 0) + 1);
      }
    }
    return counts;
  };
  const reports = countByStore(db.reports.values(), 'OPEN');
  const corrections = countByStore(db.corrections.values(), 'OPEN');
  const offers = req.query.forMap === 'true' ? undefined : countByStore(db.offers.values(), 'ACTIVE');
  const stores = storeList.map(s => {
    const org = db.organizations.get(s.organizationId);
    const openReportsCount = reports.get(s.id) ?? 0;
    const openCorrectionsCount = corrections.get(s.id) ?? 0;
    const activeOffersCount = offers ? offers.get(s.id) ?? 0 : undefined;
    const hasPendingModeration = s.status === 'PENDING' || s.status === 'NEEDS_CHANGES' || openReportsCount > 0 || openCorrectionsCount > 0;

    return {
      ...s,
      inn: (s as any).inn || (org as any)?.inn || '300000000',
      region: (s as any).region || (org as any)?.region || '',
      city: (s as any).city || (org as any)?.city || '',
      district: (s as any).district || (org as any)?.district || '',
      organizationName: org?.name || 'Noma‘lum tashkilot',
      openReportsCount,
      openCorrectionsCount,
      activeOffersCount,
      hasPendingModeration
    };
  });
  res.json({ stores });
});

adminOrgsRouter.post('/stores', requireStaffRole(['ADMIN', 'SUPERADMIN']), (req, res) => {
  const { organizationId, name, inn, region, city, district, address, phone, lat, lng, hours, photoUrl, status = 'ACTIVE', isVerified = true, type = 'RETAIL' } = req.body;
  if (!name || !address) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Do‘kon nomi va manzili kiritilishi shart' });
    return;
  }

  let orgId = organizationId;
  if (!orgId || !db.organizations.has(orgId)) {
    const firstOrg = Array.from(db.organizations.values())[0];
    orgId = firstOrg ? firstOrg.id : uuidv4();
    if (!firstOrg) {
      db.organizations.set(orgId, {
        id: orgId,
        name: name + ' MChJ',
        inn: inn || '',
        region: region || 'Toshkent shahri',
        city: city || 'Yunusobod',
        district: district || '',
        type: 'RETAIL',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      });
    }
  }

  const storeId = uuidv4();
  const store: any = {
    id: storeId,
    organizationId: orgId,
    name,
    inn: inn || (db.organizations.get(orgId) as any)?.inn || '',
    region: region || (db.organizations.get(orgId) as any)?.region || 'Toshkent shahri',
    city: city || (db.organizations.get(orgId) as any)?.city || 'Yunusobod',
    district: district || (db.organizations.get(orgId) as any)?.district || '',
    address,
    phone: phone || '+998 90 000 00 00',
    location: {
      lat: parseFloat(lat || '41.311081'),
      lng: parseFloat(lng || '69.240562')
    },
    rating: 5.0,
    reviewCount: 0,
    isVerified: isVerified !== false,
    status: status || 'ACTIVE',
    type: type || 'RETAIL',
    photoUrl: photoUrl || '',
    hours: hours || [
      { dayOfWeek: 1, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 2, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 3, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 4, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 5, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 6, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 0, openTime: '09:00', closeTime: '21:00', isClosed: false }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.stores.set(storeId, store);

  const caller = getCurrentUser(req);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: caller?.id || SEED_IDS.adminUserId,
    actorEmail: caller?.email || 'admin@yaqintop.uz',
    action: 'CREATE_STORE',
    entityType: 'STORE',
    entityId: storeId,
    diff: { name, address, location: store.location },
    timestamp: new Date().toISOString()
  });

  db.scheduleSave();

  res.status(201).json({ store });
});

adminOrgsRouter.patch('/stores/:id', async (req, res) => {
  const store = db.stores.get(req.params.id) || findStoreByParam(req.params.id);
  if (!store) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }

  const user = getCurrentUser(req);
  if (!user || user.status === 'SUSPENDED') {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }
  if (!['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role)) {
    const isOwner = (store as any).ownerId === user.id;
    if (!isOwner) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Tashkilotni tahrirlash huquqingiz yo‘q' });
      return;
    }
  }

  const { name, inn, region, city, district, address, phone, location, hours, photoUrl, photos, description, status, isVerified, type } = req.body;
  if (name !== undefined) store.name = name;
  if (inn !== undefined) (store as any).inn = inn;
  if (region !== undefined) (store as any).region = region;
  if (city !== undefined) (store as any).city = city;
  if (district !== undefined) (store as any).district = district;
  if (address !== undefined) store.address = address;
  if (phone !== undefined) store.phone = phone;
  if (description !== undefined) (store as any).description = description;
  if (location !== undefined && location.lat !== undefined && location.lng !== undefined) {
    store.location = {
      lat: parseFloat(location.lat),
      lng: parseFloat(location.lng)
    };
  }
  if (hours !== undefined) store.hours = hours;
  if (photoUrl !== undefined) {
    store.photoUrl = photoUrl;
    if (photoUrl) {
      const existingPhotos = (store as any).photos || [];
      if (!existingPhotos.includes(photoUrl)) {
        (store as any).photos = [photoUrl, ...existingPhotos.filter((p: string) => p !== photoUrl)];
      }
    }
  }
  if (photos !== undefined && Array.isArray(photos)) {
    (store as any).photos = photos;
    if (photos.length > 0 && !photoUrl) {
      store.photoUrl = photos[0];
    }
  }
  const isStaff = ['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role);
  if (status !== undefined && isStaff) store.status = status;
  if (isVerified !== undefined && isStaff) store.isVerified = isVerified;
  if (type !== undefined) store.type = type;
  store.updatedAt = new Date().toISOString();

  if (isSupabaseConfigured() && supabase) {
    try {
      // Store update in Supabase if configured
    } catch (e) {
      console.error('[Supabase Store Update Error]', e);
    }
  }

  db.saveToFile();
  db.scheduleSave();

  db.auditLogs.push({
    id: uuidv4(),
    actorId: user?.id || SEED_IDS.adminUserId,
    actorEmail: user?.email || 'admin@yaqintop.uz',
    action: 'UPDATE_STORE',
    entityType: 'STORE',
    entityId: store.id,
    diff: req.body,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, store });
});

// ================= CATEGORIES MANAGEMENT =================
const deletedCategoryPresets = new Set<string>();

adminOrgsRouter.get('/categories', (req, res) => {
  const statsMap = new Map<string, { name: string; productCount: number; serviceCount: number; totalCount: number; stores: Set<string> }>();

  for (const offer of db.offers.values()) {
    const variant = offer.variant || (offer.variantId ? db.variants.get(offer.variantId) : null);
    const cat = variant?.category?.trim() || 'Umumiy';
    if (!statsMap.has(cat)) {
      statsMap.set(cat, { name: cat, productCount: 0, serviceCount: 0, totalCount: 0, stores: new Set() });
    }
    const stat = statsMap.get(cat)!;
    stat.totalCount++;
    if ((variant as any)?.type === 'SERVICE') {
      stat.serviceCount++;
    } else {
      stat.productCount++;
    }
    if (offer.storeId) {
      const store = db.stores.get(offer.storeId);
      if (store?.organizationId === '07916afb-54bf-5551-b8dd-6e88d56c3fae' || offer.storeId === 'korzinka-main') {
        for (const s of db.stores.values()) {
          if (s.organizationId === '07916afb-54bf-5551-b8dd-6e88d56c3fae') {
            stat.stores.add(s.id);
          }
        }
      } else {
        stat.stores.add(offer.storeId);
      }
    }
  }

  for (const variant of db.variants.values()) {
    const cat = variant.category?.trim();
    if (cat && !statsMap.has(cat)) {
      statsMap.set(cat, {
        name: cat,
        productCount: (variant as any).type === 'SERVICE' ? 0 : 1,
        serviceCount: (variant as any).type === 'SERVICE' ? 1 : 0,
        totalCount: 1,
        stores: new Set()
      });
    }
  }

  const defaultPresets = [
    'Fastfud',
    'Oziq-ovqat',
    'Ichimliklar',
    'Shirinliklar',
    'Non mahsulotlari',
    'Sut mahsulotlari',
    'Go‘sht mahsulotlari',
    'Meva va sabzavotlar',
    'Maishiy kimyo',
    'Xo‘jalik mollari',
    'Kiyim-kechak',
    'Elektronika',
    'Avtomobil mollari',
    'Dori-darmon',
    'Kanselyariya',
    'Xizmat'
  ];
  for (const p of defaultPresets) {
    if (deletedCategoryPresets.has(p.toLowerCase())) continue;
    if (!statsMap.has(p)) {
      statsMap.set(p, { name: p, productCount: 0, serviceCount: 0, totalCount: 0, stores: new Set() });
    }
  }

  const items = Array.from(statsMap.values())
    .map(s => ({
      name: s.name,
      productCount: s.productCount,
      serviceCount: s.serviceCount,
      totalCount: s.totalCount,
      storesCount: s.stores.size
    }))
    .sort((a, b) => {
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
      return a.name.localeCompare(b.name, 'uz');
    });

  const categories = items.map(i => i.name);
  res.json({ categories, items, names: categories, categoryStats: items });
});

adminOrgsRouter.patch('/categories/rename', requireStaffRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  const oldName = req.body?.oldName || req.query?.oldName;
  const newName = req.body?.newName || req.query?.newName;
  if (!oldName || !newName || typeof oldName !== 'string' || typeof newName !== 'string' || !oldName.trim() || !newName.trim()) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Eski va yangi nom kiritilishi shart' });
    return;
  }
  const oldTrimmed = oldName.trim();
  const newTrimmed = newName.trim();

  deletedCategoryPresets.add(oldTrimmed.toLowerCase());
  deletedCategoryPresets.delete(newTrimmed.toLowerCase());

  const variantIdsToRename = new Set<string>();
  for (const variant of db.variants.values()) {
    if (variant.category && variant.category.trim().toLowerCase() === oldTrimmed.toLowerCase()) {
      variant.category = newTrimmed;
      db.variants.set(variant.id, variant);
      variantIdsToRename.add(variant.id);
    }
  }

  let updatedCount = 0;
  for (const offer of db.offers.values()) {
    const matchVariant = offer.variantId && variantIdsToRename.has(offer.variantId);
    const matchCat = offer.variant?.category && offer.variant.category.trim().toLowerCase() === oldTrimmed.toLowerCase();
    if (matchVariant || matchCat) {
      if (offer.variant) {
        offer.variant.category = newTrimmed;
      }
      if (offer.variantId && db.variants.has(offer.variantId)) {
        const v = db.variants.get(offer.variantId)!;
        v.category = newTrimmed;
        db.variants.set(v.id, v);
      }
      offer.priceUpdatedAt = new Date().toISOString();
      db.offers.set(offer.id, offer);
      updatedCount++;
    }
  }

  if (isSupabaseConfigured()) {
    try {
      await syncAllToSupabase(db);
    } catch (e) {
      console.error('[Supabase sync error on rename]', e);
    }
  }

  db.saveToFile();
  db.scheduleSave();

  res.json({
    success: true,
    oldName: oldTrimmed,
    newName: newTrimmed,
    updatedCount,
    message: `"${oldTrimmed}" kategoriyasi muvaffaqiyatli "${newTrimmed}" ga o‘zgartirildi (${updatedCount} ta tovar/xizmat yangilandi)`
  });
});

adminOrgsRouter.post('/categories/merge', requireStaffRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  const sourceCategory = req.body?.sourceCategory || req.query?.sourceCategory;
  const targetCategory = req.body?.targetCategory || req.query?.targetCategory;
  if (!sourceCategory || !targetCategory || typeof sourceCategory !== 'string' || typeof targetCategory !== 'string' || !sourceCategory.trim() || !targetCategory.trim()) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Birlashtiriluvchi va asosiy kategoriya kiritilishi shart' });
    return;
  }
  const src = sourceCategory.trim();
  const tgt = targetCategory.trim();

  if (src.toLowerCase() === tgt.toLowerCase()) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Bir xil nomli kategoriyalarni birlashtirib bo‘lmaydi' });
    return;
  }

  deletedCategoryPresets.add(src.toLowerCase());
  deletedCategoryPresets.delete(tgt.toLowerCase());

  const affectedVariantIds = new Set<string>();
  for (const variant of db.variants.values()) {
    if (variant.category && variant.category.trim().toLowerCase() === src.toLowerCase()) {
      variant.category = tgt;
      db.variants.set(variant.id, variant);
      affectedVariantIds.add(variant.id);
    }
  }

  let mergedCount = 0;
  for (const offer of db.offers.values()) {
    const isVariantMatch = offer.variantId && affectedVariantIds.has(offer.variantId);
    const isOfferCategoryMatch = offer.variant?.category && offer.variant.category.trim().toLowerCase() === src.toLowerCase();
    if (isVariantMatch || isOfferCategoryMatch) {
      if (offer.variant) {
        offer.variant.category = tgt;
      }
      if (offer.variantId && db.variants.has(offer.variantId)) {
        const v = db.variants.get(offer.variantId)!;
        v.category = tgt;
        db.variants.set(v.id, v);
      }
      offer.priceUpdatedAt = new Date().toISOString();
      db.offers.set(offer.id, offer);
      mergedCount++;
    }
  }

  if (isSupabaseConfigured()) {
    try {
      await syncAllToSupabase(db);
    } catch (e) {
      console.error('[Supabase sync error on merge]', e);
    }
  }

  db.saveToFile();
  db.scheduleSave();

  res.json({
    success: true,
    sourceCategory: src,
    targetCategory: tgt,
    mergedCount,
    message: `"${src}" kategoriyasidagi barcha tovarlar (${mergedCount} ta) "${tgt}" ga birlashtirildi`
  });
});

const handleCategoryDelete = async (req: Request, res: Response) => {
  const categoryName = req.body?.categoryName || req.query?.categoryName || req.query?.name;
  const deleteItems = req.body?.deleteItems !== undefined ? Boolean(req.body.deleteItems) : req.query?.deleteItems === 'true';
  const targetCategory = req.body?.targetCategory || req.query?.targetCategory || 'Umumiy';

  if (!categoryName || typeof categoryName !== 'string' || !categoryName.trim()) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Kategoriya nomi kiritilishi shart' });
    return;
  }
  const catTrimmed = categoryName.trim();
  const tgtTrimmed = (typeof targetCategory === 'string' && targetCategory.trim()) ? targetCategory.trim() : 'Umumiy';

  deletedCategoryPresets.add(catTrimmed.toLowerCase());
  if (!deleteItems) {
    deletedCategoryPresets.delete(tgtTrimmed.toLowerCase());
  }

  let affectedCount = 0;

  if (deleteItems) {
    const variantIdsToDelete = new Set<string>();
    for (const variant of db.variants.values()) {
      if (variant.category && variant.category.trim().toLowerCase() === catTrimmed.toLowerCase()) {
        variantIdsToDelete.add(variant.id);
        db.variants.delete(variant.id);
      }
    }
    for (const offer of db.offers.values()) {
      const matchVariant = offer.variantId && variantIdsToDelete.has(offer.variantId);
      const matchCat = offer.variant?.category && offer.variant.category.trim().toLowerCase() === catTrimmed.toLowerCase();
      if (matchVariant || matchCat) {
        db.offers.delete(offer.id);
        affectedCount++;
      }
    }
  } else {
    const variantIdsToReassign = new Set<string>();
    for (const variant of db.variants.values()) {
      if (variant.category && variant.category.trim().toLowerCase() === catTrimmed.toLowerCase()) {
        variant.category = tgtTrimmed;
        db.variants.set(variant.id, variant);
        variantIdsToReassign.add(variant.id);
      }
    }
    for (const offer of db.offers.values()) {
      const matchVariant = offer.variantId && variantIdsToReassign.has(offer.variantId);
      const matchCat = offer.variant?.category && offer.variant.category.trim().toLowerCase() === catTrimmed.toLowerCase();
      if (matchVariant || matchCat) {
        if (offer.variant) {
          offer.variant.category = tgtTrimmed;
        }
        if (offer.variantId && db.variants.has(offer.variantId)) {
          const v = db.variants.get(offer.variantId)!;
          v.category = tgtTrimmed;
          db.variants.set(v.id, v);
        }
        offer.priceUpdatedAt = new Date().toISOString();
        db.offers.set(offer.id, offer);
        affectedCount++;
      }
    }
  }

  if (isSupabaseConfigured()) {
    try {
      await syncAllToSupabase(db);
    } catch (e) {
      console.error('[Supabase sync error on category delete]', e);
    }
  }

  db.saveToFile();
  db.scheduleSave();

  res.json({
    success: true,
    deletedCategory: catTrimmed,
    affectedCount,
    message: deleteItems
      ? `"${catTrimmed}" kategoriyasi va unga tegishli ${affectedCount} ta tovar/xizmat muvaffaqiyatli o‘chirildi`
      : `"${catTrimmed}" kategoriyasi o‘chirildi va unga tegishli ${affectedCount} ta tovar/xizmat "${tgtTrimmed}" ga ko‘chirildi`
  });
};

adminOrgsRouter.delete('/categories', requireStaffRole(['ADMIN', 'SUPERADMIN']), handleCategoryDelete);
adminOrgsRouter.post('/categories/delete', requireStaffRole(['ADMIN', 'SUPERADMIN']), handleCategoryDelete);

adminOrgsRouter.get('/categories/products', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  const { category, search, storeId } = req.query;
  const catFilter = category ? String(category).trim().toLowerCase() : null;
  const q = search ? String(search).trim().toLowerCase() : null;
  const targetStoreId = storeId ? String(storeId).trim() : null;

  const KORZINKA_ORG_ID = '07916afb-54bf-5551-b8dd-6e88d56c3fae';
  const KORZINKA_MAIN_STORE_ID = 'korzinka-main';

  const results: any[] = [];
  for (const offer of db.offers.values()) {
    const isOfferKorzinka = offer.storeId === KORZINKA_MAIN_STORE_ID || db.stores.get(offer.storeId)?.organizationId === KORZINKA_ORG_ID;

    if (targetStoreId) {
      const isTargetKorzinka = targetStoreId === KORZINKA_MAIN_STORE_ID || db.stores.get(targetStoreId)?.organizationId === KORZINKA_ORG_ID;
      if (isTargetKorzinka) {
        if (!isOfferKorzinka) continue;
      } else if (offer.storeId !== targetStoreId) {
        continue;
      }
    }

    const store = db.stores.get(offer.storeId);
    const org = store ? db.organizations.get(store.organizationId) : null;
    const variant = offer.variant || (offer.variantId ? db.variants.get(offer.variantId) : null);

    const offerCat = (variant?.category || 'Umumiy').trim().toLowerCase();
    if (catFilter && offerCat !== catFilter) continue;

    if (q) {
      const title = (variant?.title || '').toLowerCase();
      const brand = (variant?.brand || '').toLowerCase();
      const barcode = (variant?.barcode || '').toLowerCase();
      const storeName = (store?.name || '').toLowerCase();
      if (!title.includes(q) && !brand.includes(q) && !barcode.includes(q) && !storeName.includes(q)) {
        continue;
      }
    }

    results.push({
      ...offer,
      storeName: isOfferKorzinka ? 'Korzinka (Asosiy)' : (store?.name || 'Do‘kon'),
      storeAddress: store?.address || '',
      organizationName: org?.name || (isOfferKorzinka ? 'Korzinka' : ''),
      variant: variant || offer.variant
    });
  }

  results.sort((a, b) => new Date(b.priceUpdatedAt || b.stockVerifiedAt || 0).getTime() - new Date(a.priceUpdatedAt || a.stockVerifiedAt || 0).getTime());

  res.json({ total: results.length, items: results });
});

// ================= ADMIN OFFERS =================
adminOrgsRouter.patch('/offers/:id', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), async (req, res) => {
  const offer = db.offers.get(req.params.id);
  if (!offer) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Tovar yoki xizmat topilmadi' });
    return;
  }
  const { title, price, category, packUnit, stockOnHand, photoUrl, imageUrl, barcode, brand, description, type, status } = req.body;

  const now = new Date().toISOString();

  if (price !== undefined && price !== null && price !== '') {
    offer.price = new Decimal(price).toFixed(2);
    offer.priceUpdatedAt = now;
  }

  if (stockOnHand !== undefined && stockOnHand !== null) {
    const qty = parseInt(stockOnHand, 10);
    offer.stockOnHand = isNaN(qty) ? 0 : qty;
    offer.stockVerifiedAt = now;
    const balance = db.balances.get(offer.id);
    if (balance) {
      balance.onHand = new Decimal(offer.stockOnHand);
      balance.lastVerifiedAt = new Date();
      balance.version++;
    }
  }

  if (status !== undefined) {
    offer.status = status;
  }

  offer.version = (offer.version || 1) + 1;

  let variant = offer.variantId ? db.variants.get(offer.variantId) : null;
  if (!variant && offer.variant) {
    variant = offer.variant;
  }

  if (variant) {
    if (title !== undefined && title.trim()) variant.title = title.trim();
    if (category !== undefined && category.trim()) variant.category = category.trim();
    if (packUnit !== undefined && packUnit.trim()) variant.packUnit = packUnit.trim();
    if (barcode !== undefined) variant.barcode = barcode.trim();
    if (brand !== undefined) variant.brand = brand.trim();
    if (description !== undefined) variant.description = description.trim();
    if (photoUrl !== undefined || imageUrl !== undefined) {
      variant.photoUrl = photoUrl !== undefined ? photoUrl : imageUrl;
    }
    if (type !== undefined) {
      (variant as any).type = (type === 'SERVICE' || type === 'Xizmat') ? 'SERVICE' : 'PRODUCT';
    }
    if (title) {
      variant.aliases = Array.from(new Set([...(variant.aliases || []), title.trim().toLowerCase()]));
    }
    db.variants.set(variant.id, variant);
    offer.variant = variant;
  }

  db.offers.set(offer.id, offer);

  if (isSupabaseConfigured()) {
    try {
      await syncAllToSupabase(db);
    } catch (e) {
      console.error('[Supabase sync error on offer patch]', e);
    }
  }

  db.saveToFile();
  db.scheduleSave();

  res.json({ success: true, offer, variant: offer.variant, message: 'Tovar/xizmat muvaffaqiyatli yangilandi' });
});

adminOrgsRouter.post('/stores/:id/offers', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), async (req, res) => {
  const matchedStore = findStoreByParam(req.params.id) || db.stores.get(req.params.id);
  if (!matchedStore) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }
  const { title, price, type = 'PRODUCT', category, brand, barcode, packUnit, stockOnHand, imageUrl, photoUrl, description } = req.body;
  if (!title || price === undefined || price === null || price === '') {
    res.status(400).json({ code: 'INVALID_DATA', message: 'Mahsulot yoki xizmat nomi va narxi majburiy' });
    return;
  }

  const isService = type === 'SERVICE' || type === 'Xizmat';
  const finalPhotoUrl = photoUrl || imageUrl || '';
  const finalCategory = category?.trim() || (isService ? 'Xizmat' : 'Umumiy');
  const finalPackUnit = packUnit || (isService ? 'xizmat' : 'dona');
  const initialStock = stockOnHand !== undefined ? parseInt(stockOnHand, 10) : (isService ? 999 : 10);
  const finalPrice = new Decimal(price).toFixed(2);

  const variantId = uuidv4();
  const offerId = uuidv4();

  const variant: any = {
    id: variantId,
    productId: uuidv4(),
    organizationId: matchedStore.organizationId,
    title: title.trim(),
    brand: brand?.trim() || (isService ? 'Xizmat' : 'Boshqa'),
    category: finalCategory,
    packSize: isService ? '1 ta' : '1 dona',
    packUnit: finalPackUnit,
    barcode: barcode?.trim() || (isService ? '' : `${Math.floor(10000000 + Math.random() * 90000000)}`),
    sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
    photoUrl: finalPhotoUrl,
    description: description?.trim() || '',
    type: isService ? 'SERVICE' : 'PRODUCT',
    aliases: [title.toLowerCase()]
  };
  db.variants.set(variantId, variant);

  const offer: any = {
    id: offerId,
    storeId: matchedStore.id,
    variantId,
    variant,
    price: finalPrice,
    minOrderQuantity: 1,
    stockOnHand: initialStock,
    stockVerifiedAt: new Date().toISOString(),
    priceUpdatedAt: new Date().toISOString(),
    freshness: 'NEW',
    status: 'ACTIVE',
    wholesaleTiers: [],
    version: 1
  };
  db.offers.set(offerId, offer);
  db.balances.set(offerId, {
    offerId,
    onHand: new Decimal(initialStock),
    averageUnitCost: new Decimal(price).times(0.75),
    lastVerifiedAt: new Date(),
    version: 1
  });

  db.saveToFile();
  db.scheduleSave();

  res.status(201).json({ success: true, offer });
});

adminOrgsRouter.delete('/offers/:id', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), async (req, res) => {
  const offer = db.offers.get(req.params.id);
  if (!offer) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Tovar yoki xizmat topilmadi' });
    return;
  }
  db.offers.delete(offer.id);
  if (offer.variantId) {
    db.variants.delete(offer.variantId);
  }

  if (isSupabaseConfigured()) {
    try {
      await syncAllToSupabase(db);
    } catch (e) {
      console.error('[Supabase sync error on offer delete]', e);
    }
  }

  db.saveToFile();
  db.scheduleSave();
  res.json({ success: true, message: 'Tovar yoki xizmat muvaffaqiyatli o‘chirildi' });
});

// ================= STORE ISSUES MANAGEMENT =================
adminOrgsRouter.post('/stores/:id/resolve-issues', requireStaffRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  const store = db.stores.get(req.params.id);
  if (!store) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }

  let resolvedReportsCount = 0;
  for (const [, rep] of db.reports.entries()) {
    if (rep.storeId === store.id && rep.status === 'OPEN') {
      rep.status = 'RESOLVED';
      (rep as any).resolutionNotes = 'Admin tomonidan moderatsiya xaritasidan bartaraf etildi va o‘chirildi';
      (rep as any).resolvedAt = new Date().toISOString();
      resolvedReportsCount++;
    }
  }

  for (const [, corr] of db.corrections.entries()) {
    if (corr.storeId === store.id && corr.status === 'OPEN') {
      corr.status = 'RESOLVED' as any;
    }
  }

  const prevStatus = store.status;
  if (store.status === 'PENDING' || store.status === 'NEEDS_CHANGES') {
    store.status = 'ACTIVE';
    store.isVerified = true;
    store.updatedAt = new Date().toISOString();
  }

  const caller = getCurrentUser(req);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: caller?.id || SEED_IDS.adminUserId,
    actorEmail: caller?.email || 'admin@yaqintop.uz',
    action: 'RESOLVE_STORE_ISSUES',
    entityType: 'STORE',
    entityId: store.id,
    diff: { resolvedReportsCount, prevStatus, newStatus: store.status },
    timestamp: new Date().toISOString()
  });

  db.scheduleSave();

  res.json({
    success: true,
    message: 'Do‘kondagi barcha muammolar muvaffaqiyatli bartaraf etildi va o‘chirildi',
    store: {
      ...store,
      openReportsCount: 0,
      openCorrectionsCount: 0,
      hasPendingModeration: false
    },
    resolvedReportsCount
  });
});

adminOrgsRouter.delete('/stores/:id/issues', requireStaffRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  const store = db.stores.get(req.params.id);
  if (!store) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }
  let resolvedReportsCount = 0;
  for (const [, rep] of db.reports.entries()) {
    if (rep.storeId === store.id) {
      if (rep.status === 'OPEN') resolvedReportsCount++;
      rep.status = 'RESOLVED';
      (rep as any).resolvedAt = new Date().toISOString();
    }
  }
  if (store.status === 'PENDING' || store.status === 'NEEDS_CHANGES') {
    store.status = 'ACTIVE';
    store.isVerified = true;
    store.updatedAt = new Date().toISOString();
  }
  db.scheduleSave();
  res.json({ success: true, message: 'Muammolar muvaffaqiyatli o‘chirildi', resolvedReportsCount });
});

adminOrgsRouter.delete('/stores/:id', requireStaffRole(['SUPERADMIN']), (req, res) => {
  const store = db.stores.get(req.params.id);
  if (!store) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }

  const caller = getCurrentUser(req);
  store.status = 'SUSPENDED';
  store.updatedAt = new Date().toISOString();

  db.auditLogs.push({
    id: uuidv4(),
    actorId: caller?.id || SEED_IDS.adminUserId,
    actorEmail: caller?.email || 'admin@yaqintop.uz',
    action: 'SUSPEND_STORE',
    entityType: 'STORE',
    entityId: store.id,
    timestamp: new Date().toISOString()
  });

  db.scheduleSave();

  res.json({ success: true, store });
});

// ================= CREDENTIAL REQUESTS =================
adminOrgsRouter.get('/credential-requests', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  const reqs = Array.from(db.credentialRequests.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).map(({ requestedPassword, ...clean }) => clean);
  res.json({ requests: reqs });
});

adminOrgsRouter.post('/credential-requests/:id/decision', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  const changeReq = db.credentialRequests.get(req.params.id);
  if (!changeReq) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'So‘rov topilmadi' });
    return;
  }

  const { decision, adminComment } = req.body;
  if (decision !== 'APPROVE' && decision !== 'REJECT') {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Qaror APPROVE yoki REJECT bo‘lishi shart' });
    return;
  }

  const user = db.users.get(changeReq.userId);

  if (decision === 'APPROVE') {
    changeReq.status = 'APPROVED';
    changeReq.adminComment = adminComment || 'Administrator tomonidan tasdiqlandi';
    changeReq.resolvedAt = new Date().toISOString();

    if (user) {
      if (changeReq.requestedEmail) user.email = changeReq.requestedEmail;
      if (changeReq.requestedPassword) {
        user.passwordHash = changeReq.requestedPassword;
        delete (user as any).plainPassword;
      }
      if (changeReq.requestedFullName) user.fullName = changeReq.requestedFullName;
      if (changeReq.requestedPhone) user.phone = changeReq.requestedPhone;
      user.updatedAt = new Date().toISOString();

      revokeUserSessions(user.id);
      for (const [token, sess] of db.sessions.entries()) {
        if (sess.userId === user.id) {
          revokeToken(token);
          db.sessions.delete(token);
        }
      }
    }

    db.notifications.set(uuidv4(), {
      id: uuidv4(),
      userId: changeReq.userId,
      title: 'So‘rovingiz tasdiqlandi!',
      message: 'Sizning login va parol ma‘lumotlarini o‘zgartirish haqidagi so‘rovingiz administrator tomonidan tasdiqlandi.',
      type: 'SUCCESS',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } else {
    changeReq.status = 'REJECTED';
    changeReq.adminComment = adminComment || 'Administrator tomonidan rad etildi';
    changeReq.resolvedAt = new Date().toISOString();

    db.notifications.set(uuidv4(), {
      id: uuidv4(),
      userId: changeReq.userId,
      title: 'So‘rovingiz rad etildi',
      message: `Login/parol almashtirish so‘rovingiz rad etildi. Sabab: ${changeReq.adminComment}`,
      type: 'WARNING',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  const caller = getCurrentUser(req);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: caller?.id || SEED_IDS.adminUserId,
    actorEmail: caller?.email || 'admin@yaqintop.uz',
    action: `CREDENTIAL_REQUEST_${decision}`,
    entityType: 'CREDENTIAL_REQUEST',
    entityId: changeReq.id,
    diff: { status: changeReq.status, adminComment },
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    request: changeReq,
    message: decision === 'APPROVE' ? 'So‘rov tasdiqlandi va yangilanishlar saqlandi' : 'So‘rov rad etildi'
  });
});

// ================= INQUIRIES MANAGEMENT =================
adminOrgsRouter.get('/inquiries', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  const inqs = Array.from(db.inquiries.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ inquiries: inqs });
});

adminOrgsRouter.post('/inquiries', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  const { storeId, subject, message, priority = 'NORMAL' } = req.body;
  if (!storeId || !subject || !message) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Do‘kon, mavzu va xabar matni kiritilishi shart' });
    return;
  }

  const store = db.stores.get(storeId);
  if (!store) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }

  const org = db.organizations.get(store.organizationId);

  const inquiryId = uuidv4();
  const newInquiry = {
    id: inquiryId,
    storeId,
    storeName: store.name,
    organizationId: store.organizationId,
    organizationName: org?.name || 'Tashkilot',
    subject: subject.trim(),
    message: message.trim(),
    priority: priority as any,
    status: 'PENDING_MERCHANT_REPLY' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.inquiries.set(inquiryId, newInquiry);

  const orgMembers = Array.from(db.memberships.values()).filter(m => m.organizationId === store.organizationId);
  for (const m of orgMembers) {
    db.notifications.set(uuidv4(), {
      id: uuidv4(),
      userId: m.userId,
      title: 'Administrator rasmiy so‘rovi',
      message: `"${store.name}" do‘koningizga administrator tomonidan yangi rasmiy so‘rov keldi: ${subject}`,
      type: 'INFO',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  const caller = getCurrentUser(req);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: caller?.id || SEED_IDS.adminUserId,
    actorEmail: caller?.email || 'admin@yaqintop.uz',
    action: 'CREATE_INQUIRY',
    entityType: 'INQUIRY',
    entityId: inquiryId,
    diff: { storeId, subject, priority },
    timestamp: new Date().toISOString()
  });

  res.status(201).json({ success: true, inquiry: newInquiry });
});

adminOrgsRouter.post('/inquiries/:id/reply', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  const inq = db.inquiries.get(req.params.id);
  if (!inq) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Murojaat topilmadi' });
    return;
  }

  const { reply, status = 'RESOLVED' } = req.body;
  if (!reply || !reply.trim()) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Javob / Xulosa matni kiritilishi shart' });
    return;
  }

  (inq as any).adminReply = reply.trim();
  (inq as any).adminRepliedAt = new Date().toISOString();
  inq.adminResolutionNotes = reply.trim();
  inq.status = status;
  inq.updatedAt = new Date().toISOString();

  if ((inq as any).senderUserId) {
    db.notifications.set(uuidv4(), {
      id: uuidv4(),
      userId: (inq as any).senderUserId,
      title: 'Administrator javobi',
      message: `Sizning "${inq.subject}" murojaatingiz administrator tomonidan ko‘rib chiqildi va javob berildi: "${reply.trim().slice(0, 80)}..."`,
      type: 'SUCCESS',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  if (inq.organizationId) {
    const members = Array.from(db.memberships.values()).filter(m => m.organizationId === inq.organizationId);
    for (const m of members) {
      db.notifications.set(uuidv4(), {
        id: uuidv4(),
        userId: m.userId,
        title: 'Murojaat bo‘yicha admin xulosasi',
        message: `"${inq.subject}" murojaati administrator tomonidan ko‘rib chiqildi va xulosa berildi (Holat: ${status}).`,
        type: 'INFO',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
  }

  const caller = getCurrentUser(req);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: caller?.id || SEED_IDS.adminUserId,
    actorEmail: caller?.email || 'admin@yaqintop.uz',
    action: 'ADMIN_REPLY_INQUIRY',
    entityType: 'INQUIRY',
    entityId: inq.id,
    diff: { status: inq.status, reply: (inq as any).adminReply },
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, inquiry: inq, message: 'Javobingiz saqlandi va barcha tomonlarga yetkazildi' });
});

adminOrgsRouter.patch('/inquiries/:id/status', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  const inq = db.inquiries.get(req.params.id);
  if (!inq) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Murojaat topilmadi' });
    return;
  }

  const { status, adminResolutionNotes } = req.body;
  if (status) inq.status = status;
  if (adminResolutionNotes !== undefined) inq.adminResolutionNotes = adminResolutionNotes;
  inq.updatedAt = new Date().toISOString();

  if ((inq as any).senderUserId) {
    db.notifications.set(uuidv4(), {
      id: uuidv4(),
      userId: (inq as any).senderUserId,
      title: 'Murojaatingiz holati yangilandi',
      message: `"${inq.subject}" murojaatingiz holati "${status}" ga o‘zgartirildi.`,
      type: 'INFO',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  res.json({ success: true, inquiry: inq });
});

// ================= ADMIN ANALYTICS & ACTIVITY =================
adminOrgsRouter.get('/analytics/activity', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  const reportsList = Array.from(db.reports.values());
  const storesList = Array.from(db.stores.values());

  const complaintsByReason: Record<string, number> = {
    WRONG_PRICE: 0,
    UNAVAILABLE_PRODUCT: 0,
    WRONG_LOCATION: 0,
    CLOSED_STORE: 0,
    WRONG_HOURS: 0,
    WRONG_PHONE: 0,
    OTHER: 0
  };

  reportsList.forEach((r) => {
    complaintsByReason[r.reason] = (complaintsByReason[r.reason] || 0) + 1;
  });

  const topSearchedProducts = [
    ...getSearchLogs().reduce((groups, log) => {
      const current = groups.get(log.query) || { name: log.query, category: 'Qidiruv', searchesCount: 0, successful: 0 };
      current.searchesCount++;
      if (log.resultsCount > 0) current.successful++;
      groups.set(log.query, current);
      return groups;
    }, new Map<string, any>()).values()
  ]
    .map(group => ({
      ...group,
      successRate: Math.round((group.successful / group.searchesCount) * 100) + '%',
      topStore: ''
    }))
    .sort((a, b) => b.searchesCount - a.searchesCount)
    .slice(0, 10);

  const topSearchedServices: { name: string; searchesCount: number; description: string }[] = [];

  const topStoresActivity = storesList.map((st) => {
    const org = db.organizations.get(st.organizationId);
    const repCount = reportsList.filter((r) => r.storeId === st.id).length;
    return {
      id: st.id,
      name: st.name,
      organizationName: org?.name || 'Tashkilot',
      address: st.address,
      viewsCount: 0,
      routesRequested: 0,
      complaintsCount: repCount,
      rating: st.rating,
      status: st.status
    };
  });

  res.json({
    summary: {
      totalSearchesToday: getSearchLogs().filter(log => Date.parse(log.timestamp) > Date.now() - 86400000).length,
      activeUsersToday: new Set(getSearchLogs().filter(log => log.userType === 'CUSTOMER' && Date.parse(log.timestamp) > Date.now() - 86400000).map(log => log.userName)).size,
      totalComplaints: reportsList.length,
      openComplaints: reportsList.filter((r) => r.status === 'OPEN').length,
      avgSearchRadiusM: getSearchLogs().length ? Math.round(getSearchLogs().reduce((sum, log) => sum + log.radiusM, 0) / getSearchLogs().length) : 0,
      searchSuccessRate: getSearchLogs().length ? Math.round((getSearchLogs().filter(log => log.resultsCount > 0).length / getSearchLogs().length) * 100) + '%' : '0%'
    },
    topSearchedProducts,
    topSearchedServices,
    topStoresActivity,
    complaintsByReason,
    recentSearchStream: getSearchLogs(),
    recentComplaints: reportsList.slice(-10).reverse().map((r) => {
      const store = db.stores.get(r.storeId);
      const user = r.reporterUserId ? db.users.get(r.reporterUserId) : null;
      return {
        ...r,
        storeName: store?.name || 'Do‘kon',
        reporterName: user?.fullName || 'Anonim xaridor'
      };
    })
  });
});

// ================= ADMIN ANALYTICS & GROWTH =================
adminOrgsRouter.get('/analytics/growth', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  const period = (req.query.period as string) || 'month';
  const now = Date.now();

  let durationMs = 30 * 24 * 60 * 60 * 1000;
  if (period === 'week') {
    durationMs = 7 * 24 * 60 * 60 * 1000;
  } else if (period === 'year') {
    durationMs = 365 * 24 * 60 * 60 * 1000;
  } else if (period === 'all') {
    durationMs = 10 * 365 * 24 * 60 * 60 * 1000;
  }

  const periodStart = period === 'all' ? 0 : now - durationMs;
  const previousPeriodStart = period === 'all' ? 0 : periodStart - durationMs;

  const usersList = Array.from(db.users.values())
    .filter(u => (u.role as string) !== 'ADMIN' && u.role !== 'SUPERADMIN')
    .map(u => {
      const { passwordHash, ...clean } = u;
      return clean;
    });
  const storesList = Array.from(db.stores.values());
  const organizationsList = Array.from(db.organizations.values());
  const variantsList = Array.from(db.variants.values());

  const usersActive = usersList.filter(u => u.status === 'ACTIVE').length;
  const usersSuspended = usersList.filter(u => u.status === 'SUSPENDED').length;
  const usersDeleted = usersList.filter(u => u.status === 'DELETED').length;

  const storesActive = storesList.filter(s => s.status === 'ACTIVE').length;
  const storesSuspended = storesList.filter(s => s.status === 'SUSPENDED').length;
  const storesDeleted = storesList.filter(s => s.status === 'DELETED').length;

  const orgsActive = organizationsList.filter(o => o.status === 'ACTIVE').length;
  const orgsSuspended = organizationsList.filter(o => o.status === 'SUSPENDED').length;
  const orgsDeleted = organizationsList.filter(o => (o as any).status === 'DELETED').length;

  const isService = (v: any) => {
    return v.kind === 'SERVICE' || v.packUnit === 'xizmat' || v.unit === 'xizmat' || v.category === 'IT dastur';
  };

  const productsList = variantsList.filter(v => !isService(v));
  const servicesList = variantsList.filter(v => isService(v));

  const countInWindow = (items: any[], start: number, end: number) => {
    return items.filter(item => {
      const ts = new Date(item.createdAt || 0).getTime();
      return ts >= start && ts <= end;
    }).length;
  };

  const usersCurrent = countInWindow(usersList, periodStart, now);
  const usersPrev = countInWindow(usersList, previousPeriodStart, periodStart);

  const storesCurrent = countInWindow(storesList, periodStart, now);
  const storesPrev = countInWindow(storesList, previousPeriodStart, periodStart);

  const orgsCurrent = countInWindow(organizationsList, periodStart, now);
  const orgsPrev = countInWindow(organizationsList, previousPeriodStart, periodStart);

  const productsCurrent = countInWindow(productsList, periodStart, now);
  const productsPrev = countInWindow(productsList, previousPeriodStart, periodStart);

  const servicesCurrent = countInWindow(servicesList, periodStart, now);
  const servicesPrev = countInWindow(servicesList, previousPeriodStart, periodStart);

  const calcChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? '+100%' : '0%';
    const pct = Math.round(((curr - prev) / prev) * 100);
    return pct >= 0 ? `+${pct}%` : `${pct}%`;
  };

  const timeline: Array<{
    key: string;
    label: string;
    date: string;
    users: number;
    stores: number;
    products: number;
    services: number;
    total: number;
  }> = [];

  if (period === 'week') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      d.setHours(0, 0, 0, 0);
      const startOfDay = d.getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

      const dayNames = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
      const dayLabel = `${dayNames[d.getDay()]} (${d.getDate()}.${d.getMonth() + 1})`;
      const uCount = countInWindow(usersList, startOfDay, endOfDay);
      const sCount = countInWindow(storesList, startOfDay, endOfDay);
      const pCount = countInWindow(productsList, startOfDay, endOfDay);
      const srvCount = countInWindow(servicesList, startOfDay, endOfDay);

      timeline.push({
        key: d.toISOString().slice(0, 10),
        label: dayLabel,
        date: d.toISOString(),
        users: uCount,
        stores: sCount,
        products: pCount,
        services: srvCount,
        total: uCount + sCount + pCount + srvCount
      });
    }
  } else if (period === 'month') {
    const bucketCount = 6;
    const bucketDays = 5;
    for (let i = bucketCount - 1; i >= 0; i--) {
      const startD = new Date(now - (i + 1) * bucketDays * 24 * 60 * 60 * 1000);
      const endD = new Date(now - i * bucketDays * 24 * 60 * 60 * 1000);
      const startTs = startD.getTime();
      const endTs = endD.getTime();

      const label = `${startD.getDate()}/${startD.getMonth() + 1} - ${endD.getDate()}/${endD.getMonth() + 1}`;
      const uCount = countInWindow(usersList, startTs, endTs);
      const sCount = countInWindow(storesList, startTs, endTs);
      const pCount = countInWindow(productsList, startTs, endTs);
      const srvCount = countInWindow(servicesList, startTs, endTs);

      timeline.push({
        key: `bucket-${i}`,
        label,
        date: endD.toISOString(),
        users: uCount,
        stores: sCount,
        products: pCount,
        services: srvCount,
        total: uCount + sCount + pCount + srvCount
      });
    }
  } else {
    const monthNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setMonth(targetDate.getMonth() - i);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();

      const startOfMonth = new Date(year, month, 1).getTime();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

      const label = `${monthNames[month]} ${year}`;
      const uCount = countInWindow(usersList, startOfMonth, endOfMonth);
      const sCount = countInWindow(storesList, startOfMonth, endOfMonth);
      const pCount = countInWindow(productsList, startOfMonth, endOfMonth);
      const srvCount = countInWindow(servicesList, startOfMonth, endOfMonth);

      timeline.push({
        key: `${year}-${month + 1}`,
        label,
        date: targetDate.toISOString(),
        users: uCount,
        stores: sCount,
        products: pCount,
        services: srvCount,
        total: uCount + sCount + pCount + srvCount
      });
    }
  }

  const filterByPeriod = (items: any[]) => {
    return items
      .filter(item => {
        if (period === 'all') return true;
        const ts = new Date(item.createdAt || 0).getTime();
        return ts >= periodStart && ts <= now;
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  };

  const periodUsers = filterByPeriod(usersList);
  const periodStores = filterByPeriod(storesList);
  const periodOrgs = filterByPeriod(organizationsList);
  const periodProducts = filterByPeriod(productsList);
  const periodServices = filterByPeriod(servicesList);

  res.json({
    period,
    periodStart: new Date(periodStart).toISOString(),
    periodEnd: new Date(now).toISOString(),
    summary: {
      users: {
        totalAllTime: usersList.length,
        inPeriod: usersCurrent,
        previousPeriod: usersPrev,
        change: calcChange(usersCurrent, usersPrev),
        active: usersActive,
        suspended: usersSuspended,
        deleted: usersDeleted
      },
      stores: {
        totalAllTime: storesList.length,
        inPeriod: storesCurrent,
        previousPeriod: storesPrev,
        change: calcChange(storesCurrent, storesPrev),
        active: storesActive,
        suspended: storesSuspended,
        deleted: storesDeleted
      },
      organizations: {
        totalAllTime: organizationsList.length,
        inPeriod: orgsCurrent,
        previousPeriod: orgsPrev,
        change: calcChange(orgsCurrent, orgsPrev),
        active: orgsActive,
        suspended: orgsSuspended,
        deleted: orgsDeleted
      },
      statusOverview: {
        activeTotal: usersActive + storesActive + orgsActive,
        suspendedTotal: usersSuspended + storesSuspended + orgsSuspended,
        deletedTotal: usersDeleted + storesDeleted + orgsDeleted
      },
      products: {
        totalAllTime: productsList.length,
        inPeriod: productsCurrent,
        previousPeriod: productsPrev,
        change: calcChange(productsCurrent, productsPrev)
      },
      services: {
        totalAllTime: servicesList.length,
        inPeriod: servicesCurrent,
        previousPeriod: servicesPrev,
        change: calcChange(servicesCurrent, servicesPrev)
      },
      totalAddedInPeriod: usersCurrent + storesCurrent + productsCurrent + servicesCurrent
    },
    timeline,
    recent: {
      users: (periodUsers.length > 0 ? periodUsers : usersList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())).slice(0, 30),
      stores: (periodStores.length > 0 ? periodStores : storesList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())).slice(0, 30),
      organizations: (periodOrgs.length > 0 ? periodOrgs : organizationsList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())).slice(0, 30),
      products: (periodProducts.length > 0 ? periodProducts : productsList.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())).slice(0, 30),
      services: (periodServices.length > 0 ? periodServices : servicesList.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())).slice(0, 30)
    }
  });
});

// ================= ADMIN DATABASE SCHEMA & LIVE TABLES =================
adminOrgsRouter.get('/database/schema-and-tables', requireStaffRole(['ADMIN', 'SUPERADMIN']), (req, res) => {
  const sanitizeUser = (u: any) => {
    const { passwordHash, plainPassword, verificationCode, ...clean } = u;
    return clean;
  };

  const tables = {
    organizations: {
      name: 'organizations',
      displayName: 'Tashkilotlar (Organizations)',
      description: 'Yuridik shaxslar, STIR/INN, bank rekvizitlari va kompaniyalar',
      count: db.organizations.size,
      records: Array.from(db.organizations.values())
    },
    stores: {
      name: 'stores',
      displayName: 'Do‘konlar va Filiallar (Stores)',
      description: 'Savdo nuqtalari, geografik koordinatalar (Point, 4326), ish vaqtlari',
      count: db.stores.size,
      records: Array.from(db.stores.values())
    },
    offers: {
      name: 'offers',
      displayName: 'Takliflar va Narxlar (Offers)',
      description: 'Do‘kondagi tovar narxi, mavjud qoldiq (stockOnHand), kassa holati',
      count: db.offers.size,
      records: Array.from(db.offers.values())
    },
    variants: {
      name: 'variants',
      displayName: 'Mahsulot Variantlari (Variants)',
      description: 'Global tovar katalogi, shtrix-kodlar, toifalar va o‘lchov birliklari',
      count: db.variants.size,
      records: Array.from(db.variants.values())
    },
    users: {
      name: 'users',
      displayName: 'Foydalanuvchilar (Users)',
      description: 'Xaridorlar, tadbirkorlar va tizim ma’murlari akkauntlari',
      count: db.users.size,
      records: Array.from(db.users.values()).map(sanitizeUser)
    },
    credentialRequests: {
      name: 'credentialRequests',
      displayName: 'Ma’lumot Yangilash So‘rovlari (Credential Requests)',
      description: 'Login va parol o‘zgartirish bo‘yicha so‘rovlar',
      count: db.credentialRequests.size,
      records: Array.from(db.credentialRequests.values()).map(({ requestedPassword, ...clean }) => clean)
    },
    memberships: {
      name: 'memberships',
      displayName: 'A’zolik va Rollar (Memberships)',
      description: 'Foydalanuvchilarning tashkilotlarga bog‘liqligi va ruxsat darajalari',
      count: db.memberships.size,
      records: Array.from(db.memberships.values())
    },
    reviews: {
      name: 'reviews',
      displayName: 'Sharhlar va Baholar (Reviews)',
      description: 'Xaridorlarning do‘konlar va xizmatlar haqidagi izohlari va yulduzchalari',
      count: db.reviews.size,
      records: Array.from(db.reviews.values())
    },
    reports: {
      name: 'reports',
      displayName: 'E’tiroz va Shikoyatlar (Reports)',
      description: 'Noto‘g‘ri narx, yo‘q tovar yoki yopiq do‘kon bo‘yicha shikoyatlar',
      count: db.reports.size,
      records: Array.from(db.reports.values())
    },
    inquiries: {
      name: 'inquiries',
      displayName: 'Murojaatlar va Xabarlar (Inquiries)',
      description: 'Do‘kon egalari va adminlar o‘rtasidagi xabarlar va moderatsiya so‘rovlari',
      count: db.inquiries.size,
      records: Array.from(db.inquiries.values())
    },
    stockDocuments: {
      name: 'stockDocuments',
      displayName: 'Qoldiq Hujjatlari (Stock Documents)',
      description: 'Excel/1C orqali yuklangan inventarizatsiya va qoldiq aktlari',
      count: db.stockDocuments.size,
      records: Array.from(db.stockDocuments.values())
    },
    balances: {
      name: 'balances',
      displayName: 'Ombor Qoldiqlari Balansi (Inventory Balances)',
      description: 'Har bir offer va tovarning hisoblangan tannarxi, qoldig‘i va versiya nazorati',
      count: db.balances.size,
      records: Array.from(db.balances.values())
    },
    auditLogs: {
      name: 'auditLogs',
      displayName: 'Tizim Auditi (Audit Logs)',
      description: 'Har bir narx, foydalanuvchi va qoldiq o‘zgarishining buxgalteriya balansi auditi',
      count: db.auditLogs.length,
      records: db.auditLogs.slice(-100)
    },
    searchLogs: {
      name: 'searchLogs',
      displayName: 'Qidiruv Jurnali (Search Logs)',
      description: 'Xaridorlar tomonidan amalga oshirilgan barcha real-vaqt qidiruv so‘rovlari',
      count: getSearchLogs().length,
      records: getSearchLogs()
    }
  };

  res.json({
    tables,
    totalTables: Object.keys(tables).length,
    engine: 'In-Memory Spatial PostGIS-Compatible DB',
    uptimeSec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});
