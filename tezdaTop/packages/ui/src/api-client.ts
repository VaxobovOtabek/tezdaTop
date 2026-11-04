/** The browser cookie may be scoped to a different portal/proxy host. */
export function getSessionToken(): string {
  try { return localStorage.getItem('yaqintop_token') || localStorage.getItem('yaqintop_session_token') || ''; }
  catch { return ''; }
}

/** Attach the session only to our same-origin API, never to arbitrary explorer URLs. */
export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const request = typeof Request !== 'undefined' && input instanceof Request ? input : null;
  const headers = new Headers(request?.headers);
  new Headers(init.headers).forEach((value, name) => headers.set(name, value));
  const base = typeof window === 'undefined' ? 'http://localhost/' : window.location.href;
  const url = new URL(request?.url || String(input), base);
  const isOwnApi = url.origin === new URL(base).origin && url.pathname.startsWith('/api/');
  if (isOwnApi && !headers.has('Authorization')) {
    const token = getSessionToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  const hasBody = init.body !== undefined && init.body !== null;
  if (hasBody && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(input, { ...init, headers, ...(isOwnApi ? { credentials: init.credentials ?? request?.credentials ?? 'include' } : {}) }).then(response => {
    const method = (init.method || request?.method || 'GET').toUpperCase();
    if (isOwnApi && response.ok && !['GET','HEAD','OPTIONS'].includes(method) && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      const event = new Event('yaqintop-api-mutation');
      Object.defineProperty(event, 'detail', { value: { path: url.pathname } });
      window.dispatchEvent(event);
    }
    return response;
  });
}

export class ApiRequestError extends Error {
  constructor(message: string, public readonly status: number) { super(message); this.name = 'ApiRequestError'; }
}

export async function apiJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(url, init);
  let body: any;
  try { body = await response.json(); }
  catch { throw new ApiRequestError('API javobi JSON formatida emas. Ulanish sozlamalarini tekshiring.', response.status); }
  if (!response.ok) throw new ApiRequestError(body?.message || `So‘rov bajarilmadi (${response.status}).`, response.status);
  return body as T;
}

/** Independent sections must remain available when another section fails. */
export async function loadApiResources<T extends Record<string, string>>(resources: T, signal?: AbortSignal) {
  const keys = Object.keys(resources) as (keyof T)[];
  const results = await Promise.allSettled(keys.map(key => apiJson(resources[key], { signal })));
  const data: Partial<Record<keyof T, any>> = {};
  const errors: { resource: keyof T; message: string; status?: number }[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') data[keys[index]] = result.value;
    else if (result.reason?.name !== 'AbortError') errors.push({ resource: keys[index], message: result.reason?.message || 'Server bilan aloqa uzildi.', status: result.reason?.status });
  });
  return { data, errors };
}
