import { createServer, request as httpRequest, type RequestOptions, type Server } from 'node:http';
import { once } from 'node:events';
import type { Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalOriginProxy } from '../src/local-origin-proxy.js';

const tunnel = vi.hoisted(() => ({ port: 0 }));
vi.mock('node:https', () => ({
  request: (_origin: URL, options: RequestOptions) =>
    httpRequest({ ...options, hostname: '127.0.0.1', port: tunnel.port }),
}));

async function listen(server: Server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return (server.address() as { port: number }).port;
}

describe('local-first API routing', () => {
  const secret = 'fake-local-shared-secret-for-routing-tests';
  let local: Server;
  let gateway: Server;
  let localReady: boolean;
  let disconnectAfterWriting: boolean;
  let writes: number;
  let fallback: ReturnType<typeof vi.fn>;
  let gatewayUrl: string;
  const client = globalThis.fetch;

  beforeEach(async () => {
    localReady = true;
    disconnectAfterWriting = false;
    writes = 0;
    local = createServer(async (req, res) => {
      if (req.headers['x-yaqintop-local-secret'] !== secret || !localReady) {
        res.writeHead(503).end();
        return;
      }
      res.setHeader('X-Yaqintop-Origin', 'local');
      if (req.url === '/api/v1/health/ready') {
        res.end('ready');
        return;
      }
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk);
      if (req.method === 'POST') writes++;
      if (disconnectAfterWriting) {
        req.socket.destroy();
        return;
      }
      res.setHeader('Set-Cookie', ['first=1', 'second=2']);
      res.end(JSON.stringify({ path: req.url, cookie: req.headers.cookie, body: Buffer.concat(chunks).toString() }));
    });
    tunnel.port = await listen(local);
    vi.stubGlobal('fetch', (url: URL, options: RequestInit) =>
      client(`http://127.0.0.1:${tunnel.port}${url.pathname}`, options));

    const proxy = createLocalOriginProxy(new URL('https://local.example'), secret);
    fallback = vi.fn();
    gateway = createServer(async (req, res) => {
      const expressResponse = Object.assign(res, {
        status(code: number) { res.statusCode = code; return this; },
        json(body: object) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); },
      });
      if (!await proxy(req as Request, expressResponse as unknown as Response)) {
        fallback(req.method);
        res.setHeader('X-Yaqintop-Origin', 'vercel');
        res.end('fallback');
      }
    });
    gatewayUrl = `http://127.0.0.1:${await listen(gateway)}`;
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await Promise.all([local, gateway].map(server => new Promise<void>(resolve => server.close(() => resolve()))));
  });

  function call(path: string, options?: RequestInit) {
    return client(gatewayUrl + path, options);
  }

  it('forwards the URL, body and cookies and returns both session cookies', async () => {
    const response = await call('/api/v1/auth/login?next=1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: 'session=old' },
      body: '{"login":"example"}',
    });
    expect(response.headers.get('X-Yaqintop-Origin')).toBe('local');
    expect(response.headers.getSetCookie()).toEqual(['first=1', 'second=2']);
    expect(await response.json()).toEqual({ path: '/api/v1/auth/login?next=1', cookie: 'session=old', body: '{"login":"example"}' });
    expect(writes).toBe(1);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('routes straight to Vercel when the local origin is unavailable', async () => {
    localReady = false;
    const response = await call('/api/v1/auth/login', { method: 'POST', body: 'sample' });
    expect(response.headers.get('X-Yaqintop-Origin')).toBe('vercel');
    expect(await response.text()).toBe('fallback');
    expect(writes).toBe(0);
  });

  it('does not replay a write that may have succeeded and sends later requests to Vercel', async () => {
    disconnectAfterWriting = true;
    const write = await call('/api/v1/merchant', { method: 'POST', body: 'sample' });
    expect(write.status).toBe(503);
    expect(await write.json()).toMatchObject({ code: 'LOCAL_API_UNAVAILABLE' });
    expect(writes).toBe(1);
    expect(fallback).not.toHaveBeenCalled();

    const read = await call('/api/v1/stores');
    expect(read.headers.get('X-Yaqintop-Origin')).toBe('vercel');
    expect(await read.text()).toBe('fallback');
  });
});
