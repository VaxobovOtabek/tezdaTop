import { useEffect, useState } from 'react';

const SESSION_EVENT = 'yaqintop-session-change';
const EXPIRY_KEY = 'yaqintop_session_expires_at';
const LOGGED_OUT_KEY = 'yaqintop_logged_out';
const TTL = 3 * 24 * 60 * 60 * 1000;

export function saveCachedSession(user: unknown, token: string, expiresAt?: number) {
  localStorage.removeItem(LOGGED_OUT_KEY);
  localStorage.setItem('yaqintop_user', JSON.stringify(user));
  localStorage.setItem('yaqintop_token', token);
  localStorage.setItem(EXPIRY_KEY, String(expiresAt || Date.now() + TTL));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function removeSessionCache() {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of Object.keys(storage)) {
      if (key.startsWith('yaqintop_')) storage.removeItem(key);
    }
  }
  // If logout happens offline, an old HttpOnly cookie must not restore the user.
  localStorage.setItem(LOGGED_OUT_KEY, 'true');
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export async function clearSessionCache() {
  const token = localStorage.getItem('yaqintop_token');
  // Start revocation before removing the cached token; clear the UI immediately.
  const revoke = fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : {} }).catch(() => {});
  removeSessionCache();
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('yaqintop')).map(name => caches.delete(name)));
  }
  await revoke;
}

export function useCachedSession(meUrl = '/api/v1/auth/me') {
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    let active = true;
    let revision = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleExpiry = () => {
      if (timer) clearTimeout(timer);
      const expiry = Number(localStorage.getItem(EXPIRY_KEY));
      if (!expiry) { setCurrentUser(null); return; }
      const remaining = expiry - Date.now();
      if (remaining <= 0) { setCurrentUser(null); void clearSessionCache(); return; }
      timer = setTimeout(() => { setCurrentUser(null); void clearSessionCache(); }, remaining);
    };
    const restore = async () => {
      if (localStorage.getItem(LOGGED_OUT_KEY)) { setCurrentUser(null); return; }
      const restoringRevision = revision;
      const token = localStorage.getItem('yaqintop_token');
      const expiry = Number(localStorage.getItem(EXPIRY_KEY));
      if (expiry && expiry <= Date.now()) { void clearSessionCache(); return; }
      try {
        const res = await fetch(meUrl, { credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!active || restoringRevision !== revision || token !== localStorage.getItem('yaqintop_token')) return;
        if (res.status === 401 || res.status === 403) {
          setCurrentUser(null);
          if (token || expiry) removeSessionCache();
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        if (!active || restoringRevision !== revision || !data.user || !data.expiresAt) return;
        localStorage.setItem('yaqintop_user', JSON.stringify(data.user));
        localStorage.setItem(EXPIRY_KEY, String(data.expiresAt));
        setCurrentUser(data.user);
        scheduleExpiry();
      } catch { /* A network failure does not erase a valid cached session. */ }
    };
    const changed = () => {
      revision++;
      scheduleExpiry();
      if (!localStorage.getItem(EXPIRY_KEY)) setCurrentUser(null);
    };
    const storageChanged = () => { changed(); void restore(); };
    scheduleExpiry();
    void restore();
    window.addEventListener(SESSION_EVENT, changed);
    window.addEventListener('storage', storageChanged);
    window.addEventListener('focus', scheduleExpiry);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      window.removeEventListener(SESSION_EVENT, changed);
      window.removeEventListener('storage', storageChanged);
      window.removeEventListener('focus', scheduleExpiry);
    };
  }, [meUrl]);
  return [currentUser, setCurrentUser] as const;
}
