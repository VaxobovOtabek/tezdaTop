import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/in-memory-db.js';
import { getCurrentUser } from '../middleware/auth.middleware.js';
import { isSupabaseConfigured, syncAllToSupabase } from '../db/supabase.js';

export const systemRouter = Router();

systemRouter.post('/sync-supabase', async (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  const secretHeader = req.headers['x-sync-secret'];
  const secretKey = typeof secretHeader === 'string' ? secretHeader : undefined;
  const isAuthorizedAdmin = Boolean(user && ['ADMIN', 'SUPERADMIN'].includes(user.role));

  let isAuthorizedSecret = false;
  if (process.env.SYNC_SECRET && secretKey) {
    const expected = Buffer.from(process.env.SYNC_SECRET, 'utf8');
    const actual = Buffer.from(secretKey, 'utf8');
    if (expected.length === actual.length && crypto.timingSafeEqual(expected, actual)) {
      isAuthorizedSecret = true;
    }
  }

  if (!isAuthorizedAdmin && !isAuthorizedSecret) {
    return res.status(403).json({ success: false, error: 'Ruxsat etilmagan: Faqat administrator yoki maxfiy kalit orqali' });
  }

  try {
    if (!isSupabaseConfigured()) {
      return res.status(400).json({ success: false, error: 'Supabase credentials not configured' });
    }
    const success = await syncAllToSupabase(db);
    return res.json({ success, message: 'Database successfully synchronized with Supabase cloud' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Sync failed' });
  }
});
