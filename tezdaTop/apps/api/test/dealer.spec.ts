import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { db } from '../src/db/in-memory-db.js';
import { seedDatabase, SEED_IDS } from '../src/db/seed.js';

let server: Server;
let origin: string;

beforeAll(async () => {
  vi.stubEnv('VERCEL', '1');
  vi.spyOn(db, 'loadFromFile').mockReturnValue(true);
  vi.spyOn(db, 'scheduleSave').mockImplementation(() => {});

  db.users.clear();
  db.stores.clear();
  db.dealers.clear();
  db.dealerStores.clear();
  db.dealerProducts.clear();
  db.supplyOrders.clear();
  db.debtTransactions.clear();
  db.offers.clear();
  db.variants.clear();
  db.sessions.clear();

  await seedDatabase();

  const { default: app } = await import('../src/server.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server unavailable');
  origin = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('YaqinTop Dealer & B2B Distribution Module Specification', { timeout: 25000 }, () => {
  async function loginAsDealer() {
    const res = await fetch(`${origin}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'diller@yaqintop.uz', password: 'DemoPass123!' })
    });
    const data = await res.json() as any;
    expect(res.status).toBe(200);
    expect(data.token).toBeDefined();
    expect(data.user.role).toBe('DEALER');
    expect(data.user.dealer).toBeDefined();
    return data.token;
  }

  async function loginAsAdmin() {
    const res = await fetch(`${origin}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@yaqintop.uz', password: 'DemoPass123!' })
    });
    const data = await res.json() as any;
    expect(res.status).toBe(200);
    return data.token;
  }

  it('1. Dealer profile and stores listing with color-coded debt status', async () => {
    const token = await loginAsDealer();

    // Profile
    const meRes = await fetch(`${origin}/api/v1/dealer/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const meData = await meRes.json() as any;
    expect(meRes.status).toBe(200);
    expect(meData.companyName).toBe('Toshkent Distribyutsiya MCHJ');
    expect(meData.allowExperimentalMap).toBe(true);

    // Stores
    const storesRes = await fetch(`${origin}/api/v1/dealer/stores`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const storesData = await storesRes.json() as any;
    expect(storesRes.status).toBe(200);
    expect(storesData.stores.length).toBeGreaterThanOrEqual(3);

    // Check color statuses
    const zeroDebtStore = storesData.stores.find((s: any) => s.currentDebtBalance === 0);
    expect(zeroDebtStore?.debtStatus).toBe('GREEN');

    const highDebtStore = storesData.stores.find((s: any) => s.currentDebtBalance > s.creditLimit);
    expect(highDebtStore?.debtStatus).toBe('RED');
  });

  it('2. Create supply order (nakladnoy) with partial payment, debt accumulation, and B2C sync', async () => {
    const token = await loginAsDealer();

    // Get products and stores
    const prodsRes = await fetch(`${origin}/api/v1/dealer/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const prodsData = await prodsRes.json() as any;
    expect(prodsRes.status).toBe(200);
    const prod = prodsData.products[0];
    expect(prod).toBeDefined();

    // Target store: Mahalla Savdo (initial debt 0)
    const storeId = SEED_IDS.mahallaStoreId;

    // Issue supply order: 10 units at wholesale price, paid 0 (total into debt)
    const supplyRes = await fetch(`${origin}/api/v1/dealer/supplies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        storeId,
        items: [
          { productId: prod.id, quantity: 10, unitPrice: prod.wholesalePrice }
        ],
        paidAmount: 0,
        paymentType: 'DEBT',
        notes: 'Yangi partiya yetkazildi'
      })
    });

    const supplyData = await supplyRes.json() as any;
    expect(supplyRes.status).toBe(201);
    expect(supplyData.order.orderNumber).toMatch(/^NAK-/);
    const expectedDebt = prod.wholesalePrice * 10;
    expect(supplyData.currentDebtBalance).toBe(expectedDebt);

    // B2C Synchronization Check:
    // Store should now have the offer active with stock
    const offer = Array.from(db.offers.values()).find(o => o.storeId === storeId);
    expect(offer).toBeDefined();
    expect(offer?.status).toBe('ACTIVE');
    expect(Number(offer?.stockOnHand)).toBeGreaterThanOrEqual(10);
  });

  it('3. Cash collection (inkassatsiya) and Akt Sverka verification', async () => {
    const token = await loginAsDealer();
    const storeId = SEED_IDS.navbahorStoreId;

    // Navbahor initial debt was 4,500,000
    // Pay 2,000,000 via inkassatsiya
    const payRes = await fetch(`${origin}/api/v1/dealer/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        storeId,
        amount: 2000000,
        paymentMethod: 'CASH',
        comment: 'Kassadan qarz qisman so‘ndirildi'
      })
    });

    const payData = await payRes.json() as any;
    expect(payRes.status).toBe(200);
    expect(payData.currentDebtBalance).toBe(2500000);

    // Verify Akt Sverka
    const sverkaRes = await fetch(`${origin}/api/v1/dealer/stores/${storeId}/akt-sverka`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const sverkaData = await sverkaRes.json() as any;
    expect(sverkaRes.status).toBe(200);
    expect(sverkaData.summary.currentDebtBalance).toBe(2500000);
    expect(sverkaData.transactions.length).toBeGreaterThanOrEqual(2);
  });

  it('4. Return of goods (vozvrat) restores dealer stock and lowers store debt', async () => {
    const token = await loginAsDealer();
    const storeId = SEED_IDS.navbahorStoreId;

    const prodsRes = await fetch(`${origin}/api/v1/dealer/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const prodsData = await prodsRes.json() as any;
    const prod = prodsData.products[0];
    const initialStock = prod.stockQuantity;

    // Return 2 units
    const returnRes = await fetch(`${origin}/api/v1/dealer/returns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        storeId,
        items: [
          { productId: prod.id, quantity: 2, unitPrice: prod.wholesalePrice }
        ],
        comment: 'Muddati yaqinlashgan qutilar qaytarildi'
      })
    });

    const returnData = await returnRes.json() as any;
    expect(returnRes.status).toBe(200);
    expect(returnData.success).toBe(true);

    // Dealer stock should increase by 2
    const prodsUpdatedRes = await fetch(`${origin}/api/v1/dealer/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const prodsUpdatedData = await prodsUpdatedRes.json() as any;
    const updatedProd = prodsUpdatedData.products.find((p: any) => p.id === prod.id);
    expect(updatedProd.stockQuantity).toBe(initialStock + 2);
  });

  it('5. Analytics and multi-stop route calculation', async () => {
    const token = await loginAsDealer();

    // Analytics
    const analyticsRes = await fetch(`${origin}/api/v1/dealer/analytics?period=month`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const analyticsData = await analyticsRes.json() as any;
    expect(analyticsRes.status).toBe(200);
    expect(analyticsData.analytics.totalTurnover).toBeGreaterThan(0);
    expect(analyticsData.analytics.activeStoresCount).toBeGreaterThanOrEqual(3);

    // Multi-stop routing
    const routeRes = await fetch(`${origin}/api/v1/dealer/map/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        storeIds: [SEED_IDS.navbahorStoreId, SEED_IDS.mahallaStoreId]
      })
    });

    const routeData = await routeRes.json() as any;
    expect(routeRes.status).toBe(200);
    expect(routeData.route.stopsCount).toBe(2);
    expect(routeData.route.geometry.length).toBeGreaterThan(0);
  });

  it('6. Mode 2: Experimental Global Goods Distribution Map', async () => {
    const token = await loginAsDealer();

    const globalRes = await fetch(`${origin}/api/v1/dealer/map/global-goods`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const globalData = await globalRes.json() as any;
    expect(globalRes.status).toBe(200);
    expect(Array.isArray(globalData.distribution)).toBe(true);
    if (globalData.distribution.length > 0) {
      const item = globalData.distribution[0];
      expect(item.productName).toBeDefined();
      expect(item.supplyVolume).toBeDefined();
      expect(item.dealerName).toBeUndefined();
      expect(item.debtAmount).toBeUndefined();
    }
  });

  it('7. Admin manages dealers: creation, list, and permission toggling', async () => {
    const adminToken = await loginAsAdmin();

    // List dealers
    const listRes = await fetch(`${origin}/api/v1/admin/dealers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const listData = await listRes.json() as any;
    expect(listRes.status).toBe(200);
    expect(listData.dealers.length).toBeGreaterThanOrEqual(1);

    // Create new dealer
    const createRes = await fetch(`${origin}/api/v1/admin/dealers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        companyName: 'Samarqand Optom MCHJ',
        contactName: 'Jamshid Karimov',
        phone: '+998935556677',
        login: 'samdiller',
        password: 'SamDealerPass2026!',
        region: 'Samarqand viloyati',
        city: 'Samarqand shahri',
        allowExperimentalMap: true
      })
    });

    const createData = await createRes.json() as any;
    expect(createRes.status).toBe(201);
    expect(createData.dealer.companyName).toBe('Samarqand Optom MCHJ');
    const createdDealerId = createData.dealer.id;

    // Toggle status or edit
    const updateRes = await fetch(`${origin}/api/v1/admin/dealers/${createdDealerId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        allowExperimentalMap: false
      })
    });

    const updateData = await updateRes.json() as any;
    expect(updateRes.status).toBe(200);
    expect(updateData.dealer.allowExperimentalMap).toBe(false);

    // Verify login with new dealer account
    const newDealerLogin = await fetch(`${origin}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'samdiller', password: 'SamDealerPass2026!' })
    });
    const newLoginData = await newDealerLogin.json() as any;
    expect(newDealerLogin.status).toBe(200);
    expect(newLoginData.user.role).toBe('DEALER');
  });

  it('8. Creating DEALER role user via POST /api/v1/admin/users initializes dealer record, while creating ADMIN/SUPERADMIN is blocked', async () => {
    const adminToken = await loginAsAdmin();

    // 1. Attempting to create an ADMIN must be rejected
    const blockAdminRes = await fetch(`${origin}/api/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        fullName: 'Ikkinchi Admin',
        email: 'admin2@yaqintop.uz',
        password: 'AdminPass123!',
        role: 'ADMIN'
      })
    });
    const blockAdminData = await blockAdminRes.json() as any;
    expect(blockAdminRes.status).toBe(400);
    expect(blockAdminData.code).toBe('ADMIN_LIMIT_REACHED');

    // 2. Creating a user with role DEALER must succeed and auto-create DBDealer
    const createDealerRes = await fetch(`${origin}/api/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        fullName: 'Andijon Distribyutsiya MCHJ',
        email: 'andijon_diller',
        password: 'AndijonPass123!',
        phone: '+998 90 999 88 77',
        role: 'DEALER',
        autoVerify: true
      })
    });
    const createDealerData = await createDealerRes.json() as any;
    expect(createDealerRes.status).toBe(201);
    expect(createDealerData.user.role).toBe('DEALER');

    // Verify DBDealer was created
    const createdDealerUser = db.dealers.get(Array.from(db.dealers.values()).find(d => d.userId === createDealerData.user.id)?.id || '');
    expect(createdDealerUser).toBeDefined();
    expect(createdDealerUser?.companyName).toBe('Andijon Distribyutsiya MCHJ');

    // Verify login with this newly created dealer user
    const loginNewDealerRes = await fetch(`${origin}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'andijon_diller', password: 'AndijonPass123!' })
    });
    const loginNewDealerData = await loginNewDealerRes.json() as any;
    expect(loginNewDealerRes.status).toBe(200);
    expect(loginNewDealerData.user.role).toBe('DEALER');
    expect(loginNewDealerData.user.dealer).toBeDefined();
    expect(loginNewDealerData.user.dealer.companyName).toBe('Andijon Distribyutsiya MCHJ');
  });
});
