import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Store as StoreIcon, MapPin, RotateCcw } from 'lucide-react';
import { StoreCard } from './StoreCard';

interface MobileBottomSheetProps {
  items: any[];
  selectedItem: any | null;
  onSelectItem: (item: any) => void;
  onOpenStore: (storeId: string) => void;
  onGetRoute: (store: any) => void;
  onClearSearch?: () => void;
  searchQuery: string;
  locationName: string;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  items,
  selectedItem,
  onSelectItem,
  onOpenStore,
  onGetRoute,
  onClearSearch,
  searchQuery,
  locationName
}) => {
  const [sheetState, setSheetState] = useState<'collapsed' | 'half' | 'full'>('collapsed');
  const count = items.length;
  const cleanLocation = locationName ? locationName.split(',')[0] : 'Guliston';
  const hasActiveSearch = Boolean(searchQuery.trim());

  const toggleExpand = () => {
    if (sheetState === 'collapsed') setSheetState('half');
    else if (sheetState === 'half') setSheetState('full');
    else setSheetState('collapsed');
  };

  const heightClass = {
    collapsed: 'h-[62px]',
    half: 'h-[48vh]',
    full: 'h-[calc(100vh-140px)]'
  }[sheetState];

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
              Do‘kon va xizmatlar
            </span>
            <span className="bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] text-xs font-extrabold px-2 py-0.5 rounded-full shrink-0">
              {count} ta
            </span>
            <span className="text-xs text-[#64748B] dark:text-[#8B9E95] truncate">
              {hasActiveSearch ? `"${searchQuery}"` : cleanLocation}
            </span>
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
            ) : sheetState === 'half' ? (
              <ChevronUp className="w-5 h-5 text-[#087F5B]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#087F5B]" />
            )}
          </div>
        </div>
      </div>

      {/* Content list */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 pb-6">
        {count === 0 ? (
          <div className="text-center py-8 text-[#64748B] dark:text-[#8B9E95] text-xs flex flex-col items-center gap-2">
            <span>Yaqin atrofda do‘konlar topilmadi</span>
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
                onSelect={() => {
                  onSelectItem(item);
                  if (sheetState === 'full') setSheetState('half');
                }}
                onOpenStore={onOpenStore}
                onGetRoute={onGetRoute}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
