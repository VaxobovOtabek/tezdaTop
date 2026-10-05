import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { db } from './db/in-memory-db.js';
import { seedDatabase, SEED_IDS } from './db/seed.js';
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
  Offer
} from '@yaqintop/contracts';

const app: express.Express = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      process.env.CUSTOMER_APP_URL || '',
      process.env.MERCHANT_APP_URL || '',
      process.env.ADMIN_APP_URL || ''
    ].filter(Boolean),
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request tracking & audit middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', String(reqId));
  next();
});

// Helper for session resolution
function getCurrentUser(req: Request) {
  const token = req.cookies?.session_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const session = db.sessions.get(token);
  if (!session) return null;
  const user = db.users.get(session.userId);
  if (!user || user.status === 'SUSPENDED') return null;
  return user;
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
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Email va parol kiritilishi shart' });
    return;
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  let matchedUser = null;
  for (const u of db.users.values()) {
    if (u.email.toLowerCase() === normalizedEmail) {
      matchedUser = u;
      break;
    }
  }

  if (!matchedUser || matchedUser.passwordHash !== password) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Email yoki parol noto‘g‘ri' });
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
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
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
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
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

// ================= SEARCH & MAP ROUTES =================
app.post('/api/v1/search/products', (req, res) => {
  try {
    const parsed = SearchQuerySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'INVALID_QUERY', message: parsed.error.issues[0].message });
      return;
    }
    const result = searchProducts(parsed.data);
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

  res.json({ store, isOpenNow: checkStoreIsOpenNow(store) });
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
    sanitizeCsvField(d.lines.map((l) => `${l.variantTitle || ''} (${l.quantity} dona)`).join('; ')),
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
  const users = Array.from(db.users.values()).map(({ passwordHash, ...u }) => u);
  res.json({ users });
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

app.get('/api/v1/admin/audit', (req, res) => {
  res.json({ auditLogs: db.auditLogs.slice(-50).reverse() });
});

// Seed database on startup
seedDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`[YaqinTop API] Server running on http://localhost:${PORT}/api/v1`);
  });
});

export default app;
