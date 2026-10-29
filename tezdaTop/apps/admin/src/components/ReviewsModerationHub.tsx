import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Star,
  Shield,
  CheckCircle2,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  Building2,
  User,
  RefreshCw,
  AlertTriangle,
  Clock,
  Sparkles,
  Store,
  MessageCircle
} from 'lucide-react';
import { Button, Tag, Modal } from '@yaqintop/ui';

export interface AdminReview {
  id: string;
  storeId: string;
  storeName?: string;
  storeAddress?: string;
  organizationName?: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  status: 'PUBLISHED' | 'HIDDEN' | 'PENDING' | 'REJECTED';
  merchantReply?: string;
  merchantRepliedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewsModerationHubProps {
  isDarkMode: boolean;
  onShowToast: (msg: string) => void;
  onStatsUpdate?: () => void;
  stores?: { id: string; name: string }[];
}

const getReviewAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('yaqintop_token') || localStorage.getItem('yaqintop_session_token') || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function ReviewsModerationHub({
  isDarkMode,
  onShowToast,
  onStatsUpdate,
  stores = []
}: ReviewsModerationHubProps) {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'PENDING' | 'HIDDEN'>('ALL');
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');
  const [storeFilter, setStoreFilter] = useState<string>('ALL');

  // Deletion modal state
  const [reviewToDelete, setReviewToDelete] = useState<AdminReview | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status updating state
  const [updatingReviewId, setUpdatingReviewId] = useState<string | null>(null);

  // Fetch reviews from API
  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/reviews', {
        credentials: 'include',
        headers: getReviewAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      } else {
        // Fallback demo/seed reviews if endpoint responds with error
        onShowToast('Sharhlar ro‘yxatini yuklashda ogohlantirish');
      }
    } catch (err) {
      console.error('[Load Reviews Error]', err);
      onShowToast('Server bilan bog‘lanishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  // Update Review Status (PUBLISHED, HIDDEN, REJECTED)
  const handleUpdateStatus = async (reviewId: string, newStatus: 'PUBLISHED' | 'HIDDEN' | 'REJECTED') => {
    setUpdatingReviewId(reviewId);
    try {
      const res = await fetch(`/api/v1/admin/reviews/${reviewId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getReviewAuthHeaders()
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (res.ok) {
        onShowToast(
          newStatus === 'PUBLISHED'
            ? 'Sharh tasdiqlandi va saytda faollashtirildi!'
            : 'Sharh saytdan yashirildi.'
        );
        // Update state locally
        setReviews(prev =>
          prev.map(r => (r.id === reviewId ? { ...r, status: newStatus } : r))
        );
        onStatsUpdate?.();
      } else {
        onShowToast(data.message || 'Holatni yangilashda xatolik');
      }
    } catch {
      onShowToast('Server bilan aloqa xatosi');
    } finally {
      setUpdatingReviewId(null);
    }
  };

  // Delete review
  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/reviews/${reviewToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getReviewAuthHeaders()
      });

      const data = await res.json();
      if (res.ok) {
        onShowToast('Sharh butunlay o‘chirildi');
        setReviews(prev => prev.filter(r => r.id !== reviewToDelete.id));
        setReviewToDelete(null);
        onStatsUpdate?.();
      } else {
        onShowToast(data.message || 'Sharhni o‘chirishda xatolik');
      }
    } catch {
      onShowToast('Server bilan aloqa xatosi');
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics calculation
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalReviews).toFixed(1)
    : '0.0';
  const pendingReviewsCount = reviews.filter(r => r.status === 'PENDING' || r.status === 'HIDDEN').length;
  const positiveReviewsCount = reviews.filter(r => r.rating >= 4).length;
  const positivePercent = totalReviews > 0
    ? Math.round((positiveReviewsCount / totalReviews) * 100)
    : 100;

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      // Search query
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (r.userName && r.userName.toLowerCase().includes(q)) ||
        (r.storeName && r.storeName.toLowerCase().includes(q)) ||
        (r.comment && r.comment.toLowerCase().includes(q)) ||
        (r.merchantReply && r.merchantReply.toLowerCase().includes(q));

      // Status filter
      let matchStatus = true;
      if (statusFilter === 'PUBLISHED') matchStatus = r.status === 'PUBLISHED';
      else if (statusFilter === 'PENDING') matchStatus = r.status === 'PENDING';
      else if (statusFilter === 'HIDDEN') matchStatus = r.status === 'HIDDEN' || r.status === 'REJECTED';

      // Rating filter
      let matchRating = true;
      if (ratingFilter !== 'ALL') {
        matchRating = r.rating === parseInt(ratingFilter, 10);
      }

      // Store filter
      let matchStore = true;
      if (storeFilter !== 'ALL') {
        matchStore = r.storeId === storeFilter;
      }

      return matchSearch && matchStatus && matchRating && matchStore;
    });
  }, [reviews, searchQuery, statusFilter, ratingFilter, storeFilter]);

  // Star visual renderer
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
        <span className="ml-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
          {rating}.0
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#116B50] to-[#0B563F] text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-200 uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Platforma Sifat & Fikrlar Markazi</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1 flex items-center gap-3">
            <span>Sharhlar va Baholar Moderatsiyasi</span>
            {pendingReviewsCount > 0 && (
              <span className="min-w-6 h-6 px-2 bg-amber-500 text-white text-xs font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
                {pendingReviewsCount}
              </span>
            )}
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
            Xaridorlarning do‘konlar, tovarlar va xizmatlar haqidagi fikr-mulohazalarini tekshiring, nomaqbul yoki qoidabuzar sharhlarni yashiring yoki tasdiqlang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadReviews}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Yangilash</span>
          </button>
        </div>
      </div>

      {/* 4 Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Reviews */}
        <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#566A63] dark:text-[#8B9E95] font-medium">Jami sharhlar</div>
            <div className="text-xl font-extrabold text-[#172C28] dark:text-white mt-0.5">{totalReviews} ta</div>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 fill-amber-500" />
          </div>
          <div>
            <div className="text-xs text-[#566A63] dark:text-[#8B9E95] font-medium">O‘rtacha platforma bahosi</div>
            <div className="text-xl font-extrabold text-[#172C28] dark:text-white mt-0.5 flex items-center gap-1">
              <span>{avgRating}</span>
              <span className="text-xs text-amber-500">★</span>
            </div>
          </div>
        </div>

        {/* Pending Moderation */}
        <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#566A63] dark:text-[#8B9E95] font-medium">Moderatsiyada / Kutilmoqda</div>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-2">
              <span>{pendingReviewsCount} ta</span>
              {pendingReviewsCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded font-black">
                  DIQQAT
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Positive Sentiment */}
        <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#566A63] dark:text-[#8B9E95] font-medium">Ijobiy fikrlar (4-5 ★)</div>
            <div className="text-xl font-extrabold text-[#172C28] dark:text-white mt-0.5">
              {positivePercent}% <span className="text-xs text-[#566A63] font-normal">({positiveReviewsCount} ta)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Do‘kon nomi, xaridor ismi yoki sharh matnidan izlash..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] rounded-xl text-xs text-[#172C28] dark:text-white placeholder-[#566A63] focus:outline-none focus:border-[#116B50]"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: `Barchasi (${reviews.length})` },
            { id: 'PUBLISHED', label: `Faol (${reviews.filter(r => r.status === 'PUBLISHED').length})` },
            { id: 'PENDING', label: `Moderatsiyada (${reviews.filter(r => r.status === 'PENDING').length})` },
            { id: 'HIDDEN', label: `Yashirilgan (${reviews.filter(r => r.status === 'HIDDEN' || r.status === 'REJECTED').length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-[#116B50] text-white shadow-sm'
                  : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Rating Filter Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={ratingFilter}
            onChange={e => setRatingFilter(e.target.value)}
            className="px-3 py-2 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] rounded-xl text-xs font-bold text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
          >
            <option value="ALL">Barcha baholar (1-5 ★)</option>
            <option value="5">5 yulduz ★★★★★</option>
            <option value="4">4 yulduz ★★★★☆</option>
            <option value="3">3 yulduz ★★★☆☆</option>
            <option value="2">2 yulduz ★★☆☆☆</option>
            <option value="1">1 yulduz ★☆☆☆☆</option>
          </select>
        </div>
      </div>

      {/* Reviews Cards List */}
      <div className="flex flex-col gap-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#172C28] dark:text-white">Sharhlar topilmadi</h3>
            <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 max-w-sm">
              Tanlangan filtrlar yoki qidiruv so‘rovi bo‘yicha hech qanday xaridor sharhi mavjud emas.
            </p>
          </div>
        ) : (
          filteredReviews.map(review => {
            const isPublished = review.status === 'PUBLISHED';
            const isHidden = review.status === 'HIDDEN' || review.status === 'REJECTED';
            const isPending = review.status === 'PENDING';

            return (
              <div
                key={review.id}
                className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-4"
              >
                {/* Header: Store info, Stars, Status Tag */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE5DF]/60 dark:border-[#22332C]/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#172C28] dark:text-white flex items-center gap-2">
                        <span>{review.storeName || 'Do‘kon'}</span>
                        {review.organizationName && (
                          <span className="text-[11px] font-normal text-[#566A63] dark:text-[#8B9E95]">
                            ({review.organizationName})
                          </span>
                        )}
                      </div>
                      {review.storeAddress && (
                        <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                          {review.storeAddress}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {renderStars(review.rating || 5)}

                    {isPublished && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Saytda faol</span>
                      </span>
                    )}

                    {isHidden && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Yashirilgan</span>
                      </span>
                    )}

                    {isPending && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Moderatsiyada</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Body: Reviewer info & comment */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs text-[#566A63] dark:text-[#8B9E95]">
                    <div className="flex items-center gap-1.5 font-bold text-[#172C28] dark:text-white">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{review.userName || 'Mijoz'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(review.createdAt).toLocaleString('uz-UZ')}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F9FAF9] dark:bg-[#1A2822] border border-[#DCE5DF]/80 dark:border-[#22332C] text-xs text-[#172C28] dark:text-gray-200 leading-relaxed font-medium">
                    "{review.comment}"
                  </div>

                  {/* Merchant Reply (if any) */}
                  {review.merchantReply && (
                    <div className="ml-4 pl-3.5 border-l-2 border-[#116B50] flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-[#116B50] dark:text-[#4ADE80]">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Do‘kon boshqaruvchisi javobi:</span>
                        {review.merchantRepliedAt && (
                          <span className="text-[10px] font-normal text-[#566A63] dark:text-[#8B9E95]">
                            ({new Date(review.merchantRepliedAt).toLocaleDateString('uz-UZ')})
                          </span>
                        )}
                      </div>
                      <p className="text-[#566A63] dark:text-gray-300 bg-[#E0EFE7]/40 dark:bg-[#1E362A]/40 p-2.5 rounded-lg border border-[#116B50]/20">
                        {review.merchantReply}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer: Moderator Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-[#DCE5DF]/50 dark:border-[#22332C]/50">
                  <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                    ID: <code className="font-mono text-[10px]">{review.id.slice(0, 8)}...</code>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* If NOT published -> Approve / Publish button */}
                    {!isPublished ? (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={updatingReviewId === review.id}
                        onClick={() => handleUpdateStatus(review.id, 'PUBLISHED')}
                        className="bg-[#116B50] hover:bg-[#0B563F] text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Saytda chiqarish (Tasdiqlash)</span>
                      </Button>
                    ) : (
                      /* If published -> Hide button */
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={updatingReviewId === review.id}
                        onClick={() => handleUpdateStatus(review.id, 'HIDDEN')}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Yashirish (Nomaqbul deb topish)</span>
                      </Button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => setReviewToDelete(review)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center justify-center border border-transparent hover:border-rose-200"
                      title="Sharhni o‘chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {reviewToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setReviewToDelete(null)}
          title="Sharhni butunlay o‘chirish"
        >
          <div className="flex flex-col gap-4 text-xs text-[#172C28] dark:text-white">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-bold">Diqqat! Bu amalni bekor qilib bo‘lmaydi.</p>
                <p className="mt-0.5">Ushbu sharh ma’lumotlar bazasidan butunlay o‘chiriladi va do‘kon reytingi qayta hisoblanadi.</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-[#1A2822] rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="font-bold">{reviewToDelete.userName} ({reviewToDelete.rating} ★):</div>
              <p className="mt-1 italic text-gray-600 dark:text-gray-300">"{reviewToDelete.comment}"</p>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReviewToDelete(null)}
                disabled={isDeleting}
              >
                Bekor qilish
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isDeleting ? 'O‘chirilmoqda...' : 'Ha, o‘chirilsin'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
