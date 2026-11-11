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
}

export const ProductSearchCard: React.FC<ProductSearchCardProps> = ({
  item,
  isSelected = false,
  onSelect,
  onOpenStore,
  onGetRoute,
  onOpenProductModal
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

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col gap-3 border shadow-xs ${
        isSelected
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-[#087F5B] ring-2 ring-[#087F5B]/30 shadow-md'
          : 'bg-white dark:bg-[#14201A] border-[#E2E8F0] dark:border-[#263D33] hover:border-[#087F5B]/50 hover:shadow-md'
      }`}
    >
      {/* 1. Main Product Section */}
      <div className="flex gap-3 items-start">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-[#CBD5E1]/60 dark:border-[#2E4237] flex items-center justify-center relative">
          <img
            src={imgUrl}
            alt={variant?.title || 'Mahsulot'}
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
                min: {bestOffer.minOrderQuantity} dona
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Store Location & Distance Info */}
      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1A2822] border border-slate-200/80 dark:border-[#273B32] flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-[#087F5B] dark:text-[#4ADE80] flex items-center justify-center shrink-0">
            <StoreIcon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-[#172B26] dark:text-white truncate text-xs">
              {store?.name || 'Do‘kon'}
            </h4>
            <p className="text-[10px] text-[#64748B] dark:text-[#8B9E95] truncate">
              {store?.address || 'Manzil ko‘rsatilmagan'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="inline-flex items-center gap-1 font-bold text-xs text-[#087F5B] dark:text-[#4ADE80] bg-white dark:bg-[#14201A] px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 shadow-2xs">
            <MapPin className="w-3 h-3 text-[#087F5B]" />
            {formattedDistance}
          </span>
          <div className="text-[9px] mt-0.5 font-semibold">
            {item.isOpenNow ? (
              <span className="text-emerald-600 dark:text-emerald-400">● Ochiq</span>
            ) : (
              <span className="text-slate-400">● Yopiq</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Companions / Sheriklari va muqobillari Section */}
      {hasCompanions && (
        <div className="pt-2 border-t border-slate-100 dark:border-[#263D33]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#172B26] dark:text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Sheriklari va muqobillari</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black">
                {companions.length}
              </span>
            </div>

            {companions.length > 2 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllCompanions(!showAllCompanions);
                }}
                className="text-[11px] font-bold text-[#087F5B] dark:text-[#4ADE80] hover:underline flex items-center gap-0.5"
              >
                <span>{showAllCompanions ? 'Yopish' : 'Barchasi'}</span>
                {showAllCompanions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(showAllCompanions ? companions : companions.slice(0, 2)).map((comp) => {
              const compThumb = getProductThumbnail(comp.variant);
              const compPrice = Number(comp.price || 0).toLocaleString('uz-UZ');
              return (
                <div
                  key={comp.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenProductModal) {
                      onOpenProductModal({
                        ...item,
                        bestOffer: comp
                      });
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-[#1A2822] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200/60 dark:border-[#263D33] hover:border-emerald-300 dark:hover:border-emerald-700/60 transition flex items-center gap-2 group cursor-pointer"
                  title="Sherik tovar tafsilotlari"
                >
                  <img
                    src={compThumb}
                    alt={comp.variant?.title}
                    className="w-9 h-9 rounded-lg object-cover shrink-0 bg-slate-200 dark:bg-slate-800"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="text-[11px] font-bold text-[#172B26] dark:text-white truncate group-hover:text-[#087F5B]">
                      {comp.variant?.title}
                    </h5>
                    <div className="text-[11px] font-black text-[#087F5B] dark:text-[#4ADE80] mt-0.5">
                      {compPrice} so‘m
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Action Buttons */}
      <div className="pt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onGetRoute(store);
          }}
          className="flex-1 py-2 px-3 rounded-xl bg-[#087F5B] hover:bg-[#065F46] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Yo‘l olish</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenStore(store.id);
          }}
          className="py-2 px-3 rounded-xl border border-slate-200 dark:border-[#263D33] hover:border-[#087F5B] bg-white dark:bg-[#16241E] text-[#172B26] dark:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          title="Do‘kon sahifasini ochish"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#087F5B]" />
          <span>Do‘kon</span>
        </button>
      </div>
    </div>
  );
};
