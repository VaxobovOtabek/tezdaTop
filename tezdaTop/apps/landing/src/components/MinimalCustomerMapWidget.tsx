import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  Navigation,
  Clock,
  Star,
  ExternalLink,
  Layers,
  Sparkles,
  ShoppingBag,
  Store,
  ChevronRight,
  Compass,
  CheckCircle2,
  Info,
  Plus,
  Minus,
  Crosshair
} from 'lucide-react';

export interface LandingStoreItem {
  id: string;
  name: string;
  type: 'RETAIL' | 'WHOLESALE' | 'MIXED';
  address: string;
  rating: number;
  isOpenNow: boolean;
  distanceM: number;
  offersCount: number;
  lat: number;
  lng: number;
  sampleProduct?: {
    name: string;
    price: number;
    unit: string;
  };
}

const TASHKENT_CENTER = { lat: 41.311081, lng: 69.240562 };

const PRESET_STORES: LandingStoreItem[] = [
  {
    id: 's-1',
    name: 'Korzinka — Mirobod',
    type: 'RETAIL',
    address: 'Mirobod tumani, Nukus ko‘chasi, 24',
    rating: 4.8,
    isOpenNow: true,
    distanceM: 180,
    offersCount: 420,
    lat: 41.3052,
    lng: 69.2550,
    sampleProduct: { name: 'Snikers Super 80g', price: 12000, unit: 'dona' }
  },
  {
    id: 's-2',
    name: 'Makro Express — Chilonzor',
    type: 'RETAIL',
    address: 'Chilonzor tumani, Bunyodkor shoh ko‘chasi, 15',
    rating: 4.6,
    isOpenNow: true,
    distanceM: 420,
    offersCount: 290,
    lat: 41.2980,
    lng: 69.2280,
    sampleProduct: { name: 'Coca-Cola 1.5L', price: 14000, unit: 'dona' }
  },
  {
    id: 's-3',
    name: 'Oloy Bozori Savdo Markazi',
    type: 'WHOLESALE',
    address: 'Yunusobod tumani, Amir Temur shoh ko‘chasi',
    rating: 4.9,
    isOpenNow: true,
    distanceM: 750,
    offersCount: 850,
    lat: 41.3285,
    lng: 69.2820,
    sampleProduct: { name: 'Qolipli Oq Non', price: 4000, unit: 'dona' }
  },
  {
    id: 's-4',
    name: 'Havos Supermarket — Yunusobod',
    type: 'RETAIL',
    address: 'Yunusobod 4-mavze, 12-uy',
    rating: 4.5,
    isOpenNow: true,
    distanceM: 610,
    offersCount: 310,
    lat: 41.3320,
    lng: 69.2480,
    sampleProduct: { name: 'Sut 3.2% 1L', price: 11500, unit: 'litr' }
  },
  {
    id: 's-5',
    name: 'Mediapark & Texnomart Markazi',
    type: 'MIXED',
    address: 'Shayxontohur tumani, Navoiy ko‘chasi, 8',
    rating: 4.7,
    isOpenNow: false,
    distanceM: 950,
    offersCount: 160,
    lat: 41.3190,
    lng: 69.2310,
    sampleProduct: { name: 'Smartfon aksessuarlari', price: 45000, unit: 'dona' }
  }
];

export function MinimalCustomerMapWidget({ isDarkMode }: { isDarkMode: boolean }) {
  const [selectedRadius, setSelectedRadius] = useState<number>(1000);
  const [selectedStore, setSelectedStore] = useState<LandingStoreItem | null>(PRESET_STORES[0]);
  const [activeSearchFilter, setActiveSearchFilter] = useState<string>('Hammasi');

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: [TASHKENT_CENTER.lat, TASHKENT_CENTER.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      tileLayerRef.current = tileLayer;

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      // User location marker with pulsating red dot
      const redDotHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background: #ef4444; opacity: 0.35; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 18px; height: 18px; border-radius: 9999px; background: #dc2626; border: 3.5px solid #ffffff; box-shadow: 0 0 10px rgba(220,38,38,0.7), 0 2px 4px rgba(0,0,0,0.3); z-index: 2;"></div>
        </div>
      `;

      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: redDotHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const userMarker = L.marker([TASHKENT_CENTER.lat, TASHKENT_CENTER.lng], {
        icon: userIcon,
        zIndexOffset: 1000
      }).addTo(map);
      userMarker.bindTooltip('📍 Sizning joylashuvingiz', { permanent: false, direction: 'top' });
      userMarkerRef.current = userMarker;

      mapInstanceRef.current = map;

      // Invalidate size to ensure proper layout
      setTimeout(() => map.invalidateSize(), 150);
      setTimeout(() => map.invalidateSize(), 400);
    } catch (err) {
      console.error('Leaflet initialization error:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      userMarkerRef.current = null;
      radiusCircleRef.current = null;
    };
  }, []);

  // Update layout on Theme Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setTimeout(() => map.invalidateSize(), 50);
  }, [isDarkMode]);

  // Update Search Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const strokeColor = isDarkMode ? '#4ADE80' : '#116B50';
    const fillColor = isDarkMode ? '#22C55E' : '#10B981';

    if (radiusCircleRef.current) {
      radiusCircleRef.current.setRadius(selectedRadius);
      radiusCircleRef.current.setStyle({
        color: strokeColor,
        fillColor: fillColor,
        fillOpacity: isDarkMode ? 0.18 : 0.12
      });
    } else {
      const circle = L.circle([TASHKENT_CENTER.lat, TASHKENT_CENTER.lng], {
        radius: selectedRadius,
        color: strokeColor,
        weight: 2,
        dashArray: '6, 6',
        fillColor: fillColor,
        fillOpacity: isDarkMode ? 0.18 : 0.12
      }).addTo(map);
      radiusCircleRef.current = circle;
    }

    // Auto fit bounds smoothly
    if (radiusCircleRef.current) {
      map.fitBounds(radiusCircleRef.current.getBounds(), {
        padding: [40, 40],
        maxZoom: 15,
        animate: true
      });
    }
  }, [selectedRadius, isDarkMode]);

  // Update Store Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    PRESET_STORES.forEach((store) => {
      const isSelected = selectedStore?.id === store.id;
      const showPrice = activeSearchFilter !== 'Hammasi' && store.sampleProduct;

      const storeIconEmoji = store.type === 'WHOLESALE' ? '📦' : store.type === 'MIXED' ? '🏢' : '🏪';

      const markerHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          ${
            showPrice
              ? `<div style="position: absolute; top: -28px; background: ${
                  isDarkMode ? '#4ADE80' : '#116B50'
                }; color: ${
                  isDarkMode ? '#0E1713' : '#ffffff'
                }; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); white-space: nowrap; animation: bounce 1s infinite;">
                  ${store.sampleProduct?.price.toLocaleString('uz-UZ')} so‘m
                </div>`
              : ''
          }
          <div style="display: flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 14px; background: ${
            isSelected
              ? (isDarkMode ? '#4ADE80' : '#116B50')
              : (isDarkMode ? '#14201A' : '#ffffff')
          }; color: ${
            isSelected
              ? (isDarkMode ? '#0E1713' : '#ffffff')
              : (isDarkMode ? '#E8F2EC' : '#172C28')
          }; border: 1.5px solid ${
            isSelected
              ? '#ffffff'
              : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)')
          }; box-shadow: 0 4px 12px rgba(0,0,0,0.25); transform: ${
            isSelected ? 'scale(1.1)' : 'scale(1)'
          }; transition: all 0.2s;">
            <span style="font-size: 14px;">${storeIconEmoji}</span>
            <span style="font-size: 11px; font-weight: 700; white-space: nowrap;">${store.name.split('—')[0].trim()}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-store-pin',
        html: markerHtml,
        iconSize: [120, 36],
        iconAnchor: [60, 18]
      });

      const marker = L.marker([store.lat, store.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 500 : 100
      }).addTo(markersLayer);

      marker.on('click', () => {
        setSelectedStore(store);
      });
    });
  }, [selectedStore, activeSearchFilter, isDarkMode]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleCenter = () => {
    mapInstanceRef.current?.setView([TASHKENT_CENTER.lat, TASHKENT_CENTER.lng], 14, { animate: true });
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-white/10 rounded-2xl shadow-sm">
        {/* Radius Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95] mr-1 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
            <span>Qidiruv radiusi:</span>
          </span>
          {[500, 1000, 2000].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRadius(r)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedRadius === r
                  ? 'bg-[#116B50] dark:bg-[#4ADE80] text-white dark:text-[#0E1713] shadow-sm'
                  : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
              }`}
            >
              {r >= 1000 ? `${r / 1000} km` : `${r} m`}
            </button>
          ))}
        </div>

        {/* Demo Search Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold mr-1 shrink-0">
            Qidiruv:
          </span>
          {['Hammasi', 'Snikers', 'Coca-Cola', 'Non', 'Sut'].map((pill) => (
            <button
              key={pill}
              onClick={() => setActiveSearchFilter(pill)}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-bold shrink-0 transition ${
                activeSearchFilter === pill
                  ? 'bg-[#116B50]/15 dark:bg-[#4ADE80]/15 text-[#116B50] dark:text-[#4ADE80] border border-[#116B50]/30 dark:border-[#4ADE80]/30'
                  : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border border-transparent hover:border-[#DCE5DF] dark:hover:border-white/10'
              }`}
            >
              {pill === 'Hammasi' ? 'Barcha do‘konlar' : `🔍 ${pill}`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Map Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Real Leaflet Map Viewport (Left 8 cols) */}
        <div className="lg:col-span-8 h-[380px] sm:h-[430px] rounded-3xl relative overflow-hidden border border-[#DCE5DF] dark:border-white/10 shadow-inner flex flex-col justify-between">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Zoom & Center Map Controls */}
          <div className="absolute right-3.5 bottom-3.5 z-20 flex flex-col gap-1.5 bg-white/90 dark:bg-[#14201A]/90 backdrop-blur-md p-1 rounded-xl border border-[#DCE5DF] dark:border-white/10 shadow-lg">
            <button
              onClick={handleZoomIn}
              title="Yaqinlashtirish"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#172C28] dark:text-white hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] transition"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Uzoqlashtirish"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#172C28] dark:text-white hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={handleCenter}
              title="Markazga qaytish"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#116B50] dark:text-[#4ADE80] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] transition"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>

          {/* Leaflet Status Badge Overlay */}
          <div className="absolute top-3.5 left-3.5 z-20 bg-white/90 dark:bg-[#14201A]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#DCE5DF] dark:border-white/10 text-[11px] font-bold text-[#172C28] dark:text-white shadow-md flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#116B50] dark:bg-[#4ADE80] animate-ping" />
            <span>Leaflet Real-Vaqt Xaritasi ({selectedRadius} m radius)</span>
          </div>
        </div>

        {/* Selected Store Inspector Card (Right 4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-white/10 rounded-3xl p-5 flex flex-col justify-between shadow-sm">
          {selectedStore ? (
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]">
                    {selectedStore.type === 'WHOLESALE' ? 'Ulgurji savdo' : 'Chakana do‘kon'}
                  </span>
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{selectedStore.rating}</span>
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-[#172C28] dark:text-white mt-2 leading-snug">
                  {selectedStore.name}
                </h3>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                  {selectedStore.address}
                </p>
              </div>

              {/* Store Details Strip */}
              <div className="bg-[#F9FAF9] dark:bg-[#1A2822] rounded-2xl p-3 flex flex-col gap-2 text-xs border border-[#DCE5DF] dark:border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[#566A63] dark:text-[#8B9E95]">Masofa:</span>
                  <strong className="text-[#116B50] dark:text-[#4ADE80] font-bold">
                    📍 {selectedStore.distanceM} metr uzoqlikda
                  </strong>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#DCE5DF]/60 dark:border-white/5">
                  <span className="text-[#566A63] dark:text-[#8B9E95]">Ish vaqti:</span>
                  <span className="text-[#116B50] dark:text-[#4ADE80] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#116B50] dark:bg-[#4ADE80]" />
                    <span>Ochiq (08:00–23:00)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#DCE5DF]/60 dark:border-white/5">
                  <span className="text-[#566A63] dark:text-[#8B9E95]">Assortiment:</span>
                  <span className="font-semibold text-[#172C28] dark:text-[#E8F2EC]">
                    🛍️ {selectedStore.offersCount} ta tovar va xizmat
                  </span>
                </div>
              </div>

              {/* Sample Product if available */}
              {selectedStore.sampleProduct && (
                <div className="p-3 bg-[#E0EFE7]/40 dark:bg-[#183324]/40 border border-[#116B50]/20 dark:border-[#4ADE80]/20 rounded-xl">
                  <span className="text-[10px] font-bold text-[#116B50] dark:text-[#4ADE80] block uppercase">
                    Misol tovar narxi:
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-bold text-[#172C28] dark:text-white">
                      {selectedStore.sampleProduct.name}
                    </span>
                    <span className="text-xs font-extrabold text-[#116B50] dark:text-[#4ADE80]">
                      {selectedStore.sampleProduct.price.toLocaleString('uz-UZ')} so‘m
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="my-auto text-center text-xs text-[#566A63] dark:text-[#8B9E95] p-6">
              Xaritadagi istalgan do‘kon piniga bosing
            </div>
          )}

          {/* Action Link */}
          <div className="mt-4 pt-3 border-t border-[#DCE5DF] dark:border-white/10">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-[#116B50] hover:bg-[#0D533E] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md"
            >
              <span>Xaridor ilovasida ko‘rish</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
