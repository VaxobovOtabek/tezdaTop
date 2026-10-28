import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  Clock,
  Heart,
  Star,
  Trash2,
  Send,
  Plus,
  Building2,
  MapPin,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Search,
  Navigation,
  FileText,
  Sparkles,
  Camera
} from 'lucide-react';
import { Button, Tag, Modal, Input } from '@yaqintop/ui';
import { apiUrl } from '../config/api.js';

interface UserPersonalHubProps {
  activeSection: 'reviews' | 'inquiries' | 'history' | 'favorites' | 'proposals';
  onNavigateSection: (section: 'reviews' | 'inquiries' | 'history' | 'favorites' | 'proposals') => void;
  onBackToSearch: () => void;
  onOpenStore: (storeId: string) => void;
  onGetRoute: (store: any) => void;
  onSearchQuery: (query: string) => void;
  isDarkMode: boolean;
  currentUser: any;
  onShowToast: (msg: string) => void;
}

export function UserPersonalHubView({
  activeSection,
  onNavigateSection,
  onBackToSearch,
  onOpenStore,
  onGetRoute,
  onSearchQuery,
  isDarkMode,
  currentUser,
  onShowToast
}: UserPersonalHubProps) {
  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Reports & Inquiries State
  const [reports, setReports] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [availableStores, setAvailableStores] = useState<any[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [isNewInquiryModalOpen, setIsNewInquiryModalOpen] = useState(false);
  const [newInquiryForm, setNewInquiryForm] = useState({
    storeId: '',
    subject: '',
    category: 'SUPPORT',
    message: ''
  });
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  // Search & Store History State (localStorage)
  const [searchHistory, setSearchHistory] = useState<{ query: string; timestamp: string }[]>([]);
  const [viewedStoresHistory, setViewedStoresHistory] = useState<any[]>([]);

  // Favorites State (localStorage)
  const [favorites, setFavorites] = useState<any[]>([]);

  // Item Proposals State
  const [proposals, setProposals] = useState<any[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [proposalStatusFilter, setProposalStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [proposalSearch, setProposalSearch] = useState('');
  const [photoProposals, setPhotoProposals] = useState<any[]>([]);

  // Fetch reviews
  const loadUserReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch(apiUrl(`/api/v1/user/reviews?userId=${currentUser?.id || ''}`));
      if (res.ok) {
        const data = await res.json();
        setReviews(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching user reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Fetch reports & inquiries & stores
  const loadUserInquiries = async () => {
    setLoadingInquiries(true);
    try {
      const [repRes, inqRes, storesRes] = await Promise.all([
        fetch(apiUrl(`/api/v1/user/reports?userId=${currentUser?.id || ''}`)),
        fetch(apiUrl(`/api/v1/user/inquiries?userId=${currentUser?.id || ''}`)),
        fetch(apiUrl('/api/v1/search?query='))
      ]);
      if (repRes.ok) {
        const repData = await repRes.json();
        setReports(repData.items || []);
      }
      if (inqRes.ok) {
        const inqData = await inqRes.json();
        setInquiries(inqData.items || []);
      }
      if (storesRes.ok) {
        const storesData = await storesRes.json();
        if (storesData.stores) {
          setAvailableStores(storesData.stores);
        }
      }
    } catch (err) {
      console.error('Error fetching inquiries:', err);
    } finally {
      setLoadingInquiries(false);
    }
  };

  // Fetch proposals
  const loadUserProposals = async () => {
    setLoadingProposals(true);
    try {
      const token = localStorage.getItem('yaqintop_token') || localStorage.getItem('yaqintop_session_token') || '';
      const [itemRes, photoRes] = await Promise.all([
        fetch(
          apiUrl(`/api/v1/user/proposals?userId=${currentUser?.id || ''}`),
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: 'include'
          }
        ),
        fetch(
          apiUrl(`/api/v1/user/photo-proposals?userId=${currentUser?.id || ''}`),
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: 'include'
          }
        )
      ]);
      if (itemRes.ok) {
        const data = await itemRes.json();
        setProposals(data.items || []);
      }
      if (photoRes.ok) {
        const pdata = await photoRes.json();
        setPhotoProposals(pdata.items || []);
      }
    } catch (err) {
      console.error('Error fetching user proposals:', err);
    } finally {
      setLoadingProposals(false);
    }
  };

  // Load history & favorites from localStorage
  const loadLocalActivity = () => {
    try {
      const savedSearches = localStorage.getItem('yaqintop_search_history');
      if (savedSearches) {
        setSearchHistory(JSON.parse(savedSearches));
      } else {
        setSearchHistory([
          { query: 'Snikers', timestamp: new Date(Date.now() - 3600000).toISOString() },
          { query: 'Non va non mahsulotlari', timestamp: new Date(Date.now() - 7200000).toISOString() },
          { query: 'Coca-Cola 1.5L', timestamp: new Date(Date.now() - 14400000).toISOString() }
        ]);
      }

      const savedStores = localStorage.getItem('yaqintop_viewed_stores');
      if (savedStores) {
        setViewedStoresHistory(JSON.parse(savedStores));
      }

      const savedFavs = localStorage.getItem('yaqintop_favorites');
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
    } catch (e) {
      console.error('Error loading local activity:', e);
    }
  };

  useEffect(() => {
    loadUserReviews();
    loadUserInquiries();
    loadUserProposals();
    loadLocalActivity();
  }, [currentUser?.id]);

  // Delete review
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Haqiqatan ham ushbu sharhni o‘chirmoqchimisiz?')) return;
    try {
      const res = await fetch(apiUrl(`/api/v1/user/reviews/${reviewId}`), { method: 'DELETE' });
      if (res.ok) {
        onShowToast('Sharh o‘chirildi');
        loadUserReviews();
      }
    } catch {
      onShowToast('Xatolik yuz berdi');
    }
  };

  // Create new inquiry
  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInquiryForm.message.trim()) {
      onShowToast('Murojaat matnini kiriting');
      return;
    }

    setIsSubmittingInquiry(true);
    try {
      const res = await fetch(apiUrl('/api/v1/user/inquiries'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: newInquiryForm.storeId || undefined,
          subject: newInquiryForm.subject.trim() || (newInquiryForm.storeId ? 'Do‘konga xaridor murojaati' : 'Xaridor arizasi'),
          category: newInquiryForm.category,
          message: newInquiryForm.message.trim()
        })
      });
      if (res.ok) {
        onShowToast(newInquiryForm.storeId ? 'Murojaatingiz do‘kon va adminga yuborildi!' : 'Murojaatingiz adminga yuborildi!');
        setIsNewInquiryModalOpen(false);
        setNewInquiryForm({ storeId: '', subject: '', category: 'SUPPORT', message: '' });
        loadUserInquiries();
      } else {
        onShowToast('Xatolik yuz berdi');
      }
    } catch {
      onShowToast('Server bilan aloqa uzildi');
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  // Clear history
  const handleClearHistory = () => {
    if (!window.confirm('Barcha qidiruv tarixini tozalashni tasdiqlaysizmi?')) return;
    localStorage.removeItem('yaqintop_search_history');
    localStorage.removeItem('yaqintop_viewed_stores');
    setSearchHistory([]);
    setViewedStoresHistory([]);
    onShowToast('Qidiruv tarixi tozalandi');
  };

  // Remove single favorite
  const handleRemoveFavorite = (id: string) => {
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    localStorage.setItem('yaqintop_favorites', JSON.stringify(updated));
    onShowToast('Sevimlilardan o‘chirildi');
  };

  const filteredProposals = proposals.filter((p) => {
    const matchesFilter =
      proposalStatusFilter === 'ALL'
        ? true
        : proposalStatusFilter === 'APPROVED'
        ? p.status === 'APPROVED' || p.status === 'AUTO_APPROVED'
        : p.status === proposalStatusFilter;
    const matchesSearch =
      !proposalSearch.trim() ||
      p.title?.toLowerCase().includes(proposalSearch.toLowerCase()) ||
      p.storeName?.toLowerCase().includes(proposalSearch.toLowerCase()) ||
      p.category?.toLowerCase().includes(proposalSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredPhotoProposals = photoProposals.filter((p) => {
    const matchesFilter =
      proposalStatusFilter === 'ALL'
        ? true
        : p.status === proposalStatusFilter;
    const matchesSearch =
      !proposalSearch.trim() ||
      p.storeName?.toLowerCase().includes(proposalSearch.toLowerCase()) ||
      p.productTitle?.toLowerCase().includes(proposalSearch.toLowerCase()) ||
      p.comment?.toLowerCase().includes(proposalSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 bg-[#F3F6F3] dark:bg-[#0E1713] overflow-y-auto overflow-x-hidden h-full min-h-0 text-[#172C28] dark:text-[#E8F2EC] flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur border-b border-[#DCE5DF] dark:border-[#22332C] px-4 md:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <button
          onClick={onBackToSearch}
          className="flex items-center gap-2 text-xs md:text-sm font-bold text-[#116B50] dark:text-[#4ADE80] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] px-3 py-2 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Xaritaga qaytish</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95] hidden sm:inline">
            Foydalanuvchi: <strong className="text-[#172C28] dark:text-white">{currentUser?.fullName || 'Otabek Xaridor'}</strong>
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto w-full px-3.5 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 flex flex-col gap-4 sm:gap-6 pb-24 md:pb-12 overflow-x-hidden shrink-0">
        {/* Navigation Tabs */}
        <div
          className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl sm:rounded-3xl p-2 md:p-3 shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none no-scrollbar max-w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {[
            { id: 'favorites', label: `Sevimlilar (${favorites.length})`, icon: Heart },
            { id: 'reviews', label: `Sharhlarim (${reviews.length})`, icon: MessageSquare },
            { id: 'proposals', label: `Takliflarim (${proposals.length + photoProposals.length})`, icon: Sparkles },
            { id: 'inquiries', label: `Murojaatlar & Arizalar (${reports.length + inquiries.length})`, icon: AlertTriangle },
            { id: 'history', label: `Tanlov & Qidiruv Tarixi (${searchHistory.length})`, icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigateSection(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs md:text-sm font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-[#116B50] text-white shadow-md'
                    : 'text-[#566A63] dark:text-[#8B9E95] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822] hover:text-[#172C28] dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#116B50] dark:text-[#4ADE80]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* SECTION 1: SEVIMLILAR (FAVORITES) */}
        {activeSection === 'favorites' && (
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-6 md:p-8 flex flex-col gap-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-[#172C28] dark:text-white">
                  Sevimlilar & Saqlangan do‘konlar
                </h2>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                  Siz saqlab qo‘ygan do‘konlar va ularning real vaqtdagi faollik holati
                </p>
              </div>
            </div>

            {favorites.length === 0 ? (
              <div className="p-12 text-center bg-[#F9FAF9] dark:bg-[#1A2822] rounded-2xl border border-dashed border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 text-2xl">
                  ❤️
                </div>
                <h4 className="font-bold text-sm text-[#172C28] dark:text-white">
                  Hozircha sevimlilar ro‘yxati bo‘sh
                </h4>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] max-w-xs">
                  Xaritada yoki qidiruvda kerakli do‘konni topib, yurakcha (saqlash) tugmasini bosing
                </p>
                <Button variant="primary" size="sm" onClick={onBackToSearch}>
                  Do‘konlarni qidirish →
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="p-4 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-2xl flex flex-col justify-between hover:border-[#116B50] dark:hover:border-[#4ADE80] transition shadow-sm group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <Tag variant="default" className="text-[10px]">
                          Saqlangan
                        </Tag>
                        <button
                          onClick={() => handleRemoveFavorite(fav.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg transition"
                          title="O‘chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="font-extrabold text-base text-[#172C28] dark:text-white">
                        {fav.name || 'Do‘kon'}
                      </h4>
                      <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
                        <span className="truncate">{fav.address || 'Toshkent shahri'}</span>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#DCE5DF]/60 dark:border-[#2A3F36] flex items-center justify-between">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onOpenStore(fav.id)}
                      >
                        Batafsil ko‘rish
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onGetRoute(fav)}
                      >
                        <Navigation className="w-3.5 h-3.5 mr-1" /> Yo‘nalish
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: SHARHLARIM (MY REVIEWS) */}
        {activeSection === 'reviews' && (
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-6 md:p-8 flex flex-col gap-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-[#172C28] dark:text-white">
                  Mening qoldirgan sharhlarim
                </h2>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                  Siz turli do‘konlarga yozgan barcha baholaringiz va mulohazalaringiz
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={loadUserReviews}>
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingReviews ? 'animate-spin' : ''}`} />
                <span>Yangilash</span>
              </Button>
            </div>

            {loadingReviews ? (
              <div className="p-12 text-center text-xs text-[#566A63] dark:text-[#8B9E95]">
                Sharhlar yuklanmoqda...
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-12 text-center bg-[#F9FAF9] dark:bg-[#1A2822] rounded-2xl border border-dashed border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col items-center gap-3">
                <MessageSquare className="w-12 h-12 text-[#566A63] dark:text-[#8B9E95] opacity-40" />
                <h4 className="font-bold text-sm text-[#172C28] dark:text-white">
                  Hozircha hech qanday sharh yozmagansiz
                </h4>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
                  Do‘kon xizmati haqida o‘z fikringizni bildiring va boshqalarga yordam bering!
                </p>
                <Button variant="primary" size="sm" onClick={onBackToSearch}>
                  Xaritadan do‘kon tanlash →
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-2xl flex flex-col gap-3 shadow-sm hover:border-[#116B50]/50 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-[#172C28] dark:text-white">
                            {rev.storeName}
                          </h4>
                          <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                            · {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('uz-UZ') : 'Yaqinda'}
                          </span>
                        </div>
                        <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                          {rev.storeAddress}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{rev.rating} / 5</span>
                        </div>
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-1.5 rounded-lg text-[#B42318] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          title="Sharhni o‘chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC] leading-relaxed">
                      "{rev.comment}"
                    </div>

                    {/* Merchant Reply if exists */}
                    {rev.merchantReply && (
                      <div className="p-3 bg-[#E0EFE7]/40 dark:bg-[#183324]/40 border-l-4 border-[#116B50] dark:border-[#4ADE80] rounded-r-xl text-xs flex flex-col gap-1">
                        <span className="font-bold text-[#116B50] dark:text-[#4ADE80]">
                          💬 Do‘kon ma’muriyati javobi:
                        </span>
                        <p className="text-[#172C28] dark:text-[#E8F2EC]">
                          {rev.merchantReply}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION: TOVAR & XIZMAT TAKLIFLARI (ITEM PROPOSALS) */}
        {activeSection === 'proposals' && (
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-[#172C28] dark:text-white flex items-center gap-2.5">
                  <Sparkles className="w-6 h-6 text-[#116B50] dark:text-[#4ADE80]" />
                  <span>Tovar va Xizmat Takliflarim</span>
                </h2>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                  Tashkilotlarga taklif qilgan tovar va xizmatlaringiz hamda ularning moderatsiya holati
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={loadUserProposals}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingProposals ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="primary" size="sm" onClick={onBackToSearch}>
                  Tashkilot izlash
                </Button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3 top-3" />
                <input
                  type="text"
                  value={proposalSearch}
                  onChange={(e) => setProposalSearch(e.target.value)}
                  placeholder="Tovar nomi, kategoriya yoki do‘kon nomi bo‘yicha izlash..."
                  className="w-full h-10 pl-9 pr-4 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {[
                  { id: 'ALL', label: `Barchasi (${proposals.length + photoProposals.length})` },
                  { id: 'PENDING', label: `Kutilmoqda (${proposals.filter(p => p.status === 'PENDING').length + photoProposals.filter(p => p.status === 'PENDING').length})` },
                  { id: 'APPROVED', label: `Tasdiqlangan (${proposals.filter(p => p.status === 'APPROVED' || p.status === 'AUTO_APPROVED').length + photoProposals.filter(p => p.status === 'APPROVED').length})` },
                  { id: 'REJECTED', label: `Rad etilgan (${proposals.filter(p => p.status === 'REJECTED').length + photoProposals.filter(p => p.status === 'REJECTED').length})` }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setProposalStatusFilter(st.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      proposalStatusFilter === st.id
                        ? 'bg-[#116B50] text-white shadow-xs'
                        : 'bg-white dark:bg-[#14201A] text-[#566A63] dark:text-[#8B9E95] border border-[#DCE5DF] dark:border-[#2A3F36] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Proposals List */}
            {loadingProposals ? (
              <div className="py-16 text-center text-sm text-[#566A63] dark:text-[#8B9E95] flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-3 border-[#116B50] border-t-transparent rounded-full animate-spin" />
                <span>Takliflaringiz yuklanmoqda...</span>
              </div>
            ) : (filteredProposals.length === 0 && filteredPhotoProposals.length === 0) ? (
              <div className="py-16 text-center bg-[#F9FAF9] dark:bg-[#1A2822] rounded-3xl border border-dashed border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col items-center gap-3 p-6">
                <Sparkles className="w-12 h-12 text-[#116B50] dark:text-[#4ADE80] opacity-40" />
                <div className="max-w-md">
                  <h4 className="font-extrabold text-base text-[#172C28] dark:text-[#E8F2EC]">
                    {proposalSearch || proposalStatusFilter !== 'ALL'
                      ? 'Qidiruv bo‘yicha taklif topilmadi'
                      : 'Siz hali tovar, xizmat yoki rasm taklif qilmadingiz'}
                  </h4>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Istalgan tashkilot sahifasiga kirib, yangi tovar yoki rasm taklif qilishingiz mumkin.
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={onBackToSearch} className="mt-2">
                  Tashkilotlarni ko‘rish
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Item Proposals */}
                {filteredProposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-5 rounded-2xl bg-[#F9FAF9] dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col justify-between gap-3.5 hover:shadow-sm transition"
                  >
                    <div className="flex flex-col gap-2">
                      {prop.photoUrl && (
                        <div className="w-full h-36 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-[#DCE5DF] dark:border-[#2A3F36]">
                          <img src={prop.photoUrl} alt="Product" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          {prop.type === 'SERVICE' ? '🛠 Xizmat' : '📦 Tovar'}
                        </span>

                        {prop.status === 'PENDING' && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 animate-pulse text-amber-600 dark:text-amber-400" />
                            <span>Kutilmoqda ({prop.consensusCount || 1}/3)</span>
                          </span>
                        )}
                        {(prop.status === 'APPROVED' || prop.status === 'AUTO_APPROVED') && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Tasdiqlandi</span>
                          </span>
                        )}
                        {prop.status === 'REJECTED' && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span>Rad etildi</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm md:text-base font-extrabold text-[#172C28] dark:text-[#E8F2EC]">
                        {prop.title}
                      </h4>

                      <button
                        type="button"
                        onClick={() => onOpenStore(prop.storeId)}
                        className="text-left text-xs font-semibold text-[#116B50] dark:text-[#4ADE80] hover:underline flex items-center gap-1.5 w-fit"
                      >
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{prop.storeName}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                      </button>

                      <div className="flex items-center gap-2 text-xs text-[#566A63] dark:text-[#8B9E95] flex-wrap mt-0.5">
                        <span className="font-semibold">{prop.category}</span>
                        {prop.price > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-extrabold text-[#116B50] dark:text-[#4ADE80]">
                              {Number(prop.price).toLocaleString('uz-UZ')} so‘m / {prop.packUnit || 'dona'}
                            </span>
                          </>
                        )}
                      </div>

                      {prop.description && (
                        <p className="text-xs text-[#566A63] dark:text-[#CBD5E1] bg-white dark:bg-[#14201A] p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#22332C] mt-1">
                          {prop.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-[#DCE5DF] dark:border-[#22332C] flex items-center justify-between text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                      <span>{new Date(prop.createdAt).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>

                      {prop.status === 'PENDING' && (
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                          Moderator ko‘rib chiqmoqda
                        </span>
                      )}
                      {(prop.status === 'APPROVED' || prop.status === 'AUTO_APPROVED') && (
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          Do‘kon katalogiga qo‘shildi
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Photo Change Proposals */}
                {filteredPhotoProposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-5 rounded-2xl bg-[#F9FAF9] dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col justify-between gap-3.5 hover:shadow-sm transition"
                  >
                    <div className="flex flex-col gap-2.5">
                      <div className="w-full h-44 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-[#DCE5DF] dark:border-[#2A3F36]">
                        <img src={prop.photoUrl} alt="Proposed" className="w-full h-full object-cover" />
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          <span>{prop.targetType === 'STORE' ? 'Tashkilot rasmi' : 'Tovar rasmi'}</span>
                        </span>

                        {prop.status === 'PENDING' && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 animate-pulse text-amber-600 dark:text-amber-400" />
                            <span>Kutilmoqda</span>
                          </span>
                        )}
                        {prop.status === 'APPROVED' && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Tasdiqlangan</span>
                          </span>
                        )}
                        {prop.status === 'REJECTED' && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span>Rad etildi</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm md:text-base font-extrabold text-[#172C28] dark:text-[#E8F2EC]">
                        {prop.targetType === 'STORE' ? prop.storeName : prop.productTitle}
                      </h4>

                      <button
                        type="button"
                        onClick={() => onOpenStore(prop.storeId)}
                        className="text-left text-xs font-semibold text-[#116B50] dark:text-[#4ADE80] hover:underline flex items-center gap-1.5 w-fit"
                      >
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{prop.storeName || 'Do‘kon'}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                      </button>

                      {prop.comment && (
                        <p className="text-xs text-[#566A63] dark:text-[#CBD5E1] bg-white dark:bg-[#14201A] p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#22332C]">
                          «{prop.comment}»
                        </p>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-[#DCE5DF] dark:border-[#22332C] flex items-center justify-between text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                      <span>{new Date(prop.createdAt).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>

                      {prop.status === 'PENDING' && (
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                          Moderator ko‘rib chiqmoqda
                        </span>
                      )}
                      {prop.status === 'APPROVED' && (
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          Rasm yangilandi
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: MUROJAATLAR & ARIZALAR (INQUIRIES & REPORTS) */}
        {activeSection === 'inquiries' && (
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-[#172C28] dark:text-white">
                  Murojaatlar, Arizalar va Shikoyatlar
                </h2>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                  Narx xatosi, tovar yetishmasligi yoki administratorga yuborilgan arizalaringiz holati
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={loadUserInquiries}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingInquiries ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsNewInquiryModalOpen(true)}
                  className="font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yangi murojaat yuborish</span>
                </Button>
              </div>
            </div>

            {/* List of Reports & Inquiries */}
            {reports.length === 0 && inquiries.length === 0 ? (
              <div className="p-12 text-center bg-[#F9FAF9] dark:bg-[#1A2822] rounded-2xl border border-dashed border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col items-center gap-3">
                <FileText className="w-12 h-12 text-[#566A63] dark:text-[#8B9E95] opacity-40" />
                <h4 className="font-bold text-sm text-[#172C28] dark:text-white">
                  Hozircha hech qanday murojaat yoki ariza mavjud emas
                </h4>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
                  Agar do‘konda noto‘g‘ri narx ko‘rsatilgan bo‘lsa yoki savollaringiz bo‘lsa, murojaat qoldiring
                </p>
                <Button variant="primary" size="sm" onClick={() => setIsNewInquiryModalOpen(true)}>
                  Yangi murojaat yozish
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Reports / Incident Tickets */}
                {reports.map((rep) => {
                  const statusMap: Record<string, { label: string; variant: 'warn' | 'default' | 'error' }> = {
                    OPEN: { label: 'Kutilmoqda', variant: 'warn' },
                    RESOLVED: { label: 'Hal etildi (Tasdiqlandi)', variant: 'default' },
                    REJECTED: { label: 'Rad etildi', variant: 'error' }
                  };
                  const currentSt = statusMap[rep.status] || { label: rep.status, variant: 'warn' };

                  return (
                    <div
                      key={rep.id}
                      className="p-5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-2xl flex flex-col gap-2.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Tag variant={currentSt.variant} className="text-xs font-bold">
                              {currentSt.label}
                            </Tag>
                            <span className="text-xs font-extrabold text-[#172C28] dark:text-white">
                              🏢 {rep.storeName}
                            </span>
                            {rep.productName && (
                              <span className="text-xs text-[#116B50] dark:text-[#4ADE80] font-bold">
                                · Tovar: {rep.productName}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] block mt-1">
                            Sana: {new Date(rep.createdAt).toLocaleString('uz-UZ')} · Sabab: {rep.reason}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]">
                        <strong>Shikoyat tafsilotlari:</strong> {rep.details}
                      </div>

                      {rep.resolutionNotes && (
                        <div className="p-3 bg-[#E0EFE7]/50 dark:bg-[#1E362A]/50 border-l-4 border-[#116B50] dark:border-[#4ADE80] rounded-r-xl text-xs text-[#172C28] dark:text-[#E8F2EC]">
                          <strong className="text-[#116B50] dark:text-[#4ADE80] block">
                            ✅ Moderator xulosasi:
                          </strong>
                          {rep.resolutionNotes}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* General Inquiries */}
                {inquiries.map((inq) => {
                  const getStatusInfo = (status: string) => {
                    switch (status) {
                      case 'PENDING_MERCHANT_REPLY':
                        return { label: 'Do‘kon javobi kutilmoqda', variant: 'warn' as const };
                      case 'MERCHANT_SUBMITTED':
                      case 'MERCHANT_REPLIED':
                        return { label: 'Do‘kon javob berdi', variant: 'default' as const };
                      case 'RESOLVED':
                        return { label: 'Hal etildi / Javob berildi', variant: 'default' as const };
                      case 'CLOSED':
                        return { label: 'Yopildi', variant: 'default' as const };
                      case 'PENDING':
                      default:
                        return { label: 'Kutilmoqda (Admin ko‘rib chiqmoqda)', variant: 'warn' as const };
                    }
                  };
                  const statusInfo = getStatusInfo(inq.status);

                  return (
                    <div
                      key={inq.id}
                      className="p-5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-2xl flex flex-col gap-3 shadow-sm hover:border-[#116B50]/40 transition"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Tag variant={statusInfo.variant} className="text-xs font-bold">
                              {statusInfo.label}
                            </Tag>
                            {inq.storeName && inq.storeName !== 'Platforma ma‘muriyati' ? (
                              <span className="text-xs font-extrabold text-[#116B50] dark:text-[#4ADE80] flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" /> {inq.storeName}
                              </span>
                            ) : (
                              <span className="text-xs font-extrabold text-[#566A63] dark:text-[#8B9E95] flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" /> Platforma ma‘muriyati
                              </span>
                            )}
                            {inq.category && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] font-semibold">
                                {inq.category === 'PRICE_ERROR' ? 'Narx xatosi' : inq.category === 'STORE_INFO' ? 'Do‘kon ma‘lumoti' : inq.category === 'SUGGESTION' ? 'Taklif' : 'Yordam'}
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-sm text-[#172C28] dark:text-white mt-0.5">
                            {inq.subject || 'Murojaat'}
                          </h4>
                          <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                            Yuborilgan sana: {new Date(inq.createdAt).toLocaleString('uz-UZ')}
                          </span>
                        </div>
                      </div>

                      {/* Customer's message */}
                      <div className="p-3 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC] leading-relaxed">
                        <span className="font-bold text-[#566A63] dark:text-[#8B9E95] block text-[10px] uppercase mb-1">
                          Sizning xabaringiz:
                        </span>
                        {inq.message}
                      </div>

                      {/* Merchant's reply if available */}
                      {inq.merchantReply && (
                        <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 border-l-4 border-emerald-600 rounded-r-xl text-xs flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <strong className="text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                              💬 {inq.storeName || 'Do‘kon'} rasmiy javobi:
                            </strong>
                            {inq.merchantRepliedAt && (
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                                {new Date(inq.merchantRepliedAt).toLocaleString('uz-UZ')}
                              </span>
                            )}
                          </div>
                          <p className="text-emerald-950 dark:text-emerald-100 whitespace-pre-wrap leading-relaxed mt-0.5">
                            {inq.merchantReply}
                          </p>
                        </div>
                      )}

                      {/* Admin's reply / resolution if available */}
                      {(inq.adminResolutionNotes || inq.adminReply) && (
                        <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border-l-4 border-blue-600 rounded-r-xl text-xs flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <strong className="text-blue-800 dark:text-blue-300 font-bold flex items-center gap-1.5">
                              🛡️ Administrator xulosasi:
                            </strong>
                            {inq.updatedAt && (
                              <span className="text-[10px] text-blue-700 dark:text-blue-400">
                                {new Date(inq.updatedAt).toLocaleString('uz-UZ')}
                              </span>
                            )}
                          </div>
                          <p className="text-blue-950 dark:text-blue-100 whitespace-pre-wrap leading-relaxed mt-0.5">
                            {inq.adminResolutionNotes || inq.adminReply}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: TANLOV VA QIDIRUV TARIXI (HISTORY) */}
        {activeSection === 'history' && (
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-6 md:p-8 flex flex-col gap-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-[#172C28] dark:text-white">
                  Qidiruv va Tanlov Tarixi
                </h2>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                  Yaqinda amalga oshirilgan qidiruvlaringiz va ko‘rilgan do‘konlar jurnali
                </p>
              </div>

              {searchHistory.length > 0 && (
                <Button variant="secondary" size="sm" onClick={handleClearHistory}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
                  <span>Tarixni tozalash</span>
                </Button>
              )}
            </div>

            {searchHistory.length === 0 ? (
              <div className="p-12 text-center bg-[#F9FAF9] dark:bg-[#1A2822] rounded-2xl border border-dashed border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col items-center gap-3">
                <Clock className="w-12 h-12 text-[#566A63] dark:text-[#8B9E95] opacity-40" />
                <h4 className="font-bold text-sm text-[#172C28] dark:text-white">
                  Qidiruv tarixi bo‘sh
                </h4>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
                  Izlagan mahsulotlaringiz bu yerda tezkor qayta qidirish uchun saqlanadi
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-[#116B50] dark:text-[#4ADE80] uppercase tracking-wider">
                  So‘nggi qidiruv so‘rovlari:
                </h3>
                <div className="flex flex-col divide-y divide-[#DCE5DF]/60 dark:divide-[#2A3F36] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-2xl overflow-hidden bg-white dark:bg-[#16241E]">
                  {searchHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 flex items-center justify-between hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822] transition"
                    >
                      <div className="flex items-center gap-3">
                        <Search className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                        <div>
                          <span className="font-bold text-sm text-[#172C28] dark:text-white">
                            {item.query}
                          </span>
                          <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] block">
                            {new Date(item.timestamp).toLocaleString('uz-UZ')}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onSearchQuery(item.query)}
                      >
                        Qayta izlash →
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* NEW INQUIRY / ARIZA MODAL */}
      <Modal
        isOpen={isNewInquiryModalOpen}
        onClose={() => setIsNewInquiryModalOpen(false)}
        title="Yangi Murojaat yoki Ariza Yozish"
      >
        <form onSubmit={handleCreateInquiry} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] mb-1 block">
              Murojaat kimga qaratilgan:
            </label>
            <select
              value={newInquiryForm.storeId}
              onChange={(e) => setNewInquiryForm({ ...newInquiryForm, storeId: e.target.value })}
              className="w-full p-2.5 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]"
            >
              <option value="">🛡️ Platforma Administratori (Umumiy ariza)</option>
              {availableStores.map((s) => (
                <option key={s.id} value={s.id}>
                  🏢 {s.name} ({s.address || s.district || 'Do‘kon'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] mb-1 block">
              Murojaat toifasi:
            </label>
            <select
              value={newInquiryForm.category}
              onChange={(e) => setNewInquiryForm({ ...newInquiryForm, category: e.target.value })}
              className="w-full p-2.5 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]"
            >
              <option value="SUPPORT">Umumiy yordam va savollar</option>
              <option value="PRICE_ERROR">Narx noto‘g‘riligi bo‘yicha ariza</option>
              <option value="STORE_INFO">Do‘kon manzili yoki ish vaqti xatosi</option>
              <option value="STOCK_INQUIRY">Mahsulot mavjudligi haqida so‘rov</option>
              <option value="SUGGESTION">Platformani yaxshilash taklifi</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] mb-1 block">
              Mavzu:
            </label>
            <Input
              value={newInquiryForm.subject}
              onChange={(e) => setNewInquiryForm({ ...newInquiryForm, subject: e.target.value })}
              placeholder="Masalan: Mahsulot narxi peshtaxtada boshqacha chiqdi"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] mb-1 block">
              Batafsil xabar:
            </label>
            <textarea
              rows={4}
              value={newInquiryForm.message}
              onChange={(e) => setNewInquiryForm({ ...newInquiryForm, message: e.target.value })}
              placeholder="Murojaatingizni to‘liq yozing..."
              className="w-full p-3 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC] focus:bg-white dark:focus:bg-[#16241E] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE5DF] dark:border-[#2A3F36]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsNewInquiryModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmittingInquiry}>
              <Send className="w-4 h-4 mr-1.5" />
              {isSubmittingInquiry ? 'Yuborilmoqda...' : 'Murojaatni jo‘natish'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
