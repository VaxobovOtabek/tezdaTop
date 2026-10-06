import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Share2,
  Heart,
  Navigation,
  Star,
  Search,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  AlertOctagon,
  Building2,
  Calendar,
  ChevronRight,
  ChevronLeft,
  X,
  ExternalLink,
  ShieldCheck,
  Tag as TagIcon,
  Sparkles,
  Layers,
  Send,
  User,
  ShoppingBag,
  Info,
  Check
} from 'lucide-react';
import { Button, Tag, StarRating, Modal, Input } from '@yaqintop/ui';
import { Offer, Store } from '@yaqintop/contracts';
import { apiUrl } from '../config/api.js';

interface StoreFullPageViewProps {
  store: any;
  organization?: any;
  offers: Offer[];
  loadingOffers: boolean;
  isDarkMode: boolean;
  userLocation: { lat: number; lng: number };
  matchedOffer?: Offer | null;
  currentUser?: any;
  onRequireAuth?: (msg?: string) => void;
  onBack: () => void;
  onGetRoute: (mode: 'walking' | 'driving') => void;
  onReportError: () => void;
  onShowToast: (msg: string) => void;
}

const DEFAULT_STORE_IMAGES = [
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=1000&auto=format&fit=crop&q=80'
];

const DAYS_UZ = [
  { id: 1, name: 'Dushanba' },
  { id: 2, name: 'Seshanba' },
  { id: 3, name: 'Chorshanba' },
  { id: 4, name: 'Payshanba' },
  { id: 5, name: 'Juma' },
  { id: 6, name: 'Shanba' },
  { id: 0, name: 'Yakshanba' }
];

export function StoreFullPageView({
  store,
  organization,
  offers,
  loadingOffers,
  isDarkMode,
  userLocation,
  matchedOffer,
  currentUser,
  onRequireAuth,
  onBack,
  onGetRoute,
  onReportError,
  onShowToast
}: StoreFullPageViewProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'reviews' | 'about' | 'map'>('catalog');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isFavorite, setIsFavorite] = useState(() => {
    try {
      if (!store?.id) return false;
      const favs = JSON.parse(localStorage.getItem('yaqintop_favorites') || '[]');
      return favs.some((f: any) => f.id === store.id);
    } catch {
      return false;
    }
  });
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync favorite state when store changes
  useEffect(() => {
    if (!store?.id) return;
    try {
      const favs = JSON.parse(localStorage.getItem('yaqintop_favorites') || '[]');
      setIsFavorite(favs.some((f: any) => f.id === store.id));
    } catch {
      setIsFavorite(false);
    }
  }, [store?.id]);

  const toggleFavorite = () => {
    if (!currentUser) {
      onRequireAuth?.('Do‘konni sevimlilarga saqlash uchun iltimos, tizimga kiring!');
      return;
    }
    if (!store?.id) return;
    try {
      const favs: any[] = JSON.parse(localStorage.getItem('yaqintop_favorites') || '[]');
      let updated: any[];
      if (isFavorite) {
        updated = favs.filter((f) => f.id !== store.id);
        setIsFavorite(false);
        onShowToast('Sevimlilardan o‘chirildi');
      } else {
        const newFav = {
          id: store.id,
          name: store.name,
          address: store.address || 'Toshkent shahri',
          rating: store.rating || 4.8,
          photoUrl: store.photoUrl,
          location: store.location,
          savedAt: new Date().toISOString()
        };
        updated = [newFav, ...favs.filter((f) => f.id !== store.id)];
        setIsFavorite(true);
        onShowToast('Sevimlilarga qo‘shildi ❤️');
      }
      localStorage.setItem('yaqintop_favorites', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    userName: currentUser?.name || currentUser?.phone || 'Xaridor',
    comment: ''
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleOpenWriteReview = () => {
    if (!currentUser) {
      onRequireAuth?.('Sharh va baho qoldirish uchun iltimos, tizimga kiring!');
      return;
    }
    setReviewForm((prev) => ({
      ...prev,
      userName: currentUser?.name || currentUser?.phone || 'Xaridor'
    }));
    setIsWriteReviewOpen(true);
  };

  // Report / Inquiry State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('WRONG_PRICE');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleOpenReportModal = () => {
    if (!currentUser) {
      onRequireAuth?.('Murojaat yoki ariza yuborish uchun iltimos, tizimga kiring!');
      return;
    }
    setIsReportModalOpen(true);
  };

  // Fetch reviews for this store
  const loadReviews = async () => {
    if (!store?.id) return;
    setLoadingReviews(true);
    try {
      const res = await fetch(apiUrl(`/api/v1/stores/${store.id}/reviews`));
      if (res.ok) {
        const data = await res.json();
        setReviews(data.items || []);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [store?.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth?.('Sharh va baho qoldirish uchun iltimos, tizimga kiring!');
      setIsWriteReviewOpen(false);
      return;
    }
    if (!reviewForm.comment.trim()) {
      onShowToast('Iltimos, sharh matnini yozing');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch(apiUrl(`/api/v1/stores/${store.id}/reviews`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim(),
          userName: reviewForm.userName || currentUser?.name || currentUser?.phone || 'Xaridor'
        })
      });
      if (res.ok) {
        onShowToast('Sharhingiz qabul qilindi va e’lon qilindi! Rahmat!');
        setReviewForm({ rating: 5, userName: currentUser?.name || currentUser?.phone || 'Xaridor', comment: '' });
        setIsWriteReviewOpen(false);
        loadReviews();
      } else {
        onShowToast('Sharh yuborishda xatolik yuz berdi');
      }
    } catch {
      onShowToast('Server bilan aloqa uzildi');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth?.('Murojaat yuborish uchun iltimos, tizimga kiring!');
      setIsReportModalOpen(false);
      return;
    }
    if (!store?.id) return;
    if (!reportDetails.trim()) {
      onShowToast('Iltimos, xatolik yoki murojaat tafsilotlarini yozing');
      return;
    }

    setIsSubmittingReport(true);
    try {
      const res = await fetch(apiUrl('/api/v1/reports'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          offerId: matchedOffer?.id || undefined,
          reason: reportReason,
          details: reportDetails.trim()
        })
      });
      if (res.ok) {
        onShowToast('Murojaatingiz yuborildi. Administrator tekshirib chiqadi!');
        setIsReportModalOpen(false);
        setReportDetails('');
      } else {
        onShowToast('Xatolik yuz berdi');
      }
    } catch {
      onShowToast('Server bilan aloqa uzildi');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      onShowToast('Do‘kon havolasi buferga nusxalandi 📋');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const storeImages = store?.photoUrl
    ? [store.photoUrl, ...DEFAULT_STORE_IMAGES.slice(1)]
    : DEFAULT_STORE_IMAGES;

  // Categories
  const uniqueCategories = Array.from(
    new Set(offers.map(o => o.variant?.category).filter(Boolean))
  ) as string[];

  // Filtered Offers
  const filteredOffers = offers.filter(offer => {
    const q = productSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      offer.variant.title.toLowerCase().includes(q) ||
      (offer.variant.category && offer.variant.category.toLowerCase().includes(q)) ||
      (offer.variant.barcode && offer.variant.barcode.includes(q));

    const matchCategory =
      selectedCategory === 'ALL' || offer.variant.category === selectedCategory;

    return matchSearch && matchCategory;
  });

  const currentDayOfWeek = new Date().getDay();

  return (
    <div className="flex-1 bg-[#F3F6F3] dark:bg-[#0E1713] overflow-y-auto min-h-screen text-[#172C28] dark:text-[#E8F2EC] flex flex-col">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur border-b border-[#DCE5DF] dark:border-[#22332C] px-4 md:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs md:text-sm font-bold text-[#116B50] dark:text-[#4ADE80] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] px-3 py-2 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Xaritaga qaytish</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenWriteReview}
            className="border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 font-bold hidden sm:flex items-center"
          >
            <Star className="w-3.5 h-3.5 mr-1 fill-amber-400 text-amber-400" />
            <span>Sharh yozish</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenReportModal}
            className="border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 font-bold hidden md:flex items-center"
          >
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            <span>Xato / Murojaat</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={toggleFavorite}
            className={isFavorite ? 'text-rose-600 dark:text-rose-400 border-rose-200' : ''}
          >
            <Heart className={`w-4 h-4 mr-1.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="hidden sm:inline">{isFavorite ? 'Saqlangan' : 'Saqlash'}</span>
          </Button>

          <Button variant="secondary" size="sm" onClick={handleShare}>
            {copiedLink ? <Check className="w-4 h-4 mr-1 text-emerald-500" /> : <Share2 className="w-4 h-4 mr-1.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Nusxalandi' : 'Ulashish'}</span>
          </Button>

          <Button variant="primary" size="sm" onClick={() => onGetRoute('walking')} className="font-bold">
            <Navigation className="w-4 h-4 mr-1.5" />
            <span>Yo‘nalish olish</span>
          </Button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-6xl mx-auto w-full p-4 md:p-8 flex flex-col gap-6">
        {/* HERO SECTION: Gallery & Summary Card */}
        <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-5 md:p-7 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Gallery (Left: 7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden bg-[#E2EEE4] dark:bg-[#182C22] border border-[#DCE5DF] dark:border-[#2A3F36] shadow-inner group">
                <img
                  src={storeImages[activeImageIndex]}
                  alt={store?.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Left/Right Nav */}
                {storeImages.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : storeImages.length - 1))
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-sm text-[#172C28] dark:text-white flex items-center justify-center hover:bg-white dark:hover:bg-black transition shadow"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setActiveImageIndex((prev) => (prev < storeImages.length - 1 ? prev + 1 : 0))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-sm text-[#172C28] dark:text-white flex items-center justify-center hover:bg-white dark:hover:bg-black transition shadow"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Photo Badge */}
                <div className="absolute bottom-3.5 left-4 flex items-center gap-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-black/70 text-white backdrop-blur-sm font-semibold">
                    📸 {activeImageIndex + 1} / {storeImages.length} rasm
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-[#116B50]/90 text-white backdrop-blur-sm font-semibold flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" /> {offers.length} ta tovar & xizmat
                  </span>
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {storeImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                      activeImageIndex === idx
                        ? 'border-[#116B50] dark:border-[#4ADE80] ring-2 ring-[#116B50]/30'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Store Quick Info (Right: 5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {store?.isVerified && (
                    <Tag variant="default" className="text-xs font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" /> Rasmiy tasdiqlangan
                    </Tag>
                  )}
                  <span className="text-xs px-2.5 py-0.5 rounded-lg bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] font-bold">
                    {store?.type === 'WHOLESALE'
                      ? '📦 Ulgurji savdo markazi'
                      : store?.type === 'SERVICE'
                      ? '🛠️ Xizmat ko‘rsatish'
                      : '🏪 Chakana do‘kon'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172C28] dark:text-white tracking-tight mt-2 leading-tight">
                  {store?.name}
                </h1>

                {organization && (
                  <div className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1.5 flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                    <span>
                      {organization.legalName || organization.name}
                      {organization.inn && ` · STIR (INN): ${organization.inn}`}
                    </span>
                  </div>
                )}

                {/* Rating & Distance */}
                <div className="flex items-center gap-3 text-xs text-[#566A63] dark:text-[#8B9E95] mt-3">
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-lg font-bold border border-amber-200 dark:border-amber-900/50">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{store?.rating ? Number(store.rating).toFixed(1) : '4.8'}</span>
                    <span className="font-normal text-[11px] text-amber-600 dark:text-amber-500">
                      ({reviews.length || store?.reviewCount || 12} ta sharh)
                    </span>
                  </div>
                  <span>·</span>
                  <span className="font-semibold text-[#172C28] dark:text-[#E8F2EC]">
                    📍 ~{store?.distanceM || 180} m uzoqlikda
                  </span>
                </div>
              </div>

              {/* Status & Contacts Cards */}
              <div className="bg-[#F9FAF9] dark:bg-[#1A2822] rounded-2xl p-4 border border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col gap-3 text-xs">
                {/* Status */}
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#116B50] dark:text-[#4ADE80] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#116B50] dark:bg-[#4ADE80] animate-pulse" />
                      <span>Ochiq</span>
                      <span className="text-[#566A63] dark:text-[#8B9E95] font-normal">
                        · Bugun {store?.hours?.[0]?.openTime || '08:00'} – {store?.hours?.[0]?.closeTime || '23:00'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                      Har kuni tanaffussiz ishlaydi
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3 pt-2.5 border-t border-[#DCE5DF]/60 dark:border-[#2A3F36]">
                  <MapPin className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#172C28] dark:text-[#E8F2EC]">
                      {store?.address || 'Toshkent shahri'}
                    </span>
                    <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                      Mo‘ljal: Markaziy ko‘cha bo‘yida
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3 pt-2.5 border-t border-[#DCE5DF]/60 dark:border-[#2A3F36]">
                  <Phone className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80] shrink-0 mt-0.5" />
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] block">
                        Aloqa raqami:
                      </span>
                      <a
                        href={`tel:${store?.phone || '+998901234567'}`}
                        className="font-bold text-[#116B50] dark:text-[#4ADE80] text-sm hover:underline"
                      >
                        {store?.phone || '+998 (90) 123-45-67'}
                      </a>
                    </div>
                    <a
                      href={`tel:${store?.phone || '+998901234567'}`}
                      className="px-3 py-1.5 rounded-lg bg-[#116B50] text-white font-bold text-xs hover:bg-[#0B563F] transition"
                    >
                      Qo‘ng‘iroq
                    </a>
                  </div>
                </div>
              </div>

              {/* Primary Route Buttons */}
              <div className="grid grid-cols-2 gap-2.5 mt-1">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => onGetRoute('walking')}
                  className="font-bold py-2.5"
                >
                  <Navigation className="w-4 h-4 mr-1.5" /> Piyoda marshrut
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => onGetRoute('driving')}
                  className="font-bold py-2.5"
                >
                  <Navigation className="w-4 h-4 mr-1.5" /> Mashinada
                </Button>
              </div>

              {/* Secondary Actions: Baholash & Murojaat */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenWriteReview}
                  className="py-2.5 px-3 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <span>Baholash & Sharh</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenReportModal}
                  className="py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Xato / Murojaat</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Highlight Banner if coming from a specific searched product */}
        {matchedOffer && (
          <div className="bg-[#E0EFE7] dark:bg-[#183324] border-2 border-[#116B50] dark:border-[#4ADE80] rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#116B50] text-white flex items-center justify-center font-bold text-lg">
                🎯
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#116B50] dark:text-[#4ADE80]">
                  Siz izlagan mahsulot ushbu do‘konda mavjud:
                </span>
                <h4 className="font-extrabold text-base text-[#172C28] dark:text-white mt-0.5">
                  {matchedOffer.variant?.title}
                </h4>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-extrabold text-[#116B50] dark:text-[#4ADE80]">
                {Number(matchedOffer.price).toLocaleString('uz-UZ')}{' '}
                <small className="text-xs font-normal text-[#566A63] dark:text-[#8B9E95]">
                  so‘m / {matchedOffer.variant?.packUnit || 'dona'}
                </small>
              </div>
              <Tag variant="default" className="text-[10px] mt-1">
                {matchedOffer.stockOnHand} dona mavjud
              </Tag>
            </div>
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-[#DCE5DF] dark:border-[#22332C] pb-px">
          {[
            { id: 'catalog', label: `📦 Tovar va xizmatlar (${offers.length})` },
            { id: 'reviews', label: `⭐ Izohlar & Baholar (${reviews.length})` },
            { id: 'about', label: 'ℹ️ Do‘kon & Ish vaqti' },
            { id: 'map', label: '📍 Xaritadagi o‘rni' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-bold text-xs md:text-sm border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#116B50] dark:border-[#4ADE80] text-[#116B50] dark:text-[#4ADE80] bg-white dark:bg-[#14201A] rounded-t-xl'
                  : 'border-transparent text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: CATALOG OF GOODS & SERVICES */}
        {activeTab === 'catalog' && (
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-5 md:p-7 flex flex-col gap-5 shadow-sm">
            {/* Header with Search & Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#172C28] dark:text-white">
                  Tovar va xizmatlar assortimenti
                </h3>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                  Do‘konda mavjud barcha mahsulotlar, joriy narxlar va qoldiqlar
                </p>
              </div>

              {/* In-Store Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#566A63] dark:text-[#8B9E95]" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Do‘kon tovarlaridan qidirish..."
                  className="w-full h-10 pl-9 pr-8 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs md:text-sm text-[#172C28] dark:text-[#E8F2EC] focus:bg-white dark:focus:bg-[#16241E] focus:outline-none"
                />
                {productSearch && (
                  <button
                    onClick={() => setProductSearch('')}
                    className="absolute right-3 top-3 text-[#566A63] dark:text-[#8B9E95]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            {uniqueCategories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                    selectedCategory === 'ALL'
                      ? 'bg-[#116B50] text-white shadow-sm'
                      : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border border-[#DCE5DF] dark:border-[#2A3F36] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
                  }`}
                >
                  Barchasi ({offers.length})
                </button>
                {uniqueCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-[#116B50] text-white shadow-sm'
                        : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border border-[#DCE5DF] dark:border-[#2A3F36] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
                    }`}
                  >
                    {cat} ({offers.filter(o => o.variant?.category === cat).length})
                  </button>
                ))}
              </div>
            )}

            {/* Catalog Grid / List */}
            {loadingOffers ? (
              <div className="py-16 text-center text-sm text-[#566A63] dark:text-[#8B9E95] flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-3 border-[#116B50] border-t-transparent rounded-full animate-spin" />
                <span>Tovar katalogi yuklanmoqda...</span>
              </div>
            ) : filteredOffers.length === 0 ? (
              <div className="py-16 text-center bg-[#F9FAF9] dark:bg-[#1A2822] rounded-2xl border border-dashed border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col items-center gap-2">
                <ShoppingBag className="w-10 h-10 text-[#566A63] dark:text-[#8B9E95] opacity-40" />
                <h4 className="font-bold text-sm text-[#172C28] dark:text-[#E8F2EC]">
                  Mos keluvchi tovar topilmadi
                </h4>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
                  Qidiruv so‘zini o‘zgartiring yoki toifani tozalang
                </p>
                {productSearch && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setProductSearch('');
                      setSelectedCategory('ALL');
                    }}
                  >
                    Filtrlarni tozalash
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredOffers.map((off) => {
                  const isAvailable = off.stockOnHand > 0;
                  return (
                    <div
                      key={off.id}
                      className="bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-2xl p-4 flex flex-col justify-between hover:border-[#116B50] dark:hover:border-[#4ADE80] transition shadow-sm hover:shadow-md group"
                    >
                      <div>
                        {/* Top Category & Freshness Badge */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95]">
                            {off.variant.category || 'Umumiy'}
                          </span>
                          <span className="text-[10px] font-semibold text-[#116B50] dark:text-[#4ADE80]">
                            {off.freshness === 'NEW' ? '✨ Yangilangan' : '✓ Tekshirilgan'}
                          </span>
                        </div>

                        {/* Product Title */}
                        <h4 className="font-bold text-sm text-[#172C28] dark:text-white leading-snug group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] transition">
                          {off.variant.title}
                        </h4>

                        {off.variant.barcode && (
                          <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] font-mono mt-1">
                            Barkod: {off.variant.barcode}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#DCE5DF]/60 dark:border-[#2A3F36] flex items-end justify-between">
                        <div>
                          <div className="text-base font-extrabold text-[#116B50] dark:text-[#4ADE80]">
                            {Number(off.price).toLocaleString('uz-UZ')}{' '}
                            <span className="text-xs font-normal text-[#566A63] dark:text-[#8B9E95]">
                              so‘m
                            </span>
                          </div>
                          <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                            1 {off.variant.packUnit || 'dona'} uchun
                          </span>
                        </div>

                        <Tag
                          variant={
                            off.stockOnHand > 10
                              ? 'default'
                              : isAvailable
                              ? 'warn'
                              : 'error'
                          }
                          className="text-[10px]"
                        >
                          {isAvailable ? `${off.stockOnHand} dona` : 'Tugagan'}
                        </Tag>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REVIEWS & RATINGS */}
        {activeTab === 'reviews' && (
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-5 md:p-7 flex flex-col gap-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#172C28] dark:text-white">
                  Xaridorlar fikri va baholari
                </h3>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                  Do‘kon xizmati va mahsulot sifatiga berilgan haqqoniy sharhlar
                </p>
              </div>

              <Button
                variant="primary"
                onClick={handleOpenWriteReview}
                className="font-bold flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Sharh qoldirish</span>
              </Button>
            </div>

            {/* Guest notice banner in reviews */}
            {!currentUser && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Siz mehmon holatidasiz. Sharh yoki baho qoldirish uchun hisobingiz bilan tizimga kiring.</span>
                </div>
                <button
                  onClick={handleOpenWriteReview}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 transition"
                >
                  Tizimga kirish
                </button>
              </div>
            )}

            {/* Rating Overview Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-2xl border border-[#DCE5DF] dark:border-[#2A3F36]">
              <div className="flex flex-col items-center justify-center text-center p-3">
                <span className="text-5xl font-extrabold text-[#116B50] dark:text-[#4ADE80]">
                  {store?.rating ? Number(store.rating).toFixed(1) : '4.8'}
                </span>
                <div className="flex items-center gap-1 my-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-5 h-5 ${
                        s <= Math.round(store?.rating || 4.8)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-medium">
                  {reviews.length || 12} ta baholash asosida
                </span>
              </div>

              <div className="md:col-span-2 flex flex-col justify-center gap-2 text-xs">
                {[
                  { star: '5 yulduz', percent: '80%', count: 10 },
                  { star: '4 yulduz', percent: '15%', count: 2 },
                  { star: '3 yulduz', percent: '5%', count: 1 },
                  { star: '2 yulduz', percent: '0%', count: 0 },
                  { star: '1 yulduz', percent: '0%', count: 0 }
                ].map((row) => (
                  <div key={row.star} className="flex items-center gap-3">
                    <span className="w-16 text-[#566A63] dark:text-[#8B9E95] font-medium">{row.star}</span>
                    <div className="flex-1 h-2 rounded-full bg-[#DCE5DF] dark:bg-[#2A3F36] overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: row.percent }}
                      />
                    </div>
                    <span className="w-8 text-right font-bold text-[#172C28] dark:text-white">
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews List */}
            {loadingReviews ? (
              <div className="py-12 text-center text-xs text-[#566A63] dark:text-[#8B9E95]">
                Sharhlar yuklanmoqda...
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-12 text-center bg-[#F9FAF9] dark:bg-[#1A2822] rounded-2xl border border-dashed border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col items-center gap-2">
                <MessageSquare className="w-8 h-8 text-[#566A63] dark:text-[#8B9E95] opacity-40" />
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
                  Hozircha sharhlar mavjud emas. Birinchi bo‘lib sharh qoldiring!
                </p>
                <Button variant="secondary" size="sm" onClick={handleOpenWriteReview}>
                  Sharh yozish
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {reviews.map((rev: any) => (
                  <div
                    key={rev.id}
                    className="p-4 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-2xl flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#116B50]/15 dark:bg-[#4ADE80]/15 text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center font-bold text-xs">
                          {rev.userName ? rev.userName.slice(0, 2).toUpperCase() : 'XA'}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-[#172C28] dark:text-white">
                            {rev.userName || 'Mijoz'}
                          </span>
                          <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] block">
                            {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('uz-UZ') : 'Bugun'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-[#172C28] dark:text-[#E8F2EC] mt-1 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ABOUT STORE & WORKING HOURS */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Working Hours Schedule */}
            <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-5 md:p-7 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#116B50] dark:text-[#4ADE80]" />
                <h3 className="text-lg font-bold text-[#172C28] dark:text-white">
                  Ish vaqti jadvali
                </h3>
              </div>

              <div className="flex flex-col divide-y divide-[#DCE5DF]/60 dark:divide-[#2A3F36] text-xs">
                {DAYS_UZ.map((d) => {
                  const isToday = d.id === currentDayOfWeek;
                  return (
                    <div
                      key={d.id}
                      className={`py-3 flex items-center justify-between ${
                        isToday
                          ? 'bg-[#E0EFE7]/50 dark:bg-[#1E362A]/50 px-3 -mx-3 rounded-xl font-bold'
                          : 'text-[#566A63] dark:text-[#8B9E95]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{d.name}</span>
                        {isToday && (
                          <Tag variant="default" className="text-[10px] py-0 px-1.5">
                            Bugun
                          </Tag>
                        )}
                      </div>
                      <span className={isToday ? 'text-[#116B50] dark:text-[#4ADE80]' : 'text-[#172C28] dark:text-[#E8F2EC]'}>
                        08:00 – 23:00 (Ochiq)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legal Organization Info */}
            <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-5 md:p-7 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#116B50] dark:text-[#4ADE80]" />
                <h3 className="text-lg font-bold text-[#172C28] dark:text-white">
                  Tashkilot rekvizitlari
                </h3>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                <div className="p-3 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36]">
                  <span className="text-[#566A63] dark:text-[#8B9E95] block text-[11px]">
                    Yuridik nomi:
                  </span>
                  <span className="font-bold text-[#172C28] dark:text-white text-sm">
                    {organization?.legalName || organization?.name || store?.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36]">
                    <span className="text-[#566A63] dark:text-[#8B9E95] block text-[11px]">
                      STIR (INN):
                    </span>
                    <span className="font-bold font-mono text-[#172C28] dark:text-white">
                      {organization?.inn || '308912847'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36]">
                    <span className="text-[#566A63] dark:text-[#8B9E95] block text-[11px]">
                      Faoliyat turi:
                    </span>
                    <span className="font-bold text-[#172C28] dark:text-white">
                      {store?.type === 'WHOLESALE' ? 'Ulgurji' : 'Chakana savdo'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36]">
                  <span className="text-[#566A63] dark:text-[#8B9E95] block text-[11px]">
                    Do‘kon to‘liq manzili:
                  </span>
                  <span className="font-semibold text-[#172C28] dark:text-white">
                    {store?.address || 'Toshkent shahri, Yunusobod tumani'}
                  </span>
                </div>

                <div className="mt-2 flex gap-2">
                  <Button
                    variant="quiet"
                    size="sm"
                    fullWidth
                    onClick={onReportError}
                    className="text-[#B42318] dark:text-[#F87171] hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <AlertOctagon className="w-3.5 h-3.5 mr-1" />
                    Ma’lumotlarda xatolikni xabar qilish
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MAP & NAVIGATION */}
        {activeTab === 'map' && (
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-5 md:p-7 flex flex-col gap-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-[#172C28] dark:text-white">
                  Xaritadagi joylashuvi
                </h3>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
                  GPS koordinatalari: {store?.location?.lat || '41.311081'}, {store?.location?.lng || '69.240562'}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={() => onGetRoute('walking')}>
                  <Navigation className="w-4 h-4 mr-1.5" /> Piyoda marshrut
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onGetRoute('driving')}>
                  <Navigation className="w-4 h-4 mr-1.5" /> Mashinada
                </Button>
              </div>
            </div>

            {/* Map Preview Banner */}
            <div className="w-full h-80 rounded-2xl bg-gradient-to-br from-[#E2EEE4] to-[#C8E4D0] dark:from-[#182C22] dark:to-[#112019] border border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-[#14201A] shadow-lg flex items-center justify-center text-3xl mb-3 animate-bounce">
                📍
              </div>
              <h4 className="font-extrabold text-lg text-[#172C28] dark:text-white">
                {store?.name}
              </h4>
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95] max-w-md mt-1">
                {store?.address}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Button variant="primary" onClick={onBack}>
                  Interaktiv Xaritada ochish →
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* WRITE REVIEW MODAL */}
      <Modal
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
        title="Do‘kon haqida sharh va baho qoldirish"
      >
        <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] mb-1.5 block">
              Bahoingizni tanlang:
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                  className="p-1.5 rounded-lg hover:scale-110 transition"
                >
                  <Star
                    className={`w-7 h-7 ${
                      s <= reviewForm.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-amber-600 ml-2">
                {reviewForm.rating} / 5 yulduz
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] mb-1.5 block">
              Ismingiz:
            </label>
            <Input
              value={reviewForm.userName}
              onChange={(e) => setReviewForm({ ...reviewForm, userName: e.target.value })}
              placeholder="Ismingizni kiriting"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] mb-1.5 block">
              Sharhingiz:
            </label>
            <textarea
              rows={4}
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="Mahsulotlar sifati, narxlarning to‘g‘riligi va xizmat ko‘rsatish haqida yozing..."
              className="w-full p-3 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs md:text-sm text-[#172C28] dark:text-[#E8F2EC] focus:bg-white dark:focus:bg-[#16241E] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE5DF] dark:border-[#2A3F36]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsWriteReviewOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmittingReview}>
              <Send className="w-4 h-4 mr-1.5" />
              {isSubmittingReview ? 'Yuborilmoqda...' : 'Sharhni e’lon qilish'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* REPORT / INQUIRY MODAL */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Ma’lumotlarni tuzatish yoki xato haqida murojaat"
      >
        <form onSubmit={handleSubmitReport} className="flex flex-col gap-4">
          <div className="p-3 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] text-xs">
            <span className="text-[#566A63] dark:text-[#8B9E95] block">Do‘kon:</span>
            <strong className="text-[#172C28] dark:text-white text-sm">{store?.name}</strong>
            <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] block mt-0.5">{store?.address}</span>
          </div>

          <div>
            <label className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] mb-1.5 block">
              Murojaat / Muammo turi:
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full p-2.5 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] outline-none"
            >
              <option value="WRONG_PRICE">Narx noto‘g‘ri ko‘rsatilgan (Kassada boshqa narx)</option>
              <option value="UNAVAILABLE_PRODUCT">Mahsulot do‘konda mavjud emas</option>
              <option value="WRONG_LOCATION">Do‘kon lokatsiyasi yoki kirish joyi xato</option>
              <option value="CLOSED_STORE">Do‘kon yopiq yoki faoliyat ko‘rsatmayapti</option>
              <option value="WRONG_HOURS">Ish vaqti noto‘g‘ri yozilgan</option>
              <option value="OTHER">Boshqa masala yoki ma’lumotni tuzatish</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] mb-1.5 block">
              Batafsil izoh va to‘g‘ri ma’lumot:
            </label>
            <textarea
              rows={4}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Qanday xatolik aniqlandi? Iltimos, aniqroq ma’lumot bering (administrator tezda tekshirib tuzatadi)..."
              className="w-full p-3 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs md:text-sm text-[#172C28] dark:text-[#E8F2EC] focus:bg-white dark:focus:bg-[#16241E] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE5DF] dark:border-[#2A3F36]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsReportModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmittingReport} className="font-bold">
              <Send className="w-4 h-4 mr-1.5" />
              {isSubmittingReport ? 'Yuborilmoqda...' : 'Murojaatni jo‘natish'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
