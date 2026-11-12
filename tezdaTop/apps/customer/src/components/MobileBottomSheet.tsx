import React, { useState } from 'react';
import { ChevronUp, ChevronDown, RotateCcw, Search, Sparkles, ShoppingBag } from 'lucide-react';
import { ProductSearchCard } from './ProductSearchCard';

interface MobileBottomSheetProps {
  items: any[];
  selectedItem: any | null;
  onSelectItem: (item: any) => void;
  onOpenStore: (storeId: string) => void;
  onGetRoute: (store: any) => void;
  onClearSearch?: () => void;
  onSearchQuery?: (q: string) => void;
  onOpenProductModal?: (item: any) => void;
  searchQuery: string;
  locationName: string;
}

const POPULAR_SEARCH_PILLS = [
  'Non',
  'Sut',
  'Yog‘',
  'Shakar',
  'Choy',
  'Tuxum',
  'Guruch',
  'Un',
  'Suv'
];

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  items,
  selectedItem,
  onSelectItem,
  onOpenStore,
  onGetRoute,
  onClearSearch,
  onSearchQuery,
  onOpenProductModal,
  searchQuery,
  locationName
}) => {
  const [sheetState, setSheetState] = useState<'collapsed' | 'open'>('collapsed');
  const count = items.length;
  const cleanLocation = locationName ? locationName.split(',')[0] : 'Guliston';
  const hasActiveSearch = Boolean(searchQuery.trim());

  // Prioritize selected item at the top of the sheet list
  const sortedItems = React.useMemo(() => {
    if (!selectedItem) return items;
    const targetId = selectedItem.bestOffer?.id || selectedItem.store?.id || selectedItem.id;
    return [...items].sort((a, b) => {
      const aId = a.bestOffer?.id || a.store?.id || a.id;
      const bId = b.bestOffer?.id || b.store?.id || b.id;
      if (aId === targetId) return -1;
      if (bId === targetId) return 1;
      return 0;
    });
  }, [items, selectedItem]);

  const toggleExpand = () => {
    setSheetState((prev) => (prev === 'collapsed' ? 'open' : 'collapsed'));
  };

  const heightClass = sheetState === 'collapsed' ? 'h-[62px]' : 'h-[52vh]';

  return (
    <div
      className={`md:hidden fixed bottom-16 left-0 right-0 bg-white dark:bg-[#14201A] rounded-t-3xl shadow-2xl border-t border-[#CBD5E1] dark:border-[#273B32] z-30 flex flex-col transition-all duration-300 ease-out ${heightClass}`}
    >
      {/* Drag handle & Header */}
      <div
        onClick={toggleExpand}
        className="p-2.5 pb-2 flex flex-col items-center cursor-pointer select-none shrink-0 border-b border-[#E2E8F0]/60 dark:border-[#273B32]/60 bg-white dark:bg-[#14201A] rounded-t-3xl"
      >
        <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mb-1.5" />
        <div className="w-full flex items-center justify-between px-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-extrabold text-sm text-[#172B26] dark:text-white shrink-0">
              Topilgan tovarlar
            </span>
            {hasActiveSearch && (
              <span className="bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] text-xs font-extrabold px-2 py-0.5 rounded-full shrink-0">
                {count} ta
              </span>
            )}
            {selectedItem?.bestOffer?.variant?.title ? (
              <span className="text-xs font-semibold text-[#087F5B] dark:text-[#4ADE80] truncate max-w-[130px]">
                · {selectedItem.bestOffer.variant.title}
              </span>
            ) : (
              <span className="text-xs text-[#64748B] dark:text-[#8B9E95] truncate">
                {hasActiveSearch ? `"${searchQuery}"` : cleanLocation}
              </span>
            )}
            {hasActiveSearch && onClearSearch && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearSearch();
                }}
                className="text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Tozalash</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 text-[#64748B] dark:text-[#8B9E95] shrink-0 pl-2">
            {sheetState === 'collapsed' ? (
              <ChevronUp className="w-5 h-5 text-[#087F5B]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#087F5B]" />
            )}
          </div>
        </div>
      </div>

      {/* Content list */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 pb-6">
        {!hasActiveSearch ? (
          <div className="py-6 flex flex-col items-center text-center px-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] flex items-center justify-center mb-2.5">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-sm text-[#172B26] dark:text-white mb-1">
              Qidiruvni boshlang
            </h4>
            <p className="text-xs text-[#64748B] dark:text-[#8B9E95] mb-4">
              Kerakli tovar yoki mahsulot nomini yozing:
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {POPULAR_SEARCH_PILLS.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => onSearchQuery?.(pill)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-[#E8F5EE] dark:bg-[#1A2822] text-[#172B26] hover:text-[#087F5B] dark:text-[#E8F2EC] text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <ShoppingBag className="w-3 h-3 text-[#087F5B]" />
                  <span>{pill}</span>
                </button>
              ))}
            </div>
          </div>
        ) : count === 0 ? (
          <div className="text-center py-8 text-[#64748B] dark:text-[#8B9E95] text-xs flex flex-col items-center gap-2">
            <span>Hech qanday tovar topilmadi</span>
            {hasActiveSearch && onClearSearch && (
              <button
                type="button"
                onClick={onClearSearch}
                className="mt-1 px-3 py-1.5 bg-[#087F5B] text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Qidiruvni tozalash</span>
              </button>
            )}
          </div>
        ) : (
          sortedItems.map((item) => {
            const storeObj = item.store || item;
            const isSelected = Boolean(
              selectedItem && (selectedItem.store?.id === storeObj.id || selectedItem.id === storeObj.id)
            );
            return (
              <ProductSearchCard
                key={item.bestOffer?.id || storeObj.id}
                item={item}
                isSelected={isSelected}
                onSelect={() => {
                  onSelectItem(item);
                }}
                onOpenStore={onOpenStore}
                onGetRoute={onGetRoute}
                onOpenProductModal={onOpenProductModal}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
