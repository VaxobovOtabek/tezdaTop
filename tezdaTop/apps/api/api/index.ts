import type { VercelRequest, VercelResponse } from '@vercel/node';
import app, { ensureDbInitialized } from '../src/server.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (ensureDbInitialized) {
      await ensureDbInitialized();
    }
    return (app as any)(req, res);
  } catch (err: any) {
    console.error('[YaqinTop Lambda Fatal]', err);
    return res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Serverda xatolik yuz berdi',
      error: err?.message || String(err)
    });
  }
}
