import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import dotenv from 'dotenv';

// Local credentials only; never return them to the browser.
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true } as any);
dotenv.config({ path: path.resolve(process.cwd(), '../../.env'), quiet: true } as any);

export type UsagePeriod = 'day' | 'week' | 'month';
type Sample = { timestamp: string; total_rest_requests: number };
type History = { projectRef: string; samples: Sample[]; database?: { bytes: number; at: string } };
const DAY = 86_400_000;
type Cache = { at: number; data: History; issue: string | null };
let cached: Cache | null = null;
let pending: Promise<Cache> | null = null;

function configuration() {
  const url = process.env.SUPABASE_URL || process.env.DATABASE_SUPPABASE_URL || '';
  const ref = process.env.SUPABASE_PROJECT_REF || (url ? new URL(url).hostname.split('.')[0] : '');
  if (!/^[a-z]{20}$/.test(ref)) throw new Error('Supabase loyiha manzili sozlanmagan.');
  const directory = process.env.VERCEL ? path.join(os.tmpdir(), 'yaqintop-usage') : path.resolve(process.cwd(), '.local/supabase-usage');
  return { ref, file: path.join(directory, `${ref}.json`), token: process.env.SUPABASE_ACCESS_TOKEN };
}

async function management(ref: string, token: string, endpoint: string, body?: object) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/${endpoint}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(12_000)
  });
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403
    ? 'Supabase monitoring tokeni yoki uning ruxsatlarini tekshiring.'
    : response.status === 429 ? 'Supabase so‘rov limiti. Birozdan keyin yangilang.' : 'Supabase monitoring ma’lumoti olinmadi.');
  const result = await response.json() as any;
  if (result.error) throw new Error('Supabase statistikasi hozir mavjud emas.');
  return result;
}

async function refresh() {
  const { ref, file, token } = configuration();
  let history: History = { projectRef: ref, samples: [] };
  try {
    const saved = JSON.parse(await readFile(file, 'utf8')) as History;
    if (saved.projectRef === ref && Array.isArray(saved.samples)) history = saved;
  } catch { /* No local history yet. */ }
  let issue: string | null = token ? null : 'Jonli monitoringni ulash uchun backendning lokal .env fayliga SUPABASE_ACCESS_TOKEN kiriting.';
  if (token) {
    const results = await Promise.allSettled([
      management(ref, token, 'analytics/endpoints/usage.api-counts?interval=7day'),
      management(ref, token, 'database/query/read-only', { query: 'select pg_catalog.pg_database_size(pg_catalog.current_database())::text as database_bytes;' })
    ]);
    if (results[0].status === 'fulfilled') {
      const series = results[0].value.result;
      if (!Array.isArray(series)) issue = 'Supabase so‘rovlar statistikasi formatini tekshirish kerak.';
      else {
        const merged = new Map(history.samples.map(sample => [sample.timestamp, sample]));
        for (const sample of series) {
          if (Number.isFinite(Date.parse(sample.timestamp)) && typeof sample.total_rest_requests === 'number' && sample.total_rest_requests >= 0) {
            const timestamp = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(sample.timestamp) ? sample.timestamp : `${sample.timestamp}Z`).toISOString();
            merged.set(timestamp, { timestamp, total_rest_requests: sample.total_rest_requests });
          }
        }
        history.samples = [...merged.values()].filter(sample => Date.parse(sample.timestamp) >= Date.now() - 32 * DAY).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
      }
    } else issue = results[0].reason instanceof Error ? results[0].reason.message : 'So‘rovlar statistikasi olinmadi.';
    if (results[1].status === 'fulfilled') {
      const rows = results[1].value;
      const bytes = Number((Array.isArray(rows) ? rows[0] : rows.result?.[0])?.database_bytes);
      if (Number.isFinite(bytes) && bytes > 0) history.database = { bytes, at: new Date().toISOString() };
      else issue = 'Baza hajmi javobi olinmadi.';
    } else issue = issue || 'Baza hajmi yangilanmadi. Tokenning database:read ruxsatini tekshiring.';
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(`${file}.tmp`, JSON.stringify(history), 'utf8');
    await rename(`${file}.tmp`, file);
  }
  return { at: Date.now(), data: history, issue };
}

export async function getSupabaseUsage(period: UsagePeriod) {
  if (!cached || Date.now() - cached.at >= 60_000) {
    if (!pending) pending = refresh().then(value => (cached = value)).finally(() => { pending = null; });
    await pending;
  }
  const state = cached!;
  const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
  const start = Date.now() - days * DAY;
  const samples = state.data.samples.filter(sample => Date.parse(sample.timestamp) >= start);
  const limit = Number(process.env.SUPABASE_DATABASE_LIMIT_MB);
  const databaseLimit = Number.isFinite(limit) && limit > 0 ? limit * 1024 * 1024 : null;
  return {
    projectRef: state.data.projectRef, period, days, issue: state.issue,
    plan: process.env.SUPABASE_USAGE_PLAN || null,
    database: state.data.database ? { ...state.data.database, limitBytes: databaseLimit } : null,
    requests: samples.length ? {
      total: samples.reduce((sum, item) => sum + item.total_rest_requests, 0),
      from: samples[0].timestamp, to: samples[samples.length - 1].timestamp,
      // An incomplete history is never presented as a full monthly total.
      partial: Date.parse(state.data.samples[0].timestamp) > start + 3_600_000,
      samples
    } : null,
    updatedAt: new Date(state.at).toISOString(),
    dashboardUrl: `https://supabase.com/dashboard/project/${state.data.projectRef}`
  };
}
