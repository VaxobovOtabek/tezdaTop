import React from 'react';
import { X, ChevronRight, Layers, AlertCircle, RotateCcw, Search, Sparkles, Pill } from 'lucide-react';
import { ProductSearchCard } from './ProductSearchCard';

interface ResultsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  searchQuery: string;
  locationName: string;
  isRegionChosen?: boolean;
  onOpenLocationPicker?: () => void;
  items: any[];
  selectedItem: any | null;
  onSelectItem: (item: any) => void;
  onOpenStore: (storeId: string) => void;
  onGetRoute: (store: any) => void;
  onClearSearch?: () => void;
  onSearchQuery?: (q: string) => void;
  onOpenProductModal?: (item: any) => void;
  isLoading?: boolean;
}

const POPULAR_SEARCH_PILLS = [
  'Paratsetamol',
  'Aspirin',
  'Sitamol',
  'Spazmalgon',
  'Analgin',
  'Kardiomagnil',
  'Mezim',
  'Ambroksol'
];

export const ResultsDrawerTrigger: React.FC<{ count: number; onOpen: () => void }> = ({ count, onOpen }) => (
  <button
    onClick={onOpen}
    type="button"
    className="h-[52px] bg-white dark:bg-[#14201A] rounded-2xl shadow-xl border border-[#CBD5E1] dark:border-[#273B32] hover:border-[#087F5B] px-3.5 flex items-center gap-2.5 text-xs font-bold text-[#172B26] dark:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#1E3328] transition-all duration-150 active:scale-95 cursor-pointer group shrink-0"
    title="Topilgan tovarlar ro‘yxatini ochish"
  >
    <div className="w-8 h-8 rounded-xl bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
      <Layers className="w-4 h-4" />
    </div>
    <div className="flex flex-col text-left shrink-0">
      <span className="text-[10px] text-[#087F5B] dark:text-[#4ADE80] font-bold uppercase tracking-wider leading-none mb-0.5">
        Tovarlar ro‘yxati
      </span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-extrabold text-[#172B26] dark:text-white whitespace-nowrap">
          Topilgan tovarlar
        </span>
        <span className="bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] text-[11px] px-1.5 py-0.2 rounded-full font-black">
          {count}
        </span>
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-[#087F5B] dark:text-[#4ADE80] group-hover:translate-x-0.5 transition-transform ml-0.5 shrink-0" />
  </button>
);

export const ResultsDrawer: React.FC<ResultsDrawerProps> = ({
  isOpen,
  onClose,
  searchQuery,
  locationName,
  isRegionChosen = true,
  onOpenLocationPicker,
  items,
  selectedItem,
  onSelectItem,
  onOpenStore,
  onGetRoute,
  onClearSearch,
  onSearchQuery,
  onOpenProductModal,
  isLoading = false
}) => {
  const count = items.length;
  const cleanLocation = locationName ? locationName.split(',')[0] : 'Guliston';
  const hasActiveSearch = Boolean(searchQuery.trim());
  const queryDisplay = hasActiveSearch ? `"${searchQuery}"` : '';

  if (!isOpen) {
    return null;
  }

  return (
    <aside className="hidden md:flex absolute top-4 bottom-4 left-4 w-[380px] lg:w-[410px] z-20 bg-white dark:bg-[#14201A] rounded-3xl shadow-2xl border border-[#CBD5E1] dark:border-[#273B32] flex-col overflow-hidden animate-in fade-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#E2E8F0] dark:border-[#263D33] shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-xl text-[#172B26] dark:text-white tracking-tight">
              Topilgan tovarlar
            </h2>
            {hasActiveSearch && (
              <span className="bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                {count} ta
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full hover:bg-[#F1F5F9] dark:hover:bg-[#1E3328] text-[#64748B] dark:text-[#8B9E95] hover:text-[#172B26] dark:hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Panelni yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtitle & Clear Search Action Button */}
        <div className="flex items-center justify-between mt-1.5 gap-2">
          <p className="text-xs text-[#64748B] dark:text-[#8B9E95] truncate flex-1">
            {hasActiveSearch ? (
              <>
                <span className="font-semibold text-[#172B26] dark:text-white">{queryDisplay}</span> bo‘yicha {cleanLocation} yaqinida
              </>
            ) : (
              <span>Kerakli tovar yoki xizmatni qidiring</span>
            )}
          </p>
          {hasActiveSearch && onClearSearch && (
            <button
              onClick={onClearSearch}
              type="button"
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 transition cursor-pointer border border-red-200/60 dark:border-red-900/40 shadow-2xs"
              title="Qidiruvni tozalash"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Tozalash</span>
            </button>
          )}
        </div>
      </div>

      {/* Cards Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col gap-3 pt-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl border border-[#E2E8F0] dark:border-[#263D33] p-4 animate-pulse flex flex-col gap-3 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex gap-3 items-center">
                  <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                </div>
                <div className="w-full h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
            ))}
          </div>
        ) : !isRegionChosen ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] flex items-center justify-center mb-3 text-xl shadow-xs">
              📍
            </div>
            <h3 className="font-bold text-sm text-[#172B26] dark:text-white mb-1">
              Hudud tanlanmagan
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#8B9E95] max-w-[240px] mb-4">
              Tovarlar va do‘konlarni ko‘rish uchun viloyatingizni tanlang.
            </p>
            {onOpenLocationPicker && (
              <button
                onClick={onOpenLocationPicker}
                type="button"
                className="px-4 py-2 rounded-xl bg-[#087F5B] hover:bg-[#065F46] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Viloyatni tanlash 📍</span>
              </button>
            )}
          </div>
        ) : !hasActiveSearch ? (
          /* Initial Launch State - Zero DB load */
          <div className="py-8 flex flex-col items-center text-center px-2">
            <div className="w-14 h-14 rounded-2xl bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] flex items-center justify-center mb-3 shadow-xs">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="font-black text-base text-[#172B26] dark:text-white mb-1">
              Qidiruvni boshlang
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#8B9E95] max-w-[260px] mb-5">
              O‘zingizga kerakli dori, tovar yoki xizmat nomini yozing, uning eng yaqin do‘kondagi narxi va sheriklarini topamiz.
            </p>

            <div className="w-full text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#172B26] dark:text-white mb-2.5 px-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Ommabop qidiruvlar:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SEARCH_PILLS.map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => onSearchQuery?.(pill)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#E8F5EE] dark:bg-[#1A2822] dark:hover:bg-[#1E362A] text-[#172B26] hover:text-[#087F5B] dark:text-[#E8F2EC] dark:hover:text-[#4ADE80] text-xs font-bold transition border border-transparent hover:border-[#087F5B]/30 flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Pill className="w-3 h-3 text-[#087F5B]" />
                    <span>{pill}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : count === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-[#172B26] dark:text-white mb-1">
              Hech qanday tovar topilmadi
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#8B9E95] max-w-[220px]">
              Qidiruv so‘zini o‘zgartiring yoki radiusi oshirib ko‘ring
            </p>
            {hasActiveSearch && onClearSearch && (
              <button
                onClick={onClearSearch}
                type="button"
                className="mt-4 px-4 py-2 rounded-xl bg-[#087F5B] hover:bg-[#065F46] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Qidiruvni tozalash</span>
              </button>
            )}
          </div>
        ) : (
          items.map((item) => {
            const storeObj = item.store || item;
            const isSelected = Boolean(
              selectedItem && (selectedItem.store?.id === storeObj.id || selectedItem.id === storeObj.id)
            );
            return (
              <ProductSearchCard
                key={item.bestOffer?.id || storeObj.id}
                item={item}
                isSelected={isSelected}
                onSelect={() => onSelectItem(item)}
                onOpenStore={onOpenStore}
                onGetRoute={onGetRoute}
                onOpenProductModal={onOpenProductModal}
              />
            );
          })
        )}
      </div>
    </aside>
  );
};
