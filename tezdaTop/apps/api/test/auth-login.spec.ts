import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { db } from '../src/db/in-memory-db.js';
import { hashOwnerPassword } from '../src/services/owner-onboarding.service.js';
import { createSignedSessionToken } from '../src/services/session.service.js';

// Never read/write the user's database or call Supabase from this regression test.
vi.mock('../src/db/supabase.js', () => ({
  isSupabaseConfigured: () => false,
  syncAllFromSupabase: vi.fn(), syncAllToSupabase: vi.fn()
}));
let server: Server;
let origin: string;
beforeAll(async () => {
  vi.stubEnv('VERCEL', '1');
  vi.spyOn(db, 'loadFromFile').mockReturnValue(true);
  vi.spyOn(db, 'scheduleSave').mockImplementation(() => {});
  db.users.clear(); db.sessions.clear();
  db.users.set('test-admin', {
    id: 'test-admin', email: 'auth-test@example.test', fullName: 'Auth Test',
    role: 'SUPERADMIN', status: 'ACTIVE', passwordHash: hashOwnerPassword('OnlyActualPassword123!'),
    createdAt: new Date()
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
  vi.restoreAllMocks(); vi.unstubAllEnvs();
});
describe('Explicit login', () => {
  it('preserves the last administrator and blocks lower staff impersonation', async () => {
    const token=createSignedSessionToken('test-admin');
    db.sessions.set(token,{userId:'test-admin',createdAt:new Date()});
    const response=await fetch(`${origin}/api/v1/admin/users/test-admin/status`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({status:'SUSPENDED'})});
    expect(response.status).toBe(409); expect(db.users.get('test-admin')?.status).toBe('ACTIVE');
    db.users.set('lower-admin',{id:'lower-admin',email:'lower-admin',fullName:'Lower Admin',role:'ADMIN',status:'ACTIVE',passwordHash:hashOwnerPassword('test-only-password')} as any);
    const lowerToken=createSignedSessionToken('lower-admin'); db.sessions.set(lowerToken,{userId:'lower-admin',createdAt:new Date()});
    const impersonation=await fetch(`${origin}/api/v1/admin/users/test-admin/token`,{headers:{Authorization:`Bearer ${lowerToken}`}});
    expect(impersonation.status).toBe(403);
  });
  it('rejects anonymous and header-only profile restoration', async () => {
    expect((await fetch(`${origin}/api/v1/auth/me`)).status).toBe(401);
    expect((await fetch(`${origin}/api/v1/auth/me`, { headers: { 'x-user-id': 'test-admin' } })).status).toBe(401);
  });
  it('rejects the universal demo password and accepts only the account password', async () => {
    const login = (password: string) => fetch(`${origin}/api/v1/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'auth-test@example.test', password })
    });
    expect((await login('DemoPass123!')).status).toBe(401);
    expect((await login('')).status).toBe(400);
    const response = await login('OnlyActualPassword123!');
    expect(response.status).toBe(200);
    const result = await response.json();
    const me = await fetch(`${origin}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${result.token}` } });
    expect(me.status).toBe(200);
    expect((await me.json()).user.id).toBe('test-admin');
  });
  it('enforces that audit, supabase usage, and database schema are admin-only and forbidden to moderator', async () => {
    db.users.set('test-moderator', {
      id: 'test-moderator', email: 'moderator@example.test', fullName: 'Moderator User',
      role: 'MODERATOR', status: 'ACTIVE', passwordHash: hashOwnerPassword('ModPass123!'),
      createdAt: new Date()
    } as any);
    const modToken = createSignedSessionToken('test-moderator');
    db.sessions.set(modToken, { userId: 'test-moderator', createdAt: new Date() });
    const adminToken = createSignedSessionToken('test-admin');
    db.sessions.set(adminToken, { userId: 'test-admin', createdAt: new Date() });

    // Moderator cannot access /api/v1/admin/audit
    const modAudit = await fetch(`${origin}/api/v1/admin/audit`, { headers: { Authorization: `Bearer ${modToken}` } });
    expect(modAudit.status).toBe(403);

    // Moderator cannot access /api/v1/admin/supabase-usage
    const modUsage = await fetch(`${origin}/api/v1/admin/supabase-usage`, { headers: { Authorization: `Bearer ${modToken}` } });
    expect(modUsage.status).toBe(403);

    // Moderator cannot access /api/v1/admin/database/schema-and-tables
    const modSchema = await fetch(`${origin}/api/v1/admin/database/schema-and-tables`, { headers: { Authorization: `Bearer ${modToken}` } });
    expect(modSchema.status).toBe(403);

    // Superadmin CAN access audit and database schema
    const adminAudit = await fetch(`${origin}/api/v1/admin/audit`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(adminAudit.status).toBe(200);
    const adminSchema = await fetch(`${origin}/api/v1/admin/database/schema-and-tables`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(adminSchema.status).toBe(200);

    // In overview, Moderator does not receive audit logs or audit total
    const modOverview = await fetch(`${origin}/api/v1/admin/overview`, { headers: { Authorization: `Bearer ${modToken}` } });
    expect(modOverview.status).toBe(200);
    const modOverviewData = await modOverview.json();
    expect(modOverviewData.latestAudit).toEqual([]);
    expect(modOverviewData.auditTotal).toBe(0);
  });
});
