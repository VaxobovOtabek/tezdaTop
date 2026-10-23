import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  PlusCircle,
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
  Check,
  CheckCircle2,
  XCircle,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Button, Tag, StarRating, Modal, Input } from '@yaqintop/ui';
import { Offer, Store, isTradeOrganization } from '@yaqintop/contracts';
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

  // Crowdsourced Item Proposal State
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [storeProposals, setStoreProposals] = useState<any[]>([]);
  const [loadingStoreProposals, setLoadingStoreProposals] = useState(false);
  const [proposalFeedback, setProposalFeedback] = useState<{
    type: 'success' | 'auto_approved' | 'error';
    message: string;
  } | null>(null);
  const [proposalForm, setProposalForm] = useState({
    title: '',
    type: 'PRODUCT' as 'PRODUCT' | 'SERVICE',
    category: '',
    price: '',
    stockOnHand: '10',
    packUnit: 'dona',
    barcode: '',
    photoUrl: '',
    description: ''
  });

  // Photo Change Request State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoModalTarget, setPhotoModalTarget] = useState<'STORE' | 'PRODUCT'>('STORE');
  const [photoModalVariantId, setPhotoModalVariantId] = useState<string | undefined>(undefined);
  const [photoModalProductTitle, setPhotoModalProductTitle] = useState<string | undefined>(undefined);
  const [photoFormUrl, setPhotoFormUrl] = useState('');
  const [photoFormComment, setPhotoFormComment] = useState('');
  const [isSubmittingPhoto, setIsSubmittingPhoto] = useState(false);
  const [storePhotoProposals, setStorePhotoProposals] = useState<any[]>([]);

  const handleOpenPhotoModal = (target: 'STORE' | 'PRODUCT', variantId?: string, productTitle?: string) => {
    if (!currentUser) {
      onRequireAuth?.('Rasm taklif qilish yoki o‘zgartirish uchun iltimos, tizimga kiring');
      return;
    }
    setPhotoModalTarget(target);
    setPhotoModalVariantId(variantId);
    setPhotoModalProductTitle(productTitle);
    setPhotoFormUrl('');
    setPhotoFormComment('');
    setIsPhotoModalOpen(true);
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 900;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            setter(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            setter(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to read image file:', err);
      onShowToast('Rasmni yuklashda xatolik');
    }
  };

  const handleSubmitPhotoProposal = async () => {
    if (!photoFormUrl.trim()) {
      onShowToast('Iltimos, rasm tanlang yoki rasm havolasini kiriting');
      return;
    }
    const token = localStorage.getItem('yaqintop_session_token') || '';
    setIsSubmittingPhoto(true);

    try {
      const res = await fetch(apiUrl(`/api/v1/stores/${store.id}/photo-proposals`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          targetType: photoModalTarget,
          variantId: photoModalVariantId,
          photoUrl: photoFormUrl.trim(),
          comment: photoFormComment.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast('📸 Rasm taklifingiz muvaffaqiyatli qabul qilindi va moderatsiyaga yuborildi!');
        setIsPhotoModalOpen(false);
        setPhotoFormUrl('');
        setPhotoFormComment('');
        await loadStoreProposals();
      } else {
        onShowToast(data.message || 'Xatolik yuz berdi');
      }
    } catch {
      onShowToast('Server bilan aloqada xatolik yuz berdi');
    } finally {
      setIsSubmittingPhoto(false);
    }
  };

  const handleOpenProposalModal = () => {
    if (!currentUser) {
      onRequireAuth?.('Tovar yoki xizmat taklif qilish uchun iltimos, tizimga kiring');
      return;
    }
    setProposalFeedback(null);
    setProposalForm({
      title: '',
      type: 'PRODUCT',
      category: '',
      price: '',
      stockOnHand: '10',
      packUnit: 'dona',
      barcode: '',
      photoUrl: '',
      description: ''
    });
    setIsProposalModalOpen(true);
  };

  const handleSubmitProposal = async () => {
    if (!proposalForm.title.trim()) {
      onShowToast('Iltimos, tovar yoki xizmat nomini kiriting');
      return;
    }
    const token = localStorage.getItem('yaqintop_session_token') || '';
    setIsSubmittingProposal(true);
    setProposalFeedback(null);

    try {
      const res = await fetch(apiUrl(`/api/v1/stores/${store.id}/proposals`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          title: proposalForm.title.trim(),
          type: proposalForm.type,
          category: proposalForm.category.trim() || (proposalForm.type === 'SERVICE' ? 'Xizmatlar' : 'Oziq-ovqat'),
          price: Number(proposalForm.price) || 0,
          stockOnHand: Number(proposalForm.stockOnHand) || 1,
          packUnit: proposalForm.packUnit,
          barcode: proposalForm.barcode.trim() || undefined,
          photoUrl: proposalForm.photoUrl.trim() || undefined,
          description: proposalForm.description.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await loadStoreProposals();
        if (data.autoApproved) {
          setProposalFeedback({
            type: 'auto_approved',
            message: data.message
          });
          onShowToast('🎉 3 ta foydalanuvchi konsensusi: Tovar avtomatik tasdiqlandi!');
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          setProposalFeedback({
            type: 'success',
            message: data.message || 'Taklifingiz muvaffaqiyatli qabul qilindi va moderator ko‘rib chiqishiga yuborildi'
          });
          onShowToast('Taklifingiz qabul qilindi va moderatsiyaga yuborildi');
        }
      } else {
        setProposalFeedback({
          type: 'error',
          message: data.message || 'Taklifni yuborishda xatolik yuz berdi'
        });
      }
    } catch {
      setProposalFeedback({
        type: 'error',
        message: 'Server bilan bog‘lanishda xatolik yuz berdi'
      });
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  // Load store item proposals
  const loadStoreProposals = async () => {
    if (!store?.id) return;
    try {
      setLoadingStoreProposals(true);
      const [itemRes, photoRes] = await Promise.all([
        fetch(apiUrl(`/api/v1/stores/${store.id}/proposals`)),
        fetch(apiUrl(`/api/v1/stores/${store.id}/photo-proposals`))
      ]);
      if (itemRes.ok) {
        const d = await itemRes.json();
        setStoreProposals(d.items || []);
      }
      if (photoRes.ok) {
        const pd = await photoRes.json();
        setStorePhotoProposals(pd.items || []);
      }
    } catch (e) {
      console.error('Failed to load store proposals', e);
    } finally {
      setLoadingStoreProposals(false);
    }
  };

  useEffect(() => {
    loadStoreProposals();
  }, [store?.id]);

  const myProposalsForThisStore = storeProposals.filter(
    (p) => currentUser && (p.userId === currentUser.id || (currentUser.phone && p.userPhone === currentUser.phone))
  );

  const myPhotoProposalsForThisStore = storePhotoProposals.filter(
    (p) => currentUser && (p.userId === currentUser.id || (currentUser.phone && p.userPhone === currentUser.phone))
  );

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

                {/* Photo Badge & Suggest Store Photo */}
                <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-black/70 text-white backdrop-blur-sm font-semibold">
                      📸 {activeImageIndex + 1} / {storeImages.length} rasm
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-[#116B50]/90 text-white backdrop-blur-sm font-semibold flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5" /> {offers.length} ta tovar & xizmat
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenPhotoModal('STORE')}
                    className="text-xs px-3 py-1 rounded-full bg-white/90 dark:bg-black/80 hover:bg-white dark:hover:bg-black text-[#172C28] dark:text-white backdrop-blur-sm font-bold flex items-center gap-1.5 shadow transition active:scale-95 cursor-pointer"
                    title="Tashkilot rasmini yangilash yoki taklif qilish"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                    <span className="hidden sm:inline">Rasm taklif qilish</span>
                  </button>
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
                      : !isTradeOrganization(store?.type)
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

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                {/* In-Store Search Bar */}
                <div className="relative flex-1 md:w-72">
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

                <button
                  type="button"
                  onClick={handleOpenProposalModal}
                  className="h-10 px-3.5 md:px-4 rounded-xl bg-[#116B50] hover:bg-[#0D523D] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer shrink-0"
                  title="Do‘konga tovar yoki xizmat taklif qilish"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">+ Tovar/xizmat taklif qilish</span>
                  <span className="sm:hidden">+ Taklif</span>
                </button>
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

            {/* USER'S PROPOSALS IN THIS STORE */}
            {(myProposalsForThisStore.length > 0 || myPhotoProposalsForThisStore.length > 0) && (
              <div className="mb-6 p-4 md:p-5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-emerald-50/40 to-teal-50/30 dark:from-[#17251E] dark:via-[#13201A] dark:to-[#111A15] border border-amber-200/90 dark:border-[#2C4A3B] shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-3.5 pb-2.5 border-b border-amber-200/60 dark:border-[#2C4A3B]">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <Clock className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs md:text-sm font-extrabold text-[#172C28] dark:text-[#E8F2EC] flex items-center gap-2">
                        <span>Siz ushbu tashkilotga taklif qilgan ma’lumotlar</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#116B50] text-white">
                          {myProposalsForThisStore.length + myPhotoProposalsForThisStore.length}
                        </span>
                      </h4>
                      <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                        Kiritilgan tovar, xizmat va rasmlar moderator tomonidan ko‘rib chiqilmoqda
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPhotoModal('STORE')}
                      className="text-xs font-bold text-[#116B50] dark:text-[#4ADE80] hover:underline flex items-center gap-1 shrink-0"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Rasm taklif qilish</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenProposalModal}
                      className="text-xs font-bold text-[#116B50] dark:text-[#4ADE80] hover:underline flex items-center gap-1 shrink-0"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Tovar/xizmat taklif qilish</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {myProposalsForThisStore.map((prop) => (
                    <div
                      key={prop.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-[#1A2A22] border border-[#DCE5DF] dark:border-[#2C4A3B] shadow-2xs flex flex-col justify-between gap-2.5"
                    >
                      <div>
                        {prop.photoUrl && (
                          <div className="w-full h-24 mb-2 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                            <img src={prop.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            {prop.type === 'SERVICE' ? '🛠 Xizmat' : '📦 Tovar'}
                          </span>
                          {prop.status === 'PENDING' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 flex items-center gap-1">
                              <Clock className="w-3 h-3 animate-pulse text-amber-600 dark:text-amber-400" /> Kutilmoqda
                            </span>
                          )}
                          {(prop.status === 'APPROVED' || prop.status === 'AUTO_APPROVED') && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Tasdiqlandi
                            </span>
                          )}
                          {prop.status === 'REJECTED' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Rad etildi
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-xs md:text-sm text-[#172C28] dark:text-[#E8F2EC] line-clamp-2">
                          {prop.title}
                        </h5>
                        <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1 flex items-center gap-2 flex-wrap">
                          <span>{prop.category}</span>
                          {prop.price > 0 && (
                            <>
                              <span>•</span>
                              <span className="font-extrabold text-[#116B50] dark:text-[#4ADE80]">
                                {Number(prop.price).toLocaleString('uz-UZ')} so‘m / {prop.packUnit || 'dona'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E8EEEA] dark:border-[#243B30] flex items-center justify-between text-[10px] text-[#6E827B] dark:text-[#7A9388]">
                        <span>{new Date(prop.createdAt).toLocaleDateString('uz-UZ')}</span>
                        {prop.status === 'PENDING' && (
                          <span className="font-semibold text-amber-700 dark:text-amber-400">
                            Konsensus: {prop.consensusCount || 1}/3
                          </span>
                        )}
                        {(prop.status === 'APPROVED' || prop.status === 'AUTO_APPROVED') && (
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            Katalogga qo‘shilgan
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Photo Proposals */}
                  {myPhotoProposalsForThisStore.map((prop) => (
                    <div
                      key={prop.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-[#1A2A22] border border-[#DCE5DF] dark:border-[#2C4A3B] shadow-2xs flex flex-col justify-between gap-2.5"
                    >
                      <div>
                        <div className="w-full h-24 mb-2 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img src={prop.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300">
                            📸 {prop.targetType === 'STORE' ? 'Tashkilot rasmi' : 'Tovar rasmi'}
                          </span>
                          {prop.status === 'PENDING' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 flex items-center gap-1">
                              <Clock className="w-3 h-3 animate-pulse text-amber-600 dark:text-amber-400" /> Kutilmoqda
                            </span>
                          )}
                          {prop.status === 'APPROVED' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Yangilandi
                            </span>
                          )}
                          {prop.status === 'REJECTED' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Rad etildi
                            </span>
                          )}
                        </div>
                        <h5 className="font-bold text-xs md:text-sm text-[#172C28] dark:text-[#E8F2EC] line-clamp-1">
                          {prop.targetType === 'STORE' ? (store?.name || 'Do‘kon') : (prop.productTitle || 'Tovar')}
                        </h5>
                        {prop.comment && (
                          <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1 line-clamp-2 italic">
                            «{prop.comment}»
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#E8EEEA] dark:border-[#243B30] flex items-center justify-between text-[10px] text-[#6E827B] dark:text-[#7A9388]">
                        <span>{new Date(prop.createdAt).toLocaleDateString('uz-UZ')}</span>
                        {prop.status === 'PENDING' && (
                          <span className="font-semibold text-amber-700 dark:text-amber-400">
                            Moderatsiya kutilmoqda
                          </span>
                        )}
                        {prop.status === 'APPROVED' && (
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            Rasm tasdiqlangan
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
                  const isService = off.variant.kind === 'SERVICE';
                  const isAvailable = isService ? off.status === 'ACTIVE' : off.stockOnHand > 0;
                  return (
                    <div
                      key={off.id}
                      className="bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-2xl p-4 flex flex-col justify-between hover:border-[#116B50] dark:hover:border-[#4ADE80] transition shadow-sm hover:shadow-md group"
                    >
                      <div>
                        {/* Product Photo if available */}
                        {off.variant.photoUrl ? (
                          <div className="relative w-full h-32 mb-2.5 rounded-xl overflow-hidden bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF]/60 dark:border-[#2A3F36]">
                            <img
                              src={off.variant.photoUrl}
                              alt={off.variant.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <button
                              type="button"
                              onClick={() => handleOpenPhotoModal('PRODUCT', off.variantId, off.variant.title)}
                              className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition cursor-pointer"
                              title="Rasmni o‘zgartirish"
                            >
                              <Camera className="w-3 h-3" />
                            </button>
                          </div>
                        ) : null}

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

                        {!off.variant.photoUrl && (
                          <button
                            type="button"
                            onClick={() => handleOpenPhotoModal('PRODUCT', off.variantId, off.variant.title)}
                            className="mt-2 text-[10px] font-semibold text-[#116B50] dark:text-[#4ADE80] hover:underline flex items-center gap-1 cursor-pointer"
                            title="Ushbu tovar uchun rasm taklif qilish"
                          >
                            <Camera className="w-3 h-3" />
                            <span>+ Rasm taklif qilish</span>
                          </button>
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
                          {isService ? `${off.variant.durationMinutes || ''} daqiqa · Xizmat` : isAvailable ? `${off.stockOnHand} dona` : 'Tugagan'}
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

      {/* CROWDSOURCED ITEM PROPOSAL MODAL */}
      <Modal
        isOpen={isProposalModalOpen}
        onClose={() => {
          if (!isSubmittingProposal) {
            setIsProposalModalOpen(false);
            setProposalFeedback(null);
          }
        }}
        title="Tovar yoki xizmat taklif qilish"
      >
        <div className="flex flex-col gap-4 text-xs md:text-sm">
          {/* Info Banner on 3-user consensus rule */}
          <div className="p-3.5 rounded-2xl bg-[#E0EFE7] dark:bg-[#1C3328] border border-[#116B50]/30 dark:border-[#4ADE80]/30 text-[#172C28] dark:text-[#E8F2EC] flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-[#116B50] dark:text-[#4ADE80] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-extrabold text-[#116B50] dark:text-[#4ADE80]">Kraudsorring qoidasi:</span> Siz taklif qilgan tovar yoki xizmat admin, moderator yoki do‘kon egasi tasdiqlaganidan so‘ng katalogga qo‘shiladi.
              <div className="mt-1 font-semibold text-[#0D523D] dark:text-[#86EFAC]">
                ✨ Agar <span className="underline font-bold">3 xil foydalanuvchi</span> bir xil narsani qo‘shsa, u administratorlarsiz <b>avtomatik tasdiqlanadi</b> hamda o‘rtacha narxi va soni qo‘yiladi!
              </div>
            </div>
          </div>

          {/* Feedback Banner if submitted */}
          {proposalFeedback && (
            <div className={`p-3.5 rounded-xl text-xs font-bold flex items-start gap-2 animate-in fade-in duration-200 ${
              proposalFeedback.type === 'auto_approved'
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                : proposalFeedback.type === 'success'
                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                : 'bg-red-100 dark:bg-red-950/80 text-red-900 dark:text-red-200 border border-red-300 dark:border-red-700'
            }`}>
              <span>{proposalFeedback.type === 'auto_approved' ? '🎉' : proposalFeedback.type === 'success' ? '⏳' : '⚠️'}</span>
              <div className="flex-1 leading-normal">{proposalFeedback.message}</div>
            </div>
          )}

          {/* Type Toggle: Product vs Service */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95]">Turi</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F3F6F3] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36]">
              <button
                type="button"
                onClick={() => setProposalForm(f => ({ ...f, type: 'PRODUCT', packUnit: f.packUnit === 'xizmat' ? 'dona' : f.packUnit }))}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  proposalForm.type === 'PRODUCT'
                    ? 'bg-white dark:bg-[#116B50] text-[#116B50] dark:text-white shadow-xs'
                    : 'text-[#566A63] dark:text-[#8B9E95]'
                }`}
              >
                <span>🛒</span> <span>Mahsulot (Tovar)</span>
              </button>
              <button
                type="button"
                onClick={() => setProposalForm(f => ({ ...f, type: 'SERVICE', packUnit: 'xizmat', stockOnHand: '1' }))}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  proposalForm.type === 'SERVICE'
                    ? 'bg-white dark:bg-[#116B50] text-[#116B50] dark:text-white shadow-xs'
                    : 'text-[#566A63] dark:text-[#8B9E95]'
                }`}
              >
                <span>🛠️</span> <span>Xizmat ko‘rsatish</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95]">
              {proposalForm.type === 'SERVICE' ? 'Xizmat nomi' : 'Tovar nomi'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={proposalForm.title}
              onChange={(e) => setProposalForm(f => ({ ...f, title: e.target.value }))}
              placeholder={proposalForm.type === 'SERVICE' ? 'Masalan: Avtomobil moyini almashtirish' : 'Masalan: Coca-Cola 1.5L'}
              className="w-full h-10 px-3.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] text-xs md:text-sm font-semibold text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95]">Kategoriya</label>
            <input
              type="text"
              value={proposalForm.category}
              onChange={(e) => setProposalForm(f => ({ ...f, category: e.target.value }))}
              placeholder="Masalan: Ichimliklar, Oziq-ovqat, Xizmatlar..."
              list="store-categories-list"
              className="w-full h-10 px-3.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] text-xs md:text-sm text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
            />
            <datalist id="store-categories-list">
              {uniqueCategories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95]">
                Narxi (so‘m) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={proposalForm.price}
                onChange={(e) => setProposalForm(f => ({ ...f, price: e.target.value }))}
                placeholder="15000"
                className="w-full h-10 px-3.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] text-xs md:text-sm font-bold text-[#116B50] dark:text-[#4ADE80] focus:outline-none focus:border-[#116B50]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95]">
                {proposalForm.type === 'SERVICE' ? 'Bajarish soni' : 'Taxminiy soni / qoldiq'}
              </label>
              <input
                type="number"
                min="1"
                value={proposalForm.stockOnHand}
                onChange={(e) => setProposalForm(f => ({ ...f, stockOnHand: e.target.value }))}
                placeholder="10"
                className="w-full h-10 px-3.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] text-xs md:text-sm text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
              />
            </div>
          </div>

          {/* Pack unit & Barcode */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95]">O‘lchov birligi</label>
              <select
                value={proposalForm.packUnit}
                onChange={(e) => setProposalForm(f => ({ ...f, packUnit: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] text-xs text-[#172C28] dark:text-white focus:outline-none"
              >
                <option value="dona">dona</option>
                <option value="kg">kg (kilogramm)</option>
                <option value="litr">litr</option>
                <option value="quti">quti / blok</option>
                <option value="metr">metr</option>
                <option value="xizmat">xizmat</option>
                <option value="soat">soat</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95]">Shtrix-kod (ixtiyoriy)</label>
              <input
                type="text"
                value={proposalForm.barcode}
                onChange={(e) => setProposalForm(f => ({ ...f, barcode: e.target.value }))}
                placeholder="478000..."
                className="w-full h-10 px-3.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] text-xs text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
              />
            </div>
          </div>

          {/* Photo for Item Proposal */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95] flex items-center justify-between">
              <span>{proposalForm.type === 'SERVICE' ? 'Xizmat rasmi' : 'Tovar rasmi'} (ixtiyoriy)</span>
              {proposalForm.photoUrl && (
                <button
                  type="button"
                  onClick={() => setProposalForm(f => ({ ...f, photoUrl: '' }))}
                  className="text-[11px] text-red-500 hover:underline cursor-pointer"
                >
                  O‘chirish
                </button>
              )}
            </label>

            {proposalForm.photoUrl ? (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#DCE5DF] dark:border-[#2A3F36] bg-[#F3F6F3] dark:bg-[#1A2822]">
                <img src={proposalForm.photoUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="flex-1 h-10 px-3.5 rounded-xl border border-dashed border-[#116B50] dark:border-[#4ADE80] bg-[#E0EFE7]/40 dark:bg-[#16241E] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] text-xs font-semibold text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center gap-2 cursor-pointer transition">
                  <Camera className="w-4 h-4" />
                  <span>Suratga olish / Fayl yuklash</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoFileUpload(e, (url) => setProposalForm(f => ({ ...f, photoUrl: url })))}
                  />
                </label>
                <input
                  type="url"
                  placeholder="Yoki rasm URL manzili..."
                  value={proposalForm.photoUrl}
                  onChange={(e) => setProposalForm(f => ({ ...f, photoUrl: e.target.value }))}
                  className="flex-1 h-10 px-3.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] text-xs text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
                />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#DCE5DF] dark:border-[#2A3F36]">
            <button
              type="button"
              disabled={isSubmittingProposal}
              onClick={() => {
                setIsProposalModalOpen(false);
                setProposalFeedback(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] hover:bg-gray-100 dark:hover:bg-[#1E2E25] transition cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              disabled={isSubmittingProposal || !proposalForm.title.trim()}
              onClick={handleSubmitProposal}
              className="px-5 py-2.5 rounded-xl bg-[#116B50] hover:bg-[#0D523D] disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {isSubmittingProposal ? (
                <span>Yuborilmoqda...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Taklifni yuborish</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* PHOTO CHANGE / SUGGESTION MODAL */}
      <Modal
        isOpen={isPhotoModalOpen}
        onClose={() => {
          if (!isSubmittingPhoto) {
            setIsPhotoModalOpen(false);
            setPhotoFormUrl('');
            setPhotoFormComment('');
          }
        }}
        title={
          photoModalTarget === 'STORE'
            ? '📸 Tashkilot rasmini taklif qilish / yangilash'
            : `📸 Tovarga rasm taklif qilish: ${photoModalProductTitle || ''}`
        }
      >
        <div className="flex flex-col gap-4 text-xs md:text-sm">
          {/* Info Banner on moderation */}
          <div className="p-3.5 rounded-2xl bg-[#E0EFE7] dark:bg-[#1C3328] border border-[#116B50]/30 dark:border-[#4ADE80]/30 text-[#172C28] dark:text-[#E8F2EC] flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-[#116B50] dark:text-[#4ADE80] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-extrabold text-[#116B50] dark:text-[#4ADE80]">Moderatsiya qoidasi:</span>{' '}
              Siz taklif qilgan rasm moderator yoki platforma administratori tomonidan tekshirilib, tasdiqlanganidan so‘ng ommaga ko‘rinadi.
            </div>
          </div>

          {/* Photo File Upload or URL */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95]">
              Suratni tanlang <span className="text-red-500">*</span>
            </label>

            {photoFormUrl ? (
              <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden border border-[#DCE5DF] dark:border-[#2A3F36] bg-[#F3F6F3] dark:bg-[#1A2822] group">
                <img src={photoFormUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoFormUrl('')}
                  className="absolute top-2 right-2 px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs shadow-md hover:bg-red-700 transition cursor-pointer"
                >
                  Rasmni o‘chirish
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <label className="w-full h-28 rounded-2xl border-2 border-dashed border-[#116B50]/60 dark:border-[#4ADE80]/60 bg-[#E0EFE7]/30 dark:bg-[#16241E] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] flex flex-col items-center justify-center gap-2 cursor-pointer transition p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#116B50]/10 dark:bg-[#4ADE80]/10 flex items-center justify-center text-[#116B50] dark:text-[#4ADE80]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#116B50] dark:text-[#4ADE80]">Suratga olish yoki Galereyadan tanlash</span>
                    <p className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">JPEG, PNG, WebP formatlari qo‘llab-quvvatlanadi</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoFileUpload(e, setPhotoFormUrl)}
                  />
                </label>

                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-[#DCE5DF] dark:bg-[#2A3F36]" />
                  <span className="text-[11px] font-semibold text-[#566A63] dark:text-[#8B9E95]">yoki internetdan havola</span>
                  <div className="h-px flex-1 bg-[#DCE5DF] dark:bg-[#2A3F36]" />
                </div>

                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={photoFormUrl}
                  onChange={(e) => setPhotoFormUrl(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] text-xs text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
                />
              </div>
            )}
          </div>

          {/* Comment / Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95]">
              Izoh yoki tavsif (ixtiyoriy)
            </label>
            <textarea
              rows={2}
              value={photoFormComment}
              onChange={(e) => setPhotoFormComment(e.target.value)}
              placeholder={photoModalTarget === 'STORE' ? "Masalan: Do‘kon yangi peshtoqi va tashqi ko‘rinishi" : "Masalan: Yangi qadoqdagi ko‘rinishi"}
              className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] text-xs text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCE5DF] dark:border-[#2A3F36]">
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmittingPhoto}
              onClick={() => setIsPhotoModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={isSubmittingPhoto || !photoFormUrl.trim()}
              onClick={handleSubmitPhotoProposal}
              className="bg-[#116B50] hover:bg-[#0D523D] text-white font-bold"
            >
              {isSubmittingPhoto ? 'Yuborilmoqda...' : 'Moderatsiyaga yuborish'}
            </Button>
          </div>
        </div>
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
