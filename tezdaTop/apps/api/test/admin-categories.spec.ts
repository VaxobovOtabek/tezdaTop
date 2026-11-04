import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';

process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';

import { db } from '../src/db/in-memory-db.js';
import { seedDatabase, SEED_IDS } from '../src/db/seed.js';
import { createSignedSessionToken } from '../src/services/session.service.js';

let server: Server;
let origin: string;

beforeAll(async () => {
  vi.stubEnv('VERCEL', '1');
  vi.stubEnv('SUPABASE_URL', '');
  vi.spyOn(db, 'loadFromFile').mockReturnValue(true);
  vi.spyOn(db, 'scheduleSave').mockImplementation(() => {});

  db.users.clear();
  db.stores.clear();
  db.organizations.clear();
  db.offers.clear();
  db.variants.clear();
  db.sessions.clear();

  await seedDatabase();

  const { default: app } = await import('../src/server.js');
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
  vi.unstubAllEnvs();
});

describe('Admin Categories & Products Direct Management Specification', { timeout: 25000 }, () => {
  async function loginAsAdmin() {
    let res = await fetch(`${origin}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@yaqintop.uz', password: 'Admin2026!Top' })
    });
    if (res.status !== 200) {
      res = await fetch(`${origin}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@yaqintop.uz', password: 'DemoPass123!' })
      });
    }
    const data = await res.json() as any;
    expect(res.status).toBe(200);
    return data.token;
  }

  function getCustomerToken() {
    const custId = 'customer-test-id';
    db.users.set(custId, {
      id: custId,
      email: 'testcustomer@yaqintop.uz',
      fullName: 'Test Customer',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      passwordHash: 'hash',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any);
    const token = createSignedSessionToken(custId);
    db.sessions.set(token, { userId: custId, createdAt: new Date() });
    return token;
  }

  it('1. GET /api/v1/admin/categories returns categories breakdown with product and service counts', async () => {
    const token = await loginAsAdmin();
    const res = await fetch(`${origin}/api/v1/admin/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.categories).toBeDefined();
    expect(Array.isArray(data.categories)).toBe(true);
    expect(data.items).toBeDefined();
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThan(0);

    const firstCat = data.items[0];
    expect(firstCat.name).toBeDefined();
    expect(typeof firstCat.totalCount).toBe('number');
    expect(typeof firstCat.productCount).toBe('number');
    expect(typeof firstCat.serviceCount).toBe('number');
    expect(typeof firstCat.storesCount).toBe('number');
  });

  it('2. PATCH /api/v1/admin/categories/rename renames a category directly across database', async () => {
    const token = await loginAsAdmin();

    // Pick an existing category with items
    const listRes = await fetch(`${origin}/api/v1/admin/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { items } = await listRes.json() as any;
    const catWithItems = items.find((c: any) => c.totalCount > 0);
    expect(catWithItems).toBeDefined();

    const oldName = catWithItems.name;
    const newName = `Yangi Toifa ${Date.now()}`;

    const renameRes = await fetch(`${origin}/api/v1/admin/categories/rename`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ oldName, newName })
    });

    expect(renameRes.status).toBe(200);
    const renameData = await renameRes.json() as any;
    expect(renameData.success).toBe(true);
    expect(renameData.updatedCount).toBeGreaterThan(0);

    // Verify category is now listed under new name
    const afterRes = await fetch(`${origin}/api/v1/admin/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const afterData = await afterRes.json() as any;
    expect(afterData.categories.includes(newName) || afterData.items.some((c: any) => c.name === newName)).toBe(true);
    expect(afterData.items.some((c: any) => c.name === oldName && c.totalCount > 0)).toBe(false);
  });

  it('3. POST /api/v1/admin/categories/merge merges source category into target category', async () => {
    const token = await loginAsAdmin();

    const sourceCat = `Vaqtincha Source ${Date.now()}`;
    const targetCat = `Vaqtincha Target ${Date.now()}`;

    // Add offer with source category via Admin endpoint
    const store = Array.from(db.stores.values())[0];
    const addRes = await fetch(`${origin}/api/v1/admin/stores/${store.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Sinov Mahsulot Birlashtirish',
        price: 25000,
        category: sourceCat,
        stockOnHand: 15
      })
    });
    expect(addRes.status).toBe(201);

    // Merge sourceCat into targetCat
    const mergeRes = await fetch(`${origin}/api/v1/admin/categories/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        sourceCategory: sourceCat,
        targetCategory: targetCat
      })
    });

    expect(mergeRes.status).toBe(200);
    const mergeData = await mergeRes.json() as any;
    expect(mergeData.success).toBe(true);
    expect(mergeData.mergedCount).toBeGreaterThanOrEqual(1);

    // Verify items now under targetCat
    const prodRes = await fetch(`${origin}/api/v1/admin/categories/products?category=${encodeURIComponent(targetCat)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const prodData = await prodRes.json() as any;
    expect(prodData.items.some((p: any) => p.variant?.title === 'Sinov Mahsulot Birlashtirish')).toBe(true);
  });

  it('4. PATCH /api/v1/admin/offers/:id updates product title, price, category, and photo', async () => {
    const token = await loginAsAdmin();

    // Get an offer to edit
    const listRes = await fetch(`${origin}/api/v1/admin/categories/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { items } = await listRes.json() as any;
    expect(items.length).toBeGreaterThan(0);
    const targetOffer = items[0];

    const updatedTitle = `Tahrirlangan Mahsulot ${Date.now()}`;
    const updatedPrice = 77000;
    const updatedCategory = 'Yangilangan Kategoriya';
    const updatedPhoto = 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500';

    const editRes = await fetch(`${origin}/api/v1/admin/offers/${targetOffer.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: updatedTitle,
        price: updatedPrice,
        category: updatedCategory,
        packUnit: 'kg',
        stockOnHand: 42,
        photoUrl: updatedPhoto,
        brand: 'TopBrand',
        barcode: '123456789'
      })
    });

    expect(editRes.status).toBe(200);
    const editData = await editRes.json() as any;
    expect(editData.success).toBe(true);
    expect(editData.offer.price).toBe('77000.00');
    expect(editData.offer.stockOnHand).toBe(42);
    expect(editData.variant.title).toBe(updatedTitle);
    expect(editData.variant.category).toBe(updatedCategory);
    expect(editData.variant.photoUrl).toBe(updatedPhoto);
    expect(editData.variant.brand).toBe('TopBrand');
  });

  it('5. Blocks unauthorized or non-admin roles from category modifications', async () => {
    const customerToken = getCustomerToken();

    // Rename blocked
    const renameRes = await fetch(`${origin}/api/v1/admin/categories/rename`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({ oldName: 'Oziq-ovqat', newName: 'Hacked' })
    });
    expect(renameRes.status).toBe(403);

    // Merge blocked
    const mergeRes = await fetch(`${origin}/api/v1/admin/categories/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({ sourceCategory: 'A', targetCategory: 'B' })
    });
    expect(mergeRes.status).toBe(403);

    // Unauthenticated blocked
    const unauthRes = await fetch(`${origin}/api/v1/admin/categories/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldName: 'A', newName: 'B' })
    });
    expect(unauthRes.status).toBe(401);
  });

  it('6. DELETE /api/v1/admin/categories deletes category and reassigns or deletes items', async () => {
    const token = await loginAsAdmin();

    const tempCategory = `Ochirish Toifasi ${Date.now()}`;
    const store = Array.from(db.stores.values())[0];

    // Add an offer with tempCategory
    await fetch(`${origin}/api/v1/admin/stores/${store.id}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Ochiriladigan Tovar', price: 10000, category: tempCategory, stockOnHand: 5 })
    });

    // Delete category with REASSIGN to 'Umumiy'
    const delRes = await fetch(`${origin}/api/v1/admin/categories`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ categoryName: tempCategory, deleteItems: false, targetCategory: 'Umumiy' })
    });
    expect(delRes.status).toBe(200);
    const delData = await delRes.json() as any;
    expect(delData.success).toBe(true);
    expect(delData.affectedCount).toBeGreaterThanOrEqual(1);

    // Verify tempCategory is gone from list
    const listRes = await fetch(`${origin}/api/v1/admin/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listData = await listRes.json() as any;
    expect(listData.items.some((c: any) => c.name === tempCategory)).toBe(false);
  });

  it('7. Handles POST /api/v1/admin/categories/merge even without explicit Content-Type header', async () => {
    const token = await loginAsAdmin();
    const sourceCat = `Source No Header ${Date.now()}`;
    const targetCat = `Target No Header ${Date.now()}`;

    // Request without Content-Type header
    const res = await fetch(`${origin}/api/v1/admin/categories/merge`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sourceCategory: sourceCat, targetCategory: targetCat })
    });

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
  });

  it('8. Handles DELETE /api/v1/admin/categories without Content-Type and with query params', async () => {
    const token = await loginAsAdmin();
    const catToDelete = `Del Without Header ${Date.now()}`;

    // 1. Delete without explicit Content-Type header
    const resNoHeader = await fetch(`${origin}/api/v1/admin/categories`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ categoryName: catToDelete })
    });
    expect(resNoHeader.status).toBe(200);

    // 2. Delete with query params
    const catQuery = `Del With Query ${Date.now()}`;
    const resQuery = await fetch(`${origin}/api/v1/admin/categories?categoryName=${encodeURIComponent(catQuery)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(resQuery.status).toBe(200);

    // 3. Delete via POST /api/v1/admin/categories/delete
    const catPost = `Del Via Post ${Date.now()}`;
    const resPost = await fetch(`${origin}/api/v1/admin/categories/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ categoryName: catPost })
    });
    expect(resPost.status).toBe(200);
  });
});
