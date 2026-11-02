import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  Filter,
  Plus,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  X,
  Phone,
  Building2,
  FileText,
  DollarSign,
  Layers,
  Globe,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Compass,
  TrendingUp,
  Tag as TagIcon
} from 'lucide-react';
import { Button, Tag } from '@yaqintop/ui';
import { ClientStore, GlobalDistributionPoint } from '../App';
import { matchesRegion, normalizeArea, mapViewport, REGION_VIEWS } from './map-geography';
import { useDealerI18n } from '../i18n/dealer-i18n';

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

interface DealerMapHubProps {
  stores: ClientStore[];
  isDarkMode: boolean;
  onOpenSupply: (store: ClientStore) => void;
  onOpenPayment: (store: ClientStore) => void;
  onOpenReturn: (store: ClientStore) => void;
  onOpenAktSverka: (store: ClientStore) => void;
  onAddStoreAtCoords?: (lat: number, lng: number) => void;
  selectedStoresForRoute: string[];
  setSelectedStoresForRoute: React.Dispatch<React.SetStateAction<string[]>>;
  calculatedRoute: any;
  isCalculatingRoute: boolean;
  onCalculateRoute: () => void;
  onClearRoute: () => void;
  mapMode: 'crm' | 'global';
  setMapMode: (mode: 'crm' | 'global') => void;
  allowExperimentalMap: boolean;
  globalGoods: GlobalDistributionPoint[];
  globalCategoryFilter: string;
  setGlobalCategoryFilter: (cat: string) => void;
}

export function DealerMapHub({
  stores,
  isDarkMode,
  onOpenSupply,
  onOpenPayment,
  onOpenReturn,
  onOpenAktSverka,
  onAddStoreAtCoords,
  selectedStoresForRoute,
  setSelectedStoresForRoute,
  calculatedRoute,
  isCalculatingRoute,
  onCalculateRoute,
  onClearRoute,
  mapMode,
  setMapMode,
  allowExperimentalMap,
  globalGoods,
  globalCategoryFilter,
  setGlobalCategoryFilter
}: DealerMapHubProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);

  const { lang, t } = useDealerI18n();

  // Dynamic region options based on language
  const regionOptions = useMemo(() => {
    if (lang === 'ru') {
      return [
        { value: 'Barcha viloyatlar', label: 'Все регионы' },
        { value: 'Toshkent shahri', label: 'г. Ташкент' },
        { value: 'Toshkent viloyati', label: 'Ташкентская область' },
        { value: 'Samarqand viloyati', label: 'Самаркандская область' },
        { value: 'Farg‘ona viloyati', label: 'Ферганская область' },
        { value: 'Andijon viloyati', label: 'Андижанская область' },
        { value: 'Namangan viloyati', label: 'Наманганская область' },
        { value: 'Buxoro viloyati', label: 'Бухарская область' },
        { value: 'Xorazm viloyati', label: 'Хорезмская область' },
        { value: 'Qashqadaryo viloyati', label: 'Кашкадарьинская область' },
        { value: 'Surxondaryo viloyati', label: 'Сурхандарьинская область' },
        { value: 'Navoiy viloyati', label: 'Навоийская область' },
        { value: 'Jizzax viloyati', label: 'Джизакская область' },
        { value: 'Sirdaryo viloyati', label: 'Сырдарьинская область' },
        { value: 'Qoraqalpog‘iston Respublikasi', label: 'Республика Каракалпакстан' }
      ];
    }
    if (lang === 'en') {
      return [
        { value: 'Barcha viloyatlar', label: 'All regions' },
        { value: 'Toshkent shahri', label: 'Tashkent city' },
        { value: 'Toshkent viloyati', label: 'Tashkent region' },
        { value: 'Samarqand viloyati', label: 'Samarkand region' },
        { value: 'Farg‘ona viloyati', label: 'Fergana region' },
        { value: 'Andijon viloyati', label: 'Andijan region' },
        { value: 'Namangan viloyati', label: 'Namangan region' },
        { value: 'Buxoro viloyati', label: 'Bukhara region' },
        { value: 'Xorazm viloyati', label: 'Khorezm region' },
        { value: 'Qashqadaryo viloyati', label: 'Kashkadarya region' },
        { value: 'Surxondaryo viloyati', label: 'Surkhandarya region' },
        { value: 'Navoiy viloyati', label: 'Navoi region' },
        { value: 'Jizzax viloyati', label: 'Jizzakh region' },
        { value: 'Sirdaryo viloyati', label: 'Syrdarya region' },
        { value: 'Qoraqalpog‘iston Respublikasi', label: 'Republic of Karakalpakstan' }
      ];
    }
    return [
      { value: 'Barcha viloyatlar', label: 'Barcha viloyatlar' },
      { value: 'Toshkent shahri', label: 'Toshkent shahri' },
      { value: 'Toshkent viloyati', label: 'Toshkent viloyati' },
      { value: 'Samarqand viloyati', label: 'Samarqand viloyati' },
      { value: 'Farg‘ona viloyati', label: 'Farg‘ona viloyati' },
      { value: 'Andijon viloyati', label: 'Andijon viloyati' },
      { value: 'Namangan viloyati', label: 'Namangan viloyati' },
      { value: 'Buxoro viloyati', label: 'Buxoro viloyati' },
      { value: 'Xorazm viloyati', label: 'Xorazm viloyati' },
      { value: 'Qashqadaryo viloyati', label: 'Qashqadaryo viloyati' },
      { value: 'Surxondaryo viloyati', label: 'Surxondaryo viloyati' },
      { value: 'Navoiy viloyati', label: 'Navoiy viloyati' },
      { value: 'Jizzax viloyati', label: 'Jizzax viloyati' },
      { value: 'Sirdaryo viloyati', label: 'Sirdaryo viloyati' },
      { value: 'Qoraqalpog‘iston Respublikasi', label: 'Qoraqalpog‘iston Respublikasi' }
    ];
  }, [lang]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // 150ms debounce on search to eliminate map redraw lag during typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [selectedRegion, setSelectedRegion] = useState('Barcha viloyatlar');
  const [selectedDistrict, setSelectedDistrict] = useState('Barcha tumanlar');
  const [debtFilter, setDebtFilter] = useState<'ALL' | 'GREEN' | 'YELLOW' | 'RED'>('ALL');
  const [isAddStoreMode, setIsAddStoreMode] = useState(false);
  const isAddStoreModeRef = useRef(isAddStoreMode);
  isAddStoreModeRef.current = isAddStoreMode;

  const [selectedStore, setSelectedStore] = useState<ClientStore | null>(null);
  const [showMobileLegend, setShowMobileLegend] = useState(false);
  const [mobileMapTab, setMobileMapTab] = useState<'map' | 'details'>('map');
  const [currentZoom, setCurrentZoom] = useState(13);
  const isInitialFitDoneRef = useRef(false);
  const prevFilterKeyRef = useRef('');

  // Map resize handler when layout, tab, or dark mode switches
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [mobileMapTab, selectedStore, isDarkMode]);

  // Dynamic district options based on selected region
  const districtOptions = useMemo(() => {
    const defaultLabel = lang === 'ru' ? 'Все районы' : lang === 'en' ? 'All districts' : 'Barcha tumanlar';
    const list = new Set<string>();
    stores.forEach((s) => {
      if (s.storeAddress) {
        const parts = s.storeAddress.split(',').map((p) => p.trim());
        if (parts.length > 1) {
          list.add(parts[parts.length - 1]);
        }
      }
    });
    return [defaultLabel, ...Array.from(list).sort((a, b) => a.localeCompare(b, lang === 'ru' ? 'ru' : 'uz'))];
  }, [stores, lang]);

  // Filtered stores using debounced search to avoid heavy DOM churn on map markers
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const q = debouncedSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.storeName.toLowerCase().includes(q) ||
        s.storeAddress.toLowerCase().includes(q) ||
        s.storePhone.includes(q) ||
        (s.storeInn && s.storeInn.includes(q));

      const matchRegion =
        selectedRegion === 'Barcha viloyatlar' ||
        matchesRegion({ region: s.storeAddress, lat: s.lat, lng: s.lng }, selectedRegion);

      const isDefaultDistrict =
        selectedDistrict === 'Barcha tumanlar' ||
        selectedDistrict === 'Все районы' ||
        selectedDistrict === 'All districts';
      const matchDistrict =
        isDefaultDistrict ||
        s.storeAddress.toLowerCase().includes(selectedDistrict.toLowerCase());

      const matchDebt = debtFilter === 'ALL' || s.debtStatus === debtFilter;

      return matchSearch && matchRegion && matchDistrict && matchDebt;
    });
  }, [stores, debouncedSearch, selectedRegion, selectedDistrict, debtFilter]);

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
      const routeLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      routeLayerRef.current = routeLayer;
      mapInstanceRef.current = map;

      setCurrentZoom(map.getZoom());
      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });

      // Click on map to pin new store
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (isAddStoreModeRef.current) {
          onAddStoreAtCoords?.(lat, lng);
          setIsAddStoreMode(false);
          return;
        }

        // Show temp pin popup
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

        const popupDiv = document.createElement('div');
        popupDiv.style.padding = '4px';
        popupDiv.style.textAlign = 'center';
        popupDiv.innerHTML = `
          <div style="font-weight: 800; font-size: 12px; color: #116B50; margin-bottom: 2px;">📍 Belgilangan GPS nuqta</div>
          <div style="font-size: 10px; font-family: monospace; color: #566A63; margin-bottom: 8px;">${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
          <button id="dealer-add-store-btn" style="width: 100%; background: #116B50; color: white; border: none; padding: 6px 10px; border-radius: 8px; font-weight: 700; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
            ➕ Shu yerga yangi do‘kon qo‘shish
          </button>
        `;

        tempMarker.bindPopup(popupDiv).openPopup();
        setTimeout(() => {
          const btn = document.getElementById('dealer-add-store-btn');
          if (btn) {
            btn.onclick = () => {
              onAddStoreAtCoords?.(lat, lng);
              if (tempMarkerRef.current) {
                map.removeLayer(tempMarkerRef.current);
                tempMarkerRef.current = null;
              }
            };
          }
        }, 100);
      });
    }

    return () => {
      // Clean up map instance if unmounted
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);


  // Render Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (mapMode === 'crm') {
      // 1-Rejim: CRM - Diller do'konlari
      const bounds = L.latLngBounds([]);
      const isZoomedIn = currentZoom >= 14;
      const filterKey = `${searchQuery}-${selectedRegion}-${selectedDistrict}-${debtFilter}-${filteredStores.length}`;

      filteredStores.forEach((store) => {
        if (!store.lat || !store.lng) return;

        bounds.extend([store.lat, store.lng]);

        const color =
          store.debtStatus === 'GREEN'
            ? '#10B981' // Yashil
            : store.debtStatus === 'YELLOW'
            ? '#F59E0B' // Sariq
            : '#EF4444'; // Qizil

        const isRouteStop = selectedStoresForRoute.includes(store.storeId);
        const stopIndex = isRouteStop ? selectedStoresForRoute.indexOf(store.storeId) + 1 : null;
        const isSelected = selectedStore?.storeId === store.storeId;

        // 1. Uzoq masofada (< 14) va tanlanmagan bo'lsa -> Ixcham rangli nuqta (hover effektli)
        if (!isZoomedIn && !isSelected) {
          const dotHtml = `
            <div class="dealer-marker-dot" style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); cursor: pointer; user-select: none;">
              <div style="
                width: ${stopIndex ? '18px' : '13px'};
                height: ${stopIndex ? '18px' : '13px'};
                border-radius: 9999px;
                background: ${color};
                border: 2px solid #ffffff;
                box-shadow: 0 0 0 2px ${color}55, 0 3px 8px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 10px;
                font-weight: 900;
              ">
                ${stopIndex ? stopIndex : ''}
              </div>
            </div>
          `;

          const dotIcon = L.divIcon({
            className: 'dealer-marker-dot-wrap',
            html: dotHtml,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          });

          const marker = L.marker([store.lat, store.lng], { icon: dotIcon });
          marker.bindTooltip(
            `<div style="font-weight: 800; font-size: 11px; padding: 2px 4px; display: flex; align-items: center; gap: 5px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; display: inline-block;"></span>
              <span>${store.storeName}</span>
              <span style="color: ${color}; font-size: 10px; font-weight: 700;">• ${store.currentDebtBalance > 0 ? store.currentDebtBalance.toLocaleString() + ' so‘m' : 'Qarzsiz'}</span>
            </div>`,
            { direction: 'top', offset: [0, -10], opacity: 0.95, className: 'dealer-marker-tooltip' }
          );

          marker.on('click', () => {
            setSelectedStore(store);
            map.setView([store.lat, store.lng], Math.max(map.getZoom(), 15), { animate: true });
          });

          markersLayer.addLayer(marker);
          return;
        }

        // 2. Tanlangan do'kon (Clicked / Selected) -> Katta ajratilgan nurli ko'rinish va "✓ TANLANGAN" yozuvi
        if (isSelected) {
          const selectedHtml = `
            <div class="dealer-marker-selected" style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, 0) scale(1.15); display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
              <div style="background: #116B50; color: white; font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 9999px; margin-bottom: 3px; box-shadow: 0 2px 8px rgba(0,0,0,0.4); border: 1.5px solid white; white-space: nowrap; display: flex; align-items: center; gap: 3px;">
                <span>✓</span>
                <span>TANLANGAN</span>
              </div>
              <div style="
                background: ${color};
                color: white;
                padding: 5px 11px;
                border-radius: 9999px;
                font-size: 11px;
                font-weight: 900;
                border: 2.5px solid #ffffff;
                box-shadow: 0 0 0 3.5px #10B981, 0 0 22px rgba(16, 185, 129, 0.75), 0 8px 24px rgba(0,0,0,0.45);
                white-space: nowrap;
                display: flex;
                align-items: center;
                gap: 5px;
              ">
                ${stopIndex ? `<span style="background: white; color: ${color}; width: 15px; height: 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900;">${stopIndex}</span>` : `<span style="width: 7px; height: 7px; border-radius: 50%; background: white;"></span>`}
                <span>${store.storeName}</span>
              </div>
              <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid ${color};"></div>
            </div>
          `;

          const selectedIcon = L.divIcon({
            className: 'dealer-marker-selected-wrap',
            html: selectedHtml,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          });

          const marker = L.marker([store.lat, store.lng], { icon: selectedIcon });
          marker.bindTooltip(
            `<div style="font-weight: 800; font-size: 11px; padding: 2px 4px;">
              <span>📍 ${store.storeAddress}</span>
              <div style="color: ${color}; font-size: 10px; margin-top: 2px;">Qarz: ${store.currentDebtBalance.toLocaleString()} so‘m</div>
            </div>`,
            { direction: 'top', offset: [0, -32], opacity: 0.95, className: 'dealer-marker-tooltip' }
          );

          marker.on('click', () => {
            setSelectedStore(store);
            map.setView([store.lat, store.lng], Math.max(map.getZoom(), 15), { animate: true });
          });

          markersLayer.addLayer(marker);
          return;
        }

        // 3. Yaqinlashtirilganda (>= 14) -> Do'kon nomi bilan to'liq nishon (hover effekti bilan)
        const iconHtml = `
          <div class="dealer-marker-badge" style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, 0); display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
            <div style="
              background: ${color};
              color: white;
              padding: 4px 8px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 800;
              border: 2px solid white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              white-space: nowrap;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              ${stopIndex ? `<span style="background: white; color: ${color}; width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900;">${stopIndex}</span>` : `<span style="width: 6px; height: 6px; border-radius: 50%; background: white;"></span>`}
              <span>${store.storeName}</span>
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid ${color};"></div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'dealer-store-marker',
          html: iconHtml,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

        const marker = L.marker([store.lat, store.lng], { icon });
        marker.bindTooltip(
          `<div style="font-weight: 800; font-size: 11px; padding: 2px 4px;">
            <span>📍 ${store.storeAddress}</span>
            <div style="color: ${color}; font-size: 10px; margin-top: 2px;">Qarz: ${store.currentDebtBalance.toLocaleString()} so‘m</div>
          </div>`,
          { direction: 'top', offset: [0, -20], opacity: 0.95, className: 'dealer-marker-tooltip' }
        );

        marker.on('click', () => {
          setSelectedStore(store);
          map.setView([store.lat, store.lng], Math.max(map.getZoom(), 15), { animate: true });
        });
        markersLayer.addLayer(marker);
      });

      // Fit bounds faqat boshida yoki filter o'zgarganda ishlaydi
      if (filteredStores.length > 0 && bounds.isValid()) {
        if (!isInitialFitDoneRef.current || prevFilterKeyRef.current !== filterKey) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
          isInitialFitDoneRef.current = true;
          prevFilterKeyRef.current = filterKey;
        }
      }
    } else {
      // 2-Rejim: Global tovarlar xaritasi (Eksperimental)
      const bounds = L.latLngBounds([]);
      const isZoomedIn = currentZoom >= 14;

      globalGoods.forEach((item) => {
        if (!item.lat || !item.lng) return;
        bounds.extend([item.lat, item.lng]);

        const volColor =
          item.supplyVolume === 'HIGH' ? '#9333EA' : item.supplyVolume === 'MEDIUM' ? '#3B82F6' : '#10B981';

        if (!isZoomedIn) {
          const dotHtml = `
            <div class="dealer-marker-dot" style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); cursor: pointer; user-select: none;">
              <div style="width: 13px; height: 13px; border-radius: 9999px; background: ${volColor}; border: 2px solid #ffffff; box-shadow: 0 0 0 2px ${volColor}55, 0 3px 8px rgba(0,0,0,0.4);"></div>
            </div>
          `;
          const dotIcon = L.divIcon({ className: 'global-dot-marker', html: dotHtml, iconSize: [0, 0], iconAnchor: [0, 0] });
          const marker = L.marker([item.lat, item.lng], { icon: dotIcon });
          marker.bindTooltip(
            `<div style="font-weight: 800; font-size: 11px;">📦 ${item.productName} (${item.supplyVolume})</div>`,
            { direction: 'top', offset: [0, -10], opacity: 0.95, className: 'dealer-marker-tooltip' }
          );
          markersLayer.addLayer(marker);
          return;
        }

        const icon = L.divIcon({
          className: 'global-goods-marker',
          html: `
            <div class="dealer-marker-badge" style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, 0); display: flex; flex-direction: column; align-items: center; cursor: pointer;">
              <div style="
                background: ${volColor};
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 800;
                border: 2px solid white;
                box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
                white-space: nowrap;
                display: flex;
                align-items: center;
                gap: 4px;
              ">
                <span>📦 ${item.productName}</span>
                <span style="opacity: 0.8; font-size: 9px;">(${item.supplyVolume})</span>
              </div>
              <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid ${volColor};"></div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

        const marker = L.marker([item.lat, item.lng], { icon });
        marker.bindPopup(`
          <div style="padding: 4px; font-family: inherit;">
            <div style="font-weight: 800; font-size: 12px; color: ${volColor}; margin-bottom: 2px;">📦 ${item.productName}</div>
            <div style="font-size: 11px; font-weight: 600; color: #172C28;">Do‘kon: ${item.storeName}</div>
            <div style="font-size: 10px; color: #566A63;">Toifa: ${item.category}</div>
            <div style="font-size: 10px; color: #566A63;">Taqsimot hajmi: <strong>${item.supplyVolume}</strong></div>
            <div style="font-size: 10px; color: #566A63;">Oxirgi partiya: ${new Date(item.lastDistributedAt).toLocaleDateString()}</div>
          </div>
        `);
        markersLayer.addLayer(marker);
      });

      if (globalGoods.length > 0 && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [filteredStores, mapMode, globalGoods, selectedStoresForRoute, selectedStore, currentZoom]);

  // Draw OSRM route polyline
  useEffect(() => {
    const routeLayer = routeLayerRef.current;
    const map = mapInstanceRef.current;
    if (!routeLayer || !map) return;

    routeLayer.clearLayers();

    if (calculatedRoute && calculatedRoute.geometry && mapMode === 'crm') {
      const coordinates = calculatedRoute.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
      const polyline = L.polyline(coordinates, {
        color: '#116B50',
        weight: 5,
        opacity: 0.85,
        lineJoin: 'round'
      });
      routeLayer.addLayer(polyline);

      // Fit map to route
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }
  }, [calculatedRoute, mapMode]);

  // Handle region dropdown change: pan map
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const reg = e.target.value;
    setSelectedRegion(reg);
    setSelectedDistrict('Barcha tumanlar');

    const view = REGION_VIEWS[reg];
    if (view && mapInstanceRef.current) {
      mapInstanceRef.current.setView([view[0], view[1]], view[2], { animate: true });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Header Card (Matching User Screenshot) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center font-bold shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-[#172C28] dark:text-white">
              {t('map_header_title')}
            </h1>
            <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">
              {t('map_header_desc')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#F3F6F3] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#22332C]">
            <button
              onClick={() => setMapMode('crm')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mapMode === 'crm'
                  ? 'bg-white dark:bg-[#14201A] text-[#116B50] dark:text-[#4ADE80] shadow-sm'
                  : 'text-[#566A63] dark:text-[#8B9E95]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{t('map_mode_crm')}</span>
            </button>
            {allowExperimentalMap && (
              <button
                onClick={() => setMapMode('global')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  mapMode === 'global'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-purple-600 dark:text-purple-400'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{t('map_mode_global')}</span>
              </button>
            )}
          </div>

          {/* Click to add store button */}
          <button
            onClick={() => {
              setIsAddStoreMode(!isAddStoreMode);
              if (!isAddStoreMode) {
                setSelectedStore(null);
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              isAddStoreMode
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] text-[#172C28] dark:text-white hover:border-[#116B50]'
            }`}
          >
            <span className="text-red-500 font-bold">📍</span>
            <span>{isAddStoreMode ? t('map_btn_add_store_active') : t('map_btn_add_store')}</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar (Matching User Screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#566A63] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('map_search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
          />
        </div>

        {/* Region */}
        <div>
          <select
            value={selectedRegion}
            onChange={handleRegionChange}
            className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
          >
            {regionOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* District */}
        <div>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
          >
            {districtOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Debt Filter Pills & Route Controls */}
      {mapMode === 'crm' && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setDebtFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                debtFilter === 'ALL'
                  ? 'bg-[#172C28] text-white dark:bg-[#E8F2EC] dark:text-[#172C28] shadow-sm'
                  : 'bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95]'
              }`}
            >
              {t('filter_all_stores')} ({stores.length})
            </button>
            <button
              onClick={() => setDebtFilter('GREEN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                debtFilter === 'GREEN'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] text-emerald-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{t('filter_debt_green')} ({stores.filter((s) => s.debtStatus === 'GREEN').length})</span>
            </button>
            <button
              onClick={() => setDebtFilter('YELLOW')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                debtFilter === 'YELLOW'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] text-amber-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>{t('filter_debt_yellow')} ({stores.filter((s) => s.debtStatus === 'YELLOW').length})</span>
            </button>
            <button
              onClick={() => setDebtFilter('RED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                debtFilter === 'RED'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] text-rose-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>{t('filter_debt_red')} ({stores.filter((s) => s.debtStatus === 'RED').length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">
              {t('route_selected_label')} <strong>{selectedStoresForRoute.length}</strong> {t('route_selected_suffix')}
            </span>
            <Button
              variant="primary"
              size="sm"
              disabled={selectedStoresForRoute.length === 0 || isCalculatingRoute}
              onClick={onCalculateRoute}
              className="text-xs font-bold bg-[#116B50] hover:bg-[#0E5842] text-white flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{isCalculatingRoute ? t('btn_building_route') : t('btn_build_route')}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Calculated Route Info Banner */}
      {calculatedRoute && mapMode === 'crm' && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-3">
            <Navigation className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-extrabold">{t('route_banner_title')}</span>{' '}
              {t('route_distance')} <strong>{calculatedRoute.totalDistanceKm} km</strong> • {t('route_time')}:{' '}
              <strong>~{calculatedRoute.totalDurationMin} {t('route_minutes')}</strong> ({calculatedRoute.stopsCount} {t('route_stops')})
            </div>
          </div>
          <button
            onClick={onClearRoute}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
          >
            {t('btn_clear_route')}
          </button>
        </div>
      )}

      {/* Mobile Tab Switcher between Map and Store Menu */}
      <div className="lg:hidden flex items-center p-1 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl shadow-xs">
        <button
          type="button"
          onClick={() => setMobileMapTab('map')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileMapTab === 'map'
              ? 'bg-[#116B50] text-white shadow-sm'
              : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28]'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>{t('map_tab_map')}</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileMapTab('details')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            mobileMapTab === 'details'
              ? 'bg-[#116B50] text-white shadow-sm'
              : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>
            {selectedStore ? selectedStore.storeName : `${t('map_tab_stores')} (${filteredStores.length})`}
          </span>
          {selectedStore && (
            <span
              className={`w-2 h-2 rounded-full ${
                selectedStore.debtStatus === 'GREEN'
                  ? 'bg-emerald-400'
                  : selectedStore.debtStatus === 'YELLOW'
                  ? 'bg-amber-400'
                  : 'bg-rose-400 animate-pulse'
              }`}
            />
          )}
        </button>
      </div>

      {/* 4. Two-Column Layout: Left Menu (Store details & actions) + Right Map */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch min-h-[560px] lg:min-h-[640px]">
        {/* Left Sidebar / Menu */}
        <div
          className={`w-full lg:w-[380px] xl:w-[410px] shrink-0 bg-white dark:bg-[#14201A] rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex flex-col min-h-[460px] lg:min-h-[640px] overflow-hidden ${
            mobileMapTab === 'map' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {mapMode === 'crm' ? (
            selectedStore ? (
              /* Selected Store Details & Action Buttons */
              <div className="flex flex-col h-full">
                {/* Header with back button & close */}
                <div className="p-3.5 border-b border-[#DCE5DF] dark:border-[#22332C] bg-[#F9FAF9] dark:bg-[#182620] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedStore(null)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#566A63] dark:text-[#8B9E95] hover:text-[#116B50] transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{t('map_sidebar_back')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStore(null)}
                    className="p-1 rounded-lg text-[#566A63] hover:bg-gray-200 dark:hover:bg-gray-800 transition"
                    title={t('btn_close')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                  {/* Store Name & Debt Indicator */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ${
                          selectedStore.debtStatus === 'GREEN'
                            ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-950'
                            : selectedStore.debtStatus === 'YELLOW'
                            ? 'bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-950'
                            : 'bg-rose-500 ring-2 ring-rose-200 dark:ring-rose-950 animate-pulse'
                        }`}
                      />
                      <h3 className="font-black text-base text-[#172C28] dark:text-white leading-tight">
                        {selectedStore.storeName}
                      </h3>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          selectedStore.debtStatus === 'GREEN'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : selectedStore.debtStatus === 'YELLOW'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {selectedStore.debtStatus === 'GREEN'
                          ? t('map_legend_green')
                          : selectedStore.debtStatus === 'YELLOW'
                          ? t('map_legend_yellow')
                          : t('map_legend_red')}
                      </span>
                      {selectedStore.status && (
                        <span className="text-[11px] font-semibold text-[#566A63] dark:text-[#8B9E95]">
                          • {selectedStore.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Location & Contact Information */}
                  <div className="space-y-2 text-xs bg-[#F9FAF9] dark:bg-[#1A2822] p-3 rounded-xl border border-[#DCE5DF]/60 dark:border-[#22332C]/60">
                    <div className="flex items-start gap-2 text-[#172C28] dark:text-gray-200">
                      <MapPin className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80] shrink-0 mt-0.5" />
                      <span className="font-medium leading-relaxed">{selectedStore.storeAddress}</span>
                    </div>
                    {selectedStore.storePhone && (
                      <div className="flex items-center gap-2 pt-1.5 border-t border-[#DCE5DF]/40 dark:border-[#22332C]/40">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <a
                          href={`tel:${selectedStore.storePhone.replace(/\s+/g, '')}`}
                          className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          {selectedStore.storePhone}
                        </a>
                      </div>
                    )}
                    {selectedStore.storeInn && (
                      <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] pt-0.5">
                        {t('map_sidebar_tin')} <strong className="font-mono text-[#172C28] dark:text-white">{selectedStore.storeInn}</strong>
                      </div>
                    )}
                    {selectedStore.lastSupplyDate && (
                      <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                        {t('map_sidebar_last_supply')} <strong>{selectedStore.lastSupplyDate}</strong>
                      </div>
                    )}
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50">
                      <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold block uppercase tracking-wider">
                        {t('map_sidebar_current_debt')}
                      </span>
                      <span className="font-black text-sm text-amber-900 dark:text-amber-200 mt-0.5 block">
                        {selectedStore.currentDebtBalance.toLocaleString()} {t('currency')}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F9FAF9] dark:bg-[#1A2822] border border-[#DCE5DF]/60 dark:border-[#22332C]/60">
                      <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] font-bold block uppercase tracking-wider">
                        {t('map_sidebar_credit_limit')}
                      </span>
                      <span className="font-black text-sm text-[#172C28] dark:text-white mt-0.5 block">
                        {selectedStore.creditLimit.toLocaleString()} {t('currency')}
                      </span>
                    </div>
                  </div>

                  {/* Route & Map Quick Actions */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/50 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-[#116B50] dark:text-[#4ADE80]">
                      <input
                        type="checkbox"
                        checked={selectedStoresForRoute.includes(selectedStore.storeId)}
                        onChange={() => {
                          const isSel = selectedStoresForRoute.includes(selectedStore.storeId);
                          setSelectedStoresForRoute((prev) =>
                            isSel ? prev.filter((id) => id !== selectedStore.storeId) : [...prev, selectedStore.storeId]
                          );
                        }}
                        className="w-4 h-4 rounded text-[#116B50] accent-[#116B50]"
                      />
                      <span>{t('map_sidebar_add_to_route')}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        mapInstanceRef.current?.flyTo([selectedStore.lat, selectedStore.lng], 16, { animate: true });
                        if (window.innerWidth < 1024) setMobileMapTab('map');
                      }}
                      className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>{t('map_sidebar_center')}</span>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-[#DCE5DF] dark:border-[#22332C]">
                    <div className="text-[11px] font-black uppercase tracking-wider text-[#566A63] dark:text-[#8B9E95]">
                      {t('map_sidebar_actions_title')}
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => onOpenSupply(selectedStore)}
                      className="w-full py-2.5 bg-[#116B50] hover:bg-[#0E5842] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{t('map_sidebar_supply_btn')}</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onOpenPayment(selectedStore)}
                      className="w-full py-2.5 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>{t('map_sidebar_payment_btn')}</span>
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => onOpenAktSverka(selectedStore)}
                        className="py-2 border-[#DCE5DF] dark:border-[#22332C] text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{t('map_sidebar_akt_sverka_btn')}</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onOpenReturn(selectedStore)}
                        className="py-2 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t('map_sidebar_return_btn')}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* No Store Selected: Show Stores Directory List */
              <div className="flex flex-col h-full">
                <div className="p-3.5 border-b border-[#DCE5DF] dark:border-[#22332C] bg-[#F9FAF9] dark:bg-[#182620]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                      <h4 className="font-extrabold text-xs text-[#172C28] dark:text-white">
                        {t('map_sidebar_title')}
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {filteredStores.length} {t('items_count')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1 leading-normal">
                    {t('map_sidebar_hint')}
                  </p>
                </div>

                <div className="p-3 flex-1 overflow-y-auto space-y-2">
                  {filteredStores.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#566A63] dark:text-[#8B9E95]">
                      {t('map_no_stores')}
                    </div>
                  ) : (
                    filteredStores.map((store) => {
                      const isRouteStop = selectedStoresForRoute.includes(store.storeId);
                      return (
                        <div
                          key={store.id}
                          onClick={() => {
                            setSelectedStore(store);
                            mapInstanceRef.current?.flyTo([store.lat, store.lng], 16, { animate: true });
                          }}
                          className="p-3 rounded-xl border border-[#DCE5DF] dark:border-[#22332C] bg-white dark:bg-[#14201A] hover:border-[#116B50] hover:bg-emerald-50/40 dark:hover:bg-[#1A2822] cursor-pointer transition shadow-xs group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  store.debtStatus === 'GREEN'
                                    ? 'bg-emerald-500'
                                    : store.debtStatus === 'YELLOW'
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                              <span className="font-bold text-xs text-[#172C28] dark:text-white truncate group-hover:text-[#116B50] transition">
                                {store.storeName}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#566A63] group-hover:text-[#116B50] group-hover:translate-x-0.5 shrink-0 transition" />
                          </div>
                          <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] truncate mt-1 pl-4.5">
                            📍 {store.storeAddress}
                          </div>
                          <div className="mt-2 pl-4.5 flex items-center justify-between text-[11px]">
                            <span className="text-[#566A63] dark:text-[#8B9E95]">
                              {t('debt_short')}{' '}
                              <strong
                                className={
                                  store.currentDebtBalance > 0
                                    ? 'text-amber-600 dark:text-amber-400 font-bold'
                                    : 'text-emerald-600 dark:text-emerald-400 font-bold'
                                }
                              >
                                {store.currentDebtBalance.toLocaleString()} {t('currency')}
                              </strong>
                            </span>
                            {isRouteStop && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                {t('map_in_route')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )
          ) : (
            /* Global Map Mode Left Menu */
            <div className="flex flex-col h-full">
              <div className="p-3.5 border-b border-[#DCE5DF] dark:border-[#22332C] bg-purple-50/50 dark:bg-purple-950/20">
                <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-bold text-xs">
                  <Globe className="w-4 h-4" />
                  <span>{t('map_global_title')}</span>
                </div>
                <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                  {t('map_global_desc')} ({globalGoods.length} {t('items_count')}).
                </p>
              </div>
              <div className="p-3 flex-1 overflow-y-auto space-y-2">
                {globalGoods.map((point, idx) => (
                  <div
                    key={`${point.storeId}-${idx}`}
                    onClick={() => {
                      mapInstanceRef.current?.flyTo([point.lat, point.lng], 16, { animate: true });
                    }}
                    className="p-3 rounded-xl border border-[#DCE5DF] dark:border-[#22332C] hover:border-purple-400 cursor-pointer transition text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#172C28] dark:text-white">
                        {point.productName}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          point.supplyVolume === 'HIGH'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : point.supplyVolume === 'MEDIUM'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {point.supplyVolume}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                      {t('th_prod_category')}: {point.category} • {point.storeAddress}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Leaflet Interactive Map */}
        <div
          className={`flex-1 min-w-0 rounded-2xl overflow-hidden border border-[#DCE5DF] dark:border-[#22332C] relative shadow-lg isolate z-0 h-[480px] lg:h-auto min-h-[480px] lg:min-h-[640px] ${
            mobileMapTab === 'details' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div ref={mapContainerRef} className="w-full h-full min-h-[480px] lg:min-h-[640px]" />

          {/* Mobile Legend Pill */}
          <div className="md:hidden absolute top-3 right-3 z-10">
            <button
              type="button"
              onClick={() => setShowMobileLegend(!showMobileLegend)}
              className="px-2.5 py-1.5 rounded-xl bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md border border-[#DCE5DF] dark:border-[#22332C] shadow-md text-[11px] font-bold text-[#172C28] dark:text-white flex items-center gap-1 active:scale-95"
            >
              <span>ℹ️ {t('map_legend_title')}</span>
            </button>
          </div>

          {/* Legend Overlay Card */}
          <div
            className={`${
              showMobileLegend ? 'block' : 'hidden md:block'
            } absolute top-12 md:top-3 right-3 z-10 p-3 rounded-2xl bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md border border-[#DCE5DF] dark:border-[#22332C] shadow-xl text-xs max-w-[210px] animate-in fade-in zoom-in-95`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-extrabold text-[#172C28] dark:text-white text-xs">
                {t('map_legend_title')}
              </h4>
              <button
                onClick={() => setShowMobileLegend(false)}
                className="md:hidden p-0.5 text-[#566A63] hover:text-[#172C28]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {mapMode === 'crm' ? (
              <div className="flex flex-col gap-1.5 text-[11px]">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shrink-0"></span>
                  <span className="font-semibold">{t('map_legend_green')}</span>
                </div>
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shrink-0"></span>
                  <span className="font-semibold">{t('map_legend_yellow')}</span>
                </div>
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shrink-0"></span>
                  <span className="font-semibold">{t('map_legend_red')}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 text-[11px]">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                  <span className="w-3 h-3 rounded-full bg-purple-600 shadow-sm shrink-0"></span>
                  <span className="font-semibold">{t('map_legend_high')}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shrink-0"></span>
                  <span className="font-semibold">{t('map_legend_medium')}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shrink-0"></span>
                  <span className="font-semibold">{t('map_legend_low')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Bottom Mini Preview (shown on map tab when store is selected) */}
          {selectedStore && mapMode === 'crm' && (
            <div className="lg:hidden absolute bottom-3 left-3 right-3 z-10 p-3 rounded-2xl bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md border border-[#DCE5DF] dark:border-[#22332C] shadow-2xl flex items-center justify-between gap-2 animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    selectedStore.debtStatus === 'GREEN'
                      ? 'bg-emerald-500'
                      : selectedStore.debtStatus === 'YELLOW'
                      ? 'bg-amber-500'
                      : 'bg-rose-500 animate-pulse'
                  }`}
                />
                <div className="truncate">
                  <div className="font-black text-xs text-[#172C28] dark:text-white truncate">
                    {selectedStore.storeName}
                  </div>
                  <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] truncate">
                    {t('debt_short')} {selectedStore.currentDebtBalance.toLocaleString()} {t('currency')}
                  </div>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setMobileMapTab('details')}
                className="text-xs font-bold py-1.5 px-3 bg-[#116B50] hover:bg-[#0E5842] text-white shrink-0"
              >
                {t('map_tab_actions')} →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
