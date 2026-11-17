import type { Request, Response } from 'express';
import app from '../src/server.js';
import { createLocalOriginProxy } from '../src/local-origin-proxy.js';

const { LOCAL_API_ORIGIN, LOCAL_API_SHARED_SECRET } = process.env;
const localOrigin = LOCAL_API_ORIGIN ? URL.parse(LOCAL_API_ORIGIN) : null;
const proxyToLocal = localOrigin?.protocol === 'https:' && localOrigin.href === `${localOrigin.origin}/` &&
  LOCAL_API_SHARED_SECRET && LOCAL_API_SHARED_SECRET.length >= 32
  ? createLocalOriginProxy(localOrigin, LOCAL_API_SHARED_SECRET)
  : undefined;

export default async function handler(req: Request, res: Response) {
  try {
    // If Vercel rewritten URL stripped the subpath, recover original request path
    const matchedPath = (req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || '') as string;
    if (matchedPath && (req.url === '/api' || req.url === '/api/index' || req.url === '/api/')) {
      req.url = matchedPath;
    }

    if (await proxyToLocal?.(req, res) || res.destroyed) return;
    return (app as any)(req, res);
  } catch (err: any) {
    console.error('[YaqinTop Lambda Fatal]', err);
    if (!res.headersSent) {
      return res.status(500).json({
        code: 'SERVER_ERROR',
        message: 'Serverda xatolik yuz berdi'
      });
    }
  }
}
