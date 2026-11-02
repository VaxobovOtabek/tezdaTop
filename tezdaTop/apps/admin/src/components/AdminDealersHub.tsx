import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  Phone,
  User,
  Key,
  Shield,
  MapPin,
  Globe,
  DollarSign,
  AlertTriangle,
  Store,
  ChevronRight,
  Lock,
  Edit2
} from 'lucide-react';
import { Button, Tag, Modal, useTranslation } from '@yaqintop/ui';

export interface DealerItem {
  id: string;
  userId: string;
  companyName: string;
  contactName: string;
  login: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
  allowExperimentalMap: boolean;
  region: string;
  city: string;
  storeCount: number;
  totalDebt: number;
  createdAt: string;
}

export interface AdminDealersHubProps {
  isDarkMode: boolean;
  onShowToast: (msg: string) => void;
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('yaqintop_token') || localStorage.getItem('yaqintop_session_token') || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function AdminDealersHub({ isDarkMode, onShowToast }: AdminDealersHubProps) {
  const { t } = useTranslation();
  const [dealers, setDealers] = useState<DealerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<DealerItem | null>(null);

  // Form State for Create
  const [formCompany, setFormCompany] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formPhone, setFormPhone] = useState('+998');
  const [formLogin, setFormLogin] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRegion, setFormRegion] = useState('Toshkent shahri');
  const [formCity, setFormCity] = useState('Yunusobod tumani');
  const [formAllowMap, setFormAllowMap] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Edit
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [editAllowMap, setEditAllowMap] = useState(false);
  const [editPassword, setEditPassword] = useState('');

  const fetchDealers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/dealers', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setDealers(data.dealers || []);
      } else {
        onShowToast('Dillerlar ro‘yxatini yuklashda xatolik');
      }
    } catch {
      onShowToast('Server bilan bog‘lanishda xatolik');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  const handleCreateDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim() || !formContact.trim() || !formLogin.trim() || !formPassword.trim()) {
      onShowToast('Iltimos, barcha maydonlarni to‘ldiring');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/dealers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          companyName: formCompany.trim(),
          contactName: formContact.trim(),
          phone: formPhone.trim(),
          login: formLogin.trim().toLowerCase(),
          password: formPassword.trim(),
          region: formRegion,
          city: formCity,
          allowExperimentalMap: formAllowMap
        })
      });

      const data = await res.json();
      if (res.ok) {
        onShowToast('Yangi diller hisobi muvaffaqiyatli yaratildi!');
        setIsCreateModalOpen(false);
        // Reset form
        setFormCompany('');
        setFormContact('');
        setFormPhone('+998');
        setFormLogin('');
        setFormPassword('');
        fetchDealers();
      } else {
        onShowToast(data.message || 'Diller yaratishda xatolik yuz berdi');
      }
    } catch {
      onShowToast('Server bilan bog‘lanishda xatolik');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealer) return;

    setIsSubmitting(true);
    try {
      const body: any = {
        status: editStatus,
        allowExperimentalMap: editAllowMap
      };
      if (editPassword.trim()) {
        body.newPassword = editPassword.trim();
      }

      const res = await fetch(`/api/v1/admin/dealers/${selectedDealer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        onShowToast('Diller sozlamalari muvaffaqiyatli saqlandi');
        setIsEditModalOpen(false);
        setSelectedDealer(null);
        setEditPassword('');
        fetchDealers();
      } else {
        const data = await res.json();
        onShowToast(data.message || 'Yangilashda xatolik yuz berdi');
      }
    } catch {
      onShowToast('Server bilan bog‘lanishda xatolik');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (d: DealerItem) => {
    setSelectedDealer(d);
    setEditStatus(d.status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED');
    setEditAllowMap(d.allowExperimentalMap);
    setEditPassword('');
    setIsEditModalOpen(true);
  };

  // Filtered dealers
  const filteredDealers = dealers.filter(d => {
    const matchesSearch =
      d.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.login.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && d.status === 'ACTIVE') ||
      (statusFilter === 'SUSPENDED' && d.status !== 'ACTIVE');

    return matchesSearch && matchesStatus;
  });

  const totalStores = dealers.reduce((acc, d) => acc + (d.storeCount || 0), 0);
  const totalDebtSum = dealers.reduce((acc, d) => acc + (d.totalDebt || 0), 0);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#116B50]/10 dark:bg-[#4ADE80]/10 flex items-center justify-center text-[#116B50] dark:text-[#4ADE80]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#172C28] dark:text-white">
                {t('Dillerlar va Distribyutorlar Boshqaruvi')}
              </h1>
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
                {t('B2B ulgurji taqsimot, do‘konlar qarzdorligi va distribyutor hisoblarini boshqarish markazi')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDealers}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t('Yangilash')}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold bg-[#116B50] hover:bg-[#0E5842] text-white"
          >
            <Plus className="w-4 h-4" />
            <span>{t('Yangi Diller Qo‘shish')}</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
          <div className="flex items-center justify-between text-[#566A63] dark:text-[#8B9E95] text-xs font-bold">
            <span>{t('Jami Dillerlar')}</span>
            <Truck className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
          </div>
          <div className="text-2xl font-black text-[#172C28] dark:text-white mt-2">
            {dealers.length} {t('ta')}
          </div>
          <div className="text-[11px] text-[#116B50] dark:text-[#4ADE80] font-semibold mt-1">
            {dealers.filter(d => d.status === 'ACTIVE').length} {t('faol distribyutor')}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
          <div className="flex items-center justify-between text-[#566A63] dark:text-[#8B9E95] text-xs font-bold">
            <span>{t('Mijoz Do‘konlar')}</span>
            <Store className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-[#172C28] dark:text-white mt-2">
            {totalStores} {t('ta')}
          </div>
          <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
            {t('Dillerlarga biriktirilgan nuqtalar')}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
          <div className="flex items-center justify-between text-[#566A63] dark:text-[#8B9E95] text-xs font-bold">
            <span>{t('Jami Debitorlik')}</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {totalDebtSum.toLocaleString()} {t('so‘m')}
          </div>
          <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
            {t('Do‘konlar ustidagi jami qarz')}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
          <div className="flex items-center justify-between text-[#566A63] dark:text-[#8B9E95] text-xs font-bold">
            <span>{t('Global Xarita Ruxsati')}</span>
            <Globe className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {dealers.filter(d => d.allowExperimentalMap).length} / {dealers.length}
          </div>
          <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
            {t('Eksperimental xarita ochiq')}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95]" />
          <input
            type="text"
            placeholder={t('Kompaniya, ism, login yoki telefon...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto">
          {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-[#116B50] text-white'
                  : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
              }`}
            >
              {st === 'ALL' ? t('Barchasi') : st === 'ACTIVE' ? t('Faol') : t('To‘xtatilgan')}
            </button>
          ))}
        </div>
      </div>

      {/* Dealers Table */}
      <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] uppercase font-bold border-b border-[#DCE5DF] dark:border-[#22332C]">
              <tr>
                <th className="py-3 px-4">{t('Kompaniya & Mas’ul Shaxs')}</th>
                <th className="py-3 px-4">{t('Login & Telefon')}</th>
                <th className="py-3 px-4">{t('Hudud')}</th>
                <th className="py-3 px-4 text-center">{t('Do‘konlar')}</th>
                <th className="py-3 px-4">{t('Debitorlik')}</th>
                <th className="py-3 px-4 text-center">{t('Global Xarita')}</th>
                <th className="py-3 px-4 text-center">{t('Holati')}</th>
                <th className="py-3 px-4 text-right">{t('Amallar')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5DF]/60 dark:divide-[#22332C]">
              {filteredDealers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#566A63] dark:text-[#8B9E95]">
                    {t('Hech qanday diller topilmadi')}
                  </td>
                </tr>
              ) : (
                filteredDealers.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-[#F9FAF9] dark:hover:bg-[#1A2822]/50 transition"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#172C28] dark:text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#116B50]/10 dark:bg-[#4ADE80]/10 text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div>{d.companyName}</div>
                          <div className="text-[11px] font-normal text-[#566A63] dark:text-[#8B9E95]">
                            {d.contactName}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#172C28] dark:text-white font-mono">
                        @{d.login}
                      </div>
                      <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                        {d.phone}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-[#172C28] dark:text-white font-medium">
                        {d.region}
                      </div>
                      <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                        {d.city}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs">
                        {d.storeCount} {t('ta')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className={`font-bold ${d.totalDebt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {d.totalDebt.toLocaleString()} {t('so‘m')}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {d.allowExperimentalMap ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                          <Globe className="w-3 h-3" />
                          {t('Ruxsat bor')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500">
                          <Lock className="w-3 h-3" />
                          {t('Yopiq')}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {d.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          {t('Faol')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          <XCircle className="w-3 h-3" />
                          {t('To‘xtatilgan')}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(d)}
                        className="text-xs font-semibold py-1 px-2.5 flex items-center gap-1 ml-auto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{t('Sozlash')}</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE DEALER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t('Yangi Diller Profili Yaratish')}
      >
        <form onSubmit={handleCreateDealer} className="flex flex-col gap-3 py-1">
          <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
            {t('Diller hisobi yaratilgach, diller yaqintop.uz/diller orqali kirishi mumkin bo‘ladi.')}
          </p>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              {t('Kompaniya / Distribyutor nomi')} *
            </label>
            <input
              type="text"
              required
              placeholder="Masalan: Toshkent Distribyutsiya MCHJ"
              value={formCompany}
              onChange={(e) => setFormCompany(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                {t('Mas’ul shaxs ismi')} *
              </label>
              <input
                type="text"
                required
                placeholder="Akmal Rustamov"
                value={formContact}
                onChange={(e) => setFormContact(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                {t('Telefon raqami')} *
              </label>
              <input
                type="text"
                required
                placeholder="+998901234567"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                {t('Login (Unikal foydalanuvchi nomi)')} *
              </label>
              <input
                type="text"
                required
                placeholder="diller_toshkent"
                value={formLogin}
                onChange={(e) => setFormLogin(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                {t('Yangi Parol')} *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                {t('Viloyat')}
              </label>
              <input
                type="text"
                value={formRegion}
                onChange={(e) => setFormRegion(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                {t('Shahar / Tuman')}
              </label>
              <input
                type="text"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formAllowMap}
                onChange={(e) => setFormAllowMap(e.target.checked)}
                className="w-4 h-4 rounded text-[#116B50] focus:ring-[#116B50]"
              />
              <span className="text-xs font-bold text-[#172C28] dark:text-white">
                {t('Eksperimental Global Tovarlar Xaritasiga ruxsat berish')}
              </span>
            </label>
            <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] ml-6 mt-0.5">
              {t('Diller barcha sohalardagi anonimlashtirilgan bozor to‘yinganligi xaritasini ko‘ra oladi')}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#DCE5DF] dark:border-[#22332C] mt-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
            >
              {t('Bekor qilish')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSubmitting}
              className="bg-[#116B50] hover:bg-[#0E5842] text-white"
            >
              {isSubmitting ? t('Yaratilmoqda...') : t('Dillerni Yaratish')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT DEALER MODAL */}
      {selectedDealer && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`${selectedDealer.companyName} - ${t('Sozlamalari')}`}
        >
          <form onSubmit={handleUpdateDealer} className="flex flex-col gap-3 py-1">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                {t('Hisob Holati')}
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
              >
                <option value="ACTIVE">{t('Faol (Ruxsat berilgan)')}</option>
                <option value="SUSPENDED">{t('To‘xtatilgan (Kirish bloklangan)')}</option>
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editAllowMap}
                  onChange={(e) => setEditAllowMap(e.target.checked)}
                  className="w-4 h-4 rounded text-[#116B50] focus:ring-[#116B50]"
                />
                <span className="text-xs font-bold text-[#172C28] dark:text-white">
                  {t('Eksperimental Global Tovarlar Xaritasiga ruxsat berish')}
                </span>
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                {t('Parolni yangilash (Ixtiyoriy)')}
              </label>
              <input
                type="password"
                placeholder={t('Bo‘sh qoldirilsa, o‘zgarmaydi')}
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#DCE5DF] dark:border-[#22332C] mt-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsEditModalOpen(false)}
              >
                {t('Bekor qilish')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSubmitting}
                className="bg-[#116B50] hover:bg-[#0E5842] text-white"
              >
                {isSubmitting ? t('Saqlanmoqda...') : t('O‘zgarishlarni Saqlash')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
