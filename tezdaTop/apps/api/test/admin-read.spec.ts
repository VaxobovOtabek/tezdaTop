import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import express from 'express';
import crypto from 'node:crypto';
import type { Server } from 'node:http';
import { AdminReadRepository, createAdminReadMiddleware } from '../src/routes/admin-read.routes.js';
import { db } from '../src/db/in-memory-db.js';
import { createSignedSessionToken } from '../src/services/session.service.js';

// The fake implements only reads. Any accidental snapshot RPC/write fails the test.
function clientFor(tables: Record<string, any[]>) {
  const calls: any[] = [];
  const from = (table: string) => {
    let rows = tables[table] || [], offset = 0, end = Infinity, count = rows.length;
    const query: any = {
      select: (columns: string, options?: any) => { calls.push({ table, columns, options }); return query; },
      eq: (key: string, value: any) => { rows = rows.filter(row => row[key] === value); count = rows.length; return query; },
      neq: (key: string, value: any) => { rows = rows.filter(row => row[key] !== value); count = rows.length; return query; },
      in: (key: string, values: any[]) => { rows = rows.filter(row => values.includes(row[key])); count = rows.length; return query; },
      order: () => query,
      range: (start: number, stop: number) => { offset = start; end = stop + 1; calls.push({ table, start, stop }); return query; },
      limit: (limit: number) => { end = limit; return query; },
      maybeSingle: async () => ({ data: rows[0] || null, error: null }),
      then: (resolve: any, reject: any) => Promise.resolve({ data: rows.slice(offset, end), count, error: null }).then(resolve, reject)
    };
    return query;
  };
  return { client: { from } as any, calls };
}
let server: Server | undefined;
beforeEach(() => { db.users.clear(); });
afterEach(async () => { if (server) await new Promise<void>(resolve => server!.close(() => resolve())); server = undefined; vi.restoreAllMocks(); });
function fixture(role = 'SUPERADMIN') {
  db.users.set('read-admin', { id: 'read-admin', tokenVersion: 3 } as any);
  const token = createSignedSessionToken('read-admin');
  // Persisted state, not the process cache, is authoritative.
  db.users.clear();
  const tables: Record<string, any[]> = {
    users: [{ id: 'read-admin', email: 'admin@example.test', status: 'ACTIVE', role, app_data: { tokenVersion: 3 }, password_hash: 'must-not-leak' }],
    application_records: [], organizations: [{ id: 'org', name: 'Real org', status: 'ACTIVE', type: 'RETAIL', created_at: '2026-01-01' }],
    stores: [{ id: 'store', organization_id: 'org', status: 'ACTIVE', latitude: 41, longitude: 69 }],
    memberships: [{ id: 'membership', user_id: 'read-admin', organization_id: 'org' }]
  };
  return { token, tables, ...clientFor(tables) };
}

it('authenticates from current persisted state without relying on a stale worker cache', async () => {
  const f = fixture(); const repo = new AdminReadRepository(f.client);
  expect((await repo.authenticate({ headers: { authorization: `Bearer ${f.token}` } } as any)).row.id).toBe('read-admin');
  f.tables.users[0].app_data.tokenVersion = 4;
  await expect(repo.authenticate({ headers: { authorization: `Bearer ${f.token}` } } as any)).rejects.toMatchObject({ status: 401 });
});
it('rejects revoked and suspended sessions', async () => {
  const f = fixture(); const repo = new AdminReadRepository(f.client);
  const hash = crypto.createHash('sha256').update(f.token).digest('hex');
  f.tables.application_records.push({ id: `revocations:${hash}`, payload: Date.now() + 10000 });
  await expect(repo.authenticate({ headers: { authorization: `Bearer ${f.token}` } } as any)).rejects.toMatchObject({ status: 401 });
  f.tables.application_records.length = 0; f.tables.users[0].status = 'SUSPENDED';
  await expect(repo.authenticate({ headers: { authorization: `Bearer ${f.token}` } } as any)).rejects.toMatchObject({ status: 401 });
});
it('rejects a forged signature before reading the database', async () => {
  const f = fixture();
  const token = f.token.slice(0, -2) + (f.token.endsWith('AA') ? 'BB' : 'AA');
  await expect(new AdminReadRepository(f.client).authenticate({ headers: { authorization: `Bearer ${token}` } } as any)).rejects.toMatchObject({ status: 401 });
  expect(f.calls).toHaveLength(0);
});
it('reads only a database page and its relations, with correct staff counts', async () => {
  const f = fixture(); const repo = new AdminReadRepository(f.client);
  const result = await repo.organizations({ paged: true, page: 1, limit: 20, status: 'ALL', q: '', region: '', city: '' });
  expect(result.organizations[0]).toMatchObject({ id: 'org', userCount: 1 });
  expect(result.organizations[0].stores).toHaveLength(1);
  expect(f.calls).toContainEqual({ table: 'organizations', start: 0, stop: 19 });
  expect(db.organizations.size).toBe(0);
});
it('handles an authorized HTTP read without entering snapshot persistence and blocks lower roles', async () => {
  const f = fixture(); const app = express();
  app.use(createAdminReadMiddleware(f.client));
  app.use((_req, res) => res.status(599).json({ message: 'legacy snapshot path' }));
  server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server!.once('listening', resolve));
  const address = server.address() as any, url = `http://127.0.0.1:${address.port}`;
  const headers = { Authorization: `Bearer ${f.token}` };
  expect((await fetch(url + '/api/v1/admin/users')).status).toBe(401);
  const response = await fetch(url + '/api/v1/admin/users', { headers });
  expect(response.status).toBe(200); expect(response.headers.get('x-data-access')).toBe('targeted-read');
  expect(JSON.stringify(await response.json())).not.toContain('must-not-leak');
  f.tables.users[0].role = 'CUSTOMER';
  expect((await fetch(url + '/api/v1/admin/users', { headers })).status).toBe(403);
  expect((await fetch(url + '/api/v1/admin/users', { headers, method: 'POST' })).status).toBe(599);
});
it('never truncates a table at the default REST page size', async () => {
  const f = clientFor({ organizations: Array.from({ length: 1101 }, (_, id) => ({ id })) });
  expect(await new AdminReadRepository(f.client).rows('organizations')).toHaveLength(1101);
});
