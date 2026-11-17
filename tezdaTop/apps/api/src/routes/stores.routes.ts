import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/in-memory-db.js';
import { calculateDistanceMetres } from '../db/spatial.js';
import { checkStoreIsOpenNow } from '../services/search.service.js';
import { Store } from '@yaqintop/contracts';
import { supabase } from '../db/supabase.js';
import { AdminReadRepository } from './admin-read.routes.js';

export const storesRouter = Router();
export const offersRouter = Router();

export function findStoreByParam(param: string, stores = db.stores): Store | undefined {
  const store = stores.get(param);
  if (store) return store;

  // Coordinates matching like @41.3135,69.2435 or 41.3135,69.2435
  if (param.includes('@') || param.includes(',')) {
    const coordStr = param.replace(/^.*@/, '');
    const [latStr, lngStr] = coordStr.split(',');
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!isNaN(lat) && !isNaN(lng)) {
      for (const s of stores.values()) {
        if (s.location && Math.abs(s.location.lat - lat) < 0.0008 && Math.abs(s.location.lng - lng) < 0.0008) {
          return s;
        }
      }
    }
  }

  // Slug matching
  const cleanParam = param.toLowerCase().replace(/@.*$/, '').replace(/^-+|-+$/g, '');
  if (cleanParam) {
    for (const s of stores.values()) {
      const sSlug = s.name.toLowerCase().replace(/[^a-z0-9а-яёўқғҳ]+/gi, '-').replace(/^-+|-+$/g, '');
      if (sSlug === cleanParam || sSlug.includes(cleanParam) || cleanParam.includes(sSlug)) {
        return s;
      }
    }
  }

  return undefined;
}

export function listPublicStores(req: Request, res: Response, database: typeof db) {
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : 41.311081;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : 69.240562;
  const radiusM = req.query.radiusM ? parseInt(req.query.radiusM as string, 10) : 0;
  const openNow = req.query.openNow === 'true';
  const query = (req.query.q || req.query.query || '').toString().trim().toLowerCase();
  const region = (req.query.region || '').toString().trim();
  const district = (req.query.district || req.query.city || '').toString().trim();

  const offerCounts = new Map<string, number>();
  for (const offer of database.offers.values()) {
    if (offer.status !== 'INACTIVE') {
      offerCounts.set(offer.storeId, (offerCounts.get(offer.storeId) ?? 0) + 1);
    }
  }
  const results: any[] = [];
  for (const store of database.stores.values()) {
    if (store.status !== 'ACTIVE') continue;
    const org = database.organizations.get(store.organizationId);
    if (!org || org.status !== 'ACTIVE') continue;

    // Regional restriction filter
    if (region && region !== 'Barcha viloyatlar') {
      const sReg = String((store as any).region || (org as any).region || '').toLowerCase();
      const rLower = region.toLowerCase();
      const matches =
        rLower === 'toshkent shahri'
          ? sReg === 'toshkent shahri' || !sReg || sReg.includes('toshkent') || (store.address || '').toLowerCase().includes('toshkent')
          : sReg === rLower ||
            sReg.includes(rLower.replace(/\s+(viloyati|respublikasi)$/i, '')) ||
            (store.address || '').toLowerCase().includes(rLower.replace(/\s+(viloyati|respublikasi)$/i, ''));
      if (!matches) continue;
    }

    // District / City filter (only if explicitly specified and not Barcha tumanlar)
    if (district && district !== 'Barcha tumanlar' && district !== 'Viloyat markazi') {
      const sDist = String((store as any).district || (store as any).city || (org as any).district || (org as any).city || '').toLowerCase();
      const dClean = district.toLowerCase().replace(/\s*(tumani|shahri|\(.*?\))\s*/gi, '').trim();
      const sAddr = (store.address || '').toLowerCase();
      if (!sDist.includes(dClean) && !sAddr.includes(dClean)) {
        continue;
      }
    }

    if (query) {
      const isPharmQuery = ['apteka', 'dorixona', 'dori', 'pharmacy', 'farm', 'shifo'].some((k) => query.includes(k));
      const storeIsPharm =
        store.type === 'PHARMACY' ||
        org.type === 'PHARMACY' ||
        ['apteka', 'dorixona', 'pharm', 'shifo', 'farm'].some((k) => store.name.toLowerCase().includes(k));

      const isMarketQuery = ['market', 'supermarket', "do'kon", 'dokon', 'savdo', 'baza'].some((k) => query.includes(k));
      const storeIsMarket = store.type === 'RETAIL' || store.type === 'WHOLESALE' || store.type === 'MIXED';

      const matchName = store.name.toLowerCase().includes(query);
      const matchOrgName = org.name.toLowerCase().includes(query);
      const matchType = (store.type || org.type || '').toLowerCase().includes(query);
      const matchAddress = (store.address || '').toLowerCase().includes(query);
      const matchCity = (store.city || org.city || '').toLowerCase().includes(query);
      const matchDistrict = (store.district || org.district || '').toLowerCase().includes(query);

      const matchesStore =
        matchName ||
        matchOrgName ||
        matchType ||
        matchAddress ||
        matchCity ||
        matchDistrict ||
        (isPharmQuery && storeIsPharm) ||
        (isMarketQuery && storeIsMarket);

      if (!matchesStore) {
        continue;
      }
    }

    const dist = calculateDistanceMetres(lat, lng, store.location.lat, store.location.lng);
    const hasRegionFilter = Boolean(region && region !== 'Barcha viloyatlar');
    // If region is selected, show ALL stores in that region without cutting off by radius
    if (radiusM && dist > radiusM && !query && !hasRegionFilter) continue;

    const isOpen = checkStoreIsOpenNow(store);
    if (openNow && !isOpen) continue;

    results.push({
      store,
      organization: org,
      distanceM: dist,
      isOpenNow: isOpen,
      offersCount: offerCounts.get(store.id) ?? 0
    });
  }

  // Sort by nearest
  results.sort((a, b) => a.distanceM - b.distanceM);
  res.json({ items: results, total: results.length });
}

export async function readPublicStore(req: Request, res: Response, next: NextFunction) {
  const client = supabase;
  if (!client || process.env.NODE_ENV === 'test') return next();

  try {
    const repository = new AdminReadRepository(client);
    const isId = req.params.id && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(req.params.id);
    const stores = await repository.rows('stores', '*', (query) =>
      isId ? query.eq('id', req.params.id) : query.eq('status', 'ACTIVE')
    );
    const storeDb = repository.hydrate({ stores });
    const params = req.params.slug
      ? [`@${req.params.lat},${req.params.lng}`, req.params.slug]
      : [req.params.id];
    const store = params.map((param) => findStoreByParam(param, storeDb.stores)).find(Boolean);
    if (!store || store.status !== 'ACTIVE') {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    }

    const organizations = await repository.rows('organizations', '*', (query) =>
      query.eq('id', store.organizationId).eq('status', 'ACTIVE')
    );
    if (!organizations.length) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    }
    const offersForStore = () =>
      client.from('offers').select('*', { count: 'exact' }).eq('store_id', store.id).eq('is_available', true).order('id');
    if (!/\/offers\/?$/.test(req.path)) {
      const result = await offersForStore().limit(1);
      if (result.error) throw result.error;
      const organization = repository.hydrate({ organizations }).organizations.get(store.organizationId);
      return res.json({ store, organization, isOpenNow: checkStoreIsOpenNow(store), offersCount: result.count ?? 0 });
    }

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const requestedLimit = parseInt(String(req.query.limit), 10);
    const limit = requestedLimit > 0 ? Math.min(requestedLimit, 100) : 0;
    const start = limit ? (page - 1) * limit : 0;
    const result = limit
      ? await offersForStore().range(start, start + limit - 1)
      : {
          data: await repository.rows('offers', '*', (query) =>
            query.eq('store_id', store.id).eq('is_available', true)
          ),
          count: null,
          error: null
        };
    if (result.error) throw result.error;
    const rows = result.data || [];
    const variants: Record<string, any>[] = [];
    for (let offset = 0; offset < rows.length; offset += 100) {
      const ids = rows.slice(offset, offset + 100).map((row) => row.variant_id);
      variants.push(...(await repository.rows('variants', '*', (query) => query.in('id', ids))));
    }
    const scoped = repository.hydrate({ offers: rows, variants });
    const offers = [...scoped.offers.values()];
    const total = result.count ?? offers.length;
    return res.json({
      offers,
      total,
      page: limit ? page : 1,
      limit: limit || total,
      totalPages: limit ? Math.ceil(total / limit) : 1,
      hasMore: Boolean(limit && start + limit < total)
    });
  } catch (error) {
    console.error('[Public Store Read]', error);
    return res.status(503).json({ code: 'DATABASE_UNAVAILABLE', message: 'Do‘kon ma’lumotlarini yuklab bo‘lmadi.' });
  }
}

// 1. Stores list (with optional Supabase read)
storesRouter.get('/', async (req, res, next) => {
  if (!supabase || process.env.NODE_ENV === 'test') {
    return listPublicStores(req, res, db);
  }
  try {
    const repository = new AdminReadRepository(supabase);
    const [stores, organizations] = await Promise.all([
      repository.rows('stores', '*', (query) => query.eq('status', 'ACTIVE')),
      repository.rows('organizations', '*', (query) => query.eq('status', 'ACTIVE'))
    ]);
    return listPublicStores(req, res, repository.hydrate({ stores, organizations }));
  } catch (error) {
    console.error('[Public Store List]', error);
    return res.status(503).json({ code: 'DATABASE_UNAVAILABLE', message: 'Do‘konlar ro‘yxatini yuklab bo‘lmadi.' });
  }
});

// 2. Multi-segment slug and coordinates
storesRouter.get('/:slug/@:lat,:lng', readPublicStore, (req: any, res: any) => {
  const param = `@${req.params.lat},${req.params.lng}`;
  const store = findStoreByParam(param) || findStoreByParam(req.params.slug);
  if (!store || store.status !== 'ACTIVE') {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }
  const org = db.organizations.get(store.organizationId);
  if (!org || org.status !== 'ACTIVE') {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }
  const offersCount = Array.from(db.offers.values()).filter(
    (o) => o.storeId === store.id && o.status !== 'INACTIVE'
  ).length;
  res.json({
    store,
    organization: org,
    isOpenNow: checkStoreIsOpenNow(store),
    offersCount
  });
});

storesRouter.get('/:slug/@:lat,:lng/offers', readPublicStore, (req: any, res: any) => {
  const param = `@${req.params.lat},${req.params.lng}`;
  const matchedStore = findStoreByParam(param) || findStoreByParam(req.params.slug);
  if (
    !matchedStore ||
    matchedStore.status !== 'ACTIVE' ||
    db.organizations.get(matchedStore.organizationId)?.status !== 'ACTIVE'
  )
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
  const storeId = matchedStore.id;
  const storeOffers = Array.from(db.offers.values()).filter(
    (o) => o.storeId === storeId && o.status !== 'INACTIVE'
  );
  res.json({ offers: storeOffers });
});

// 3. Store by ID
storesRouter.get('/:id', readPublicStore, (req, res) => {
  const store = findStoreByParam(req.params.id);
  if (!store || store.status !== 'ACTIVE') {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }
  const org = db.organizations.get(store.organizationId);
  if (!org || org.status !== 'ACTIVE') {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }

  const offersCount = Array.from(db.offers.values()).filter(
    (o) => o.storeId === store.id && o.status !== 'INACTIVE'
  ).length;

  res.json({
    store,
    organization: org,
    isOpenNow: checkStoreIsOpenNow(store),
    offersCount
  });
});

storesRouter.get('/:id/offers', readPublicStore, (req, res) => {
  const matchedStore = findStoreByParam(req.params.id);
  if (
    !matchedStore ||
    matchedStore.status !== 'ACTIVE' ||
    db.organizations.get(matchedStore.organizationId)?.status !== 'ACTIVE'
  )
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
  const storeId = matchedStore.id;

  // Deduplicate offers by variantId so store catalog never returns duplicates
  const seenVariants = new Set<string>();
  const uniqueOffers: any[] = [];
  for (const o of db.offers.values()) {
    if (o.storeId === storeId && o.status !== 'INACTIVE') {
      const vKey = o.variantId || o.variant?.id || o.id;
      if (vKey && !seenVariants.has(vKey)) {
        seenVariants.add(vKey);
        uniqueOffers.push(o);
      }
    }
  }

  // Optional Pagination / Limiter
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limitParam = parseInt(req.query.limit as string, 10);
  const limit = limitParam > 0 ? Math.min(limitParam, 100) : 0;

  const total = uniqueOffers.length;
  let pagedOffers = uniqueOffers;
  if (limit > 0) {
    const startIndex = (page - 1) * limit;
    pagedOffers = uniqueOffers.slice(startIndex, startIndex + limit);
  }

  res.json({
    offers: pagedOffers,
    total,
    page: limit > 0 ? page : 1,
    limit: limit > 0 ? limit : total,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
    hasMore: limit > 0 ? page * limit < total : false
  });
});

// 4. Similar offers
offersRouter.get('/:id/similar', (req, res) => {
  const offer = db.offers.get(req.params.id);
  if (!offer) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Taklif topilmadi' });
    return;
  }
  const similar = Array.from(db.offers.values()).filter(
    (o) =>
      o.storeId === offer.storeId &&
      o.id !== offer.id &&
      o.variant.category === offer.variant.category &&
      o.stockOnHand > 0
  );
  res.json({ similar: similar.slice(0, 6) });
});
