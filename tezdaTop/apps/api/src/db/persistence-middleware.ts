import type { Request, Response, NextFunction } from 'express';
import { db } from './in-memory-db.js';
import { isSupabaseConfigured, shouldRefreshSupabase, syncAllFromSupabase, syncAllToSupabase } from './supabase.js';

let queue: Promise<void> = Promise.resolve();

// Refresh shared snapshots at most once per interval on the read path.
// A mutation verifies the remote version before it runs and commits atomically before success.
export async function persistenceMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'test') return next();

  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  const isSearchOrRead =
    !isMutation ||
    req.path.includes('/search') ||
    req.path.includes('/routes');
  const localOrigin = !process.env.VERCEL && process.env.YAQINTOP_LOCAL_ORIGIN === '1';
  const refreshRead = isSearchOrRead && shouldRefreshSupabase();

  // Fast-path: read and search queries bypass queue serialization and persistence commits
  if (isSearchOrRead && !refreshRead) {
    return next();
  }

  const previous = queue;
  let release!: () => void;
  queue = new Promise<void>(resolve => { release = resolve; });
  await previous;

  if (isSearchOrRead) {
    try {
      if (shouldRefreshSupabase()) await syncAllFromSupabase(db, false, localOrigin);
    } catch {
      res.setHeader('X-Yaqintop-Database-Unavailable', '1');
      return res.status(503).json({ code: 'DATABASE_UNAVAILABLE', message: 'Baza vaqtincha mavjud emas.' });
    } finally {
      release();
    }
    return next();
  }

  let snapshot: Record<string, any>;
  try {
    if (isSupabaseConfigured()) {
      await syncAllFromSupabase(db, false, true);
    }
    snapshot = JSON.parse(JSON.stringify(db.exportSnapshot()));
  } catch (error) {
    console.error('[Persistence Error caught in try]:', error);
    release();
    if (isSupabaseConfigured()) {
      res.setHeader('X-Yaqintop-Database-Unavailable', '1');
      return res.status(503).json({ code: 'DATABASE_UNAVAILABLE', message: 'Baza vaqtincha mavjud emas.' });
    }
    return next(error);
  }

  db.persistenceManaged = true;
  let ended = false;
  const end = res.end.bind(res);

  res.end = function (...args: any[]) {
    if (ended) return res;
    ended = true;
    void (async () => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          if (isSupabaseConfigured()) {
            await syncAllToSupabase(db);
          } else {
            // Local development: persist to local JSON file, guarding production Supabase
            db.persistenceManaged = false;
            if (!db.saveToFile()) throw new Error('Could not save the local database');
          }
        } else {
          db.restoreSnapshot(snapshot);
        }
        (end as any)(...args);
      } catch (error: any) {
        console.error('[Persistence Error caught in res.end]:', error);
        db.restoreSnapshot(snapshot);
        res.removeHeader('Content-Length');
        res.removeHeader('ETag');
        res.removeHeader('Set-Cookie');
        res.statusCode = error.status || 503;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        end(JSON.stringify({ code: error.code || 'PERSISTENCE_FAILED', message: error.message || 'Ma’lumot saqlanmadi.' }));
      } finally {
        db.persistenceManaged = false;
        release();
      }
    })();
    return res;
  } as any;

  res.once('close', () => {
    if (!ended) {
      ended = true;
      db.restoreSnapshot(snapshot);
      db.persistenceManaged = false;
      release();
    }
  });

  next();
}
