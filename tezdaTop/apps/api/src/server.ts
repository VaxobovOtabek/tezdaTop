import express, { Express, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { createHash, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db/in-memory-db.js';
import { syncAllFromSupabase, isSupabaseConfigured } from './db/supabase.js';
import { persistenceMiddleware } from './db/persistence-middleware.js';
import { adminReadMiddleware } from './routes/admin-read.routes.js';
import {
  corsMiddleware,
  securityHeadersMiddleware,
  csrfProtectionMiddleware,
  ALLOWED_ORIGINS,
  isAllowedOrigin
} from './middleware/security.middleware.js';
import { getCurrentUser, requireStaffRole } from './middleware/auth.middleware.js';
import { createRateLimiter } from './middleware/rate-limiter.js';

// Modular Route Handlers
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { searchRouter } from './routes/search.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { storesRouter, offersRouter } from './routes/stores.routes.js';
import { routingRouter } from './routes/routing.routes.js';
import { bookmarksRouter } from './routes/bookmarks.routes.js';
import { reportsRouter } from './routes/reports.routes.js';
import { userHubRouter } from './routes/user-hub.routes.js';
import { proposalsRouter } from './routes/proposals.routes.js';
import { reviewsRouter } from './routes/reviews.routes.js';
import { merchantRouter } from './routes/merchant.routes.js';
import { adminAppsRouter } from './routes/admin-apps.routes.js';
import { adminUsersRouter } from './routes/admin-users.routes.js';
import { adminOrgsRouter } from './routes/admin-orgs.routes.js';
import { systemRouter } from './routes/system.routes.js';
import { dealerRouter } from './routes/dealer.routes.js';
import { adminDealersRouter } from './routes/admin-dealers.routes.js';

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
const PORT = Number(process.env.PORT || 4000);
const isLocalOrigin = !process.env.VERCEL && process.env.YAQINTOP_LOCAL_ORIGIN === '1';
const listenHost = isLocalOrigin ? '127.0.0.1' : process.env.YAQINTOP_LISTEN_HOST;
const localSecret = process.env.LOCAL_API_SHARED_SECRET ?? '';

export const app: Express = express();
app.set('trust proxy', 1);

let isDbReady = false;
let initPromise: Promise<void> | null = null;

export async function ensureDbInitialized() {
  if (isDbReady) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        if (isLocalOrigin && (!isProduction || !isSupabaseConfigured())) {
          throw new Error('The local production origin requires production mode and a configured Supabase database');
        }
        if (isProduction && process.env.NODE_ENV !== 'test' && !isSupabaseConfigured()) {
          throw new Error('A configured Supabase database is required in production');
        }
        if (isLocalOrigin && localSecret.length < 32) {
          throw new Error('The local production origin requires LOCAL_API_SHARED_SECRET with at least 32 characters');
        }
        if (isProduction && process.env.NODE_ENV !== 'test' && !process.env.SESSION_SECRET && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
          throw new Error('A backend session signing secret must be configured');
        }
        if (isProduction && process.env.NODE_ENV !== 'test' && process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length < 32) {
          throw new Error('SESSION_SECRET must contain at least 32 characters');
        }
        // 1. Birinchi navbatda lokal disk keshidan bazani tezkor yuklash (Supabase Free Tier'ni tejaydi)
        const localLoaded = !isSupabaseConfigured() && db.loadFromFile();
        const seedPath = './db/' + 'seed.js';
        const demo: {
          seedDatabase(): Promise<void>;
          bootstrapSirdaryoPilotData(database: typeof db): Promise<boolean>;
          bootstrapSurxondaryoStores?(database: typeof db): Promise<boolean>;
        } | undefined = isProduction ? undefined : await import(seedPath);

        // 2. Agar Supabase sozlangan bo'lsa, xavfsiz sinxronlash (kesh TTL ga amal qiladi)
        if (isSupabaseConfigured()) {
          await syncAllFromSupabase(db, isLocalOrigin, isLocalOrigin);
        } else if (demo && !localLoaded && process.env.ALLOW_DEMO_SEED === 'true') {
          await demo.seedDatabase();
          db.saveToFile();
        }

        if (demo && process.env.NODE_ENV !== 'test') {
          try {
            await demo.bootstrapSirdaryoPilotData(db);
            if (demo.bootstrapSurxondaryoStores) {
              await demo.bootstrapSurxondaryoStores(db);
            }
          } catch (bootErr: any) {
            console.warn('[Pilot Bootstrap Warning]', bootErr);
          }
        }

        isDbReady = true;
        console.log(`[YaqinTop DB] Ready with ${db.users.size} users, ${db.stores.size} stores, ${db.offers.size} offers.`);
      } catch (err) {
        isDbReady = false;
        throw err;
      }
    })();
  }
  try {
    await initPromise;
  } catch (error) {
    initPromise = null;
    throw error;
  }
}

// Global Core Middlewares
if (isLocalOrigin) {
  const expected = createHash('sha256').update(localSecret).digest();
  app.use((req, res, next) => {
    const provided = createHash('sha256').update(req.get('x-yaqintop-local-secret') ?? '').digest();
    if (!timingSafeEqual(expected, provided)) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(401).json({ code: 'UNAUTHORIZED' });
    }
    delete req.headers['x-yaqintop-local-secret'];
    const clientIp = req.get('x-yaqintop-client-ip');
    delete req.headers['x-forwarded-for'];
    if (clientIp && isIP(clientIp)) req.headers['x-forwarded-for'] = clientIp;
    res.setHeader('X-Yaqintop-Origin', 'local');
    next();
  });
} else if (process.env.VERCEL) {
  app.use((_req, res, next) => {
    res.setHeader('X-Yaqintop-Origin', 'vercel');
    next();
  });
}
app.use(corsMiddleware);
app.use(securityHeadersMiddleware);
app.get('/api/v1/health/live', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ status: 'live', release: 'shared-database-2026-11-17', timestamp: new Date().toISOString() });
});
app.use(express.json({ limit: '10mb', type: ['application/json', 'text/plain', 'application/*+json'] }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Read-only admin endpoints use independent, table-specific queries when Supabase is configured
app.use(adminReadMiddleware);

// Ensure DB is initialized before handling requests (for Serverless / Vercel support)
app.use(async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureDbInitialized();
    next();
  } catch (err) {
    res.status(503).json({ code: 'DATABASE_UNAVAILABLE', message: 'Baza vaqtincha mavjud emas.' });
  }
});

// Snapshot and Transaction Persistence
app.use(persistenceMiddleware);

// Omit sensitive authentication hashes from all JSON serialization automatically
app.set('json replacer', (key: string, value: unknown) =>
  ['passwordHash', 'password_hash', 'plainPassword', 'verificationCode', 'requestedPassword'].includes(key) ? undefined : value
);

// CSRF Protection Middleware
app.use(csrfProtectionMiddleware);

// Request tracking & audit header
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', String(reqId));
  next();
});

// ================= API ROUTE REGISTRATIONS =================
app.use(healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/stores', storesRouter);
app.use('/api/v1/offers', offersRouter);
app.use('/api/v1/routes', routingRouter);
app.use('/api/v1/bookmarks', bookmarksRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/user', userHubRouter);
app.use(proposalsRouter);
app.use(reviewsRouter);
app.use('/api/v1', merchantRouter);
app.use('/api/v1/admin', adminAppsRouter);
app.use('/api/v1/admin', adminUsersRouter);
app.use('/api/v1/admin', adminOrgsRouter);
app.use('/api/v1/system', systemRouter);

// Dealer & Distribution CRM Routes
app.use('/api/v1/dealer', (req, res, next) => {
  const user = getCurrentUser(req);
  (req as any).user = user;
  next();
}, dealerRouter);

app.use('/api/v1/admin/dealers', (req, res, next) => {
  const user = getCurrentUser(req);
  (req as any).user = user;
  next();
}, adminDealersRouter);

// Local development endpoints for Uzum Points and Game Clubs
app.get('/api/local/uzum-points', async (_req: Request, res: Response) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const candidatePaths = [
      path.resolve(process.cwd(), 'uzummarket/uzum_delivery_points_yaqintop.json'),
      path.resolve(process.cwd(), '../uzummarket/uzum_delivery_points_yaqintop.json'),
      path.resolve(process.cwd(), '../../uzummarket/uzum_delivery_points_yaqintop.json'),
      path.resolve(__dirname, '../../uzummarket/uzum_delivery_points_yaqintop.json'),
      path.resolve(__dirname, '../../../uzummarket/uzum_delivery_points_yaqintop.json')
    ];
    const targetPath = candidatePaths.find(p => fs.existsSync(p));
    if (targetPath) {
      res.setHeader('Content-Type', 'application/json');
      fs.createReadStream(targetPath).pipe(res);
      return;
    }
  } catch {}
  res.json([]);
});

app.get('/api/local/game-clubs', async (_req: Request, res: Response) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const candidatePaths = [
      path.resolve(process.cwd(), 'gameClub/game_clubs_yaqintop.json'),
      path.resolve(process.cwd(), '../gameClub/game_clubs_yaqintop.json'),
      path.resolve(process.cwd(), '../../gameClub/game_clubs_yaqintop.json'),
      path.resolve(__dirname, 'data/game_clubs_yaqintop.json'),
      path.resolve(__dirname, '../src/data/game_clubs_yaqintop.json'),
      path.resolve(process.cwd(), 'apps/api/src/data/game_clubs_yaqintop.json'),
      path.resolve(process.cwd(), 'apps/customer/public/game_clubs_yaqintop.json')
    ];
    const targetPath = candidatePaths.find(p => fs.existsSync(p));
    if (targetPath) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      fs.createReadStream(targetPath).pipe(res);
      return;
    }
  } catch {}
  res.json([]);
});

app.get('/api/local/korzinka-stores', async (_req: Request, res: Response) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const candidatePaths = [
      path.resolve(__dirname, 'data/korzinka_stores_yaqintop.json'),
      path.resolve(__dirname, '../src/data/korzinka_stores_yaqintop.json'),
      path.resolve(process.cwd(), 'apps/api/src/data/korzinka_stores_yaqintop.json'),
      path.resolve(process.cwd(), 'apps/customer/public/korzinka_stores_yaqintop.json'),
      path.resolve(process.cwd(), 'korzinka/korzinka-stores.json')
    ];
    const targetPath = candidatePaths.find(p => fs.existsSync(p));
    if (targetPath) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      fs.createReadStream(targetPath).pipe(res);
      return;
    }
  } catch {}
  res.json([]);
});

// Global Error Handler (always JSON)
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  console.error('[YaqinTop API Error]', err);
  if (res.headersSent) {
    return next(err);
  }
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    code: err.code || 'SERVER_ERROR',
    message: status >= 500 ? 'Serverda ichki xatolik yuz berdi' : err.message
  });
});

// Start persistent server if not running in Serverless / Vercel environment
if (!process.env.VERCEL) {
  ensureDbInitialized().then(() => {
    const listening = () => {
      console.log(`[YaqinTop API] Server running on http://localhost:${PORT}/api/v1`);
    };
    if (listenHost) app.listen(PORT, listenHost, listening);
    else app.listen(PORT, listening);
  });
}

// Re-exports for backward-compatibility with tests & utilities
export {
  getCurrentUser,
  requireStaffRole,
  ALLOWED_ORIGINS,
  isAllowedOrigin,
  corsMiddleware,
  securityHeadersMiddleware,
  csrfProtectionMiddleware,
  createRateLimiter
};

export default app;
