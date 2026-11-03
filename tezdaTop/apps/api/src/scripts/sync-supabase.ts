import dotenv from 'dotenv';
dotenv.config();

import { db } from '../db/in-memory-db.js';
import { syncAllFromSupabase } from '../db/supabase.js';

async function main() {
  console.log('--- YaqinTop Supabase Cloud Synchronization Script ---');
  // A cloud database is authoritative; never seed or overwrite it from a stale local file.
  await syncAllFromSupabase(db);
  if (!db.saveToFile()) throw new Error('Could not save the local snapshot');
  console.log('Cloud snapshot downloaded and saved successfully.');
}

main().catch(console.error);
