import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/in-memory-db.js';
import { SearchQuerySchema } from '@yaqintop/contracts';
import { searchProducts, getMarkers } from '../services/search.service.js';
import { getCurrentUser } from '../middleware/auth.middleware.js';

export interface SearchLogEntry {
  id: string;
  query: string;
  userType: 'CUSTOMER' | 'GUEST';
  userName: string;
  locationName: string;
  radiusM: number;
  resultsCount: number;
  timestamp: string;
}

export function getSearchLogs(): SearchLogEntry[] {
  return [...db.searchEvents.values()].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}

export function recordSearchLog(entry: SearchLogEntry) {
  db.searchEvents.set(entry.id, entry);
  if (db.searchEvents.size > 1000) {
    const oldest = getSearchLogs().at(-1);
    if (oldest) db.searchEvents.delete(oldest.id);
  }
}

export const searchRouter = Router();

searchRouter.get('/markers', (req, res) => {
  try {
    const q = req.query.q as string | undefined;
    const lat = parseFloat((req.query.lat as string) || '41.311081');
    const lng = parseFloat((req.query.lng as string) || '69.240562');
    const radiusM = parseInt((req.query.radiusM as string) || '1000', 10);

    const markers = getMarkers({ q, lat, lng, radiusM, limit: 50, sort: 'relevance' });
    res.json({ markers });
  } catch (err: any) {
    res.status(400).json({ code: 'MARKER_ERROR', message: err.message });
  }
});

searchRouter.post('/products', (req, res) => {
  try {
    const user = getCurrentUser(req);
    const parsed = SearchQuerySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: 'INVALID_QUERY', message: parsed.error.issues[0].message });
      return;
    }
    const result = searchProducts(parsed.data);

    if (parsed.data.q && parsed.data.q.trim()) {
      recordSearchLog({
        id: uuidv4(),
        query: parsed.data.q.trim(),
        userType: user ? 'CUSTOMER' : 'GUEST',
        userName: user ? user.fullName : `Mehmon foydalanuvchi #${Math.floor(100 + Math.random() * 900)}`,
        locationName: 'Toshkent shahri (Pilot)',
        radiusM: parsed.data.radiusM || 1000,
        resultsCount: result.totalOffers || result.items.length,
        timestamp: new Date().toISOString()
      });
    }

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ code: 'SEARCH_ERROR', message: err.message });
  }
});

searchRouter.get('/products', (req, res) => {
  try {
    const q = req.query.q as string | undefined;
    const lat = parseFloat((req.query.lat as string) || '41.311081');
    const lng = parseFloat((req.query.lng as string) || '69.240562');
    const radiusM = parseInt((req.query.radiusM as string) || '1000', 10);
    const openNow = req.query.openNow === 'true';
    const inStock = req.query.inStock === 'true';
    const freshOnly = req.query.freshOnly === 'true';
    const sort = (req.query.sort as any) || 'relevance';
    const minQuantity = req.query.minQuantity ? parseInt(req.query.minQuantity as string, 10) : undefined;

    const result = searchProducts({
      q,
      lat,
      lng,
      radiusM,
      openNow,
      inStock,
      freshOnly,
      sort,
      minQuantity,
      limit: 20
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ code: 'SEARCH_ERROR', message: err.message });
  }
});
