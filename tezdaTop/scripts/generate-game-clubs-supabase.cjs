const fs = require('node:fs');
const path = require('node:path');

const clubsPath = path.resolve(__dirname, '../gameClub/game_clubs_yaqintop.json');
const rawPath = path.resolve(__dirname, '../gameClub/game_clubs_raw.json');
const targetSqlPath = path.resolve(__dirname, '../supabase/game_clubs_seed.sql');
const yaqintopDbPath = path.resolve(__dirname, '../apps/api/data/yaqintop_db.json');

const clubs = JSON.parse(fs.readFileSync(clubsPath, 'utf8'));
console.log('Generating Supabase SQL and updating yaqintop_db.json for', clubs.length, 'game clubs...');

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') return "'" + JSON.stringify(v).replace(/'/g, "''") + "'::jsonb";
  return "'" + String(v).replace(/'/g, "''") + "'";
}

let sql = '';
sql += '-- =========================================================================\n';
sql += '-- YAQINTOP: GAME CLUBS / KIBER SPORT ARENALARI VA XIZMATLARI MIGRATSIYASI\n';
sql += '-- Supabase SQL Editor orqali ishga tushirish uchun\n';
sql += '-- Dashboard: https://supabase.com/dashboard/project/yvxjqimfxlfifhomduox/sql/new\n';
sql += '-- Jami nuqtalar: ' + clubs.length + ' ta\n';
sql += '-- =========================================================================\n\n';
sql += 'BEGIN;\n\n';

sql += '-- 1. GAME CLUB TASHKILOTLARI (ORGANIZATIONS)\n';
clubs.forEach((club, i) => {
  const idx = club.originalId || (i + 1);
  const orgId = 'c8000000-0000-4000-8000-' + String(idx).padStart(12, '0');
  const orgName = club.name + ' MCHJ';
  const inn = '30950' + String(idx).padStart(4, '0');
  const region = club.region?.includes('Sirdaryo') ? 'Sirdaryo viloyati' : (club.region || 'Sirdaryo viloyati');
  const city = club.city || 'Guliston shahri';
  const district = club.district || (city.includes('Guliston') ? 'Guliston shahri' : city);
  const createdAt = club.createdAt || '2026-11-15T10:00:00.000Z';

  const orgAppData = {
    id: orgId,
    name: orgName,
    inn: inn,
    region: region,
    city: city,
    district: district,
    type: 'GAME_CLUB',
    status: 'ACTIVE',
    createdAt: createdAt
  };

  sql += 'INSERT INTO public.organizations (id, name, inn, type, status, region, city, district, app_data)\n';
  sql += 'VALUES (' + esc(orgId) + ', ' + esc(orgName) + ', ' + esc(inn) + ", 'GAME_CLUB', 'ACTIVE', " + esc(region) + ', ' + esc(city) + ', ' + esc(district) + ', ' + esc(orgAppData) + ')\n';
  sql += 'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, region = EXCLUDED.region, city = EXCLUDED.city, district = EXCLUDED.district, status = EXCLUDED.status, app_data = EXCLUDED.app_data;\n\n';
});

sql += '-- 2. GAME CLUB DO‘KONLARI VA ZALLARI (STORES)\n';
clubs.forEach((club, i) => {
  const idx = club.originalId || (i + 1);
  const storeId = 'c7000000-0000-4000-8000-' + String(idx).padStart(12, '0');
  const orgId = 'c8000000-0000-4000-8000-' + String(idx).padStart(12, '0');
  const region = club.region?.includes('Sirdaryo') ? 'Sirdaryo viloyati' : (club.region || 'Sirdaryo viloyati');
  const city = club.city || 'Guliston shahri';
  const district = club.district || (city.includes('Guliston') ? 'Guliston shahri' : city);
  const address = club.address || (city + ', ' + region);
  const phone = club.phone || '+998 90 123 45 67';
  const lat = club.location?.lat || 40.485;
  const lng = club.location?.lng || 68.78;
  const rating = Number(club.rating || 4.8);
  const reviewCount = Number(club.reviewCount || 12);
  const createdAt = club.createdAt || '2026-11-15T10:00:00.000Z';
  const updatedAt = club.updatedAt || '2026-11-15T10:00:00.000Z';
  const hours = club.hours || [
    { dayOfWeek: 0, openTime: "00:00", closeTime: "23:59", isClosed: false },
    { dayOfWeek: 1, openTime: "00:00", closeTime: "23:59", isClosed: false },
    { dayOfWeek: 2, openTime: "00:00", closeTime: "23:59", isClosed: false },
    { dayOfWeek: 3, openTime: "00:00", closeTime: "23:59", isClosed: false },
    { dayOfWeek: 4, openTime: "00:00", closeTime: "23:59", isClosed: false },
    { dayOfWeek: 5, openTime: "00:00", closeTime: "23:59", isClosed: false },
    { dayOfWeek: 6, openTime: "00:00", closeTime: "23:59", isClosed: false }
  ];
  const photos = club.photoUrl ? [club.photoUrl] : [];

  const storeAppData = {
    id: storeId,
    organizationId: orgId,
    name: club.name,
    inn: '30950' + String(idx).padStart(4, '0'),
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
    type: 'GAME_CLUB',
    hours: hours,
    photos: photos,
    amenities: club.amenities || {
      is24Hours: true,
      hasPlaystation: true,
      hasPcGaming: true,
      hasVipRoom: true,
      hasFastFood: true
    },
    googleMapsUrl: club.googleMapsUrl,
    createdAt: createdAt,
    updatedAt: updatedAt
  };

  sql += 'INSERT INTO public.stores (id, organization_id, name, address, phone, latitude, longitude, is_active, status, region, district, rating, review_count, photos, working_hours, app_data)\n';
  sql += 'VALUES (' + esc(storeId) + ', ' + esc(orgId) + ', ' + esc(club.name) + ', ' + esc(address) + ', ' + esc(phone) + ', ' + lat + ', ' + lng + ', true, ' + esc('ACTIVE') + ', ' + esc(region) + ', ' + esc(district) + ', ' + rating + ', ' + reviewCount + ', ' + esc(photos) + ', ' + esc(hours) + ', ' + esc(storeAppData) + ')\n';
  sql += 'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, is_active = EXCLUDED.is_active, status = EXCLUDED.status, region = EXCLUDED.region, district = EXCLUDED.district, app_data = EXCLUDED.app_data;\n\n';
});

sql += '-- 3. GAME CLUB XIZMAT TURLARI (VARIANTS)\n';
const standardVariants = [
  {
    subId: '1111',
    title: 'Kompyuter zali (Standart — Core i5, RTX 3060, 165Hz)',
    brand: 'PC Gaming',
    category: 'PC Gaming',
    unit: 'soat',
    barcode: 'GAME-PC-STD',
    sku: 'GC-PC-01',
    price: 12000,
    photoUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    attributes: { brand: 'PC Gaming', packSize: '1 soat', aliases: ['pc', 'kompyuter', 'dota', 'cs2', 'pubg', 'game club', 'oyun'] }
  },
  {
    subId: '2222',
    title: 'PlayStation 5 zali (DualSense, 4K HDR TV)',
    brand: 'PlayStation',
    category: 'PlayStation',
    unit: 'soat',
    barcode: 'GAME-PS5-STD',
    sku: 'GC-PS-01',
    price: 25000,
    photoUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80',
    attributes: { brand: 'PlayStation', packSize: '1 soat', aliases: ['ps5', 'playstation', 'ps', 'fifa', 'ufc', 'pes', 'joystick'] }
  },
  {
    subId: '3333',
    title: 'VIP Kiber Xona (RTX 4070, 240Hz, HyperX)',
    brand: 'VIP Cyber Arena',
    category: 'VIP Gaming',
    unit: 'soat',
    barcode: 'GAME-VIP-ROOM',
    sku: 'GC-VIP-01',
    price: 20000,
    photoUrl: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&auto=format&fit=crop&q=80',
    attributes: { brand: 'VIP Cyber Arena', packSize: '1 soat', aliases: ['vip', 'vip room', 'alohida xona', 'kiber arena'] }
  }
];

clubs.forEach((club, i) => {
  const idx = club.originalId || (i + 1);
  const storeId = 'c7000000-0000-4000-8000-' + String(idx).padStart(12, '0');
  const orgId = 'c8000000-0000-4000-8000-' + String(idx).padStart(12, '0');

  standardVariants.forEach((v) => {
    const variantId = 'c9000000-' + v.subId + '-4000-8000-' + String(idx).padStart(12, '0');
    const offerId = 'ca000000-' + v.subId + '-4000-8000-' + String(idx).padStart(12, '0');

    const variantAppData = {
      id: variantId,
      organizationId: orgId,
      title: v.title,
      brand: v.brand,
      category: v.category,
      packUnit: v.unit,
      barcode: v.barcode + '-' + idx,
      sku: v.sku + '-' + idx,
      photoUrl: v.photoUrl,
      attributes: v.attributes
    };

    sql += 'INSERT INTO public.variants (id, organization_id, name, barcode, sku, category, unit, image_url, attributes, app_data)\n';
    sql += 'VALUES (' + esc(variantId) + ', ' + esc(orgId) + ', ' + esc(v.title) + ', ' + esc(v.barcode + '-' + idx) + ', ' + esc(v.sku + '-' + idx) + ', ' + esc(v.category) + ', ' + esc(v.unit) + ', ' + esc(v.photoUrl) + ', ' + esc(v.attributes) + ', ' + esc(variantAppData) + ')\n';
    sql += 'ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, attributes = EXCLUDED.attributes, app_data = EXCLUDED.app_data;\n\n';

    const offerAppData = {
      id: offerId,
      storeId: storeId,
      variantId: variantId,
      price: String(v.price),
      currency: 'UZS',
      stockOnHand: 30,
      freshness: 'FRESH',
      status: 'ACTIVE',
      variant: variantAppData
    };

    sql += 'INSERT INTO public.offers (id, store_id, variant_id, price, original_price, currency, stock_on_hand, stock_count, in_stock, is_available, app_data)\n';
    sql += 'VALUES (' + esc(offerId) + ', ' + esc(storeId) + ', ' + esc(variantId) + ', ' + v.price + ', NULL, \'UZS\', 30, 30, true, true, ' + esc(offerAppData) + ')\n';
    sql += 'ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock_on_hand = EXCLUDED.stock_on_hand, is_available = EXCLUDED.is_available, app_data = EXCLUDED.app_data;\n\n';

    const balanceAppData = {
      offerId: offerId,
      onHand: '30',
      averageUnitCost: String(Math.round(v.price * 0.7)),
      lastVerifiedAt: '2026-11-15T10:00:00.000Z',
      version: 1
    };

    sql += 'INSERT INTO public.inventory_balances (id, store_id, variant_id, quantity, average_unit_cost, version, app_data)\n';
    sql += 'VALUES (' + esc(offerId) + ', ' + esc(storeId) + ', ' + esc(variantId) + ', 30, ' + Math.round(v.price * 0.7) + ', 1, ' + esc(balanceAppData) + ')\n';
    sql += 'ON CONFLICT (store_id, variant_id) DO UPDATE SET quantity = EXCLUDED.quantity, average_unit_cost = EXCLUDED.average_unit_cost, version = EXCLUDED.version, app_data = EXCLUDED.app_data;\n\n';
  });
});

sql += '-- 4. KESHNI TOZALASH VA VERSIYANI BIR XIL QILISH (VERSION UPDATE)\n';
sql += 'UPDATE public.app_persistence_state SET version = version + 1 WHERE id;\n\n';
sql += 'COMMIT;\n';

fs.writeFileSync(targetSqlPath, sql, 'utf8');
console.log('Saved Supabase migration to:', targetSqlPath, '(' + (sql.length / 1024).toFixed(1) + ' KB)');

// Now let's also update yaqintop_db.json so local & deployed serverless server includes all 120 game clubs!
if (fs.existsSync(yaqintopDbPath)) {
  console.log('Injecting game clubs into yaqintop_db.json...');
  const dbData = JSON.parse(fs.readFileSync(yaqintopDbPath, 'utf8'));

  const existingStoreIds = new Set(dbData.stores.map(([id]) => id));
  const existingOrgIds = new Set(dbData.organizations.map(([id]) => id));
  const existingVariantIds = new Set(dbData.variants.map(([id]) => id));
  const existingOfferIds = new Set(dbData.offers.map(([id]) => id));

  let addedOrgs = 0;
  let addedStores = 0;
  let addedVariants = 0;
  let addedOffers = 0;

  clubs.forEach((club, i) => {
    const idx = club.originalId || (i + 1);
    const storeId = 'c7000000-0000-4000-8000-' + String(idx).padStart(12, '0');
    const orgId = 'c8000000-0000-4000-8000-' + String(idx).padStart(12, '0');
    const region = club.region?.includes('Sirdaryo') ? 'Sirdaryo viloyati' : (club.region || 'Sirdaryo viloyati');
    const city = club.city || 'Guliston shahri';
    const district = club.district || (city.includes('Guliston') ? 'Guliston shahri' : city);
    const address = club.address || (city + ', ' + region);
    const phone = club.phone || '+998 90 123 45 67';
    const lat = club.location?.lat || 40.485;
    const lng = club.location?.lng || 68.78;
    const rating = Number(club.rating || 4.8);
    const reviewCount = Number(club.reviewCount || 12);
    const createdAt = club.createdAt || '2026-11-15T10:00:00.000Z';
    const updatedAt = club.updatedAt || '2026-11-15T10:00:00.000Z';
    const hours = club.hours || [
      { dayOfWeek: 0, openTime: "00:00", closeTime: "23:59", isClosed: false },
      { dayOfWeek: 1, openTime: "00:00", closeTime: "23:59", isClosed: false },
      { dayOfWeek: 2, openTime: "00:00", closeTime: "23:59", isClosed: false },
      { dayOfWeek: 3, openTime: "00:00", closeTime: "23:59", isClosed: false },
      { dayOfWeek: 4, openTime: "00:00", closeTime: "23:59", isClosed: false },
      { dayOfWeek: 5, openTime: "00:00", closeTime: "23:59", isClosed: false },
      { dayOfWeek: 6, openTime: "00:00", closeTime: "23:59", isClosed: false }
    ];
    const photos = club.photoUrl ? [club.photoUrl] : [];

    if (!existingOrgIds.has(orgId)) {
      const orgObj = {
        id: orgId,
        name: club.name + ' MCHJ',
        inn: '30950' + String(idx).padStart(4, '0'),
        region: region,
        city: city,
        district: district,
        type: 'GAME_CLUB',
        status: 'ACTIVE',
        createdAt: createdAt
      };
      dbData.organizations.push([orgId, orgObj]);
      existingOrgIds.add(orgId);
      addedOrgs++;
    }

    if (!existingStoreIds.has(storeId)) {
      const storeObj = {
        id: storeId,
        organizationId: orgId,
        name: club.name,
        inn: '30950' + String(idx).padStart(4, '0'),
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
        type: 'GAME_CLUB',
        hours: hours,
        photos: photos,
        amenities: club.amenities || {
          is24Hours: true,
          hasPlaystation: true,
          hasPcGaming: true,
          hasVipRoom: true,
          hasFastFood: true
        },
        googleMapsUrl: club.googleMapsUrl,
        createdAt: createdAt,
        updatedAt: updatedAt
      };
      dbData.stores.push([storeId, storeObj]);
      existingStoreIds.add(storeId);
      addedStores++;
    }

    standardVariants.forEach((v) => {
      const variantId = 'c9000000-' + v.subId + '-4000-8000-' + String(idx).padStart(12, '0');
      const offerId = 'ca000000-' + v.subId + '-4000-8000-' + String(idx).padStart(12, '0');

      const variantObj = {
        id: variantId,
        organizationId: orgId,
        title: v.title,
        brand: v.brand,
        category: v.category,
        packUnit: v.unit,
        barcode: v.barcode + '-' + idx,
        sku: v.sku + '-' + idx,
        photoUrl: v.photoUrl,
        attributes: v.attributes
      };

      if (!existingVariantIds.has(variantId)) {
        dbData.variants.push([variantId, variantObj]);
        existingVariantIds.add(variantId);
        addedVariants++;
      }

      const offerObj = {
        id: offerId,
        storeId: storeId,
        variantId: variantId,
        price: String(v.price),
        currency: 'UZS',
        stockOnHand: 30,
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
  });

  fs.writeFileSync(yaqintopDbPath, JSON.stringify(dbData, null, 2), 'utf8');
  console.log(`Updated yaqintop_db.json: +${addedOrgs} orgs, +${addedStores} stores, +${addedVariants} variants, +${addedOffers} offers!`);
  console.log(`Total stores in yaqintop_db.json now: ${dbData.stores.length}`);
}
