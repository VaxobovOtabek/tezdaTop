import React, { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  ArrowLeft,
  X,
  Star,
  Search,
  ShoppingBag,
  Building2,
  CheckCircle2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Button } from '@yaqintop/ui';
import { Offer } from '@yaqintop/contracts';
import { getProductThumbnail, DEFAULT_PRODUCT_THUMBNAIL } from '../utils/product-thumbnails';
import { getStoreBannerImage, getTodayHoursText } from '../utils/store-images';

export interface OrganizationSidebarShowcaseProps {
  selectedStoreItem: any;
  activeStoreOffers: Offer[];
  loadingOffers: boolean;
  onClose: () => void;
  onOpenStorePage: (store: any) => void;
  onNavigateRoute: (store: any) => void;
  onSelectProduct: (offer: Offer) => void;
}

export const OrganizationSidebarShowcase: React.FC<OrganizationSidebarShowcaseProps> = ({
  selectedStoreItem,
  activeStoreOffers,
  loadingOffers,
  onClose,
  onOpenStorePage,
  onNavigateRoute,
  onSelectProduct
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [visibleLimit, setVisibleLimit] = useState(8);

  useEffect(() => {
    setVisibleLimit(8);
  }, [internalSearch, selectedCategory]);

  const currentStore = selectedStoreItem?.store || selectedStoreItem;
  const currentOrg = selectedStoreItem?.organization;
  const isOpen = selectedStoreItem?.isOpenNow ?? true;
  const distanceM = selectedStoreItem?.distanceM;

  const distanceText =
    distanceM !== undefined
      ? distanceM === 0
        ? 'Siz turgan joyda'
        : distanceM >= 1000
        ? `Sizdan ${(distanceM / 1000).toFixed(1)} km`
        : `Sizdan ${distanceM} m`
      : '';

  // Deduplicate offers by variantId or id so the same item is never repeated
  const deduplicatedOffers = useMemo(() => {
    const seen = new Set<string>();
    const list: Offer[] = [];
    for (const o of activeStoreOffers || []) {
      const key = o.variantId || o.variant?.id || o.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push(o);
      }
    }
    return list;
  }, [activeStoreOffers]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    deduplicatedOffers.forEach((o) => {
      if (o.variant?.category) {
        set.add(o.variant.category);
      }
    });
    return Array.from(set);
  }, [deduplicatedOffers]);

  const filteredOffers = useMemo(() => {
    return deduplicatedOffers.filter((o) => {
      const titleMatch = !internalSearch.trim() ||
        o.variant.title.toLowerCase().includes(internalSearch.toLowerCase().trim()) ||
        (o.variant.brand && o.variant.brand.toLowerCase().includes(internalSearch.toLowerCase().trim())) ||
        (o.variant.barcode && o.variant.barcode.includes(internalSearch.trim()));
      const categoryMatch = selectedCategory === 'ALL' || o.variant.category === selectedCategory;
      return titleMatch && categoryMatch;
    });
  }, [deduplicatedOffers, internalSearch, selectedCategory]);

  const visibleOffers = useMemo(() => {
    return filteredOffers.slice(0, visibleLimit);
  }, [filteredOffers, visibleLimit]);

  const storeTypeBadge =
    currentStore?.type === 'WHOLESALE'
      ? 'Ulgurji baza'
      : currentStore?.type === 'SERVICE'
      ? 'Xizmat ko‘rsatish'
      : 'Chakana do‘kon';

  const bannerImg = getStoreBannerImage(currentStore, currentOrg);
  const todayHours = getTodayHoursText(currentStore?.hours);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Return to All Stores / Close Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#566A63] dark:text-[#8B9E95] hover:text-[#116B50] dark:hover:text-[#4ADE80] transition cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Barcha do‘konlarga qaytish</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tashkilot panelini yopish"
          className="w-7 h-7 rounded-full flex items-center justify-center text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white hover:bg-[#E0EFE7]/60 dark:hover:bg-[#1E3328] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Organization Hero Card with Banner Photo */}
      <div className="rounded-2xl overflow-hidden border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] shadow-sm">
        {/* Cover Photo */}
        <div className="relative w-full h-44 sm:h-48 bg-[#1A2822] overflow-hidden group">
          <img
            src={bannerImg}
            alt={currentStore?.name || 'Do‘kon rasmi'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

          {/* Badges on top of photo */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-wider border border-white/20">
                {storeTypeBadge}
              </span>
              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black backdrop-blur-xs ${
                  isOpen
                    ? 'bg-emerald-500/90 text-white shadow-xs'
                    : 'bg-red-500/90 text-white shadow-xs'
                }`}
              >
                {isOpen ? '● Hozir ochiq' : '○ Yopiq'}
              </span>
            </div>

            {distanceText && (
              <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold border border-white/20 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#4ADE80]" />
                <span>{distanceText}</span>
              </span>
            )}
          </div>

          {/* Organization Title overlay */}
          <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
            <h2 className="text-lg sm:text-xl font-black leading-tight drop-shadow-sm">
              {currentOrg?.name || currentStore?.name}
            </h2>
            {currentOrg?.name && currentStore?.name && currentOrg.name !== currentStore.name && (
              <p className="text-xs text-white/80 font-medium drop-shadow-2xs mt-0.5">
                Filial: {currentStore.name}
              </p>
            )}
          </div>
        </div>

        {/* Organization Info Details */}
        <div className="p-4 flex flex-col gap-3">
          {/* Address */}
          <div className="flex items-start gap-2 text-xs text-[#566A63] dark:text-[#8B9E95]">
            <MapPin className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80] shrink-0 mt-0.5" />
            <span className="leading-snug text-[#172C28] dark:text-[#E8F2EC] font-medium">
              {currentStore?.address || 'Toshkent shahri'}
            </span>
          </div>

          {/* Hours, Rating, Phone Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#566A63] dark:text-[#8B9E95] pt-2 border-t border-[#DCE5DF]/60 dark:border-[#2A3F36]">
            {/* Hours */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
              <span className="truncate">{todayHours}</span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1.5 font-bold text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 shrink-0" />
              <span>{currentStore?.rating || 4.8}</span>
              {currentStore?.reviewCount ? (
                <span className="text-[11px] font-normal text-[#8B9E95]">
                  ({currentStore.reviewCount} ta baho)
                </span>
              ) : null}
            </div>

            {/* Phone */}
            {currentStore?.phone && (
              <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2">
                <Phone className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
                <a
                  href={`tel:${currentStore.phone.replace(/[^\d+]/g, '')}`}
                  className="font-bold text-[#116B50] dark:text-[#4ADE80] hover:underline"
                >
                  {currentStore.phone}
                </a>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#DCE5DF]/60 dark:border-[#2A3F36]">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenStorePage(currentStore)}
              className="flex items-center justify-center gap-1.5 font-bold text-xs"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>To‘liq sahifa</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigateRoute(currentStore)}
              className="flex items-center justify-center gap-1.5 font-bold text-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Marshrut</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Products and Services Showcase Section */}
      <div className="flex flex-col gap-3 mt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
            <h3 className="font-extrabold text-sm text-[#172C28] dark:text-[#E8F2EC]">
              Mavjud tovarlar va xizmatlar
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] text-xs font-bold">
            {filteredOffers.length > visibleOffers.length
              ? `${visibleOffers.length} / ${filteredOffers.length} ta`
              : `${filteredOffers.length} ta`}
          </span>
        </div>

        {/* Live Search inside this organization */}
        <div className="relative">
          <input
            type="text"
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
            placeholder="Ushbu tashkilotdan tovar qidirish..."
            className="w-full h-9 pl-8 pr-8 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC] focus:bg-white dark:focus:bg-[#16241E] focus:outline-none focus:ring-2 focus:ring-[#116B50]"
          />
          <Search className="w-3.5 h-3.5 text-[#566A63] dark:text-[#8B9E95] absolute left-2.5 top-2.5" />
          {internalSearch && (
            <button
              type="button"
              onClick={() => setInternalSearch('')}
              className="absolute right-2.5 top-2.5 text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        {categories.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-[#116B50] text-white shadow-2xs'
                  : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7] dark:hover:bg-[#203328]'
              }`}
            >
              Hammasi
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#116B50] text-white shadow-2xs'
                    : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7] dark:hover:bg-[#203328]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Products List or Loading Skeleton */}
        {loadingOffers ? (
          <div className="flex flex-col gap-2.5 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="p-3 rounded-2xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-[#F9FAF9] dark:bg-[#16241E] flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-[#E0EFE7]/60 dark:bg-[#203328] shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-[#E0EFE7]/60 dark:bg-[#203328] rounded w-2/3" />
                  <div className="h-3 bg-[#E0EFE7]/40 dark:bg-[#1A2822] rounded w-1/3" />
                </div>
                <div className="w-16 h-4 bg-[#E0EFE7]/60 dark:bg-[#203328] rounded" />
              </div>
            ))}
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="p-6 text-center rounded-2xl border border-dashed border-[#DCE5DF] dark:border-[#2A3F36] bg-[#F9FAF9] dark:bg-[#16241E] flex flex-col items-center gap-2">
            <span className="text-2xl">📦</span>
            <p className="text-xs text-[#566A63] dark:text-[#8B9E95] max-w-xs">
              {internalSearch
                ? `"${internalSearch}" bo‘yicha tovar topilmadi`
                : 'Ushbu tashkilotda hozircha elektron tovarlar ro‘yxati kiritilmagan'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredOffers.length > 8 && (
              <div className="flex items-center justify-between text-[11px] text-[#566A63] dark:text-[#8B9E95] px-1 mb-1">
                <span>
                  Ko‘rsatilmoqda: 1-{Math.min(visibleLimit, filteredOffers.length)} dan {filteredOffers.length} ta
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px]">Limit:</span>
                  {[8, 16, 32].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setVisibleLimit(cnt)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        visibleLimit === cnt
                          ? 'bg-[#116B50] text-white'
                          : 'bg-[#F3F6F3] dark:bg-[#1A2822] hover:bg-[#E0EFE7] dark:hover:bg-[#203328]'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setVisibleLimit(filteredOffers.length)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                      visibleLimit >= filteredOffers.length
                        ? 'bg-[#116B50] text-white'
                        : 'bg-[#F3F6F3] dark:bg-[#1A2822] hover:bg-[#E0EFE7] dark:hover:bg-[#203328]'
                    }`}
                  >
                    Hammasi
                  </button>
                </div>
              </div>
            )}
            {visibleOffers.map((offer) => {
              const formattedPrice = Number(offer.price).toLocaleString('uz-UZ');
              const thumbnail = getProductThumbnail(offer.variant);

              return (
                <div
                  key={offer.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectProduct(offer)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectProduct(offer);
                    }
                  }}
                  title="Tovar ma‘lumotlarini ochish uchun bosing"
                  className="p-2.5 rounded-2xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] hover:border-[#116B50] dark:hover:border-[#4ADE80] transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                      <img
                        src={thumbnail}
                        alt={offer.variant.title}
                        loading="lazy"
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_THUMBNAIL;
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] truncate group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] transition-colors">
                        {offer.variant.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                        {offer.variant.category && (
                          <span className="truncate">{offer.variant.category}</span>
                        )}
                        {offer.variant.brand && (
                          <>
                            <span>·</span>
                            <span className="truncate">{offer.variant.brand}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-[#116B50] dark:text-[#4ADE80]">
                      {formattedPrice} so‘m
                    </div>
                    <span
                      className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                        offer.stockOnHand > 0
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#116B50] dark:text-[#4ADE80]'
                          : 'bg-red-50 dark:bg-red-950/60 text-red-600'
                      }`}
                    >
                      {offer.stockOnHand > 0 ? `${offer.stockOnHand} dona` : 'Tugagan'}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredOffers.length > 8 && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2 border-t border-[#DCE5DF]/60 dark:border-[#2A3F36] mt-1">
                {visibleLimit < filteredOffers.length ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setVisibleLimit((prev) => Math.min(prev + 8, filteredOffers.length))}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] hover:bg-[#116B50] hover:text-white text-[#116B50] dark:text-[#4ADE80] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>+8 ta ko‘proq ko‘rsatish</span>
                      <span className="text-[11px] opacity-80">({filteredOffers.length - visibleLimit} ta qoldi)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibleLimit(filteredOffers.length)}
                      className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-bold text-[#566A63] dark:text-[#8B9E95] hover:text-[#116B50] dark:hover:text-[#4ADE80] transition cursor-pointer"
                    >
                      Barchasini ko‘rsatish ({filteredOffers.length})
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setVisibleLimit(8)}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] hover:text-[#116B50] dark:hover:text-[#4ADE80] transition cursor-pointer"
                  >
                    Qisqartirish (8 taga qaytarish)
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
