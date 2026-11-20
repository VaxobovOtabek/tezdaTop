import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

export const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

export const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  'http://127.0.0.1:3005',
  process.env.DEALER_APP_URL,
  'http://localhost:4000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:3003',
  'http://127.0.0.1:3004',
  'http://127.0.0.1:4000',
  'https://yaqintop.uz',
  'https://www.yaqintop.uz',
  process.env.CUSTOMER_APP_URL,
  process.env.MERCHANT_APP_URL,
  process.env.ADMIN_APP_URL,
  process.env.MODERATOR_APP_URL,
  process.env.LANDING_APP_URL,
  process.env.PUBLIC_URL
].filter(Boolean) as string[]);

export function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();

    // Allow localhost and loopbacks on any port only in non-production development
    if (!isProduction) {
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '::1' ||
        host.endsWith('.localhost')
      ) {
        return true;
      }
    }

    // Allow private LAN IPs only in non-production development
    if (!isProduction) {
      if (
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
      ) {
        return true;
      }
    }

    // Allow legitimate production YaqinTop domains
    if (
      host === 'yaqintop.uz' ||
      host.endsWith('.yaqintop.uz')
    ) {
      return true;
    }

    // Allow only authentic YaqinTop / Tezda deployments on Vercel
    if (
      host === 'tez-api.vercel.app' ||
      host === 'tezda-admin.vercel.app' ||
      host === 'tezda-moderator.vercel.app' ||
      host === 'tezda-merchant.vercel.app' ||
      host === 'tezda-dealer.vercel.app' ||
      host === 'tezda-customer.vercel.app' ||
      /^(tezda|yaqintop)[a-z0-9-]*\.vercel\.app$/.test(host)
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(Object.assign(new Error('CORS policy: Not allowed by CORS'), { status: 403 }));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-request-id',
    'x-user-id',
    'x-user-email',
    'x-user-role',
    'x-idempotency-key',
    'idempotency-key'
  ]
});

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

export function csrfProtectionMiddleware(req: Request, res: Response, next: NextFunction) {
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
    req.cookies?.session_token &&
    req.headers.origin &&
    !isAllowedOrigin(req.headers.origin)
  ) {
    return res.status(403).json({ code: 'CSRF_REJECTED', message: 'Ruxsat etilmagan manba.' });
  }
  next();
}
