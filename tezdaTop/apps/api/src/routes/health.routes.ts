import { Router } from 'express';
import { db } from '../db/in-memory-db.js';
import { getDatabaseStatus } from '../db/supabase.js';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'YaqinTop API',
    storesCount: db.stores.size,
    offersCount: db.offers.size,
    usersCount: db.users.size,
    timestamp: new Date().toISOString()
  });
});

healthRouter.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    service: 'YaqinTop API',
    storesCount: db.stores.size,
    offersCount: db.offers.size,
    usersCount: db.users.size,
    timestamp: new Date().toISOString()
  });
});

healthRouter.get('/api/v1', (req, res) => {
  res.json({
    status: 'ok',
    service: 'YaqinTop API v1',
    storesCount: db.stores.size,
    offersCount: db.offers.size,
    usersCount: db.users.size,
    timestamp: new Date().toISOString()
  });
});

healthRouter.get('/api/v1/health/ready', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const database = await getDatabaseStatus();
  const ready = database.state !== 'unavailable';
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'unavailable',
    database,
    storesCount: db.stores.size,
    offersCount: db.offers.size
  });
});
