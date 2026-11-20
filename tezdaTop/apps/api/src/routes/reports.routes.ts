import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/in-memory-db.js';
import { getCurrentUser } from '../middleware/auth.middleware.js';
import { reportLimiter } from '../middleware/rate-limiter.js';

export const reportsRouter = Router();

reportsRouter.post('/', reportLimiter, (req, res) => {
  const user = getCurrentUser(req);
  const { storeId, offerId, reason, details } = req.body;

  if (!storeId || !reason || !details) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Barcha maydonlar to‘ldirilishi shart' });
    return;
  }

  const cleanDetails = typeof details === 'string' ? details.trim() : '';
  if (cleanDetails.length < 5 || cleanDetails.length > 2000) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Shikoyat tafsilotlari 5 dan 2000 belgigiacha bo‘lishi shart' });
    return;
  }

  const report = {
    id: uuidv4(),
    reporterUserId: user?.id,
    storeId,
    offerId,
    reason,
    details: cleanDetails,
    status: 'OPEN' as const,
    createdAt: new Date().toISOString()
  };

  db.reports.set(report.id, report);
  db.scheduleSave();
  res.status(201).json({ report });
});
