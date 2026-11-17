const fs = require('node:fs');
const path = require('node:path');

const uzumPath = path.resolve(__dirname, '../uzummarket/uzum_delivery_points_yaqintop.json');
const targetSqlPath = path.resolve(__dirname, '../supabase/uzum_delivery_points_seed.sql');
const batchesDir = path.resolve(__dirname, '../supabase/uzum_batches');
const yaqintopDbPath = path.resolve(__dirname, '../apps/api/data/yaqintop_db.json');

if (!fs.existsSync(batchesDir)) {
  fs.mkdirSync(batchesDir, { recursive: true });
}

const points = JSON.parse(fs.readFileSync(uzumPath, 'utf8'));
console.log('Generating Supabase SQL and updating yaqintop_db.json for', points.length, 'Uzum Market delivery points...');

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') return "'" + JSON.stringify(v).replace(/'/g, "''") + "'::jsonb";
  return "'" + String(v).replace(/'/g, "''") + "'";
}

// Unified Uzum Market Organization
const orgId = 'b8000000-0000-4000-8000-000000000001';
const orgName = 'Uzum Market MCHJ (Rasmiy tarqatish tarmog‘i)';
const orgInn = '309999000';
const orgRegion = 'Toshkent shahri';
const orgCity = 'Toshkent shahri';
const orgDistrict = 'Yashnobod tumani';
const orgCreatedAt = '2026-11-15T10:00:00.000Z';

const orgAppData = {
  id: orgId,
  name: orgName,
  inn: orgInn,
  region: orgRegion,
  city: orgCity,
  district: orgDistrict,
  type: 'RETAIL',
  status: 'ACTIVE',
  createdAt: orgCreatedAt
};

// Standard Delivery Variant for Uzum
const variantId = 'b9000000-0000-4000-8000-000000000001';
const variantObj = {
  id: variantId,
  organizationId: orgId,
  title: 'Uzum Market — Buyurtmani qabul qilish va topshirish xizmati',
  brand: 'Uzum Market',
  category: 'Yetkazib berish va topshirish',
  packUnit: 'xizmat',
  barcode: 'UZUM-PVZ-PICKUP',
  sku: 'UZUM-PVZ-01',
  photoUrl: 'https://images.uzum.uz/cg2011ng49devoa8f4gg/original.jpg',
  attributes: {
    brand: 'Uzum Market',
    packSize: '1 buyurtma',
    aliases: ['uzum', 'uzum market', 'pvz', 'topshirish punkti', 'buyurtma', 'pochta']
  }
};

// 1. Generate full seed SQL
let fullSql = '';
fullSql += '-- =========================================================================\n';
fullSql += '-- YAQINTOP: UZUM MARKET TOPSHIRISH PUNKTLARI MIGRATSIYASI (SUPABASE)\n';
fullSql += '-- Dashboard: https://supabase.com/dashboard/project/yvxjqimfxlfifhomduox/sql/new\n';
fullSql += '-- Jami nuqtalar: ' + points.length + ' ta\n';
fullSql += '-- =========================================================================\n\n';
fullSql += 'BEGIN;\n\n';

fullSql += '-- 1. UZUM MARKET ASOSIY TASHKILOTI\n';
fullSql += 'INSERT INTO public.organizations (id, name, inn, type, status, region, city, district, app_data)\n';
fullSql += 'VALUES (' + esc(orgId) + ', ' + esc(orgName) + ', ' + esc(orgInn) + ", 'RETAIL', 'ACTIVE', " + esc(orgRegion) + ', ' + esc(orgCity) + ', ' + esc(orgDistrict) + ', ' + esc(orgAppData) + ')\n';
fullSql += 'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, region = EXCLUDED.region, city = EXCLUDED.city, district = EXCLUDED.district, status = EXCLUDED.status, app_data = EXCLUDED.app_data;\n\n';

fullSql += '-- 2. XIZMAT TURI (VARIANT)\n';
fullSql += 'INSERT INTO public.variants (id, organization_id, name, barcode, sku, category, unit, image_url, attributes, app_data)\n';
fullSql += 'VALUES (' + esc(variantId) + ', ' + esc(orgId) + ', ' + esc(variantObj.title) + ', ' + esc(variantObj.barcode) + ', ' + esc(variantObj.sku) + ', ' + esc(variantObj.category) + ', ' + esc(variantObj.packUnit) + ', ' + esc(variantObj.photoUrl) + ', ' + esc(variantObj.attributes) + ', ' + esc(variantObj) + ')\n';
fullSql += 'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, barcode = EXCLUDED.barcode, attributes = EXCLUDED.attributes, app_data = EXCLUDED.app_data;\n\n';

fullSql += '-- 3. UZUM MARKET PUNKTLARI (STORES)\n';

function generateStoreSql(point, i) {
  const idx = point.originalId || (i + 1);
  const storeId = 'b7000000-0000-4000-8000-' + String(idx).padStart(12, '0');
  const region = point.region || 'Toshkent shahri';
  const city = point.city || region;
  const district = point.city || region;
  const address = point.address || (city + ', ' + region);
  const phone = point.phone || '+998781404040';
  const lat = point.location?.lat || 41.3;
  const lng = point.location?.lng || 69.2;
  const rating = Number(point.rating || 4.9);
  const reviewCount = Number(point.reviewCount || 150);
  const createdAt = point.createdAt || '2026-11-15T10:00:00.000Z';
  const updatedAt = point.updatedAt || '2026-11-15T10:00:00.000Z';
  const hours = point.hours || [
    { dayOfWeek: 0, openTime: '10:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 1, openTime: '10:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 2, openTime: '10:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 3, openTime: '10:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 4, openTime: '10:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 5, openTime: '10:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 6, openTime: '10:00', closeTime: '20:00', isClosed: false }
  ];
  const photos = point.photoUrl ? [point.photoUrl] : [];

  const storeAppData = {
    id: storeId,
    originalId: idx,
    organizationId: orgId,
    name: point.name,
    title: point.title || 'Uzum Market topshirish punkti',
    region: region,
    city: city,
    district: district,
    address: address,
    phone: phone,
    location: { lat, lng },
    rating: rating,
    reviewCount: reviewCount,
    isVerified: true,
    status: 'ACTIVE',
    type: 'RETAIL',
    brand: 'Uzum Market',
    hours: hours,
    photos: photos,
    hasDressingRoom: Boolean(point.hasDressingRoom),
    hasEcoEndpoint: Boolean(point.hasEcoEndpoint),
    acceptReturns: Boolean(point.acceptReturns),
    postPaidEnabled: Boolean(point.postPaidEnabled),
    deliveryPrice: 0,
    source: point.source || 'https://uzum.uz/uz/about/delivery-points',
    createdAt: createdAt,
    updatedAt: updatedAt
  };

  let s = '';
  s += 'INSERT INTO public.stores (id, organization_id, name, address, phone, latitude, longitude, is_active, status, region, district, rating, review_count, photos, working_hours, app_data)\n';
  s += 'VALUES (' + esc(storeId) + ', ' + esc(orgId) + ', ' + esc(point.name) + ', ' + esc(address) + ', ' + esc(phone) + ', ' + lat + ', ' + lng + ', true, ' + esc('ACTIVE') + ', ' + esc(region) + ', ' + esc(district) + ', ' + rating + ', ' + reviewCount + ', ' + esc(photos) + ', ' + esc(hours) + ', ' + esc(storeAppData) + ')\n';
  s += 'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, is_active = EXCLUDED.is_active, status = EXCLUDED.status, region = EXCLUDED.region, district = EXCLUDED.district, app_data = EXCLUDED.app_data;\n';

  const offerId = 'ba000000-0000-4000-8000-' + String(idx).padStart(12, '0');
  const offerAppData = {
    id: offerId,
    storeId: storeId,
    variantId: variantId,
    price: '0',
    currency: 'UZS',
    stockOnHand: 999,
    freshness: 'FRESH',
    status: 'ACTIVE'
  };

  s += 'INSERT INTO public.store_offers (id, store_id, variant_id, price, currency, stock_on_hand, is_available, app_data)\n';
  s += 'VALUES (' + esc(offerId) + ', ' + esc(storeId) + ', ' + esc(variantId) + ", '0', 'UZS', 999, true, " + esc(offerAppData) + ')\n';
  s += 'ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock_on_hand = EXCLUDED.stock_on_hand, is_available = EXCLUDED.is_available, app_data = EXCLUDED.app_data;\n\n';

  return s;
}

points.forEach((point, i) => {
  fullSql += generateStoreSql(point, i);
});

fullSql += 'COMMIT;\n';
fs.writeFileSync(targetSqlPath, fullSql, 'utf8');
console.log('Saved master migration to:', targetSqlPath, '(' + (fullSql.length / 1024 / 1024).toFixed(2) + ' MB)');

// 2. Generate small safe batches (150 stores per batch)
const BATCH_SIZE = 150;
const totalBatches = Math.ceil(points.length / BATCH_SIZE);

for (let b = 0; b < totalBatches; b++) {
  const batchPoints = points.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
  let batchSql = '';
  batchSql += '-- =========================================================================\n';
  batchSql += `-- YAQINTOP: UZUM MARKET MIGRATSIYA BATCH ${b + 1}/${totalBatches}\n`;
  batchSql += `-- Qamrov: ${b * BATCH_SIZE + 1} dan ${Math.min((b + 1) * BATCH_SIZE, points.length)} gacha (${batchPoints.length} ta nuqta)\n`;
  batchSql += '-- Supabase SQL Editor orqali xavfsiz va engil yuklash uchun\n';
  batchSql += '-- =========================================================================\n\n';
  batchSql += 'BEGIN;\n\n';

  // Ensure organization and variant exist
  batchSql += 'INSERT INTO public.organizations (id, name, inn, type, status, region, city, district, app_data)\n';
  batchSql += 'VALUES (' + esc(orgId) + ', ' + esc(orgName) + ', ' + esc(orgInn) + ", 'RETAIL', 'ACTIVE', " + esc(orgRegion) + ', ' + esc(orgCity) + ', ' + esc(orgDistrict) + ', ' + esc(orgAppData) + ')\n';
  batchSql += 'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, region = EXCLUDED.region, city = EXCLUDED.city, district = EXCLUDED.district, status = EXCLUDED.status, app_data = EXCLUDED.app_data;\n\n';

  batchSql += 'INSERT INTO public.variants (id, organization_id, name, barcode, sku, category, unit, image_url, attributes, app_data)\n';
  batchSql += 'VALUES (' + esc(variantId) + ', ' + esc(orgId) + ', ' + esc(variantObj.title) + ', ' + esc(variantObj.barcode) + ', ' + esc(variantObj.sku) + ', ' + esc(variantObj.category) + ', ' + esc(variantObj.packUnit) + ', ' + esc(variantObj.photoUrl) + ', ' + esc(variantObj.attributes) + ', ' + esc(variantObj) + ')\n';
  batchSql += 'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, barcode = EXCLUDED.barcode, attributes = EXCLUDED.attributes, app_data = EXCLUDED.app_data;\n\n';

  batchPoints.forEach((point, i) => {
    const globalIdx = b * BATCH_SIZE + i;
    batchSql += generateStoreSql(point, globalIdx);
  });

  batchSql += 'COMMIT;\n';
  const batchFilePath = path.join(batchesDir, `uzum_batch_${b + 1}.sql`);
  fs.writeFileSync(batchFilePath, batchSql, 'utf8');
}
console.log(`Generated ${totalBatches} safe SQL batches in: ${batchesDir}`);

// 3. Inject Uzum into yaqintop_db.json
if (fs.existsSync(yaqintopDbPath)) {
  console.log('Injecting Uzum points into yaqintop_db.json...');
  const dbData = JSON.parse(fs.readFileSync(yaqintopDbPath, 'utf8'));
  const existingOrgIds = new Set(dbData.organizations.map((x) => x[0]));
  const existingStoreIds = new Set(dbData.stores.map((x) => x[0]));
  const existingVariantIds = new Set(dbData.variants.map((x) => x[0]));
  const existingOfferIds = new Set(dbData.offers.map((x) => x[0]));

  let addedOrgs = 0;
  let addedStores = 0;
  let addedVariants = 0;
  let addedOffers = 0;

  if (!existingOrgIds.has(orgId)) {
    dbData.organizations.push([orgId, orgAppData]);
    existingOrgIds.add(orgId);
    addedOrgs++;
  }

  if (!existingVariantIds.has(variantId)) {
    dbData.variants.push([variantId, variantObj]);
    existingVariantIds.add(variantId);
    addedVariants++;
  }

  points.forEach((point, i) => {
    const idx = point.originalId || (i + 1);
    const storeId = 'b7000000-0000-4000-8000-' + String(idx).padStart(12, '0');
    const region = point.region || 'Toshkent shahri';
    const city = point.city || region;
    const district = point.city || region;
    const address = point.address || (city + ', ' + region);
    const phone = point.phone || '+998781404040';
    const lat = point.location?.lat || 41.3;
    const lng = point.location?.lng || 69.2;
    const rating = Number(point.rating || 4.9);
    const reviewCount = Number(point.reviewCount || 150);

    const storeObj = {
      id: storeId,
      originalId: idx,
      organizationId: orgId,
      name: point.name,
      title: point.title || 'Uzum Market topshirish punkti',
      region: region,
      city: city,
      district: district,
      address: address,
      phone: phone,
      location: { lat, lng },
      rating: rating,
      reviewCount: reviewCount,
      isVerified: true,
      status: 'ACTIVE',
      type: 'RETAIL',
      brand: 'Uzum Market',
      hours: point.hours,
      photos: point.photoUrl ? [point.photoUrl] : [],
      hasDressingRoom: Boolean(point.hasDressingRoom),
      hasEcoEndpoint: Boolean(point.hasEcoEndpoint),
      acceptReturns: Boolean(point.acceptReturns),
      postPaidEnabled: Boolean(point.postPaidEnabled),
      deliveryPrice: 0,
      source: point.source || 'https://uzum.uz/uz/about/delivery-points',
      createdAt: point.createdAt || '2026-11-15T10:00:00.000Z',
      updatedAt: point.updatedAt || '2026-11-15T10:00:00.000Z'
    };

    if (!existingStoreIds.has(storeId)) {
      dbData.stores.push([storeId, storeObj]);
      existingStoreIds.add(storeId);
      addedStores++;
    }

    const offerId = 'ba000000-0000-4000-8000-' + String(idx).padStart(12, '0');
    const offerObj = {
      id: offerId,
      storeId: storeId,
      variantId: variantId,
      price: '0',
      currency: 'UZS',
      stockOnHand: 999,
      freshness: 'FRESH',
      status: 'ACTIVE',
      variant: variantObj
    };

    if (!existingOfferIds.has(offerId)) {
      dbData.offers.push([offerId, offerObj]);
      existingOfferIds.add(offerId);
      addedOffers++;
    }
  });

  fs.writeFileSync(yaqintopDbPath, JSON.stringify(dbData, null, 2), 'utf8');
  console.log(`Updated yaqintop_db.json: +${addedOrgs} orgs, +${addedStores} stores, +${addedVariants} variants, +${addedOffers} offers!`);
  console.log(`Total stores in yaqintop_db.json now: ${dbData.stores.length}`);
}
