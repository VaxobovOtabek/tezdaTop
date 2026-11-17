import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

export interface MapLocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCoords: { lat: number; lng: number };
  storeTypeIcon?: string;
  storeName?: string;
  onConfirm: (coords: { lat: number; lng: number }, detectedRegion?: string, detectedDistrict?: string) => void;
}

export const MapLocationPickerModal: React.FC<MapLocationPickerModalProps> = ({
  isOpen,
  onClose,
  initialCoords,
  storeTypeIcon = '🏪',
  storeName,
  onConfirm
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedCoords, setSelectedCoords] = useState(initialCoords);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedCoords(initialCoords);
    }
  }, [isOpen, initialCoords]);

  const detectedLocation = useMemo(() => {
    return detectNearestUzbekistanLocation(selectedCoords.lat, selectedCoords.lng);
  }, [selectedCoords.lat, selectedCoords.lng]);

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    const map = L.map(mapContainerRef.current, {
      center: [selectedCoords.lat, selectedCoords.lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: 'store-location-pin',
      html: `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;cursor:grab;">
          <div style="position:absolute;width:30px;height:30px;background:#087F5B;opacity:0.25;border-radius:50%;animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="background:#087F5B;color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(8,127,91,0.5);border:3px solid #ffffff;font-size:20px;z-index:2;">
            ${storeTypeIcon}
          </div>
          <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid #087F5B;z-index:1;"></div>
        </div>
      `,
      iconSize: [44, 52],
      iconAnchor: [22, 52]
    });

    const marker = L.marker([selectedCoords.lat, selectedCoords.lng], {
      draggable: true,
      icon: pinIcon
    }).addTo(map);

    marker.on('drag', (e) => {
      const pos = e.target.getLatLng();
      setSelectedCoords({ lat: pos.lat, lng: pos.lng });
    });

    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      setSelectedCoords({ lat: pos.lat, lng: pos.lng });
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      setSelectedCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    markerRef.current = marker;
    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      try { map.invalidateSize(); } catch {}
    }, 250);

    const ro = new ResizeObserver(() => {
      try { map.invalidateSize(); } catch {}
    });
    ro.observe(mapContainerRef.current);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [isOpen]);

  const handleFlyToUserLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setSelectedCoords({ lat, lng });
          if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
          if (mapInstanceRef.current) mapInstanceRef.current.flyTo([lat, lng], 17);
        },
        () => {
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleConfirm = () => {
    onConfirm(selectedCoords, detectedLocation?.region, detectedLocation?.district);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end md:justify-center items-center p-0 md:p-4 animate-in fade-in duration-200">
      <div className="w-full h-[94vh] md:h-[88vh] md:max-w-3xl bg-white dark:bg-[#14201A] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-slate-200/80 dark:border-[#273B32]">
        {/* Floating Top Header */}
        <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between gap-2 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-lg border border-slate-200/80 dark:border-[#273B32]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-black text-slate-800 dark:text-white truncate">
                {storeName ? `${storeName} joylashuvi` : 'Do‘kon joylashuvini tanlang'}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Xaritani bosing yoki belgini kerakli manzilga suring
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-300 transition shrink-0 cursor-pointer"
            title="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Map Canvas */}
        <div className="relative flex-1 w-full h-full">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Zoom Controls */}
          <div className="absolute right-3.5 top-20 z-[400] flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-10 h-10 rounded-xl bg-white/95 dark:bg-[#1E2D25]/95 backdrop-blur-md text-slate-700 dark:text-white flex items-center justify-center font-bold text-lg hover:bg-slate-100 dark:hover:bg-[#273B32] transition active:scale-95 shadow-md border border-slate-200 dark:border-[#273B32] cursor-pointer"
              title="Yaqinlashtirish"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-10 h-10 rounded-xl bg-white/95 dark:bg-[#1E2D25]/95 backdrop-blur-md text-slate-700 dark:text-white flex items-center justify-center font-bold text-lg hover:bg-slate-100 dark:hover:bg-[#273B32] transition active:scale-95 shadow-md border border-slate-200 dark:border-[#273B32] cursor-pointer"
              title="Uzoqlashtirish"
            >
              −
            </button>
          </div>

          {/* Floating GPS Button */}
          <button
            type="button"
            onClick={handleFlyToUserLocation}
            disabled={isLocating}
            className="absolute right-3.5 top-44 z-[400] w-10 h-10 rounded-xl bg-white/95 dark:bg-[#1E2D25]/95 backdrop-blur-md text-[#087F5B] dark:text-[#4ADE80] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#273B32] transition active:scale-95 shadow-md border border-slate-200 dark:border-[#273B32] cursor-pointer disabled:opacity-50"
            title="Hozirgi GPS joylashuvimga o‘tish"
          >
            <Navigation className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Floating Bottom Confirmation Card */}
        <div className="absolute bottom-3 left-3 right-3 z-[400] bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-[#273B32] flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-600 flex items-center justify-center shrink-0 text-base shadow-2xs">
                📍
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {detectedLocation?.region || 'O‘zbekiston'}{detectedLocation?.district ? `, ${detectedLocation.district}` : ''}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] shrink-0">
              Belgilangan joy
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95 cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-[2] h-11 rounded-xl bg-[#087F5B] hover:bg-[#065F46] text-white font-black text-xs shadow-md transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Ushbu joyni tanlash</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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

  const getRegionCenter = (regName: string) => {
    const found = UZBEKISTAN_REGIONS.find((r) => r.name.toLowerCase() === regName.toLowerCase());
    if (found?.centerLat && found?.centerLng) {
      return { lat: found.centerLat, lng: found.centerLng };
    }
    return { lat: 40.4897, lng: 68.7842 }; // Guliston / Sirdaryo markazi
  };

  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>(() => {
    if (userLocation && userLocation.lat && userLocation.lng) {
      return userLocation;
    }
    return getRegionCenter(initialRegion || 'Toshkent shahri');
  });

  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
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

  const selectedTypeObj = STORE_TYPES.find((t) => t.value === type) || STORE_TYPES[0];

  const handleConfirmMapLocation = (
    coords: { lat: number; lng: number },
    detectedRegion?: string,
    detectedDistrict?: string
  ) => {
    setCoordinates(coords);
    if (detectedRegion) setRegion(detectedRegion);
    if (detectedDistrict) setDistrict(detectedDistrict);
    onToast?.(`📍 Xaritadan joylashuv belgilandi: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
  };

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
      const effectiveReg = initialRegion || region || 'Toshkent shahri';
      if (initialRegion && region !== initialRegion) {
        setRegion(initialRegion);
      }
      if (initialDistrict && district !== initialDistrict) {
        setDistrict(initialDistrict);
      }
      // Boshlang'ich nuqtasi: joriy joylashgan joyi bo'lsin, bo'lmasa viloyat markazidan bo'lsin
      if (userLocation && userLocation.lat && userLocation.lng) {
        setCoordinates(userLocation);
      } else {
        const center = getRegionCenter(effectiveReg);
        setCoordinates(center);
      }
    }
  }, [isOpen, currentUser, userLocation, initialRegion, initialDistrict]);

  if (!isOpen) return null;

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

          {/* 3. Location & Map Picker */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1A2822] border border-slate-200/80 dark:border-[#273B32] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold flex items-center gap-1.5 text-[#087F5B] dark:text-[#4ADE80]">
                <MapPin className="w-4 h-4" />
                Joylashuv va Hudud
              </span>
              <button
                type="button"
                onClick={() => setIsMapPickerOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#087F5B] hover:bg-[#065F46] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                title="Xaritadan do‘kon lokatsiyasini tanlash va belgilash"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Kartadan lokatsiya tanlash</span>
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
                    const nextReg = e.target.value;
                    setRegion(nextReg);
                    setDistrict('');
                    const center = getRegionCenter(nextReg);
                    setCoordinates(center);
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
                  onChange={(e) => {
                    const nextDist = e.target.value;
                    setDistrict(nextDist);
                    const distItem = availableDistricts.find((d) => d.name === nextDist);
                    if (distItem?.lat && distItem?.lng) {
                      setCoordinates({ lat: distItem.lat, lng: distItem.lng });
                    }
                  }}
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

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-[#273B32]/60">
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Koordinatalar:</span>
                <span className="font-mono bg-white dark:bg-[#14201A] px-2 py-0.5 rounded border border-slate-200 dark:border-[#273B32]">
                  {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMapPickerOpen(true)}
                className="text-[11px] font-bold text-[#087F5B] dark:text-[#4ADE80] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Xaritada ochish</span>
                <ArrowRight className="w-3 h-3" />
              </button>
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

      {/* Interactive Map Location Picker Modal */}
      <MapLocationPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialCoords={coordinates}
        storeTypeIcon={selectedTypeObj.icon}
        storeName={name}
        onConfirm={handleConfirmMapLocation}
      />
    </div>
  );
};
