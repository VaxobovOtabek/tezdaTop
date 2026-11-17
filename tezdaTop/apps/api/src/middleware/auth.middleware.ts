import { Request, Response, NextFunction } from 'express';
import { db } from '../db/in-memory-db.js';
import {
  isSessionExpired,
  verifySignedSessionToken,
  isTokenRevoked
} from '../services/session.service.js';

export function getCurrentUser(req: Request) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader?.trim();
  const cookieToken = req.cookies?.session_token?.trim();
  const token = bearerToken || cookieToken;
  if (!token) {
    return null;
  }
  if (process.env.NODE_ENV !== 'test' && !verifySignedSessionToken(token)) return null;
  if (isTokenRevoked(token)) return null;

  // 1. In-memory session Map check
  const session = db.sessions.get(token);
  if (session) {
    if (isSessionExpired(session)) {
      db.sessions.delete(token);
      db.scheduleSave();
      return null;
    }
    const user = db.users.get(session.userId);
    if (user && user.status === 'ACTIVE') return user;
  }

  // 2. Stateless / serverless signed token verification (cross-container resilient)
  const verified = verifySignedSessionToken(token);
  if (verified) {
    const user = db.users.get(verified.userId);
    if (user && user.status === 'ACTIVE') {
      db.sessions.set(token, { userId: verified.userId, createdAt: new Date(verified.createdAt) });
      return user;
    }
  }

  // 3. Also check cookieToken if bearerToken was checked first and was different
  if (bearerToken && cookieToken && bearerToken !== cookieToken && !isTokenRevoked(cookieToken)) {
    const cookieVerified = verifySignedSessionToken(cookieToken);
    if (cookieVerified) {
      const user = db.users.get(cookieVerified.userId);
      if (user && user.status === 'ACTIVE') return user;
    }
  }

  return null;
}

export function requireStaffRole(allowedRoles: ('ADMIN' | 'SUPERADMIN' | 'MODERATOR')[] = ['ADMIN', 'SUPERADMIN', 'MODERATOR']) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getCurrentUser(req);
    if (!user || user.status === 'SUSPENDED') {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
      return;
    }
    if (!allowedRoles.includes(user.role as any)) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Ushbu amalni bajarish uchun yetarli ruxsat yo‘q' });
      return;
    }
    res.locals.user = user;
    next();
  };
}
