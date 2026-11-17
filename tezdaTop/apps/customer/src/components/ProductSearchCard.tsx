import React, { useState } from 'react';
import {
  MapPin,
  Store as StoreIcon,
  Navigation,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Package,
  ExternalLink
} from 'lucide-react';
import { StoreSearchResult } from '@yaqintop/contracts';
import { getProductThumbnail } from '../utils/product-thumbnails';

export interface ProductSearchCardProps {
  item: StoreSearchResult;
  isSelected?: boolean;
  onSelect: () => void;
  onOpenStore: (storeId: string) => void;
  onGetRoute: (store: any) => void;
  onOpenProductModal?: (item: StoreSearchResult) => void;
  viewMode?: 'list' | 'grid-2';
}

export const ProductSearchCard = React.memo<ProductSearchCardProps>(({
  item,
  isSelected = false,
  onSelect,
  onOpenStore,
  onGetRoute,
  onOpenProductModal,
  viewMode = 'list'
}) => {
  const [showAllCompanions, setShowAllCompanions] = useState(false);
  const bestOffer = item.bestOffer;
  const variant = bestOffer?.variant;
  const store = item.store;

  const distance = typeof item.distanceM === 'number' ? item.distanceM : 0;
  const formattedDistance =
    distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`;

  const formattedPrice = Number(bestOffer?.price || 0).toLocaleString('uz-UZ');
  const imgUrl = getProductThumbnail(variant);
  const companions = item.similarProducts || [];
  const hasCompanions = companions.length > 0;

  // 1. Two per row grid card
  if (viewMode === 'grid-2') {
    return (
      <div
        onClick={onSelect}
        className={`rounded-xl p-2.5 flex flex-col gap-2 transition-all cursor-pointer select-none border ${
          isSelected
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-[#087F5B] ring-1 ring-[#087F5B]/30 shadow-sm'
            : 'bg-white dark:bg-[#14201A] border-[#E2E8F0] dark:border-[#263D33] hover:border-[#087F5B]/50 hover:shadow-2xs'
        }`}
      >
        <div className="relative w-full h-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          <img
            src={imgUrl}
            alt={variant?.title || 'Mahsulot'}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <Package className="w-7 h-7 text-[#087F5B]/30 absolute" />
          <div className="absolute top-1.5 right-1.5 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5 text-[#4ADE80]" />
            <span>{formattedDistance}</span>
          </div>
        </div>
        <div>
          <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80]">
            {variant?.category || 'Tovar'}
          </span>
          <h3 className="font-bold text-xs text-[#172B26] dark:text-white leading-tight truncate mt-1">
            {variant?.title || 'Mahsulot nomi'}
          </h3>
          <p className="text-[10.5px] text-[#64748B] dark:text-[#8B9E95] truncate mt-0.5">
            {store?.name || 'Do‘kon'}
          </p>
        </div>
        <div className="text-sm font-black text-[#087F5B] dark:text-[#4ADE80] mt-auto">
          {formattedPrice} <span className="text-[10px] font-normal text-[#64748B]">so‘m</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenStore(store?.id || '');
            }}
            className="bg-[#087F5B] hover:bg-[#065F46] active:scale-95 text-white py-1.5 px-1 rounded-lg text-[10.5px] font-bold text-center truncate cursor-pointer shadow-2xs"
          >
            Do‘kon
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onGetRoute(store);
            }}
            className="border border-[#E2E8F0] dark:border-[#273B32] hover:bg-[#F8FAFC] dark:hover:bg-[#1E3328] active:scale-95 text-[#172B26] dark:text-[#E8F2EC] py-1.5 px-1 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer truncate"
          >
            <Navigation className="w-3 h-3 text-[#087F5B] dark:text-[#4ADE80]" />
            <span>Yo‘l</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Spisok / List view (default)
  return (
    <div
      onClick={onSelect}
      className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-200 cursor-pointer flex flex-col gap-2.5 sm:gap-3 border shadow-xs ${
        isSelected
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-[#087F5B] ring-2 ring-[#087F5B]/30 shadow-md'
          : 'bg-white dark:bg-[#14201A] border-[#E2E8F0] dark:border-[#263D33] hover:border-[#087F5B]/50 hover:shadow-xs'
      }`}
    >
      {/* 1. Main Product Section */}
      <div className="flex gap-2.5 sm:gap-3 items-start">
        <div className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-[#CBD5E1]/60 dark:border-[#2E4237] flex items-center justify-center relative">
          <img
            src={imgUrl}
            alt={variant?.title || 'Mahsulot'}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <Package className="w-7 h-7 text-[#087F5B]/40 absolute" />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80]">
                {variant?.category || 'Tovar'}
              </span>
              {bestOffer?.stockOnHand && bestOffer.stockOnHand > 0 ? (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  Mavjud ({bestOffer.stockOnHand} dona)
                </span>
              ) : null}
            </div>

            <h3 className="font-extrabold text-sm text-[#172B26] dark:text-white line-clamp-2 mt-1 leading-snug">
              {variant?.title || 'Mahsulot nomi'}
            </h3>

            {variant?.brand && (
              <p className="text-[11px] text-[#64748B] dark:text-[#8B9E95] truncate mt-0.5">
                Ishlab chiqaruvchi: <span className="font-medium text-[#172B26] dark:text-[#CBD5E1]">{variant.brand}</span>
              </p>
            )}
          </div>

          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div className="text-base sm:text-lg font-black text-[#087F5B] dark:text-[#4ADE80]">
              {formattedPrice} <span className="text-xs font-bold text-[#64748B] dark:text-[#8B9E95]">so‘m</span>
            </div>
            {bestOffer?.minOrderQuantity && bestOffer.minOrderQuantity > 1 && (
              <span className="text-[10px] text-[#64748B] dark:text-[#8B9E95]">
                Min. buyurtma: {bestOffer.minOrderQuantity} dona
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Store Info Section */}
      <div className="pt-2 border-t border-[#F1F5F9] dark:border-[#22332C] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <StoreIcon className="w-3.5 h-3.5 text-[#64748B] dark:text-[#8B9E95] shrink-0" />
          <span className="font-bold text-[#172B26] dark:text-white truncate">
            {store?.name || 'Do‘kon'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[#087F5B] dark:text-[#4ADE80] font-bold text-xs shrink-0">
          <MapPin className="w-3.5 h-3.5" />
          <span>{formattedDistance}</span>
        </div>
      </div>

      {/* 3. Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenProductModal) {
              onOpenProductModal(item);
            } else if (store?.id) {
              onOpenStore(store.id);
            }
          }}
          className="flex-1 bg-[#087F5B] hover:bg-[#065F46] active:scale-95 text-white py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <span>Batafsil / Xarid</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onGetRoute(store);
          }}
          className="border border-[#CBD5E1] dark:border-[#273B32] hover:bg-[#F8FAFC] dark:hover:bg-[#1E3328] active:scale-95 text-[#172B26] dark:text-[#E8F2EC] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          title="Xaritada yo‘l ko‘rsatish"
        >
          <Navigation className="w-3.5 h-3.5 text-[#087F5B] dark:text-[#4ADE80]" />
          <span className="hidden xs:inline">Marshrut</span>
        </button>
      </div>

      {/* 4. Companions Toggle */}
      {hasCompanions && (
        <div className="pt-2 border-t border-[#F1F5F9] dark:border-[#22332C]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowAllCompanions(!showAllCompanions);
            }}
            className="w-full flex items-center justify-between text-xs font-bold text-[#087F5B] dark:text-[#4ADE80] hover:underline"
          >
            <span>Do‘kondagi boshqa tovarlar ({companions.length})</span>
            {showAllCompanions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAllCompanions && (
            <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-[#087F5B]/30">
              {companions.map((comp: any, cIdx: number) => (
                <div key={comp.id || cIdx} className="flex items-center justify-between text-xs py-1">
                  <span className="text-[#172B26] dark:text-[#CBD5E1] truncate pr-2">
                    {comp.variant?.title || comp.title}
                  </span>
                  <span className="font-bold text-[#087F5B] dark:text-[#4ADE80] shrink-0">
                    {Number(comp.price || 0).toLocaleString('uz-UZ')} so‘m
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ProductSearchCard.displayName = 'ProductSearchCard';
