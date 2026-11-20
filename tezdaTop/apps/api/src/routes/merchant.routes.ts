import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { db } from '../db/in-memory-db.js';
import { SEED_IDS } from '../db/seed-ids.js';
import {
  OwnerOnboardingSchema,
  createOwnerOrganization
} from '../services/owner-onboarding.service.js';
import {
  createSignedSessionToken,
  sessionExpiresAt,
  SESSION_TTL_MS
} from '../services/session.service.js';
import { isProduction } from '../middleware/security.middleware.js';
import { authRegisterLimiter } from '../middleware/rate-limiter.js';
import { getCurrentUser } from '../middleware/auth.middleware.js';
import {
  createService,
  completeService,
  serviceCompletionFromDocument
} from '../services/service-business.service.js';
import { sanitizeCsvField } from '../services/ledger.service.js';
import {
  StockDocumentSchema,
  Variant,
  Offer,
  isTradeOrganization
} from '@yaqintop/contracts';

export const merchantRouter = Router();

// ================= OWNER ONBOARDING & ORG TYPES =================
merchantRouter.get('/owner/organization-types', (_req, res) => {
  const defaultTypes = [
    'RETAIL',
    'PHARMACY',
    'GAME_CLUB',
    'GAS_STATION',
    'BEAUTY_SALON',
    'EDUCATION',
    'RESTAURANT',
    'AUTO_SERVICE',
    'WHOLESALE',
    'SERVICES',
    'MIXED'
  ];
  res.json({
    types: Array.from(new Set([...defaultTypes, ...Array.from(db.organizations.values()).map((org) => org.type)]))
  });
});

merchantRouter.post('/owner/onboarding', authRegisterLimiter, (req, res) => {
  const parsed = OwnerOnboardingSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({
      message: 'Tashkilot va owner ma’lumotlarini to‘liq, to‘g‘ri kiriting. Parol kamida 8 belgi bo‘lsin.'
    });
  try {
    const result = createOwnerOrganization(db, parsed.data);
    const token = createSignedSessionToken(result.user.id);
    db.sessions.set(token, { userId: result.user.id, createdAt: new Date() });
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: SESSION_TTL_MS
    });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(201).json({ ...result, token, expiresAt: sessionExpiresAt(db.sessions.get(token)!) });
  } catch (error) {
    return res.status(409).json({ message: error instanceof Error ? error.message : 'Tashkilotni yaratib bo‘lmadi.' });
  }
});

// Resolve tenant middleware
merchantRouter.use('/merchant', (req: Request, res: Response, next: NextFunction) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ message: 'Tizimga kiring.' });
  let membership = Array.from(db.memberships.values()).find(
    (item) => item.userId === user.id && item.status === 'ACTIVE'
  );
  if (!membership && (user.role === 'OWNER' || user.role === 'OPERATOR' || user.role === 'MANAGER')) {
    if (user.id === SEED_IDS.ownerUserId || user.id === SEED_IDS.operatorUserId) {
      membership = {
        id: 'seed-' + user.id + '-membership',
        organizationId: SEED_IDS.navbahorOrgId,
        userId: user.id,
        role: user.role as any,
        status: 'ACTIVE'
      };
      db.memberships.set(membership.id, membership);
    } else {
      const fallbackOrg = Array.from(db.organizations.values()).find(
        (o) => (o as any).ownerId === user.id || (o as any).userId === user.id
      );
      if (fallbackOrg) {
        membership = {
          id: uuidv4(),
          organizationId: fallbackOrg.id,
          userId: user.id,
          role: user.role as any,
          status: 'ACTIVE'
        };
        db.memberships.set(membership.id, membership);
        db.scheduleSave();
      }
    }
  }
  if (!membership) return res.status(403).json({ message: 'Hisobingizga tashkilot biriktirilmagan.' });
  let stores = Array.from(db.stores.values()).filter((store) => store.organizationId === membership.organizationId);
  if (stores.length === 0) {
    return res.status(403).json({ message: 'Tashkilotga tegishli do‘konlar topilmadi.' });
  }
  const requestedId = req.query.storeId || req.body?.storeId;
  const store = requestedId ? stores.find((item) => item.id === requestedId) : stores[0];
  if (!store) return res.status(403).json({ message: 'Bu tashkilotga kirish huquqingiz yo‘q.' });
  const resourceId = req.path.split('/')[2];
  const isSpecialOffersSubpath = req.path.startsWith('/offers/batch') || req.path.startsWith('/offers/import');
  const collection =
    req.path.startsWith('/offers/') && !isSpecialOffersSubpath
      ? db.offers
      : req.path.startsWith('/inbox/')
      ? db.corrections
      : req.path.startsWith('/inquiries/')
      ? db.inquiries
      : null;
  if (collection && resourceId) {
    const resource = collection.get(resourceId);
    if (!resource || !stores.some((item) => item.id === resource.storeId))
      return res.status(403).json({ message: 'Bu yozuvga kirish huquqingiz yo‘q.' });
  }
  req.query.storeId = store.id;
  req.body = { ...req.body, storeId: store.id, organizationId: membership.organizationId, userId: user.id };
  res.locals.organization =
    db.organizations.get(membership.organizationId) ||
    ({ id: membership.organizationId, name: 'Tashkilot', type: 'RETAIL', status: 'ACTIVE' } as any);
  if (res.locals.organization.status === 'SUSPENDED' || res.locals.organization.status === 'DELETED') {
    return res
      .status(403)
      .json({ code: 'ORGANIZATION_SUSPENDED', message: 'Tashkilot faoliyati to‘xtatilgan yoki o‘chirilgan.' });
  }
  if (store.status === 'SUSPENDED' || store.status === 'DELETED') {
    return res.status(403).json({ code: 'STORE_SUSPENDED', message: 'Ushbu do‘kon faoliyati to‘xtatilgan.' });
  }
  if (req.method === 'DELETE' && user.role === 'OPERATOR') {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Operator uchun ushbu amal taqiqlangan.' });
  }
  res.locals.stores = stores;
  res.locals.store = store;
  if (
    !isTradeOrganization(res.locals.organization?.type) &&
    (req.path.startsWith('/stock-documents') || (req.path.startsWith('/offers') && req.method !== 'GET'))
  ) {
    return res
      .status(400)
      .json({ message: 'Xizmat tashkilotida ombor amallari mavjud emas. Xizmatlar bo‘limidan foydalaning.' });
  }
  next();
});

merchantRouter.get('/merchant/context', (_req, res) => {
  res.json({ organization: res.locals.organization, stores: res.locals.stores });
});

merchantRouter.use('/merchant/services', (_req, res, next) => {
  if (isTradeOrganization(res.locals.organization?.type))
    return res.status(400).json({ message: 'Bu tashkilot savdo rejimida ishlaydi.' });
  next();
});

merchantRouter.get('/merchant/services', (_req, res) => {
  res.json({
    services: Array.from(db.offers.values()).filter(
      (offer) =>
        offer.storeId === res.locals.store.id && offer.variant.kind === 'SERVICE' && offer.status !== 'INACTIVE'
    )
  });
});

merchantRouter.post('/merchant/services', (req, res) => {
  try {
    return res
      .status(201)
      .json({ service: createService(db, res.locals.organization.id, res.locals.store.id, req.body) });
  } catch {
    return res.status(400).json({ message: 'Xizmat nomi, narxi va davomiyligini to‘g‘ri kiriting.' });
  }
});

merchantRouter.get('/merchant/services/completions', (_req, res) => {
  const completions = Array.from(db.stockDocuments.values())
    .filter((doc) => doc.storeId === res.locals.store.id)
    .map(serviceCompletionFromDocument)
    .filter(Boolean);
  completions.sort((a, b) => b!.createdAt.localeCompare(a!.createdAt));
  res.json({ completions });
});

merchantRouter.post('/merchant/services/completions', (req, res) => {
  const user = getCurrentUser(req)!;
  try {
    return res
      .status(201)
      .json({ completion: completeService(db, res.locals.organization.id, res.locals.store.id, user.id, req.body) });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error && !('issues' in error)
          ? error.message
          : 'Mijoz va to‘lov ma’lumotlarini to‘g‘ri kiriting.'
    });
  }
});

merchantRouter.get('/merchant/dashboard', (req, res) => {
  const storeId = (req.query.storeId as string) || SEED_IDS.navbahorStoreId;
  const summary = db.getMerchantFinancialSummary(storeId);
  const recentDocs = Array.from(db.stockDocuments.values())
    .filter((d) => d.storeId === storeId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  res.json({ summary, recentDocs });
});

merchantRouter.get('/merchant/offers', (req, res) => {
  const storeId = (req.query.storeId as string) || SEED_IDS.navbahorStoreId;
  const offers = Array.from(db.offers.values()).filter((o) => o.storeId === storeId);
  res.json({ offers });
});

// PATCH offer with optimistic locking version
merchantRouter.patch('/merchant/offers/:id', (req, res) => {
  const offer = db.offers.get(req.params.id);
  if (!offer) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Taklif topilmadi' });
    return;
  }

  const { price, minOrderQuantity, version } = req.body;

  // Optimistic concurrency check
  if (version !== undefined && offer.version !== version) {
    res
      .status(409)
      .json({ code: 'VERSION_CONFLICT', message: 'Ma‘lumot boshqa foydalanuvchi tomonidan o‘zgartirilgan' });
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
merchantRouter.post('/merchant/offers', (req, res) => {
  const { storeId, title, brand, category, barcode, packUnit, price, costPrice, stockOnHand, imageUrl } = req.body;
  if (!title || !price) {
    res.status(400).json({ code: 'INVALID_DATA', message: 'Mahsulot nomi va narxi majburiy' });
    return;
  }
  const variantId = uuidv4();
  const offerId = uuidv4();
  const targetStoreId = storeId || res.locals.store?.id || SEED_IDS.navbahorStoreId;

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

// POST batch import merchant offers (CSV / bulk)
merchantRouter.post('/merchant/offers/batch', (req, res) => {
  const { storeId, items } = req.body;
  const targetStoreId = storeId || res.locals.store?.id || SEED_IDS.navbahorStoreId;

  // Verify filial permission
  if (res.locals.stores && !res.locals.stores.some((s: any) => s.id === targetStoreId)) {
    return res
      .status(403)
      .json({ success: false, code: 'FORBIDDEN', message: 'Ushbu filial/do‘konga tovar yuklash huquqingiz yo‘q.' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ success: false, code: 'INVALID_DATA', message: 'Import qilish uchun tovarlar ro‘yxati yuborilmadi' });
  }

  // Pre-validation: ensure all items are valid before committing anything to db
  const rowErrors: Array<{ row?: number; barcode?: string; message: string }> = [];
  const seenBarcodes = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rowNum = item.rowNumber || i + 2;
    const barcode = item.barcode ? String(item.barcode).trim() : '';
    const title = item.title ? String(item.title).trim() : '';
    const rawPrice = item.price;
    const rawStock = item.stockOnHand;

    const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice);
    const stock = typeof rawStock === 'number' ? rawStock : parseInt(rawStock, 10);

    if (!barcode) {
      rowErrors.push({ row: rowNum, message: 'Shtrix-kod kiritilmagan' });
    } else if (seenBarcodes.has(barcode.toLowerCase())) {
      rowErrors.push({ row: rowNum, barcode, message: `Shtrix-kod (${barcode}) faylda takrorlangan` });
    } else {
      seenBarcodes.add(barcode.toLowerCase());
    }

    if (!title) {
      rowErrors.push({ row: rowNum, barcode, message: 'Tovar nomi kiritilmagan' });
    }

    if (isNaN(price) || price <= 0) {
      rowErrors.push({ row: rowNum, barcode, message: 'Chakana narx 0 dan katta musbat son bo‘lishi kerak' });
    }

    if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      rowErrors.push({ row: rowNum, barcode, message: 'Qoldiq 0 yoki undan katta butun son bo‘lishi kerak' });
    }
  }

  // If any row fails validation, reject atomically to prevent partial/corrupted data
  if (rowErrors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_FAILED',
      message: 'Fayldagi qatorlarda xatolik aniqlandi. Ma’lumotlar bazaga saqlanmadi.',
      errors: rowErrors
    });
  }

  // Atomic database update
  let createdCount = 0;
  let updatedCount = 0;
  const processedOfferIds: string[] = [];

  const storeOffers = Array.from(db.offers.values()).filter((o) => o.storeId === targetStoreId);
  const offerByBarcode = new Map<string, Offer>();
  for (const o of storeOffers) {
    if (o.variant?.barcode) {
      offerByBarcode.set(o.variant.barcode.trim().toLowerCase(), o);
    }
  }

  for (const item of items) {
    const barcode = String(item.barcode).trim();
    const title = String(item.title).trim();
    const priceDec = new Decimal(item.price).toFixed(2);
    const stockInt = parseInt(item.stockOnHand, 10);
    const initialCost = item.costPrice ? new Decimal(item.costPrice) : new Decimal(item.price).times(0.75);

    const existingOffer = offerByBarcode.get(barcode.toLowerCase());

    if (existingOffer) {
      // Update existing offer
      existingOffer.price = priceDec;
      existingOffer.stockOnHand = stockInt;
      existingOffer.status = stockInt > 0 ? 'ACTIVE' : 'OUT_OF_STOCK';
      existingOffer.priceUpdatedAt = new Date().toISOString();
      existingOffer.stockVerifiedAt = new Date().toISOString();
      existingOffer.version++;

      // Update variant title & aliases
      const variant = db.variants.get(existingOffer.variantId);
      if (variant) {
        variant.title = title;
        if (!variant.aliases) variant.aliases = [];
        if (!variant.aliases.includes(title.toLowerCase())) {
          variant.aliases.push(title.toLowerCase());
        }
      }

      // Update inventory balance
      const balance = db.balances.get(existingOffer.id);
      if (balance) {
        balance.onHand = new Decimal(stockInt);
        balance.lastVerifiedAt = new Date();
        balance.version++;
      } else {
        db.balances.set(existingOffer.id, {
          offerId: existingOffer.id,
          onHand: new Decimal(stockInt),
          averageUnitCost: initialCost,
          lastVerifiedAt: new Date(),
          version: 1
        });
      }

      updatedCount++;
      processedOfferIds.push(existingOffer.id);
    } else {
      // Create new variant & offer
      const variantId = uuidv4();
      const offerId = uuidv4();

      const variant: Variant & { aliases?: string[] } = {
        id: variantId,
        productId: uuidv4(),
        title,
        brand: item.brand?.trim() || 'Boshqa',
        category: item.category?.trim() || 'Umumiy',
        packSize: '1 dona',
        packUnit: item.packUnit?.trim() || 'dona',
        barcode,
        sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
        photoUrl: item.imageUrl || '',
        aliases: [title.toLowerCase()]
      };

      db.variants.set(variantId, variant);

      const newOffer: Offer = {
        id: offerId,
        storeId: targetStoreId,
        variantId,
        variant,
        price: priceDec,
        minOrderQuantity: 1,
        stockOnHand: stockInt,
        stockVerifiedAt: new Date().toISOString(),
        priceUpdatedAt: new Date().toISOString(),
        freshness: 'NEW',
        status: stockInt > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
        wholesaleTiers: [],
        version: 1
      };

      db.offers.set(offerId, newOffer);
      db.balances.set(offerId, {
        offerId,
        onHand: new Decimal(stockInt),
        averageUnitCost: initialCost,
        lastVerifiedAt: new Date(),
        version: 1
      });

      offerByBarcode.set(barcode.toLowerCase(), newOffer);
      createdCount++;
      processedOfferIds.push(offerId);
    }
  }

  res.status(200).json({
    success: true,
    message: `${items.length} ta tovar muvaffaqiyatli import qilindi (${createdCount} ta yangi qo‘shildi, ${updatedCount} ta mavjud tovar yangilandi).`,
    total: items.length,
    createdCount,
    updatedCount,
    processedOfferIds
  });
});

// DELETE merchant offer
merchantRouter.delete('/merchant/offers/:id', (req, res) => {
  const offer = db.offers.get(req.params.id);
  if (!offer) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Tovar topilmadi' });
    return;
  }
  db.offers.delete(req.params.id);
  db.balances.delete(req.params.id);
  res.json({ success: true, message: 'Tovar muvaffaqiyatli o‘chirildi' });
});

// Stock documents
merchantRouter.get('/merchant/stock-documents', (req, res) => {
  const storeId = (req.query.storeId as string) || SEED_IDS.navbahorStoreId;
  const docs = Array.from(db.stockDocuments.values()).filter((d) => d.storeId === storeId);
  res.json({ documents: docs });
});

merchantRouter.post('/merchant/stock-documents', async (req, res) => {
  const user =
    getCurrentUser(req) ||
    res.locals.user ||
    (process.env.NODE_ENV !== 'production' ? db.users.get(SEED_IDS.ownerUserId) : null);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }
  const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string;

  if (idempotencyKey) {
    const scope = `stock_post_${req.body.storeId}`;
    const hash = JSON.stringify(req.body);
    const existing = db.checkIdempotency(scope, idempotencyKey, hash);
    if (existing === 'CONFLICT') {
      res
        .status(409)
        .json({ code: 'IDEMPOTENCY_CONFLICT', message: 'Ushbu Idempotency-Key bilan boshqa so‘rov yuborilgan' });
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
merchantRouter.get('/merchant/expenses', (req, res) => {
  const storeId = (req.query.storeId as string) || SEED_IDS.navbahorStoreId;
  const expenses = Array.from(db.expenses.values()).filter((e) => e.storeId === storeId);
  res.json({ expenses });
});

merchantRouter.post('/merchant/expenses', (req, res) => {
  const { storeId, category, amount, date, description } = req.body;
  const exp = {
    id: uuidv4(),
    organizationId:
      (storeId && db.stores.get(storeId)?.organizationId) || res.locals.organization?.id || SEED_IDS.navbahorOrgId,
    storeId: storeId || res.locals.store?.id || SEED_IDS.navbahorStoreId,
    category: category || 'BOSHQA',
    amount: new Decimal(amount || 0),
    date: date || new Date().toISOString().split('T')[0],
    description: description || '',
    createdAt: new Date().toISOString()
  };
  db.expenses.set(exp.id, exp);
  res.status(201).json({ expense: exp });
});

// Financial report export
merchantRouter.get('/merchant/reports/export', (req, res) => {
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
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=YaqinTop_Hisobot_${new Date().toISOString().split('T')[0]}.csv`
  );
  res.send('\uFEFF' + csv);
});

// Store Settings
merchantRouter.get('/merchant/store-settings', (req, res) => {
  const storeId = (req.query.storeId as string) || SEED_IDS.navbahorStoreId;
  const store = db.stores.get(storeId);
  res.json({ store });
});

merchantRouter.patch('/merchant/store-settings', (req, res) => {
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

// Inbox / Corrections
merchantRouter.get('/merchant/inbox', (req, res) => {
  const storeId = (req.query.storeId as string) || SEED_IDS.navbahorStoreId;
  const corrections = Array.from(db.corrections.values()).filter((c) => c.storeId === storeId);
  res.json({ corrections });
});

merchantRouter.post('/merchant/inbox/:id/reply', (req, res) => {
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

// Merchant Inquiries
merchantRouter.get('/merchant/inquiries', (req, res) => {
  const storeId = (req.query.storeId as string) || SEED_IDS.navbahorStoreId;
  const inqs = Array.from(db.inquiries.values())
    .filter((i) => !storeId || i.storeId === storeId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ inquiries: inqs });
});

merchantRouter.post('/merchant/inquiries/:id/reply', (req, res) => {
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

  res.json({
    success: true,
    inquiry: inq,
    message: 'Javobingiz muvaffaqiyatli saqlandi, mijoz va adminga yetkazildi'
  });
});
