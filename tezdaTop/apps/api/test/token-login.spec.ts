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
let adminToken: string;

beforeAll(async () => {
  vi.stubEnv('VERCEL', '1');
  vi.spyOn(db, 'loadFromFile').mockReturnValue(true);
  vi.spyOn(db, 'scheduleSave').mockImplementation(() => {});
  db.users.clear();
  db.sessions.clear();

  // Admin user
  db.users.set('admin-user-id', {
    id: 'admin-user-id',
    email: 'admin@yaqintop.uz',
    fullName: 'Bosh Admin',
    role: 'ADMIN',
    status: 'ACTIVE',
    passwordHash: 'AdminPass123!',
    createdAt: new Date()
  } as any);

  // Target merchant/owner user
  db.users.set('merchant-owner-id', {
    id: 'merchant-owner-id',
    email: 'owner@store.uz',
    fullName: 'Do‘kon Egasi',
    role: 'OWNER',
    status: 'ACTIVE',
    passwordHash: 'OwnerPass123!',
    createdAt: new Date()
  } as any);

  // Suspended user
  db.users.set('suspended-user-id', {
    id: 'suspended-user-id',
    email: 'suspended@store.uz',
    fullName: 'Bloklangan Foydalanuvchi',
    role: 'CUSTOMER',
    status: 'SUSPENDED',
    passwordHash: 'Pass123!',
    createdAt: new Date()
  } as any);

  const { app } = await import('../src/server.js');
  const { createSignedSessionToken } = await import('../src/services/session.service.js');
  adminToken = createSignedSessionToken('admin-user-id');
  db.sessions.set(adminToken, { userId: 'admin-user-id', createdAt: new Date() });

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

describe('Token generation and quick login', () => {
  it('generates a signed session token for a user from admin endpoint', async () => {
    const res = await fetch(`${origin}/api/v1/admin/users/merchant-owner-id/token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeDefined();
    expect(typeof data.token).toBe('string');
    expect(data.token.startsWith('yqt_')).toBe(true);
    expect(data.user.id).toBe('merchant-owner-id');
    expect(data.user.role).toBe('OWNER');
  });

  it('allows instant login using the token via /api/v1/auth/token-login', async () => {
    // 1. Generate token
    const tokenRes = await fetch(`${origin}/api/v1/admin/users/merchant-owner-id/token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const { token } = await tokenRes.json();

    // 2. Perform token-login
    const loginRes = await fetch(`${origin}/api/v1/auth/token-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.user.id).toBe('merchant-owner-id');
    expect(loginData.user.fullName).toBe('Do‘kon Egasi');
    expect(loginData.user.role).toBe('OWNER');
    expect(loginData.token).toBe(token);

    // 3. Verify that /api/v1/auth/me recognizes the user
    const meRes = await fetch(`${origin}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.user.id).toBe('merchant-owner-id');
  });

  it('rejects invalid or empty token', async () => {
    const resEmpty = await fetch(`${origin}/api/v1/auth/token-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: '' })
    });
    expect(resEmpty.status).toBe(400);

    const resFake = await fetch(`${origin}/api/v1/auth/token-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'yqt_invalid.token.signature' })
    });
    expect(resFake.status).toBe(401);
  });

  it('rejects token login for suspended user', async () => {
    const tokenRes = await fetch(`${origin}/api/v1/admin/users/suspended-user-id/token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const { token } = await tokenRes.json();

    const loginRes = await fetch(`${origin}/api/v1/auth/token-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    expect(loginRes.status).toBe(403);
  });
});
