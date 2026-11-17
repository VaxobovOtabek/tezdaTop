import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import type { Organization, Store } from '../../packages/contracts/src/index';
import { organizationListOptions, paginateOrganizationItems } from '../api/src/services/organization-list.service';

type CatalogEntry = { organization: Organization; store: Store };
type AdminOrganization = Organization & { stores: Store[]; userCount: number; localCatalog?: boolean };
type AdminStore = Store & { organizationName?: string; localCatalog?: boolean; activeOffersCount?: number };
const adminPath = '/api/v1/admin/';
const localApi = 'http://127.0.0.1:4010';
const cityKey = (value = '') => value.toLowerCase().replace(/[‘’ʻʼ'`]/g, '')
  .replace(/\s*\(.*?\)/g, '').replace(/\s*\b(?:tumani|tuman|shahri|shahar)\b/g, '').trim();

export function localCatalog(primaryApi: string): Plugin {
  return {
    name: 'admin-local-catalog',
    apply: 'serve',
    configureServer(server) {
      const filename = resolve(server.config.root, '../../barbershop/yaqintop-import.json');
      let entries: CatalogEntry[];
      try {
        entries = JSON.parse(readFileSync(filename, 'utf8')).locations;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') server.config.logger.error(String(error));
        return;
      }
      const storeIds = new Set(entries.map(({ store }) => store.id));
      const localIds = new Set([...storeIds, ...entries.map(({ organization }) => organization.id)]);
      let pendingCatalog: Promise<CatalogEntry[] | undefined> | undefined;
      const loadCatalog = () => {
        pendingCatalog ??= fetch(localApi + '/api/v1/stores', { signal: AbortSignal.timeout(7000) })
          .then(async response => {
            if (!response.ok) return undefined;
            const { items } = await response.json() as { items: CatalogEntry[] };
            return items.filter(({ store }) => storeIds.has(store.id));
          }).catch(() => undefined)
          .finally(() => { pendingCatalog = undefined; });
        return pendingCatalog;
      };
      const pendingOrganizations = new Map<string, Promise<AdminOrganization[]>>();
      let recentStores: { ids: Set<string>; loadedAt: number } | undefined;
      const loadOrganizations = (headers: Headers) => {
        const session = JSON.stringify([headers.get('authorization'), headers.get('cookie')]);
        const pending = pendingOrganizations.get(session);
        if (pending) return pending;
        const request = fetch(primaryApi + adminPath + 'organizations', {
          headers, signal: AbortSignal.timeout(15000), redirect: 'error',
        }).then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw Object.assign(new Error(data.message), { status: response.status });
          const organizations: AdminOrganization[] = data.organizations;
          recentStores = { ids: new Set(organizations.flatMap(org => org.stores.map(store => store.id))), loadedAt: Date.now() };
          return organizations;
        }).finally(() => pendingOrganizations.delete(session));
        pendingOrganizations.set(session, request);
        return request;
      };

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith(adminPath) ||
            !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '')) return next();
        const url = new URL(req.url, primaryApi);
        const [endpoint, id] = url.pathname.slice(adminPath.length).split('/');
        const send = (status: number, data: unknown) => {
          res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify(data));
        };
        if (id && localIds.has(id) && ['organizations', 'stores'].includes(endpoint) &&
            !['GET', 'HEAD', 'OPTIONS'].includes(req.method ?? '')) {
          return send(409, { message: 'Bu joy lokal katalogga tegishli.' });
        }
        if (req.method !== 'GET' || id || !['overview', 'organizations', 'stores'].includes(endpoint) ||
            url.searchParams.get('options') === '1') return next();
        const headers = new Headers();
        if (req.headers.authorization) headers.set('authorization', req.headers.authorization);
        if (req.headers.cookie) headers.set('cookie', req.headers.cookie);
        const signal = AbortSignal.timeout(15000);
        const directory = endpoint === 'stores' && url.searchParams.get('view') === 'directory';
        const useOrganizationList = endpoint === 'organizations' || directory;
        try {
          const [main, organizations, catalog] = await Promise.all([
            useOrganizationList ? undefined : fetch(primaryApi + url.pathname + url.search, { headers, signal, redirect: 'error' }),
            useOrganizationList ? loadOrganizations(headers) : undefined,
            loadCatalog(),
          ]);
          const original = await main?.json();
          if (main && !main.ok) return send(main.status, original);
          if (!catalog && !directory) return main ? send(main.status, original) : next();
          const local = catalog ?? [];
          if (endpoint === 'stores') {
            const region = url.searchParams.get('region');
            const city = cityKey(url.searchParams.get('city') || '');
            const cityMatches = (store: Store) => !city || city === 'barcha tumanlar' ||
              [store.city, store.district, store.address].some(value => cityKey(value).includes(city));
            const primaryStores = directory ? organizations!.flatMap(organization => organization.stores.map(store => ({
              ...store, region: store.region || organization.region, city: store.city || organization.city,
              district: store.district || organization.district, inn: store.inn || organization.inn,
              organizationName: organization.name,
            }))).filter(store => (!region || region === 'Barcha viloyatlar' || store.region === region ||
              (region === 'Toshkent shahri' && (!store.region || store.region.includes('Toshkent'))) ||
              store.address.toLowerCase().includes(region.toLowerCase().replace(/\s+(viloyati|respublikasi)$/, ''))) && cityMatches(store))
              : original.stores as AdminStore[];
            const stores = new Map<string, AdminStore>(primaryStores.map(store => [store.id, store]));
            for (const { store, organization } of local) {
              if (region && region !== 'Barcha viloyatlar' && store.region !== region) continue;
              if (!cityMatches(store)) continue;
              if (!stores.has(store.id)) stores.set(store.id, {
                ...store, organizationName: organization.name, localCatalog: true, activeOffersCount: 0
              });
            }
            return send(200, { ...original, stores: [...stores.values()] });
          }

          if (endpoint === 'overview') {
            if (!recentStores || recentStores.ids.size !== original.totalStores || Date.now() - recentStores.loadedAt > 30000) {
              await loadOrganizations(headers).catch(() => undefined);
            }
            const extra = local.filter(({ store }) => !recentStores?.ids.has(store.id)).length;
            return send(200, { ...original, totalStores: original.totalStores + extra, activeStores: original.activeStores + extra });
          }

          const options = organizationListOptions(Object.fromEntries(url.searchParams));
          const merged = new Map(organizations!.map(org => [org.id, org]));
          const knownStores = new Set(organizations!.flatMap(org => org.stores.map(store => store.id)));
          for (const { organization, store } of local) {
            if (knownStores.has(store.id)) continue;
            const org = merged.get(organization.id);
            if (org) merged.set(org.id, { ...org, stores: [...org.stores, store] });
            else merged.set(organization.id, { ...organization, stores: [store], userCount: 0, localCatalog: true });
          }
          return send(200, paginateOrganizationItems([...merged.values()], options));
        } catch (error) {
          const status = (error as { status?: number }).status;
          if (status && [400, 401, 403].includes(status)) return send(status, { message: (error as Error).message });
          return next();
        }
      });
    },
  };
}
