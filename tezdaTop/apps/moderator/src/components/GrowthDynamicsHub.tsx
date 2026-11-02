import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  UserX,
  Trash2,
  Store,
  Package,
  Wrench,
  Calendar,
  CalendarDays,
  BarChart3,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Search,
  CheckCircle2,
  Filter,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import { Tag, Button } from '@yaqintop/ui';

export interface GrowthDynamicsHubProps {
  isDarkMode: boolean;
  onShowToast: (msg: string) => void;
  onNavigateToStore?: (storeId: string) => void;
}

export type PeriodType = 'week' | 'month' | 'year' | 'all';
export type SubTabType = 'users' | 'stores' | 'products' | 'services';

export function GrowthDynamicsHub({ isDarkMode, onShowToast, onNavigateToStore }: GrowthDynamicsHubProps) {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'DELETED'>('ALL');
  const [selectedTimelineBar, setSelectedTimelineBar] = useState<any>(null);

  const loadGrowthData = async (selectedPeriod = period) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/analytics/growth?period=${selectedPeriod}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        if (d.timeline && d.timeline.length > 0) {
          // Default to latest timeline bar or preserve selected if matching
          setSelectedTimelineBar((prev: any) => {
            if (!prev) return d.timeline[d.timeline.length - 1];
            const found = d.timeline.find((t: any) => t.key === prev.key);
            return found || d.timeline[d.timeline.length - 1];
          });
        }
      } else {
        onShowToast('O‘sish dinamikasi ma‘lumotlarini yuklashda xatolik yuz berdi');
      }
    } catch (e) {
      console.error(e);
      onShowToast('Server bilan aloqa uzildi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGrowthData(period);
  }, [period]);

  const summary = data?.summary || {
    users: { totalAllTime: 0, inPeriod: 0, previousPeriod: 0, change: '0%' },
    stores: { totalAllTime: 0, inPeriod: 0, previousPeriod: 0, change: '0%' },
    products: { totalAllTime: 0, inPeriod: 0, previousPeriod: 0, change: '0%' },
    services: { totalAllTime: 0, inPeriod: 0, previousPeriod: 0, change: '0%' },
    totalAddedInPeriod: 0
  };

  const timeline = data?.timeline || [];
  const maxTimelineTotal = Math.max(...timeline.map((t: any) => t.total || 0), 1);

  // Filtered lists for the active sub-tab table
  const recentItems = data?.recent || { users: [], stores: [], products: [], services: [] };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Noma‘lum';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('uz-UZ', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr).getTime();
      const diffMs = Date.now() - d;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Hozirgina';
      if (diffHours < 24) return `${diffHours} soat oldin`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `${diffDays} kun oldin`;
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} oy oldin`;
    } catch {
      return '';
    }
  };

  // Filter items based on searchQuery and statusFilter
  const currentList = recentItems[activeSubTab] || [];
  const filteredList = currentList.filter((item: any) => {
    if (statusFilter !== 'ALL') {
      const st = item.status || 'ACTIVE';
      if (st !== statusFilter) return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (activeSubTab === 'users') {
      return (
        (item.fullName || '').toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q) ||
        (item.phone || '').toLowerCase().includes(q) ||
        (item.role || '').toLowerCase().includes(q)
      );
    }
    if (activeSubTab === 'stores') {
      return (
        (item.name || '').toLowerCase().includes(q) ||
        (item.address || '').toLowerCase().includes(q) ||
        (item.phone || '').toLowerCase().includes(q) ||
        (item.type || '').toLowerCase().includes(q)
      );
    }
    if (activeSubTab === 'products') {
      return (
        (item.title || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.brand || '').toLowerCase().includes(q) ||
        (item.packUnit || '').toLowerCase().includes(q)
      );
    }
    if (activeSubTab === 'services') {
      return (
        (item.title || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Header with Period Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 p-6 rounded-2xl bg-gradient-to-r from-[#172C28] via-[#116B50] to-[#174636] text-white shadow-xl">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-emerald-300" />
            <span>Tizim O‘sish & Ro‘yxatga Olish Tahlili</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
            Tizimga Qo‘shilish Dinamikasi
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1.5 leading-relaxed">
            Hafta, oy va yil davomida YaqinTop tizimiga ro‘yxatdan o‘tgan foydalanuvchilar, kiritilgan yangi do‘konlar, mahsulotlar va xizmatlarning vaqt bo‘yicha o‘sish ko‘rsatkichlari.
          </p>
        </div>

        {/* Controls: Period Selector & Refresh */}
        <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-center bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/20 shrink-0">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              period === 'week'
                ? 'bg-white text-[#116B50] shadow-md'
                : 'text-white hover:bg-white/15'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Hafta (7 kun)</span>
          </button>

          <button
            onClick={() => setPeriod('month')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              period === 'month'
                ? 'bg-white text-[#116B50] shadow-md'
                : 'text-white hover:bg-white/15'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Oy (30 kun)</span>
          </button>

          <button
            onClick={() => setPeriod('year')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              period === 'year'
                ? 'bg-white text-[#116B50] shadow-md'
                : 'text-white hover:bg-white/15'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Yil (12 oy)</span>
          </button>

          <button
            onClick={() => setPeriod('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              period === 'all'
                ? 'bg-white text-[#116B50] shadow-md'
                : 'text-white hover:bg-white/15'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Barcha davr</span>
          </button>

          <button
            onClick={() => loadGrowthData(period)}
            title="Ma‘lumotlarni yangilash"
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition ml-1 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Holatlar bo‘yicha taqsimot: Faollar, Bloklanganlar, O‘chirilganlar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5 p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Faol holatdagilar (Faol)
            </div>
            <div className="text-2xl font-black text-[#172C28] dark:text-white mt-0.5">
              {(summary.users?.active || 0) + (summary.stores?.active || 0)} ta
            </div>
            <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-0.5 font-medium">
              👥 {summary.users?.active || 0} ta foydalanuvchi · 🏪 {summary.stores?.active || 0} ta do‘kon
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              Bloklanganlar (To‘xtatilgan)
            </div>
            <div className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-0.5">
              {(summary.users?.suspended || 0) + (summary.stores?.suspended || 0)} ta
            </div>
            <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 font-medium">
              👥 {summary.users?.suspended || 0} ta foydalanuvchi · 🏪 {summary.stores?.suspended || 0} ta do‘kon
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-3.5 bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">
              O‘chirilganlar (Bazadan chiqarilgan)
            </div>
            <div className="text-2xl font-black text-red-900 dark:text-red-200 mt-0.5">
              {(summary.users?.deleted || 0) + (summary.stores?.deleted || 0)} ta
            </div>
            <div className="text-[11px] text-red-700 dark:text-red-400 mt-0.5 font-medium">
              👥 {summary.users?.deleted || 0} ta foydalanuvchi · 🏪 {summary.stores?.deleted || 0} ta do‘kon
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users Card */}
        <div
          onClick={() => setActiveSubTab('users')}
          className={`p-5 rounded-2xl bg-white dark:bg-[#14201A] border transition cursor-pointer shadow-sm hover:shadow-md ${
            activeSubTab === 'users'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-[#DCE5DF] dark:border-[#22332C] hover:border-emerald-300 dark:hover:border-emerald-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95] uppercase tracking-wider">
              Foydalanuvchilar
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-[#172C28] dark:text-white">
              {summary.users.inPeriod}
            </span>
            <span className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
              ta yangi
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-[#F3F6F3] dark:border-[#1E2E26]">
            <span className="text-[#566A63] dark:text-[#8B9E95]">
              Jami tizimda: <strong className="text-[#172C28] dark:text-white">{summary.users.totalAllTime} ta</strong>
            </span>
            <span className="px-1.5 py-0.5 rounded-md font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
              {summary.users.change}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] flex-wrap">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">Faol: {summary.users?.active || 0}</span>
            <span className="text-[#566A63]">·</span>
            <span className="text-amber-700 dark:text-amber-400 font-bold">Bloklangan: {summary.users?.suspended || 0}</span>
            <span className="text-[#566A63]">·</span>
            <span className="text-red-600 dark:text-red-400 font-bold">O‘chirilgan: {summary.users?.deleted || 0}</span>
          </div>
        </div>

        {/* Stores Card */}
        <div
          onClick={() => setActiveSubTab('stores')}
          className={`p-5 rounded-2xl bg-white dark:bg-[#14201A] border transition cursor-pointer shadow-sm hover:shadow-md ${
            activeSubTab === 'stores'
              ? 'border-sky-500 ring-2 ring-sky-500/20'
              : 'border-[#DCE5DF] dark:border-[#22332C] hover:border-sky-300 dark:hover:border-sky-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95] uppercase tracking-wider">
              Do‘konlar & Filiallar
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-[#172C28] dark:text-white">
              {summary.stores.inPeriod}
            </span>
            <span className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
              ta kiritilgan
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-[#F3F6F3] dark:border-[#1E2E26]">
            <span className="text-[#566A63] dark:text-[#8B9E95]">
              Jami bazada: <strong className="text-[#172C28] dark:text-white">{summary.stores.totalAllTime} ta</strong>
            </span>
            <span className="px-1.5 py-0.5 rounded-md font-bold bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400">
              {summary.stores.change}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] flex-wrap">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">Faol: {summary.stores?.active || 0}</span>
            <span className="text-[#566A63]">·</span>
            <span className="text-amber-700 dark:text-amber-400 font-bold">Bloklangan: {summary.stores?.suspended || 0}</span>
            <span className="text-[#566A63]">·</span>
            <span className="text-red-600 dark:text-red-400 font-bold">O‘chirilgan: {summary.stores?.deleted || 0}</span>
          </div>
        </div>

        {/* Products Card */}
        <div
          onClick={() => setActiveSubTab('products')}
          className={`p-5 rounded-2xl bg-white dark:bg-[#14201A] border transition cursor-pointer shadow-sm hover:shadow-md ${
            activeSubTab === 'products'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-[#DCE5DF] dark:border-[#22332C] hover:border-amber-300 dark:hover:border-amber-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95] uppercase tracking-wider">
              Mahsulotlar (Tovarlar)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-[#172C28] dark:text-white">
              {summary.products.inPeriod}
            </span>
            <span className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
              ta yangi tovar
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-[#F3F6F3] dark:border-[#1E2E26]">
            <span className="text-[#566A63] dark:text-[#8B9E95]">
              Jami katalogda: <strong className="text-[#172C28] dark:text-white">{summary.products.totalAllTime} ta</strong>
            </span>
            <span className="px-1.5 py-0.5 rounded-md font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
              {summary.products.change}
            </span>
          </div>
        </div>

        {/* Services Card */}
        <div
          onClick={() => setActiveSubTab('services')}
          className={`p-5 rounded-2xl bg-white dark:bg-[#14201A] border transition cursor-pointer shadow-sm hover:shadow-md ${
            activeSubTab === 'services'
              ? 'border-purple-500 ring-2 ring-purple-500/20'
              : 'border-[#DCE5DF] dark:border-[#22332C] hover:border-purple-300 dark:hover:border-purple-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95] uppercase tracking-wider">
              Xizmatlar (Servis)
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-[#172C28] dark:text-white">
              {summary.services.inPeriod}
            </span>
            <span className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
              ta yangi xizmat
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-[#F3F6F3] dark:border-[#1E2E26]">
            <span className="text-[#566A63] dark:text-[#8B9E95]">
              Jami xizmatlar: <strong className="text-[#172C28] dark:text-white">{summary.services.totalAllTime} ta</strong>
            </span>
            <span className="px-1.5 py-0.5 rounded-md font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400">
              {summary.services.change}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Visual Progression / Timeline Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#116B50] dark:text-[#4ADE80]" />
              <h2 className="text-base sm:text-lg font-extrabold text-[#172C28] dark:text-white">
                Vaqt Oralig‘i Bo‘yicha Qo‘shilish Dinamikasi
              </h2>
            </div>
            <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
              Tanlangan oraliq: <strong className="text-[#116B50] dark:text-[#4ADE80]">
                {period === 'week' ? 'Oxirgi 7 kun (haftalik)' : period === 'month' ? 'Oxirgi 30 kun (oylik)' : period === 'year' ? 'Oxirgi 12 oy (yillik)' : 'Barcha davr'}
              </strong> — Har bir ustun ustiga bosib, o‘sha vaqtdagi aniq sonlarni ko‘rishingiz mumkin.
            </p>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#116B50]" />
              <span className="text-[#566A63] dark:text-[#8B9E95]">Foydalanuvchilar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-sky-500" />
              <span className="text-[#566A63] dark:text-[#8B9E95]">Do‘konlar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500" />
              <span className="text-[#566A63] dark:text-[#8B9E95]">Mahsulotlar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-purple-500" />
              <span className="text-[#566A63] dark:text-[#8B9E95]">Xizmatlar</span>
            </div>
          </div>
        </div>

        {/* Visual Timeline Bar Chart */}
        {timeline.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#566A63] dark:text-[#8B9E95]">
            Ushbu davr bo‘yicha vaqt ma‘lumotlari mavjud emas
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-flow-col auto-cols-fr gap-2 sm:gap-4 items-end min-h-[180px] sm:min-h-[220px] pt-8 pb-3 px-2 border-b border-[#DCE5DF] dark:border-[#22332C]">
              {timeline.map((item: any, idx: number) => {
                const isSelected = selectedTimelineBar?.key === item.key;
                const totalHeightPct = Math.max(Math.round((item.total / maxTimelineTotal) * 100), item.total > 0 ? 12 : 3);

                // Heights for each segmented bar
                const uPct = item.total > 0 ? (item.users / item.total) * 100 : 0;
                const sPct = item.total > 0 ? (item.stores / item.total) * 100 : 0;
                const pPct = item.total > 0 ? (item.products / item.total) * 100 : 0;
                const srvPct = item.total > 0 ? (item.services / item.total) * 100 : 0;

                return (
                  <div
                    key={item.key || idx}
                    onClick={() => setSelectedTimelineBar(item)}
                    className="flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
                  >
                    {/* Top total label */}
                    <span className={`text-[10px] font-black transition ${
                      isSelected ? 'text-[#116B50] dark:text-[#4ADE80] scale-110' : 'text-[#566A63] dark:text-[#8B9E95] opacity-80 group-hover:opacity-100'
                    }`}>
                      {item.total > 0 ? `+${item.total}` : '0'}
                    </span>

                    {/* Segmented Bar */}
                    <div
                      style={{ height: `${totalHeightPct}%` }}
                      className={`w-full max-w-[42px] min-h-[8px] rounded-t-lg overflow-hidden flex flex-col-reverse transition-all duration-200 ${
                        isSelected
                          ? 'ring-2 ring-emerald-500 shadow-lg scale-105'
                          : 'opacity-85 hover:opacity-100 group-hover:scale-105'
                      } ${item.total === 0 ? 'bg-slate-200 dark:bg-slate-800' : ''}`}
                    >
                      {item.users > 0 && (
                        <div
                          style={{ height: `${uPct}%` }}
                          className="w-full bg-[#116B50] hover:brightness-110 transition"
                          title={`Foydalanuvchilar: ${item.users}`}
                        />
                      )}
                      {item.stores > 0 && (
                        <div
                          style={{ height: `${sPct}%` }}
                          className="w-full bg-sky-500 hover:brightness-110 transition"
                          title={`Do‘konlar: ${item.stores}`}
                        />
                      )}
                      {item.products > 0 && (
                        <div
                          style={{ height: `${pPct}%` }}
                          className="w-full bg-amber-500 hover:brightness-110 transition"
                          title={`Mahsulotlar: ${item.products}`}
                        />
                      )}
                      {item.services > 0 && (
                        <div
                          style={{ height: `${srvPct}%` }}
                          className="w-full bg-purple-500 hover:brightness-110 transition"
                          title={`Xizmatlar: ${item.services}`}
                        />
                      )}
                    </div>

                    {/* Label at bottom */}
                    <span className={`text-[10px] sm:text-[11px] font-bold text-center truncate max-w-[64px] transition ${
                      isSelected
                        ? 'text-[#116B50] dark:text-[#4ADE80] font-black'
                        : 'text-[#566A63] dark:text-[#8B9E95]'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Selected Bar Details Pill */}
            {selectedTimelineBar && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#172C28] dark:text-white">
                    📍 {selectedTimelineBar.label} sanasidagi o‘sish ko‘rsatkichi:
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-black bg-[#116B50] text-white text-[11px]">
                    Jami: {selectedTimelineBar.total} ta
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                  <span className="text-[#116B50] dark:text-[#4ADE80]">
                    👥 {selectedTimelineBar.users} ta foydalanuvchi
                  </span>
                  <span className="text-sky-600 dark:text-sky-400">
                    🏪 {selectedTimelineBar.stores} ta do‘kon
                  </span>
                  <span className="text-amber-600 dark:text-amber-400">
                    📦 {selectedTimelineBar.products} ta mahsulot
                  </span>
                  <span className="text-purple-600 dark:text-purple-400">
                    🛠️ {selectedTimelineBar.services} ta xizmat
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detailed Items Breakdown Table Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
        {/* Sub-tab Navigation and Search Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE5DF] dark:border-[#22332C]">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => { setActiveSubTab('users'); setSearchQuery(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeSubTab === 'users'
                  ? 'bg-[#116B50] text-white shadow'
                  : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Foydalanuvchilar</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeSubTab === 'users' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10'
              }`}>
                {recentItems.users.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveSubTab('stores'); setSearchQuery(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeSubTab === 'stores'
                  ? 'bg-sky-600 text-white shadow'
                  : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Do‘konlar & Filiallar</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeSubTab === 'stores' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10'
              }`}>
                {recentItems.stores.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveSubTab('products'); setSearchQuery(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeSubTab === 'products'
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Mahsulotlar (Tovarlar)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeSubTab === 'products' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10'
              }`}>
                {recentItems.products.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveSubTab('services'); setSearchQuery(''); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeSubTab === 'services'
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Xizmatlar (Servis)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeSubTab === 'services' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10'
              }`}>
                {recentItems.services.length}
              </span>
            </button>
          </div>

          {/* Status Filter for Users & Stores */}
          {(activeSubTab === 'users' || activeSubTab === 'stores') && (
            <div className="flex items-center gap-1 bg-[#F3F6F3] dark:bg-[#1A2822] p-1 rounded-xl">
              {[
                { id: 'ALL', label: 'Barchasi' },
                { id: 'ACTIVE', label: 'Faol' },
                { id: 'SUSPENDED', label: 'Bloklangan' },
                { id: 'DELETED', label: 'O‘chirilgan' }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    statusFilter === st.id
                      ? 'bg-white dark:bg-[#14201A] text-[#116B50] dark:text-[#4ADE80] shadow-sm'
                      : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          )}

          {/* Search Field */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ro‘yxatdan qidirish..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-[#F3F6F3] dark:bg-[#1A2822] border border-transparent focus:border-[#116B50] focus:bg-white dark:focus:bg-[#14201A] text-[#172C28] dark:text-white placeholder-[#566A63] dark:placeholder-[#8B9E95] transition outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#566A63] hover:text-[#172C28] dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Table Content */}
        <div className="overflow-x-auto mt-4">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#566A63] dark:text-[#8B9E95]">
              {searchQuery ? `"${searchQuery}" bo‘yicha hech narsa topilmadi` : 'Ushbu bo‘limda ma‘lumotlar mavjud emas'}
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] font-bold">
                  {activeSubTab === 'users' && (
                    <>
                      <th className="py-3 px-3">Foydalanuvchi</th>
                      <th className="py-3 px-3">Roli</th>
                      <th className="py-3 px-3">Telefon</th>
                      <th className="py-3 px-3">Holati</th>
                      <th className="py-3 px-3">Ro‘yxatdan o‘tgan vaqti</th>
                    </>
                  )}
                  {activeSubTab === 'stores' && (
                    <>
                      <th className="py-3 px-3">Do‘kon / Filial Nomi</th>
                      <th className="py-3 px-3">Faoliyat Turi</th>
                      <th className="py-3 px-3">Manzili</th>
                      <th className="py-3 px-3">Holati</th>
                      <th className="py-3 px-3">Kiritilgan Sanasi</th>
                    </>
                  )}
                  {activeSubTab === 'products' && (
                    <>
                      <th className="py-3 px-3">Mahsulot Nomi</th>
                      <th className="py-3 px-3">Kategoriyasi</th>
                      <th className="py-3 px-3">Brend</th>
                      <th className="py-3 px-3">Birligi</th>
                      <th className="py-3 px-3">Katalogga Kiritilgan</th>
                    </>
                  )}
                  {activeSubTab === 'services' && (
                    <>
                      <th className="py-3 px-3">Xizmat Nomi</th>
                      <th className="py-3 px-3">Toifasi</th>
                      <th className="py-3 px-3">Davomiyligi</th>
                      <th className="py-3 px-3">Tavsifi</th>
                      <th className="py-3 px-3">Tizimga Kiritilgan</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F6F3] dark:divide-[#1E2E26]">
                {filteredList.map((item: any, idx: number) => (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/40 transition group"
                  >
                    {activeSubTab === 'users' && (
                      <>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#172C28] dark:text-white flex items-center gap-2">
                            <span>{item.fullName || 'Nomsiz foydalanuvchi'}</span>
                          </div>
                          <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] block mt-0.5">
                            {item.email}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                            item.role === 'SUPERADMIN' || item.role === 'ADMIN'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                              : item.role === 'MODERATOR'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                              : item.role === 'OWNER'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          }`}>
                            {item.role || 'CUSTOMER'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[#566A63] dark:text-[#8B9E95]">
                          {item.phone || '—'}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                            item.status === 'ACTIVE'
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                              : item.status === 'DELETED'
                              ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                              : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                          }`}>
                            {item.status === 'ACTIVE' ? 'Faol' : item.status === 'DELETED' ? 'O‘chirilgan' : item.status === 'SUSPENDED' ? 'Bloklangan' : item.status || 'Faol'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-[#172C28] dark:text-white block">
                            {formatDateTime(item.createdAt)}
                          </span>
                          <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                            {getRelativeTime(item.createdAt)}
                          </span>
                        </td>
                      </>
                    )}

                    {activeSubTab === 'stores' && (
                      <>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#172C28] dark:text-white flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {item.isVerified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                            )}
                          </div>
                          <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] block mt-0.5 font-mono">
                            {item.phone || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-[#566A63] dark:text-[#8B9E95]">
                          <span className="px-2 py-0.5 rounded bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] font-bold text-[10px]">
                            {item.type || 'RETAIL'}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-[240px] truncate text-[#566A63] dark:text-[#8B9E95]" title={item.address}>
                          {item.address || '—'}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                            item.status === 'ACTIVE'
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                              : item.status === 'DELETED'
                              ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                              : item.status === 'PENDING'
                              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                              : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                          }`}>
                            {item.status === 'ACTIVE' ? 'Faol' : item.status === 'DELETED' ? 'O‘chirilgan' : item.status === 'SUSPENDED' ? 'Bloklangan' : item.status === 'PENDING' ? 'Kutilmoqda' : item.status || 'Faol'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-[#172C28] dark:text-white block">
                            {formatDateTime(item.createdAt)}
                          </span>
                          <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                            {getRelativeTime(item.createdAt)}
                          </span>
                        </td>
                      </>
                    )}

                    {activeSubTab === 'products' && (
                      <>
                        <td className="py-3 px-3 font-bold text-[#172C28] dark:text-white">
                          {item.title || item.name}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#566A63] dark:text-[#8B9E95]">
                          {item.category || 'Umumiy tovar'}
                        </td>
                        <td className="py-3 px-3 text-[#566A63] dark:text-[#8B9E95]">
                          {item.brand || '—'}
                        </td>
                        <td className="py-3 px-3 font-medium text-[#566A63] dark:text-[#8B9E95]">
                          {item.packSize || item.packUnit || 'dona'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-[#172C28] dark:text-white block">
                            {formatDateTime(item.createdAt)}
                          </span>
                          <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                            {getRelativeTime(item.createdAt)}
                          </span>
                        </td>
                      </>
                    )}

                    {activeSubTab === 'services' && (
                      <>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#172C28] dark:text-white">
                            {item.title || item.name}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-purple-600 dark:text-purple-400">
                          {item.category || 'Xizmat'}
                        </td>
                        <td className="py-3 px-3 text-[#566A63] dark:text-[#8B9E95]">
                          {item.durationMinutes ? `${item.durationMinutes} daqiqa` : '—'}
                        </td>
                        <td className="py-3 px-3 max-w-[240px] truncate text-[#566A63] dark:text-[#8B9E95]" title={item.description}>
                          {item.description || '—'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-[#172C28] dark:text-white block">
                            {formatDateTime(item.createdAt)}
                          </span>
                          <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                            {getRelativeTime(item.createdAt)}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
