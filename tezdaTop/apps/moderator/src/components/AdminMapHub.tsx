import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { matchesRegion, normalizeArea, mapViewport } from './map-geography';
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
  CheckCircle2,
  Trash2,
  Loader2,
  XCircle,
  ShieldAlert,
  ChevronRight,
  Layers,
  Sparkles,
  Plus,
  Package,
  Wrench,
  Camera,
  Upload,
  X
} from 'lucide-react';
import { Tag, Button, Modal, useTranslation } from '@yaqintop/ui';
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
  onResolveStoreIssues?: (store: EnrichedStore) => Promise<void> | void;
  onAddStoreAtCoords?: (lat: number, lng: number) => void;
  onStoreCreatedOrUpdated?: () => void;
}

const REGION_OPTIONS = [
  'Barcha viloyatlar',
  'Toshkent shahri',
  'Toshkent viloyati',
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

const validLocation = (store: EnrichedStore) => !!store.location &&
  Number.isFinite(store.location.lat) && Number.isFinite(store.location.lng) &&
  Math.abs(store.location.lat) <= 90 && Math.abs(store.location.lng) <= 180;


export function AdminMapHub({
  stores,
  isDarkMode,
  onEditStore,
  onJumpToReports,
  onJumpToApplications,
  onManageUsers,
  onResolveStoreIssues,
  onAddStoreAtCoords,
  onStoreCreatedOrUpdated
}: AdminMapHubProps) {
  const { t } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);

  const [selectedStore, setSelectedStore] = useState<EnrichedStore | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Barcha viloyatlar');
  const [selectedDistrict, setSelectedDistrict] = useState('Barcha tumanlar');
  const [filterMode, setFilterMode] = useState<'ALL' | 'WITH_ISSUES' | 'ACTIVE' | 'PENDING'>('ALL');

  // Map Zoom & Geo state
  const [currentZoom, setCurrentZoom] = useState(13);
  const isInitialGeoFitDone = useRef(false);
  const prevGeoFilter = useRef({ region: selectedRegion, district: selectedDistrict });

  // Add store on map click mode
  const [isAddStoreMode, setIsAddStoreMode] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const isAddStoreModeRef = useRef(false);
  const onAddStoreAtCoordsRef = useRef(onAddStoreAtCoords);
  useEffect(() => {
    isAddStoreModeRef.current = isAddStoreMode;
  }, [isAddStoreMode]);
  useEffect(() => {
    onAddStoreAtCoordsRef.current = onAddStoreAtCoords;
  }, [onAddStoreAtCoords]);

  // Store offers (tovar va xizmatlar)
  const [storeOffers, setStoreOffers] = useState<any[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);

  const loadOffers = async (storeId: string) => {
    setIsLoadingOffers(true);
    try {
      const res = await fetch(`/api/v1/stores/${storeId}/offers`);
      if (res.ok) {
        const data = await res.json();
        setStoreOffers(data.offers || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingOffers(false);
    }
  };

  useEffect(() => {
    if (selectedStore?.id) {
      loadOffers(selectedStore.id);
    } else {
      setStoreOffers([]);
    }
  }, [selectedStore?.id]);

  const handleDeleteOffer = async (offerId: string) => {
    if (!window.confirm('Haqiqatan ham ushbu tovar/xizmatni o‘chirmoqchimisiz?')) return;
    try {
      const res = await fetch(`/api/v1/admin/offers/${offerId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Tovar/xizmat muvaffaqiyatli o‘chirildi');
        if (selectedStore?.id) loadOffers(selectedStore.id);
        onStoreCreatedOrUpdated?.();
      } else {
        showToast('O‘chirishda xatolik yuz berdi');
      }
    } catch {
      showToast('Server bilan aloqa xatosi');
    }
  };

  // Add Offer Modal (Tovar / Usluga)
  const [isAddOfferModalOpen, setIsAddOfferModalOpen] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [newOfferForm, setNewOfferForm] = useState({
    type: 'PRODUCT' as 'PRODUCT' | 'SERVICE',
    title: '',
    category: 'Oziq-ovqat',
    price: '',
    packUnit: 'dona',
    stockOnHand: '10',
    barcode: '',
    brand: '',
    photoUrl: '',
    description: ''
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            callback(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      showToast('Rasmni yuklashda xatolik yuz berdi');
    }
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    if (!newOfferForm.title.trim()) {
      showToast('Nomi kiritilishi shart');
      return;
    }
    if (!newOfferForm.price) {
      showToast('Narxi kiritilishi shart');
      return;
    }
    setIsSubmittingOffer(true);
    try {
      const res = await fetch(`/api/v1/admin/stores/${selectedStore.id}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newOfferForm.title.trim(),
          type: newOfferForm.type,
          category: newOfferForm.category,
          price: parseFloat(newOfferForm.price),
          packUnit: newOfferForm.packUnit,
          stockOnHand: parseInt(newOfferForm.stockOnHand || '10', 10),
          barcode: newOfferForm.barcode.trim(),
          brand: newOfferForm.brand.trim(),
          photoUrl: newOfferForm.photoUrl,
          description: newOfferForm.description.trim()
        })
      });
      if (res.ok) {
        showToast(`Yangi ${newOfferForm.type === 'SERVICE' ? 'xizmat' : 'tovar'} muvaffaqiyatli qo‘shildi!`);
        setIsAddOfferModalOpen(false);
        setNewOfferForm({
          type: 'PRODUCT',
          title: '',
          category: 'Oziq-ovqat',
          price: '',
          packUnit: 'dona',
          stockOnHand: '10',
          barcode: '',
          brand: '',
          photoUrl: '',
          description: ''
        });
        loadOffers(selectedStore.id);
        onStoreCreatedOrUpdated?.();
      } else {
        const err = await res.json();
        showToast(err.message || 'Xatolik yuz berdi');
      }
    } catch {
      showToast('Server bilan aloqa xatosi');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  // Filter stores
  const districtOptions = useMemo(() => [
    'Barcha tumanlar',
    ...Array.from(new Set(stores.filter(st => matchesRegion(st, selectedRegion))
      .flatMap(st => [st.district, st.city]).filter((name): name is string => !!name?.trim())))
      .sort((a, b) => a.localeCompare(b, 'uz'))
  ], [stores, selectedRegion]);

  const filteredStores = useMemo(() => stores.filter((st) => {
    const query = searchQuery.toLowerCase().trim();
    const matchSearch =
      !query ||
      st.name.toLowerCase().includes(query) ||
      st.address.toLowerCase().includes(query) ||
      (st.inn && st.inn.includes(query)) ||
      (st.organizationName && st.organizationName.toLowerCase().includes(query)) ||
      st.phone.includes(query);

    const matchRegion = matchesRegion(st, selectedRegion);

    const matchDistrict =
      selectedDistrict === 'Barcha tumanlar' ||
      normalizeArea(st.city) === normalizeArea(selectedDistrict) ||
      normalizeArea(st.district) === normalizeArea(selectedDistrict) ||
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
  }), [stores, searchQuery, selectedRegion, selectedDistrict, filterMode]);

  useEffect(() => {
    setSelectedStore(current => current && filteredStores.some(store => store.id === current.id) ? current : null);
  }, [filteredStores]);

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

      setCurrentZoom(map.getZoom());
      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });

      // Map click handler for adding organization/store
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (isAddStoreModeRef.current) {
          onAddStoreAtCoordsRef.current?.(lat, lng);
          setIsAddStoreMode(false);
          return;
        }

        // Show pin popup on empty map click
        if (tempMarkerRef.current) {
          map.removeLayer(tempMarkerRef.current);
          tempMarkerRef.current = null;
        }

        const tempIcon = L.divIcon({
          className: 'temp-add-marker',
          html: `
            <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, 0); display: flex; flex-direction: column; align-items: center; cursor: pointer;">
              <div style="background: #116B50; color: white; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: 800; border: 2px solid white; box-shadow: 0 4px 12px rgba(17,107,80,0.5); white-space: nowrap;">
                📍 Yangi nuqta
              </div>
              <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #116B50;"></div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

        const tempMarker = L.marker([lat, lng], { icon: tempIcon }).addTo(map);
        tempMarkerRef.current = tempMarker;

        const popupContent = document.createElement('div');
        popupContent.style.padding = '4px';
        popupContent.style.textAlign = 'center';
        popupContent.style.fontFamily = 'inherit';
        popupContent.innerHTML = `
          <div style="font-weight: 800; font-size: 12px; color: #116B50; margin-bottom: 2px;">📍 Tanlangan joy</div>
          <div style="font-size: 10px; font-family: monospace; color: #566A63; margin-bottom: 8px;">${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
          <button id="add-store-here-popup-btn" style="width: 100%; background: #116B50; color: white; border: none; padding: 6px 10px; border-radius: 8px; font-weight: 700; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
            ➕ Shu yerga tashkilot qo‘shish
          </button>
        `;

        const btn = popupContent.querySelector('#add-store-here-popup-btn') as HTMLButtonElement | null;
        if (btn) {
          btn.onclick = () => {
            map.closePopup();
            if (tempMarkerRef.current) {
              map.removeLayer(tempMarkerRef.current);
              tempMarkerRef.current = null;
            }
            onAddStoreAtCoordsRef.current?.(lat, lng);
          };
        }

        tempMarker.bindPopup(popupContent, { offset: [0, -25] }).openPopup();
      });

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

  // Update Markers based on stores, selectedStore, and zoom level
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const isZoomedIn = currentZoom >= 14;

    filteredStores.filter(validLocation).forEach((store) => {
      const lat = store.location.lat;
      const lng = store.location.lng;
      const hasIssues = (store.openReportsCount || 0) > 0 || store.status === 'PENDING' || store.status === 'NEEDS_CHANGES';
      const issueCount = store.openReportsCount || (store.status === 'PENDING' ? 1 : 0);
      const isSelected = selectedStore?.id === store.id;

      // When zoomed out (currentZoom < 14) and NOT selected: show sleek geolocation dot
      if (!isZoomedIn && !isSelected) {
        const dotBg = hasIssues ? '#DC2626' : store.status === 'ACTIVE' ? '#116B50' : '#D97706';
        const halo = hasIssues
          ? 'box-shadow: 0 0 0 3px rgba(220,38,38,0.45), 0 2px 6px rgba(0,0,0,0.35);'
          : 'box-shadow: 0 0 0 2px rgba(17,107,80,0.3), 0 2px 5px rgba(0,0,0,0.3);';

        const dotHtml = `
          <div class="custom-admin-dot-marker" style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); cursor: pointer; user-select: none;">
            <div style="width: 14px; height: 14px; border-radius: 9999px; background: ${dotBg}; border: 2.5px solid #ffffff; ${halo}"></div>
          </div>
        `;

        const dotIcon = L.divIcon({
          className: 'custom-admin-dot-marker-wrap',
          html: dotHtml,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
          popupAnchor: [0, -10]
        });

        const marker = L.marker([lat, lng], { icon: dotIcon });
        marker.bindTooltip(
          `<div style="font-weight: 700; font-size: 11px; padding: 2px 4px;">${hasIssues ? '🔴 ' : '🏪 '}${store.name}</div>`,
          { direction: 'top', offset: [0, -10], opacity: 0.95, className: 'admin-marker-tooltip' }
        );

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedStore(store);
          const curZoom = mapInstanceRef.current?.getZoom() || 14;
          mapInstanceRef.current?.setView([lat, lng], Math.max(curZoom, 16), { animate: true });
        });

        markersLayerRef.current?.addLayer(marker);
        return;
      }

      // Detailed Badge when zoomed in (>= 14) or selected
      const selectedStyles = isSelected
        ? 'box-shadow: 0 0 0 3.5px #10B981, 0 0 20px rgba(16, 185, 129, 0.75), 0 8px 20px rgba(0,0,0,0.4); border: 2px solid #ffffff; transform: scale(1.12); z-index: 1000;'
        : '';

      const badgeBg = hasIssues
        ? 'background: #172C28; color: #ffffff; border: 1.5px solid #EF4444; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);'
        : store.status === 'ACTIVE'
        ? 'background: #116B50; color: #ffffff; border: 1.5px solid #34D399; box-shadow: 0 4px 12px rgba(17, 107, 80, 0.35);'
        : 'background: #92400E; color: #ffffff; border: 1.5px solid #FBBF24; box-shadow: 0 4px 12px rgba(146, 64, 14, 0.35);';

      const triangleColor = hasIssues ? '#EF4444' : store.status === 'ACTIVE' ? '#116B50' : '#92400E';

      const markerHtml = `
        <div class="custom-admin-marker" style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, 0); display: flex; flex-direction: column; align-items: center; pointer-events: auto; cursor: pointer; user-select: none;">
          ${isSelected ? `
            <div style="background: #10B981; color: white; font-size: 9px; font-weight: 800; padding: 1.5px 7px; border-radius: 9999px; margin-bottom: 2px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid white; white-space: nowrap;">
              ✓ TANLANGAN
            </div>
          ` : ''}
          <div style="position: relative; ${badgeBg} ${selectedStyles} display: inline-flex; align-items: center; gap: 6px; padding: 5px 9px; border-radius: 12px; font-size: 11px; font-weight: 700; white-space: nowrap; transition: all 0.2s ease;">
            <span style="font-size: 13px;">🏪</span>
            <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${store.name}</span>
            ${
              hasIssues
                ? `
              <div style="position: absolute; top: -7px; right: -7px; min-width: 18px; height: 18px; padding: 0 3px; background: #DC2626; color: white; font-size: 10px; font-weight: 800; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                🔴 ${issueCount}
              </div>
            `
                : ''
            }
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid ${isSelected ? '#10B981' : triangleColor}; margin-top: -1px;"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-admin-marker-wrap',
        html: markerHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -36]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedStore(store);
        const curZoom = mapInstanceRef.current?.getZoom() || 15;
        mapInstanceRef.current?.setView([lat, lng], Math.max(curZoom, 16), { animate: true });
      });

      markersLayerRef.current?.addLayer(marker);
    });

  }, [filteredStores, selectedStore, currentZoom]);

  // A geographic filter moves the map ONLY on initial load or when the region/district dropdown actually changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const geoFilterChanged =
      prevGeoFilter.current.region !== selectedRegion ||
      prevGeoFilter.current.district !== selectedDistrict;

    prevGeoFilter.current = { region: selectedRegion, district: selectedDistrict };

    // Don't fit bounds on regular re-renders, clicks, or modal opens!
    if (isInitialGeoFitDone.current && !geoFilterChanged) {
      return;
    }

    const locations = filteredStores.filter(validLocation).map(store =>
      [store.location.lat, store.location.lng] as [number, number]);

    if (locations.length === 0 && !geoFilterChanged && isInitialGeoFitDone.current) {
      return;
    }

    const viewport = mapViewport(selectedRegion, selectedDistrict, locations);
    if (viewport.locations && viewport.locations.length > 0) {
      map.fitBounds(L.latLngBounds(viewport.locations), { padding: [50, 50], maxZoom: 15 });
      isInitialGeoFitDone.current = true;
    } else if (viewport.center) {
      map.setView([viewport.center[0], viewport.center[1]], viewport.center[2], { animate: true });
      isInitialGeoFitDone.current = true;
    }

  }, [selectedRegion, selectedDistrict]);

  const handleFocusStore = (store: EnrichedStore) => {
    setSelectedStore(store);
    if (mapInstanceRef.current && store.location) {
      const curZoom = mapInstanceRef.current.getZoom();
      mapInstanceRef.current.setView([store.location.lat, store.location.lng], Math.max(curZoom, 16), {
        animate: true
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-120px)]">
      {/* Dynamic Map Hover & Marker Styles */}
      <style>{`
        .custom-admin-marker {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease;
        }
        .custom-admin-marker:hover {
          transform: translate(-50%, -6px) scale(1.15) !important;
          filter: drop-shadow(0 6px 14px rgba(0,0,0,0.35)) brightness(1.08);
          z-index: 9999 !important;
        }
        .custom-admin-dot-marker {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .custom-admin-dot-marker:hover {
          transform: translate(-50%, -50%) scale(1.5) !important;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
          z-index: 9999 !important;
        }
        .admin-marker-tooltip {
          background: #172C28 !important;
          color: #ffffff !important;
          border: 1px solid #10B981 !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
          font-weight: 700 !important;
          padding: 4px 8px !important;
        }
        .admin-marker-tooltip::before {
          border-top-color: #172C28 !important;
        }
      `}</style>
      {/* Header & Geo Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#116B50] dark:text-[#4ADE80]" />
            <h1 className="text-xl font-extrabold text-[#172C28] dark:text-white">
              {t('Tashkilotlar va Do‘konlar Geo-Moderatsiya Haritasi')}
            </h1>
          </div>
          <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">
            Barcha savdo nuqtalari, shikoyatlar va arizalar real vaqt rejimida qizil ko‘rsatkichlar bilan ko‘rsatiladi
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAddStoreMode(!isAddStoreMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
              isAddStoreMode
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 animate-pulse'
                : 'bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] text-[#116B50] dark:text-[#4ADE80] hover:bg-emerald-50 dark:hover:bg-[#1E3328]'
            }`}
            title="Xaritadagi istalgan nuqtani bosib yangi tashkilot qo‘shish"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddStoreMode ? '✓ Rejim faol (Kartani bosing)' : '📍 Kartaga bosib tashkilot qo‘shish'}</span>
          </button>
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
            aria-label="Viloyat"
            onChange={(e) => { setSelectedRegion(e.target.value); setSelectedDistrict('Barcha tumanlar'); }}
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
            aria-label="Tuman yoki shahar"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full p-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
          >
            {districtOptions.map((dist) => (
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
            <span>{t('🔴 Muammoli')}</span>
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
        <div className={`flex-1 rounded-2xl overflow-hidden border border-[#DCE5DF] dark:border-[#22332C] relative shadow-sm min-h-[350px] ${isAddStoreMode ? 'cursor-crosshair' : ''}`}>
          <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

          {isAddStoreMode && (
            <div className="absolute top-3 left-14 z-10 bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
              <MapPin className="w-4 h-4" />
              <span>Xaritada tashkilot joylashadigan nuqtani bosing!</span>
              <button
                type="button"
                onClick={() => setIsAddStoreMode(false)}
                className="ml-2 bg-emerald-800 hover:bg-emerald-900 px-2 py-0.5 rounded text-[10px] cursor-pointer"
              >
                Bekor qilish
              </button>
            </div>
          )}

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
              {((selectedStore.openReportsCount || 0) > 0 || selectedStore.hasPendingModeration || selectedStore.status === 'PENDING') ? (
                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl p-3 text-xs text-red-700 dark:text-red-400 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 animate-pulse" />
                      <span>
                        {(selectedStore.openReportsCount || 0) > 0
                          ? `${selectedStore.openReportsCount} ta ochiq shikoyat mavjud`
                          : selectedStore.status === 'PENDING'
                          ? '1 ta ariza moderatsiyasi kutilmoqda'
                          : '1 ta moderatsiya talabi'}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-red-600 text-white">
                      🔴 DIQQAT
                    </span>
                  </div>

                  <p className="text-[11px] text-red-600/90 dark:text-red-300 leading-relaxed">
                    {selectedStore.status === 'PENDING' && (selectedStore.openReportsCount || 0) === 0
                      ? 'Ushbu do‘kon arizasi tekshiruv kutilmoqda. Xaritada to‘liq faollashtirish yoki muammoni o‘chirib yopishingiz mumkin.'
                      : (selectedStore.openReportsCount || 0) > 0
                      ? 'Xaridorlar tomonidan narx nomuvofiqligi yoki yo‘q tovar bo‘yicha shikoyat tushgan.'
                      : 'Ushbu do‘kon bo‘yicha moderatsiya talab etiladi.'}
                  </p>

                  <div className="flex flex-col gap-1.5 pt-1 border-t border-red-200/60 dark:border-red-900/60">
                    {/* Primary Button: Muammoni o'chirish */}
                    <button
                      type="button"
                      disabled={isResolving}
                      onClick={async () => {
                        setIsResolving(true);
                        try {
                          if (onResolveStoreIssues) {
                            await onResolveStoreIssues(selectedStore);
                          } else {
                            await fetch(`/api/v1/admin/stores/${selectedStore.id}/resolve-issues`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' }
                            });
                          }
                          setSelectedStore({
                            ...selectedStore,
                            status: 'ACTIVE',
                            openReportsCount: 0,
                            openCorrectionsCount: 0,
                            hasPendingModeration: false
                          });
                        } catch (e) {
                          console.error(e);
                        } finally {
                          setIsResolving(false);
                        }
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {isResolving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>O‘chirilmoqda...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t('Muammoni o‘chirish (Bartaraf etish)')}</span>
                        </>
                      )}
                    </button>

                    {/* Quick Approve Button for Pending Stores */}
                    {selectedStore.status === 'PENDING' && (
                      <button
                        type="button"
                        disabled={isResolving}
                        onClick={async () => {
                          setIsResolving(true);
                          try {
                            if (onResolveStoreIssues) {
                              await onResolveStoreIssues(selectedStore);
                            } else {
                              await fetch(`/api/v1/admin/applications/${selectedStore.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'APPROVE' })
                              });
                            }
                            setSelectedStore({
                              ...selectedStore,
                              status: 'ACTIVE',
                              openReportsCount: 0,
                              hasPendingModeration: false
                            });
                          } catch (e) {
                            console.error(e);
                          } finally {
                            setIsResolving(false);
                          }
                        }}
                        className="w-full py-1.5 px-3 rounded-xl bg-[#116B50] hover:bg-[#0B563F] text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Arizani tasdiqlash (Faollashtirish)</span>
                      </button>
                    )}

                    {/* Secondary Navigation Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedStore.status === 'PENDING') {
                          onJumpToApplications(selectedStore.id);
                        } else {
                          onJumpToReports(selectedStore.id);
                        }
                      }}
                      className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-[#1A2822] hover:bg-red-100/50 dark:hover:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 font-bold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>
                        {selectedStore.status === 'PENDING' ? 'Arizalar bo‘limida ko‘rish' : 'Shikoyatlarni ko‘rish va tuzatish'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ushbu do‘konda hech qanday muammo yo‘q, barchasi to‘g‘ri.</span>
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
                    {selectedStore.region || 'Viloyat ko‘rsatilmagan'}, {selectedStore.district || selectedStore.city || 'Tuman ko‘rsatilmagan'}
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
              <div className="flex flex-col gap-2 pt-2 border-t border-[#DCE5DF] dark:border-[#22332C]">
                {/* Primary Button: Add Offer / Service */}
                <button
                  type="button"
                  onClick={() => setIsAddOfferModalOpen(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#116B50] to-[#0D533E] hover:from-[#0D533E] hover:to-[#083526] active:scale-95 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>➕ Tovar yoki Xizmat (Usluga) qo‘shish</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onEditStore(selectedStore)}
                    className="flex items-center justify-center gap-1.5 text-xs font-semibold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{t('edit', 'Tahrirlash')}</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onManageUsers(selectedStore.organizationId)}
                    className="flex items-center justify-center gap-1.5 text-xs font-semibold"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{t('Xodimlar', 'Xodimlar')}</span>
                  </Button>
                </div>

                <a
                  href={`${'https://yaqintop.uz/customer/'}?lat=${selectedStore.location?.lat}&lng=${selectedStore.location?.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-1.5 px-3 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] text-center text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <span>{t('Xaridor ilovasida ko‘rish')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Store Offers & Services List */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#DCE5DF] dark:border-[#22332C]">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#172C28] dark:text-[#E8F2EC] flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                    <span>Tovarlar & Xizmatlar ({storeOffers.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddOfferModalOpen(true)}
                    className="text-[11px] text-[#116B50] dark:text-[#4ADE80] hover:underline font-bold cursor-pointer"
                  >
                    + Qo‘shish
                  </button>
                </div>

                {isLoadingOffers ? (
                  <div className="py-3 text-center text-xs text-[#566A63] flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Yuklanmoqda...</span>
                  </div>
                ) : storeOffers.length === 0 ? (
                  <div className="p-3 text-center rounded-xl bg-[#F9FAF9] dark:bg-[#16241E] border border-dashed border-[#DCE5DF] dark:border-[#273B32] text-xs text-[#566A63] dark:text-[#8B9E95]">
                    Hozircha tovar yoki xizmat kiritilmagan. Yuqoridagi yashil tugma orqali qo‘shing.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {storeOffers.map((off) => {
                      const v = off.variant || {};
                      const isSvc = v.type === 'SERVICE' || v.category === 'Xizmat' || v.packUnit === 'xizmat';
                      return (
                        <div
                          key={off.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {v.photoUrl ? (
                              <img src={v.photoUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-[#DCE5DF] dark:border-[#273B32]" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-[#1E3328] text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center shrink-0 font-bold text-xs">
                                {isSvc ? '🛠️' : '📦'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-[#172C28] dark:text-[#E8F2EC] truncate">
                                {v.title || 'Nomsiz'}
                              </div>
                              <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] flex items-center gap-1">
                                <span className="font-semibold text-[#116B50] dark:text-[#4ADE80]">
                                  {Number(off.price).toLocaleString()} so‘m
                                </span>
                                <span>·</span>
                                <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-[#E2EEE4] dark:bg-[#1E3328] text-[#116B50] dark:text-[#4ADE80]">
                                  {isSvc ? 'Xizmat' : 'Tovar'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteOffer(off.id)}
                            title="O‘chirish"
                            className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
                {t('Do‘konlar ro‘yxati')} ({filteredStores.length})
              </span>
              <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                {selectedRegion !== 'Barcha viloyatlar' ? selectedRegion : 'Barcha hududlar'}
              </span>
            </div>

            {filteredStores.length === 0 && <p role="status" className="p-3 text-xs text-[#566A63] dark:text-[#8B9E95]">Tanlangan filtrlar bo‘yicha do‘kon topilmadi.</p>}
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
                      {st.organizationName} · {st.city || st.region || 'Hudud ko‘rsatilmagan'}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ADD OFFER MODAL (Tovar yoki Usluga) */}
      {selectedStore && isAddOfferModalOpen && (
        <Modal
          isOpen={isAddOfferModalOpen}
          onClose={() => setIsAddOfferModalOpen(false)}
          title={`"${selectedStore.name}" ga tovar yoki xizmat qo‘shish`}
        >
          <form onSubmit={handleSaveOffer} className="flex flex-col gap-4 text-xs">
            {/* Type selector: Tovar vs Usluga */}
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Turi *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewOfferForm({ ...newOfferForm, type: 'PRODUCT', packUnit: 'dona', category: 'Oziq-ovqat' })}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    newOfferForm.type === 'PRODUCT'
                      ? 'border-[#116B50] bg-emerald-50 dark:bg-emerald-950/40 text-[#116B50] dark:text-[#4ADE80] ring-1 ring-[#116B50]'
                      : 'border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] text-[#566A63]'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>📦 Tovar (Mahsulot)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewOfferForm({ ...newOfferForm, type: 'SERVICE', packUnit: 'xizmat', category: 'Xizmat' })}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    newOfferForm.type === 'SERVICE'
                      ? 'border-[#116B50] bg-emerald-50 dark:bg-emerald-950/40 text-[#116B50] dark:text-[#4ADE80] ring-1 ring-[#116B50]'
                      : 'border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] text-[#566A63]'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  <span>🛠️ Xizmat (Usluga)</span>
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">
                {newOfferForm.type === 'SERVICE' ? 'Xizmat nomi *' : 'Tovar / Mahsulot nomi *'}
              </label>
              <input
                type="text"
                required
                value={newOfferForm.title}
                onChange={(e) => setNewOfferForm({ ...newOfferForm, title: e.target.value })}
                placeholder={newOfferForm.type === 'SERVICE' ? 'Masalan: Avtomobil diagnostikasi yoki Soch turmagi' : 'Masalan: Flesh 0.5l yoki Qora non'}
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>

            {/* Price & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Narxi (so‘m) *</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={newOfferForm.price}
                  onChange={(e) => setNewOfferForm({ ...newOfferForm, price: e.target.value })}
                  placeholder="Masalan: 15000"
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] font-mono"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Birligi</label>
                <select
                  value={newOfferForm.packUnit}
                  onChange={(e) => setNewOfferForm({ ...newOfferForm, packUnit: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
                >
                  {newOfferForm.type === 'SERVICE' ? (
                    <>
                      <option value="xizmat">xizmat</option>
                      <option value="soat">soat</option>
                      <option value="kun">kun</option>
                      <option value="oy">oy</option>
                      <option value="dona">dona</option>
                    </>
                  ) : (
                    <>
                      <option value="dona">dona</option>
                      <option value="kg">kg</option>
                      <option value="litr">litr</option>
                      <option value="metr">metr</option>
                      <option value="paket">paket</option>
                      <option value="quti">quti</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Category & Stock */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Kategoriya</label>
                <input
                  type="text"
                  value={newOfferForm.category}
                  onChange={(e) => setNewOfferForm({ ...newOfferForm, category: e.target.value })}
                  placeholder={newOfferForm.type === 'SERVICE' ? 'Avtoservis, Go‘zallik, Ta’mirlash' : 'Oziq-ovqat, Ichimliklar'}
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">
                  {newOfferForm.type === 'SERVICE' ? 'Mavjudligi' : 'Soni / Qoldiq (dona)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={newOfferForm.stockOnHand}
                  onChange={(e) => setNewOfferForm({ ...newOfferForm, stockOnHand: e.target.value })}
                  placeholder="10"
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] font-mono"
                />
              </div>
            </div>

            {/* Barcode & Brand (Optional) */}
            {newOfferForm.type === 'PRODUCT' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Shtrix-kod (ixtiyoriy)</label>
                  <input
                    type="text"
                    value={newOfferForm.barcode}
                    onChange={(e) => setNewOfferForm({ ...newOfferForm, barcode: e.target.value })}
                    placeholder="47800..."
                    className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Brend (ixtiyoriy)</label>
                  <input
                    type="text"
                    value={newOfferForm.brand}
                    onChange={(e) => setNewOfferForm({ ...newOfferForm, brand: e.target.value })}
                    placeholder="Masalan: Coca-Cola, Artel"
                    className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-xs"
                  />
                </div>
              </div>
            )}

            {/* Photo upload: Device Camera / File or URL */}
            <div className="flex flex-col gap-2 p-3 bg-[#F9FAF9] dark:bg-[#16241E] rounded-xl border border-[#DCE5DF] dark:border-[#273B32]">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[#172C28] dark:text-[#E8F2EC] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                  <span>{newOfferForm.type === 'SERVICE' ? 'Xizmat rasmi:' : 'Tovar rasmi:'}</span>
                </label>
                {newOfferForm.photoUrl && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ Rasm yuklangan
                  </span>
                )}
              </div>

              {newOfferForm.photoUrl ? (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#DCE5DF] dark:border-[#273B32] bg-[#E2EEE4] dark:bg-[#182C22] group">
                  <img src={newOfferForm.photoUrl} alt="Offer preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <label className="px-3 py-1.5 rounded-xl bg-white text-[#172C28] text-xs font-bold hover:bg-gray-100 transition cursor-pointer flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Almashtirish</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, (url) => setNewOfferForm(prev => ({ ...prev, photoUrl: url })))}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewOfferForm({ ...newOfferForm, photoUrl: '' })}
                      className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>O‘chirish</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="w-full h-20 rounded-xl border-2 border-dashed border-[#116B50]/60 dark:border-[#4ADE80]/60 bg-[#E0EFE7]/30 dark:bg-[#1A2822] hover:bg-[#E0EFE7]/70 flex flex-col items-center justify-center gap-1 cursor-pointer transition p-2 text-center group">
                    <Upload className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80] group-hover:scale-110 transition" />
                    <span className="font-bold text-xs text-[#116B50] dark:text-[#4ADE80]">
                      Qurilmadan rasm yuklash (kamera / fayl)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e, (url) => setNewOfferForm(prev => ({ ...prev, photoUrl: url })))}
                    />
                  </label>

                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-[#DCE5DF] dark:bg-[#273B32]" />
                    <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">yoki havola</span>
                    <div className="h-px flex-1 bg-[#DCE5DF] dark:bg-[#273B32]" />
                  </div>

                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={newOfferForm.photoUrl}
                    onChange={(e) => setNewOfferForm({ ...newOfferForm, photoUrl: e.target.value })}
                    className="w-full p-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE5DF] dark:border-[#22332C]">
              <Button variant="secondary" type="button" onClick={() => setIsAddOfferModalOpen(false)}>
                Bekor qilish
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmittingOffer}
                className="bg-[#116B50] hover:bg-[#0d533e]"
              >
                {isSubmittingOffer ? 'Saqlanmoqda...' : 'Saqlash va Do‘konga qo‘shish'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#172C28] text-white px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-500/40 text-xs font-bold animate-in fade-in flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
