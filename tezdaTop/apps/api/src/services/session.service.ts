export const SESSION_TTL_MS = 3 * 24 * 60 * 60 * 1000;

export function sessionExpiresAt(session: { createdAt: Date | string }) {
  return new Date(session.createdAt).getTime() + SESSION_TTL_MS;
}

export function isSessionExpired(session: { createdAt: Date | string }, now = Date.now()) {
  const expiresAt = sessionExpiresAt(session);
  return !Number.isFinite(expiresAt) || now >= expiresAt;
}
