import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/in-memory-db.js';
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
