import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  MapPin,
  Phone,
  Clock,
  Sparkles,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Tag,
  DollarSign,
  Camera,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { UZBEKISTAN_REGIONS } from '@yaqintop/ui';
import { apiUrl } from '../config/api.js';
import { detectNearestUzbekistanLocation } from './UzbekistanRegionPickerModal';

export interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoreCreated: (newStore: any) => void;
  currentUser: any;
  userLocation?: { lat: number; lng: number };
  initialRegion?: string;
  initialDistrict?: string;
  onToast?: (msg: string) => void;
}

export const STORE_TYPES = [
  { value: 'RETAIL', label: "Do‘kon / Supermarket", icon: '🏪', category: 'TRADE' },
  { value: 'PHARMACY', label: 'Dorixona (Apteka)', icon: '💊', category: 'TRADE' },
  { value: 'BEAUTY_SALON', label: 'Sartaroshxona / Salon', icon: '✂️', category: 'SERVICE' },
  { value: 'RESTAURANT', label: 'Kafe / Oshxona / Fast-food', icon: '☕', category: 'SERVICE' },
  { value: 'GAME_CLUB', label: 'Game Club / PlayStation', icon: '🎮', category: 'SERVICE' },
  { value: 'AUTO_SERVICE', label: 'Avtoservis / Ustaxona', icon: '🚗', category: 'SERVICE' },
  { value: 'GAS_STATION', label: 'Zapravka / Zaryadlash', icon: '⛽', category: 'TRADE' },
  { value: 'EDUCATION', label: 'O‘quv markazi / Kurslar', icon: '📚', category: 'SERVICE' },
  { value: 'SERVICES', label: 'Boshqa xizmat ko‘rsatish', icon: '🛠️', category: 'SERVICE' },
  { value: 'WHOLESALE', label: 'Ulgurji savdo (Optom)', icon: '📦', category: 'TRADE' }
] as const;

export const PRESET_PHOTOS: Record<string, string> = {
  RETAIL: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
  PHARMACY: 'https://images.unsplash.com/photo-1586015555751-63c2c9d81d2c?w=800&auto=format&fit=crop&q=80',
  BEAUTY_SALON: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
  RESTAURANT: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
  GAME_CLUB: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
  AUTO_SERVICE: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&auto=format&fit=crop&q=80',
  GAS_STATION: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=800&auto=format&fit=crop&q=80',
  EDUCATION: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
  SERVICES: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80',
  WHOLESALE: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80'
};

export const AddStoreModal: React.FC<AddStoreModalProps> = ({
  isOpen,
  onClose,
  onStoreCreated,
  currentUser,
  userLocation,
  initialRegion = 'Toshkent shahri',
  initialDistrict = '',
  onToast
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('RETAIL');
  const [phone, setPhone] = useState(currentUser?.phone || '+998');
  const [region, setRegion] = useState(initialRegion || 'Toshkent shahri');
  const [district, setDistrict] = useState(initialDistrict || '');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>(() => {
    return userLocation || { lat: 41.311081, lng: 69.240562 };
  });
  const [isLocating, setIsLocating] = useState(false);
  const [is24Hours, setIs24Hours] = useState(false);
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [photoUrl, setPhotoUrl] = useState('');
  const [description, setDescription] = useState('');

  // Initial service or product
  const [includeOffer, setIncludeOffer] = useState(true);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerUnit, setOfferUnit] = useState('xizmat');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available districts for chosen region
  const selectedRegionData = UZBEKISTAN_REGIONS.find(
    (r) => r.name.toLowerCase() === region.toLowerCase()
  );
  const availableDistricts = selectedRegionData?.districts || [];

  useEffect(() => {
    if (isOpen) {
      if (!phone || phone === '+998') {
        if (currentUser?.phone) setPhone(currentUser.phone);
      }
      if (userLocation && (!coordinates.lat || coordinates.lat === 41.311081)) {
        setCoordinates(userLocation);
      }
      if (initialRegion && region !== initialRegion) {
        setRegion(initialRegion);
      }
      if (initialDistrict && district !== initialDistrict) {
        setDistrict(initialDistrict);
      }
    }
  }, [isOpen, currentUser, userLocation, initialRegion, initialDistrict]);

  if (!isOpen) return null;

  const handleGetCurrentLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCoordinates({ lat, lng });
          const detected = detectNearestUzbekistanLocation(lat, lng);
          if (detected) {
            if (detected.region) setRegion(detected.region);
            if (detected.district) setDistrict(detected.district);
          }
          setIsLocating(false);
          onToast?.('📍 Joriy GPS joylashuvingiz muvaffaqiyatli aniqlandi!');
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setIsLocating(false);
          onToast?.('GPS joylashuvni aniqlab bo‘lmadi. Qo‘lda kiritishingiz mumkin.');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      onToast?.('Qurilmangizda geolokatsiya qo‘llab-quvvatlanmaydi.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Tashkilot yoki do‘kon nomini kiriting');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('Manzilni kiriting');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const effectivePhoto = photoUrl.trim() || PRESET_PHOTOS[type] || PRESET_PHOTOS.RETAIL;

    const payload: any = {
      name: name.trim(),
      type,
      region,
      district,
      city: district || region,
      address: address.trim(),
      phone: phone.trim(),
      lat: coordinates.lat,
      lng: coordinates.lng,
      is24Hours,
      openTime: is24Hours ? '00:00' : openTime,
      closeTime: is24Hours ? '23:59' : closeTime,
      photoUrl: effectivePhoto,
      description: description.trim()
    };

    if (includeOffer && offerTitle.trim() && offerPrice.trim()) {
      const cleanPrice = offerPrice.replace(/\D/g, '');
      payload.initialOffer = {
        title: offerTitle.trim(),
        price: cleanPrice,
        packUnit: offerUnit,
        type: ['SERVICES', 'BEAUTY_SALON', 'GAME_CLUB', 'AUTO_SERVICE', 'EDUCATION'].includes(type)
          ? 'SERVICE'
          : 'PRODUCT',
        photoUrl: effectivePhoto
      };
    }

    try {
      const res = await fetch(apiUrl('/api/v1/user/stores'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.store) {
        onToast?.(`🎉 "${name}" tashkiloti muvaffaqiyatli qo‘shildi va xaritada joylashtirildi!`);
        onStoreCreated(data.store);
        onClose();
      } else {
        setErrorMsg(data.message || 'Tashkilotni qo‘shishda xatolik yuz berdi');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Server bilan ulanishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full md:max-w-xl bg-white dark:bg-[#14201A] rounded-t-3xl md:rounded-3xl shadow-2xl border-t md:border border-[#E2E8F0] dark:border-[#273B32] max-h-[92vh] md:max-h-[88vh] flex flex-col overflow-hidden text-[#172B26] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Mobile/Desktop Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#273B32] flex items-center justify-between shrink-0 bg-white/90 dark:bg-[#14201A]/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] flex items-center justify-center shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold leading-tight">
                Tashkilot / Do‘kon qo‘shish
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#8B9E95]">
                Xaritaga yangi manzil yoki xizmatingizni joylashtiring
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Category / Type Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
              Faoliyat turi <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 min-[420px]:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-1">
              {STORE_TYPES.map((t) => {
                const isSelected = type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`px-2.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition text-left cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-[#E8F5EE] dark:bg-[#1E362A] border-[#087F5B] dark:border-[#4ADE80] text-[#087F5B] dark:text-[#4ADE80] shadow-xs ring-1 ring-[#087F5B]'
                        : 'bg-slate-50 dark:bg-[#1A2822] border-slate-200 dark:border-[#273B32] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#20332B]'
                    }`}
                  >
                    <span className="text-base shrink-0">{t.icon}</span>
                    <span className="truncate">{t.label.split('(')[0].trim()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Tashkilot / Do‘kon nomi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Masalan: Baraka Oziq-ovqat"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-2xl bg-slate-50 dark:bg-[#1A2822] border border-slate-200 dark:border-[#273B32] text-xs font-semibold focus:outline-none focus:border-[#087F5B] dark:focus:border-[#4ADE80]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Telefon raqam <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-2xl bg-slate-50 dark:bg-[#1A2822] border border-slate-200 dark:border-[#273B32] text-xs font-semibold focus:outline-none focus:border-[#087F5B] dark:focus:border-[#4ADE80]"
                />
              </div>
            </div>
          </div>

          {/* 3. Location & GPS Auto-detect */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1A2822] border border-slate-200/80 dark:border-[#273B32] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold flex items-center gap-1.5 text-[#087F5B] dark:text-[#4ADE80]">
                <MapPin className="w-4 h-4" />
                Joylashuv va Hudud
              </span>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#14201A] border border-[#CBD5E1] dark:border-[#273B32] text-[#087F5B] dark:text-[#4ADE80] text-[11px] font-bold flex items-center gap-1 shadow-2xs hover:bg-[#E8F5EE] dark:hover:bg-[#1E362A] transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Aniqlanmoqda...' : '📍 Joriy joylashuvni olish'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Viloyat
                </label>
                <select
                  value={region}
                  onChange={(e) => {
                    setRegion(e.target.value);
                    setDistrict('');
                  }}
                  className="w-full h-10 px-2.5 rounded-xl bg-white dark:bg-[#14201A] border border-slate-200 dark:border-[#273B32] text-xs font-semibold focus:outline-none"
                >
                  {UZBEKISTAN_REGIONS.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Tuman / Shahar
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-xl bg-white dark:bg-[#14201A] border border-slate-200 dark:border-[#273B32] text-xs font-semibold focus:outline-none"
                >
                  <option value="">Barcha tumanlar / Shahar markazi</option>
                  {availableDistricts.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Aniq manzil yoki mo‘ljal <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Masalan: Amir Temur ko‘chasi, 24-uy (bozor yonida)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#14201A] border border-slate-200 dark:border-[#273B32] text-xs font-semibold focus:outline-none focus:border-[#087F5B]"
              />
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Koordinatalar:</span>
              <span className="font-mono bg-white dark:bg-[#14201A] px-2 py-0.5 rounded border border-slate-200 dark:border-[#273B32]">
                {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </span>
            </div>
          </div>

          {/* 4. Work Hours */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#087F5B]" />
                Ish vaqti
              </label>
              <button
                type="button"
                onClick={() => setIs24Hours(!is24Hours)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border transition cursor-pointer ${
                  is24Hours
                    ? 'bg-[#087F5B] text-white border-[#087F5B]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                {is24Hours ? '✓ 24/7 (Kechayu-kunduz)' : '24/7 emas'}
              </button>
            </div>

            {!is24Hours && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[11px] text-slate-500 mb-1 font-semibold">Ochilish:</span>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#1A2822] border border-slate-200 dark:border-[#273B32] text-xs font-bold"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500 mb-1 font-semibold">Yopilish:</span>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-[#1A2822] border border-slate-200 dark:border-[#273B32] text-xs font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5. Initial Product / Service Offer */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-[#15271F] border border-emerald-200/60 dark:border-[#274838] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#087F5B] dark:text-[#4ADE80] flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                Asosiy xizmat yoki tovar (ixtiyoriy)
              </span>
              <button
                type="button"
                onClick={() => setIncludeOffer(!includeOffer)}
                className="text-[11px] font-bold text-[#087F5B] dark:text-[#4ADE80] underline cursor-pointer"
              >
                {includeOffer ? 'Bekor qilish' : 'Qo‘shish'}
              </button>
            </div>

            {includeOffer && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      placeholder="Xizmat/tovar nomi (masalan: Soch olish)"
                      value={offerTitle}
                      onChange={(e) => setOfferTitle(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#14201A] border border-emerald-200 dark:border-[#274838] text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Narxi (so‘mda, masalan: 35000)"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      className="w-full h-10 pl-3 pr-16 rounded-xl bg-white dark:bg-[#14201A] border border-emerald-200 dark:border-[#274838] text-xs font-bold focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      so‘m
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. Description / Photo Note */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Qo‘shimcha tavsif yoki izoh (ixtiyoriy)
            </label>
            <textarea
              rows={2}
              placeholder="Tashkilot haqida qo‘shimcha ma’lumot, qulayliklar yoki xizmatlar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-[#1A2822] border border-slate-200 dark:border-[#273B32] text-xs font-medium focus:outline-none focus:border-[#087F5B]"
            />
          </div>
        </form>

        {/* Sticky Mobile/Desktop Footer Button */}
        <div className="p-4 border-t border-[#E2E8F0] dark:border-[#273B32] bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !name.trim() || !address.trim()}
            className="w-full h-12 rounded-2xl bg-[#087F5B] hover:bg-[#065F46] text-white font-extrabold text-sm shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Qo‘shilmoqda...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Saqlash va xaritada ko‘rsatish</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
