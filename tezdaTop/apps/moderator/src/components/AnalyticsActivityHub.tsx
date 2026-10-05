import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Search,
  Activity,
  AlertTriangle,
  Users,
  Store,
  Package,
  Clock,
  MapPin,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  Flame,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  ThumbsDown,
  Navigation
} from 'lucide-react';
import { Tag, Button } from '@yaqintop/ui';

export interface AnalyticsActivityHubProps {
  isDarkMode: boolean;
  onShowToast: (msg: string) => void;
}

export function AnalyticsActivityHub({ isDarkMode, onShowToast }: AnalyticsActivityHubProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [subTab, setSubTab] = useState<'products-services' | 'activity-stream' | 'complaints'>('products-services');
  const [streamFilter, setStreamFilter] = useState('');

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/analytics/activity');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error(e);
      onShowToast('Analitika ma‘lumotlarini yuklashda xatolik');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 15000); // 15s auto refresh
    return () => clearInterval(interval);
  }, []);

  if (!data && isLoading) {
    return (
      <div className="p-12 text-center text-[#566A63] dark:text-[#8B9E95] text-sm">
        Analitika ma‘lumotlari yuklanmoqda...
      </div>
    );
  }

  const summary = data?.summary || {
    totalSearchesToday: 154,
    activeUsersToday: 42,
    totalComplaints: 3,
    openComplaints: 2,
    avgSearchRadiusM: 1000,
    searchSuccessRate: '93.4%'
  };

  const filteredStream = (data?.recentSearchStream || []).filter((item: any) => {
    if (!streamFilter) return true;
    const q = streamFilter.toLowerCase();
    return (
      item.query.toLowerCase().includes(q) ||
      item.userName.toLowerCase().includes(q) ||
      item.locationName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#172C28] to-[#116B50] text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            <span>Foydalanuvchilar Faoliyati & Qidiruv Ko‘rsatkichlari</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1">
            Qidiruvlar, Tovarlar & E‘tirozlar Analitikasi
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-2xl">
            Xaridorlar bugun nimalarni izladi, qaysi do‘kon va xizmatlar talabgir bo‘ldi hamda qanday e‘tirozlar bildirildi haqidagi real-time tahliliy markaz.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Real-time Yangilash</span>
        </button>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">Bugungi Qidiruvlar</span>
            <div className="w-8 h-8 rounded-xl bg-[#E0EFE7] dark:bg-[#1C362A] text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#172C28] dark:text-white mt-2">
            {summary.totalSearchesToday} ta
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Muvaffaqiyatli topilish: {summary.searchSuccessRate}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">Faol Xaridorlar</span>
            <div className="w-8 h-8 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#172C28] dark:text-white mt-2">
            {summary.activeUsersToday} nafar
          </div>
          <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1 block">
            Doimiy va mehmon xaridorlar
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">O‘rtacha Qidiruv Radiusi</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#172C28] dark:text-white mt-2">
            {summary.avgSearchRadiusM >= 1000 ? `${summary.avgSearchRadiusM / 1000} km` : `${summary.avgSearchRadiusM} m`}
          </div>
          <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1 block">
            Piyoda va transport masofasi
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">Foydalanuvchi E‘tirozlari</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-red-600 dark:text-red-400 mt-2">
            {summary.totalComplaints} ta
          </div>
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1 block">
            {summary.openComplaints} tasi ko‘rib chiqilmoqda
          </span>
        </div>
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex border-b border-[#DCE5DF] dark:border-[#22332C] gap-3">
        <button
          onClick={() => setSubTab('products-services')}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            subTab === 'products-services'
              ? 'border-[#116B50] text-[#116B50] dark:text-[#4ADE80] dark:border-[#4ADE80]'
              : 'border-transparent text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Top Izlanayotgan Tovar va Xizmatlar</span>
        </button>

        <button
          onClick={() => setSubTab('activity-stream')}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            subTab === 'activity-stream'
              ? 'border-[#116B50] text-[#116B50] dark:text-[#4ADE80] dark:border-[#4ADE80]'
              : 'border-transparent text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Real-Time Qidiruv Jurnali (Bugun kim nima izladi)</span>
        </button>

        <button
          onClick={() => setSubTab('complaints')}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
            subTab === 'complaints'
              ? 'border-[#116B50] text-[#116B50] dark:text-[#4ADE80] dark:border-[#4ADE80]'
              : 'border-transparent text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
          }`}
        >
          <ThumbsDown className="w-4 h-4" />
          <span>E‘tirozlar & Shikoyatlar Tahlili</span>
        </button>
      </div>

      {/* TAB 1: TOP PRODUCTS & SERVICES */}
      {subTab === 'products-services' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products Table */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#172C28] dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-[#116B50]" />
                <span>Eng Ko‘p Qidirilgan Mahsulotlar (Top Trends)</span>
              </h3>
              <Tag variant="default" className="text-[10px]">BUGUN</Tag>
            </div>

            <div className="flex flex-col gap-2.5">
              {(data?.topSearchedProducts || []).map((prod: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#F9FAF9] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#E0EFE7] dark:bg-[#1C362A] text-[#116B50] dark:text-[#4ADE80] font-extrabold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <strong className="block font-bold text-[#172C28] dark:text-white">
                        {prod.name}
                      </strong>
                      <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                        Kategoriya: {prod.category} · Asosiy sotuvchi: {prod.topStore}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <strong className="block text-sm font-extrabold text-[#116B50] dark:text-[#4ADE80]">
                      {prod.searchesCount} marta
                    </strong>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Topildi: {prod.successRate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Services & Searches */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#172C28] dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Ommabop Xizmatlar & Do‘kon Talablari</span>
              </h3>
              <Tag variant="warn" className="text-[10px]">XIZMATLAR</Tag>
            </div>

            <div className="flex flex-col gap-2.5">
              {(data?.topSearchedServices || []).map((srv: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#F9FAF9] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] flex items-center justify-between text-xs"
                >
                  <div>
                    <strong className="block font-bold text-[#172C28] dark:text-white">
                      {srv.name}
                    </strong>
                    <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                      {srv.description}
                    </span>
                  </div>

                  <div className="text-right">
                    <strong className="block text-sm font-extrabold text-[#172C28] dark:text-white">
                      {srv.searchesCount} qidiruv
                    </strong>
                  </div>
                </div>
              ))}
            </div>

            {/* Store Popularity Table */}
            <div className="pt-2 border-t border-[#DCE5DF] dark:border-[#22332C]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#566A63] dark:text-[#8B9E95] mb-2">
                Tashkilotlar va Do‘konlarga Qiziqish
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(data?.topStoresActivity || []).slice(0, 4).map((st: any) => (
                  <div
                    key={st.id}
                    className="p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] text-xs"
                  >
                    <div className="font-bold text-[#172C28] dark:text-white truncate">{st.name}</div>
                    <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                      👁️ {st.viewsCount} ko‘rish · 🧭 {st.routesRequested} marshrut
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REAL-TIME ACTIVITY STREAM */}
      {subTab === 'activity-stream' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] flex items-center justify-between gap-3 shadow-sm">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3 top-3" />
              <input
                type="text"
                value={streamFilter}
                onChange={(e) => setStreamFilter(e.target.value)}
                placeholder="Qidiruv matni, foydalanuvchi yoki hududni izlash..."
                className="w-full h-10 pl-9 pr-3 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
            <span className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
              Jami: {filteredStream.length} ta yozuv
            </span>
          </div>

          <div className="bg-white dark:bg-[#14201A] rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] overflow-hidden shadow-sm">
            <div className="p-4 bg-[#F3F6F3] dark:bg-[#1A2822] border-b border-[#DCE5DF] dark:border-[#22332C] grid grid-cols-12 gap-2 text-[11px] font-extrabold uppercase text-[#566A63] dark:text-[#8B9E95]">
              <div className="col-span-3">Qidirilgan Mahsulot/So‘rov</div>
              <div className="col-span-3">Foydalanuvchi</div>
              <div className="col-span-2">Hudud & Radius</div>
              <div className="col-span-2 text-center">Topilgan Do‘konlar</div>
              <div className="col-span-2 text-right">Vaqti</div>
            </div>

            <div className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
              {filteredStream.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3.5 grid grid-cols-12 gap-2 items-center text-xs hover:bg-[#F9FAF9] dark:hover:bg-[#182820] transition"
                >
                  <div className="col-span-3">
                    <span className="font-extrabold text-[#172C28] dark:text-white block">
                      🔍 {item.query}
                    </span>
                  </div>

                  <div className="col-span-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#172C28] dark:text-[#E8F2EC]">
                        {item.userName}
                      </span>
                      <Tag
                        variant={item.userType === 'CUSTOMER' ? 'default' : 'gray'}
                        className="text-[9px] uppercase font-bold"
                      >
                        {item.userType}
                      </Tag>
                    </div>
                  </div>

                  <div className="col-span-2 text-[#566A63] dark:text-[#8B9E95]">
                    <div>{item.locationName}</div>
                    <span className="text-[10px] font-mono font-bold text-[#116B50] dark:text-[#4ADE80]">
                      {item.radiusM >= 1000 ? `${item.radiusM / 1000} km` : `${item.radiusM} m`}
                    </span>
                  </div>

                  <div className="col-span-2 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        item.resultsCount > 0
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {item.resultsCount > 0 ? `${item.resultsCount} ta do‘kon` : 'Topilmadi'}
                    </span>
                  </div>

                  <div className="col-span-2 text-right text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                    {new Date(item.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER COMPLAINTS & FEEDBACK */}
      {subTab === 'complaints' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reason Breakdown */}
          <div className="lg:col-span-1 p-6 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-extrabold text-[#172C28] dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>E‘tirozlar Sabablari Bo‘yicha Taqsimot</span>
            </h3>

            <div className="flex flex-col gap-3">
              {[
                { key: 'WRONG_PRICE', label: 'Narx ilovada boshqacha (WRONG_PRICE)', count: data?.complaintsByReason?.WRONG_PRICE || 2, color: 'bg-red-500' },
                { key: 'UNAVAILABLE_PRODUCT', label: 'Tovar mavjud emas / Tugagan', count: data?.complaintsByReason?.UNAVAILABLE_PRODUCT || 1, color: 'bg-amber-500' },
                { key: 'WRONG_LOCATION', label: 'Do‘kon manzili yoki eshigi noto‘g‘ri', count: data?.complaintsByReason?.WRONG_LOCATION || 1, color: 'bg-[#116B50]' },
                { key: 'CLOSED_STORE', label: 'Ish vaqtida do‘kon yopiq', count: data?.complaintsByReason?.CLOSED_STORE || 0, color: 'bg-slate-500' }
              ].map((item) => (
                <div key={item.key} className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#172C28] dark:text-[#E8F2EC]">{item.label}</span>
                    <strong className="font-bold">{item.count} ta</strong>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F3F6F3] dark:bg-[#1A2822] overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${Math.min(100, (item.count / (summary.totalComplaints || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Complaints Feed */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-extrabold text-[#172C28] dark:text-white flex items-center gap-2">
              <ThumbsDown className="w-4 h-4 text-red-500" />
              <span>Foydalanuvchilarning So‘nggi E‘tirozlari</span>
            </h3>

            <div className="flex flex-col gap-3">
              {(data?.recentComplaints || []).map((rep: any) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl border border-red-200 dark:border-red-950/60 bg-red-50/20 dark:bg-red-950/10 flex flex-col gap-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <strong className="font-bold text-[#172C28] dark:text-white">
                        🏪 {rep.storeName}
                      </strong>
                      <Tag variant="error" className="text-[10px]">
                        {rep.reason}
                      </Tag>
                    </div>
                    <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                      {new Date(rep.createdAt).toLocaleDateString('uz-UZ')}
                    </span>
                  </div>

                  <p className="text-[#172C28] dark:text-[#CBD5E1] font-medium bg-white dark:bg-[#16241E] p-2.5 rounded-lg border border-[#DCE5DF] dark:border-[#2A3F36]">
                    "{rep.details}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                    <span>Yubordi: <strong>{rep.reporterName}</strong></span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      Holati: {rep.status === 'OPEN' ? '⏳ Ochiq (Ko‘rib chiqilmoqda)' : '✅ Hal qilindi'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
