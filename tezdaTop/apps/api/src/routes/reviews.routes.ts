import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/in-memory-db.js';
import { getCurrentUser } from '../middleware/auth.middleware.js';

export const reviewsRouter = Router();

reviewsRouter.get('/api/v1/stores/:id/reviews', (req, res) => {
  const storeReviews = Array.from(db.reviews.values()).filter(
    (r) => r.storeId === req.params.id && r.status === 'PUBLISHED'
  );
  res.json({ reviews: storeReviews });
});

reviewsRouter.post('/api/v1/stores/:id/reviews', (req, res) => {
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
reviewsRouter.post('/api/v1/stores/:id/reviews/:reviewId/reply', (req, res) => {
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
