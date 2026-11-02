import dotenv from 'dotenv';
dotenv.config();

import { db } from '../db/in-memory-db.js';
import { seedDatabase } from '../db/seed.js';
import { syncAllToSupabase } from '../db/supabase.js';

async function main() {
  console.log('--- YaqinTop Supabase Cloud Synchronization Script ---');
  const loaded = db.loadFromFile();
  if (!loaded || db.users.size === 0) {
    console.log('Loading seed data...');
    await seedDatabase();
  } else {
    console.log(`Loaded from disk: ${db.organizations.size} orgs, ${db.users.size} users, ${db.stores.size} stores, ${db.variants.size} variants, ${db.offers.size} offers.`);
  }

  console.log('Uploading all data to Supabase...');
  const success = await syncAllToSupabase(db);
  if (success) {
    console.log('✅ Supabase synchronization successful!');
  } else {
    console.error('❌ Supabase synchronization failed.');
  }
}

main().catch(console.error);
