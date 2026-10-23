import crypto from 'node:crypto';

export const SESSION_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'yaqintop_secure_session_secret_2026_key';

export function sessionExpiresAt(session: { createdAt: Date | string }) {
  return new Date(session.createdAt).getTime() + SESSION_TTL_MS;
}

export function isSessionExpired(session: { createdAt: Date | string }, now = Date.now()) {
  const expiresAt = sessionExpiresAt(session);
  return !Number.isFinite(expiresAt) || now >= expiresAt;
}

export function createSignedSessionToken(userId: string, createdAt = Date.now()): string {
  const payload = `${userId}.${createdAt}`;
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `yqt_${payload}.${hmac}`;
}

export function verifySignedSessionToken(token: string, now = Date.now()): { userId: string; createdAt: number } | null {
  if (!token || typeof token !== 'string') return null;
  if (!token.startsWith('yqt_')) return null;

  const raw = token.slice(4);
  const lastDot = raw.lastIndexOf('.');
  if (lastDot === -1) return null;

  const payload = raw.slice(0, lastDot);
  const signature = raw.slice(lastDot + 1);

  const parts = payload.split('.');
  if (parts.length !== 2) return null;

  const [userId, createdAtStr] = parts;
  const createdAt = Number(createdAtStr);
  if (!userId || !Number.isFinite(createdAt)) return null;

  // Check TTL (3 days)
  if (now - createdAt >= SESSION_TTL_MS) return null;

  // Verify HMAC signature
  const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expectedHmac);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return { userId, createdAt };
}
