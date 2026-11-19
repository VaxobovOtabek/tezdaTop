import React, { useState, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Search,
  Sparkles,
  ShoppingBag,
  Scissors,
  Layers,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { ProductSearchCard } from './ProductSearchCard';
import { StoreCard } from './StoreCard';

export interface MobileBottomSheetProps {
  items: any[];
  nearbyStores?: any[];
  selectedItem: any | null;
  onSelectItem: (item: any) => void;
  onOpenStore: (storeId: string) => void;
  onGetRoute: (store: any) => void;
  onClearSearch?: () => void;
  onSearchQuery?: (q: string) => void;
  onOpenProductModal?: (item: any) => void;
  searchQuery: string;
  locationName: string;
  searchTab?: 'product' | 'service' | 'store';
  onSelectSearchTab?: (tab: 'product' | 'service' | 'store') => void;
}

const POPULAR_SEARCH_PILLS = [
  'Non',
  'Sut',
  'Yog‘',
  'Shakar',
  'Choy',
  'Tuxum',
  'Burger',
  'Lavash',
  'Dorixona',
  'Sartaroshxona',
  'Game Club'
];

export function isItemService(item: any): boolean {
  const store = item?.store || item;
  const variant = item?.bestOffer?.variant || item?.variant;
  const storeType = String(store?.type || '').toUpperCase();
  const variantType = String(variant?.type || '').toUpperCase();
  const packUnit = String(variant?.packUnit || '').toLowerCase();
  const category = String(variant?.category || store?.category || store?.name || '').toLowerCase();

  if (variantType === 'SERVICE') return true;
  if (['soat', 'xizmat', 'seans', 'kurs'].includes(packUnit)) return true;
  if (
    [
      'SERVICE',
      'SERVICES',
      'BEAUTY_SALON',
      'SALON',
      'BARBERSHOP',
      'GAME_CLUB',
      'AUTO_SERVICE',
      'EDUCATION',
      'REPAIR'
    ].includes(storeType)
  ) {
    return true;
  }
  if (
    category.includes('xizmat') ||
    category.includes('salon') ||
    category.includes('sartaroshxona') ||
    category.includes('game') ||
    category.includes('avtoservis') ||
    category.includes('ta’lim') ||
    category.includes('playstation') ||
    category.includes('ustaxona')
  ) {
    return true;
  }
  return false;
}

export function isItemProduct(item: any): boolean {
  return !isItemService(item);
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  items,
  nearbyStores = [],
  selectedItem,
  onSelectItem,
  onOpenStore,
  onGetRoute,
  onClearSearch,
  onSearchQuery,
  onOpenProductModal,
  searchQuery,
  locationName,
  searchTab,
  onSelectSearchTab
}) => {
  const [sheetState, setSheetState] = useState<'collapsed' | 'open'>('collapsed');
  const [internalFilterType, setInternalFilterType] = useState<'product' | 'service' | 'store'>('product');
  const filterType = searchTab ?? internalFilterType;
  const setFilterType = (tab: 'product' | 'service' | 'store') => {
    setInternalFilterType(tab);
    onSelectSearchTab?.(tab);
  };

  const cleanLocation = locationName ? locationName.split(',')[0] : 'Guliston';
  const hasActiveSearch = Boolean(searchQuery.trim());

  const productList = useMemo(() => items.filter(isItemProduct), [items]);
  const serviceList = useMemo(() => {
    const fromItems = items.filter(isItemService);
    const fromStores = nearbyStores.filter(isItemService);
    return [...fromItems, ...fromStores];
  }, [items, nearbyStores]);
  const storeList = useMemo(() => nearbyStores, [nearbyStores]);

  // Overall counts for filter tabs
  const productCount = productList.length;
  const serviceCount = serviceList.length;
  const storeCount = storeList.length;

  // Filtered dataset
  const filteredList = useMemo(() => {
    let list: any[] = productList;
    if (filterType === 'service') {
      list = serviceList;
    } else if (filterType === 'store') {
      list = storeList;
    }

    if (!selectedItem) return list;
    const targetId = selectedItem.bestOffer?.id || selectedItem.store?.id || selectedItem.id;
    return [...list].sort((a, b) => {
      const aId = a.bestOffer?.id || a.store?.id || a.id;
      const bId = b.bestOffer?.id || b.store?.id || b.id;
      if (aId === targetId) return -1;
      if (bId === targetId) return 1;
      return 0;
    });
  }, [filterType, productList, serviceList, storeList, selectedItem]);

  const toggleExpand = () => {
    setSheetState((prev) => (prev === 'collapsed' ? 'open' : 'collapsed'));
  };

  const heightClass = sheetState === 'collapsed' ? 'h-[64px]' : 'h-[64vh]';

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
              {filterType === 'product' ? 'Topilgan tovarlar' : filterType === 'service' ? 'Xizmatlar' : 'Do‘konlar'}
            </span>
            <span className="bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] text-xs font-black px-2 py-0.5 rounded-full shrink-0">
              {filteredList.length} ta
            </span>

            {selectedItem?.bestOffer?.variant?.title ? (
              <span className="text-xs font-semibold text-[#087F5B] dark:text-[#4ADE80] truncate max-w-[120px]">
                · {selectedItem.bestOffer.variant.title}
              </span>
            ) : (
              <span className="text-xs text-[#64748B] dark:text-[#8B9E95] truncate">
                {searchQuery.trim() ? `"${searchQuery}"` : cleanLocation}
              </span>
            )}

            {searchQuery.trim() && onClearSearch && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearSearch();
                }}
                className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"
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

      {/* Filter Tabs: Tovar (default) | Xizmat | Do‘kon */}
      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar border-b border-[#E2E8F0]/70 dark:border-[#273B32]/70 bg-slate-50/70 dark:bg-[#111A15]/70 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setFilterType('product');
            if (sheetState === 'collapsed') setSheetState('open');
          }}
          className={`px-3 py-1 rounded-full text-xs font-black transition cursor-pointer shrink-0 flex items-center gap-1 select-none active:scale-95 ${
            filterType === 'product'
              ? 'bg-[#087F5B] text-white shadow-xs'
              : 'bg-white dark:bg-[#1A2822] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#273B32]'
          }`}
        >
          <span>🛍️</span>
          <span>Tovar ({productCount})</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setFilterType('service');
            if (sheetState === 'collapsed') setSheetState('open');
          }}
          className={`px-3 py-1 rounded-full text-xs font-black transition cursor-pointer shrink-0 flex items-center gap-1 select-none active:scale-95 ${
            filterType === 'service'
              ? 'bg-[#087F5B] text-white shadow-xs'
              : 'bg-white dark:bg-[#1A2822] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#273B32]'
          }`}
        >
          <span>🛠️</span>
          <span>Xizmat ({serviceCount})</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setFilterType('store');
            if (sheetState === 'collapsed') setSheetState('open');
          }}
          className={`px-3 py-1 rounded-full text-xs font-black transition cursor-pointer shrink-0 flex items-center gap-1 select-none active:scale-95 ${
            filterType === 'store'
              ? 'bg-[#087F5B] text-white shadow-xs'
              : 'bg-white dark:bg-[#1A2822] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#273B32]'
          }`}
        >
          <span>🏪</span>
          <span>Do‘kon ({storeCount})</span>
        </button>
      </div>

      {/* Content list */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 pb-6">
        {/* Quick search pills when query is empty */}
        {!hasActiveSearch && (
          <div className="pb-1 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
            {POPULAR_SEARCH_PILLS.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => {
                  onSearchQuery?.(pill);
                  if (sheetState === 'collapsed') setSheetState('open');
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-[#E8F5EE] dark:bg-[#1A2822] text-[#172B26] hover:text-[#087F5B] dark:text-[#E8F2EC] text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
              >
                <ShoppingBag className="w-3 h-3 text-[#087F5B]" />
                <span>{pill}</span>
              </button>
            ))}
          </div>
        )}

        {/* Results / List rendering */}
        {filteredList.length === 0 ? (
          <div className="text-center py-10 text-[#64748B] dark:text-[#8B9E95] text-xs flex flex-col items-center gap-2">
            <span className="text-2xl">📦</span>
            <span className="font-extrabold text-[#172B26] dark:text-white">
              {filterType === 'service'
                ? 'Hozircha hech qanday xizmat topilmadi'
                : filterType === 'product'
                ? (!hasActiveSearch ? 'Qidiruv maydoniga tovar nomini yozing' : 'Hozircha hech qanday tovar topilmadi')
                : 'Hozircha hech qanday do‘kon topilmadi'}
            </span>
            <p className="text-[11px] text-slate-400">
              {!hasActiveSearch && filterType === 'product'
                ? 'Kerakli tovar nomini yozing yoki takliflardan birini tanlang'
                : 'Boshqa toifa yoki so‘rov bilan qidirib ko‘ring'}
            </p>
            {filterType !== 'product' && (
              <button
                type="button"
                onClick={() => setFilterType('product')}
                className="mt-1 px-3 py-1.5 bg-[#087F5B] text-white rounded-xl text-xs font-bold"
              >
                Tovarlarni ko‘rsatish
              </button>
            )}
            {hasActiveSearch && onClearSearch && (
              <button
                type="button"
                onClick={onClearSearch}
                className="mt-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Qidiruvni tozalash</span>
              </button>
            )}
          </div>
        ) : (
          filteredList.map((item, idx) => {
            // If item has bestOffer, render ProductSearchCard
            if (item.bestOffer) {
              const storeObj = item.store || item;
              const isSelected = Boolean(
                selectedItem &&
                  (selectedItem.bestOffer?.id === item.bestOffer?.id ||
                    selectedItem.store?.id === storeObj.id ||
                    selectedItem.id === storeObj.id)
              );
              return (
                <ProductSearchCard
                  key={item.bestOffer?.id || `prod-${idx}`}
                  item={item}
                  isSelected={isSelected}
                  onSelect={() => onSelectItem(item)}
                  onOpenStore={onOpenStore}
                  onGetRoute={onGetRoute}
                  onOpenProductModal={onOpenProductModal}
                />
              );
            }

            // Otherwise, render StoreCard for store/service items
            const storeObj = item.store || item;
            const isSelected = Boolean(
              selectedItem && (selectedItem.store?.id === storeObj.id || selectedItem.id === storeObj.id)
            );
            return (
              <StoreCard
                key={storeObj.id || `store-${idx}`}
                store={storeObj}
                distanceM={item.distanceM}
                isSelected={isSelected}
                onSelect={() => onSelectItem(item)}
                onOpenStore={onOpenStore}
                onGetRoute={(st) => onGetRoute({ store: st, distanceM: item.distanceM })}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
