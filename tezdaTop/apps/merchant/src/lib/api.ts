export function getMerchantAuthHeaders(customHeaders: HeadersInit = {}): Headers {
  const headers = new Headers(customHeaders);
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('yaqintop_token') || localStorage.getItem('yaqintop_session_token') || '')
    : '';
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

export function merchantFetch(url: string | URL | Request, init: RequestInit = {}): Promise<Response> {
  const headers = getMerchantAuthHeaders(init.headers);
  return fetch(url, {
    ...init,
    headers,
    credentials: init.credentials || 'include'
  });
}
