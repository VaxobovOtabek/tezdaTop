import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/in-memory-db.js';
import { SEED_IDS } from '../db/seed-ids.js';
import { getCurrentUser, requireStaffRole } from '../middleware/auth.middleware.js';

export const adminAppsRouter = Router();

adminAppsRouter.get('/overview', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  const pendingApps = Array.from(db.stores.values()).filter((s) => s.status === 'PENDING').length;
  const openReports = Array.from(db.reports.values()).filter((r) => r.status === 'OPEN').length;
  const overdueCorrections = Array.from(db.corrections.values()).filter(
    (c) => c.status === 'OPEN' && new Date(c.deadline).getTime() < Date.now()
  ).length;

  const pendingCredentialRequests = Array.from(db.credentialRequests.values()).filter((r) => r.status === 'PENDING').length;
  const pendingInquiries = Array.from(db.inquiries.values()).filter(
    (i) => i.status === 'MERCHANT_SUBMITTED' || i.status === 'PENDING' || i.status === 'PENDING_MERCHANT_REPLY'
  ).length;
  const pendingItemProposals = Array.from(db.itemProposals.values()).filter((p) => p.status === 'PENDING').length;
  const pendingPhotoProposals = Array.from(db.photoProposals.values()).filter((p) => p.status === 'PENDING').length;
  const totalPendingProposals = pendingItemProposals + pendingPhotoProposals;
  const pendingRequests = pendingCredentialRequests + pendingInquiries + totalPendingProposals;

  const allReviews = Array.from(db.reviews.values());
  const pendingReviews = allReviews.filter((r: any) => r.status === 'PENDING' || r.status === 'HIDDEN').length;

  const user = getCurrentUser(req);
  const isStaffAdmin = user && ['ADMIN', 'SUPERADMIN'].includes(user.role);

  res.json({
    pendingApps,
    openReports,
    overdueCorrections,
    pendingCredentialRequests,
    pendingInquiries,
    pendingItemProposals,
    pendingPhotoProposals,
    totalPendingProposals,
    pendingRequests,
    pendingReviews,
    totalReviews: allReviews.length,
    totalStores: db.stores.size,
    activeStores: [...db.stores.values()].filter((s) => s.status === 'ACTIVE').length,
    moderationStores: [...db.stores.values()].filter((s) => ['PENDING', 'NEEDS_CHANGES'].includes(s.status)).length,
    applicationCount: [...db.stores.values()].filter((s) => ['PENDING', 'NEEDS_CHANGES'].includes(s.status)).length,
    totalUsers: db.users.size,
    ownerCount: [...db.users.values()].filter((u) => u.role === 'OWNER').length,
    totalReports: db.reports.size,
    latestAudit: isStaffAdmin ? db.auditLogs.slice(-5).reverse() : [],
    auditTotal: isStaffAdmin ? db.auditLogs.length : 0
  });
});

// Admin Review Moderation Routes
adminAppsRouter.get('/reviews', (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  if (!user || !['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role)) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Ruxsat berilmagan' });
    return;
  }

  const enrichedReviews = Array.from(db.reviews.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((r) => {
      const store = db.stores.get(r.storeId);
      const org = store ? db.organizations.get(store.organizationId) : undefined;
      return {
        ...r,
        storeName: store?.name || 'Do‘kon',
        storeAddress: store?.address || '',
        organizationName: org?.name || ''
      };
    });

  res.json({ reviews: enrichedReviews, total: enrichedReviews.length });
});

adminAppsRouter.patch('/reviews/:id/status', async (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  if (!user || !['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role)) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Ruxsat berilmagan' });
    return;
  }

  const review = db.reviews.get(req.params.id);
  if (!review) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Sharh topilmadi' });
    return;
  }

  const { status } = req.body;
  if (!['PUBLISHED', 'HIDDEN', 'REJECTED', 'PENDING'].includes(status)) {
    res.status(400).json({ code: 'BAD_REQUEST', message: 'Noto‘g‘ri status ko‘rsatildi' });
    return;
  }

  review.status = status;
  (review as any).updatedAt = new Date().toISOString();
  db.reviews.set(review.id, review);

  // Recalculate store rating
  const store = db.stores.get(review.storeId);
  if (store) {
    const pubReviews = Array.from(db.reviews.values()).filter(
      (r) => r.storeId === store.id && r.status === 'PUBLISHED'
    );
    const sum = pubReviews.reduce((acc, r) => acc + r.rating, 0);
    store.rating = pubReviews.length > 0 ? parseFloat((sum / pubReviews.length).toFixed(1)) : 0;
    store.reviewCount = pubReviews.length;
  }

  res.json({ success: true, review });
});

adminAppsRouter.delete('/reviews/:id', async (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  if (!user || !['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role)) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Ruxsat berilmagan' });
    return;
  }

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
    const pubReviews = Array.from(db.reviews.values()).filter(
      (r) => r.storeId === storeId && r.status === 'PUBLISHED'
    );
    const sum = pubReviews.reduce((acc, r) => acc + r.rating, 0);
    store.rating = pubReviews.length > 0 ? parseFloat((sum / pubReviews.length).toFixed(1)) : 0;
    store.reviewCount = pubReviews.length;
  }

  res.json({ success: true, message: 'Sharh muvaffaqiyatli o‘chirildi' });
});

adminAppsRouter.get('/applications', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  const pendingStores = Array.from(db.stores.values()).filter(
    (s) => s.status === 'PENDING' || s.status === 'NEEDS_CHANGES'
  );

  const enrichedApps = pendingStores.map((s) => {
    const org = db.organizations.get(s.organizationId);
    return {
      ...s,
      organizationName: org?.name || 'Mustaqil tashkilot',
      inn: org?.inn || (s as any).inn || '307654321'
    };
  });

  res.json({ applications: enrichedApps });
});

adminAppsRouter.patch('/applications/:id', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), async (req, res) => {
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

  const caller = getCurrentUser(req);
  const auditEntry = {
    id: uuidv4(),
    actorId: caller?.id || SEED_IDS.adminUserId,
    actorEmail: caller?.email || 'admin@yaqintop.uz',
    action: `STORE_APP_${action}`,
    entityType: 'STORE',
    entityId: store.id,
    diff: { status: store.status, reason },
    timestamp: new Date().toISOString()
  };
  db.auditLogs.push(auditEntry);

  res.json({ store });
});

adminAppsRouter.get('/reports', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  const enrichedReports = Array.from(db.reports.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((r) => {
      const store = db.stores.get(r.storeId);
      const user = r.reporterUserId ? db.users.get(r.reporterUserId) : undefined;
      return {
        ...r,
        storeName: store?.name || 'Do‘kon',
        storeAddress: store?.address || '',
        reporterName: user?.fullName || 'Xaridor'
      };
    });

  res.json({ reports: enrichedReports });
});

adminAppsRouter.patch('/reports/:id', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), async (req, res) => {
  const rep = db.reports.get(req.params.id);
  if (!rep) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Shikoyat topilmadi' });
    return;
  }
  const { status, notes } = req.body;
  if (status) rep.status = status;
  if (notes) (rep as any).resolutionNotes = notes;
  (rep as any).resolvedAt = new Date().toISOString();

  res.json({ report: rep });
});

adminAppsRouter.delete('/reports/:id', requireStaffRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  const rep = db.reports.get(req.params.id);
  if (!rep) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Shikoyat topilmadi' });
    return;
  }
  db.reports.delete(req.params.id);

  const caller = getCurrentUser(req);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: caller?.id || SEED_IDS.adminUserId,
    actorEmail: caller?.email || 'admin@yaqintop.uz',
    action: 'DELETE_REPORT',
    entityType: 'REPORT',
    entityId: req.params.id,
    diff: { storeId: rep.storeId, reason: rep.reason },
    timestamp: new Date().toISOString()
  });

  db.scheduleSave();
  res.json({ success: true, message: 'Shikoyat muvaffaqiyatli o‘chirildi' });
});
