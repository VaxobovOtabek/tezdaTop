import { describe, expect, it } from 'vitest';
import { SESSION_TTL_MS, isSessionExpired, sessionExpiresAt } from './session.service.js';

describe('three day sessions', () => {
  const createdAt = new Date('2026-10-07T00:00:00Z');
  it('remains valid before the 72 hour deadline', () => {
    expect(isSessionExpired({ createdAt }, createdAt.getTime() + SESSION_TTL_MS - 1)).toBe(false);
  });
  it('expires exactly at 72 hours and afterwards', () => {
    expect(isSessionExpired({ createdAt }, createdAt.getTime() + SESSION_TTL_MS)).toBe(true);
    expect(isSessionExpired({ createdAt }, createdAt.getTime() + SESSION_TTL_MS + 1)).toBe(true);
  });
  it('uses the original creation date after restoring persisted JSON', () => {
    const session = JSON.parse(JSON.stringify({ createdAt }));
    expect(sessionExpiresAt(session)).toBe(new Date('2026-10-10T00:00:00Z').getTime());
    expect(isSessionExpired(session, new Date('2026-10-09T00:00:00Z').getTime())).toBe(false);
  });
  it('rejects malformed timestamps', () => {
    expect(isSessionExpired({ createdAt: 'invalid' })).toBe(true);
  });
});
