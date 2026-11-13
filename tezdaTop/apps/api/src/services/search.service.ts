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
  if (!isValidRadius(query.radiusM)) {
    throw new Error('Qidiruv radiusi 50 va 3000 metr oralig‘ida bo‘lishi shart');
  }

  // If query text is empty, return empty results (do not return all stores/prices)
  if (!query.q || !query.q.trim()) {
    return {
      items: [],
      totalStores: 0,
      totalOffers: 0,
      nextCursor: null,
      hasMore: false
    };
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
    if (query.region && query.region !== 'Barcha viloyatlar') {
      const sReg = String((store as any).region || (org as any).region || '').toLowerCase();
      const rLower = query.region.toLowerCase();
      const matches = rLower === 'toshkent shahri'
        ? (sReg === 'toshkent shahri' || !sReg || sReg.includes('toshkent') || (store.address || '').toLowerCase().includes('toshkent'))
        : (sReg === rLower || sReg.includes(rLower.replace(/\s+(viloyati|respublikasi)$/i, '')) || (store.address || '').toLowerCase().includes(rLower.replace(/\s+(viloyati|respublikasi)$/i, '')));
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

    if (dist <= query.radiusM) {
      const isOpen = checkStoreIsOpenNow(store);
      if (query.openNow && !isOpen) continue;
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
  const assignedProducts = new Set<string>();

  // Index offers by store for candidate stores in O(N) instead of O(S x N)
  const candidateStoreIdSet = new Set(candidateStores.map(c => c.store.id));
  const offersByStore = new Map<string, Offer[]>();
  for (const off of db.offers.values()) {
    if (!candidateStoreIdSet.has(off.storeId)) continue;
    let list = offersByStore.get(off.storeId);
    if (!list) {
      list = [];
      offersByStore.set(off.storeId, list);
    }
    list.push(off);
  }

  candidateStores.sort((a, b) => a.distanceM - b.distanceM || a.store.id.localeCompare(b.store.id));
  for (const cand of candidateStores) {
    const storeOffers: { offer: Offer; score: number }[] = [];
    const offersInStore = offersByStore.get(cand.store.id) || [];
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
      if (query.q && query.q.trim()) {
        const qLower = query.q.trim().toLowerCase();
        const isPharmacyQuery = ['apteka', 'dorixona', 'dori', 'pharmacy', 'farm', 'shifo'].some(k => qLower.includes(k));
        const storeIsPharmacy = cand.store.type === 'PHARMACY' ||
          (cand.store.name && ['apteka', 'dorixona', 'pharm', 'shifo', 'farm'].some(k => cand.store.name.toLowerCase().includes(k)));

        const isMarketQuery = ['market', 'supermarket', 'do\'kon', 'dokon', 'savdo', 'baza'].some(k => qLower.includes(k));
        const storeIsMarket = cand.store.type === 'RETAIL' || cand.store.type === 'WHOLESALE' || cand.store.type === 'MIXED';

        const storeMatchesQuery = cand.store.name.toLowerCase().includes(qLower) ||
          (isPharmacyQuery && storeIsPharmacy) ||
          (isMarketQuery && storeIsMarket);

        const matchResult = matchProductQuery(query.q, {
          title: off.variant.title,
          barcode: off.variant.barcode,
          aliases: (off.variant as any).aliases,
          category: off.variant.category,
          brand: off.variant.brand
        });

        if (matchResult.isMatch) {
          storeOffers.push({ offer: off, score: matchResult.score });
        } else if (storeMatchesQuery) {
          storeOffers.push({ offer: off, score: 0.85 });
        }
      } else {
        // No query: all active offers in store match
        storeOffers.push({ offer: off, score: 1.0 });
      }
    }

    if (storeOffers.length > 0) {
      // Sort offers inside store: highest score, then lowest price
      storeOffers.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return Number(a.offer.price) - Number(b.offer.price);
      });

      const matchingOffers = storeOffers.filter(({ offer }) => {
        const key = offer.variant.barcode?.trim()
          ? `barcode:${offer.variant.barcode.trim()}`
          : `variant:${offer.variantId || offer.variant.id || offer.id}`;
        if (assignedProducts.has(key)) return false;
        assignedProducts.add(key);
        return true;
      });
      if (!matchingOffers.length) continue;
      storeAggregates.push({
        store: cand.store,
        distanceM: cand.distanceM,
        isOpenNow: cand.isOpenNow,
        matchingOffers
      });
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
  const startIndex = query.cursor ? parseInt(query.cursor, 10) : 0;
  const pageItems = storeAggregates.slice(startIndex, startIndex + query.limit);
  const nextCursor = startIndex + query.limit < storeAggregates.length ? String(startIndex + query.limit) : null;

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
    totalOffers: assignedProducts.size,
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
