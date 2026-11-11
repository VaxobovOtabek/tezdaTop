import { db } from '../apps/api/dist/db/in-memory-db.js';
import { seedDatabase, SEED_IDS } from '../apps/api/dist/db/seed.js';
import { projectDatabase } from '../apps/api/dist/db/supabase.js';
import fs from 'node:fs';

async function main() {
  await seedDatabase();
  const proj = projectDatabase(db);

  const sirdaryoOrgs = proj.organizations.filter(o => o.region === 'Sirdaryo viloyati');
  const sirdaryoOrgIds = new Set(sirdaryoOrgs.map(o => o.id));
  const sirdaryoStores = proj.stores.filter(s => sirdaryoOrgIds.has(s.organization_id));
  const sirdaryoStoreIds = new Set(sirdaryoStores.map(s => s.id));
  const sirdaryoOffers = proj.offers.filter(o => sirdaryoStoreIds.has(o.store_id));
  const sirdaryoOfferIds = new Set(sirdaryoOffers.map(o => o.id));
  const sirdaryoVariantIds = new Set(sirdaryoOffers.map(o => o.variant_id));
  const sirdaryoVariants = proj.variants.filter(v => sirdaryoVariantIds.has(v.id));
  const sirdaryoBalances = proj.inventory_balances.filter(b => sirdaryoOfferIds.has(b.id));

  function esc(v) {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (typeof v === 'object') return "'" + JSON.stringify(v).replace(/'/g, "''") + "'::jsonb";
    return "'" + String(v).replace(/'/g, "''") + "'";
  }

  let sql = '-- =========================================================================\n';
  sql += '-- YAREDATOP: SIRDARYO / GULISTON DORIXONALARI VA DORI-DARMONLARI MIGRATSIYASI\n';
  sql += '-- Supabase SQL Editor orqali 1 marta ishga tushiring\n';
  sql += '-- https://supabase.com/dashboard/project/yvxjqimfxlfifhomduox/sql/new\n';
  sql += '-- =========================================================================\n\n';
  sql += 'BEGIN;\n\n';

  // Organizations
  sql += '-- 1. TASHKILOTLAR (ORGANIZATIONS)\n';
  for (const o of sirdaryoOrgs) {
    sql += `INSERT INTO public.organizations (id, name, inn, type, status, region, city, district, app_data)\n`;
    sql += `VALUES (${esc(o.id)}, ${esc(o.name)}, ${esc(o.inn)}, ${esc(o.type)}, ${esc(o.status)}, ${esc(o.region)}, ${esc(o.city)}, ${esc(o.district)}, ${esc(o.app_data)})\n`;
    sql += `ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, region = EXCLUDED.region, city = EXCLUDED.city, district = EXCLUDED.district, status = EXCLUDED.status, app_data = EXCLUDED.app_data;\n\n`;
  }

  // Stores
  sql += '-- 2. DO‘KON VA DORIXONALAR (STORES)\n';
  for (const s of sirdaryoStores) {
    sql += `INSERT INTO public.stores (id, organization_id, name, address, phone, latitude, longitude, is_active, status, region, district, rating, review_count, photos, working_hours, app_data)\n`;
    sql += `VALUES (${esc(s.id)}, ${esc(s.organization_id)}, ${esc(s.name)}, ${esc(s.address)}, ${esc(s.phone)}, ${s.latitude}, ${s.longitude}, ${s.is_active}, ${esc(s.status)}, ${esc(s.region)}, ${esc(s.district)}, ${s.rating}, ${s.review_count}, ${esc(s.photos)}, ${esc(s.working_hours)}, ${esc(s.app_data)})\n`;
    sql += `ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, is_active = EXCLUDED.is_active, status = EXCLUDED.status, region = EXCLUDED.region, district = EXCLUDED.district, app_data = EXCLUDED.app_data;\n\n`;
  }

  // Variants
  sql += '-- 3. TOVAR VA DORILAR (VARIANTS)\n';
  for (const v of sirdaryoVariants) {
    sql += `INSERT INTO public.variants (id, organization_id, name, barcode, sku, category, unit, image_url, attributes, app_data)\n`;
    sql += `VALUES (${esc(v.id)}, ${esc(v.organization_id)}, ${esc(v.name)}, ${esc(v.barcode)}, ${esc(v.sku)}, ${esc(v.category)}, ${esc(v.unit)}, ${esc(v.image_url)}, ${esc(v.attributes)}, ${esc(v.app_data)})\n`;
    sql += `ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, barcode = EXCLUDED.barcode, attributes = EXCLUDED.attributes, app_data = EXCLUDED.app_data;\n\n`;
  }

  // Offers
  sql += '-- 4. NARX VA QOLDIQ TAKLIFLARI (OFFERS)\n';
  for (const off of sirdaryoOffers) {
    sql += `INSERT INTO public.offers (id, store_id, variant_id, price, original_price, currency, stock_on_hand, stock_count, in_stock, is_available, app_data)\n`;
    sql += `VALUES (${esc(off.id)}, ${esc(off.store_id)}, ${esc(off.variant_id)}, ${off.price}, ${off.original_price || 'NULL'}, ${esc(off.currency)}, ${off.stock_on_hand}, ${off.stock_count}, ${off.in_stock}, ${off.is_available}, ${esc(off.app_data)})\n`;
    sql += `ON CONFLICT (store_id, variant_id) DO UPDATE SET price = EXCLUDED.price, stock_on_hand = EXCLUDED.stock_on_hand, stock_count = EXCLUDED.stock_count, in_stock = EXCLUDED.in_stock, is_available = EXCLUDED.is_available, app_data = EXCLUDED.app_data;\n\n`;
  }

  // Balances
  sql += '-- 5. INVENTAR QOLDIG‘I (INVENTORY_BALANCES)\n';
  for (const b of sirdaryoBalances) {
    sql += `INSERT INTO public.inventory_balances (id, store_id, variant_id, quantity, average_unit_cost, version, app_data)\n`;
    sql += `VALUES (${esc(b.id)}, ${esc(b.store_id)}, ${esc(b.variant_id)}, ${b.quantity}, ${b.average_unit_cost}, ${b.version}, ${esc(b.app_data)})\n`;
    sql += `ON CONFLICT (store_id, variant_id) DO UPDATE SET quantity = EXCLUDED.quantity, average_unit_cost = EXCLUDED.average_unit_cost, version = EXCLUDED.version, app_data = EXCLUDED.app_data;\n\n`;
  }

  // Bump version
  sql += '-- 6. KESHNI TOZALASH (VERSION UPDATE)\n';
  sql += 'UPDATE public.app_persistence_state SET version = version + 1 WHERE id;\n\n';
  sql += 'COMMIT;\n';

  fs.writeFileSync('supabase/sirdaryo_pharmacies_seed.sql', sql, 'utf8');
  console.log('✅ supabase/sirdaryo_pharmacies_seed.sql yaratildi! Hajmi:', sql.length, 'bayt.');
}

main().catch(console.error);
