import type { Request, Response, NextFunction } from 'express';
import { db } from './in-memory-db.js';
import { isSupabaseConfigured, syncAllFromSupabase, syncAllToSupabase } from './supabase.js';

let queue: Promise<void> = Promise.resolve();
/** The legacy domain model is mutable: isolate each request and commit before replying. */
export async function persistenceMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'test') return next();
  const previous = queue; let release!: () => void;
  queue = new Promise<void>(resolve => { release = resolve; });
  await previous;
  let snapshot: Record<string, any>;
  try {
    if (isSupabaseConfigured()) await syncAllFromSupabase(db);
    snapshot = JSON.parse(JSON.stringify(db.exportSnapshot()));
  } catch (error) { release(); return next(error); }
  db.persistenceManaged = true;
  let ended = false;
  const end = res.end.bind(res);
  res.end = function (...args: any[]) {
    if (ended) return res;
    ended = true;
    void (async () => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          if (isSupabaseConfigured()) await syncAllToSupabase(db);
          else { db.persistenceManaged = false; if (!db.saveToFile()) throw new Error('Local persistence failed'); }
        } else db.restoreSnapshot(snapshot);
        (end as any)(...args);
      } catch (error: any) {
        db.restoreSnapshot(snapshot);
        res.removeHeader('Content-Length'); res.removeHeader('ETag'); res.removeHeader('Set-Cookie');
        res.statusCode = error.status || 503;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        end(JSON.stringify({ code: error.code || 'PERSISTENCE_FAILED', message: error.message || 'Ma’lumot saqlanmadi.' }));
      } finally { db.persistenceManaged = false; release(); }
    })();
    return res;
  } as any;
  res.once('close', () => { if (!ended) { ended = true; db.restoreSnapshot(snapshot); db.persistenceManaged = false; release(); } });
  next();
}
