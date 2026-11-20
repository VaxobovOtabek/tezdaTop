import { Router, Request, Response } from 'express';
import { db } from '../db/in-memory-db.js';
import { calculateDistanceMetres } from '../db/spatial.js';
import { checkStoreIsOpenNow } from '../services/search.service.js';

export const productsRouter = Router();

function getProductImage(title: string, cat?: string) {
  const t = title.toLowerCase();
  if (t.includes('snickers')) {
    return 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&auto=format&fit=crop&q=80';
  }
  if (t.includes('mars')) {
    return 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=500&auto=format&fit=crop&q=80';
  }
  if (t.includes('twix')) {
    return 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80';
  }
  if (t.includes('bounty')) {
    return 'https://images.unsplash.com/photo-1548848221-0c2e497ed557?w=500&auto=format&fit=crop&q=80';
  }
  if (t.includes('cola')) {
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80';
  }
  if (t.includes('nesquik') || t.includes('kakao')) {
    return 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=500&auto=format&fit=crop&q=80';
  }
  if (cat && cat.toLowerCase().includes('ichimlik')) {
    return 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80';
}

productsRouter.get('/', (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').trim().toLowerCase();
    const category = ((req.query.category as string) || '').trim();
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 41.311081;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : 69.240562;

    const productList = [];

    for (const variant of db.variants.values()) {
      if (category && category !== 'Barchasi' && variant.category !== category) {
        continue;
      }

      if (q) {
        const matchTitle = variant.title.toLowerCase().includes(q);
        const matchBrand = variant.brand ? variant.brand.toLowerCase().includes(q) : false;
        const matchCat = variant.category ? variant.category.toLowerCase().includes(q) : false;
        const matchBarcode = variant.barcode ? variant.barcode.includes(q) : false;
        const matchAliases = (variant.aliases || []).some((a: string) => a.toLowerCase().includes(q));
        if (!matchTitle && !matchBrand && !matchCat && !matchBarcode && !matchAliases) {
          continue;
        }
      }

      // Gather active offers & deduplicate per store
      const storeOfferMap = new Map<string, any>();
      for (const off of db.offers.values()) {
        if (off.variantId !== variant.id) continue;
        if (off.status === 'INACTIVE' || off.stockOnHand <= 0) continue;

        const store = db.stores.get(off.storeId);
        if (!store || store.status !== 'ACTIVE') continue;

        const org = db.organizations.get(store.organizationId);
        if (!org || org.status !== 'ACTIVE') continue;

        let targetStore = store;
        let dist = 0;
        if (off.storeId === 'korzinka-main' || store.organizationId === '07916afb-54bf-5551-b8dd-6e88d56c3fae') {
          let closest = store;
          let minDist = Infinity;
          for (const s of db.stores.values()) {
            if (s.organizationId === '07916afb-54bf-5551-b8dd-6e88d56c3fae' && s.status === 'ACTIVE' && s.location) {
              const d = Math.round(calculateDistanceMetres(lat, lng, s.location.lat, s.location.lng));
              if (d < minDist) {
                minDist = d;
                closest = s;
              }
            }
          }
          if (closest) {
            targetStore = closest;
            dist = minDist;
          }
        } else {
          dist = store.location
            ? Math.round(calculateDistanceMetres(lat, lng, store.location.lat, store.location.lng))
            : 0;
        }

        const priceNum = Number(off.price);
        const existing = storeOfferMap.get(targetStore.id);
        if (!existing || priceNum < existing.price) {
          storeOfferMap.set(targetStore.id, {
            offerId: off.id,
            storeId: targetStore.id,
            storeName: targetStore.name,
            storeAddress: targetStore.address,
            storeDistrict: targetStore.district,
            storePhone: targetStore.phone,
            storeType: targetStore.type,
            storeRating: targetStore.rating || 4.5,
            location: targetStore.location,
            price: priceNum,
            stockOnHand: off.stockOnHand,
            wholesaleTiers: off.wholesaleTiers || [],
            distanceM: dist,
            isOpenNow: checkStoreIsOpenNow(targetStore),
            stockVerifiedAt: off.stockVerifiedAt
          });
        }
      }
      const matchingOffers = Array.from(storeOfferMap.values());

      matchingOffers.sort((a, b) => a.price - b.price);

      const minPrice = matchingOffers.length > 0 ? matchingOffers[0].price : 0;
      const maxPrice = matchingOffers.length > 0 ? matchingOffers[matchingOffers.length - 1].price : 0;
      const totalStock = matchingOffers.reduce((sum, o) => sum + o.stockOnHand, 0);

      const discountPercent = Math.min(35, Math.max(12, Math.round((variant.id.charCodeAt(0) % 20) + 12)));
      const originalPrice = minPrice > 0 ? Math.round(minPrice * (1 + discountPercent / 100)) : 0;

      productList.push({
        id: variant.id,
        productId: variant.productId,
        title: variant.title,
        brand: variant.brand || 'Boshqa',
        category: variant.category || 'Oziq-ovqat',
        packSize: variant.packSize,
        packUnit: variant.packUnit || 'dona',
        barcode: variant.barcode,
        sku: variant.sku,
        imageUrl: getProductImage(variant.title, variant.category),
        minPrice,
        maxPrice,
        originalPrice,
        discountPercent,
        totalStock,
        availableStoresCount: matchingOffers.length,
        stores: matchingOffers
      });
    }

    productList.sort((a, b) => b.availableStoresCount - a.availableStoresCount || a.minPrice - b.minPrice);

    res.json({
      items: productList,
      totalCount: productList.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

productsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const param = req.params.id.toLowerCase();
    let variant = db.variants.get(param);
    if (!variant) {
      for (const v of db.variants.values()) {
        const slug = v.title
          .toLowerCase()
          .replace(/[^a-z0-9а-яёўқғҳ]+/gi, '-')
          .replace(/^-+|-+$/g, '');
        if (v.id.toLowerCase() === param || slug === param || v.barcode === param) {
          variant = v;
          break;
        }
      }
    }

    if (!variant) {
      res.status(404).json({ error: 'Mahsulot topilmadi' });
      return;
    }

    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 41.311081;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : 69.240562;

    const storeOfferMap = new Map<string, any>();
    for (const off of db.offers.values()) {
      if (off.variantId !== variant.id) continue;
      if (off.status === 'INACTIVE' || off.stockOnHand <= 0) continue;

      const store = db.stores.get(off.storeId);
      if (!store || store.status !== 'ACTIVE') continue;

      const org = db.organizations.get(store.organizationId);
      if (!org || org.status !== 'ACTIVE') continue;

      let targetStore = store;
      let dist = 0;
      if (off.storeId === 'korzinka-main' || store.organizationId === '07916afb-54bf-5551-b8dd-6e88d56c3fae') {
        let closest = store;
        let minDist = Infinity;
        for (const s of db.stores.values()) {
          if (s.organizationId === '07916afb-54bf-5551-b8dd-6e88d56c3fae' && s.status === 'ACTIVE' && s.location) {
            const d = Math.round(calculateDistanceMetres(lat, lng, s.location.lat, s.location.lng));
            if (d < minDist) {
              minDist = d;
              closest = s;
            }
          }
        }
        if (closest) {
          targetStore = closest;
          dist = minDist;
        }
      } else {
        dist = store.location
          ? Math.round(calculateDistanceMetres(lat, lng, store.location.lat, store.location.lng))
          : 0;
      }

      const priceNum = Number(off.price);
      const existing = storeOfferMap.get(targetStore.id);
      if (!existing || priceNum < existing.price) {
        storeOfferMap.set(targetStore.id, {
          offerId: off.id,
          storeId: targetStore.id,
          storeName: targetStore.name,
          storeAddress: targetStore.address,
          storeDistrict: targetStore.district,
          storePhone: targetStore.phone,
          storeType: targetStore.type,
          storeRating: targetStore.rating || 4.5,
          location: targetStore.location,
          price: priceNum,
          stockOnHand: off.stockOnHand,
          wholesaleTiers: off.wholesaleTiers || [],
          distanceM: dist,
          isOpenNow: checkStoreIsOpenNow(targetStore),
          stockVerifiedAt: off.stockVerifiedAt
        });
      }
    }

    const matchingOffers = Array.from(storeOfferMap.values());
    matchingOffers.sort((a, b) => a.price - b.price);

    const minPrice = matchingOffers.length > 0 ? matchingOffers[0].price : 0;
    const maxPrice = matchingOffers.length > 0 ? matchingOffers[matchingOffers.length - 1].price : 0;
    const totalStock = matchingOffers.reduce((sum, o) => sum + o.stockOnHand, 0);

    const discountPercent = Math.min(35, Math.max(12, Math.round((variant.id.charCodeAt(0) % 20) + 12)));
    const originalPrice = minPrice > 0 ? Math.round(minPrice * (1 + discountPercent / 100)) : 0;

    // Alternative / Similar products in the same category or brand
    const similarProducts = [];
    for (const altVariant of db.variants.values()) {
      if (altVariant.id === variant.id) continue;

      const isSameCategory = altVariant.category && variant.category && altVariant.category === variant.category;
      const isSameBrand = altVariant.brand && variant.brand && altVariant.brand === variant.brand;

      const altOffersMap = new Map<string, any>();
      for (const off of db.offers.values()) {
        if (off.variantId !== altVariant.id) continue;
        if (off.status === 'INACTIVE' || off.stockOnHand <= 0) continue;
        const s = db.stores.get(off.storeId);
        if (!s || s.status !== 'ACTIVE') continue;
        const org = db.organizations.get(s.organizationId);
        if (!org || org.status !== 'ACTIVE') continue;

        const pNum = Number(off.price);
        const ex = altOffersMap.get(s.id);
        if (!ex || pNum < ex.price) {
          altOffersMap.set(s.id, {
            offerId: off.id,
            storeId: s.id,
            storeName: s.name,
            price: pNum,
            stockOnHand: off.stockOnHand,
            location: s.location
          });
        }
      }

      const altOffers = Array.from(altOffersMap.values());
      altOffers.sort((a, b) => a.price - b.price);
      const altMinPrice = altOffers.length > 0 ? altOffers[0].price : 0;
      const altMaxPrice = altOffers.length > 0 ? altOffers[altOffers.length - 1].price : 0;
      const altStock = altOffers.reduce((sum, o) => sum + o.stockOnHand, 0);

      let relevance = 0;
      if (isSameCategory) relevance += 3;
      if (isSameBrand) relevance += 2;
      if (altOffers.length > 0) relevance += 1;

      similarProducts.push({
        id: altVariant.id,
        productId: altVariant.productId,
        title: altVariant.title,
        brand: altVariant.brand || 'Boshqa',
        category: altVariant.category || 'Oziq-ovqat',
        packSize: altVariant.packSize,
        packUnit: altVariant.packUnit || 'dona',
        barcode: altVariant.barcode,
        sku: altVariant.sku,
        imageUrl: getProductImage(altVariant.title, altVariant.category),
        minPrice: altMinPrice,
        maxPrice: altMaxPrice,
        totalStock: altStock,
        availableStoresCount: altOffers.length,
        stores: altOffers,
        relevance
      });
    }

    similarProducts.sort((a, b) => b.relevance - a.relevance || b.availableStoresCount - a.availableStoresCount);

    res.json({
      product: {
        id: variant.id,
        productId: variant.productId,
        title: variant.title,
        brand: variant.brand || 'Boshqa',
        category: variant.category || 'Oziq-ovqat',
        packSize: variant.packSize,
        packUnit: variant.packUnit || 'dona',
        barcode: variant.barcode,
        sku: variant.sku,
        imageUrl: getProductImage(variant.title, variant.category),
        minPrice,
        maxPrice,
        originalPrice,
        discountPercent,
        totalStock,
        availableStoresCount: matchingOffers.length,
        stores: matchingOffers,
        similarProducts: similarProducts.slice(0, 8)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
