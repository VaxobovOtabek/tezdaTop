import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminResourcePlan, AdminResourceCache } from '../../../packages/ui/src/admin-data';
import { organizationListOptions, paginateOrganizations } from '../src/services/organization-list.service.js';

const selection = { orgPage: 1, orgLimit: 20, orgSearch: '', orgStatus: 'ALL', region: 'Barcha viloyatlar', city: 'Barcha tumanlar', orgSubTab: 'organizations', needsOrganizationOptions: false };
beforeEach(() => {
  vi.stubGlobal('window', { location: { href: 'http://localhost:3002/' } });
  vi.stubGlobal('localStorage', { getItem: () => 'test-token' });
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(JSON.stringify({ items: [] }), { status: 200 })));
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('tab resource planning and cache', () => {
  it('loads only the summary initially and leaves widget-owned resources to their widgets', () => {
    expect(Object.keys(adminResourcePlan('overview', selection))).toEqual(['overview']);
    expect(Object.keys(adminResourcePlan('reviews', selection))).toEqual(['overview']);
    expect(Object.keys(adminResourcePlan('users', selection))).toEqual(['overview', 'users', 'organizations']);
  });
  it('sends organization filters and pagination without loading all users or stores', () => {
    const plan = adminResourcePlan('organizations', { ...selection, orgPage: 2, orgSearch: 'a&b', region: 'Sirdaryo viloyati' });
    expect(Object.keys(plan)).toEqual(['overview','organizationPage']);
    const query = new URL(plan.organizationPage, 'http://localhost').searchParams;
    expect(query.get('page')).toBe('2'); expect(query.get('q')).toBe('a&b'); expect(query.get('region')).toBe('Sirdaryo viloyati');
  });
  it('deduplicates concurrent requests and serves successful cached responses', async () => {
    const cache = new AdminResourceCache();
    await Promise.all([cache.load({ a: '/api/a' }), cache.load({ b: '/api/a' })]);
    await cache.load({ a: '/api/a' });
    expect(fetch).toHaveBeenCalledTimes(1);
    cache.clear(); await cache.load({ a: '/api/a' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('does not cache failed requests or discard successful sections', async () => {
    vi.mocked(fetch).mockImplementation(async input => new Response(JSON.stringify({ message: 'offline' }), { status: String(input).endsWith('bad') ? 503 : 200 }));
    const cache = new AdminResourceCache();
    const result = await cache.load({ good: '/api/good', bad: '/api/bad' });
    expect(result.data.good).toBeDefined(); expect(result.errors).toHaveLength(1);
    await cache.load({ good: '/api/good', bad: '/api/bad' });
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it('expires successful entries', async () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1000);
    const cache = new AdminResourceCache(100);
    await cache.load({ a: '/api/a' }); clock.mockReturnValue(1101);
    await cache.load({ a: '/api/a' }); expect(fetch).toHaveBeenCalledTimes(2); clock.mockRestore();
  });
  it('does not repopulate a cleared session cache from an older in-flight response', async () => {
    let finishOld!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise<Response>(resolve => { finishOld = resolve; }));
    const cache = new AdminResourceCache();
    const old = cache.load({ a: '/api/a' });
    cache.clear();
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ session: 'new' })));
    await cache.load({ a: '/api/a' });
    finishOld(new Response(JSON.stringify({ session: 'old' }))); await old;
    expect((await cache.load({ a: '/api/a' })).data.a).toEqual({ session: 'new' });
  });
  it('invalidates only affected lists after a successful mutation', async () => {
    const cache = new AdminResourceCache();
    const resources = { overview: '/api/v1/admin/overview', users: '/api/v1/admin/users', stores: '/api/v1/admin/stores', page: '/api/v1/admin/organizations?page=1' };
    await cache.load(resources);
    cache.invalidateMutation('/api/v1/admin/users/test-user/status');
    await cache.load(resources);
    expect(fetch).toHaveBeenCalledTimes(7); // stores stays cached
    expect(vi.mocked(fetch).mock.calls.filter(([url]) => String(url).endsWith('/stores'))).toHaveLength(1);
  });
});

describe('organization paging compatibility', () => {
  const orgs = Array.from({ length: 45 }, (_, i) => ({ id: String(i).padStart(2, '0'), name: `Shop ${i}`, status: i === 44 ? 'DELETED' : 'ACTIVE', type: 'RETAIL', createdAt: '2026-01-01' }));
  it('keeps legacy clients unpaged and paginates table clients in stable order', () => {
    expect(paginateOrganizations(orgs, [], [], organizationListOptions({})).organizations).toHaveLength(45);
    const first = paginateOrganizations(orgs, [], [], organizationListOptions({ page: '1', limit: '20' }));
    const second = paginateOrganizations(orgs, [], [], organizationListOptions({ page: '2', limit: '20' }));
    expect(first.total).toBe(44); expect(first.organizations).toHaveLength(20);
    expect(first.organizations.some(a => second.organizations.some(b => a.id === b.id))).toBe(false);
  });
  it('matches branch geography, counts actual staff and clamps a page after deletion/filtering', () => {
    const stores = [{ id: 's1', organizationId: '00', region: 'Sirdaryo', city: 'Guliston', address: 'Guliston markazi' }];
    const users = [{ organizationId: '00', status: 'ACTIVE' }, { organizationId: '00', status: 'DELETED' }];
    const result = paginateOrganizations(orgs, stores, users, organizationListOptions({ page: 99, region: 'Sirdaryo', city: 'Guliston' }));
    expect(result.total).toBe(1); expect(result.page).toBe(1); expect(result.organizations[0].userCount).toBe(1);
  });
  it('rejects invalid page/limit/status instead of allocating an unbounded response', () => {
    for (const query of [{ page: -1 }, { page: 1.5 }, { limit: 100000 }, { status: 'invalid' }]) expect(() => organizationListOptions(query)).toThrow();
  });
});
