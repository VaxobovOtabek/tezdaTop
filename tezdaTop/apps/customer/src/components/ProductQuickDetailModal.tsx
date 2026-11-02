import React, { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  Store as StoreIcon,
  Navigation,
  Bookmark,
  Check,
  Star,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Eye,
  Search,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { StoreSearchResult, Offer } from '@yaqintop/contracts';
import { getProductThumbnail, DEFAULT_PRODUCT_THUMBNAIL } from '../utils/product-thumbnails';
import { Button } from '@yaqintop/ui';

export interface ProductQuickDetailModalProps {
  isOpen: boolean;
  item: StoreSearchResult | null;
  onClose: () => void;
  onOpenStorePage: (store: StoreSearchResult['store']) => void;
  onNavigateRoute: (store: StoreSearchResult['store']) => void;
  onSearchQuery?: (q: string) => void;
  onBookmarkProduct?: (productTitle: string) => void;
  isBookmarked?: boolean;
}

export const ProductQuickDetailModal: React.FC<ProductQuickDetailModalProps> = ({
  isOpen,
  item,
  onClose,
  onOpenStorePage,
  onNavigateRoute,
  onSearchQuery,
  onBookmarkProduct,
  isBookmarked = false
}) => {
  // If the user selects a similar product inside the modal, preview that offer
  const [activeOffer, setActiveOffer] = useState<Offer | null>(null);
  const [bookmarkedLocal, setBookmarkedLocal] = useState(isBookmarked);

  // Sync active offer when modal opens with a new item
  useEffect(() => {
    if (item) {
      setActiveOffer(item.bestOffer);
      setBookmarkedLocal(isBookmarked);
    } else {
      setActiveOffer(null);
    }
  }, [item, isBookmarked]);

  // Handle ESC key press to dismiss modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const currentOffer = activeOffer || item.bestOffer;
  const currentVariant = currentOffer.variant;
  const formattedPrice = Number(currentOffer.price).toLocaleString('uz-UZ');
  const store = item.store;

  // Format distance
  const distanceText =
    item.distanceM === 0
      ? 'Siz turgan joyda (0 m)'
      : item.distanceM >= 1000
      ? `Sizdan ${(item.distanceM / 1000).toFixed(1)} km`
      : `Sizdan ${item.distanceM} m`;

  const handleToggleBookmark = () => {
    setBookmarkedLocal(!bookmarkedLocal);
    onBookmarkProduct?.(currentVariant.title);
  };

  const similarList = item.similarProducts || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-modal-title"
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#DCE5DF]/70 dark:border-[#22332C] bg-[#F9FAF9] dark:bg-[#16241E] shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] text-xs font-bold">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{currentVariant.category || 'Mahsulot ma‘lumoti'}</span>
            </span>
            {currentVariant.brand && (
              <span className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
                {currentVariant.brand}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Modalni yopish"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-[#E8F2EC] hover:bg-[#E0EFE7]/60 dark:hover:bg-[#203328] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Main Hero: Product Photo & Pricing */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
            {/* Product Thumbnail (Crisp 112x112 px image) */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-[#F3F6F3] dark:bg-[#1A2822] border-2 border-[#DCE5DF] dark:border-[#2A3F36] overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-sm">
              <img
                src={getProductThumbnail(currentVariant)}
                alt={currentVariant.title}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_THUMBNAIL;
                }}
              />
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold backdrop-blur-xs">
                {currentVariant.packSize || currentVariant.packUnit || 'dona'}
              </span>
            </div>

            {/* Product Title, Price & Stock Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h2
                id="product-detail-modal-title"
                className="text-lg sm:text-xl font-black text-[#172C28] dark:text-[#E8F2EC] leading-snug"
              >
                {currentVariant.title}
              </h2>

              {/* Price Highlight */}
              <div className="mt-2 flex items-baseline justify-center sm:justify-start gap-1.5 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-[#116B50] dark:text-[#4ADE80]">
                  {formattedPrice} so‘m
                </span>
                <span className="text-xs font-medium text-[#566A63] dark:text-[#8B9E95]">
                  / {currentVariant.packUnit || 'dona'}
                </span>
              </div>

              {/* Badges: In Stock & Freshness */}
              <div className="mt-3 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                    currentOffer.stockOnHand > 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#116B50] dark:text-[#4ADE80] border border-emerald-200/60 dark:border-emerald-800/60'
                      : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {currentOffer.stockOnHand > 0
                      ? `${currentOffer.stockOnHand} dona mavjud`
                      : 'Qoldiq tugagan'}
                  </span>
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border border-[#DCE5DF] dark:border-[#2A3F36]">
                  <Clock className="w-3.5 h-3.5 opacity-70" />
                  <span>
                    {currentOffer.freshness === 'NEW'
                      ? 'Bugun yangilangan'
                      : currentOffer.freshness === 'STALE'
                      ? '2 kun oldin'
                      : 'Yaqinda tekshirilgan'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Store Availability Card */}
          <div className="p-4 rounded-2xl bg-[#F9FAF9] dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#22332C] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-[#172C28] dark:text-[#E8F2EC] truncate">
                    {store.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.isOpenNow
                        ? 'bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]'
                        : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {item.isOpenNow ? '● Hozir ochiq' : '○ Yopiq'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                  <span className="flex items-center gap-1 font-semibold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{store.rating || 4.8}</span>
                  </span>
                  <span>·</span>
                  <span className="truncate">{store.address || 'Toshkent shahri'}</span>
                </div>
              </div>

              {/* Distance pill */}
              <div className="shrink-0 text-right">
                <span
                  title="Siz turgan nuqtadan to‘g‘ridan-to‘g‘ri masofa"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E0EFE7]/80 dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] text-xs font-bold"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{distanceText}</span>
                </span>
              </div>
            </div>

            {/* Action Buttons for Store & Route */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => {
                  onOpenStorePage(store);
                  onClose();
                }}
                className="font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <StoreIcon className="w-3.5 h-3.5" />
                <span>Do‘konni ko‘rish</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onNavigateRoute(store);
                  onClose();
                }}
                className="font-bold text-xs flex items-center gap-1.5 shrink-0 border-[#DCE5DF] dark:border-[#2A3F36]"
                title="Do‘konga piyoda marshrut chizish"
              >
                <Navigation className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                <span>Marshrut</span>
              </Button>

              <button
                type="button"
                onClick={handleToggleBookmark}
                title="Narx yoki qoldiq o‘zgarganda xabardor qilish"
                aria-label="Mahsulotni kuzatuvga olish"
                className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${
                  bookmarkedLocal
                    ? 'bg-[#116B50] text-white border-[#116B50]'
                    : 'bg-white dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border-[#DCE5DF] dark:border-[#2A3F36] hover:text-[#116B50]'
                }`}
              >
                {bookmarkedLocal ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Similar Products Section ("O‘xshash tovarlar kichik bir ikonka bo‘lib") */}
          <div className="pt-2 border-t border-[#DCE5DF]/70 dark:border-[#22332C]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                <h3 className="text-xs sm:text-sm font-bold text-[#172C28] dark:text-[#E8F2EC]">
                  O‘xshash tovarlar va muqobillar
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#566A63] dark:text-[#8B9E95]">
                {similarList.length > 0 ? `${similarList.length} ta variant` : 'Mavjud variantlar'}
              </span>
            </div>

            {similarList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {similarList.map((altOffer) => {
                  const isCurrent = altOffer.id === currentOffer.id;
                  const altThumb = getProductThumbnail(altOffer.variant);
                  const altPrice = Number(altOffer.price).toLocaleString('uz-UZ');

                  return (
                    <div
                      key={altOffer.id}
                      onClick={() => setActiveOffer(altOffer)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#E0EFE7]/50 dark:bg-[#1A3125] border-[#116B50] dark:border-[#4ADE80] shadow-xs'
                          : 'bg-[#F9FAF9] dark:bg-[#16241E] border-[#DCE5DF]/70 dark:border-[#24372E] hover:border-[#116B50]/60 dark:hover:border-[#4ADE80]/60 hover:bg-[#F3F8F5] dark:hover:bg-[#1A2E24]'
                      }`}
                    >
                      {/* Left: Small Thumbnail Icon (40x40 px) + Details */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#2A3F36] overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-2xs group-hover:scale-105 transition-transform">
                          <img
                            src={altThumb}
                            alt={altOffer.variant.title}
                            className="w-full h-full object-cover rounded-md"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_THUMBNAIL;
                            }}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] truncate">
                            {altOffer.variant.title}
                          </div>
                          <div className="text-xs font-black text-[#116B50] dark:text-[#4ADE80] mt-0.5">
                            {altPrice} so‘m{' '}
                            <span className="text-[10px] font-normal text-[#566A63] dark:text-[#8B9E95]">
                              / {altOffer.variant.packUnit || 'dona'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Action Pill */}
                      <div className="shrink-0 ml-2">
                        {isCurrent ? (
                          <span className="text-[10px] font-bold text-[#116B50] dark:text-[#4ADE80] bg-white dark:bg-[#16241E] px-2 py-0.5 rounded border border-[#116B50]/40">
                            Ko‘rilmoqda
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSearchQuery) {
                                onSearchQuery(altOffer.variant.title);
                                onClose();
                              } else {
                                setActiveOffer(altOffer);
                              }
                            }}
                            title="Shu tovar bo‘yicha qidirish"
                            className="p-1.5 rounded-lg bg-white dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:text-[#116B50] dark:hover:text-[#4ADE80] border border-[#DCE5DF] dark:border-[#2A3F36] transition"
                          >
                            <Search className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Fallback popular alternative suggestions */
              <div className="flex flex-wrap gap-2">
                {['Snickers 80 g Super', 'Mars 50 g', 'Twix 50 g', 'Bounty 57 g'].map((altName) => (
                  <button
                    key={altName}
                    type="button"
                    onClick={() => {
                      if (onSearchQuery) {
                        onSearchQuery(altName);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl bg-[#F9FAF9] dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#273B32] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] text-xs font-semibold text-[#172C28] dark:text-[#E8F2EC] transition cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md bg-white dark:bg-[#14201A] overflow-hidden shrink-0 flex items-center justify-center p-0.5 border border-[#DCE5DF] dark:border-[#2A3F36]">
                      <img
                        src={getProductThumbnail({ title: altName })}
                        alt=""
                        className="w-full h-full object-cover rounded-xs"
                      />
                    </div>
                    <span>{altName}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#566A63] dark:text-[#8B9E95]" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-3 border-t border-[#DCE5DF]/70 dark:border-[#22332C] bg-[#F9FAF9] dark:bg-[#16241E] flex items-center justify-between text-xs text-[#566A63] dark:text-[#8B9E95]">
          <span>Tovar haqidagi ma’lumot do‘kon tomonidan taqdim etilgan</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-[#116B50] dark:text-[#4ADE80] hover:underline"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
