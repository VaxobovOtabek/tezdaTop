import { apiJson } from './api-client';

export interface AdminDataSelection {
  orgPage: number; orgLimit: number; orgSearch: string; orgStatus: string;
  region: string; city: string; orgSubTab: string; needsOrganizationOptions: boolean;
}

/** A tab owns its list requests; widgets with their own loader are not fetched twice. */
export function adminResourcePlan(tab: string, selection: AdminDataSelection): Record<string, string> {
  const resources: Record<string, string> = { overview: '/api/v1/admin/overview' };
  const add = (key: string) => { resources[key] = `/api/v1/admin/${key}`; };
  if (tab === 'organizations') {
    if (selection.orgSubTab === 'organizations') {
      const query = new URLSearchParams({ page: String(selection.orgPage), limit: String(selection.orgLimit), q: selection.orgSearch, status: selection.orgStatus });
      if (selection.region !== 'Barcha viloyatlar') query.set('region', selection.region);
      if (selection.city !== 'Barcha tumanlar') query.set('city', selection.city);
      resources.organizationPage = `/api/v1/admin/organizations?${query}`;
    } else add('stores');
  }
  if (tab === 'map-hub') add('stores');
  if (tab === 'growth-dynamics') add('stores');
  if (tab === 'requests-inquiries') add('stores');
  if (tab === 'users') add('users');
  if (tab === 'applications') add('applications');
  if (tab === 'reports') add('reports');
  if (tab === 'audit') add('audit');
  if (tab === 'users' || selection.needsOrganizationOptions) resources.organizations = '/api/v1/admin/organizations?options=1';
  return resources;
}

/** Per-session, short-lived cache. Only successful responses are cached. */
export class AdminResourceCache {
  private entries = new Map<string, { data: any; loadedAt: number }>();
  private pending = new Map<string, { promise: Promise<any>; controller: AbortController }>();
  private generation = 0;
  constructor(private ttlMs = 30_000) {}

  clear() {
    this.generation++;
    this.entries.clear();
    for (const pending of this.pending.values()) pending.controller.abort();
    this.pending.clear();
  }

  invalidateMutation(path: string) {
    const section = path.split('/')[4];
    const related: Record<string, string[]> = {
      organizations: ['organizations','stores','users'],
      users: ['users','organizations'],
      stores: ['stores','organizations','applications'],
      applications: ['applications','stores','organizations'],
      reports: ['reports','stores'], reviews: ['reviews','stores'],
      'credential-requests': ['users','organizations'], 'item-proposals': ['stores'], 'photo-proposals': ['stores']
    };
    const affected = new Set(['overview','audit', ...(related[section] || [section])]);
    for (const url of new Set([...this.entries.keys(), ...this.pending.keys()])) {
      const resource = new URL(url, 'http://localhost').pathname.split('/')[4];
      if (!affected.has(resource)) continue;
      this.entries.delete(url);
      this.pending.get(url)?.controller.abort();
      this.pending.delete(url);
    }
  }

  private get(url: string) {
    const cached = this.entries.get(url);
    if (cached && Date.now() - cached.loadedAt < this.ttlMs) return Promise.resolve(cached.data);
    const running = this.pending.get(url);
    if (running) return running.promise;
    const generation = this.generation, controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    const promise = apiJson(url, { signal: controller.signal }).then(data => {
      if (generation === this.generation && this.pending.get(url)?.controller === controller) {
        for (const [key, entry] of this.entries) if (Date.now() - entry.loadedAt >= this.ttlMs) this.entries.delete(key);
        if (this.entries.size >= 64) this.entries.delete(this.entries.keys().next().value!);
        this.entries.set(url, { data, loadedAt: Date.now() });
      }
      return data;
    }).finally(() => {
      clearTimeout(timer);
      if (this.pending.get(url)?.controller === controller) this.pending.delete(url);
    });
    this.pending.set(url, { promise, controller });
    return promise;
  }

  async load(resources: Record<string, string>) {
    const keys = Object.keys(resources);
    const results = await Promise.allSettled(keys.map(key => this.get(resources[key])));
    const data: Record<string, any> = {}, errors: { resource: string; message: string }[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') data[keys[index]] = result.value;
      else errors.push({ resource: keys[index], message: result.reason?.name === 'AbortError' ? 'So‘rov vaqti tugadi. Qayta urinib ko‘ring.' : result.reason?.message || 'Server bilan aloqa uzildi.' });
    });
    return { data, errors };
  }
}
