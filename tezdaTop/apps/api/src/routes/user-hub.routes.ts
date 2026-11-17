import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, type DBOrganization } from '../db/in-memory-db.js';
import { SEED_IDS } from '../db/seed-ids.js';
import { getCurrentUser } from '../middleware/auth.middleware.js';

export const userHubRouter = Router();

userHubRouter.get('/reviews', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }
  const userId =
    ['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role) && req.query.userId
      ? String(req.query.userId)
      : user.id;

  const reviews = Array.from(db.reviews.values())
    .filter((r) => r.userId === userId)
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

userHubRouter.delete('/reviews/:id', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }
  const review = db.reviews.get(req.params.id);
  if (!review) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Sharh topilmadi' });
    return;
  }
  if (review.userId !== user.id && !['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role)) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Ushbu sharhni o‘chirish huquqingiz yo‘q' });
    return;
  }
  const storeId = review.storeId;
  db.reviews.delete(req.params.id);

  // Recalculate store rating
  const store = db.stores.get(storeId);
  if (store) {
    const pubReviews = Array.from(db.reviews.values()).filter(
      (r) => r.storeId === storeId && r.status === 'PUBLISHED'
    );
    const sum = pubReviews.reduce((acc, r) => acc + r.rating, 0);
    store.rating = pubReviews.length > 0 ? parseFloat((sum / pubReviews.length).toFixed(1)) : 0;
    store.reviewCount = pubReviews.length;
  }
  res.json({ success: true });
});

userHubRouter.get('/reports', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }
  const userId =
    ['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role) && req.query.userId
      ? String(req.query.userId)
      : user.id;

  const reports = Array.from(db.reports.values())
    .filter((r) => r.reporterUserId === userId)
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

userHubRouter.get('/proposals', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kirish talab etiladi' });
    return;
  }
  const userId =
    ['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role) && req.query.userId
      ? String(req.query.userId)
      : user.id;
  const proposals = Array.from(db.itemProposals.values())
    .filter((p) => p.userId === userId)
    .map((p) => {
      const store = db.stores.get(p.storeId);
      const distinctUsers = new Set(
        Array.from(db.itemProposals.values())
          .filter((x) => x.storeId === p.storeId && x.consensusGroupKey === p.consensusGroupKey)
          .map((x) => x.userId)
      );
      return {
        ...p,
        storeName: store?.name || 'Do‘kon',
        storeAddress: store?.address || 'Toshkent shahri',
        storeSlug: (store as any)?.slug || store?.id,
        consensusCount: distinctUsers.size
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ items: proposals, total: proposals.length });
});

userHubRouter.get('/inquiries', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kirish talab etiladi' });
    return;
  }
  const userId =
    ['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role) && req.query.userId
      ? String(req.query.userId)
      : user.id;
  const inquiries = Array.from(db.inquiries.values())
    .filter((inq: any) => inq.senderUserId === userId)
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

userHubRouter.post('/inquiries', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Murojaat yo‘llash uchun iltimos, tizimga kiring' });
    return;
  }
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
    senderUserId: user.id,
    senderName: user.fullName || 'Foydalanuvchi',
    senderPhone: user.phone || '',
    senderEmail: user.email,
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
    const members = Array.from(db.memberships.values()).filter((m) => m.organizationId === organizationId);
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

// Ordinary User: Add Organization / Store / Service
userHubRouter.post('/stores', async (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tashkilot yoki do‘kon qo‘shish uchun iltimos, tizimga kiring' });
    return;
  }

  const {
    name,
    type = 'RETAIL',
    category,
    region,
    city,
    district,
    address,
    phone,
    lat,
    lng,
    openTime = '08:00',
    closeTime = '22:00',
    is24Hours = false,
    photoUrl,
    description,
    initialOffer
  } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Tashkilot yoki do‘kon nomi kiritilishi shart' });
    return;
  }

  const finalName = name.trim();
  const finalRegion = region?.trim() || 'Toshkent shahri';
  const finalDistrict = district?.trim() || city?.trim() || '';
  const finalAddress = address?.trim() || [finalRegion, finalDistrict].filter(Boolean).join(', ');
  const finalPhone = phone?.trim() || user.phone || '+998 90 000 00 00';
  const finalLat = parseFloat(lat) || 41.311081;
  const finalLng = parseFloat(lng) || 69.240562;

  // 1. Create Organization
  const orgId = uuidv4();
  const newOrg: DBOrganization = {
    id: orgId,
    name: finalName,
    inn: req.body.inn || '',
    type: (type || 'RETAIL').trim(),
    status: 'ACTIVE',
    region: finalRegion,
    city: finalDistrict || finalRegion,
    district: finalDistrict,
    createdAt: new Date().toISOString()
  };
  db.organizations.set(orgId, newOrg);

  // 2. Set user membership as OWNER
  const membershipId = uuidv4();
  db.memberships.set(membershipId, {
    id: membershipId,
    organizationId: orgId,
    userId: user.id,
    role: 'OWNER',
    status: 'ACTIVE'
  });

  // 3. Store Hours
  const hours = is24Hours
    ? [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek,
        openTime: '00:00',
        closeTime: '23:59',
        isClosed: false
      }))
    : [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek,
        openTime: openTime || '08:00',
        closeTime: closeTime || '22:00',
        isClosed: false
      }));

  // 4. Create Store
  const storeId = uuidv4();
  const newStore: any = {
    id: storeId,
    organizationId: orgId,
    name: finalName,
    title: finalName,
    inn: req.body.inn || '',
    region: finalRegion,
    city: finalDistrict || finalRegion,
    district: finalDistrict,
    address: finalAddress,
    phone: finalPhone,
    location: {
      lat: finalLat,
      lng: finalLng
    },
    rating: 5.0,
    reviewCount: 0,
    isVerified: true,
    status: 'ACTIVE',
    type: (type || 'RETAIL').trim(),
    category: category?.trim() || (type || 'RETAIL').trim(),
    description: description?.trim() || '',
    photoUrl: photoUrl?.trim() || '',
    hours,
    createdByUserId: user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.stores.set(storeId, newStore);

  // 5. Create Initial Service or Product if provided
  let createdOffer: any = null;
  if (initialOffer && initialOffer.title && initialOffer.price !== undefined && initialOffer.price !== null && initialOffer.price !== '') {
    const isService =
      initialOffer.type === 'SERVICE' ||
      ['SERVICES', 'BEAUTY_SALON', 'GAME_CLUB', 'AUTO_SERVICE', 'EDUCATION'].includes(type);
    const variantId = uuidv4();
    const offerId = uuidv4();
    const variant: any = {
      id: variantId,
      productId: uuidv4(),
      organizationId: orgId,
      title: initialOffer.title.trim(),
      brand: finalName,
      category: initialOffer.category?.trim() || (isService ? 'Xizmatlar' : 'Mahsulotlar'),
      packSize: isService ? '1 ta' : '1 dona',
      packUnit: initialOffer.packUnit || (isService ? 'xizmat' : 'dona'),
      photoUrl: initialOffer.photoUrl || photoUrl || '',
      type: isService ? 'SERVICE' : 'PRODUCT',
      aliases: [initialOffer.title.toLowerCase()]
    };
    db.variants.set(variantId, variant);

    const price = String(initialOffer.price).replace(/\D/g, '') || '0';
    createdOffer = {
      id: offerId,
      storeId,
      variantId,
      price,
      stockOnHand: isService ? 999 : (Number(initialOffer.stockOnHand) || 10),
      freshness: 'FRESH',
      status: 'ACTIVE',
      variant,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.offers.set(offerId, createdOffer);
  }

  // 6. Notify Admin
  db.notifications.set(uuidv4(), {
    id: uuidv4(),
    userId: SEED_IDS.adminUserId,
    title: 'Yangi tashkilot / do‘kon qo‘shildi',
    message: `${user.fullName || user.phone} tomonidan yangi "${finalName}" (${type}) muvaffaqiyatli qo‘shildi.`,
    type: 'INFO',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  // 7. Audit Log
  db.auditLogs.push({
    id: uuidv4(),
    actorId: user.id,
    actorEmail: user.email,
    action: 'CREATE_USER_STORE',
    entityType: 'STORE',
    entityId: storeId,
    diff: { name: finalName, type, region: finalRegion, address: finalAddress },
    timestamp: new Date().toISOString()
  });

  res.status(201).json({
    success: true,
    message: 'Tashkilot muvaffaqiyatli qo‘shildi',
    store: newStore,
    organization: newOrg,
    offer: createdOffer
  });
});

userHubRouter.post('/add-store', (req, res, next) => {
  (userHubRouter as any).handle(Object.assign(req, { url: '/stores' }), res, next);
});

userHubRouter.get('/stores', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }
  const myStores = Array.from(db.stores.values()).filter(
    (s: any) =>
      s.createdByUserId === user.id ||
      Array.from(db.memberships.values()).some((m) => m.userId === user.id && m.organizationId === s.organizationId)
  );
  res.json({ items: myStores, total: myStores.length });
});
