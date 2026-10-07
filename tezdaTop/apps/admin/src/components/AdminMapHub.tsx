import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  AlertTriangle,
  Building2,
  Phone,
  Clock,
  ExternalLink,
  Edit2,
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ShieldAlert,
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';
import { Tag, Button } from '@yaqintop/ui';
import { Store as StoreType } from '@yaqintop/contracts';

export interface EnrichedStore extends StoreType {
  organizationName?: string;
  inn?: string;
  region?: string;
  city?: string;
  district?: string;
  openReportsCount?: number;
  openCorrectionsCount?: number;
  activeOffersCount?: number;
  hasPendingModeration?: boolean;
}

interface AdminMapHubProps {
  stores: EnrichedStore[];
  isDarkMode: boolean;
  onEditStore: (store: EnrichedStore) => void;
  onJumpToReports: (storeId?: string) => void;
  onJumpToApplications: (storeId?: string) => void;
  onManageUsers: (organizationId: string) => void;
}

const REGION_OPTIONS = [
  'Barcha viloyatlar',
  'Toshkent shahri',
  'Samarqand viloyati',
  'Farg‘ona viloyati',
  'Andijon viloyati',
  'Namangan viloyati',
  'Buxoro viloyati',
  'Xorazm viloyati',
  'Qashqadaryo viloyati',
  'Surxondaryo viloyati',
  'Navoiy viloyati',
  'Jizzax viloyati',
  'Sirdaryo viloyati',
  'Qoraqalpog‘iston Respublikasi'
];

const DISTRICT_OPTIONS = [
  'Barcha tumanlar',
  'Yunusobod',
  'Mirobod',
  'Chilonzor',
  'Shayxontohur',
  'Yakkasaroy',
  'Mirzo Ulug‘bek',
  'Olmazor',
  'Uchtepa',
  'Yashnobod',
  'Sergeli',
  'Bektemir',
  'Samarqand shahri'
];

export function AdminMapHub({
  stores,
  isDarkMode,
  onEditStore,
  onJumpToReports,
  onJumpToApplications,
  onManageUsers
}: AdminMapHubProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedStore, setSelectedStore] = useState<EnrichedStore | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Barcha viloyatlar');
  const [selectedDistrict, setSelectedDistrict] = useState('Barcha tumanlar');
  const [filterMode, setFilterMode] = useState<'ALL' | 'WITH_ISSUES' | 'ACTIVE' | 'PENDING'>('ALL');

  // Filter stores
  const filteredStores = stores.filter((st) => {
    const query = searchQuery.toLowerCase().trim();
    const matchSearch =
      !query ||
      st.name.toLowerCase().includes(query) ||
      st.address.toLowerCase().includes(query) ||
      (st.inn && st.inn.includes(query)) ||
      (st.organizationName && st.organizationName.toLowerCase().includes(query)) ||
      st.phone.includes(query);

    const matchRegion =
      selectedRegion === 'Barcha viloyatlar' ||
      st.region === selectedRegion ||
      (selectedRegion === 'Toshkent shahri' && (!st.region || st.region.includes('Toshkent')));

    const matchDistrict =
      selectedDistrict === 'Barcha tumanlar' ||
      st.city === selectedDistrict ||
      st.district === selectedDistrict ||
      st.address.toLowerCase().includes(selectedDistrict.toLowerCase());

    const matchMode =
      filterMode === 'ALL'
        ? true
        : filterMode === 'WITH_ISSUES'
        ? (st.openReportsCount || 0) > 0 || st.hasPendingModeration || st.status === 'PENDING' || st.status === 'NEEDS_CHANGES'
        : filterMode === 'ACTIVE'
        ? st.status === 'ACTIVE'
        : st.status === 'PENDING' || st.status === 'NEEDS_CHANGES';

    return matchSearch && matchRegion && matchDistrict && matchMode;
  });

  const storesWithIssuesCount = stores.filter(
    (s) => (s.openReportsCount || 0) > 0 || s.hasPendingModeration || s.status === 'PENDING'
  ).length;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [41.311081, 69.240562],
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors & YaqinTop',
        maxZoom: 19
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      // Force recalculation of container dimensions
      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 300);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Invalidate size on theme change or container resize
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50);
    }
  }, [isDarkMode]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    filteredStores.forEach((store) => {
      const lat = store.location?.lat || 41.311081;
      const lng = store.location?.lng || 69.240562;
      const hasIssues = (store.openReportsCount || 0) > 0 || store.status === 'PENDING' || store.status === 'NEEDS_CHANGES';
      const issueCount = store.openReportsCount || (store.status === 'PENDING' ? 1 : 0);

      const markerHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -100%);">
          <!-- Outer pin card -->
          <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shadow-lg border text-xs font-bold transition-transform group-hover:scale-105 ${
            hasIssues
              ? 'bg-[#172C28] text-white border-red-500 shadow-red-500/20'
              : store.status === 'ACTIVE'
              ? 'bg-[#116B50] text-white border-emerald-400/40 shadow-emerald-900/20'
              : 'bg-amber-800 text-white border-amber-400/40 shadow-amber-900/20'
          }">
            <span class="text-sm">🏪</span>
            <span class="max-w-[130px] truncate">${store.name}</span>
          </div>

          <!-- Red badge with issue count -->
          ${
            hasIssues
              ? `
            <div class="absolute -top-2.5 -right-2.5 min-w-[20px] h-[20px] px-1 bg-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white dark:border-[#14201A] shadow-md animate-bounce">
              🔴 ${issueCount}
            </div>
          `
              : ''
          }

          <!-- Pin pointer triangle -->
          <div class="w-2.5 h-2.5 mx-auto -mt-1 rotate-45 ${
            hasIssues ? 'bg-[#172C28] border-r border-b border-red-500' : 'bg-[#116B50]'
          }"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-admin-marker',
        html: markerHtml,
        iconSize: [140, 42],
        iconAnchor: [70, 42],
        popupAnchor: [0, -42]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedStore(store);
        mapInstanceRef.current?.setView([lat, lng], 15, { animate: true });
      });

      markersLayerRef.current?.addLayer(marker);
    });

    // Auto-fit bounds if we have stores
    if (filteredStores.length > 0) {
      const bounds = L.latLngBounds(
        filteredStores.map((s) => [s.location?.lat || 41.311081, s.location?.lng || 69.240562])
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [filteredStores]);

  const handleFocusStore = (store: EnrichedStore) => {
    setSelectedStore(store);
    if (mapInstanceRef.current && store.location) {
      mapInstanceRef.current.setView([store.location.lat, store.location.lng], 16, {
        animate: true
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-120px)]">
      {/* Header & Geo Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#116B50] dark:text-[#4ADE80]" />
            <h1 className="text-xl font-extrabold text-[#172C28] dark:text-white">
              Tashkilotlar va Do‘konlar Geo-Moderatsiya Haritasi
            </h1>
          </div>
          <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">
            Barcha savdo nuqtalari, shikoyatlar va arizalar real vaqt rejimida qizil ko‘rsatkichlar bilan ko‘rsatiladi
          </p>
        </div>

        <div className="flex items-center gap-2">
          {storesWithIssuesCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-bold animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span>{storesWithIssuesCount} ta do‘konda moderatsiya/shikoyat bor</span>
            </div>
          )}
          <Tag variant="default" className="text-xs font-bold">
            Jami: {stores.length} ta do‘kon
          </Tag>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-3.5 shadow-sm text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Do‘kon, Tashkilot, INN yoki telefon..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:border-[#116B50]"
          />
        </div>

        {/* Region */}
        <div>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full p-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
          >
            {REGION_OPTIONS.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        </div>

        {/* District */}
        <div>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full p-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
          >
            {DISTRICT_OPTIONS.map((dist) => (
              <option key={dist} value={dist}>
                {dist}
              </option>
            ))}
          </select>
        </div>

        {/* Moderation Status Filter */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`flex-1 py-2 px-2 rounded-xl font-bold transition text-center ${
              filterMode === 'ALL'
                ? 'bg-[#116B50] text-white'
                : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95]'
            }`}
          >
            Barchasi ({stores.length})
          </button>
          <button
            onClick={() => setFilterMode('WITH_ISSUES')}
            className={`flex-1 py-2 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
              filterMode === 'WITH_ISSUES'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
            }`}
          >
            <span>🔴 Muammoli</span>
            {storesWithIssuesCount > 0 && (
              <span className="bg-red-700 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                {storesWithIssuesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Map + Store List Panel */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Left Side: Leaflet Map Container */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-[#DCE5DF] dark:border-[#22332C] relative shadow-sm min-h-[350px]">
          <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

          {/* Map Legend Floating Overlay */}
          <div className="absolute top-3 right-3 z-10 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-sm p-3 rounded-xl border border-[#DCE5DF] dark:border-[#22332C] shadow-lg text-[11px] flex flex-col gap-1.5">
            <span className="font-extrabold text-[#172C28] dark:text-white mb-0.5">Xarita belgilari</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#116B50]"></span>
              <span className="text-[#566A63] dark:text-[#8B9E95]">Faol do‘kon</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
              <span className="text-red-600 dark:text-red-400 font-semibold">🔴 Shikoyat / Moderatsiya</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-600"></span>
              <span className="text-[#566A63] dark:text-[#8B9E95]">Kutilayotgan ariza</span>
            </div>
          </div>
        </div>

        {/* Right Side: Stores Directory & Interactive Inspector */}
        <div className="w-full lg:w-96 flex flex-col gap-3 min-h-0">
          {/* Selected Store Inspector Card */}
          {selectedStore ? (
            <div className="bg-white dark:bg-[#14201A] border-2 border-[#116B50] dark:border-[#4ADE80] rounded-2xl p-4 shadow-xl flex flex-col gap-3 shrink-0 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-2 border-b border-[#DCE5DF] dark:border-[#22332C] pb-3">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-extrabold text-sm text-[#172C28] dark:text-white">
                      {selectedStore.name}
                    </h3>
                    <Tag variant={selectedStore.status === 'ACTIVE' ? 'default' : 'warn'} className="text-[10px]">
                      {selectedStore.status}
                    </Tag>
                  </div>
                  <span className="text-xs text-[#116B50] dark:text-[#4ADE80] font-semibold mt-0.5 block">
                    {selectedStore.organizationName} (INN: {selectedStore.inn || '308123456'})
                  </span>
                </div>

                <button
                  onClick={() => setSelectedStore(null)}
                  className="text-xs text-[#566A63] hover:text-red-500 font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Red Warning Banner if issues exist */}
              {((selectedStore.openReportsCount || 0) > 0 || selectedStore.hasPendingModeration) && (
                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl p-2.5 text-xs text-red-700 dark:text-red-400 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>
                      {selectedStore.openReportsCount || 1} ta ochiq shikoyat / moderatsiya talabi!
                    </span>
                  </div>
                  <p className="text-[11px] text-red-600/90 dark:text-red-300">
                    Xaridorlar narx nomuvofiqligi yoki tovar yo‘qligi haqida murojaat qilgan.
                  </p>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onJumpToReports(selectedStore.id)}
                    className="w-full text-xs font-bold mt-1"
                  >
                    Shikoyatni ko‘rish va tuzatish
                  </Button>
                </div>
              )}

              {/* Details List */}
              <div className="flex flex-col gap-1.5 text-xs text-[#566A63] dark:text-[#8B9E95]">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#116B50] shrink-0 mt-0.5" />
                  <span className="text-[#172C28] dark:text-[#E8F2EC]">{selectedStore.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-[#116B50] shrink-0" />
                  <span>
                    {selectedStore.region || 'Toshkent shahri'}, {selectedStore.city || 'Yunusobod'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#116B50] shrink-0" />
                  <span className="font-mono text-[#172C28] dark:text-[#E8F2EC]">{selectedStore.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#116B50] shrink-0" />
                  <span>
                    Ish vaqti:{' '}
                    {selectedStore.hours?.[0]
                      ? `${selectedStore.hours[0].openTime} - ${selectedStore.hours[0].closeTime}`
                      : '08:00 - 22:00'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#DCE5DF] dark:border-[#22332C]">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEditStore(selectedStore)}
                  className="flex items-center justify-center gap-1.5 text-xs font-semibold"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Tahrirlash</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onManageUsers(selectedStore.organizationId)}
                  className="flex items-center justify-center gap-1.5 text-xs font-semibold"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Xodimlar</span>
                </Button>
              </div>

              <a
                href={`${import.meta.env.DEV ? 'http://localhost:3000/' : 'https://yaqintop.uz/customer/'}?lat=${selectedStore.location?.lat}&lng=${selectedStore.location?.lng}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-1.5 px-3 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] text-center text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>Xaridor ilovasida ko‘rish</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="bg-[#116B50]/10 dark:bg-[#4ADE80]/10 border border-[#116B50]/20 dark:border-[#4ADE80]/20 rounded-2xl p-4 text-center text-xs text-[#116B50] dark:text-[#4ADE80] font-semibold">
              👈 Haritadagi do‘kon yoki quyidagi ro‘yxatdan birini tanlang
            </div>
          )}

          {/* Stores Sidebar List */}
          <div className="flex-1 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-3 shadow-sm overflow-y-auto flex flex-col gap-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCE5DF]/60 dark:border-[#22332C]">
              <span className="font-extrabold text-xs text-[#172C28] dark:text-white">
                Do‘konlar ro‘yxati ({filteredStores.length})
              </span>
              <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                {selectedRegion !== 'Barcha viloyatlar' ? selectedRegion : 'Barcha hududlar'}
              </span>
            </div>

            {filteredStores.map((st) => {
              const hasIssues = (st.openReportsCount || 0) > 0 || st.status === 'PENDING';
              const isSelected = selectedStore?.id === st.id;

              return (
                <div
                  key={st.id}
                  onClick={() => handleFocusStore(st)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-[#116B50] bg-[#E0EFE7] dark:bg-[#1E362A] dark:border-[#4ADE80]'
                      : hasIssues
                      ? 'border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20 hover:border-red-400'
                      : 'border-[#DCE5DF] dark:border-[#22332C] bg-[#F9FAF9] dark:bg-[#16241E] hover:border-[#116B50]/50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#172C28] dark:text-white truncate">{st.name}</span>
                      {hasIssues && (
                        <span className="px-1.5 py-0.2 bg-red-600 text-white font-extrabold text-[10px] rounded-full shrink-0">
                          🔴 {st.openReportsCount || 1}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] truncate mt-0.5">
                      {st.organizationName} · {st.city || st.region || 'Toshkent'}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
