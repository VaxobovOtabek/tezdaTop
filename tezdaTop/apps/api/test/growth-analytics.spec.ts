import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { db } from '../src/db/in-memory-db.js';

vi.mock('../src/db/supabase.js', () => ({
  isSupabaseConfigured: () => false,
  syncAllFromSupabase: vi.fn(),
  syncAllToSupabase: vi.fn()
}));

let server: Server;
let origin: string;

beforeAll(async () => {
  vi.stubEnv('VERCEL', '1');
  vi.spyOn(db, 'loadFromFile').mockReturnValue(true);
  vi.spyOn(db, 'scheduleSave').mockImplementation(() => {});

  db.users.clear();
  db.stores.clear();
  db.variants.clear();

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);

  // Seed sample users
  db.users.set('u-1', {
    id: 'u-1',
    email: 'recent@example.com',
    fullName: 'Recent User',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    createdAt: twoDaysAgo.toISOString(),
    updatedAt: twoDaysAgo.toISOString()
  } as any);

  db.users.set('u-2', {
    id: 'u-2',
    email: 'older@example.com',
    fullName: 'Older User',
    role: 'OWNER',
    status: 'ACTIVE',
    createdAt: twentyDaysAgo.toISOString(),
    updatedAt: twentyDaysAgo.toISOString()
  } as any);

  // Seed sample store
  db.stores.set('s-1', {
    id: 's-1',
    organizationId: 'org-1',
    name: 'Yangi Market',
    status: 'ACTIVE',
    address: 'Amir Temur shoh ko‘chasi, 15',
    phone: '+998901234567',
    createdAt: twoDaysAgo.toISOString(),
    updatedAt: twoDaysAgo.toISOString()
  } as any);

  // Seed sample product
  db.variants.set('v-prod', {
    id: 'v-prod',
    productId: 'p-1',
    title: 'Shokolad Plitka 100g',
    category: 'Shirinliklar',
    packUnit: 'dona',
    kind: 'PRODUCT',
    createdAt: twoDaysAgo.toISOString(),
    updatedAt: twoDaysAgo.toISOString()
  } as any);

  // Seed sample service
  db.variants.set('v-srv', {
    id: 'v-srv',
    productId: 'p-2',
    title: 'Komyuter diagnostikasi va tozalash',
    category: 'IT xizmatlar',
    packUnit: 'xizmat',
    kind: 'SERVICE',
    createdAt: twoDaysAgo.toISOString(),
    updatedAt: twoDaysAgo.toISOString()
  } as any);

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

describe('Admin Growth Analytics API', () => {
  it('returns valid metrics for week period', async () => {
    const res = await fetch(`${origin}/api/v1/admin/analytics/growth?period=week`);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.period).toBe('week');
    expect(data.summary.users.totalAllTime).toBe(2);
    expect(data.summary.users.inPeriod).toBe(1); // Only 2 days ago
    expect(data.summary.stores.inPeriod).toBe(1);
    expect(data.summary.products.inPeriod).toBe(1);
    expect(data.summary.services.inPeriod).toBe(1);
    expect(data.timeline).toHaveLength(7);
    expect(data.recent.services[0].title).toBe('Komyuter diagnostikasi va tozalash');
  });

  it('returns valid metrics for month period', async () => {
    const res = await fetch(`${origin}/api/v1/admin/analytics/growth?period=month`);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.period).toBe('month');
    expect(data.summary.users.inPeriod).toBe(2); // Both within 30 days
    expect(data.summary.stores.inPeriod).toBe(1);
    expect(data.summary.products.inPeriod).toBe(1);
    expect(data.summary.services.inPeriod).toBe(1);
    expect(data.timeline.length).toBeGreaterThan(0);
  });

  it('returns valid metrics for year period with 12 monthly buckets', async () => {
    const res = await fetch(`${origin}/api/v1/admin/analytics/growth?period=year`);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.period).toBe('year');
    expect(data.timeline).toHaveLength(12);
    expect(data.summary.totalAddedInPeriod).toBe(5);
  });

  it('correctly tracks and reflects blocked and deleted users and organizations in growth analytics', async () => {
    // Suspend user u-2
    await fetch(`${origin}/api/v1/admin/users/u-2/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SUSPENDED' })
    });

    // Delete user u-1
    const delUserRes = await fetch(`${origin}/api/v1/admin/users/u-1`, { method: 'DELETE' });
    expect(delUserRes.status).toBe(200);

    // Verify growth analytics reports suspended and deleted users
    const res = await fetch(`${origin}/api/v1/admin/analytics/growth?period=month`);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.summary.users.suspended).toBe(1);
    expect(data.summary.users.deleted).toBe(1);
    expect(data.summary.statusOverview).toBeDefined();
    expect(data.summary.statusOverview.suspendedTotal).toBeGreaterThanOrEqual(1);
    expect(data.summary.statusOverview.deletedTotal).toBeGreaterThanOrEqual(1);
  });
});
