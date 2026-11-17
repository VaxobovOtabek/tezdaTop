import { request } from 'node:https';
import { isIP } from 'node:net';
import { pipeline } from 'node:stream/promises';
import type { Request, Response } from 'express';

const PROBE_TIMEOUT_MS = 1_500;
const PROBE_CACHE_MS = 3_000;
const REQUEST_TIMEOUT_MS = 12_000;
const HOP_HEADERS = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade',
]);
const REQUEST_HEADERS = new Set([
  'accept', 'accept-language', 'authorization', 'content-type', 'content-length',
  'cookie', 'origin', 'referer', 'if-none-match', 'if-modified-since', 'range',
  'access-control-request-headers', 'access-control-request-method',
  'x-request-id', 'idempotency-key', 'x-idempotency-key', 'x-sync-secret',
]);

export function createLocalOriginProxy(origin: URL, secret: string) {
  const accessHeaders = {
    'x-yaqintop-local-secret': secret,
    'ngrok-skip-browser-warning': '1',
  };
  let healthy = false;
  let checkedUntil = 0;
  let pending: Promise<boolean> | undefined;

  function localIsReady(): Promise<boolean> {
    if (Date.now() < checkedUntil) return Promise.resolve(healthy);
    pending ??= fetch(new URL('/api/v1/health/ready', origin), {
      headers: accessHeaders,
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    }).then(async response => {
      await response.body?.cancel();
      return response.ok && response.headers.get('x-yaqintop-origin') === 'local';
    }).catch(() => false).then(result => {
      healthy = result;
      checkedUntil = Date.now() + PROBE_CACHE_MS;
      pending = undefined;
      return result;
    });
    return pending;
  }

  return async function proxyToLocal(req: Request, res: Response): Promise<boolean> {
    const path = req.url;
    if (!path?.startsWith('/api/') || !await localIsReady() || res.destroyed) return false;

    const headers = Object.fromEntries(Object.entries(req.headers).filter(([name]) => REQUEST_HEADERS.has(name)));
    const clientIp = req.headers['x-vercel-forwarded-for'];
    if (typeof clientIp === 'string' && isIP(clientIp)) headers['x-yaqintop-client-ip'] = clientIp;
    const canRetry = req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS';
    const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    try {
      await new Promise<void>((resolve, reject) => {
        const upstream = request(origin, { path, method: req.method, headers: { ...headers, ...accessHeaders }, signal });
        upstream.on('error', reject);
        res.once('close', () => upstream.destroy());
        upstream.once('response', response => {
          if (response.headers['x-yaqintop-origin'] !== 'local' || (canRetry && response.headers['x-yaqintop-database-unavailable'] === '1')) {
            response.resume();
            reject(new Error('Local origin did not handle the request'));
            return;
          }

          const connectionHeaders = new Set(response.headers.connection?.split(',').map(name => name.trim().toLowerCase()));
          res.statusCode = response.statusCode ?? 502;
          for (const [name, value] of Object.entries(response.headers)) {
            if (value !== undefined && !HOP_HEADERS.has(name) && !connectionHeaders.has(name)) {
              res.setHeader(name, value);
            }
          }
          res.flushHeaders();
          void pipeline(response, res).then(resolve, reject);
        });
        req.pipe(upstream);
      });
    } catch {
      healthy = false;
      checkedUntil = Date.now() + PROBE_CACHE_MS;
      if (res.headersSent || res.destroyed) return true;
      if (canRetry) return false;

      // The local origin may already have processed the write. Never replay it.
      res.status(503).json({ code: 'LOCAL_API_UNAVAILABLE', message: 'So‘rov natijasini tekshirib, qayta urinib ko‘ring.' });
    }
    return true;
  };
}
