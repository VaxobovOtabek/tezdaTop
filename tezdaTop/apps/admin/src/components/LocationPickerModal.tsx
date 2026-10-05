import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  Navigation,
  Check,
  X,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair
} from 'lucide-react';
import { Button, Modal } from '@yaqintop/ui';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat: number;
  initialLng: number;
  isDarkMode: boolean;
  title?: string;
  onSelectLocation: (coords: { lat: number; lng: number }) => void;
}

const CITY_PRESETS = [
  { name: 'Toshkent markaz', lat: 41.311081, lng: 69.240562 },
  { name: 'Chilonzor', lat: 41.2825, lng: 69.2085 },
  { name: 'Yunusobod', lat: 41.3645, lng: 69.2885 },
  { name: 'Mirobod', lat: 41.2985, lng: 69.2782 },
  { name: 'Shayxontohur', lat: 41.3255, lng: 69.2415 },
  { name: 'Mirzo Ulug‘bek', lat: 41.3325, lng: 69.3385 },
  { name: 'Yakkasaroy', lat: 41.2815, lng: 69.2555 },
  { name: 'Samarqand', lat: 39.6542, lng: 66.9597 },
  { name: 'Farg‘ona', lat: 40.3842, lng: 71.7843 },
  { name: 'Namangan', lat: 40.9983, lng: 71.6726 },
  { name: 'Andijon', lat: 40.7821, lng: 72.3442 },
  { name: 'Buxoro', lat: 39.7747, lng: 64.4286 }
];

export function LocationPickerModal({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  isDarkMode,
  title = "Kartadan lokatsiyani tanlash",
  onSelectLocation
}: LocationPickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [currentLat, setCurrentLat] = useState<number>(initialLat || 41.311081);
  const [currentLng, setCurrentLng] = useState<number>(initialLng || 69.240562);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Sync initial coordinates when modal opens
  useEffect(() => {
    if (isOpen) {
      const validLat = Number(initialLat) || 41.311081;
      const validLng = Number(initialLng) || 69.240562;
      setCurrentLat(validLat);
      setCurrentLng(validLng);
    }
  }, [isOpen, initialLat, initialLng]);

  // Create custom Leaflet pin icon
  const createPinIcon = () => {
    return L.divIcon({
      className: 'custom-picker-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="width: 38px; height: 38px; border-radius: 50% 50% 50% 0; background: #116B50; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.35); border: 2.5px solid white;">
            <div style="transform: rotate(45deg); color: white; font-weight: 800; font-size: 15px;">📍</div>
          </div>
          <div style="width: 12px; height: 4px; background: rgba(0,0,0,0.35); border-radius: 50%; margin-top: 2px;"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
  };

  // Initialize and update Leaflet map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Small delay to ensure modal DOM is mounted and visible
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const lat = Number(currentLat) || 41.311081;
      const lng = Number(currentLng) || 69.240562;

      // Clean up previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false
      });
      mapInstanceRef.current = map;

      // Tile layer
      const tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '&copy; YaqinTop Maps & CartoDB'
      }).addTo(map);

      // Add draggable marker
      const marker = L.marker([lat, lng], {
        icon: createPinIcon(),
        draggable: true
      }).addTo(map);
      markerRef.current = marker;

      // Handle marker drag
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setCurrentLat(Number(pos.lat.toFixed(6)));
        setCurrentLng(Number(pos.lng.toFixed(6)));
      });

      // Handle map click to reposition marker
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        setCurrentLat(Number(clickLat.toFixed(6)));
        setCurrentLng(Number(clickLng.toFixed(6)));
      });

      map.invalidateSize();
    }, 120);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, isDarkMode]);

  // Pan to preset location
  const handleSelectPreset = (presetLat: number, presetLng: number) => {
    setCurrentLat(Number(presetLat.toFixed(6)));
    setCurrentLng(Number(presetLng.toFixed(6)));

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([presetLat, presetLng]);
      mapInstanceRef.current.setView([presetLat, presetLng], 15, { animate: true });
    }
  };

  // Get current device location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Brauzeringiz geolokatsiyani qo‘llab-quvvatlamaydi');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));
        handleSelectPreset(userLat, userLng);
      },
      () => {
        setIsLocating(false);
        alert('Lokatsiyani aniqlashga ruxsat berilmadi yoki xatolik yuz berdi');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleConfirm = () => {
    onSelectLocation({
      lat: currentLat,
      lng: currentLng
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#DCE5DF] dark:border-[#22332C] flex items-center justify-between bg-white dark:bg-[#14201A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#172C28] dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                Xaritadagi kerakli nuqtani bosing yoki pinni surib joylashtiring
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#566A63] dark:text-[#8B9E95] hover:bg-[#F3F6F3] dark:hover:bg-[#1E3328] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="px-5 py-2.5 bg-[#F9FAF9] dark:bg-[#1A2822] border-b border-[#DCE5DF] dark:border-[#22332C] flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
            Tezkor hudud:
          </span>

          {CITY_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleSelectPreset(p.lat, p.lng)}
              className="px-2.5 py-1 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#273B32] rounded-lg text-[11px] font-semibold text-[#172C28] dark:text-[#E8F2EC] hover:border-[#116B50] dark:hover:border-[#4ADE80] hover:text-[#116B50] dark:hover:text-[#4ADE80] transition shrink-0 whitespace-nowrap shadow-2xs"
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Map Body Container */}
        <div className="relative flex-1 min-h-[380px] sm:min-h-[440px] w-full bg-[#E2EEE4] dark:bg-[#0E1713]">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

          {/* Floating Controls Top-Right */}
          <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
            <button
              onClick={handleGetCurrentLocation}
              title="Mening joylashuvim"
              className="px-3 py-2 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#273B32] text-[#116B50] dark:text-[#4ADE80] rounded-xl shadow-lg hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] transition flex items-center gap-1.5 text-xs font-bold"
            >
              <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Mening joyim</span>
            </button>

            <div className="flex flex-col bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#273B32] rounded-xl shadow-lg overflow-hidden">
              <button
                onClick={() => mapInstanceRef.current?.zoomIn()}
                className="p-2 text-[#172C28] dark:text-white hover:bg-[#F3F6F3] dark:hover:bg-[#1E3328] transition border-b border-[#DCE5DF] dark:border-[#273B32]"
                title="Kattalashtirish"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => mapInstanceRef.current?.zoomOut()}
                className="p-2 text-[#172C28] dark:text-white hover:bg-[#F3F6F3] dark:hover:bg-[#1E3328] transition"
                title="Kichiklashtirish"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Floating Info Overlay Bottom-Left */}
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[400] bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md p-3 rounded-2xl border border-[#DCE5DF] dark:border-[#273B32] shadow-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#116B50] text-white flex items-center justify-center font-bold text-xs shrink-0">
              📍
            </div>
            <div className="text-xs">
              <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] font-semibold block">
                Tanlangan koordinatalar:
              </span>
              <div className="font-mono font-bold text-[#116B50] dark:text-[#4ADE80] text-xs sm:text-sm">
                Lat: {currentLat} · Lng: {currentLng}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-white dark:bg-[#14201A] border-t border-[#DCE5DF] dark:border-[#22332C] flex items-center justify-between gap-3">
          <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] hidden sm:block">
            Xarita orqali belgilangan nuqta do‘kon manziliga aniq biriktiriladi.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button variant="secondary" onClick={onClose} className="px-4">
              Bekor qilish
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              className="px-5 font-bold flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Koordinatalarni tasdiqlash</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
