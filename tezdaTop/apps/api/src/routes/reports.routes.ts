import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/in-memory-db.js';
import { getCurrentUser } from '../middleware/auth.middleware.js';

export const reportsRouter = Router();

reportsRouter.post('/', (req, res) => {
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
