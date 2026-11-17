import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import Decimal from 'decimal.js';

process.env.VERCEL = '1';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';

import { db } from '../src/db/in-memory-db.js';
import { seedDatabase, SEED_IDS } from '../src/db/seed.js';
import { createSignedSessionToken } from '../src/services/session.service.js';
import { hashOwnerPassword, verifyOwnerPassword } from '../src/services/owner-onboarding.service.js';
import { parseAndValidateCsv, splitCsvLine, detectDelimiter } from '../../merchant/src/components/CsvProductImportModal.js';
import type { Offer } from '@yaqintop/contracts';

let server: Server;
let origin: string;

beforeAll(async () => {
  vi.stubEnv('VERCEL', '1');
  vi.stubEnv('SUPABASE_URL', '');
  vi.spyOn(db, 'loadFromFile').mockReturnValue(true);
  vi.spyOn(db, 'scheduleSave').mockImplementation(() => {});

  const { default: app, ensureDbInitialized } = await import('../src/server.js');
  await ensureDbInitialized();

  db.users.clear();
  db.stores.clear();
  db.organizations.clear();
  db.offers.clear();
  db.variants.clear();
  db.sessions.clear();
  db.balances.clear();

  await seedDatabase();

  server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  if (address && typeof address === 'object') {
    origin = `http://127.0.0.1:${address.port}`;
  }
});

afterAll(async () => {
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  vi.restoreAllMocks();
});

function getMerchantToken(): string {
  const token = createSignedSessionToken(SEED_IDS.ownerUserId);
  db.sessions.set(token, { userId: SEED_IDS.ownerUserId, createdAt: new Date() });
  return token;
}

describe('Merchant CSV Product Import Specification', () => {
  it('1. Parses CSV with delimiter auto-detection and handles quotes correctly', () => {
    const commaLine = '4780012345678,"Coca Cola, 1.5L",14000,50';
    expect(detectDelimiter(commaLine)).toBe(',');
    const commaCols = splitCsvLine(commaLine, ',');
    expect(commaCols).toEqual(['4780012345678', 'Coca Cola, 1.5L', '14000', '50']);

    const semiLine = '4780099999999;Pepsi 1L;12000;30';
    expect(detectDelimiter(semiLine)).toBe(';');
    const semiCols = splitCsvLine(semiLine, ';');
    expect(semiCols).toEqual(['4780099999999', 'Pepsi 1L', '12000', '30']);
  });

  it('2. Fails parsing and highlights missing columns when required headers are absent', () => {
    const invalidHeaderCsv = 'BARCODE,NOMI,CHAKANA_NARX\r\n4780011111111,Non,3000\r\n';
    const result = parseAndValidateCsv(invalidHeaderCsv, []);

    expect(result.headerError).toBeDefined();
    expect(result.missingColumns).toContain('QOLDIQ');
    expect(result.validRows.length).toBe(0);
  });

  it('3. Validates row-level data and identifies invalid rows, row numbers, and duplicate barcodes', () => {
    const mixedCsv =
      'SHTRIX_KOD,NOMI,CHAKANA_NARX,QOLDIQ\r\n' +
      '4780010000001,Tovar 1,15000,20\r\n' +           // Row 2: valid
      ',Tovar 2 Nomsiz,12000,10\r\n' +                 // Row 3: missing barcode
      '4780010000003,,10000,15\r\n' +                  // Row 4: missing title
      '4780010000004,Tovar 4 Narx Xato,-5000,10\r\n' + // Row 5: negative price
      '4780010000005,Tovar 5 Qoldiq Xato,8000,-3\r\n' +// Row 6: negative stock
      '4780010000001,Tovar 6 Dublikat,16000,25\r\n';   // Row 7: duplicate barcode of row 2

    const result = parseAndValidateCsv(mixedCsv, []);

    expect(result.validRows.length).toBe(1);
    expect(result.validRows[0].rowNumber).toBe(2);
    expect(result.validRows[0].barcode).toBe('4780010000001');

    expect(result.errors.length).toBe(5);

    const errorRows = result.errors.map(e => e.rowNumber);
    expect(errorRows).toContain(3);
    expect(errorRows).toContain(4);
    expect(errorRows).toContain(5);
    expect(errorRows).toContain(6);
    expect(errorRows).toContain(7);

    // Verify duplicate barcode message
    const dupError = result.errors.find(e => e.rowNumber === 7);
    expect(dupError?.message).toContain('takrorlangan');
  });

  it('4. Differentiates between new products and existing products with matching barcodes', () => {
    const existingOffer: Offer = {
      id: 'existing-offer-1',
      storeId: SEED_IDS.navbahorStoreId,
      variantId: 'existing-variant-1',
      variant: {
        id: 'existing-variant-1',
        productId: 'prod-1',
        title: 'Mavjud Snickers 50g',
        packUnit: 'dona',
        barcode: '4780099990001'
      },
      price: '8000.00',
      stockOnHand: 10,
      version: 1,
      status: 'ACTIVE',
      wholesaleTiers: []
    };

    const csvContent =
      'SHTRIX_KOD,NOMI,CHAKANA_NARX,QOLDIQ\r\n' +
      '4780099990001,Snickers 50g Yangi Narx,9500,25\r\n' + // Existing barcode
      '4780099990002,Bounty 55g Yangi Tovar,11000,40\r\n';   // New barcode

    const result = parseAndValidateCsv(csvContent, [existingOffer]);

    expect(result.validRows.length).toBe(2);
    expect(result.existingCount).toBe(1);
    expect(result.newCount).toBe(1);

    const existingRow = result.validRows.find(r => r.barcode === '4780099990001');
    expect(existingRow?.isExisting).toBe(true);

    const newRow = result.validRows.find(r => r.barcode === '4780099990002');
    expect(newRow?.isExisting).toBe(false);
  });

  it('5. Atomic POST /api/v1/merchant/offers/batch rejects batch with invalid rows and makes NO partial changes', async () => {
    const token = getMerchantToken();

    const preOffersCount = Array.from(db.offers.values()).filter(o => o.storeId === SEED_IDS.navbahorStoreId).length;

    const invalidBatch = {
      storeId: SEED_IDS.navbahorStoreId,
      items: [
        { rowNumber: 2, barcode: '4780099990010', title: 'Yaroqli Tovar', price: 15000, stockOnHand: 20 },
        { rowNumber: 3, barcode: '4780099990011', title: 'Xato Tovar', price: -1000, stockOnHand: 10 } // negative price
      ]
    };

    const res = await fetch(`${origin}/api/v1/merchant/offers/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(invalidBatch)
    });

    expect(res.status).toBe(400);
    const data = await res.json() as any;
    expect(data.success).toBe(false);
    expect(data.code).toBe('VALIDATION_FAILED');
    expect(data.errors.length).toBeGreaterThan(0);
    expect(data.errors[0].row).toBe(3);

    // Verify atomic safety: no offers were created
    const postOffersCount = Array.from(db.offers.values()).filter(o => o.storeId === SEED_IDS.navbahorStoreId).length;
    expect(postOffersCount).toBe(preOffersCount);
    expect(db.offers.has('4780099990010')).toBe(false);
  });

  it('6. Rejects batch if merchant attempts to save to an unauthorized store / filial (403)', async () => {
    const token = getMerchantToken();
    const foreignStoreId = '99999999-9999-9999-9999-999999999999';

    const res = await fetch(`${origin}/api/v1/merchant/offers/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        storeId: foreignStoreId,
        items: [
          { rowNumber: 2, barcode: '4780099990020', title: 'Ruxsatsiz Filial Tovar', price: 10000, stockOnHand: 10 }
        ]
      })
    });

    expect(res.status).toBe(403);
  });

  it('7. Successfully saves batch of valid items, creates new offers, and updates existing offers + inventory balances', async () => {
    const token = getMerchantToken();

    // 1. First, create an existing offer in the store
    const existingBarcode = '4780088880001';
    const initRes = await fetch(`${origin}/api/v1/merchant/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        storeId: SEED_IDS.navbahorStoreId,
        barcode: existingBarcode,
        title: 'Qadimgi Shokolad',
        price: '7000.00',
        stockOnHand: 5
      })
    });
    expect(initRes.status).toBe(201);
    const initData = await initRes.json() as any;
    const existingOfferId = initData.offer.id;

    // Check balance before batch
    const preBalance = db.balances.get(existingOfferId);
    expect(preBalance?.onHand.toNumber()).toBe(5);

    // 2. Execute batch import with 1 existing update and 1 new creation
    const newBarcode = '4780088880002';
    const batchPayload = {
      storeId: SEED_IDS.navbahorStoreId,
      items: [
        {
          rowNumber: 2,
          barcode: existingBarcode,
          title: 'Qadimgi Shokolad (Yangilangan)',
          price: 9000,
          stockOnHand: 35
        },
        {
          rowNumber: 3,
          barcode: newBarcode,
          title: 'Yangi Biskvit 200g',
          price: 14500,
          stockOnHand: 50
        }
      ]
    };

    const batchRes = await fetch(`${origin}/api/v1/merchant/offers/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(batchPayload)
    });

    expect(batchRes.status).toBe(200);
    const batchData = await batchRes.json() as any;
    expect(batchData.success).toBe(true);
    expect(batchData.total).toBe(2);
    expect(batchData.createdCount).toBe(1);
    expect(batchData.updatedCount).toBe(1);

    // 3. Verify existing offer is updated
    const updatedOffer = db.offers.get(existingOfferId);
    expect(updatedOffer).toBeDefined();
    expect(Number(updatedOffer?.price)).toBe(9000);
    expect(updatedOffer?.stockOnHand).toBe(35);
    expect(updatedOffer?.status).toBe('ACTIVE');

    // Verify existing inventory balance is updated
    const updatedBalance = db.balances.get(existingOfferId);
    expect(updatedBalance?.onHand.toNumber()).toBe(35);

    // 4. Verify new offer and balance are created
    const storeOffers = Array.from(db.offers.values()).filter(o => o.storeId === SEED_IDS.navbahorStoreId);
    const createdOffer = storeOffers.find(o => o.variant?.barcode === newBarcode);
    expect(createdOffer).toBeDefined();
    expect(createdOffer?.variant.title).toBe('Yangi Biskvit 200g');
    expect(Number(createdOffer?.price)).toBe(14500);
    expect(createdOffer?.stockOnHand).toBe(50);
    expect(createdOffer?.status).toBe('ACTIVE');

    const createdBalance = db.balances.get(createdOffer!.id);
    expect(createdBalance).toBeDefined();
    expect(createdBalance?.onHand.toNumber()).toBe(50);
  });
});
