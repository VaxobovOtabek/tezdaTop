import { db } from '../db/in-memory-db.js';
import { calculateDistanceMetres, isWithinDistance, isValidRadius } from '../db/spatial.js';
import { matchProductQuery } from '../db/fuzzy.js';
import {
  SearchQuery,
  SearchResponse,
  StoreSearchResult,
  MarkerItem,
  Offer,
  Store
} from '@yaqintop/contracts';
import Decimal from 'decimal.js';

export function checkStoreIsOpenNow(store: Store): boolean {
  if (!store.hours || store.hours.length === 0) return true;
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayHours = store.hours.find((h: any) => h.dayOfWeek === dayOfWeek);
  if (!todayHours || todayHours.isClosed) return false;

  const [openH, openM] = todayHours.openTime.split(':').map(Number);
  const [closeH, closeM] = todayHours.closeTime.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (closeMinutes < openMinutes) {
    // Overnight hours (e.g., 22:00 to 02:00)
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

export function searchProducts(query: SearchQuery): SearchResponse {
  const qTrimmed = query.q ? query.q.trim() : '';
  if (!qTrimmed) {
    return {
      items: [],
      totalStores: 0,
      totalOffers: 0,
      nextCursor: null,
      hasMore: false
    };
  }

  const hasRegionFilter = Boolean(query.region && query.region !== 'Barcha viloyatlar');
  if (!hasRegionFilter && query.radiusM && !isValidRadius(query.radiusM)) {
    throw new Error('Qidiruv radiusi 50 va 3000 metr oralig‘ida bo‘lishi shart');
  }

  // 1. Gather all active stores within radius whose organization is ACTIVE
  const candidateStores: { store: Store; distanceM: number; isOpenNow: boolean }[] = [];

  for (const store of db.stores.values()) {
    if (store.status !== 'ACTIVE') continue;

    const org = db.organizations.get(store.organizationId);
    if (!org || org.status !== 'ACTIVE') continue;

    if (query.type && store.type !== query.type && store.type !== 'MIXED') {
      continue;
    }

    // Regional restriction filter
    if (hasRegionFilter) {
      const sReg = String((store as any).region || (org as any).region || '').toLowerCase();
      const sCity = String((store as any).city || (org as any).city || '').toLowerCase();
      const sDist = String((store as any).district || (org as any).district || '').toLowerCase();
      const sAddr = (store.address || '').toLowerCase();
      const sName = (store.name || '').toLowerCase();
      const rClean = (query.region || '').toLowerCase().replace(/\s*(viloyati|respublikasi|shahri)\s*/gi, '').trim();

      let matches = false;
      if (sReg) {
        matches = rClean === 'toshkent' ? sReg.includes('toshkent') : sReg.includes(rClean);
      } else {
        const combined = `${sCity} ${sDist} ${sAddr} ${sName}`;
        matches = rClean === 'toshkent'
          ? (combined.includes('toshkent') || !sReg)
          : combined.includes(rClean);
      }

      // District-to-region lookup (e.g. Guliston, Yangiyer, Shirin -> Sirdaryo)
      if (!matches) {
        const localArea = `${sCity} ${sDist} ${sName}`;
        if (rClean.includes('sirdaryo') && (localArea.includes('guliston') || localArea.includes('yangiyer') || localArea.includes('shirin') || localArea.includes('sayhun') || localArea.includes('sardoba') || localArea.includes('sirdaryo'))) {
          if (!sReg || sReg.includes('sirdaryo')) matches = true;
        } else if (rClean.includes('samarqand') && (localArea.includes('samarqand') || localArea.includes('urgut') || localArea.includes('kattaqo'))) {
          if (!sReg || sReg.includes('samarqand')) matches = true;
        } else if (rClean.includes('fargona') && (localArea.includes('fargona') || localArea.includes('qoqon') || localArea.includes('quva') || localArea.includes('margilon'))) {
          if (!sReg || sReg.includes('fargona')) matches = true;
        } else if (rClean.includes('andijon') && (localArea.includes('andijon') || localArea.includes('asaka') || localArea.includes('shahrixon'))) {
          if (!sReg || sReg.includes('andijon')) matches = true;
        } else if (rClean.includes('namangan') && (localArea.includes('namangan') || localArea.includes('chust') || localArea.includes('pop'))) {
          if (!sReg || sReg.includes('namangan')) matches = true;
        } else if (rClean.includes('buxoro') && (localArea.includes('buxoro') || localArea.includes('gijduvon') || localArea.includes('kogon'))) {
          if (!sReg || sReg.includes('buxoro')) matches = true;
        }
      }

      if (!matches) continue;
    }

    // District / City filter (only if explicitly specified and not Barcha tumanlar)
    if (query.district && query.district !== 'Barcha tumanlar' && query.district !== 'Viloyat markazi') {
      const sDist = String((store as any).district || (store as any).city || (org as any).district || (org as any).city || '').toLowerCase();
      const dClean = query.district.toLowerCase().replace(/\s*(tumani|shahri|\(.*?\))\s*/gi, '').trim();
      const sAddr = (store.address || '').toLowerCase();
      if (!sDist.includes(dClean) && !sAddr.includes(dClean)) {
        continue;
      }
    }

    const dist = calculateDistanceMetres(
      query.lat,
      query.lng,
      store.location.lat,
      store.location.lng
    );

    // Strict radius cut-off: when radiusM is specified, ONLY return stores within that radius!
    if (query.radiusM && query.radiusM > 0 && dist > query.radiusM) {
      continue;
    }

    const isOpen = checkStoreIsOpenNow(store);
    if (query.openNow && !isOpen) continue;
    candidateStores.push({ store, distanceM: dist, isOpenNow: isOpen });
  }

  // Fallback: only if radiusM is NOT set or 0 (if user set a radius, strictly respect that radius)
  if (candidateStores.length === 0 && (!query.radiusM || query.radiusM === 0)) {
    for (const store of db.stores.values()) {
      if (store.status !== 'ACTIVE') continue;
      const org = db.organizations.get(store.organizationId);
      if (org && org.status !== 'ACTIVE') continue;

      if (hasRegionFilter) {
        const sReg = String((store as any).region || (org as any).region || '').toLowerCase();
        const rLower = query.region!.toLowerCase().trim();
        const rClean = rLower.replace(/\s*(viloyati|respublikasi|shahri)\s*/gi, '').trim();
        let matches = false;
        if (sReg) {
          matches = rClean === 'toshkent' ? sReg.includes('toshkent') : sReg.includes(rClean);
        } else {
          matches = (store.address || '').toLowerCase().includes(rClean);
        }
        if (!matches) continue;
      }

      const dist = calculateDistanceMetres(
        query.lat,
        query.lng,
        store.location.lat,
        store.location.lng
      );
      const isOpen = checkStoreIsOpenNow(store);
      candidateStores.push({ store, distanceM: dist, isOpenNow: isOpen });
    }
  }

  // 2. Find matching offers in each candidate store
  interface StoreMatchAggregate {
    store: Store;
    distanceM: number;
    isOpenNow: boolean;
    matchingOffers: { offer: Offer; score: number }[];
  }

  const storeAggregates: StoreMatchAggregate[] = [];

  // Index offers by store for candidate stores in O(N) instead of O(S x N)
  const candidateStoreIdSet = new Set(candidateStores.map(c => c.store.id));
  const offersByStore = new Map<string, Offer[]>();
  const KORZINKA_ORG_ID = '07916afb-54bf-5551-b8dd-6e88d56c3fae';
  const KORZINKA_MAIN_STORE_ID = 'korzinka-main';
  const sharedKorzinkaOffers: Offer[] = [];

  for (const off of db.offers.values()) {
    if (off.storeId === KORZINKA_MAIN_STORE_ID || db.stores.get(off.storeId)?.organizationId === KORZINKA_ORG_ID) {
      sharedKorzinkaOffers.push(off);
    }
    if (!candidateStoreIdSet.has(off.storeId)) continue;
    let list = offersByStore.get(off.storeId);
    if (!list) {
      list = [];
      offersByStore.set(off.storeId, list);
    }
    list.push(off);
  }

  candidateStores.sort((a, b) => a.distanceM - b.distanceM || a.store.id.localeCompare(b.store.id));

  const qLower = qTrimmed.toLowerCase();
  const isPharmacyQuery = Boolean(qLower && ['apteka', 'dorixona', 'dori', 'pharmacy', 'farm', 'shifo'].some(k => qLower.includes(k)));
  const isMarketQuery = Boolean(qLower && ['market', 'supermarket', 'do\'kon', 'dokon', 'savdo', 'baza'].some(k => qLower.includes(k)));

  for (const cand of candidateStores) {
    const storeOffers: { offer: Offer; score: number }[] = [];
    let offersInStore = offersByStore.get(cand.store.id) || [];
    if (offersInStore.length === 0 && (cand.store.organizationId === KORZINKA_ORG_ID || cand.store.id === KORZINKA_MAIN_STORE_ID)) {
      offersInStore = sharedKorzinkaOffers;
    }

    // Pre-compute store-level match once per store instead of repeating in inner offers loop
    const storeNameLower = (cand.store.name || '').toLowerCase();
    const storeIsPharmacy = cand.store.type === 'PHARMACY' ||
      ['apteka', 'dorixona', 'pharm', 'shifo', 'farm'].some(k => storeNameLower.includes(k));
    const storeIsMarket = cand.store.type === 'RETAIL' || cand.store.type === 'WHOLESALE' || cand.store.type === 'MIXED';
    const storeWords = storeNameLower.split(/[\s,()\-./]+/);
    const storeNameMatches = qLower.length <= 2
      ? storeWords.some(w => w === qLower || (w.length <= 4 && w.startsWith(qLower)))
      : storeNameLower.includes(qLower);
    const storeMatchesQuery = Boolean(
      qLower && (
        storeNameMatches ||
        (isPharmacyQuery && storeIsPharmacy) ||
        (isMarketQuery && storeIsMarket)
      )
    );

    for (const off of offersInStore) {
      if (off.status === 'INACTIVE') continue;

      if (query.inStock && off.variant.kind !== 'SERVICE' && (off.stockOnHand <= 0 || off.status === 'OUT_OF_STOCK')) {
        continue;
      }

      const freshness = db.computeFreshness(off.stockVerifiedAt);
      if (query.freshOnly && (freshness === 'STALE' || freshness === 'VERY_STALE' || freshness === 'UNKNOWN')) {
        continue;
      }

      // Check applicable price considering wholesale tiers
      let applicablePrice = new Decimal(off.price);
      if (query.minQuantity && query.minQuantity > 1 && off.wholesaleTiers?.length) {
        for (const tier of off.wholesaleTiers) {
          if (query.minQuantity >= tier.minQuantity) {
            applicablePrice = new Decimal(tier.unitPrice);
          }
        }
      }

      if (query.priceMin !== undefined && applicablePrice.lessThan(query.priceMin)) {
        continue;
      }
      if (query.priceMax !== undefined && applicablePrice.greaterThan(query.priceMax)) {
        continue;
      }

      // Check text / query match
      if (qTrimmed) {
        const matchResult = matchProductQuery(query.q!, {
          title: off.variant.title,
          barcode: off.variant.barcode,
          aliases: (off.variant as any).aliases,
          category: off.variant.category,
          brand: off.variant.brand
        });

        const candOffer = off.storeId === cand.store.id ? off : { ...off, storeId: cand.store.id };
        if (matchResult.isMatch) {
          storeOffers.push({ offer: candOffer, score: matchResult.score });
        } else if (storeMatchesQuery) {
          storeOffers.push({ offer: candOffer, score: 0.85 });
        }
      } else {
        // No query: all active offers in store match
        const candOffer = off.storeId === cand.store.id ? off : { ...off, storeId: cand.store.id };
        storeOffers.push({ offer: candOffer, score: 1.0 });
      }
    }

    if (storeOffers.length > 0) {
      // Sort offers inside store: highest score, then lowest price
      storeOffers.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return Number(a.offer.price) - Number(b.offer.price);
      });

      if (!qTrimmed) {
        // No search query (initial load): return distinct products so customer sees products by default
        const seenVariantsInStore = new Set<string>();
        for (const { offer, score } of storeOffers) {
          const key = offer.variantId || offer.variant?.id || offer.id;
          if (seenVariantsInStore.has(key)) continue;
          seenVariantsInStore.add(key);

          storeAggregates.push({
            store: cand.store,
            distanceM: cand.distanceM,
            isOpenNow: cand.isOpenNow,
            matchingOffers: [{ offer, score }]
          });
        }
      } else {
        // Search query provided: keep all stores that have matching products (do NOT suppress other stores)
        // Deduplicate variants within this store only
        const seenVariantsInStore = new Set<string>();
        const matchingOffers = storeOffers.filter(({ offer }) => {
          const key = offer.variantId || offer.variant?.id || offer.id;
          if (seenVariantsInStore.has(key)) return false;
          seenVariantsInStore.add(key);
          return true;
        });

        if (matchingOffers.length > 0) {
          storeAggregates.push({
            store: cand.store,
            distanceM: cand.distanceM,
            isOpenNow: cand.isOpenNow,
            matchingOffers
          });
        }
      }
    }
  }

  // 3. Sort store aggregates according to sort parameter
  storeAggregates.sort((a, b) => {
    if (query.sort === 'distance') {
      return a.distanceM - b.distanceM;
    }
    if (query.sort === 'price') {
      return Number(a.matchingOffers[0].offer.price) - Number(b.matchingOffers[0].offer.price);
    }
    if (query.sort === 'rating') {
      return b.store.rating - a.store.rating;
    }
    // Default 'relevance': match score -> distance -> price
    const scoreDiff = b.matchingOffers[0].score - a.matchingOffers[0].score;
    if (Math.abs(scoreDiff) > 0.05) return scoreDiff;
    return a.distanceM - b.distanceM;
  });

  // 4. Cursor pagination
  const limit = Math.max(1, query.limit || 20);
  const startIndex = query.cursor ? parseInt(query.cursor, 10) : 0;
  const pageItems = storeAggregates.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < storeAggregates.length ? String(startIndex + limit) : null;

  // 5. Construct StoreSearchResult items
  const items: StoreSearchResult[] = pageItems.map((agg) => {
    const bestOffer = agg.matchingOffers[0].offer;
    const otherMatchingOfferCount = agg.matchingOffers.length - 1;

    // Find similar products in the SAME store (alternatives from same category)
    const similarProducts: Offer[] = [];
    for (const off of offersByStore.get(agg.store.id) || []) {
      if (off.id !== bestOffer.id && off.stockOnHand > 0) {
        if (off.variant.category === bestOffer.variant.category) {
          similarProducts.push(off);
        }
      }
    }

    return {
      store: agg.store,
      distanceM: agg.distanceM,
      isOpenNow: agg.isOpenNow,
      bestOffer,
      otherMatchingOfferCount,
      similarProducts: similarProducts.slice(0, 4)
    };
  });

  return {
    items,
    totalStores: storeAggregates.length,
    totalOffers: storeAggregates.reduce((acc, agg) => acc + agg.matchingOffers.length, 0),
    nextCursor,
    hasMore: nextCursor !== null
  };
}

export function getMarkers(query: SearchQuery): MarkerItem[] {
  const result = searchProducts({ ...query, limit: 50 });
  return result.items.map((it: any) => ({
    storeId: it.store.id,
    name: it.store.name,
    location: it.store.location,
    bestPrice: it.bestOffer.price,
    productTitle: it.bestOffer.variant.title,
    isOpenNow: it.isOpenNow
  }));
}
