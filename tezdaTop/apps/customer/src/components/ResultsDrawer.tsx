import React from 'react';
import { X, Store as StoreIcon, ChevronRight, Layers, AlertCircle, RotateCcw } from 'lucide-react';
import { StoreCard } from './StoreCard';

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
  isLoading?: boolean;
}

export const ResultsDrawerTrigger: React.FC<{ count: number; onOpen: () => void }> = ({ count, onOpen }) => (
  <button
    onClick={onOpen}
    type="button"
    className="h-[52px] bg-white dark:bg-[#14201A] rounded-2xl shadow-xl border border-[#CBD5E1] dark:border-[#273B32] hover:border-[#087F5B] px-3.5 flex items-center gap-2.5 text-xs font-bold text-[#172B26] dark:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#1E3328] transition-all duration-150 active:scale-95 cursor-pointer group shrink-0"
    title="Do‘kon va xizmatlar ro‘yxatini ochish"
  >
    <div className="w-8 h-8 rounded-xl bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
      <Layers className="w-4 h-4" />
    </div>
    <div className="flex flex-col text-left shrink-0">
      <span className="text-[10px] text-[#087F5B] dark:text-[#4ADE80] font-bold uppercase tracking-wider leading-none mb-0.5">
        Ro‘yxatni ochish
      </span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-extrabold text-[#172B26] dark:text-white whitespace-nowrap">
          Do‘kon va xizmatlar
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
  onOpen,
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
  isLoading = false
}) => {
  const count = items.length;
  const cleanLocation = locationName ? locationName.split(',')[0] : 'Guliston';
  const hasActiveSearch = Boolean(searchQuery.trim());
  const queryDisplay = hasActiveSearch ? `"${searchQuery}"` : 'Barcha do‘konlar';

  if (!isOpen) {
    return null;
  }

  return (
    <aside className="hidden md:flex absolute top-4 bottom-4 left-4 w-[360px] lg:w-[380px] z-20 bg-white dark:bg-[#14201A] rounded-3xl shadow-2xl border border-[#CBD5E1] dark:border-[#273B32] flex-col overflow-hidden animate-in fade-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#E2E8F0] dark:border-[#263D33] shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-xl text-[#172B26] dark:text-white tracking-tight">
              Do‘kon va xizmatlar
            </h2>
            <span className="bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] text-xs font-extrabold px-2.5 py-0.5 rounded-full">
              {count} ta
            </span>
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
            <span className="font-semibold text-[#172B26] dark:text-white">{queryDisplay}</span> bo‘yicha {cleanLocation} yaqinida
          </p>
          {hasActiveSearch && onClearSearch && (
            <button
              onClick={onClearSearch}
              type="button"
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 transition cursor-pointer border border-red-200/60 dark:border-red-900/40 shadow-2xs"
              title="Qidiruvni tozalash va barchasini ko‘rsatish"
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
              <div key={n} className="rounded-2xl border border-[#E2E8F0] dark:border-[#263D33] p-3 animate-pulse flex flex-col gap-2.5 bg-slate-50 dark:bg-slate-900/50">
                <div className="w-full h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        ) : !isRegionChosen ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-3 text-2xl shadow-sm">
              📍
            </div>
            <h3 className="font-extrabold text-sm text-red-700 dark:text-red-300 mb-1">
              Viloyat va tuman tanlanmagan
            </h3>
            <p className="text-xs text-red-600/90 dark:text-red-400/90 max-w-[240px] mb-4">
              Dorixonalar va do‘konlarni ko‘rish uchun iltimos, avval viloyat va shahar/tumaningizni belgilang.
            </p>
            {onOpenLocationPicker && (
              <button
                onClick={onOpenLocationPicker}
                type="button"
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer animate-bounce"
              >
                <span>Viloyatni tanlash 📍</span>
              </button>
            )}
          </div>
        ) : count === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-[#172B26] dark:text-white mb-1">
              Hech qanday natija topilmadi
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
              <StoreCard
                key={storeObj.id}
                store={storeObj}
                distanceM={item.distanceM}
                isSelected={isSelected}
                onSelect={() => onSelectItem(item)}
                onOpenStore={onOpenStore}
                onGetRoute={onGetRoute}
              />
            );
          })
        )}
      </div>
    </aside>
  );
};
