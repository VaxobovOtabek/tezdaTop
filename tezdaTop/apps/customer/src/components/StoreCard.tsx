import React from 'react';
import { MapPin, Clock, Phone, Star, Store as StoreIcon, Navigation } from 'lucide-react';
import { getStoreBannerImage } from '../utils/store-images';

export interface StoreCardItem {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  photos?: string[];
  photoUrl?: string;
  rating?: number;
  reviewCount?: number;
  hours?: any;
  workingHours?: any;
  distanceM?: number;
  type?: string;
  status?: string;
  [key: string]: any;
}

interface StoreCardProps {
  store: StoreCardItem;
  distanceM?: number;
  isSelected?: boolean;
  onSelect: () => void;
  onOpenStore: (storeId: string) => void;
  onGetRoute: (store: any) => void;
}

export const StoreCard: React.FC<StoreCardProps> = ({
  store,
  distanceM,
  isSelected = false,
  onSelect,
  onOpenStore,
  onGetRoute
}) => {
  const storeId = store.id;
  const storeName = store.name || 'Noma‘lum do‘kon';
  const address = store.address || 'O‘zbekiston';
  const phone = store.phone || '';
  const rating = Number(store.rating || 5.0).toFixed(1);
  const reviewCount = store.reviewCount || (store.reviews ? store.reviews.length : 12);
  const distance = typeof distanceM === 'number'
    ? distanceM
    : (typeof store.distanceM === 'number' ? store.distanceM : 445);
  const formattedDistance = distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`;

  const bannerImg = getStoreBannerImage(store);

  // Today's hours
  const hoursText = (() => {
    if (store.hours && Array.isArray(store.hours) && store.hours.length > 0) {
      const today = store.hours[0];
      return `Bugun: ${today.open || '00:00'} — ${today.close || '23:59'}`;
    }
    return 'Bugun: 00:00 — 23:59';
  })();

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl p-3 flex flex-col gap-2.5 transition-all cursor-pointer select-none ${
        isSelected
          ? 'bg-[#F9FAF9] dark:bg-[#1A2822] border-2 border-[#087F5B] ring-2 ring-[#087F5B]/20 shadow-md'
          : 'bg-white dark:bg-[#14201A] border border-[#E2E8F0] dark:border-[#263D33] hover:border-[#087F5B]/50 hover:shadow-sm'
      }`}
    >
      {/* Store Image with Distance Badge */}
      <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={bannerImg}
          alt={storeName}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80';
          }}
        />
        {/* Distance Badge */}
        <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
          <MapPin className="w-3 h-3 text-[#4ADE80]" />
          <span>{formattedDistance}</span>
        </div>
      </div>

      {/* Store Header: Name & Rating */}
      <div className="flex items-start justify-between gap-2 pt-0.5">
        <h3 className="font-bold text-base sm:text-[17px] text-[#172B26] dark:text-white leading-tight line-clamp-1">
          {storeName}
        </h3>
        <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-[#172B26] dark:text-white">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{rating}</span>
          <span className="text-[#64748B] dark:text-[#8B9E95] font-normal text-[11px]">({reviewCount})</span>
        </div>
      </div>

      {/* Store Meta: Address, Hours, Phone */}
      <div className="flex flex-col gap-1 text-xs text-[#64748B] dark:text-[#8B9E95]">
        <div className="flex items-start gap-1.5 line-clamp-2">
          <MapPin className="w-3.5 h-3.5 text-[#087F5B] dark:text-[#4ADE80] shrink-0 mt-0.5" />
          <span className="leading-tight">{address}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#64748B] dark:text-[#8B9E95] shrink-0" />
          <span>{hoursText}</span>
        </div>
        {phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#64748B] dark:text-[#8B9E95] shrink-0" />
            <span>{phone}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1 mt-auto">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenStore(storeId);
          }}
          className="bg-[#087F5B] hover:bg-[#065F46] active:scale-95 text-white py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
        >
          <StoreIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Sahifasiga o‘tish</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onGetRoute(store);
          }}
          className="border border-[#E2E8F0] dark:border-[#273B32] hover:bg-[#F8FAFC] dark:hover:bg-[#1E3328] active:scale-95 text-[#172B26] dark:text-[#E8F2EC] py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5 text-[#087F5B] dark:text-[#4ADE80] shrink-0" />
          <span className="truncate">Marshrut</span>
        </button>
      </div>
    </div>
  );
};
