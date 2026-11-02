import type { Request, Response } from 'express';
import app, { ensureDbInitialized } from '../src/server.js';

export default async function handler(req: Request, res: Response) {
  try {
    if (ensureDbInitialized) {
      await ensureDbInitialized();
    }

    // If Vercel rewritten URL stripped the subpath, recover original request path
    const matchedPath = (req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || '') as string;
    if (matchedPath && (req.url === '/api' || req.url === '/api/index' || req.url === '/api/')) {
      req.url = matchedPath;
    }

    return (app as any)(req, res);
  } catch (err: any) {
    console.error('[YaqinTop Lambda Fatal]', err);
    if (!res.headersSent) {
      return res.status(500).json({
        code: 'SERVER_ERROR',
        message: 'Serverda xatolik yuz berdi',
        error: err?.message || String(err)
      });
    }
  }
}
