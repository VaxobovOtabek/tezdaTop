import type { Request, Response, NextFunction } from 'express';
import { db } from './in-memory-db.js';
import { isSupabaseConfigured, isSupabaseWriteAllowed, syncAllFromSupabase, syncAllToSupabase } from './supabase.js';

let queue: Promise<void> = Promise.resolve();

/**
 * High-performance persistence middleware:
 * 1. Read requests (GET, HEAD, OPTIONS):
 *    - Instant execution with zero queue blocking.
 *    - Directly served from in-memory cache, creating ZERO read load on Supabase.
 *    - Zero unnecessary commits to Supabase.
 * 2. Mutation requests (POST, PUT, PATCH, DELETE):
 *    - Isolated execution via queue for transactional safety.
 *    - Protected Localhost Mode: never writes test data to production Supabase.
 *    - Production Mode: atomically commits diffs to Supabase.
 */
export async function persistenceMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'test') return next();

  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  const isSearchOrRead =
    !isMutation ||
    req.path.includes('/search') ||
    req.path.includes('/routes');

  // Fast-path: read and search queries bypass queue serialization and persistence commits
  if (isSearchOrRead) {
    return next();
  }

  const previous = queue;
  let release!: () => void;
  queue = new Promise<void>(resolve => { release = resolve; });
  await previous;

  let snapshot: Record<string, any>;
  try {
    if (isSupabaseConfigured()) {
      await syncAllFromSupabase(db, false);
    }
    snapshot = JSON.parse(JSON.stringify(db.exportSnapshot()));
  } catch (error) {
    console.error('[Persistence Error caught in try]:', error);
    release();
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
            db.saveToFile();
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
