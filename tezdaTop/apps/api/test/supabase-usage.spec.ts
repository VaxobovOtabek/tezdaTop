import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

let directory: string;
afterEach(async () => {
  vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); vi.restoreAllMocks();
  if (directory) await rm(directory, { recursive: true, force: true });
});
async function setup() {
  directory = await mkdtemp(path.join(os.tmpdir(), 'yaqintop-monitor-test-'));
  vi.spyOn(process, 'cwd').mockReturnValue(directory);
  vi.stubEnv('SUPABASE_PROJECT_REF', 'abcdefghijklmnopqrst');
  vi.stubEnv('SUPABASE_ACCESS_TOKEN', 'test-token');
  vi.stubEnv('SUPABASE_DATABASE_LIMIT_MB', '500');
  vi.stubEnv('VERCEL', '');
  return import('../src/services/supabase-usage.service.js');
}
describe('Supabase monitoring', () => {
  it('filters period boundaries, preserves missing monthly history and deduplicates refreshes', async () => {
    const { getSupabaseUsage } = await setup();
    const now = Date.now();
    const samples = [
      { timestamp: new Date(now - 2 * 86_400_000).toISOString(), total_rest_requests: 7 },
      { timestamp: new Date(now - 3_600_000).toISOString(), total_rest_requests: 5 },
    ];
    const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify(url.includes('read-only')
      ? [{ database_bytes: '10485760' }] : { result: samples }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const day = await getSupabaseUsage('day');
    expect(day.requests?.total).toBe(5);
    const month = await getSupabaseUsage('month');
    expect(month.requests?.total).toBe(12);
    expect(month.requests?.partial).toBe(true);
    expect(month.database?.limitBytes).toBe(500 * 1024 * 1024);
    expect(JSON.stringify(month)).not.toContain('test-token');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('does not present missing credentials as zero usage or make remote requests', async () => {
    const { getSupabaseUsage } = await setup();
    vi.stubEnv('SUPABASE_ACCESS_TOKEN', '');
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    const data = await getSupabaseUsage('week');
    expect(data.requests).toBeNull();
    expect(data.database).toBeNull();
    expect(data.issue).toContain('SUPABASE_ACCESS_TOKEN');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('sanitizes upstream authorization failures', async () => {
    const { getSupabaseUsage } = await setup();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('private upstream details', { status: 403 })));
    const data = await getSupabaseUsage('day');
    expect(data.requests).toBeNull();
    expect(data.issue).toContain('ruxsatlarini');
    expect(JSON.stringify(data)).not.toContain('private upstream details');
  });
});
