import React from 'react';
import { Store as StoreIcon, Compass, RotateCcw, Layers } from 'lucide-react';

interface SearchStatusBarProps {
  totalResults: number;
  radiusM: number;
  searchQuery: string;
  locationName: string;
  isDrawerOpen?: boolean;
  onClearSearch?: () => void;
  onOpenDrawer?: () => void;
}

export const SearchStatusBar: React.FC<SearchStatusBarProps> = ({
  totalResults,
  radiusM,
  searchQuery,
  locationName,
  isDrawerOpen = true,
  onClearSearch,
  onOpenDrawer
}) => {
  const formattedRadius = radiusM >= 1000 ? `${radiusM / 1000} km` : `${radiusM} m`;
  const cleanLocation = locationName ? locationName.split(',')[0] : 'Guliston';
  const hasActiveSearch = Boolean(searchQuery.trim());
  const queryDisplay = hasActiveSearch ? `"${searchQuery}"` : 'Barcha tovarlar';

  return (
    <div className="hidden sm:flex items-center pointer-events-none absolute bottom-4 left-4 right-4 z-20">
      {/* Status Pill - Solid crisp background */}
      <div
        className={`pointer-events-auto bg-white dark:bg-[#14201A] rounded-2xl shadow-xl border border-[#CBD5E1] dark:border-[#273B32] px-4 py-2.5 flex items-center gap-3 text-xs font-semibold text-[#172B26] dark:text-[#E8F2EC] transition-all duration-300 ${
          isDrawerOpen ? 'ml-0 md:ml-[380px] lg:ml-[400px]' : 'ml-0'
        }`}
      >
        <div className="flex items-center gap-1.5 text-[#087F5B] dark:text-[#4ADE80]">
          <StoreIcon className="w-4 h-4" />
          <span className="font-bold">{totalResults} ta natija</span>
        </div>

        <div className="h-3.5 w-px bg-[#E2E8F0] dark:bg-[#273B32]" />

        <div className="flex items-center gap-1.5 text-[#64748B] dark:text-[#8B9E95]">
          <Compass className="w-4 h-4 text-[#087F5B] dark:text-[#4ADE80]" />
          <span>Radius: <strong className="text-[#172B26] dark:text-white">{formattedRadius}</strong></span>
        </div>

        <div className="h-3.5 w-px bg-[#E2E8F0] dark:bg-[#273B32]" />

        <div className="bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] px-2.5 py-0.5 rounded-lg text-xs font-bold truncate max-w-[240px]">
          {queryDisplay} bo‘yicha {cleanLocation}da
        </div>

        {hasActiveSearch && onClearSearch && (
          <button
            onClick={onClearSearch}
            className="flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 px-2 py-0.5 rounded-md border border-red-200/60 dark:border-red-900/40 transition cursor-pointer"
            title="Qidiruvni tozalash"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Tozalash</span>
          </button>
        )}

        {!isDrawerOpen && onOpenDrawer && (
          <button
            onClick={onOpenDrawer}
            className="flex items-center gap-1.5 text-xs font-extrabold text-[#087F5B] dark:text-[#4ADE80] hover:underline cursor-pointer ml-1 pl-2 border-l border-[#CBD5E1] dark:border-[#273B32]"
            title="Do‘kon va xizmatlar ro‘yxatini ochish"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ro‘yxatni ochish</span>
          </button>
        )}
      </div>
    </div>
  );
};
