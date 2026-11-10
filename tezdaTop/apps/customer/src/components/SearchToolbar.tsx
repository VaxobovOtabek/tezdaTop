import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, ChevronDown, Compass, ArrowUpDown, X, RotateCcw, Check, Layers, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from '@yaqintop/ui';

interface SearchToolbarProps {
  selectedLocationName: string;
  onOpenLocationPicker: () => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSearch: (q?: string) => void;
  onClearSearch?: () => void;
  radiusM: number;
  onRadiusChange: (r: number) => void;
  selectedSort: 'relevance' | 'distance' | 'price';
  onSortChange: (sort: 'relevance' | 'distance' | 'price') => void;
  isSearching?: boolean;
  isDrawerOpen?: boolean;
  onOpenDrawer?: () => void;
  onOpenFilter?: () => void;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  selectedLocationName,
  onOpenLocationPicker,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  onClearSearch,
  radiusM,
  onRadiusChange,
  selectedSort,
  onSortChange,
  isSearching = false,
  isDrawerOpen = true,
  onOpenDrawer,
  onOpenFilter
}) => {
  const { t } = useTranslation();

  const [isRadiusOpen, setIsRadiusOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const radiusRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);

  // Close custom dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (radiusRef.current && !radiusRef.current.contains(e.target as Node)) {
        setIsRadiusOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const radiusOptions = [
    { value: 100, label: '100 m' },
    { value: 500, label: '500 m' },
    { value: 1000, label: '1 km' },
    { value: 3000, label: '3 km' }
  ];

  const sortOptions: { value: 'relevance' | 'distance' | 'price'; label: string; shortLabel: string }[] = [
    { value: 'distance', label: "Yaqinlik bo'yicha", shortLabel: 'Yaqinlik' },
    { value: 'price', label: 'Arzonroq', shortLabel: 'Arzon' },
    { value: 'relevance', label: 'Reytingi yuqori', shortLabel: 'Reyting' }
  ];

  const handleClear = () => {
    onSearchQueryChange('');
    if (onClearSearch) {
      onClearSearch();
    } else {
      onSearch('');
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#14201A] rounded-2xl border border-[#CBD5E1] dark:border-[#273B32] shadow-xl p-1 sm:p-1.5 md:p-2 flex items-center gap-1.5 sm:gap-2 transition-all z-20 max-w-full">
      {/* 1. Qayerdan qidiramiz? */}
      <button
        type="button"
        onClick={onOpenLocationPicker}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl border border-[#CBD5E1] dark:border-[#273B32] bg-[#F8FAFC] dark:bg-[#16241E] hover:border-[#087F5B] hover:bg-white dark:hover:bg-[#1E3328] transition cursor-pointer select-none shrink-0 shadow-2xs"
        title="Hududni o'zgartirish"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E8F5EE] dark:bg-[#1E362A] flex items-center justify-center text-[#087F5B] dark:text-[#4ADE80] shrink-0">
          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-semibold text-[#64748B] dark:text-[#8B9E95] leading-tight hidden 2xl:inline">
            Qayerdan qidiramiz?
          </span>
          <div className="flex items-center gap-1 font-bold text-xs sm:text-sm text-[#172B26] dark:text-white leading-tight whitespace-nowrap">
            <span className="max-w-[64px] sm:max-w-[80px] xl:max-w-[110px] truncate">{selectedLocationName.split(',')[0]}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] dark:text-[#8B9E95] shrink-0" />
          </div>
        </div>
      </button>

      {/* 2. Asosiy Qidiruv Maydoni (Qaysi mahsulot yoki xizmat?) - Capsule Pill matching reference */}
      <div className="flex-1 flex items-center gap-2 sm:gap-2.5 p-1 sm:p-1.5 md:p-2 pl-1.5 sm:pl-2.5 pr-1.5 sm:pr-2.5 rounded-full bg-white dark:bg-[#14201A] border-2 border-[#CBD5E1] dark:border-[#2E4237] hover:border-[#087F5B] focus-within:border-[#087F5B] focus-within:ring-2 focus-within:ring-[#087F5B]/20 shadow-xs hover:shadow-sm transition-all min-w-[140px] sm:min-w-[180px] md:min-w-[220px]">
        {/* Left Circular Dark Green Search Button */}
        <button
          type="button"
          onClick={() => onSearch()}
          className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-[#087F5B] hover:bg-[#065F46] active:scale-95 text-white flex items-center justify-center shrink-0 shadow-xs transition cursor-pointer"
          title="Qidirish"
        >
          <Search className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 text-white stroke-[2.5] ${isSearching ? 'animate-spin' : ''}`} />
        </button>

        {/* Center Text Area: Title + Input */}
        <div className="flex-1 flex flex-col justify-center min-w-0 px-1 sm:px-2">
          <label
            htmlFor="toolbar-search-input"
            className="text-[9px] sm:text-[10px] md:text-[11px] font-black text-[#1E293B] dark:text-[#E2E8F0] tracking-wider uppercase leading-none cursor-text select-none truncate"
          >
            QAYSI MAHSULOT YOKI XIZMAT?
          </label>
          <div className="relative flex items-center mt-0.5 sm:mt-1">
            <input
              id="toolbar-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder="Masalan: Burger, lavash, dorixona"
              className="w-full bg-transparent text-xs sm:text-[13px] md:text-[14px] font-medium text-[#1E293B] dark:text-white placeholder:text-[#64748B] dark:placeholder:text-[#94A3B8] focus:outline-none pr-4 sm:pr-5 leading-tight truncate"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-0 text-[#64748B] hover:text-red-500 dark:hover:text-red-400 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer shrink-0"
                title="Qidiruvni tozalash"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Sliders / Filter Button */}
        {onOpenFilter && (
          <button
            type="button"
            onClick={onOpenFilter}
            className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-2xl bg-[#F1F5F9] dark:bg-[#1E2D25] hover:bg-[#E2E8F0] dark:hover:bg-[#283C32] text-[#64748B] dark:text-[#94A3B8] hover:text-[#172B26] dark:hover:text-white flex items-center justify-center transition active:scale-95 shrink-0 cursor-pointer shadow-2xs"
            title="Qo‘shimcha filtrlar"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
          </button>
        )}
      </div>

      {/* 3. Radius Custom Dropdown */}
      <div ref={radiusRef} className="hidden sm:block relative shrink-0">
        <button
          type="button"
          onClick={() => {
            setIsRadiusOpen(!isRadiusOpen);
            setIsSortOpen(false);
          }}
          className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none shadow-2xs ${
            isRadiusOpen
              ? 'border-2 border-[#087F5B] ring-2 ring-[#087F5B]/20 bg-white dark:bg-[#1A2822]'
              : 'border border-[#CBD5E1] dark:border-[#273B32] bg-[#F8FAFC] dark:bg-[#16241E] hover:border-[#087F5B] hover:bg-white dark:hover:bg-[#1E3328]'
          }`}
          title="Qidiruv radiusi"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E8F5EE] dark:bg-[#1E362A] flex items-center justify-center text-[#087F5B] dark:text-[#4ADE80] shrink-0">
            <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-semibold text-[#64748B] dark:text-[#8B9E95] leading-tight hidden 2xl:inline">
              Radius
            </span>
            <div className="font-bold text-xs sm:text-sm text-[#172B26] dark:text-white leading-tight whitespace-nowrap">
              {radiusOptions.find((r) => r.value === radiusM)?.label || `${radiusM} m`}
            </div>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#64748B] dark:text-[#8B9E95] transition-transform duration-200 ml-0.5 shrink-0 ${
              isRadiusOpen ? 'rotate-180 text-[#087F5B]' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu - 100% Solid background, no glass effect */}
        {isRadiusOpen && (
          <div className="absolute top-[calc(100%+8px)] left-0 min-w-[170px] z-50 bg-white dark:bg-[#182620] rounded-2xl border-2 border-[#CBD5E1] dark:border-[#2E4237] shadow-[0_12px_36px_rgba(0,0,0,0.18)] p-1.5 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 text-[10px] font-extrabold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider border-b border-[#F1F5F9] dark:border-[#263D33] mb-0.5">
              Radiusni tanlang
            </div>
            {radiusOptions.map((opt) => {
              const isSelected = radiusM === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onRadiusChange(opt.value);
                    setIsRadiusOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80]'
                      : 'text-[#172B26] dark:text-[#E8F2EC] hover:bg-[#F1F5F9] dark:hover:bg-[#203328]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#087F5B] dark:text-[#4ADE80] stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Saralash Custom Dropdown */}
      <div ref={sortRef} className={`relative shrink-0 ${isDrawerOpen ? 'hidden xl:block' : 'hidden lg:block'}`}>
        <button
          type="button"
          onClick={() => {
            setIsSortOpen(!isSortOpen);
            setIsRadiusOpen(false);
          }}
          className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none shadow-2xs ${
            isSortOpen
              ? 'border-2 border-[#087F5B] ring-2 ring-[#087F5B]/20 bg-white dark:bg-[#1A2822]'
              : 'border border-[#CBD5E1] dark:border-[#273B32] bg-[#F8FAFC] dark:bg-[#16241E] hover:border-[#087F5B] hover:bg-white dark:hover:bg-[#1E3328]'
          }`}
          title="Saralash tartibi"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E8F5EE] dark:bg-[#1E362A] flex items-center justify-center text-[#087F5B] dark:text-[#4ADE80] shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-semibold text-[#64748B] dark:text-[#8B9E95] leading-tight hidden 2xl:inline">
              Saralash
            </span>
            <div className="font-bold text-xs sm:text-sm text-[#172B26] dark:text-white leading-tight whitespace-nowrap">
              <span className="hidden 2xl:inline">{sortOptions.find((s) => s.value === selectedSort)?.label || "Yaqinlik bo'yicha"}</span>
              <span className="inline 2xl:hidden">{sortOptions.find((s) => s.value === selectedSort)?.shortLabel || "Yaqinlik"}</span>
            </div>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#64748B] dark:text-[#8B9E95] transition-transform duration-200 ml-0.5 shrink-0 ${
              isSortOpen ? 'rotate-180 text-[#087F5B]' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu - 100% Solid background, no glass effect */}
        {isSortOpen && (
          <div className="absolute top-[calc(100%+8px)] left-0 min-w-[200px] z-50 bg-white dark:bg-[#182620] rounded-2xl border-2 border-[#CBD5E1] dark:border-[#2E4237] shadow-[0_12px_36px_rgba(0,0,0,0.18)] p-1.5 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 text-[10px] font-extrabold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider border-b border-[#F1F5F9] dark:border-[#263D33] mb-0.5">
              Saralash mezoni
            </div>
            {sortOptions.map((opt) => {
              const isSelected = selectedSort === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onSortChange(opt.value);
                    setIsSortOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80]'
                      : 'text-[#172B26] dark:text-[#E8F2EC] hover:bg-[#F1F5F9] dark:hover:bg-[#203328]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#087F5B] dark:text-[#4ADE80] stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Qidiruv state sini tozalash tugmasi (Qidiruv bo'lganda ko'rinadi) */}
      {Boolean(searchQuery.trim()) && (
        <button
          onClick={handleClear}
          type="button"
          className="px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 active:scale-95 text-red-600 dark:text-red-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition shrink-0 cursor-pointer shadow-2xs whitespace-nowrap"
          title="Qidiruvni tozalash va barcha do‘konlarga qaytish"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden 2xl:inline">Tozalash</span>
        </button>
      )}

      {/* 6. Qidirish Button */}
      <button
        onClick={() => onSearch()}
        disabled={isSearching}
        type="button"
        className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#087F5B] hover:bg-[#065F46] active:scale-95 text-white font-bold text-xs sm:text-sm items-center justify-center gap-1.5 sm:gap-2 shadow-sm hover:shadow-md transition shrink-0 cursor-pointer disabled:opacity-70 whitespace-nowrap ${
          isDrawerOpen ? 'hidden xl:flex' : 'hidden sm:flex'
        }`}
        title="Qidirish"
      >
        <Search className={`w-4 h-4 stroke-[2.5] shrink-0 ${isSearching ? 'animate-spin' : ''}`} />
        <span>{isSearching ? '...' : 'Qidirish'}</span>
      </button>
    </div>
  );
};
