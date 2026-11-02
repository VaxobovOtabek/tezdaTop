import crypto from 'node:crypto';

export const SESSION_TTL_MS = 3 * 24 * 60 * 60 * 1000;
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.trim()) {
    return secret.trim();
  }
  // Safe fallback to prevent server crashes in serverless/production deployments when env var is not yet configured
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim()) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
  }
  return 'yaqintop_secure_session_secret_2026_auth_token_key_min32chars';
}

// In-memory set of revoked session tokens (survives within process; invalidates signed tokens on logout/reset)
export const revokedTokens = new Set<string>();

export function revokeToken(token: string) {
  if (token) {
    revokedTokens.add(token.trim());
  }
}

export function isTokenRevoked(token: string): boolean {
  if (!token) return true;
  return revokedTokens.has(token.trim());
}

export function sessionExpiresAt(session: { createdAt: Date | string }) {
  return new Date(session.createdAt).getTime() + SESSION_TTL_MS;
}

export function isSessionExpired(session: { createdAt: Date | string }, now = Date.now()) {
  const expiresAt = sessionExpiresAt(session);
  return !Number.isFinite(expiresAt) || now >= expiresAt;
}

export function createSignedSessionToken(userId: string, createdAt = Date.now()): string {
  const payload = `${userId}.${createdAt}`;
  const hmac = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
  return `yqt_${payload}.${hmac}`;
}

export function verifySignedSessionToken(token: string, now = Date.now()): { userId: string; createdAt: number } | null {
  if (!token || typeof token !== 'string') return null;
  if (!token.startsWith('yqt_')) return null;
  if (isTokenRevoked(token)) return null;

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
