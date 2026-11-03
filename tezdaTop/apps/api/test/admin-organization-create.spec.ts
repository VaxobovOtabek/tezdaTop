import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { db, InMemoryDatabase } from '../src/db/in-memory-db.js';
import { createSignedSessionToken } from '../src/services/session.service.js';
import { verifyOwnerPassword } from '../src/services/owner-onboarding.service.js';
import { buildOrganizationHours } from '../../../packages/ui/src/organization-fields';
import { checkStoreIsOpenNow } from '../src/services/search.service.js';

vi.mock('../src/db/supabase.js', () => ({ isSupabaseConfigured: () => false, syncAllFromSupabase: vi.fn(), syncAllToSupabase: vi.fn() }));
let server: Server, origin: string, token: string;
const empty = new InMemoryDatabase().exportSnapshot();
const owner = { fullName: 'New Owner', email: 'newowner', phone: '+998901112233', password: 'OnlyTestPassword123!' };
const input = { name: 'Test shop', type: 'RETAIL', address: 'Test address', phone: '+998909998877', region: 'Sirdaryo viloyati', city: 'Guliston', lat: 40.49, lng: 68.78 };
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6mQAAAAASUVORK5CYII=';
beforeAll(async () => {
  vi.stubEnv('VERCEL', '1');
  vi.spyOn(db, 'loadFromFile').mockReturnValue(true);
  vi.spyOn(db, 'scheduleSave').mockImplementation(() => {});
  const { app } = await import('../src/server.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  origin = `http://127.0.0.1:${(server.address() as any).port}`;
});
beforeEach(() => {
  db.restoreSnapshot(empty);
  db.users.set('create-admin', { id: 'create-admin', email: 'testadmin', fullName: 'Admin', role: 'SUPERADMIN', status: 'ACTIVE', passwordHash: 'not-used' } as any);
  token = createSignedSessionToken('create-admin');
});
afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); vi.restoreAllMocks(); vi.unstubAllEnvs(); });
const create = (data: any, session = token) => fetch(origin + '/api/v1/admin/organizations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session}` }, body: JSON.stringify({ ...input, ...data }) });
const expectNoPartialRecords = () => { expect(db.organizations.size).toBe(0); expect(db.stores.size).toBe(0); expect(db.memberships.size).toBe(0); expect(db.offers.size).toBe(0); };

describe('optional organization fields and owner creation', () => {
  it('allows no image, no owner and no branch name while keeping the selected workdays', async () => {
    const hours = buildOrganizationHours({ is24Hours: false, workingDays: [1,2,3,4,5], openTime: '09:00', closeTime: '18:00' });
    const response = await create({ hours }); expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.store.name).toBe(input.name); expect(body.store.photoUrl).toBe(''); expect(body.owner).toBeUndefined();
    expect(body.store.hours.find((day: any) => day.dayOfWeek === 0).isClosed).toBe(true);
    expect(body.store.hours.find((day: any) => day.dayOfWeek === 1)).toMatchObject({ openTime: '09:00', closeTime: '18:00', isClosed: false });
    expect(db.users.size).toBe(1);
  });
  it('accepts an image file and a 24/7 schedule', async () => {
    const hours = buildOrganizationHours({ is24Hours: true, workingDays: [], openTime: '09:00', closeTime: '18:00' });
    const response = await create({ hours, photoUrl: png, storeName: 'Optional branch' }); expect(response.status).toBe(201);
    const body = await response.json(); expect(body.store.photoUrl).toBe(png); expect(body.store.name).toBe('Optional branch');
    expect(body.store.hours).toHaveLength(7);
    expect(body.store.hours.every((day: any) => day.openTime === '00:00' && day.closeTime === '23:59' && !day.isClosed)).toBe(true);
  });
  it('accepts a remote image URL', async () => {
    const response = await create({ photoUrl: 'https://example.test/store.jpg' });
    expect(response.status).toBe(201); expect((await response.json()).store.photoUrl).toBe('https://example.test/store.jpg');
  });
  it('creates a linked OWNER, membership and initial service; login works without exposing a password', async () => {
    const response = await create({ owner: { ...owner, role: 'SUPERADMIN' }, initialOffer: { title: 'Test service', type: 'SERVICE', price: 15000, stockOnHand: 999 } });
    expect(response.status).toBe(201); const body = await response.json();
    expect(body.owner).toMatchObject({ email: owner.email, role: 'OWNER', status: 'ACTIVE', organizationId: body.organization.id });
    expect(JSON.stringify(body)).not.toContain(owner.password); expect(body.owner.passwordHash).toBeUndefined();
    const saved = db.users.get(body.owner.id)!;
    expect(verifyOwnerPassword(owner.password, saved.passwordHash)).toBe(true);
    expect([...db.memberships.values()][0]).toMatchObject({ userId: saved.id, organizationId: body.organization.id, role: 'OWNER', status: 'ACTIVE' });
    expect(db.offers.size).toBe(1); expect(db.balances.size).toBe(1);
    const login = await fetch(origin + '/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login: owner.email, password: owner.password }) });
    expect(login.status).toBe(200);
    const session = await login.json();
    const context = await fetch(origin + '/api/v1/merchant/context', { headers: { Authorization: `Bearer ${session.token}` } });
    expect(context.status).toBe(200); expect((await context.json()).organization.id).toBe(body.organization.id);
  });
  it('rejects a duplicate owner login before creating organization/store/offer records', async () => {
    db.users.set('existing', { id: 'existing', email: 'newowner@example.test', phone: '+998907778899' } as any);
    const response = await create({ owner, initialOffer: { title: 'Item', price: 2000 } });
    expect(response.status).toBe(409); expectNoPartialRecords();
  });
  it('rejects duplicate owner phones before making changes', async () => {
    db.users.set('existing', { id: 'existing', email: 'someoneelse', phone: '+998 90 111 22 33' } as any);
    expect((await create({ owner })).status).toBe(409); expectNoPartialRecords();
  });
  it('rejects invalid owner fields, unsafe image formats and invalid schedules atomically', async () => {
    for (const data of [{ owner: { ...owner, password: 'short' } }, { photoUrl: 'javascript:alert(1)' }, { photoUrl: 'data:text/html;base64,PHNjcmlwdD4=' }, { hours: [{ dayOfWeek: 1, openTime: '25:00', closeTime: '18:00', isClosed: false }] }, { hours: [{ dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: true }] }]) {
      expect((await create(data)).status).toBe(400); expectNoPartialRecords();
    }
  });
  it('rejects an invalid initial offer before creating related records', async () => {
    expect((await create({ owner, initialOffer: { title: 'Item', price: -1 } })).status).toBe(400); expectNoPartialRecords();
  });
  it('keeps creation restricted to administrators', async () => {
    db.users.set('moderator', { id: 'moderator', email: 'moderator', role: 'MODERATOR', status: 'ACTIVE' } as any);
    expect((await create({}, createSignedSessionToken('moderator'))).status).toBe(403); expectNoPartialRecords();
  });
});

it('uses selected days and keeps 24/7 open at midnight and the last minute of the day', () => {
  vi.useFakeTimers();
  try {
    const selected = { hours: buildOrganizationHours({ is24Hours: false, workingDays: [1], openTime: '08:00', closeTime: '22:00' }) } as any;
    vi.setSystemTime(new Date(2026,10,3,12,0)); // Tuesday: not selected
    expect(checkStoreIsOpenNow(selected)).toBe(false);
    const fullDay = { hours: buildOrganizationHours({ is24Hours: true, workingDays: [], openTime: '08:00', closeTime: '22:00' }) } as any;
    vi.setSystemTime(new Date(2026,10,3,0,0)); expect(checkStoreIsOpenNow(fullDay)).toBe(true);
    vi.setSystemTime(new Date(2026,10,3,23,59)); expect(checkStoreIsOpenNow(fullDay)).toBe(true);
  } finally { vi.useRealTimers(); }
});
