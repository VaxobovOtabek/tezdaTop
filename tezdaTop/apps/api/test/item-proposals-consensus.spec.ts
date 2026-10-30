import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { db } from '../src/db/in-memory-db.js';
import { seedDatabase } from '../src/db/seed.js';

vi.mock('../src/db/supabase.js', () => ({
  isSupabaseConfigured: () => false,
  syncAllFromSupabase: vi.fn(),
  syncAllToSupabase: vi.fn(),
  persistItemProposalToSupabase: vi.fn(),
  persistPhotoProposalToSupabase: vi.fn(),
  insertRegisteredCustomer: vi.fn(),
  supabase: null
}));

let server: Server;
let origin: string;
let storeId: string;
let user1Token: string;
let user2Token: string;
let user3Token: string;
let adminToken: string;

beforeAll(async () => {
  vi.stubEnv('VERCEL', '1');
  vi.spyOn(db, 'loadFromFile').mockReturnValue(true);
  vi.spyOn(db, 'scheduleSave').mockImplementation(() => {});

  await seedDatabase();
  const store = Array.from(db.stores.values())[0];
  storeId = store.id;

  const u1 = {
    id: '11111111-0001-4000-8000-000000000001',
    email: 'user1@test.uz',
    fullName: 'User Bir',
    role: 'CUSTOMER' as const,
    status: 'ACTIVE' as const,
    passwordHash: 'hash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const u2 = {
    id: '11111111-0002-4000-8000-000000000002',
    email: 'user2@test.uz',
    fullName: 'User Ikki',
    role: 'CUSTOMER' as const,
    status: 'ACTIVE' as const,
    passwordHash: 'hash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const u3 = {
    id: '11111111-0003-4000-8000-000000000003',
    email: 'user3@test.uz',
    fullName: 'User Uch',
    role: 'CUSTOMER' as const,
    status: 'ACTIVE' as const,
    passwordHash: 'hash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const admin = {
    id: '11111111-9999-4000-8000-000000000000',
    email: 'admin@yaqintop.uz',
    fullName: 'Bosh Admin',
    role: 'SUPERADMIN' as const,
    status: 'ACTIVE' as const,
    passwordHash: 'hash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.users.set(u1.id, u1);
  db.users.set(u2.id, u2);
  db.users.set(u3.id, u3);
  db.users.set(admin.id, admin);

  user1Token = 'test-token-user1';
  user2Token = 'test-token-user2';
  user3Token = 'test-token-user3';
  adminToken = 'test-token-admin';

  db.sessions.set(user1Token, { userId: u1.id, createdAt: new Date() });
  db.sessions.set(user2Token, { userId: u2.id, createdAt: new Date() });
  db.sessions.set(user3Token, { userId: u3.id, createdAt: new Date() });
  db.sessions.set(adminToken, { userId: admin.id, createdAt: new Date() });

  const { app } = await import('../src/server.js');
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

describe('Crowdsourced Item Proposals & 3-User Consensus Rule', () => {
  it('1 or 2 users proposing an item leaves it PENDING with correct remaining counter', async () => {
    // User 1 proposes item
    const res1 = await fetch(`${origin}/api/v1/stores/${storeId}/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`
      },
      body: JSON.stringify({
        title: 'Nestle Choco 100g',
        type: 'PRODUCT',
        category: 'Shirinliklar',
        price: 15000,
        stockOnHand: 10,
        packUnit: 'dona'
      })
    });

    const data1 = await res1.json();
    expect(res1.status).toBe(200);
    expect(data1.success).toBe(true);
    expect(data1.autoApproved).toBe(false);
    expect(data1.pendingCount).toBe(1);
    expect(data1.remainingForAutoApproval).toBe(2);

    // Verify item is NOT in active offers yet
    const offersRes = await fetch(`${origin}/api/v1/stores/${storeId}/offers`);
    const offersData = await offersRes.json();
    const foundOffer = offersData.offers?.find((o: any) => o.variant?.title === 'Nestle Choco 100g');
    expect(foundOffer).toBeUndefined();

    // User 2 proposes same item
    const res2 = await fetch(`${origin}/api/v1/stores/${storeId}/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2Token}`
      },
      body: JSON.stringify({
        title: 'Nestle Choco 100g',
        type: 'PRODUCT',
        category: 'Shirinliklar',
        price: 17000,
        stockOnHand: 20,
        packUnit: 'dona'
      })
    });

    const data2 = await res2.json();
    expect(res2.status).toBe(200);
    expect(data2.autoApproved).toBe(false);
    expect(data2.pendingCount).toBe(2);
    expect(data2.remainingForAutoApproval).toBe(1);
  });

  it('3 distinct users proposing the same item triggers AUTO-APPROVAL with average price & stock', async () => {
    // User 1: 10,000 so'm, 10 dona
    await fetch(`${origin}/api/v1/stores/${storeId}/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`
      },
      body: JSON.stringify({
        title: 'Toshkent Non',
        type: 'PRODUCT',
        category: 'Non mahsulotlari',
        price: 10000,
        stockOnHand: 10,
        packUnit: 'dona'
      })
    });

    // User 2: 12,000 so'm, 20 dona
    await fetch(`${origin}/api/v1/stores/${storeId}/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2Token}`
      },
      body: JSON.stringify({
        title: 'Toshkent Non',
        type: 'PRODUCT',
        category: 'Non mahsulotlari',
        price: 12000,
        stockOnHand: 20,
        packUnit: 'dona'
      })
    });

    // User 3: 14,000 so'm, 30 dona
    const res3 = await fetch(`${origin}/api/v1/stores/${storeId}/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user3Token}`
      },
      body: JSON.stringify({
        title: 'Toshkent Non',
        type: 'PRODUCT',
        category: 'Non mahsulotlari',
        price: 14000,
        stockOnHand: 30,
        packUnit: 'dona'
      })
    });

    const data3 = await res3.json();
    // Expected avg price: (10000 + 12000 + 14000) / 3 = 12000
    // Expected avg stock: (10 + 20 + 30) / 3 = 20
    expect(res3.status).toBe(200);
    expect(data3.success).toBe(true);
    expect(data3.autoApproved).toBe(true);
    expect(data3.avgPrice).toBe(12000);
    expect(data3.avgStock).toBe(20);

    // Verify it is NOW an active offer in the store catalog!
    const offersRes = await fetch(`${origin}/api/v1/stores/${storeId}/offers`);
    const offersData = await offersRes.json();
    const activeOffer = offersData.offers?.find((o: any) => o.variant?.title === 'Toshkent Non');
    expect(activeOffer).toBeDefined();
    expect(activeOffer.price).toBe('12000');
    expect(activeOffer.stockOnHand).toBe(20);
    expect(activeOffer.status).toBe('ACTIVE');
  });

  it('Admin can manually approve a single pending proposal', async () => {
    // User 1 proposes a service
    const submitRes = await fetch(`${origin}/api/v1/stores/${storeId}/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`
      },
      body: JSON.stringify({
        title: 'Kompyuter Diagnostikasi',
        type: 'SERVICE',
        category: 'IT Xizmatlar',
        price: 80000,
        stockOnHand: 1,
        packUnit: 'xizmat'
      })
    });

    const submitData = await submitRes.json();
    const proposalId = submitData.proposalId;
    expect(proposalId).toBeDefined();

    // Admin approves proposal
    const approveRes = await fetch(`${origin}/api/v1/admin/item-proposals/${proposalId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });

    const approveData = await approveRes.json();
    expect(approveRes.status).toBe(200);
    expect(approveData.success).toBe(true);

    // Verify it is NOW an active offer
    const offersRes = await fetch(`${origin}/api/v1/stores/${storeId}/offers`);
    const offersData = await offersRes.json();
    const serviceOffer = offersData.offers?.find((o: any) => o.variant?.title === 'Kompyuter Diagnostikasi');
    expect(serviceOffer).toBeDefined();
    expect(serviceOffer.price).toBe('80000');
  });
});
