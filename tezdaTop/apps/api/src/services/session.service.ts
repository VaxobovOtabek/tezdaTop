import crypto from 'node:crypto';
import { db } from '../db/in-memory-db.js';

const developmentSecret = crypto.randomBytes(48).toString('hex');

export const SESSION_TTL_MS = 3 * 24 * 60 * 60 * 1000;
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.trim()) {
    if (process.env.NODE_ENV === 'production' && secret.trim().length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters');
    return secret.trim();
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey && serviceKey.length >= 32) {
    // A separate, deterministic signing key avoids production downtime when a
    // deployment already has its backend service key but no SESSION_SECRET yet.
    return crypto.createHmac('sha256', serviceKey).update('yaqintop/session-signing/v2').digest('hex');
  }
  if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET must be configured');
  return developmentSecret;
}

// In-memory set of revoked session tokens (survives within process; invalidates signed tokens on logout/reset)
export const revokedTokens = new Set<string>();

export function revokeToken(token: string) {
  if (token) {
    db.revocations.set(crypto.createHash('sha256').update(token.trim()).digest('hex'), Date.now() + SESSION_TTL_MS);
  }
}

export function isTokenRevoked(token: string): boolean {
  if (!token) return true;
  const now = Date.now();
  for (const [key, expiry] of db.revocations) if (expiry <= now) db.revocations.delete(key);
  return revokedTokens.has(token.trim()) || db.revocations.has(crypto.createHash('sha256').update(token.trim()).digest('hex'));
}

export function revokeUserSessions(userId: string) {
  const user = db.users.get(userId) as any;
  if (user) user.tokenVersion = (user.tokenVersion || 0) + 1;
  for (const [token, session] of db.sessions) {
    if (session.userId === userId) { revokeToken(token); db.sessions.delete(token); }
  }
}

export function sessionExpiresAt(session: { createdAt: Date | string }) {
  return new Date(session.createdAt).getTime() + SESSION_TTL_MS;
}

export function isSessionExpired(session: { createdAt: Date | string }, now = Date.now()) {
  const expiresAt = sessionExpiresAt(session);
  return !Number.isFinite(expiresAt) || now >= expiresAt;
}

export function createSignedSessionToken(userId: string, createdAt = Date.now()): string {
  const payload = `${userId}.${createdAt}.${(db.users.get(userId) as any)?.tokenVersion || 0}.${crypto.randomBytes(16).toString('hex')}`;
  const hmac = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
  return `yqt_${payload}.${hmac}`;
}

export function verifySignedSessionToken(token: string, now = Date.now(), persistedState?: { tokenVersion: number; revoked: boolean }): { userId: string; createdAt: number } | null {
  if (!token || typeof token !== 'string') return null;
  if (!token.startsWith('yqt_')) return null;
  if (persistedState ? persistedState.revoked : isTokenRevoked(token)) return null;

  const raw = token.slice(4);
  const lastDot = raw.lastIndexOf('.');
  if (lastDot === -1) return null;

  const payload = raw.slice(0, lastDot);
  const signature = raw.slice(lastDot + 1);

  const parts = payload.split('.');
  if (parts.length !== 4) return null;

  const [userId, createdAtStr] = parts;
  const createdAt = Number(createdAtStr);
  if (!userId || !Number.isFinite(createdAt)) return null;
  if (createdAt > now + 30_000) return null;
  if (Number(parts[2]) !== (persistedState?.tokenVersion ?? ((db.users.get(userId) as any)?.tokenVersion || 0))) return null;

  // Check TTL (3 days)
  if (now - createdAt >= SESSION_TTL_MS) return null;

  // Verify HMAC signature
  const expectedHmac = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expectedHmac);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return { userId, createdAt };
}
