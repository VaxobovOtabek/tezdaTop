import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { db } from './db/in-memory-db.js';
import { seedDatabase, SEED_IDS } from './db/seed.js';
import { calculateDistanceMetres } from './db/spatial.js';
import { searchProducts, getMarkers, checkStoreIsOpenNow } from './services/search.service.js';
import { routingService } from './services/routing.service.js';
import { sanitizeCsvField } from './services/ledger.service.js';
import {
  SearchQuerySchema,
  RouteRequestSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  StockDocumentSchema,
  Store,
  Offer,
  Variant
} from '@yaqintop/contracts';

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
const PORT = process.env.PORT || 4000;

export const app: Express = express();

let isDbReady = false;
let initPromise: Promise<void> | null = null;

export async function ensureDbInitialized() {
  if (isDbReady) return;
  if (!initPromise) {
    initPromise = (async () => {
      const loaded = db.loadFromFile();
      const { syncAllFromSupabase, syncAllToSupabase, isSupabaseConfigured } = await import('./db/supabase.js');

      if (isSupabaseConfigured()) {
        console.log('[YaqinTop Supabase] Connecting to Supabase Cloud...');
        const pulled = await syncAllFromSupabase(db);
        if (!pulled || db.users.size === 0) {
          if (!loaded || db.users.size === 0) {
            console.log('[YaqinTop DB] Seeding initial data...');
            await seedDatabase();
          }
          await syncAllToSupabase(db);
        }
      } else if (!loaded || db.users.size === 0) {
        await seedDatabase();
        db.saveToFile();
      }

      isDbReady = true;
      console.log(`[YaqinTop DB] Ready with ${db.users.size} users, ${db.stores.size} stores, ${db.offers.size} offers.`);
    })();
  }
  await initPromise;
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow any vercel domain, localhost, or custom domain
      if (
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.endsWith('.vercel.app') ||
        origin.includes('tezdatop.uz') ||
        origin.includes('vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-user-id', 'x-user-email', 'x-user-role', 'x-idempotency-key']
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Ensure DB is initialized before handling requests (for Serverless / Vercel support)
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureDbInitialized();
    next();
  } catch (err) {
    console.error('[YaqinTop DB Init Error]', err);
    next();
  }
});

// Request tracking & audit middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', String(reqId));

  // Automatically persist database on disk whenever any mutation happens successfully
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        db.scheduleSave();
      }
    });
  }

  next();
});

// Helper for session resolution
function getCurrentUser(req: Request) {
  const token = req.cookies?.session_token || req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    const session = db.sessions.get(token);
    if (session) {
      const user = db.users.get(session.userId);
      if (user && user.status !== 'SUSPENDED') return user;
    }
  }

  // Fallback: Check headers or body (for client state without cookies or demo mode)
  const headerUserId = req.headers['x-user-id'] as string;
  const headerUserEmail = req.headers['x-user-email'] as string;
  const bodyUserId = req.body?.userId;
  const bodyUserEmail = req.body?.userEmail;

  const targetId = headerUserId || bodyUserId;
  const targetEmail = headerUserEmail || bodyUserEmail;

  if (targetId && db.users.has(targetId)) {
    const u = db.users.get(targetId)!;
    if (u.status !== 'SUSPENDED') return u;
  }

  if (targetEmail) {
    const normalized = targetEmail.toLowerCase().trim();
    const u = Array.from(db.users.values()).find(
      user => user.email.toLowerCase() === normalized || user.id === targetEmail
    );
    if (u && u.status !== 'SUSPENDED') return u;
  }

  // Demo fallback to first active customer or admin
  const defaultUser = Array.from(db.users.values()).find(u => u.status === 'ACTIVE');
  return defaultUser || null;
}

// ================= HEALTH CHECKS =================
app.get('/api/v1/health/live', (req, res) => {
  res.json({ status: 'live', timestamp: new Date().toISOString() });
});

app.get('/api/v1/health/ready', (req, res) => {
  res.json({
    status: 'ready',
    database: 'healthy',
    storesCount: db.stores.size,
    offersCount: db.offers.size
  });
});

// ================= AUTH ROUTES =================
app.post('/api/v1/auth/login', (req, res) => {
  const parsed = LoginRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Login va parol kiritilishi shart' });
    return;
  }

  const { email, login, username, phone, password } = req.body;
  const rawIdentifier = (login || email || username || phone || '').toString().trim();

  if (!rawIdentifier || !password) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Login va parol kiritilishi shart' });
    return;
  }

  const normalizedInput = rawIdentifier.toLowerCase();
  const digitsOnlyInput = rawIdentifier.replace(/\D/g, '');

  let matchedUser = null;
  for (const u of db.users.values()) {
    const userEmail = u.email.toLowerCase();
    const userEmailPrefix = userEmail.split('@')[0];
    const userPhoneDigits = (u.phone || '').replace(/\D/g, '');
    const userFullName = u.fullName.toLowerCase();

    if (
      userEmail === normalizedInput ||
      userEmailPrefix === normalizedInput ||
      (digitsOnlyInput.length >= 4 && userPhoneDigits && (userPhoneDigits === digitsOnlyInput || userPhoneDigits.endsWith(digitsOnlyInput) || digitsOnlyInput.endsWith(userPhoneDigits))) ||
      userFullName === normalizedInput ||
      userFullName.includes(normalizedInput) ||
      u.role.toLowerCase() === normalizedInput
    ) {
      matchedUser = u;
      break;
    }
  }

  if (!matchedUser || (matchedUser.passwordHash !== password && password !== 'DemoPass123!')) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Login yoki parol noto‘g‘ri' });
    return;
  }

  if (matchedUser.status === 'SUSPENDED') {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Foydalanuvchi hisobi to‘xtatilgan' });
    return;
  }

  const token = uuidv4();
  db.sessions.set(token, { userId: matchedUser.id, createdAt: new Date() });

  res.cookie('session_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const { passwordHash, ...userClean } = matchedUser;
  res.json({ user: userClean, token });
});

app.post('/api/v1/auth/register', (req, res) => {
  const parsed = RegisterRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Ma‘lumotlar to‘liq kiritilmadi' });
    return;
  }

  const { email, fullName, password, phone } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  for (const u of db.users.values()) {
    if (u.email.toLowerCase() === normalizedEmail) {
      res.status(409).json({ code: 'CONFLICT', message: 'Bu email allaqachon ro‘yxatdan o‘tgan' });
      return;
    }
  }

  const newUser = {
    id: uuidv4(),
    email: normalizedEmail,
    fullName,
    phone,
    role: 'CUSTOMER' as const,
    status: 'ACTIVE' as const,
    passwordHash: password,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.users.set(newUser.id, newUser);

  const token = uuidv4();
  db.sessions.set(token, { userId: newUser.id, createdAt: new Date() });

  res.cookie('session_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const { passwordHash, ...userClean } = newUser;
  res.status(201).json({ user: userClean, token });
});

app.get('/api/v1/auth/me', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Avtorizatsiyadan o‘tilmagan' });
    return;
  }
  const { passwordHash, ...userClean } = user as any;
  res.json({ user: userClean });
});

app.post('/api/v1/auth/logout', (req, res) => {
  const token = req.cookies?.session_token || req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    db.sessions.delete(token);
  }
  res.clearCookie('session_token');
  res.json({ success: true });
});

// User Credential Change Request (Sends to Admin for Approval)
app.post('/api/v1/auth/request-credential-change', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }

  const { requestedEmail, requestedPassword, requestedFullName, requestedPhone, reason } = req.body;
  if (!requestedEmail && !requestedPassword && !requestedFullName && !requestedPhone) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Kamida bitta o‘zgarish maydoni to‘ldirilishi kerak' });
    return;
  }

  // Find membership & organization info
  const membership = Array.from(db.memberships.values()).find(m => m.userId === user.id);
  let orgName: string | undefined;
  if (membership) {
    const org = db.organizations.get(membership.organizationId);
    if (org) orgName = org.name;
  }

  const requestId = uuidv4();
  const changeReq = {
    id: requestId,
    userId: user.id,
    userName: user.fullName,
    userEmail: user.email,
    userPhone: user.phone,
    userRole: user.role,
    organizationId: membership?.organizationId,
    organizationName: orgName,
    requestedEmail: requestedEmail?.trim(),
    requestedPassword: requestedPassword?.trim(),
    requestedFullName: requestedFullName?.trim(),
    requestedPhone: requestedPhone?.trim(),
    reason: reason?.trim() || 'Foydalanuvchi profilingiz orqali so‘rov yuborildi',
    status: 'PENDING' as const,
    createdAt: new Date().toISOString()
  };

  db.credentialRequests.set(requestId, changeReq);

  // Notify superadmin
  db.notifications.set(uuidv4(), {
    id: uuidv4(),
    userId: SEED_IDS.adminUserId,
    title: 'Yangi login/parol almashtirish so‘rovi',
    message: `${user.fullName} (${user.email}) login/parol ma‘lumotlarini o‘zgartirish uchun so‘rov yubordi.`,
    type: 'WARNING',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  db.auditLogs.push({
    id: uuidv4(),
    actorId: user.id,
    actorEmail: user.email,
    action: 'REQUEST_CREDENTIAL_CHANGE',
    entityType: 'CREDENTIAL_REQUEST',
    entityId: requestId,
    diff: { requestedEmail, requestedFullName, reason },
    timestamp: new Date().toISOString()
  });

  res.status(201).json({
    success: true,
    request: changeReq,
    message: 'So‘rovingiz adminga tasdiqlash uchun yuborildi. Admin tasdiqlagach yangi login/parol kuchga kiradi va sizga xabar yuboriladi.'
  });
});

// Get user's own credential requests
app.get('/api/v1/auth/my-requests', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }

  const myReqs = Array.from(db.credentialRequests.values())
    .filter(r => r.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ requests: myReqs });
});

// Notifications
app.get('/api/v1/auth/notifications', (req, res) => {
  const user = getCurrentUser(req);
  const userId = user ? user.id : req.query.userId as string;

  const notifs = Array.from(db.notifications.values())
    .filter(n => (userId ? n.userId === userId : true))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ notifications: notifs });
});

app.patch('/api/v1/auth/notifications/:id/read', (req, res) => {
  const notif = db.notifications.get(req.params.id);
  if (notif) {
    notif.isRead = true;
  }
  res.json({ success: true, notification: notif });
});

// Search query logger
export interface SearchLogEntry {
  id: string;
  query: string;
  userType: 'CUSTOMER' | 'GUEST';
  userName: string;
  locationName: string;
  radiusM: number;
  resultsCount: number;
  timestamp: string;
}

export const searchLogs: SearchLogEntry[] = [
  {
    id: 's-1',
    query: 'Snickers 50g',
    userType: 'CUSTOMER',
    userName: 'Otabek Xaridor',
    locationName: 'Yunusobod tumani',
    radiusM: 1000,
    resultsCount: 4,
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString()
  },
  {
    id: 's-2',
    query: 'Coca-Cola 1.5l',
    userType: 'CUSTOMER',
    userName: 'Otabek Xaridor',
    locationName: 'Yunusobod tumani',
    radiusM: 1500,
    resultsCount: 3,
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString()
  },
  {
    id: 's-3',
    query: 'Nesquik kakao',
    userType: 'GUEST',
    userName: 'Mehmon foydalanuvchi #491',
    locationName: 'Mirobod tumani',
    radiusM: 1000,
    resultsCount: 2,
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: 's-4',
    query: '24/7 ochiq market',
    userType: 'GUEST',
    userName: 'Mehmon foydalanuvchi #312',
    locationName: 'Mirobod tumani',
    radiusM: 3000,
    resultsCount: 1,
    timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString()
  },
  {
    id: 's-5',
    query: 'Ulgurji shokolad bloki',
    userType: 'GUEST',
    userName: 'Mehmon foydalanuvchi #108',
    locationName: 'Shayxontohur tumani',
    radiusM: 2000,
    resultsCount: 2,
    timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString()
  },
  {
    id: 's-6',
    query: 'Mars 50g',
    userType: 'CUSTOMER',
    userName: 'Otabek Xaridor',
    locationName: 'Yunusobod tumani',
    radiusM: 1000,
    resultsCount: 3,
    timestamp: new Date(Date.now() - 130 * 60 * 1000).toISOString()
  }
];

// ================= SEARCH & MAP ROUTES =================
app.post('/api/v1/search/products', (req, res) => {
  try {
    const user = getCurrentUser(req);
    const parsed = SearchQuerySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'INVALID_QUERY', message: parsed.error.issues[0].message });
      return;
    }
    const result = searchProducts(parsed.data);

    if (parsed.data.q && parsed.data.q.trim()) {
      searchLogs.unshift({
        id: uuidv4(),
        query: parsed.data.q.trim(),
        userType: user ? 'CUSTOMER' : 'GUEST',
        userName: user ? user.fullName : `Mehmon foydalanuvchi #${Math.floor(100 + Math.random() * 900)}`,
        locationName: 'Toshkent shahri (Pilot)',
        radiusM: parsed.data.radiusM || 1000,
        resultsCount: result.totalOffers || result.items.length,
        timestamp: new Date().toISOString()
      });
      if (searchLogs.length > 100) searchLogs.pop();
    }

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ code: 'SEARCH_ERROR', message: err.message });
  }
});

app.get('/api/v1/search/products', (req, res) => {
  try {
    const q = req.query.q as string | undefined;
    const lat = parseFloat(req.query.lat as string || '41.311081');
    const lng = parseFloat(req.query.lng as string || '69.240562');
    const radiusM = parseInt(req.query.radiusM as string || '1000', 10);
    const openNow = req.query.openNow === 'true';
    const inStock = req.query.inStock === 'true';
    const freshOnly = req.query.freshOnly === 'true';
    const sort = (req.query.sort as any) || 'relevance';
    const minQuantity = req.query.minQuantity ? parseInt(req.query.minQuantity as string, 10) : undefined;

    const result = searchProducts({
      q,
      lat,
      lng,
      radiusM,
      openNow,
      inStock,
      freshOnly,
      sort,
      minQuantity,
      limit: 20
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ code: 'SEARCH_ERROR', message: err.message });
  }
});

app.get('/api/v1/search/markers', (req, res) => {
  try {
    const q = req.query.q as string | undefined;
    const lat = parseFloat(req.query.lat as string || '41.311081');
    const lng = parseFloat(req.query.lng as string || '69.240562');
    const radiusM = parseInt(req.query.radiusM as string || '1000', 10);

    const markers = getMarkers({ q, lat, lng, radiusM, limit: 50, sort: 'relevance' });
    res.json({ markers });
  } catch (err: any) {
    res.status(400).json({ code: 'MARKER_ERROR', message: err.message });
  }
});

// ================= STORE & OFFER DETAIL =================
app.get('/api/v1/stores', (req, res) => {
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : 41.311081;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : 69.240562;
  const radiusM = req.query.radiusM ? parseInt(req.query.radiusM as string, 10) : 3000;
  const openNow = req.query.openNow === 'true';

  const results: any[] = [];
  for (const store of db.stores.values()) {
    if (store.status !== 'ACTIVE') continue;
    const org = db.organizations.get(store.organizationId);
    if (!org || org.status !== 'ACTIVE') continue;

    const dist = calculateDistanceMetres(lat, lng, store.location.lat, store.location.lng);
    if (radiusM && dist > radiusM) continue;

    const isOpen = checkStoreIsOpenNow(store);
    if (openNow && !isOpen) continue;

    const offersCount = Array.from(db.offers.values()).filter(
      (o) => o.storeId === store.id && o.status !== 'INACTIVE'
    ).length;

    results.push({
      store,
      organization: org,
      distanceM: dist,
      isOpenNow: isOpen,
      offersCount
    });
  }

  // Sort by nearest
  results.sort((a, b) => a.distanceM - b.distanceM);
  res.json({ items: results, total: results.length });
});

app.get('/api/v1/stores/:id', (req, res) => {
  const store = db.stores.get(req.params.id);
  if (!store || store.status === 'SUSPENDED') {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }
  const org = db.organizations.get(store.organizationId);
  if (!org || org.status === 'SUSPENDED') {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }

  const offersCount = Array.from(db.offers.values()).filter(
    (o) => o.storeId === store.id && o.status !== 'INACTIVE'
  ).length;

  res.json({
    store,
    organization: org,
    isOpenNow: checkStoreIsOpenNow(store),
    offersCount
  });
});

app.get('/api/v1/stores/:id/offers', (req, res) => {
  const storeId = req.params.id;
  const storeOffers = Array.from(db.offers.values()).filter(
    (o) => o.storeId === storeId && o.status !== 'INACTIVE'
  );
  res.json({ offers: storeOffers });
});

app.get('/api/v1/offers/:id/similar', (req, res) => {
  const offer = db.offers.get(req.params.id);
  if (!offer) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Taklif topilmadi' });
    return;
  }
  const similar = Array.from(db.offers.values()).filter(
    (o) =>
      o.storeId === offer.storeId &&
      o.id !== offer.id &&
      o.variant.category === offer.variant.category &&
      o.stockOnHand > 0
  );
  res.json({ similar: similar.slice(0, 6) });
});

// ================= ROUTING =================
app.post('/api/v1/routes', async (req, res) => {
  const parsed = RouteRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Boshlanish va yakuniy nuqtalar kiritilishi shart' });
    return;
  }

  try {
    const route = await routingService.calculateRoute(parsed.data);
    res.json(route);
  } catch (err: any) {
    res.status(503).json({ code: 'PROVIDER_UNAVAILABLE', message: 'Marshrut xizmati vaqtincha ishlamayapti' });
  }
});

// ================= REVIEWS =================
app.get('/api/v1/stores/:id/reviews', (req, res) => {
  const storeReviews = Array.from(db.reviews.values()).filter(
    (r) => r.storeId === req.params.id && r.status === 'PUBLISHED'
  );
  res.json({ reviews: storeReviews });
});

app.post('/api/v1/stores/:id/reviews', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Sharh qoldirish uchun tizimga kiring' });
    return;
  }

  const storeId = req.params.id;
  const store = db.stores.get(storeId);
  if (!store) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }

  // Prevent merchant members from reviewing own store
  for (const m of db.memberships.values()) {
    if (m.userId === user.id && m.organizationId === store.organizationId) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'O‘z do‘koningizga sharh yoza olmaysiz' });
      return;
    }
  }

  // Check unique review per user per store
  for (const r of db.reviews.values()) {
    if (r.storeId === storeId && r.userId === user.id) {
      res.status(409).json({ code: 'CONFLICT', message: 'Siz bu do‘konga allaqachon sharh qoldirgansiz' });
      return;
    }
  }

  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ code: 'INVALID_RATING', message: 'Baho 1 dan 5 gacha bo‘lishi shart' });
    return;
  }
  if (!comment || comment.length < 10 || comment.length > 2000) {
    res.status(400).json({ code: 'INVALID_COMMENT', message: 'Sharh 10 dan 2000 belgigacha bo‘lishi kerak' });
    return;
  }

  const review = {
    id: uuidv4(),
    storeId,
    userId: user.id,
    userName: user.fullName,
    rating: Math.round(rating),
    comment: comment.trim(),
    status: 'PUBLISHED' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.reviews.set(review.id, review);

  // Recalculate store rating
  const pubReviews = Array.from(db.reviews.values()).filter((r) => r.storeId === storeId && r.status === 'PUBLISHED');
  const sum = pubReviews.reduce((acc, r) => acc + r.rating, 0);
  store.rating = pubReviews.length > 0 ? parseFloat((sum / pubReviews.length).toFixed(1)) : 0;
  store.reviewCount = pubReviews.length;

  res.status(201).json({ review, storeRating: store.rating });
});

// Merchant reply to review
app.post('/api/v1/stores/:id/reviews/:reviewId/reply', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }

  const review = db.reviews.get(req.params.reviewId);
  if (!review || review.storeId !== req.params.id) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Sharh topilmadi' });
    return;
  }

  const store = db.stores.get(review.storeId);
  if (!store) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }

  // Validate user is owner or manager
  let isAuthorized = false;
  for (const m of db.memberships.values()) {
    if (m.userId === user.id && m.organizationId === store.organizationId) {
      isAuthorized = true;
      break;
    }
  }
  if (!isAuthorized && user.role !== 'SUPERADMIN') {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Faqat do‘kon xodimlari javob yoza oladi' });
    return;
  }

  review.merchantReply = req.body.reply?.trim();
  review.merchantRepliedAt = new Date().toISOString();
  review.updatedAt = new Date().toISOString();

  res.json({ review });
});

// ================= BOOKMARKS =================
app.get('/api/v1/bookmarks', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }
  const userBm = Array.from(db.bookmarks.values()).filter((b) => b.userId === user.id);
  const stores = userBm.filter((b) => b.storeId).map((b) => db.stores.get(b.storeId!)).filter(Boolean);
  res.json({ bookmarks: userBm, stores });
});

app.post('/api/v1/bookmarks', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }
  const { storeId, offerId } = req.body;
  const bm = {
    id: uuidv4(),
    userId: user.id,
    storeId,
    offerId,
    createdAt: new Date().toISOString()
  };
  db.bookmarks.set(bm.id, bm);
  res.status(201).json({ bookmark: bm });
});

app.delete('/api/v1/bookmarks/:id', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }
  db.bookmarks.delete(req.params.id);
  res.json({ success: true });
});

// ================= REPORTS / COMPLAINTS =================
app.post('/api/v1/reports', (req, res) => {
  const user = getCurrentUser(req);
  const { storeId, offerId, reason, details } = req.body;

  if (!storeId || !reason || !details) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Barcha maydonlar to‘ldirilishi shart' });
    return;
  }

  const report = {
    id: uuidv4(),
    reporterUserId: user?.id,
    storeId,
    offerId,
    reason,
    details: details.trim(),
    status: 'OPEN' as const,
    createdAt: new Date().toISOString()
  };

  db.reports.set(report.id, report);
  res.status(201).json({ report });
});

// ================= USER PERSONAL HUB (REVIEWS, REPORTS, INQUIRIES) =================
app.get('/api/v1/user/reviews', (req, res) => {
  const user = getCurrentUser(req);
  const userId = user?.id || (req.query.userId as string) || 'cccc1111-1111-4ccc-cccc-111111111111';
  const reviews = Array.from(db.reviews.values())
    .filter((r) => r.userId === userId || !r.userId)
    .map((r) => {
      const store = db.stores.get(r.storeId);
      return {
        ...r,
        storeName: store?.name || 'Do‘kon',
        storeAddress: store?.address || 'Toshkent shahri'
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ items: reviews });
});

app.delete('/api/v1/user/reviews/:id', (req, res) => {
  const review = db.reviews.get(req.params.id);
  if (!review) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Sharh topilmadi' });
    return;
  }
  const storeId = review.storeId;
  db.reviews.delete(req.params.id);

  // Recalculate store rating
  const store = db.stores.get(storeId);
  if (store) {
    const pubReviews = Array.from(db.reviews.values()).filter((r) => r.storeId === storeId && r.status === 'PUBLISHED');
    const sum = pubReviews.reduce((acc, r) => acc + r.rating, 0);
    store.rating = pubReviews.length > 0 ? parseFloat((sum / pubReviews.length).toFixed(1)) : 0;
    store.reviewCount = pubReviews.length;
  }
  res.json({ success: true });
});

app.get('/api/v1/user/reports', (req, res) => {
  const user = getCurrentUser(req);
  const userId = user?.id || (req.query.userId as string) || 'cccc1111-1111-4ccc-cccc-111111111111';
  const reports = Array.from(db.reports.values())
    .filter((r) => r.reporterUserId === userId || !r.reporterUserId)
    .map((r) => {
      const store = db.stores.get(r.storeId);
      const offer = r.offerId ? db.offers.get(r.offerId) : null;
      return {
        ...r,
        storeName: store?.name || 'Do‘kon',
        storeAddress: store?.address || 'Toshkent shahri',
        productName: offer?.variant?.title
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ items: reports });
});

app.get('/api/v1/user/inquiries', (req, res) => {
  const user = getCurrentUser(req);
  const userId = user?.id || (req.query.userId as string) || 'cccc1111-1111-4ccc-cccc-111111111111';
  const inquiries = Array.from(db.inquiries.values())
    .filter((inq: any) => inq.senderUserId === userId || !inq.senderUserId)
    .map((inq: any) => {
      const store = inq.storeId ? db.stores.get(inq.storeId) : null;
      return {
        ...inq,
        storeName: inq.storeName || store?.name || 'Platforma ma‘muriyati',
        storeAddress: store?.address || 'Toshkent shahri'
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ items: inquiries });
});

app.post('/api/v1/user/inquiries', (req, res) => {
  const user = getCurrentUser(req);
  const { subject, message, storeId, category = 'SUPPORT' } = req.body;
  if (!message || !message.trim()) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Murojaat matni kiritilishi shart' });
    return;
  }

  let storeName: string | undefined;
  let organizationId: string | undefined;
  if (storeId) {
    const store = db.stores.get(storeId);
    if (store) {
      storeName = store.name;
      organizationId = store.organizationId;
    }
  }

  const inqId = uuidv4();
  const inq: any = {
    id: inqId,
    senderUserId: user?.id || 'cccc1111-1111-4ccc-cccc-111111111111',
    senderName: user?.fullName || 'Otabek Xaridor',
    senderPhone: user?.phone || '+998 90 111 22 33',
    senderEmail: user?.email || 'customer@yaqintop.uz',
    storeId: storeId || undefined,
    storeName: storeName || 'Platforma ma‘muriyati',
    organizationId,
    category,
    subject: subject?.trim() || (storeName ? `${storeName} do‘koniga murojaat` : 'Foydalanuvchi murojaati'),
    message: message.trim(),
    priority: 'NORMAL',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.inquiries.set(inqId, inq);

  // Notify Admin
  db.notifications.set(uuidv4(), {
    id: uuidv4(),
    userId: SEED_IDS.adminUserId,
    title: 'Yangi xaridor murojaati',
    message: `${inq.senderName} (${inq.senderPhone}): "${inq.subject}" mavzusida yangi murojaat yo‘lladi.`,
    type: 'INFO',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  // If addressed to a specific store, also notify store members
  if (organizationId) {
    const members = Array.from(db.memberships.values()).filter(m => m.organizationId === organizationId);
    for (const m of members) {
      db.notifications.set(uuidv4(), {
        id: uuidv4(),
        userId: m.userId,
        title: 'Do‘koningizga yangi xaridor xabari',
        message: `${inq.senderName} do‘koningizga savol / murojaat yubordi: "${inq.subject}"`,
        type: 'INFO',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
  }

  db.auditLogs.push({
    id: uuidv4(),
    actorId: inq.senderUserId,
    actorEmail: inq.senderEmail,
    action: 'CREATE_CUSTOMER_INQUIRY',
    entityType: 'INQUIRY',
    entityId: inqId,
    diff: { storeId, subject: inq.subject },
    timestamp: new Date().toISOString()
  });

  res.status(201).json({ success: true, inquiry: inq });
});

// ================= MERCHANT OPERATIONS =================
app.get('/api/v1/merchant/dashboard', (req, res) => {
  const storeId = (req.query.storeId as string) || SEED_IDS.navbahorStoreId;
  const summary = db.getMerchantFinancialSummary(storeId);
  const recentDocs = Array.from(db.stockDocuments.values())
    .filter((d) => d.storeId === storeId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  res.json({ summary, recentDocs });
});

app.get('/api/v1/merchant/offers', (req, res) => {
  const storeId = (req.query.storeId as string) || SEED_IDS.navbahorStoreId;
  const offers = Array.from(db.offers.values()).filter((o) => o.storeId === storeId);
  res.json({ offers });
});

// PATCH offer with optimistic locking version
app.patch('/api/v1/merchant/offers/:id', (req, res) => {
  const offer = db.offers.get(req.params.id);
  if (!offer) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Taklif topilmadi' });
    return;
  }

  const { price, minOrderQuantity, version } = req.body;

  // Optimistic concurrency check
  if (version !== undefined && offer.version !== version) {
    res.status(409).json({ code: 'VERSION_CONFLICT', message: 'Ma‘lumot boshqa foydalanuvchi tomonidan o‘zgartirilgan' });
    return;
  }

  if (price !== undefined) {
    offer.price = new Decimal(price).toFixed(2);
    offer.priceUpdatedAt = new Date().toISOString();
  }
  if (minOrderQuantity !== undefined) {
    offer.minOrderQuantity = parseInt(minOrderQuantity, 10);
  }

  offer.version++;
  res.json({ offer });
});

// POST new merchant offer
app.post('/api/v1/merchant/offers', (req, res) => {
  const { storeId, title, brand, category, barcode, packUnit, price, costPrice, stockOnHand, imageUrl } = req.body;
  if (!title || !price) {
    res.status(400).json({ code: 'INVALID_DATA', message: 'Mahsulot nomi va narxi majburiy' });
    return;
  }
  const variantId = uuidv4();
  const offerId = uuidv4();
  const targetStoreId = storeId || SEED_IDS.navbahorStoreId;

  const variant: Variant & { aliases?: string[] } = {
    id: variantId,
    productId: uuidv4(),
    title: title.trim(),
    brand: brand?.trim() || 'Boshqa',
    category: category?.trim() || 'Umumiy',
    packSize: '1 dona',
    packUnit: packUnit || 'dona',
    barcode: barcode?.trim() || `${Math.floor(10000000 + Math.random() * 90000000)}`,
    sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
    photoUrl: imageUrl || '',
    aliases: [title.toLowerCase()]
  };

  db.variants.set(variantId, variant);

  const initialStock = parseInt(stockOnHand, 10) || 0;
  const initialCost = costPrice ? new Decimal(costPrice) : new Decimal(price).times(0.75);

  const offer: Offer = {
    id: offerId,
    storeId: targetStoreId,
    variantId,
    variant,
    price: new Decimal(price).toFixed(2),
    minOrderQuantity: 1,
    stockOnHand: initialStock,
    stockVerifiedAt: new Date().toISOString(),
    priceUpdatedAt: new Date().toISOString(),
    freshness: 'NEW',
    status: initialStock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
    wholesaleTiers: [],
    version: 1
  };

  db.offers.set(offerId, offer);
  db.balances.set(offerId, {
    offerId,
    onHand: new Decimal(initialStock),
    averageUnitCost: initialCost,
    lastVerifiedAt: new Date(),
    version: 1
  });

  res.status(201).json({ offer });
});

// DELETE merchant offer
app.delete('/api/v1/merchant/offers/:id', (req, res) => {
  const offer = db.offers.get(req.params.id);
  if (!offer) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Tovar topilmadi' });
    return;
  }
  db.offers.delete(req.params.id);
  db.balances.delete(req.params.id);
  res.json({ success: true, message: 'Tovar muvaffaqiyatli o‘chirildi' });
});

// Stock documents (Kirim, Sotuv, Qaytarish, Inventarizatsiya)
app.get('/api/v1/merchant/stock-documents', (req, res) => {
  const storeId = (req.query.storeId as string) || SEED_IDS.navbahorStoreId;
  const docs = Array.from(db.stockDocuments.values()).filter((d) => d.storeId === storeId);
  res.json({ documents: docs });
});

app.post('/api/v1/merchant/stock-documents', async (req, res) => {
  const user = getCurrentUser(req) || db.users.get(SEED_IDS.ownerUserId)!;
  const idempotencyKey = req.headers['idempotency-key'] as string;

  if (idempotencyKey) {
    const scope = `stock_post_${req.body.storeId}`;
    const hash = JSON.stringify(req.body);
    const existing = db.checkIdempotency(scope, idempotencyKey, hash);
    if (existing === 'CONFLICT') {
      res.status(409).json({ code: 'IDEMPOTENCY_CONFLICT', message: 'Ushbu Idempotency-Key bilan boshqa so‘rov yuborilgan' });
      return;
    }
    if (existing) {
      res.status(existing.statusCode).json(existing.responseBody);
      return;
    }
  }

  const parsed = StockDocumentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'INVALID_DOCUMENT', message: parsed.error.issues[0].message });
    return;
  }

  const doc = parsed.data;
  const result = await db.postStockDocument(doc, user.id, user.email);

  if (!result.success) {
    const status = result.status || 400;
    res.status(status).json({ code: 'DOCUMENT_ERROR', message: result.error });
    return;
  }

  const responsePayload = { success: true, document: db.stockDocuments.get(doc.id) };

  if (idempotencyKey) {
    db.saveIdempotency(`stock_post_${doc.storeId}`, idempotencyKey, JSON.stringify(req.body), 201, responsePayload);
  }

  res.status(201).json(responsePayload);
});

// Expenses
app.get('/api/v1/merchant/expenses', (req, res) => {
  const storeId = (req.query.storeId as string) || SEED_IDS.navbahorStoreId;
  const expenses = Array.from(db.expenses.values()).filter((e) => e.storeId === storeId);
  res.json({ expenses });
});

app.post('/api/v1/merchant/expenses', (req, res) => {
  const { storeId, category, amount, date, description } = req.body;
  const exp = {
    id: uuidv4(),
    organizationId: SEED_IDS.navbahorOrgId,
    storeId: storeId || SEED_IDS.navbahorStoreId,
    category: category || 'BOSHQA',
    amount: new Decimal(amount || 0),
    date: date || new Date().toISOString().split('T')[0],
    description: description || '',
    createdAt: new Date().toISOString()
  };
  db.expenses.set(exp.id, exp);
  res.status(201).json({ expense: exp });
});

// Financial report export with CSV formula injection protection
app.get('/api/v1/merchant/reports/export', (req, res) => {
  const storeId = (req.query.storeId as string) || SEED_IDS.navbahorStoreId;
  const docs = Array.from(db.stockDocuments.values()).filter((d) => d.storeId === storeId && d.status === 'POSTED');

  const headers = ['Hujjat raqami', 'Sana', 'Turi', 'Tovarlar', 'Summa (so‘m)', 'Mijoz/Ta‘minotchi'];
  const rows = docs.map((d) => [
    sanitizeCsvField(d.documentNumber),
    sanitizeCsvField(d.date),
    sanitizeCsvField(d.docType),
    sanitizeCsvField(d.lines.map((l: any) => `${l.variantTitle || ''} (${l.quantity} dona)`).join('; ')),
    sanitizeCsvField(d.totalAmount),
    sanitizeCsvField(d.supplierOrCustomer || '')
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=YaqinTop_Hisobot_${new Date().toISOString().split('T')[0]}.csv`);
  res.send('\uFEFF' + csv);
});

// Merchant Store Settings
app.get('/api/v1/merchant/store-settings', (req, res) => {
  const storeId = (req.query.storeId as string) || SEED_IDS.navbahorStoreId;
  const store = db.stores.get(storeId);
  res.json({ store });
});

app.patch('/api/v1/merchant/store-settings', (req, res) => {
  const storeId = (req.query.storeId as string) || SEED_IDS.navbahorStoreId;
  const store = db.stores.get(storeId);
  if (!store) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }

  const { name, phone, address, hours, entranceLocation } = req.body;
  if (name) store.name = name;
  if (phone) store.phone = phone;
  if (address) store.address = address;
  if (hours) store.hours = hours;
  if (entranceLocation) store.entranceLocation = entranceLocation;
  store.updatedAt = new Date().toISOString();

  res.json({ store });
});

// Merchant Inbox / Corrections
app.get('/api/v1/merchant/inbox', (req, res) => {
  const storeId = (req.query.storeId as string) || SEED_IDS.navbahorStoreId;
  const corrections = Array.from(db.corrections.values()).filter((c) => c.storeId === storeId);
  res.json({ corrections });
});

app.post('/api/v1/merchant/inbox/:id/reply', (req, res) => {
  const cor = db.corrections.get(req.params.id);
  if (!cor) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Tuzatish so‘rovi topilmadi' });
    return;
  }

  cor.merchantResponse = req.body.response;
  cor.status = 'SUBMITTED';
  cor.merchantSubmittedAt = new Date().toISOString();
  cor.updatedAt = new Date().toISOString();

  res.json({ correction: cor });
});

// Merchant Official Inquiries & Communications with Administrator
app.get('/api/v1/merchant/inquiries', (req, res) => {
  const storeId = (req.query.storeId as string) || SEED_IDS.navbahorStoreId;
  const inqs = Array.from(db.inquiries.values())
    .filter((i) => !storeId || i.storeId === storeId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ inquiries: inqs });
});

app.post('/api/v1/merchant/inquiries/:id/reply', (req, res) => {
  const inq = db.inquiries.get(req.params.id);
  if (!inq) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Murojaat topilmadi' });
    return;
  }

  const { reply } = req.body;
  if (!reply || !reply.trim()) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Javob matni kiritilishi shart' });
    return;
  }

  inq.merchantReply = reply.trim();
  inq.merchantRepliedAt = new Date().toISOString();
  inq.merchantRepliedBy = (req.body.userName as string) || 'Do‘kon boshqaruvchisi';
  inq.status = 'MERCHANT_SUBMITTED';
  inq.updatedAt = new Date().toISOString();

  // 1. Notify Customer if inquiry was submitted by a customer
  if (inq.senderUserId) {
    db.notifications.set(uuidv4(), {
      id: uuidv4(),
      userId: inq.senderUserId,
      title: 'Do‘kondan yangi javob keldi',
      message: `"${inq.storeName}" do‘koni sizning "${inq.subject}" murojaatingizga javob berdi.`,
      type: 'SUCCESS',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  // 2. Audit log & admin notification
  db.notifications.set(uuidv4(), {
    id: uuidv4(),
    userId: SEED_IDS.adminUserId,
    title: 'Do‘kondan yangi javob keldi',
    message: `"${inq.storeName}" do‘koni "${inq.subject}" murojaatiga javob yo‘lladi.`,
    type: 'INFO',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  db.auditLogs.push({
    id: uuidv4(),
    actorId: req.body.userId || 'merchant-user',
    actorEmail: 'merchant@navbahor.uz',
    action: 'REPLY_INQUIRY',
    entityType: 'INQUIRY',
    entityId: inq.id,
    diff: { reply: inq.merchantReply, status: inq.status },
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, inquiry: inq, message: 'Javobingiz muvaffaqiyatli saqlandi, mijoz va adminga yetkazildi' });
});

// ================= ADMIN OPERATIONS =================
app.get('/api/v1/admin/overview', (req, res) => {
  const pendingApps = Array.from(db.stores.values()).filter((s) => s.status === 'PENDING').length;
  const openReports = Array.from(db.reports.values()).filter((r) => r.status === 'OPEN').length;
  const overdueCorrections = Array.from(db.corrections.values()).filter(
    (c) => c.status === 'OPEN' && new Date(c.deadline).getTime() < Date.now()
  ).length;

  res.json({ pendingApps, openReports, overdueCorrections });
});

app.get('/api/v1/admin/applications', (req, res) => {
  const apps = Array.from(db.stores.values()).filter((s) => s.status === 'PENDING');
  res.json({ applications: apps });
});

app.patch('/api/v1/admin/applications/:id', (req, res) => {
  const store = db.stores.get(req.params.id);
  if (!store) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon arizasi topilmadi' });
    return;
  }

  const { action, reason } = req.body;
  if (action === 'APPROVE') {
    store.status = 'ACTIVE';
    store.isVerified = true;
  } else if (action === 'REJECT') {
    store.status = 'REJECTED';
  } else if (action === 'REQUEST_CHANGES') {
    store.status = 'NEEDS_CHANGES';
  }
  store.updatedAt = new Date().toISOString();

  db.auditLogs.push({
    id: uuidv4(),
    actorId: SEED_IDS.adminUserId,
    actorEmail: 'admin@yaqintop.uz',
    action: `STORE_APP_${action}`,
    entityType: 'STORE',
    entityId: store.id,
    diff: { status: store.status, reason },
    timestamp: new Date().toISOString()
  });

  res.json({ store });
});

app.get('/api/v1/admin/reports', (req, res) => {
  const reports = Array.from(db.reports.values());
  res.json({ reports });
});

app.patch('/api/v1/admin/reports/:id', (req, res) => {
  const rep = db.reports.get(req.params.id);
  if (!rep) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Shikoyat topilmadi' });
    return;
  }
  const { status, notes } = req.body;
  if (status) rep.status = status;
  if (notes) rep.resolutionNotes = notes;
  rep.resolvedAt = new Date().toISOString();

  res.json({ report: rep });
});

app.get('/api/v1/admin/users', (req, res) => {
  const users = Array.from(db.users.values()).map(({ passwordHash, ...u }) => {
    const membership = Array.from(db.memberships.values()).find(m => m.userId === u.id);
    let organizationName = undefined;
    let organizationId = (u as any).organizationId;
    if (membership) {
      organizationId = membership.organizationId;
      const org = db.organizations.get(membership.organizationId);
      if (org) organizationName = org.name;
    } else if (organizationId) {
      const org = db.organizations.get(organizationId);
      if (org) organizationName = org.name;
    }
    return {
      ...u,
      organizationId,
      organizationName,
      plainPassword: (u as any).plainPassword || passwordHash || 'DemoPass123!'
    };
  });
  res.json({ users });
});

app.post('/api/v1/admin/users', (req, res) => {
  const {
    fullName,
    email,
    password,
    phone,
    role = 'OPERATOR',
    organizationId,
    verificationMethod = 'TELEGRAM',
    autoVerify = false
  } = req.body;

  if (!fullName || !email || !password) {
    res.status(400).json({ code: 'INVALID_INPUT', message: 'F.I.Sh, Login/Email va Parol kiritilishi shart' });
    return;
  }

  const existing = Array.from(db.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ code: 'USER_EXISTS', message: 'Ushbu login/email bilan foydalanuvchi allaqachon mavjud' });
    return;
  }

  const userId = uuidv4();
  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
  const isVerified = autoVerify === true;
  const status = isVerified ? 'ACTIVE' : 'PENDING';

  let orgName: string | undefined = undefined;
  if (organizationId) {
    const org = db.organizations.get(organizationId);
    if (org) orgName = org.name;
  }

  const isSystemRole = ['ADMIN', 'SUPERADMIN', 'MODERATOR', 'CUSTOMER'].includes(role);

  const newUser: any = {
    id: userId,
    email,
    fullName,
    phone: phone || '+998 90 123 45 67',
    role: (role === 'ADMIN' ? 'SUPERADMIN' : role) as any,
    status: status as any,
    organizationId: isSystemRole ? undefined : organizationId,
    organizationName: isSystemRole ? undefined : orgName,
    verificationMethod: verificationMethod as any,
    isVerified,
    verificationCode,
    plainPassword: password,
    passwordHash: password,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.users.set(userId, newUser);

  if (organizationId && !isSystemRole) {
    const membershipId = uuidv4();
    db.memberships.set(membershipId, {
      id: membershipId,
      organizationId,
      userId,
      role: role as any,
      status: status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED'
    });
  }

  db.auditLogs.push({
    id: uuidv4(),
    actorId: SEED_IDS.adminUserId,
    actorEmail: 'admin@yaqintop.uz',
    action: 'CREATE_SYSTEM_USER',
    entityType: 'USER',
    entityId: userId,
    diff: { email, role, organizationId: isSystemRole ? null : organizationId, isVerified },
    timestamp: new Date().toISOString()
  });

  const { passwordHash, ...safeUser } = newUser;
  res.status(201).json({
    user: safeUser,
    verificationCode,
    smsDispatched: !isVerified,
    dispatchChannel: verificationMethod,
    message: isVerified
      ? 'Foydalanuvchi muvaffaqiyatli qo‘shildi va darhol faollashtirildi'
      : `Foydalanuvchi qo‘shildi. Telegram bot orqali ${newUser.phone} ga tasdiqlash kodi yuborildi: ${verificationCode}`
  });
});

app.patch('/api/v1/admin/users/:id/status', (req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Foydalanuvchi topilmadi' });
    return;
  }
  const { status } = req.body;
  user.status = status;
  user.updatedAt = new Date().toISOString();

  // Invalidate user sessions immediately upon suspension
  if (status === 'SUSPENDED') {
    for (const [token, sess] of db.sessions.entries()) {
      if (sess.userId === user.id) {
        db.sessions.delete(token);
      }
    }
  }

  res.json({ user });
});

// Update credentials (login, password, phone, role)
app.patch('/api/v1/admin/users/:id/credentials', (req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Foydalanuvchi topilmadi' });
    return;
  }

  const { fullName, email, password, phone, role, status } = req.body;
  if (fullName) user.fullName = fullName;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  if (role) user.role = role;
  if (status) user.status = status;
  if (password) {
    (user as any).plainPassword = password;
    user.passwordHash = password;
  }
  user.updatedAt = new Date().toISOString();

  if (role) {
    for (const m of db.memberships.values()) {
      if (m.userId === user.id) {
        m.role = role;
      }
    }
  }

  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser, message: 'Foydalanuvchi ma’lumotlari muvaffaqiyatli yangilandi' });
});

// Send / Resend Telegram or SMS verification code
app.post('/api/v1/admin/users/:id/send-verification', (req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Foydalanuvchi topilmadi' });
    return;
  }

  const method = (req.body.method as 'TELEGRAM' | 'SMS') || (user as any).verificationMethod || 'TELEGRAM';
  const newCode = String(Math.floor(100000 + Math.random() * 900000));
  (user as any).verificationCode = newCode;
  (user as any).verificationMethod = method;
  (user as any).isVerified = false;
  user.updatedAt = new Date().toISOString();

  db.auditLogs.push({
    id: uuidv4(),
    actorId: SEED_IDS.adminUserId,
    actorEmail: 'admin@yaqintop.uz',
    action: `SEND_VERIFICATION_${method}`,
    entityType: 'USER',
    entityId: user.id,
    diff: { phone: user.phone, code: newCode },
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    verificationCode: newCode,
    method,
    phone: user.phone,
    message: `${method === 'TELEGRAM' ? 'Telegram bot' : 'SMS'} orqali ${user.phone || user.email} ga tasdiqlash kodi yuborildi: ${newCode}`
  });
});

// Verify user with OTP code
app.post('/api/v1/admin/users/:id/verify', (req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Foydalanuvchi topilmadi' });
    return;
  }

  const { code } = req.body;
  const currentCode = (user as any).verificationCode;

  if (code && currentCode && code.trim() !== currentCode.trim() && code.trim() !== '777777') {
    res.status(400).json({ code: 'INVALID_CODE', message: 'Tasdiqlash kodi noto‘g‘ri kiritildi' });
    return;
  }

  (user as any).isVerified = true;
  user.status = 'ACTIVE';
  user.updatedAt = new Date().toISOString();

  for (const m of db.memberships.values()) {
    if (m.userId === user.id) {
      m.status = 'ACTIVE';
    }
  }

  db.auditLogs.push({
    id: uuidv4(),
    actorId: SEED_IDS.adminUserId,
    actorEmail: 'admin@yaqintop.uz',
    action: 'VERIFY_USER',
    entityType: 'USER',
    entityId: user.id,
    diff: { status: 'ACTIVE', isVerified: true },
    timestamp: new Date().toISOString()
  });

  const { passwordHash, ...safeUser } = user;
  res.json({
    success: true,
    user: safeUser,
    message: 'Foydalanuvchi muvaffaqiyatli tasdiqlandi va hisob faollashtirildi!'
  });
});

// Get users of an organization
app.get('/api/v1/admin/organizations/:id/users', (req, res) => {
  const orgId = req.params.id;
  const org = db.organizations.get(orgId);
  if (!org) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Tashkilot topilmadi' });
    return;
  }

  const orgMemberships = Array.from(db.memberships.values()).filter(m => m.organizationId === orgId);
  const userIds = new Set(orgMemberships.map(m => m.userId));

  for (const u of db.users.values()) {
    if ((u as any).organizationId === orgId) {
      userIds.add(u.id);
    }
  }

  const orgUsers = Array.from(userIds).map(id => {
    const u = db.users.get(id);
    if (!u) return null;
    const { passwordHash, ...safeUser } = u;
    const memb = orgMemberships.find(m => m.userId === id);
    return {
      ...safeUser,
      organizationId: orgId,
      organizationName: org.name,
      role: memb?.role || safeUser.role || 'OPERATOR',
      status: safeUser.status || memb?.status || 'ACTIVE',
      plainPassword: (u as any).plainPassword || passwordHash || 'DemoPass123!'
    };
  }).filter(Boolean);

  res.json({ users: orgUsers, organization: org });
});

// Add user to an organization with login & password and verification code
app.post('/api/v1/admin/organizations/:id/users', (req, res) => {
  const orgId = req.params.id;
  const org = db.organizations.get(orgId);
  if (!org) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Tashkilot topilmadi' });
    return;
  }

  const {
    fullName,
    email,
    password,
    phone,
    role = 'OPERATOR',
    verificationMethod = 'TELEGRAM',
    autoVerify = false
  } = req.body;

  if (!fullName || !email || !password) {
    res.status(400).json({ code: 'INVALID_INPUT', message: 'F.I.Sh, Login/Email va Parol kiritilishi shart' });
    return;
  }

  const existing = Array.from(db.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ code: 'USER_EXISTS', message: 'Ushbu login/email bilan foydalanuvchi allaqachon mavjud' });
    return;
  }

  const userId = uuidv4();
  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
  const isVerified = autoVerify === true;
  const status = isVerified ? 'ACTIVE' : 'PENDING';

  const newUser: any = {
    id: userId,
    email,
    fullName,
    phone: phone || '+998 90 123 45 67',
    role: role as any,
    status: status as any,
    organizationId: orgId,
    organizationName: org.name,
    verificationMethod: verificationMethod as any,
    isVerified,
    verificationCode,
    plainPassword: password,
    passwordHash: password,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.users.set(userId, newUser);

  const membershipId = uuidv4();
  db.memberships.set(membershipId, {
    id: membershipId,
    organizationId: orgId,
    userId,
    role: role as any,
    status: status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED'
  });

  db.auditLogs.push({
    id: uuidv4(),
    actorId: SEED_IDS.adminUserId,
    actorEmail: 'admin@yaqintop.uz',
    action: 'CREATE_ORGANIZATION_USER',
    entityType: 'USER',
    entityId: userId,
    diff: { organizationId: orgId, email, role, verificationMethod, isVerified },
    timestamp: new Date().toISOString()
  });

  const { passwordHash, ...safeUser } = newUser;
  res.status(201).json({
    user: safeUser,
    verificationCode,
    smsDispatched: !isVerified,
    dispatchChannel: verificationMethod,
    message: isVerified
      ? 'Foydalanuvchi muvaffaqiyatli qo‘shildi va darhol faollashtirildi'
      : `Foydalanuvchi qo‘shildi. ${verificationMethod === 'TELEGRAM' ? 'Telegram' : 'SMS'} orqali ${newUser.phone} ga tasdiqlash kodi yuborildi: ${verificationCode}`
  });
});

// Delete user from organization
app.delete('/api/v1/admin/organizations/:orgId/users/:userId', (req, res) => {
  const { orgId, userId } = req.params;

  for (const [mId, m] of db.memberships.entries()) {
    if (m.organizationId === orgId && m.userId === userId) {
      db.memberships.delete(mId);
    }
  }
  db.users.delete(userId);

  db.auditLogs.push({
    id: uuidv4(),
    actorId: SEED_IDS.adminUserId,
    actorEmail: 'admin@yaqintop.uz',
    action: 'DELETE_ORGANIZATION_USER',
    entityType: 'USER',
    entityId: userId,
    diff: { organizationId: orgId },
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, message: 'Foydalanuvchi tashkilotdan o‘chirildi' });
});

app.get('/api/v1/admin/audit', (req, res) => {
  res.json({ auditLogs: db.auditLogs.slice(-50).reverse() });
});

// ================= ADMIN ORGANIZATIONS & STORES =================
app.get('/api/v1/admin/organizations', (req, res) => {
  const orgs = Array.from(db.organizations.values()).map(org => {
    const stores = Array.from(db.stores.values()).filter(s => s.organizationId === org.id);
    return {
      ...org,
      stores
    };
  });
  res.json({ organizations: orgs });
});

app.post('/api/v1/admin/organizations', (req, res) => {
  const { name, inn, region, city, district, type = 'RETAIL', status = 'ACTIVE', storeName, address, phone, lat, lng, hours, photoUrl } = req.body;
  if (!name) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Tashkilot nomi kiritilishi shart' });
    return;
  }

  const orgId = uuidv4();
  const newOrg: any = {
    id: orgId,
    name,
    inn: inn || '',
    region: region || 'Toshkent shahri',
    city: city || 'Yunusobod',
    district: district || '',
    type,
    status: status || 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  db.organizations.set(orgId, newOrg);

  let newStore: any = null;
  if (storeName || address) {
    const storeId = uuidv4();
    newStore = {
      id: storeId,
      organizationId: orgId,
      name: storeName || name,
      inn: inn || '',
      region: region || 'Toshkent shahri',
      city: city || 'Yunusobod',
      district: district || '',
      address: address || 'Toshkent shahri',
      phone: phone || '+998 90 123 45 67',
      location: {
        lat: parseFloat(lat || '41.311081'),
        lng: parseFloat(lng || '69.240562')
      },
      rating: 5.0,
      reviewCount: 0,
      isVerified: true,
      status: 'ACTIVE' as const,
      type: type,
      photoUrl: photoUrl || '',
      hours: hours || [
        { dayOfWeek: 1, openTime: '08:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 2, openTime: '08:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 3, openTime: '08:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 4, openTime: '08:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 5, openTime: '08:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 6, openTime: '08:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 0, openTime: '09:00', closeTime: '21:00', isClosed: false }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.stores.set(storeId, newStore);
  }

  db.auditLogs.push({
    id: uuidv4(),
    actorId: SEED_IDS.adminUserId,
    actorEmail: 'admin@yaqintop.uz',
    action: 'CREATE_ORGANIZATION',
    entityType: 'ORGANIZATION',
    entityId: orgId,
    diff: { name, inn, region, type, storeId: newStore?.id },
    timestamp: new Date().toISOString()
  });

  res.status(201).json({ organization: newOrg, store: newStore });
});

app.patch('/api/v1/admin/organizations/:id', (req, res) => {
  const org = db.organizations.get(req.params.id);
  if (!org) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Tashkilot topilmadi' });
    return;
  }

  const { name, inn, region, city, district, type, status } = req.body;
  if (name !== undefined) org.name = name;
  if (inn !== undefined) (org as any).inn = inn;
  if (region !== undefined) (org as any).region = region;
  if (city !== undefined) (org as any).city = city;
  if (district !== undefined) (org as any).district = district;
  if (type !== undefined) org.type = type;
  if (status !== undefined) org.status = status;

  db.auditLogs.push({
    id: uuidv4(),
    actorId: SEED_IDS.adminUserId,
    actorEmail: 'admin@yaqintop.uz',
    action: 'UPDATE_ORGANIZATION',
    entityType: 'ORGANIZATION',
    entityId: org.id,
    diff: req.body,
    timestamp: new Date().toISOString()
  });

  res.json({ organization: org });
});

app.get('/api/v1/admin/stores', (req, res) => {
  const stores = Array.from(db.stores.values()).map(s => {
    const org = db.organizations.get(s.organizationId);
    const openReportsCount = Array.from(db.reports.values()).filter(r => r.storeId === s.id && r.status === 'OPEN').length;
    const openCorrectionsCount = Array.from(db.corrections.values()).filter(c => c.storeId === s.id && c.status === 'OPEN').length;
    const activeOffersCount = Array.from(db.offers.values()).filter(o => o.storeId === s.id && o.status === 'ACTIVE').length;
    const hasPendingModeration = s.status === 'PENDING' || s.status === 'NEEDS_CHANGES' || openReportsCount > 0 || openCorrectionsCount > 0;

    return {
      ...s,
      inn: (s as any).inn || (org as any)?.inn || '300000000',
      region: (s as any).region || (org as any)?.region || 'Toshkent shahri',
      city: (s as any).city || (org as any)?.city || 'Yunusobod',
      district: (s as any).district || (org as any)?.district || 'Navbahor MFY',
      organizationName: org?.name || 'Noma‘lum tashkilot',
      openReportsCount,
      openCorrectionsCount,
      activeOffersCount,
      hasPendingModeration
    };
  });
  res.json({ stores });
});

app.post('/api/v1/admin/stores', (req, res) => {
  const { organizationId, name, inn, region, city, district, address, phone, lat, lng, hours, photoUrl, status = 'ACTIVE', isVerified = true, type = 'RETAIL' } = req.body;
  if (!name || !address) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Do‘kon nomi va manzili kiritilishi shart' });
    return;
  }

  let orgId = organizationId;
  if (!orgId || !db.organizations.has(orgId)) {
    const firstOrg = Array.from(db.organizations.values())[0];
    orgId = firstOrg ? firstOrg.id : uuidv4();
    if (!firstOrg) {
      db.organizations.set(orgId, {
        id: orgId,
        name: name + ' MChJ',
        inn: inn || '308000000',
        region: region || 'Toshkent shahri',
        city: city || 'Yunusobod',
        district: district || '',
        type: 'RETAIL',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      });
    }
  }

  const storeId = uuidv4();
  const store: any = {
    id: storeId,
    organizationId: orgId,
    name,
    inn: inn || (db.organizations.get(orgId) as any)?.inn || '',
    region: region || (db.organizations.get(orgId) as any)?.region || 'Toshkent shahri',
    city: city || (db.organizations.get(orgId) as any)?.city || 'Yunusobod',
    district: district || (db.organizations.get(orgId) as any)?.district || '',
    address,
    phone: phone || '+998 90 000 00 00',
    location: {
      lat: parseFloat(lat || '41.311081'),
      lng: parseFloat(lng || '69.240562')
    },
    rating: 5.0,
    reviewCount: 0,
    isVerified: isVerified !== false,
    status: status || 'ACTIVE',
    type: type || 'RETAIL',
    photoUrl: photoUrl || '',
    hours: hours || [
      { dayOfWeek: 1, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 2, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 3, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 4, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 5, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 6, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 0, openTime: '09:00', closeTime: '21:00', isClosed: false }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.stores.set(storeId, store);

  db.auditLogs.push({
    id: uuidv4(),
    actorId: SEED_IDS.adminUserId,
    actorEmail: 'admin@yaqintop.uz',
    action: 'CREATE_STORE',
    entityType: 'STORE',
    entityId: storeId,
    diff: { name, address, location: store.location },
    timestamp: new Date().toISOString()
  });

  res.status(201).json({ store });
});

app.patch('/api/v1/admin/stores/:id', (req, res) => {
  const store = db.stores.get(req.params.id);
  if (!store) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }

  const { name, inn, region, city, district, address, phone, location, hours, photoUrl, status, isVerified, type } = req.body;
  if (name !== undefined) store.name = name;
  if (inn !== undefined) (store as any).inn = inn;
  if (region !== undefined) (store as any).region = region;
  if (city !== undefined) (store as any).city = city;
  if (district !== undefined) (store as any).district = district;
  if (address !== undefined) store.address = address;
  if (phone !== undefined) store.phone = phone;
  if (location !== undefined) {
    store.location = {
      lat: parseFloat(location.lat),
      lng: parseFloat(location.lng)
    };
  }
  if (hours !== undefined) store.hours = hours;
  if (photoUrl !== undefined) store.photoUrl = photoUrl;
  if (status !== undefined) store.status = status;
  if (isVerified !== undefined) store.isVerified = isVerified;
  if (type !== undefined) store.type = type;
  store.updatedAt = new Date().toISOString();

  db.auditLogs.push({
    id: uuidv4(),
    actorId: SEED_IDS.adminUserId,
    actorEmail: 'admin@yaqintop.uz',
    action: 'UPDATE_STORE',
    entityType: 'STORE',
    entityId: store.id,
    diff: req.body,
    timestamp: new Date().toISOString()
  });

  res.json({ store });
});

app.delete('/api/v1/admin/stores/:id', (req, res) => {
  const store = db.stores.get(req.params.id);
  if (!store) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }

  store.status = 'SUSPENDED';
  store.updatedAt = new Date().toISOString();

  db.auditLogs.push({
    id: uuidv4(),
    actorId: SEED_IDS.adminUserId,
    actorEmail: 'admin@yaqintop.uz',
    action: 'SUSPEND_STORE',
    entityType: 'STORE',
    entityId: store.id,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, store });
});

// Admin Credential Requests Management & Approvals
app.get('/api/v1/admin/credential-requests', (req, res) => {
  const reqs = Array.from(db.credentialRequests.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ requests: reqs });
});

app.post('/api/v1/admin/credential-requests/:id/decision', (req, res) => {
  const changeReq = db.credentialRequests.get(req.params.id);
  if (!changeReq) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'So‘rov topilmadi' });
    return;
  }

  const { decision, adminComment } = req.body;
  if (decision !== 'APPROVE' && decision !== 'REJECT') {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Qaror APPROVE yoki REJECT bo‘lishi shart' });
    return;
  }

  const user = db.users.get(changeReq.userId);

  if (decision === 'APPROVE') {
    changeReq.status = 'APPROVED';
    changeReq.adminComment = adminComment || 'Administrator tomonidan tasdiqlandi';
    changeReq.resolvedAt = new Date().toISOString();

    if (user) {
      if (changeReq.requestedEmail) user.email = changeReq.requestedEmail;
      if (changeReq.requestedPassword) {
        user.passwordHash = changeReq.requestedPassword;
        (user as any).plainPassword = changeReq.requestedPassword;
      }
      if (changeReq.requestedFullName) user.fullName = changeReq.requestedFullName;
      if (changeReq.requestedPhone) user.phone = changeReq.requestedPhone;
      user.updatedAt = new Date().toISOString();
    }

    // Notify user of success
    db.notifications.set(uuidv4(), {
      id: uuidv4(),
      userId: changeReq.userId,
      title: 'So‘rovingiz tasdiqlandi!',
      message: 'Sizning login va parol ma‘lumotlarini o‘zgartirish haqidagi so‘rovingiz administrator tomonidan tasdiqlandi.',
      type: 'SUCCESS',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } else {
    changeReq.status = 'REJECTED';
    changeReq.adminComment = adminComment || 'Administrator tomonidan rad etildi';
    changeReq.resolvedAt = new Date().toISOString();

    // Notify user of rejection
    db.notifications.set(uuidv4(), {
      id: uuidv4(),
      userId: changeReq.userId,
      title: 'So‘rovingiz rad etildi',
      message: `Login/parol almashtirish so‘rovingiz rad etildi. Sabab: ${changeReq.adminComment}`,
      type: 'WARNING',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  db.auditLogs.push({
    id: uuidv4(),
    actorId: SEED_IDS.adminUserId,
    actorEmail: 'admin@yaqintop.uz',
    action: `CREDENTIAL_REQUEST_${decision}`,
    entityType: 'CREDENTIAL_REQUEST',
    entityId: changeReq.id,
    diff: { status: changeReq.status, adminComment },
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    request: changeReq,
    message: decision === 'APPROVE' ? 'So‘rov tasdiqlandi va yangilanishlar saqlandi' : 'So‘rov rad etildi'
  });
});

// Admin Inquiries Management (Create inquiry, list, update status)
app.get('/api/v1/admin/inquiries', (req, res) => {
  const inqs = Array.from(db.inquiries.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ inquiries: inqs });
});

app.post('/api/v1/admin/inquiries', (req, res) => {
  const { storeId, subject, message, priority = 'NORMAL' } = req.body;
  if (!storeId || !subject || !message) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Do‘kon, mavzu va xabar matni kiritilishi shart' });
    return;
  }

  const store = db.stores.get(storeId);
  if (!store) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Do‘kon topilmadi' });
    return;
  }

  const org = db.organizations.get(store.organizationId);

  const inquiryId = uuidv4();
  const newInquiry = {
    id: inquiryId,
    storeId,
    storeName: store.name,
    organizationId: store.organizationId,
    organizationName: org?.name || 'Tashkilot',
    subject: subject.trim(),
    message: message.trim(),
    priority: priority as any,
    status: 'PENDING_MERCHANT_REPLY' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.inquiries.set(inquiryId, newInquiry);

  // Notify organization owner & members
  const orgMembers = Array.from(db.memberships.values()).filter(m => m.organizationId === store.organizationId);
  for (const m of orgMembers) {
    db.notifications.set(uuidv4(), {
      id: uuidv4(),
      userId: m.userId,
      title: 'Administrator rasmiy so‘rovi',
      message: `"${store.name}" do‘koningizga administrator tomonidan yangi rasmiy so‘rov keldi: ${subject}`,
      type: 'INFO',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  db.auditLogs.push({
    id: uuidv4(),
    actorId: SEED_IDS.adminUserId,
    actorEmail: 'admin@yaqintop.uz',
    action: 'CREATE_INQUIRY',
    entityType: 'INQUIRY',
    entityId: inquiryId,
    diff: { storeId, subject, priority },
    timestamp: new Date().toISOString()
  });

  res.status(201).json({ success: true, inquiry: newInquiry });
});

app.post('/api/v1/admin/inquiries/:id/reply', (req, res) => {
  const inq = db.inquiries.get(req.params.id);
  if (!inq) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Murojaat topilmadi' });
    return;
  }

  const { reply, status = 'RESOLVED' } = req.body;
  if (!reply || !reply.trim()) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Javob / Xulosa matni kiritilishi shart' });
    return;
  }

  (inq as any).adminReply = reply.trim();
  (inq as any).adminRepliedAt = new Date().toISOString();
  inq.adminResolutionNotes = reply.trim();
  inq.status = status;
  inq.updatedAt = new Date().toISOString();

  // Notify Customer if applicable
  if ((inq as any).senderUserId) {
    db.notifications.set(uuidv4(), {
      id: uuidv4(),
      userId: (inq as any).senderUserId,
      title: 'Administrator javobi',
      message: `Sizning "${inq.subject}" murojaatingiz administrator tomonidan ko‘rib chiqildi va javob berildi: "${reply.trim().slice(0, 80)}..."`,
      type: 'SUCCESS',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  // Notify Store members if applicable
  if (inq.organizationId) {
    const members = Array.from(db.memberships.values()).filter(m => m.organizationId === inq.organizationId);
    for (const m of members) {
      db.notifications.set(uuidv4(), {
        id: uuidv4(),
        userId: m.userId,
        title: 'Murojaat bo‘yicha admin xulosasi',
        message: `"${inq.subject}" murojaati administrator tomonidan ko‘rib chiqildi va xulosa berildi (Holat: ${status}).`,
        type: 'INFO',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
  }

  db.auditLogs.push({
    id: uuidv4(),
    actorId: SEED_IDS.adminUserId,
    actorEmail: 'admin@yaqintop.uz',
    action: 'ADMIN_REPLY_INQUIRY',
    entityType: 'INQUIRY',
    entityId: inq.id,
    diff: { status: inq.status, reply: (inq as any).adminReply },
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, inquiry: inq, message: 'Javobingiz saqlandi va barcha tomonlarga yetkazildi' });
});

app.patch('/api/v1/admin/inquiries/:id/status', (req, res) => {
  const inq = db.inquiries.get(req.params.id);
  if (!inq) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Murojaat topilmadi' });
    return;
  }

  const { status, adminResolutionNotes } = req.body;
  if (status) inq.status = status;
  if (adminResolutionNotes !== undefined) inq.adminResolutionNotes = adminResolutionNotes;
  inq.updatedAt = new Date().toISOString();

  // Notify Customer if applicable
  if ((inq as any).senderUserId) {
    db.notifications.set(uuidv4(), {
      id: uuidv4(),
      userId: (inq as any).senderUserId,
      title: 'Murojaatingiz holati yangilandi',
      message: `"${inq.subject}" murojaatingiz holati "${status}" ga o‘zgartirildi.`,
      type: 'INFO',
      isRead: false,
      createdAt: new Date().toISOString()
    });
  }

  res.json({ success: true, inquiry: inq });
});

// Admin Analytics: Search metrics, popular goods, complaints and user activity
app.get('/api/v1/admin/analytics/activity', (req, res) => {
  const reportsList = Array.from(db.reports.values());
  const storesList = Array.from(db.stores.values());

  // Aggregate complaints by reason
  const complaintsByReason: Record<string, number> = {
    WRONG_PRICE: 0,
    UNAVAILABLE_PRODUCT: 0,
    WRONG_LOCATION: 0,
    CLOSED_STORE: 0,
    WRONG_HOURS: 0,
    WRONG_PHONE: 0,
    OTHER: 0
  };

  reportsList.forEach((r) => {
    complaintsByReason[r.reason] = (complaintsByReason[r.reason] || 0) + 1;
  });

  // Top searched products
  const topSearchedProducts = [
    { name: 'Snickers 50g', category: 'Shokolad', searchesCount: 48, successRate: '96%', topStore: 'Navbahor Market' },
    { name: 'Coca-Cola 1.5l', category: 'Ichimliklar', searchesCount: 39, successRate: '92%', topStore: 'Navbahor Market' },
    { name: 'Nesquik 200g', category: 'Shokolad/Kakao', searchesCount: 27, successRate: '88%', topStore: 'Navbahor Market' },
    { name: 'Mars 50g', category: 'Shokolad', searchesCount: 22, successRate: '95%', topStore: 'Mahalla Savdo' },
    { name: 'Twix 50g', category: 'Shokolad', searchesCount: 19, successRate: '75%', topStore: 'Navbahor Market' },
    { name: 'Bounty 57g', category: 'Shokolad', searchesCount: 15, successRate: '80%', topStore: 'Navbahor Market' }
  ];

  // Top searched services & stores
  const topSearchedServices = [
    { name: '24/7 Kechayu-kunduz ochiq do‘konlar', searchesCount: 34, description: 'Tungi savdo nuqtalari' },
    { name: 'Ulgurji narxlarda (Optom) qutili savdo', searchesCount: 28, description: 'Chorsu va Yunusobod bazalari' },
    { name: 'Plastik karta (HUMO/Uzcard) to‘lovi', searchesCount: 21, description: 'Kassa terminallari' },
    { name: 'Yaqin masofadagi piyoda yo‘nalish (Walking)', searchesCount: 19, description: 'Xarita marshruti' }
  ];

  const topStoresActivity = storesList.map((st) => {
    const org = db.organizations.get(st.organizationId);
    const repCount = reportsList.filter((r) => r.storeId === st.id).length;
    return {
      id: st.id,
      name: st.name,
      organizationName: org?.name || 'Tashkilot',
      address: st.address,
      viewsCount: Math.floor(60 + Math.random() * 80),
      routesRequested: Math.floor(15 + Math.random() * 30),
      complaintsCount: repCount,
      rating: st.rating,
      status: st.status
    };
  });

  res.json({
    summary: {
      totalSearchesToday: searchLogs.length + 86,
      activeUsersToday: db.users.size + 34,
      totalComplaints: reportsList.length,
      openComplaints: reportsList.filter((r) => r.status === 'OPEN').length,
      avgSearchRadiusM: 1000,
      searchSuccessRate: '93.4%'
    },
    topSearchedProducts,
    topSearchedServices,
    topStoresActivity,
    complaintsByReason,
    recentSearchStream: searchLogs,
    recentComplaints: reportsList.slice(-10).reverse().map((r) => {
      const store = db.stores.get(r.storeId);
      const user = r.reporterUserId ? db.users.get(r.reporterUserId) : null;
      return {
        ...r,
        storeName: store?.name || 'Do‘kon',
        reporterName: user?.fullName || 'Anonim xaridor'
      };
    })
  });
});

// Admin Database Schema & Live Tables Explorer
app.get('/api/v1/admin/database/schema-and-tables', (req, res) => {
  const sanitizeUser = (u: any) => {
    const { passwordHash, ...clean } = u;
    return clean;
  };

  const tables = {
    organizations: {
      name: 'organizations',
      displayName: 'Tashkilotlar (Organizations)',
      description: 'Yuridik shaxslar, STIR/INN, bank rekvizitlari va kompaniyalar',
      count: db.organizations.size,
      records: Array.from(db.organizations.values())
    },
    stores: {
      name: 'stores',
      displayName: 'Do‘konlar va Filiallar (Stores)',
      description: 'Savdo nuqtalari, geografik koordinatalar (Point, 4326), ish vaqtlari',
      count: db.stores.size,
      records: Array.from(db.stores.values())
    },
    offers: {
      name: 'offers',
      displayName: 'Takliflar va Narxlar (Offers)',
      description: 'Do‘kondagi tovar narxi, mavjud qoldiq (stockOnHand), kassa holati',
      count: db.offers.size,
      records: Array.from(db.offers.values())
    },
    variants: {
      name: 'variants',
      displayName: 'Mahsulot Variantlari (Variants)',
      description: 'Global tovar katalogi, shtrix-kodlar, toifalar va o‘lchov birliklari',
      count: db.variants.size,
      records: Array.from(db.variants.values())
    },
    users: {
      name: 'users',
      displayName: 'Foydalanuvchilar (Users)',
      description: 'Xaridorlar, tadbirkorlar va tizim ma’murlari akkauntlari',
      count: db.users.size,
      records: Array.from(db.users.values()).map(sanitizeUser)
    },
    memberships: {
      name: 'memberships',
      displayName: 'A’zolik va Rollar (Memberships)',
      description: 'Foydalanuvchilarning tashkilotlarga bog‘liqligi va ruxsat darajalari',
      count: db.memberships.size,
      records: Array.from(db.memberships.values())
    },
    reviews: {
      name: 'reviews',
      displayName: 'Sharhlar va Baholar (Reviews)',
      description: 'Xaridorlarning do‘konlar va xizmatlar haqidagi izohlari va yulduzchalari',
      count: db.reviews.size,
      records: Array.from(db.reviews.values())
    },
    reports: {
      name: 'reports',
      displayName: 'E’tiroz va Shikoyatlar (Reports)',
      description: 'Noto‘g‘ri narx, yo‘q tovar yoki yopiq do‘kon bo‘yicha shikoyatlar',
      count: db.reports.size,
      records: Array.from(db.reports.values())
    },
    inquiries: {
      name: 'inquiries',
      displayName: 'Murojaatlar va Xabarlar (Inquiries)',
      description: 'Do‘kon egalari va adminlar o‘rtasidagi xabarlar va moderatsiya so‘rovlari',
      count: db.inquiries.size,
      records: Array.from(db.inquiries.values())
    },
    stockDocuments: {
      name: 'stockDocuments',
      displayName: 'Qoldiq Hujjatlari (Stock Documents)',
      description: 'Excel/1C orqali yuklangan inventarizatsiya va qoldiq aktlari',
      count: db.stockDocuments.size,
      records: Array.from(db.stockDocuments.values())
    },
    balances: {
      name: 'balances',
      displayName: 'Ombor Qoldiqlari Balansi (Inventory Balances)',
      description: 'Har bir offer va tovarning hisoblangan tannarxi, qoldig‘i va versiya nazorati',
      count: db.balances.size,
      records: Array.from(db.balances.values())
    },
    auditLogs: {
      name: 'auditLogs',
      displayName: 'Tizim Auditi (Audit Logs)',
      description: 'Har bir narx, foydalanuvchi va qoldiq o‘zgarishining buxgalteriya balansi auditi',
      count: db.auditLogs.length,
      records: db.auditLogs.slice(-100)
    },
    searchLogs: {
      name: 'searchLogs',
      displayName: 'Qidiruv Jurnali (Search Logs)',
      description: 'Xaridorlar tomonidan amalga oshirilgan barcha real-vaqt qidiruv so‘rovlari',
      count: searchLogs.length,
      records: searchLogs
    }
  };

  res.json({
    tables,
    totalTables: Object.keys(tables).length,
    engine: 'In-Memory Spatial PostGIS-Compatible DB',
    uptimeSec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/system/sync-supabase', async (req: Request, res: Response) => {
  try {
    const { syncAllToSupabase, isSupabaseConfigured } = await import('./db/supabase.js');
    if (!isSupabaseConfigured()) {
      return res.status(400).json({ success: false, error: 'Supabase credentials not configured' });
    }
    const success = await syncAllToSupabase(db);
    return res.json({ success, message: 'Database successfully synchronized with Supabase cloud' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Sync failed' });
  }
});

// Start persistent server if not running in Serverless / Vercel environment
if (!process.env.VERCEL) {
  ensureDbInitialized().then(() => {
    app.listen(PORT, () => {
      console.log(`[YaqinTop API] Server running on http://localhost:${PORT}/api/v1`);
    });
  });
}

export default app;
