import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hook = vi.hoisted(() => ({ cleanups: [] as (() => void)[], setUser: vi.fn() }));
vi.mock('../../../packages/ui/node_modules/react/index.js', () => ({
  useState: (initial: unknown) => [initial, hook.setUser],
  useEffect: (effect: () => (() => void)) => { hook.cleanups.push(effect()); }
}));
import { clearSessionCache, saveCachedSession, useCachedSession } from '../../../packages/ui/src/auth-session';

function storage() {
  const values: Record<string, string> = {};
  Object.defineProperties(values, {
    getItem: { value: (key: string) => values[key] ?? null },
    setItem: { value: (key: string, value: string) => { values[key] = String(value); } },
    removeItem: { value: (key: string) => { delete values[key]; } }
  });
  return values as unknown as Storage;
}
const ttl = 3 * 24 * 60 * 60 * 1000;
const user = { id: 'test-user', fullName: 'Test', role: 'OWNER' };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-07T00:00:00Z'));
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('localStorage', storage());
  vi.stubGlobal('sessionStorage', storage());
  vi.stubGlobal('fetch', vi.fn());
  hook.setUser.mockClear();
});
afterEach(() => {
  hook.cleanups.splice(0).forEach(cleanup => cleanup());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('cached login', () => {
  it('restores a verified session after F5 without extending its original deadline', async () => {
    const deadline = Date.now() + ttl;
    saveCachedSession(user, 'test-token', deadline);
    vi.setSystemTime(Date.now() + 24 * 60 * 60 * 1000);
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200, json: async () => ({ user, expiresAt: deadline }) } as Response);
    useCachedSession();
    await vi.advanceTimersByTimeAsync(0);
    expect(hook.setUser).toHaveBeenCalledWith(user);
    expect(Number(localStorage.getItem('yaqintop_session_expires_at'))).toBe(deadline);
  });
  it('clears cache and logs out at the original three day deadline while the page stays open', async () => {
    const deadline = Date.now() + ttl;
    saveCachedSession(user, 'test-token', deadline);
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200, json: async () => ({ user, expiresAt: deadline }) } as Response);
    useCachedSession();
    await vi.advanceTimersByTimeAsync(ttl);
    expect(localStorage.getItem('yaqintop_token')).toBeNull();
    expect(hook.setUser).toHaveBeenLastCalledWith(null);
    expect(fetch).toHaveBeenCalledWith('/api/v1/auth/logout', expect.objectContaining({ method: 'POST' }));
  });
  it('clears only application cache and revokes the session when logout is clicked', async () => {
    saveCachedSession(user, 'test-token', Date.now() + ttl);
    localStorage.setItem('unrelated-setting', 'keep');
    sessionStorage.setItem('yaqintop_cached_data', 'remove');
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    await clearSessionCache();
    expect(localStorage.getItem('yaqintop_token')).toBeNull();
    expect(sessionStorage.getItem('yaqintop_cached_data')).toBeNull();
    expect(localStorage.getItem('unrelated-setting')).toBe('keep');
    expect(fetch).toHaveBeenCalledWith('/api/v1/auth/logout', expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }));
  });
  it('does not restore a cached user when the server rejects their session', async () => {
    saveCachedSession(user, 'test-token', Date.now() + ttl);
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 401 } as Response);
    useCachedSession();
    await vi.advanceTimersByTimeAsync(0);
    expect(hook.setUser).not.toHaveBeenCalledWith(user);
    expect(localStorage.getItem('yaqintop_user')).toBeNull();
  });
  it('stays logged out after F5 even when the logout request failed offline', async () => {
    saveCachedSession(user, 'test-token', Date.now() + ttl);
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    await clearSessionCache();
    vi.mocked(fetch).mockClear();
    useCachedSession();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).not.toHaveBeenCalled();
    expect(hook.setUser).toHaveBeenLastCalledWith(null);
    saveCachedSession(user, 'new-login-token', Date.now() + ttl);
    expect(localStorage.getItem('yaqintop_logged_out')).toBeNull();
  });
});
