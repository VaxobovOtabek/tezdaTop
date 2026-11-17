import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { db, DBDealer, DBDealerProduct } from '../db/in-memory-db.js';
import { DealerService } from '../services/dealer.service.js';
import { hashOwnerPassword } from '../services/owner-onboarding.service.js';
import { User } from '@yaqintop/contracts';

export const dealerRouter: Router = Router();

// Middleware: Authenticate dealer user
function requireDealer(req: Request, res: Response, next: () => void) {
  const user = (req as any).user as User | undefined;
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kirish talab etiladi' });
    return;
  }

  // Allow SUPERADMIN or ADMIN to impersonate / access, or DEALER/DEALER_AGENT
  if (!['DEALER', 'DEALER_AGENT', 'SUPERADMIN', 'ADMIN'].includes(user.role)) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Faqat dillerlar va administratorlar uchun ruxsat berilgan' });
    return;
  }

  let dealer = DealerService.getDealerByUserId(user.id);
  // If admin/superadmin accessing, fallback to first active dealer if not directly linked
  if (!dealer && ['SUPERADMIN', 'ADMIN'].includes(user.role)) {
    dealer = Array.from(db.dealers.values())[0] || null;
  }

  // If dealer user doesn't have profile yet, auto-provision one
  if (!dealer && (user.role === 'DEALER' || user.role === 'DEALER_AGENT')) {
    const dealerId = uuidv4();
    dealer = {
      id: dealerId,
      userId: user.id,
      companyName: user.fullName || 'Distribyutor',
      contactName: user.fullName || 'Distribyutor',
      login: user.email.includes('@') ? user.email.split('@')[0] : user.email,
      phone: user.phone || '+998 90 123 45 67',
      status: user.status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED',
      allowExperimentalMap: true,
      region: 'Toshkent shahri',
      city: 'Yunusobod tumani',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.dealers.set(dealerId, dealer);
    db.scheduleSave();
  }

  if (!dealer) {
    res.status(404).json({ code: 'DEALER_NOT_FOUND', message: 'Foydalanuvchiga biriktirilgan diller profili topilmadi' });
    return;
  }

  if (dealer.status === 'BLOCKED' || dealer.status === 'SUSPENDED') {
    res.status(403).json({ code: 'DEALER_SUSPENDED', message: 'Dillerlik hisobi to‘xtatilgan yoki bloklangan' });
    return;
  }

  (req as any).dealer = dealer;
  next();
}

dealerRouter.use(requireDealer);

// 1. Dealer Profile & Overview
dealerRouter.get('/me', (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  const stores = DealerService.getDealerStores(dealer.id);
  const totalDebt = stores.reduce((sum, s) => sum + s.currentDebtBalance, 0);

  res.json({
    id: dealer.id,
    userId: dealer.userId,
    companyName: dealer.companyName,
    contactName: dealer.contactName,
    login: dealer.login,
    phone: dealer.phone,
    status: dealer.status,
    region: dealer.region || 'Toshkent shahri',
    city: dealer.city || 'Yunusobod tumani',
    allowExperimentalMap: Boolean(dealer.allowExperimentalMap),
    storeCount: stores.length,
    totalDebt,
    createdAt: dealer.createdAt
  });
});

// 2. Client Stores
dealerRouter.get('/stores', (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  const stores = DealerService.getDealerStores(dealer.id);
  res.json({ stores });
});

dealerRouter.get('/stores/available', (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  const q = (req.query.q || '') as string;
  const stores = DealerService.getAvailableStores(dealer.id, q);
  res.json({ stores });
});

dealerRouter.post('/stores/attach', (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  const { storeId, query, creditLimit, notes } = req.body;
  const identifier = storeId || query;

  if (!identifier) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Do‘kon ID, STIR yoki nomi kiritilishi shart' });
    return;
  }

  try {
    const result = DealerService.attachStore(dealer.id, identifier, creditLimit, notes);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ code: 'ATTACH_FAILED', message: err.message });
  }
});

dealerRouter.post('/stores/create', (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  const { name, phone, address, lat, lng, inn, creditLimit, notes } = req.body;

  try {
    const result = DealerService.createAndAttachStore(dealer.id, {
      name,
      phone,
      address,
      lat: Number(lat),
      lng: Number(lng),
      inn,
      creditLimit: creditLimit ? Number(creditLimit) : undefined,
      notes
    });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ code: 'CREATE_STORE_FAILED', message: err.message });
  }
});

// 3. Statement of Account (Akt Sverka)
dealerRouter.get('/stores/:storeId/akt-sverka', (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  const { storeId } = req.params;

  try {
    const result = DealerService.getAktSverka(dealer.id, storeId);
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ code: 'AKT_SVERKA_FAILED', message: err.message });
  }
});

// 4. Products Catalog
dealerRouter.get('/products', (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  DealerService.ensureStarterProductsForDealer(dealer.id);
  const products = Array.from(db.dealerProducts.values())
    .filter(p => p.dealerId === dealer.id)
    .map(p => ({
      id: p.id,
      dealerId: p.dealerId,
      name: p.name,
      categoryId: p.categoryId,
      categoryName: p.categoryName || 'Boshqa',
      sku: p.sku || '',
      unit: p.unit,
      wholesalePrice: Number(p.wholesalePrice.toString()),
      stockQuantity: Number(p.stockQuantity.toString()),
      globalProductId: p.globalProductId || null,
      createdAt: p.createdAt
    }));

  res.json({ products });
});

dealerRouter.post('/products', (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  const { name, categoryId, categoryName, sku, unit, wholesalePrice, stockQuantity, globalProductId } = req.body;

  if (!name || wholesalePrice === undefined) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Mahsulot nomi va ulgurji narxi kiritilishi shart' });
    return;
  }

  const id = uuidv4();
  const newProduct: DBDealerProduct = {
    id,
    dealerId: dealer.id,
    globalProductId: globalProductId || undefined,
    name: name.trim(),
    categoryId: categoryId || 'general',
    categoryName: categoryName || 'Umumiy tovarlar',
    sku: sku?.trim() || undefined,
    unit: unit || 'dona',
    wholesalePrice: new Decimal(wholesalePrice),
    stockQuantity: new Decimal(stockQuantity || 0),
    createdAt: new Date().toISOString()
  };

  db.dealerProducts.set(id, newProduct);
  db.scheduleSave();

  res.status(201).json({ product: {
    ...newProduct,
    wholesalePrice: Number(newProduct.wholesalePrice.toString()),
    stockQuantity: Number(newProduct.stockQuantity.toString())
  }});
});

dealerRouter.patch('/products/:id', (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  const { id } = req.params;
  const prod = db.dealerProducts.get(id);

  if (!prod || prod.dealerId !== dealer.id) {
    res.status(404).json({ code: 'PRODUCT_NOT_FOUND', message: 'Mahsulot topilmadi' });
    return;
  }

  const { name, wholesalePrice, stockQuantity, unit, sku, categoryName } = req.body;
  if (name !== undefined) prod.name = name.trim();
  if (unit !== undefined) prod.unit = unit;
  if (sku !== undefined) prod.sku = sku;
  if (categoryName !== undefined) prod.categoryName = categoryName;
  if (wholesalePrice !== undefined) prod.wholesalePrice = new Decimal(wholesalePrice);
  if (stockQuantity !== undefined) prod.stockQuantity = new Decimal(stockQuantity);

  db.scheduleSave();

  res.json({
    success: true,
    product: {
      ...prod,
      wholesalePrice: Number(prod.wholesalePrice.toString()),
      stockQuantity: Number(prod.stockQuantity.toString())
    }
  });
});

// 5. Supply Orders (Tovar topshirish / Nakladnoy)
dealerRouter.post('/supplies', (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  const { storeId, items, paidAmount, paymentType, notes } = req.body;

  try {
    const result = DealerService.createSupplyOrder(dealer.id, {
      storeId,
      items,
      paidAmount: Number(paidAmount || 0),
      paymentType: paymentType || 'PARTIAL',
      notes
    });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ code: 'SUPPLY_ORDER_FAILED', message: err.message });
  }
});

dealerRouter.get('/supplies', (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  const orders = Array.from(db.supplyOrders.values())
    .filter(o => o.dealerId === dealer.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(o => {
      const store = db.stores.get(o.storeId);
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        storeId: o.storeId,
        storeName: store?.name || 'Do‘kon',
        storeAddress: store?.address || '',
        totalAmount: Number(o.totalAmount.toString()),
        paidAmount: Number(o.paidAmount.toString()),
        debtAmount: Number(o.debtAmount.toString()),
        paymentType: o.paymentType,
        status: o.status,
        itemCount: o.items.length,
        notes: o.notes,
        createdAt: o.createdAt
      };
    });

  res.json({ orders });
});

dealerRouter.get('/supplies/:id', (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  const { id } = req.params;
  const order = db.supplyOrders.get(id);

  if (!order || order.dealerId !== dealer.id) {
    res.status(404).json({ code: 'ORDER_NOT_FOUND', message: 'Yuk xati topilmadi' });
    return;
  }

  const store = db.stores.get(order.storeId);

  res.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      dealerId: order.dealerId,
      storeId: order.storeId,
      storeName: store?.name || '',
      storeAddress: store?.address || '',
      storePhone: store?.phone || '',
      storeInn: store?.inn || '',
      totalAmount: Number(order.totalAmount.toString()),
      paidAmount: Number(order.paidAmount.toString()),
      debtAmount: Number(order.debtAmount.toString()),
      paymentType: order.paymentType,
      status: order.status,
      items: order.items.map(it => ({
        id: it.id,
        productId: it.productId,
        productName: it.productName,
        unit: it.unit,
        quantity: Number(it.quantity.toString()),
        unitPrice: Number(it.unitPrice.toString()),
        subtotal: Number(it.subtotal.toString())
      })),
      notes: order.notes,
      createdAt: order.createdAt
    }
  });
});

// 6. Cash collection (Inkassatsiya)
dealerRouter.post('/payments', (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  const { storeId, amount, paymentMethod, comment } = req.body;

  try {
    const result = DealerService.recordPayment(dealer.id, {
      storeId,
      amount: Number(amount),
      paymentMethod: paymentMethod || 'CASH',
      comment
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ code: 'PAYMENT_FAILED', message: err.message });
  }
});

// 7. Returned goods (Vozvrat)
dealerRouter.post('/returns', (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  const { storeId, items, comment } = req.body;

  try {
    const result = DealerService.recordReturn(dealer.id, {
      storeId,
      items,
      comment
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ code: 'RETURN_FAILED', message: err.message });
  }
});

// 8. Analytics & Reports
dealerRouter.get('/analytics', (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  const period = String(req.query.period || 'month');

  const analytics = DealerService.getAnalytics(dealer.id, period);
  res.json({ analytics });
});

// 9. GIS Maps & Routing
dealerRouter.get('/map/stores', (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  const stores = DealerService.getDealerStores(dealer.id);
  res.json({ stores });
});

dealerRouter.post('/map/route', async (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  const { storeIds, origin } = req.body;

  try {
    const route = await DealerService.calculateRoute(dealer.id, storeIds, origin);
    res.json({ route });
  } catch (err: any) {
    res.status(400).json({ code: 'ROUTING_FAILED', message: err.message });
  }
});

// Mode 2: Experimental Global Goods Distribution Map
dealerRouter.get('/map/global-goods', (req: Request, res: Response) => {
  const dealer = (req as any).dealer as DBDealer;
  const user = (req as any).user as User;

  // Check permission
  if (!dealer.allowExperimentalMap && !['SUPERADMIN', 'ADMIN'].includes(user.role)) {
    res.status(403).json({
      code: 'EXPERIMENTAL_MAP_LOCKED',
      message: 'Global tovarlar xaritasi eksperimental funksiya bo‘lib, ma’muriyat tomonidan ruxsat berilishi kerak'
    });
    return;
  }

  const category = req.query.category ? String(req.query.category) : undefined;
  const query = req.query.query ? String(req.query.query) : undefined;

  const distribution = DealerService.getGlobalGoodsDistribution({ category, query });
  res.json({ distribution });
});
