import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, ExternalLink, Activity, AlertTriangle } from 'lucide-react';

type Period = 'day' | 'week' | 'month';
interface Usage {
  projectRef: string; plan: string | null; days: number; issue: string | null; dashboardUrl: string;
  database: { bytes: number; at: string; limitBytes: number | null } | null;
  requests: { total: number; from: string; to: string; partial: boolean; samples: { timestamp: string; total_rest_requests: number }[] } | null;
}
const number = (value: number) => value.toLocaleString('uz-UZ');
const size = (bytes: number) => `${number(Math.round(bytes / 1024 / 1024 * 100) / 100)} MB`;
const date = (value: string) => new Date(value).toLocaleString('uz-UZ');

export function SupabaseUsagePanel() {
  const [period, setPeriod] = useState<Period>('day');
  const [data, setData] = useState<Usage | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError('');
      try {
        const token = localStorage.getItem('yaqintop_token');
        const response = await fetch(`/api/v1/admin/supabase-usage?period=${period}`, {
          credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: controller.signal
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Monitoring ma’lumoti olinmadi.');
        if (!controller.signal.aborted) setData(result);
      } catch (err) {
        if (!controller.signal.aborted) { setData(null); setError(err instanceof Error ? err.message : 'Server bilan ulanish xatosi.'); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    const timer = setInterval(load, 60_000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [period, refresh]);
  const db = data?.database;
  const ratio = db?.limitBytes ? db.bytes / db.limitBytes * 100 : null;
  const card = 'bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-5';
  const muted = 'text-[#566A63] dark:text-[#8B9E95]';
  const peak = Math.max(1, ...(data?.requests?.samples.map(item => item.total_rest_requests) || []));
  return <section className="space-y-5 text-[#172C28] dark:text-white">
    <div className="flex flex-wrap justify-between items-start gap-4">
      <div><h2 className="text-2xl font-bold flex items-center gap-2"><Database className="w-6 h-6" /> Supabase limitlari</h2>
        <p className={`text-sm mt-1 ${muted}`}>Baza sig‘imi va loyihaning bazaga so‘rovlari.</p></div>
      <button onClick={() => setRefresh(value => value + 1)} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#DCE5DF] dark:border-[#22332C] disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Yangilash</button>
    </div>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Statistika davri">
      {([['day', 'Kunlik · 24 soat'], ['week', 'Haftalik · 7 kun'], ['month', 'Oylik · 30 kun']] as const).map(([value, label]) =>
        <button key={value} aria-pressed={period === value} onClick={() => { if (value !== period) { setData(null); setPeriod(value); } }} className={`px-4 py-2 rounded-xl text-sm font-semibold ${period === value ? 'bg-[#116B50] text-white' : 'bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C]'}`}>{label}</button>)}
    </div>
    {error && <div role="alert" className="p-4 rounded-xl bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200">{error}</div>}
    {data?.issue && <div role="status" className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-sm"><AlertTriangle className="w-5 h-5 shrink-0" />{data.issue}</div>}
    {loading && !data && !error && <p role="status" className={muted}>Ko‘rsatkichlar yuklanmoqda…</p>}
    {data && <>
      <div className="grid md:grid-cols-2 gap-4">
        <article className={card}>
          <h3 className="font-bold flex items-center gap-2"><Database className="w-4 h-4" /> Baza hajmi {data.plan && <span className={`ml-auto text-xs uppercase ${muted}`}>{data.plan}</span>}</h3>
          <p className="text-3xl font-bold mt-5">{db ? size(db.bytes) : 'Ma’lumot yo‘q'}</p>
          <p className={`text-sm mt-1 ${muted}`}>{db?.limitBytes ? `${size(db.limitBytes)} limitdan foydalanilgan` : 'Hajm limiti sozlanmagan'}</p>
          {ratio !== null && <><div role="progressbar" aria-label="Baza limiti ishlatilishi" aria-valuenow={Math.min(100, Math.round(ratio))} aria-valuemin={0} aria-valuemax={100} className="h-2 mt-4 rounded-full bg-[#E0EFE7] dark:bg-[#22332C] overflow-hidden"><div className={`h-full ${ratio >= 80 ? 'bg-amber-500' : 'bg-[#116B50]'}`} style={{ width: `${Math.min(ratio, 100)}%` }} /></div>
            <p className={`text-sm mt-2 ${muted}`}>{number(Math.round(ratio * 100) / 100)}% ishlatilgan · {size(Math.max(0, db!.limitBytes! - db!.bytes))} qolgan</p></>}
          <p className={`text-xs mt-4 ${muted}`}>{db ? `Oxirgi o‘lchov: ${date(db.at)}` : 'Baza hajmi o‘lchovi hali olinmagan.'}</p>
          <p className={`text-xs mt-2 ${muted}`}>Baza limiti joriy hajmga tegishli; kun yoki oy boshida tiklanmaydi.</p>
        </article>
        <article className={card}>
          <h3 className="font-bold flex items-center gap-2"><Activity className="w-4 h-4" /> Bazaga API so‘rovlari</h3>
          <p className="text-3xl font-bold mt-5">{data.requests ? number(data.requests.total) : 'Ma’lumot yo‘q'}</p>
          <p className={`text-sm mt-1 ${muted}`}>Oxirgi {data.days} kun · REST API</p>
          <p className={`text-sm mt-4 ${muted}`}>{data.requests?.partial ? 'Qisman tarix: butun davrning jami emas.' : data.requests ? 'Supabase statistikasi asosida.' : 'Supabase statistikasi ulangandan keyin ko‘rinadi.'}</p>
          {data.requests && <p className={`text-xs mt-2 ${muted}`}>{date(data.requests.from)} — {date(data.requests.to)}</p>}
          <p className={`text-xs mt-4 ${muted}`}>So‘rovlar soni trafik hajmi yoki billing limiti o‘rnida hisoblanmaydi.</p>
        </article>
      </div>
      {data.requests && <article className={card}><h3 className="font-bold mb-4">So‘rovlar dinamikasi</h3>
        <div className="h-32 flex items-end gap-1 overflow-x-auto" aria-label="API so‘rovlari dinamikasi">
          {data.requests.samples.map(item => <div key={item.timestamp} title={`${date(item.timestamp)}: ${number(item.total_rest_requests)} so‘rov`} className="bg-[#116B50] dark:bg-[#4ADE80] rounded-t flex-1 min-w-1" style={{ height: `${Math.max(2, item.total_rest_requests / peak * 100)}%` }} />)}
        </div>
      </article>}
      <div className={`text-sm flex flex-wrap items-center justify-between gap-3 ${muted}`}><span>Har 60 soniyada yangilanadi. Oylik tarix lokal kompyuterda yig‘iladi.</span>
        <a href={data.dashboardUrl} target="_blank" rel="noreferrer" className="text-[#116B50] dark:text-[#4ADE80] inline-flex items-center gap-1">Supabase hisoboti <ExternalLink className="w-4 h-4" /></a></div>
      <p className={`text-xs ${muted}`}>Trafik (egress) limiti tashkilotning billing davriga bog‘liq. Uning aniq foydalanishi Supabase hisobotida ko‘rinadi.</p>
    </>}
  </section>;
}
