import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/in-memory-db.js';
import { getCurrentUser } from '../middleware/auth.middleware.js';

export const bookmarksRouter = Router();

bookmarksRouter.get('/', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }
  const userBm = Array.from(db.bookmarks.values()).filter((b) => b.userId === user.id);
  const stores = userBm.filter((b) => b.storeId).map((b) => db.stores.get(b.storeId!)).filter(Boolean);
  res.json({ bookmarks: userBm, stores });
});

bookmarksRouter.post('/', (req, res) => {
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

bookmarksRouter.delete('/:id', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }
  const bm = db.bookmarks.get(req.params.id);
  if (bm && bm.userId !== user.id && !['ADMIN', 'SUPERADMIN'].includes(user.role)) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Ushbu xatcho‘pni o‘chirish huquqingiz yo‘q' });
    return;
  }
  db.bookmarks.delete(req.params.id);
  res.json({ success: true });
});
