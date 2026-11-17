/**
 * Persistent IndexedDB & In-Memory State Cache for YaqinTop Customer App.
 *
 * Ensures multi-megabyte datasets (Uzum ~6MB, Korzinka ~650KB, Game Clubs ~265KB,
 * Korzinka Products ~156KB, and regional store lists) are downloaded ONCE
 * and persistently stored in IndexedDB.
 *
 * On F5 (page refresh) or subsequent visits:
 * Data is immediately served from IndexedDB / in-memory state in ~5ms with ZERO network requests.
 */

const DB_NAME = 'yaqintop_customer_store_v1';
const DB_VERSION = 1;
const STORE_NAME = 'catalogs';

export const CATALOG_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days for static points
export const STORES_CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours for regional store lists

export interface CacheRecord<T = unknown> {
  key: string;
  savedAt: number;
  items: T[];
}

// In-memory cache for ultra-fast synchronous or 0ms access during the current session
const memory = new Map<string, CacheRecord<any>>();
const pending = new Map<string, Promise<any[]>>();

let dbPromise: Promise<IDBDatabase | null> | null = null;

// IndexedDB Helper
function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => {
          console.warn('IndexedDB open error:', e);
          resolve(null);
        };
        request.onblocked = () => {
          console.warn('IndexedDB blocked');
          resolve(null);
        };
      } catch (e) {
        console.warn('IndexedDB exception:', e);
        resolve(null);
      }
    });
  }
  return dbPromise;
}

export async function idbGetRecord<T>(key: string): Promise<CacheRecord<T> | null> {
  const db = await openDatabase();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const record = req.result as CacheRecord<T> | undefined;
        if (record && Number.isFinite(record.savedAt) && Array.isArray(record.items)) {
          resolve(record);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function idbSetRecord<T>(key: string, items: T[], savedAt = Date.now()): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ key, savedAt, items });
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Synchronous read from in-memory cache if already loaded into memory.
 */
export function getMemoryCachedCatalog<T = any>(key: string): T[] | null {
  const entry = memory.get(key);
  if (entry && Array.isArray(entry.items)) {
    return entry.items as T[];
  }
  return null;
}

/**
 * Loads a list with dual-layer caching (In-Memory -> IndexedDB -> Network).
 * If valid cached data exists, it returns immediately without any network calls!
 */
export function loadMapList<T>(
  key: string,
  fetchItems: () => Promise<T[]>,
  refresh = false,
  maxAge = CATALOG_CACHE_MAX_AGE
): Promise<T[]> {
  // Deduplicate concurrent requests
  const inFlight = pending.get(key);
  if (inFlight) return inFlight as Promise<T[]>;

  const work = async (): Promise<T[]> => {
    let cached = memory.get(key);

    // 1. If in memory and not expired, return immediately
    if (!refresh && cached && Date.now() - cached.savedAt < maxAge) {
      return cached.items as T[];
    }

    // 2. If not in memory, check IndexedDB
    if (!cached) {
      try {
        const idbRecord = await idbGetRecord<T>(key);
        if (idbRecord) {
          cached = idbRecord;
          memory.set(key, idbRecord);
        }
      } catch (err) {
        console.warn('Error reading from IndexedDB:', err);
      }
    }

    // If IndexedDB had valid, fresh data, return it without network request
    if (!refresh && cached && Date.now() - cached.savedAt < maxAge) {
      return cached.items as T[];
    }

    // 3. Needs network fetch
    let items: T[];
    try {
      items = await fetchItems();
    } catch (error) {
      // If network fails (e.g. offline), return cached data if any exists
      if (cached && Array.isArray(cached.items) && cached.items.length > 0) {
        console.warn(`Network fetch failed for ${key}, using cached fallback:`, error);
        return cached.items as T[];
      }
      throw error;
    }

    const record: CacheRecord<T> = { key, savedAt: Date.now(), items };
    memory.set(key, record);
    // Persist to IndexedDB in background
    void idbSetRecord(key, items, record.savedAt);

    return items;
  };

  const request = work().finally(() => pending.delete(key));
  pending.set(key, request);
  return request as Promise<T[]>;
}

const catalogSources = {
  uzum: { endpoint: 'uzum-points', filename: 'uzum_delivery_points_yaqintop.json' },
  gameClubs: { endpoint: 'game-clubs', filename: 'game_clubs_yaqintop.json' },
  korzinka: { endpoint: 'korzinka-stores', filename: 'korzinka_stores_yaqintop.json' },
  korzinkaProducts: { endpoint: 'korzinka-products', filename: 'korzinka_products_yaqintop.json' },
};

const isLocalEnv = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.port === '3000'
);

export function loadMapCatalog(catalog: keyof typeof catalogSources, refresh = false): Promise<any[]> {
  const { endpoint, filename } = catalogSources[catalog];
  return loadMapList(
    catalog,
    async () => {
      const urls = isLocalEnv
        ? [
            '/api/local/' + endpoint,
            import.meta.env.BASE_URL + filename,
            '/' + filename,
            'https://tezda-customer.vercel.app/' + filename,
          ]
        : [
            import.meta.env.BASE_URL + filename,
            '/' + filename,
            'https://tezda-customer.vercel.app/' + filename,
            'https://tez-api.vercel.app/api/local/' + endpoint,
          ];
      for (const url of new Set(urls)) {
        try {
          const response = await fetch(url);
          if (!response.ok) continue;
          const contentType = response.headers.get('content-type') || '';
          if (contentType && !contentType.includes('application/json')) continue;
          const items = await response.json();
          if (Array.isArray(items) && items.length) return items;
        } catch {
          // Try next url
        }
      }
      throw new Error('Map catalog unavailable: ' + catalog);
    },
    refresh,
    CATALOG_CACHE_MAX_AGE
  );
}

/**
 * Preloads all static map catalogs into memory from IndexedDB.
 * Call this as early as possible on application start.
 */
export function preloadMapCatalogs(): void {
  if (typeof window === 'undefined') return;
  const catalogs: (keyof typeof catalogSources)[] = ['uzum', 'gameClubs', 'korzinka'];
  for (const catalog of catalogs) {
    void loadMapCatalog(catalog).catch(() => {});
  }
}
