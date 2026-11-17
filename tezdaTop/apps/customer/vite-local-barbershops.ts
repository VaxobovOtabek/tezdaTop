import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import type { Store } from '../../packages/contracts/src/index';

type PublicStoreList = {
  items: { store: Store; distanceM: number }[];
  total: number;
};

async function readStoreList(url: string, signal: AbortSignal): Promise<PublicStoreList | undefined> {
  const response = await fetch(url, { signal });
  if (response.ok) return response.json();
}

export function localBarbershops(primaryApi: string): Plugin {
  return {
    name: 'customer-local-barbershops',
    apply: 'serve',
    configureServer(server) {
      const catalogPath = resolve(server.config.root, '../../barbershop/yaqintop-import.json');
      let catalog: { locations: { store: Store }[] };
      try {
        catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') server.config.logger.error(String(error));
        return;
      }
      const byId = new Set(catalog.locations.map(({ store }) => store.id));
      const byCoordinates = new Map(catalog.locations.map(({ store }) => [
        `@${store.location.lat.toFixed(6)},${store.location.lng.toFixed(6)}`,
        store.id,
      ]));
      const localApi = 'http://127.0.0.1:4010';
      const pendingLists = new Map<string, Promise<string | undefined>>();
      const recentLists = new Map<string, { body: string; expiresAt: number; primary: PublicStoreList; primaryAt: number }>();
      const loadList = (searchPath: string) => {
        const cached = recentLists.get(searchPath);
        if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.body);
        const pending = pendingLists.get(searchPath);
        if (pending) return pending;

        const signal = AbortSignal.timeout(5000);
        const request = Promise.all([
          readStoreList(primaryApi + searchPath, signal).catch(() => undefined),
          readStoreList(localApi + searchPath, signal).catch(() => undefined),
        ]).then(([original, extra]) => {
          const primary = original ?? (cached && Date.now() - cached.primaryAt < 60000 ? cached.primary : undefined);
          if (!primary && !extra) return undefined;
          const items = new Map(primary?.items.map((item) => [item.store.id, item]));
          for (const item of extra?.items ?? []) {
            if (byId.has(item.store.id) && !items.has(item.store.id)) items.set(item.store.id, item);
          }
          const sorted = [...items.values()].sort((a, b) => a.distanceM - b.distanceM);
          const body = JSON.stringify({ ...primary, items: sorted, total: sorted.length });
          if (original && extra) {
            recentLists.delete(searchPath);
            if (recentLists.size >= 32) recentLists.delete(recentLists.keys().next().value!);
            recentLists.set(searchPath, { body, expiresAt: Date.now() + 2500, primary: original, primaryAt: Date.now() });
          }
          return body;
        }).finally(() => pendingLists.delete(searchPath));
        pendingLists.set(searchPath, request);
        return request;
      };

      server.middlewares.use(async (req, res, next) => {
        const isLoopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '');
        if (!isLoopback || req.method !== 'GET' || !req.url?.startsWith('/api/v1/stores')) return next();
        const url = new URL(req.url, localApi);
        const storePath = url.pathname.replace(/\/$/, '');
        const route = /^\/api\/v1\/stores\/([^/]+)(?:\/(.*))?$/.exec(storePath);
        const [, key, suffix] = route ?? [];
        const [coordinates, coordinateAction] = suffix?.split('/') ?? [];
        const coordinateId = byCoordinates.get(coordinates);
        const detailId = byId.has(key) ? key : coordinateId;
        const action = coordinateId ? coordinateAction : suffix;
        const isLocalDetail = detailId && (!action || ['offers', 'reviews', 'proposals', 'photo-proposals'].includes(action));
        if (storePath !== '/api/v1/stores' && !isLocalDetail) return next();

        try {
          if (storePath === '/api/v1/stores') {
            url.searchParams.sort();
            const body = await loadList(`/api/v1/stores${url.search}`);
            if (!body) return next();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
            return res.end(body);
          }

          const detailPath = `/api/v1/stores/${detailId}${action ? `/${action}` : ''}${url.search}`;
          const result = await fetch(localApi + detailPath, { signal: AbortSignal.timeout(5000) });
          const body = await result.text();
          res.writeHead(result.status, {
            'Content-Type': result.headers.get('content-type') ?? 'application/json',
            'Cache-Control': 'no-store',
          });
          return res.end(body);
        } catch {
          return next();
        }
      });
    },
  };
}
