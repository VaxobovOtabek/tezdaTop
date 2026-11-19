import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Compass,
  Crosshair,
  Search,
  X,
  SlidersHorizontal,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Navigation,
  XCircle,
  Package,
  List,
  LayoutGrid,
  RotateCcw
} from 'lucide-react';
import { StoreSearchResult, RouteResponse } from '@yaqintop/contracts';
import { ProductSearchCard } from './ProductSearchCard';
import { StoreCard } from './StoreCard';
import { NearbyStoreItem } from './InteractiveMap';
import { isItemService, isItemProduct } from './MobileBottomSheet';

export interface DesktopSearchSidebarProps {
  selectedLocationName: string;
  isRegionChosen?: boolean;
  onOpenLocationPicker: () => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSearch: (q?: string) => void;
  onClearSearch: () => void;
  radiusM: number;
  onRadiusChange: (r: number) => void;
  onOpenFilter: () => void;
  results: StoreSearchResult[];
  nearbyStores: NearbyStoreItem[];
  selectedResult: StoreSearchResult | null;
  selectedNearbyStore: NearbyStoreItem | null;
  onSelectStore: (item: StoreSearchResult) => void;
  onSelectNearbyStore: (item: NearbyStoreItem) => void;
  onOpenStore: (storeId: string) => void;
  onGetRoute: (store: any) => void;
  onOpenProductModal?: (item: StoreSearchResult) => void;
  isLoading?: boolean;
  onLocateUser: () => void;
  view: 'search' | 'detail' | 'route' | 'saved' | 'profile' | 'products' | 'product-detail';
  routeData: RouteResponse | null;
  routeMode: 'walking' | 'driving';
  onChangeRouteMode: (mode: 'walking' | 'driving') => void;
  onStopRoute: () => void;
  activeCategoryId?: string;
  onSelectCategory?: (id: string) => void;
  searchError?: string | null;
  searchTab?: 'product' | 'service' | 'store';
  onSelectSearchTab?: (tab: 'product' | 'service' | 'store') => void;
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  query: string;
}

export const QUICK_CATEGORIES: CategoryItem[] = [
  { id: 'all', name: 'Hammasi', icon: '✨', query: '' },
  { id: 'supermarket', name: 'Supermarket', icon: '🛒', query: 'Supermarket' },
  { id: 'store', name: "Do'kon", icon: '🏪', query: "Do'kon" },
  { id: 'bakery', name: 'Novvoyxona', icon: '🥖', query: 'Non' },
  { id: 'meat', name: 'Go‘sht', icon: '🥩', query: 'Go‘sht' },
  { id: 'pharmacy', name: 'Dorixona', icon: '💊', query: 'Dorixona' },
  { id: 'restaurant', name: 'Restoran', icon: '🍲', query: 'Restoran' },
  { id: 'fastfood', name: 'Fast Fud', icon: '🍔', query: 'Lavash' },
  { id: 'cafe', name: 'Kafe', icon: '☕', query: 'Kafe' },
  { id: 'sweets', name: 'Shirinliklar', icon: '🍰', query: 'Shirinlik' },
  { id: 'fruits', name: 'Mevalar', icon: '🍎', query: 'Meva' },
  { id: 'dairy', name: 'Sut mahsulotlari', icon: '🥛', query: 'Sut' },
  { id: 'flowers', name: 'Gullar', icon: '💐', query: 'Gul' },
  { id: 'auto', name: 'Avtoservis', icon: '🚗', query: 'Avto' },
  { id: 'household', name: 'Xo‘jalik', icon: '🧹', query: 'Xo‘jalik' },
  { id: 'clothing', name: 'Kiyimlar', icon: '👕', query: 'Kiyim' }
];

const POPULAR_PILLS = ['Non', 'Sut', 'Yog‘', 'Shakar', 'Choy', 'Tuxum', 'Dorixona', 'Go‘sht'];

export const DesktopSearchSidebar: React.FC<DesktopSearchSidebarProps> = ({
  selectedLocationName,
  isRegionChosen = true,
  onOpenLocationPicker,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  onClearSearch,
  radiusM,
  onRadiusChange: _onRadiusChange,
  onOpenFilter,
  results,
  nearbyStores,
  selectedResult,
  selectedNearbyStore,
  onSelectStore,
  onSelectNearbyStore,
  onOpenStore,
  onGetRoute,
  onOpenProductModal,
  isLoading = false,
  onLocateUser,
  view,
  routeData,
  routeMode,
  onChangeRouteMode,
  onStopRoute,
  activeCategoryId: controlledCategoryId,
  onSelectCategory,
  searchError,
  searchTab = 'product',
  onSelectSearchTab
}) => {
  const [internalCategoryId, setInternalCategoryId] = useState<string>('all');
  const activeCategoryId = controlledCategoryId ?? internalCategoryId;
  const [viewMode, setViewMode] = useState<'list' | 'grid-2'>('list');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  const cleanLocation = selectedLocationName ? selectedLocationName.split(',')[0] : 'Barcha tumanlar';
  const hasSearch = Boolean(searchQuery.trim());

  const productsList = useMemo(() => results.filter(isItemProduct), [results]);
  const servicesList = useMemo(() => {
    const fromResults = results.filter(isItemService);
    const fromStores = nearbyStores.filter(isItemService);
    return [...fromResults, ...fromStores];
  }, [results, nearbyStores]);
  const storesList = useMemo(() => nearbyStores, [nearbyStores]);

  const activeItems = useMemo(() => {
    if (searchTab === 'service') return servicesList;
    if (searchTab === 'store') return storesList;
    return productsList;
  }, [searchTab, productsList, servicesList, storesList]);

  const productsCount = productsList.length;
  const servicesCount = servicesList.length;
  const storesCount = storesList.length;

  const pageSize = 10;
  const totalItems = activeItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const effectivePage = Math.min(Math.max(1, currentPage), totalPages);

  // Reset to first page when query, category, tab or items change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategoryId, searchTab, results.length, nearbyStores.length]);

  const paginatedItems = useMemo(() => {
    const start = (effectivePage - 1) * pageSize;
    return activeItems.slice(start, start + pageSize);
  }, [activeItems, effectivePage, pageSize]);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesScrollRef.current) {
      const scrollAmount = categoriesScrollRef.current.clientWidth;
      categoriesScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };


  const handleCategoryClick = (cat: typeof QUICK_CATEGORIES[0]) => {
    if (onSelectCategory) {
      onSelectCategory(cat.id);
    } else {
      setInternalCategoryId(cat.id);
    }
    onSelectStore(null as any);
    onSelectNearbyStore(null as any);
    if (!cat.query) {
      onSearchQueryChange('');
      onClearSearch();
    } else {
      onSearchQueryChange(cat.query);
      onSearch(cat.query);
    }
  };

  const gridClass =
    viewMode === 'grid-2'
      ? 'grid grid-cols-2 gap-2'
      : 'flex flex-col space-y-2.5';

  return (
    <aside className="hidden md:flex w-[440px] lg:w-[470px] xl:w-[500px] shrink-0 h-full flex-col gap-2.5 min-h-0 z-10">
      {/* Route Mode Header & Details */}
      {view === 'route' ? (
        <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-5 space-y-4 bg-white dark:bg-[#14201A] rounded-2xl md:rounded-3xl border border-[#CBD5E1] dark:border-[#273B32] shadow-xs">
          <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/40 p-3 rounded-2xl border border-red-200 dark:border-red-900/50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]">Marshrut rejimi faol</span>
            </div>
            <button
              onClick={onStopRoute}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>To‘xtatish</span>
            </button>
          </div>

          <div>
            <h2 className="text-xl font-black tracking-tight text-[#172C28] dark:text-white">Do‘konga yo‘l</h2>
            {(selectedResult?.store || selectedNearbyStore?.store) && (
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                {(selectedResult?.store || selectedNearbyStore?.store)?.name} · {(selectedResult?.store || selectedNearbyStore?.store)?.address}
              </p>
            )}
          </div>

          {/* Walking / Driving Mode Tabs */}
          <div className="flex gap-2 p-1 bg-[#F3F6F3] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36]">
            <button
              onClick={() => onChangeRouteMode('walking')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                routeMode === 'walking'
                  ? 'bg-[#087F5B] text-white shadow-xs'
                  : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
              }`}
            >
              🚶 Piyoda
            </button>
            <button
              onClick={() => onChangeRouteMode('driving')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                routeMode === 'driving'
                  ? 'bg-[#087F5B] text-white shadow-xs'
                  : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
              }`}
            >
              🚗 Avtomobil
            </button>
          </div>

          {routeData ? (
            <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#1A2822] border border-[#CBD5E1] dark:border-[#273B32] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#566A63] dark:text-[#8B9E95]">Masofa:</span>
                <span className="font-extrabold text-[#172C28] dark:text-white">
                  {routeData.distanceM >= 1000 ? `${(routeData.distanceM / 1000).toFixed(1)} km` : `${routeData.distanceM} m`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#566A63] dark:text-[#8B9E95]">Taxminiy vaqt:</span>
                <span className="font-extrabold text-[#087F5B] dark:text-[#4ADE80]">
                  {Math.round(routeData.durationSec / 60) || 1} daqiqa
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-[#566A63] dark:text-[#8B9E95] flex flex-col items-center gap-2 bg-[#F8FAFC] dark:bg-[#1A2822] rounded-2xl border border-dashed border-[#CBD5E1] dark:border-[#273B32]">
              <div className="w-5 h-5 border-2 border-[#087F5B] border-t-transparent rounded-full animate-spin" />
              <span>Marshrut hisoblanmoqda...</span>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Top Panel: Location + Categories + Search & Filters (Separated Card) */}
          <div className="bg-white dark:bg-[#14201A] rounded-2xl md:rounded-3xl border border-[#CBD5E1] dark:border-[#273B32] shadow-xs overflow-hidden shrink-0">
            {/* 1. Location Bar (Matching Tejam screenshot) */}
            <div className="flex items-center justify-between px-3.5 pt-3 pb-2.5 border-b border-[#E2E8F0] dark:border-[#273B32]">
              <button
                type="button"
                onClick={onOpenLocationPicker}
                className={`flex items-center gap-2 group text-left transition cursor-pointer select-none ${
                  !isRegionChosen
                    ? 'border border-red-500 bg-red-50 dark:bg-red-950/60 px-2.5 py-1 rounded-xl ring-2 ring-red-400 animate-pulse'
                    : ''
                }`}
                title="Hududni tanlash"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  !isRegionChosen
                    ? 'bg-red-100 text-red-600'
                    : 'bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80]'
                }`}>
                  <Compass className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-black text-[#172B26] dark:text-white">Joriy manzil</span>
                  <span className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] group-hover:text-[#087F5B] dark:group-hover:text-[#4ADE80] flex items-center gap-0.5 truncate max-w-[150px]">
                    {cleanLocation}
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={onLocateUser}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/60 font-bold text-xs transition cursor-pointer active:scale-95 shrink-0 shadow-2xs"
                title="Yaqin atrofdan qidirish"
              >
                <MapPin className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                <span>Yaqinimda</span>
              </button>
            </div>

            {/* 2. Category Icon Circles Row (with < and > scroll buttons) */}
            <div className="relative flex items-center px-1.5 py-3 border-b border-[#E2E8F0] dark:border-[#273B32]">
              {/* Scroll Left Button */}
              <button
                type="button"
                onClick={() => scrollCategories('left')}
                className="w-6 h-6 rounded-full bg-white dark:bg-[#1A2822] border border-[#CBD5E1] dark:border-[#2E4237] hover:border-[#087F5B] text-[#566A63] hover:text-[#087F5B] dark:text-[#8B9E95] dark:hover:text-[#4ADE80] flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition active:scale-90 mr-1 select-none"
                title="Oldingi toifalar"
                aria-label="Oldingi toifalar"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Scrollable Row */}
              <div
                ref={categoriesScrollRef}
                className="flex-1 overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-1 py-1 snap-x snap-mandatory"
              >
                {QUICK_CATEGORIES.map((cat) => {
                  const isSelected = activeCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryClick(cat)}
                      className="flex flex-col items-center gap-1 shrink-0 basis-[calc((100%-18px)/6)] min-w-0 snap-start group cursor-pointer transition select-none active:scale-95"
                      title={cat.name}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-150 ${
                          isSelected
                            ? 'bg-[#E8F5EE] dark:bg-[#1E362A] border-2 border-[#087F5B] shadow-2xs scale-105'
                            : 'bg-[#F8FAFC] dark:bg-[#1A2822] border border-[#CBD5E1] dark:border-[#2E4237] group-hover:border-[#087F5B]/60 group-hover:bg-white shadow-2xs'
                        }`}
                      >
                        <span className="leading-none">{cat.icon}</span>
                      </div>
                      <span
                        className={`text-[10px] leading-tight text-center truncate w-full px-0.5 ${
                          isSelected
                            ? 'font-extrabold text-[#087F5B] dark:text-[#4ADE80]'
                            : 'font-medium text-[#566A63] dark:text-[#94A3B8] group-hover:text-[#172B26]'
                        }`}
                      >
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Scroll Right Button */}
              <button
                type="button"
                onClick={() => scrollCategories('right')}
                className="w-6 h-6 rounded-full bg-white dark:bg-[#1A2822] border border-[#CBD5E1] dark:border-[#2E4237] hover:border-[#087F5B] text-[#566A63] hover:text-[#087F5B] dark:text-[#8B9E95] dark:hover:text-[#4ADE80] flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition active:scale-90 ml-1 select-none"
                title="Keyingi toifalar"
                aria-label="Keyingi toifalar"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3. Search Bar + District Dropdown + Yaqinimda */}
            <div className="p-2.5 flex items-center gap-1.5">
              {/* Search Input */}
              <div className="flex-1 min-w-0 relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch(searchQuery)}
                  placeholder="Do‘kon yoki tovar qidirish"
                  className="w-full h-9 pl-8 pr-7 rounded-xl bg-[#F8FAFC] dark:bg-[#16241E] border border-[#CBD5E1] dark:border-[#273B32] text-xs font-semibold text-[#172B26] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#087F5B] focus:ring-1 focus:ring-[#087F5B] transition truncate"
                />
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={onClearSearch}
                    className="absolute right-2 text-[#94A3B8] hover:text-red-500 p-0.5"
                    title="Tozalash"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter / Radius Pill */}
              <button
                type="button"
                onClick={onOpenFilter}
                className="h-9 px-2 rounded-xl bg-[#F8FAFC] dark:bg-[#16241E] border border-[#CBD5E1] dark:border-[#273B32] hover:border-[#087F5B] flex items-center gap-1 text-xs font-bold text-[#172B26] dark:text-white transition shrink-0 cursor-pointer"
                title="Filtr va masofa"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#087F5B]" />
                <span className="hidden lg:inline text-[11px]">
                  {radiusM ? (radiusM >= 1000 ? `${radiusM / 1000}km` : `${radiusM}m`) : 'Masofa'}
                </span>
              </button>

              {/* Qidiruvni tozalash Button (Faqat ikonka) */}
              <button
                type="button"
                onClick={() => {
                  if (onSelectCategory) {
                    onSelectCategory('all');
                  } else {
                    setInternalCategoryId('all');
                  }
                  onClearSearch();
                }}
                className={`h-9 w-9 rounded-xl border flex items-center justify-center transition shrink-0 active:scale-95 cursor-pointer shadow-2xs ${
                  hasSearch || activeCategoryId !== 'all'
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60'
                    : 'bg-[#F8FAFC] dark:bg-[#16241E] border-[#CBD5E1] dark:border-[#273B32] text-[#566A63] hover:text-[#172B26] dark:text-[#8B9E95] dark:hover:text-white hover:border-[#087F5B]'
                }`}
                title="Qidiruvni tozalash"
                aria-label="Qidiruvni tozalash"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* 4. Search Filter Tabs: Tovar (default) | Xizmat | Do‘kon */}
            <div className="flex items-center gap-1.5 px-2.5 pb-2.5 pt-0.5 border-t border-[#E2E8F0]/70 dark:border-[#273B32]/70 bg-slate-50/50 dark:bg-[#111A15]/50">
              <button
                type="button"
                onClick={() => onSelectSearchTab?.('product')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer select-none active:scale-95 ${
                  searchTab === 'product'
                    ? 'bg-[#087F5B] text-white shadow-xs'
                    : 'bg-white dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border border-[#CBD5E1] dark:border-[#2E4237] hover:border-[#087F5B]'
                }`}
              >
                <span>🛍️</span>
                <span>Tovar ({productsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectSearchTab?.('service')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer select-none active:scale-95 ${
                  searchTab === 'service'
                    ? 'bg-[#087F5B] text-white shadow-xs'
                    : 'bg-white dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border border-[#CBD5E1] dark:border-[#2E4237] hover:border-[#087F5B]'
                }`}
              >
                <span>🛠️</span>
                <span>Xizmat ({servicesCount})</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectSearchTab?.('store')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer select-none active:scale-95 ${
                  searchTab === 'store'
                    ? 'bg-[#087F5B] text-white shadow-xs'
                    : 'bg-white dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border border-[#CBD5E1] dark:border-[#2E4237] hover:border-[#087F5B]'
                }`}
              >
                <span>🏪</span>
                <span>Do‘kon ({storesCount})</span>
              </button>
            </div>
          </div>

          {/* Bottom Results Feed Card: Distinctly separated from the top panel */}
          <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-[#14201A] rounded-2xl md:rounded-3xl border border-[#CBD5E1] dark:border-[#273B32] shadow-xs overflow-hidden">
            {/* Results Header Counter & Layout Switcher */}
            <div className="px-3.5 py-2 bg-[#F8FAFC] dark:bg-[#16241E] border-b border-[#E2E8F0] dark:border-[#273B32] flex items-center justify-between shrink-0 gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#087F5B]" />
                <span className="text-xs font-black text-[#172B26] dark:text-white truncate">
                  {searchTab === 'product'
                    ? `${productsCount} ta tovar`
                    : searchTab === 'service'
                    ? `${servicesCount} ta xizmat`
                    : `${storesCount} ta do‘kon`}
                </span>
                {totalPages > 1 && (
                  <span className="text-[11px] font-semibold text-[#566A63] dark:text-[#8B9E95] ml-1 shrink-0">
                    ({effectivePage}/{totalPages}-sahifa)
                  </span>
                )}
                {isLoading && (
                  <span className="text-[#087F5B] dark:text-[#4ADE80] text-[11px] font-bold flex items-center gap-1 ml-1">
                    <div className="w-2.5 h-2.5 border-2 border-[#087F5B] border-t-transparent rounded-full animate-spin" />
                  </span>
                )}
              </div>

              {/* Layout Switcher: Spisok va 2 tadan (Faqat ikonkalar) */}
              <div className="flex items-center gap-1 bg-[#EDF3FA] dark:bg-[#1E2D25] p-1 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Ro‘yxat (Spisok)"
                  className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-[#14201A] text-[#087F5B] dark:text-[#4ADE80] shadow-2xs'
                      : 'text-[#64748B] dark:text-[#8B9E95] hover:text-[#172B26] dark:hover:text-white'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid-2')}
                  title="2 tadan katakcha"
                  className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                    viewMode === 'grid-2'
                      ? 'bg-white dark:bg-[#14201A] text-[#087F5B] dark:text-[#4ADE80] shadow-2xs'
                      : 'text-[#64748B] dark:text-[#8B9E95] hover:text-[#172B26] dark:hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Results Body: Scrollable list with dynamic grid */}
            <div ref={resultsContainerRef} className="flex-1 overflow-y-auto p-3 min-h-0 bg-[#F8FAFC]/40 dark:bg-[#0E1713]/30">
              {paginatedItems.length > 0 ? (
                <div className={gridClass}>
                  {paginatedItems.map((item: any, idx: number) => {
                    if (item.bestOffer) {
                      return (
                        <ProductSearchCard
                          key={item.bestOffer?.id || `res-${idx}`}
                          item={item}
                          isSelected={selectedResult?.bestOffer?.id === item.bestOffer?.id}
                          onSelect={() => onSelectStore(item)}
                          onOpenStore={onOpenStore}
                          onGetRoute={onGetRoute}
                          onOpenProductModal={onOpenProductModal}
                          viewMode={viewMode}
                        />
                      );
                    }
                    const storeObj = item.store || item;
                    return (
                      <StoreCard
                        key={storeObj.id || `store-${idx}`}
                        store={storeObj}
                        distanceM={item.distanceM}
                        isSelected={selectedNearbyStore?.store?.id === storeObj.id}
                        onSelect={() => onSelectNearbyStore(item)}
                        onOpenStore={onOpenStore}
                        onGetRoute={(st) => onGetRoute({ store: st, distanceM: item.distanceM })}
                        viewMode={viewMode}
                      />
                    );
                  })}
                </div>
              ) : searchError ? (
                /* Error / Retry State */
                <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none my-auto">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-3xl shadow-sm mb-3">
                    ⚠️
                  </div>
                  <h4 className="text-sm font-extrabold text-[#172B26] dark:text-[#E8F2EC] mb-1">
                    {searchError}
                  </h4>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] max-w-[280px] mb-4">
                    Server vaqtincha ulanishni yangilamoqda. Qaytadan urinib ko‘ring.
                  </p>
                  <button
                    type="button"
                    onClick={() => onSearch(searchQuery)}
                    className="px-4 py-2 rounded-xl bg-[#087F5B] hover:bg-[#066549] text-white text-xs font-bold shadow-md cursor-pointer active:scale-95 transition"
                  >
                    🔄 Qayta qidirish
                  </button>
                </div>
              ) : (
                /* Empty Box State */
                <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none my-auto">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-3xl shadow-sm mb-3">
                    📦
                  </div>
                  <h4 className="text-sm font-extrabold text-[#172B26] dark:text-[#E8F2EC] mb-1">
                    {searchTab === 'product'
                      ? (!hasSearch ? 'Qidiruv maydoniga tovar nomini yozing' : 'Ushbu hududda tovarlar topilmadi.')
                      : searchTab === 'service'
                      ? 'Ushbu hududda xizmatlar topilmadi.'
                      : 'Ushbu hududda do‘konlar topilmadi.'}
                  </h4>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] max-w-[280px] mb-4">
                    {!hasSearch && searchTab === 'product'
                      ? 'Kerakli tovar nomini yozing yoki pastdagi mashhur mahsulotlardan birini tanlang'
                      : 'Boshqa tovar yoki do‘kon nomini qidirib ko‘ring yoki takliflardan tanlang'}
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center max-w-[320px]">
                    {POPULAR_PILLS.map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => {
                          onSearchQueryChange(pill);
                          onSearch(pill);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E2D25] border border-[#CBD5E1] dark:border-[#2E4237] hover:bg-[#E8F5EE] dark:hover:bg-[#1E362A] text-[#172B26] dark:text-white hover:text-[#087F5B] dark:hover:text-[#4ADE80] text-xs font-semibold transition cursor-pointer shadow-2xs"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pagination Controls Footer */}
            {totalPages > 1 && (
              <div className="px-3 py-2 bg-[#F8FAFC] dark:bg-[#16241E] border-t border-[#E2E8F0] dark:border-[#273B32] flex items-center justify-between gap-1.5 shrink-0 select-none">
                {/* Prev Button */}
                <button
                  type="button"
                  disabled={effectivePage <= 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    resultsContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#14201A] text-xs font-bold text-[#172B26] dark:text-[#E8F2EC] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] disabled:opacity-35 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Oldingi sahifa"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Oldingi</span>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                    .filter((page) => {
                      if (totalPages <= 5) return true;
                      if (page === 1 || page === totalPages) return true;
                      return Math.abs(page - effectivePage) <= 1;
                    })
                    .map((page, i, arr) => {
                      const prev = arr[i - 1];
                      const showEllipsis = prev && page - prev > 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="px-1 text-xs text-[#566A63] dark:text-[#8B9E95] font-bold">
                              ...
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentPage(page);
                              resultsContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`min-w-7 h-7 px-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                              effectivePage === page
                                ? 'bg-[#087F5B] text-white shadow-2xs'
                                : 'bg-white dark:bg-[#14201A] text-[#172B26] dark:text-[#E8F2EC] border border-[#DCE5DF] dark:border-[#2A3F36] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  disabled={effectivePage >= totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    resultsContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#14201A] text-xs font-bold text-[#172B26] dark:text-[#E8F2EC] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] disabled:opacity-35 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Keyingi sahifa"
                >
                  <span className="hidden sm:inline">Keyingi</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
};
