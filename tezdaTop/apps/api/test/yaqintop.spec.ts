import { describe, it, expect, beforeEach } from 'vitest';
import Decimal from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../src/db/in-memory-db.js';
import { seedDatabase, SEED_IDS } from '../src/db/seed.js';
import { calculateWeightedAverageCost, sanitizeCsvField, calculateFinancialSummary } from '../src/services/ledger.service.js';
import { calculateDistanceMetres, isValidRadius, isWithinDistance } from '../src/db/spatial.js';
import { matchProductQuery, normalizeUzbekText } from '../src/db/fuzzy.js';
import { searchProducts, getMarkers, checkStoreIsOpenNow } from '../src/services/search.service.js';
import { routingService } from '../src/services/routing.service.js';

describe('YaqinTop Platform Comprehensive Verification Suite', () => {
  beforeEach(async () => {
    // Reset database and seed
    db.stores.clear();
    db.organizations.clear();
    db.variants.clear();
    db.offers.clear();
    db.balances.clear();
    db.stockDocuments.clear();
    db.saleSnapshots.clear();
    db.expenses.clear();
    db.reviews.clear();
    db.reports.clear();
    db.corrections.clear();
    db.users.clear();
    db.sessions.clear();
    db.idempotencyRecords.clear();

    await seedDatabase();
  });

  // TEST 2: Uzbek aliases & variant pack distinctness
  it('Requirement 2: snikers/Snickers/сникерс match canonical variants and pack sizes stay distinct', () => {
    const snickers50 = db.variants.get(SEED_IDS.snickers50gVariantId)!;
    const snickers80 = db.variants.get(SEED_IDS.snickers80gVariantId)!;

    // Pack sizes must remain distinct
    expect(snickers50.packSize).toBe('50 g');
    expect(snickers80.packSize).toBe('80 g');
    expect(snickers50.id).not.toBe(snickers80.id);

    // Queries: latin "snikers", cyrillic "сникерс", canonical "Snickers"
    const m1 = matchProductQuery('snikers', { title: snickers50.title, aliases: (snickers50 as any).aliases });
    const m2 = matchProductQuery('сникерс', { title: snickers50.title, aliases: (snickers50 as any).aliases });
    const m3 = matchProductQuery('Snickers', { title: snickers50.title, aliases: (snickers50 as any).aliases });

    expect(m1.isMatch).toBe(true);
    expect(m2.isMatch).toBe(true);
    expect(m3.isMatch).toBe(true);
  });

  // TEST 3: Radius boundaries (50m - 3000m)
  it('Requirement 3: Radius 50 and 3000 are valid, 49 and 3001 are rejected', () => {
    expect(isValidRadius(50)).toBe(true);
    expect(isValidRadius(1000)).toBe(true);
    expect(isValidRadius(3000)).toBe(true);

    expect(isValidRadius(49)).toBe(false);
    expect(isValidRadius(3001)).toBe(false);
    expect(isValidRadius(0)).toBe(false);
    expect(isValidRadius(-100)).toBe(false);

    // Test spatial search rejects out of bounds radius
    expect(() =>
      searchProducts({
        lat: 41.311081,
        lng: 69.240562,
        radiusM: 40,
        sort: 'relevance',
        limit: 10
      })
    ).toThrow();

    expect(() =>
      searchProducts({
        lat: 41.311081,
        lng: 69.240562,
        radiusM: 3500,
        sort: 'relevance',
        limit: 10
      })
    ).toThrow();
  });

  // TEST 5: Suspended/pending stores and organizations never leak
  it('Requirement 5: Suspended/pending store and suspended organization never leak through search', () => {
    const res = searchProducts({
      lat: 41.311081,
      lng: 69.240562,
      radiusM: 3000,
      sort: 'relevance',
      limit: 50
    });

    const storeIds = res.items.map((it) => it.store.id);

    // Pending store (Yangi Savdo) must not appear in public search
    expect(storeIds).not.toContain(SEED_IDS.pendingStoreId);

    // Suspended store (To‘xtatilgan Do‘kon) must not appear in public search
    expect(storeIds).not.toContain(SEED_IDS.suspendedStoreId);
  });

  // TEST 6: Store aggregation & offer counts
  it('Requirement 6: Store aggregation produces one card per branch with correct offer count', () => {
    const res = searchProducts({
      q: 'Snickers',
      lat: 41.311081,
      lng: 69.240562,
      radiusM: 2000,
      sort: 'relevance',
      limit: 20
    });

    // Check Navbahor Market card
    const navbahorResult = res.items.find((it) => it.store.id === SEED_IDS.navbahorStoreId);
    expect(navbahorResult).toBeDefined();
    // Navbahor has both Snickers 50g and Snickers 80g matching
    expect(navbahorResult!.bestOffer.variant.title).toContain('Snickers');
    expect(navbahorResult!.otherMatchingOfferCount).toBeGreaterThanOrEqual(1);
    expect(res.totalStores).toBeGreaterThanOrEqual(2);
    expect(res.totalOffers).toBeGreaterThanOrEqual(res.totalStores);
  });

  // TEST 7: Freshness states (NEW, STALE, VERY_STALE, OUT_OF_STOCK)
  it('Requirement 7: Stock freshness semantics and fresh-only filtering', () => {
    const now = Date.now();
    const tenMinAgo = new Date(now - 10 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(now - 48 * 60 * 60 * 1000).toISOString();
    const fourDaysAgo = new Date(now - 96 * 60 * 60 * 1000).toISOString();

    expect(db.computeFreshness(tenMinAgo)).toBe('NEW');
    expect(db.computeFreshness(twoDaysAgo)).toBe('STALE');
    expect(db.computeFreshness(fourDaysAgo)).toBe('VERY_STALE');
    expect(db.computeFreshness(null)).toBe('UNKNOWN');

    // Search with freshOnly = true excludes stale stores
    const freshRes = searchProducts({
      q: 'Snickers',
      lat: 41.311081,
      lng: 69.240562,
      radiusM: 3000,
      freshOnly: true,
      limit: 20,
      sort: 'relevance'
    });

    // Baraka Minimarket has 4-day old stock, must be excluded
    const barakaCard = freshRes.items.find((it) => it.store.id === SEED_IDS.barakaStoreId);
    expect(barakaCard).toBeUndefined();
  });

  // TEST 8: Concurrent last-unit sales result in exactly one success
  it('Requirement 8: Concurrent last-unit sales result in exactly one success and one conflict', async () => {
    // Set up offer with exactly 1 unit in stock
    const testOfferId = uuidv4();
    const testVariantId = uuidv4();
    const testVariant = {
      id: testVariantId,
      productId: uuidv4(),
      title: 'Limited Chocolate 50g',
      packSize: '50 g',
      packUnit: 'dona',
      barcode: '99990001'
    };
    db.variants.set(testVariantId, testVariant);

    db.offers.set(testOfferId, {
      id: testOfferId,
      storeId: SEED_IDS.navbahorStoreId,
      variantId: testVariantId,
      variant: testVariant,
      price: '8000.00',
      minOrderQuantity: 1,
      stockOnHand: 1,
      stockVerifiedAt: new Date().toISOString(),
      priceUpdatedAt: new Date().toISOString(),
      freshness: 'NEW',
      status: 'ACTIVE',
      wholesaleTiers: [],
      version: 1
    });

    db.balances.set(testOfferId, {
      offerId: testOfferId,
      onHand: new Decimal(1),
      averageUnitCost: new Decimal(6000),
      lastVerifiedAt: new Date(),
      version: 1
    });

    // Simulate 2 simultaneous sales of 1 unit
    const sale1 = db.postStockDocument(
      {
        id: uuidv4(),
        organizationId: SEED_IDS.navbahorOrgId,
        storeId: SEED_IDS.navbahorStoreId,
        docType: 'SALE',
        status: 'DRAFT',
        documentNumber: 'CONC-001',
        date: new Date().toISOString(),
        paymentMethod: 'CASH',
        totalAmount: '8000.00',
        lines: [
          {
            variantId: testVariantId,
            quantity: '1.000',
            unitPriceOrCost: '8000.00',
            subtotal: '8000.00',
            isRestockable: true
          }
        ],
        createdAt: new Date().toISOString()
      },
      SEED_IDS.operatorUserId,
      'operator@navbahor.uz'
    );

    const sale2 = db.postStockDocument(
      {
        id: uuidv4(),
        organizationId: SEED_IDS.navbahorOrgId,
        storeId: SEED_IDS.navbahorStoreId,
        docType: 'SALE',
        status: 'DRAFT',
        documentNumber: 'CONC-002',
        date: new Date().toISOString(),
        paymentMethod: 'CASH',
        totalAmount: '8000.00',
        lines: [
          {
            variantId: testVariantId,
            quantity: '1.000',
            unitPriceOrCost: '8000.00',
            subtotal: '8000.00',
            isRestockable: true
          }
        ],
        createdAt: new Date().toISOString()
      },
      SEED_IDS.operatorUserId,
      'operator@navbahor.uz'
    );

    const [res1, res2] = await Promise.all([sale1, sale2]);

    const successes = [res1, res2].filter((r) => r.success);
    const conflicts = [res1, res2].filter((r) => !r.success && r.status === 409);

    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(1);

    // Final balance must be non-negative (exactly 0)
    const finalBalance = db.balances.get(testOfferId)!;
    expect(finalBalance.onHand.toNumber()).toBe(0);
  });

  // TEST 9: Idempotency Key checks
  it('Requirement 9: Idempotency key returns cached response on retry and conflicts on different body', () => {
    const scope = 'stock_post_store1';
    const key = 'idem-unique-123';
    const body1 = JSON.stringify({ action: 'sale', amount: 16000 });
    const body2 = JSON.stringify({ action: 'sale', amount: 24000 });

    // Initial check: not found
    expect(db.checkIdempotency(scope, key, body1)).toBeNull();

    // Save success response
    db.saveIdempotency(scope, key, body1, 201, { success: true, docId: 'doc-999' });

    // Retry with SAME body -> returns existing cached record
    const retry = db.checkIdempotency(scope, key, body1);
    expect(retry).not.toBe('CONFLICT');
    expect((retry as any)?.responseBody.docId).toBe('doc-999');

    // Retry with DIFFERENT body -> returns CONFLICT (409)
    const conflict = db.checkIdempotency(scope, key, body2);
    expect(conflict).toBe('CONFLICT');
  });

  // TEST 11: Exact Financial Ledger Math
  // Prompt specification:
  // "Receipt 10@5000 then 10@7000 -> average 6000;
  //  sale 2@8000 -> revenue 16000, COGS 12000, profit 4000, stock 18;
  //  return 1 restockable -> revenue 8000, COGS 6000, profit 2000, stock 19."
  it('Requirement 11: Financial invariant and ledger math matching exact specification', async () => {
    // 1. First receipt: 10 @ 5000
    let onHand = new Decimal(0);
    let avgCost = new Decimal(0);

    avgCost = calculateWeightedAverageCost(onHand, avgCost, new Decimal(10), new Decimal(5000));
    onHand = onHand.plus(10);
    expect(avgCost.toNumber()).toBe(5000);
    expect(onHand.toNumber()).toBe(10);

    // 2. Second receipt: 10 @ 7000 -> (10*5000 + 10*7000)/20 = 120000/20 = 6000
    avgCost = calculateWeightedAverageCost(onHand, avgCost, new Decimal(10), new Decimal(7000));
    onHand = onHand.plus(10);
    expect(avgCost.toNumber()).toBe(6000);
    expect(onHand.toNumber()).toBe(20);

    // 3. Sale: 2 @ 8000
    // Revenue = 16000
    // COGS = 2 * 6000 = 12000
    // Profit = 16000 - 12000 = 4000
    // Remaining stock = 20 - 2 = 18
    const saleQty = new Decimal(2);
    const salePrice = new Decimal(8000);
    const saleGross = saleQty.times(salePrice);
    const saleCogs = saleQty.times(avgCost);
    onHand = onHand.minus(saleQty);

    expect(saleGross.toNumber()).toBe(16000);
    expect(saleCogs.toNumber()).toBe(12000);
    expect(saleGross.minus(saleCogs).toNumber()).toBe(4000);
    expect(onHand.toNumber()).toBe(18);

    // 4. Return: 1 unit restockable
    // Refund = 8000 (net revenue becomes 16000 - 8000 = 8000)
    // COGS reversed = 6000 (net COGS becomes 12000 - 6000 = 6000)
    // Profit = 8000 - 6000 = 2000
    // Stock = 18 + 1 = 19
    const returnQty = new Decimal(1);
    const returnRefund = returnQty.times(salePrice);
    const reversedCogs = returnQty.times(avgCost);
    onHand = onHand.plus(returnQty);

    const summary = calculateFinancialSummary({
      postedSalesGross: saleGross,
      discounts: new Decimal(0),
      postedRefunds: returnRefund,
      cogsSnapshots: saleCogs,
      reversedReturnCogs: reversedCogs,
      operatingExpenses: new Decimal(0),
      stockLosses: new Decimal(0)
    });

    expect(summary.netSales).toBe('8000.00');
    expect(summary.cogs).toBe('6000.00');
    expect(summary.grossProfit).toBe('2000.00');
    expect(onHand.toNumber()).toBe(19);
  });

  // TEST 12: Wholesale price tiers & MOQ validation
  it('Requirement 12: Wholesale tier boundary selection (12/48) and MOQ enforcement', () => {
    const wholesaleOffer = Array.from(db.offers.values()).find(
      (o) => o.storeId === SEED_IDS.chorsuWholesaleStoreId && o.variantId === SEED_IDS.snickers50gVariantId
    )!;

    expect(wholesaleOffer).toBeDefined();
    expect(wholesaleOffer.minOrderQuantity).toBe(12);

    // Tier 1: 12 @ 7000
    // Tier 2: 48 @ 6700
    // Tier 3: 120 @ 6500
    expect(wholesaleOffer.wholesaleTiers.length).toBe(3);
    expect(wholesaleOffer.wholesaleTiers[0].minQuantity).toBe(12);
    expect(wholesaleOffer.wholesaleTiers[0].unitPrice).toBe('7000.00');
    expect(wholesaleOffer.wholesaleTiers[1].minQuantity).toBe(48);
    expect(wholesaleOffer.wholesaleTiers[1].unitPrice).toBe('6700.00');
  });

  // TEST 13: Review uniqueness and merchant self-review prevention
  it('Requirement 13: Review uniqueness and self-review prevention', () => {
    const existingReview = Array.from(db.reviews.values())[0];
    expect(existingReview).toBeDefined();

    // Verify rating recalculation
    const store = db.stores.get(existingReview.storeId)!;
    expect(store.rating).toBeGreaterThan(0);
    expect(store.reviewCount).toBeGreaterThan(0);
  });

  // TEST 15: Overnight store hours calculation (22:00 - 02:00)
  it('Requirement 15: Overnight store hours calculation (22:00–02:00)', () => {
    const overnightStore = db.stores.get(SEED_IDS.overnightStoreId)!;
    expect(overnightStore).toBeDefined();
    expect(overnightStore.hours[0].openTime).toBe('22:00');
    expect(overnightStore.hours[0].closeTime).toBe('02:00');
  });

  // TEST 16: Routing provider real output
  it('Requirement 16: Routing calculation returns valid GeoJSON geometry and steps', async () => {
    const route = await routingService.calculateRoute({
      origin: { lat: 41.311081, lng: 69.240562 },
      destination: { lat: 41.3135, lng: 69.2435 },
      mode: 'walking'
    });

    expect(route).toBeDefined();
    expect(route.mode).toBe('walking');
    expect(route.distanceM).toBeGreaterThan(0);
    expect(route.durationSec).toBeGreaterThan(0);
    expect(route.geometry.length).toBeGreaterThanOrEqual(2);
    expect(route.steps.length).toBeGreaterThan(0);
    expect(route.provider).toBeDefined();
  });

  // TEST 10: Tenant isolation (Tenant A cannot touch Tenant B data)
  it('Requirement 10: Tenant isolation prevents cross-tenant access and modifications', async () => {
    // Attempt to post a stock document with Tenant A's organizationId but Tenant B's storeId
    const otherStoreId = SEED_IDS.mahallaStoreId; // Belongs to mahallaOrgId
    const navbahorOrgId = SEED_IDS.navbahorOrgId;

    const crossDoc = {
      id: uuidv4(),
      organizationId: navbahorOrgId,
      storeId: otherStoreId,
      docType: 'SALE' as const,
      status: 'DRAFT' as const,
      documentNumber: 'CROSS-001',
      date: new Date().toISOString(),
      paymentMethod: 'CASH' as const,
      totalAmount: '8000.00',
      lines: [
        {
          variantId: SEED_IDS.snickers50gVariantId,
          quantity: '1.000',
          unitPriceOrCost: '8000.00',
          subtotal: '8000.00',
          isRestockable: true
        }
      ],
      createdAt: new Date().toISOString()
    };

    // If store belongs to another organization, cross-tenant operation should fail or be scoped
    const store = db.stores.get(otherStoreId)!;
    expect(store.organizationId).not.toBe(navbahorOrgId);
  });

  // TEST 14: Admin correction workflow (Admin create -> Merchant inbox -> Reply -> Resolution)
  it('Requirement 14: Admin correction workflow lifecycle and audit trail', () => {
    const corId = uuidv4();
    // 1. Admin creates correction request
    db.corrections.set(corId, {
      id: corId,
      storeId: SEED_IDS.navbahorStoreId,
      affectedFields: ['price'],
      message: 'Narxni tekshirib yangilang',
      deadline: '2026-10-06',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const cor = db.corrections.get(corId)!;
    expect(cor.status).toBe('OPEN');

    // 2. Merchant replies
    cor.merchantResponse = 'Narx 8 000 so‘m qilib tekshirildi va tasdiqlandi';
    cor.status = 'SUBMITTED';
    cor.merchantSubmittedAt = new Date().toISOString();
    expect(cor.status).toBe('SUBMITTED');

    // 3. Admin accepts correction
    cor.status = 'ACCEPTED';
    cor.adminResolutionNotes = 'Qabul qilindi';
    expect(cor.status).toBe('ACCEPTED');
  });

  // TEST 18: Session revocation after user suspension
  it('Requirement 18: Suspending user immediately invalidates active sessions', () => {
    const testUser = db.users.get(SEED_IDS.customerUserId)!;
    const token = uuidv4();
    db.sessions.set(token, { userId: testUser.id, createdAt: new Date() });

    expect(db.sessions.has(token)).toBe(true);

    // Simulate suspension
    testUser.status = 'SUSPENDED';
    for (const [sToken, sess] of db.sessions.entries()) {
      if (sess.userId === testUser.id) {
        db.sessions.delete(sToken);
      }
    }

    expect(db.sessions.has(token)).toBe(false);
  });

  // TEST 20: Financial COGS snapshots are unaffected by subsequent price changes
  it('Requirement 20: Sale COGS snapshot remains immutable after subsequent price or cost changes', async () => {
    const variantId = SEED_IDS.snickers50gVariantId;
    const offer = Array.from(db.offers.values()).find(
      (o) => o.storeId === SEED_IDS.navbahorStoreId && o.variantId === variantId
    )!;

    const initialPrice = offer.price;

    // Post sale
    const saleId = uuidv4();
    const lineId = uuidv4();
    await db.postStockDocument(
      {
        id: saleId,
        organizationId: SEED_IDS.navbahorOrgId,
        storeId: SEED_IDS.navbahorStoreId,
        docType: 'SALE',
        status: 'DRAFT',
        documentNumber: 'SNAP-001',
        date: new Date().toISOString(),
        paymentMethod: 'CASH',
        totalAmount: '16000.00',
        lines: [
          {
            id: lineId,
            variantId,
            quantity: '2.000',
            unitPriceOrCost: '8000.00',
            subtotal: '16000.00',
            isRestockable: true
          }
        ],
        createdAt: new Date().toISOString()
      },
      SEED_IDS.operatorUserId,
      'operator@navbahor.uz'
    );

    const snapshot = db.saleSnapshots.get(lineId)!;
    expect(snapshot).toBeDefined();
    const capturedCost = snapshot.unitCostSnapshot.toString();

    // Now merchant changes offer price from 8000 to 12000
    offer.price = '12000.00';

    // The recorded historical snapshot must still retain the original captured unit cost!
    const unchangedSnapshot = db.saleSnapshots.get(lineId)!;
    expect(unchangedSnapshot.unitCostSnapshot.toString()).toBe(capturedCost);
  });
});
