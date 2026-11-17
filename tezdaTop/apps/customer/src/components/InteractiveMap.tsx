import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { StoreSearchResult, RouteResponse, Store } from '@yaqintop/contracts';
import { UZBEKISTAN_REGIONS } from '@yaqintop/ui';
import { getProductThumbnail, DEFAULT_PRODUCT_THUMBNAIL } from '../utils/product-thumbnails';
import { Navigation, MapPin, Maximize2, Store as StoreIcon, Crosshair, CircleDot, XCircle, X, ExternalLink } from 'lucide-react';
import { loadMapCatalog, getMemoryCachedCatalog } from '../utils/map-cache';
import uzumMapLogo from '../assets/uzum/map-logo.png';

const korzinkaMark = '<span style="color: white; font-weight: 900; line-height: 1;">K</span>';
const uzumMark = (size: number) => `<img src="${uzumMapLogo}" alt="" style="display: block; width: ${size}px; height: ${size}px; flex: none; border-radius: 50%;">`;

export interface NearbyStoreItem {
  store: Store;
  organization?: any;
  distanceM: number;
  isOpenNow: boolean;
  offersCount?: number;
}

export const getStoreLatLng = (store?: any): [number, number] | null => {
  if (!store) return null;
  const lat = store.location?.lat ?? store.latitude ?? store.lat;
  const lng = store.location?.lng ?? store.longitude ?? store.lng;
  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    return [lat, lng];
  }
  return null;
};

// Filter points strictly by selected region and district (matching regular stores)
const matchesLocationFilter = (
  item: any,
  selectedRegion?: string,
  selectedDistrict?: string,
  userLoc?: { lat: number; lng: number }
): boolean => {
  if (!selectedRegion || selectedRegion === 'Barcha viloyatlar') return true;

  const norm = (s?: string) =>
    (s || '')
      .toLowerCase()
      .replace(/[ʻʼ`']/g, '')
      .replace(/viloyati|shahri|tumani|sh\.|t\./gi, '')
      .trim();

  const regNeedle = norm(selectedRegion);
  const distNeedle = norm(selectedDistrict);
  const itemRegion = norm(item.region);
  const itemCity = norm(item.city);
  const itemAddr = norm(item.address);
  const itemName = norm(item.name);

  // Check region match (e.g. Sirdaryo, Toshkent, Samarqand)
  let regionMatches =
    itemRegion.includes(regNeedle) ||
    regNeedle.includes(itemRegion) ||
    itemCity.includes(regNeedle) ||
    regNeedle.includes(itemCity) ||
    itemAddr.includes(regNeedle);

  // If not matched directly, check if item's city/district belongs to selected region via UZBEKISTAN_REGIONS
  if (!regionMatches) {
    const regData = UZBEKISTAN_REGIONS.find(
      (r) => norm(r.name) === regNeedle || regNeedle.includes(norm(r.name))
    );
    if (regData && regData.districts) {
      regionMatches = regData.districts.some((d: any) => {
        const dNorm = norm(typeof d === 'string' ? d : d.name);
        return (
          dNorm &&
          (itemRegion.includes(dNorm) ||
            itemCity.includes(dNorm) ||
            itemAddr.includes(dNorm) ||
            itemName.includes(dNorm))
        );
      });
    }
  }

  if (!regionMatches) {
    if (userLoc && item.location?.lat && item.location?.lng) {
      const dLat = (item.location.lat - userLoc.lat) * 111;
      const dLng = (item.location.lng - userLoc.lng) * 111 * Math.cos((userLoc.lat * Math.PI) / 180);
      const distKm = Math.sqrt(dLat * dLat + dLng * dLng);
      if (distKm > 45) return false;
    } else {
      return false;
    }
  }

  // If a specific district is chosen (and not 'Barcha tumanlar' or 'Viloyat markazi')
  if (distNeedle && distNeedle !== 'barcha tumanlar' && distNeedle !== 'viloyat markazi') {
    const districtMatches =
      itemCity.includes(distNeedle) ||
      distNeedle.includes(itemCity) ||
      itemAddr.includes(distNeedle) ||
      norm(item.name).includes(distNeedle);

    if (!districtMatches) {
      if (userLoc && item.location?.lat && item.location?.lng) {
        const dLat = (item.location.lat - userLoc.lat) * 111;
        const dLng = (item.location.lng - userLoc.lng) * 111 * Math.cos((userLoc.lat * Math.PI) / 180);
        const distKm = Math.sqrt(dLat * dLat + dLng * dLng);
        return distKm <= 12;
      }
      return false;
    }
  }

  return true;
};

// Map POI theme matching Google Maps / Yandex Maps styling (Icon Disc + Name label underneath)
export function getPoiTheme(item: any, isDarkMode = false) {
  const type = String(item?.type || item?.organization?.type || item?.category || '').toUpperCase();
  const name = String(item?.name || item?.organization?.name || item?.store?.name || 'Tashkilot').trim();
  const lower = (name + ' ' + (item?.description || '')).toLowerCase();

  if (lower.includes('korzinka') || lower.includes('корзинка') || item?.id?.startsWith('korzinka-')) {
    return {
      category: 'KORZINKA',
      icon: korzinkaMark,
      color: isDarkMode ? '#F87171' : '#E31E24',
      discBg: '#E31E24',
      discBorder: isDarkMode ? '#FDA4AF' : '#FFFFFF',
      shadow: 'rgba(227, 30, 36, 0.45)'
    };
  }

  // 0. Korzinka Supermarkets
  if (lower.includes('korzinka') || type === 'SUPERMARKET') {
    return {
      category: 'SUPERMARKET',
      icon: '🛒',
      color: isDarkMode ? '#F87171' : '#E31E24',
      discBg: isDarkMode ? '#3B0709' : '#FEF2F2',
      discBorder: isDarkMode ? '#EF4444' : '#E31E24',
      shadow: 'rgba(227, 30, 36, 0.45)'
    };
  }

  // Sartaroshxona also contains "oshxona", so check the salon category first.
  if (
    type === 'BEAUTY_SALON' ||
    lower.includes('salon') ||
    lower.includes('sartarosh') ||
    lower.includes('barber') ||
    lower.includes('go‘zallik') ||
    lower.includes('beauty')
  ) {
    return {
      category: 'BEAUTY_SALON',
      icon: '✂️',
      color: isDarkMode ? '#C084FC' : '#9333EA',
      discBg: isDarkMode ? '#3B0764' : '#FAF5FF',
      discBorder: isDarkMode ? '#A855F7' : '#D8B4FE',
      shadow: 'rgba(147, 51, 234, 0.45)'
    };
  }

  // 1. Game Club / PlayStation
  if (
    type === 'GAME_CLUB' ||
    item?.id?.startsWith('gameclub-') ||
    item?.store?.id?.startsWith('gameclub-') ||
    lower.includes('game club') ||
    lower.includes('playstation') ||
    lower.includes('ps4') ||
    lower.includes('ps5') ||
    lower.includes('cybersport')
  ) {
    return {
      category: 'GAME_CLUB',
      icon: '🎮',
      color: isDarkMode ? '#38BDF8' : '#0284C7',
      discBg: isDarkMode ? '#082F49' : '#F0F9FF',
      discBorder: isDarkMode ? '#0284C7' : '#38BDF8',
      shadow: 'rgba(2, 132, 199, 0.45)'
    };
  }

  // 2. Food, Cafe, Restaurant, Fast Food, Bakery, Coffee (e.g. Ikbolaxon, Bon!, Oshxona, Kafe)
  if (
    type === 'RESTAURANT' ||
    lower.includes('kafe') ||
    lower.includes('cafe') ||
    lower.includes('restoran') ||
    lower.includes('oshxona') ||
    lower.includes('taom') ||
    lower.includes('lavash') ||
    lower.includes('burger') ||
    lower.includes('pizza') ||
    lower.includes('shashlik') ||
    lower.includes('somsa') ||
    lower.includes('choyxona') ||
    lower.includes('coffee') ||
    lower.includes('qahva') ||
    lower.includes('bon!') ||
    lower.includes('ikbolaxon')
  ) {
    return {
      category: 'FOOD',
      icon: '🍽️',
      color: isDarkMode ? '#FB923C' : '#C2410C',
      discBg: isDarkMode ? '#431407' : '#FFF7ED',
      discBorder: isDarkMode ? '#EA580C' : '#FDBA74',
      shadow: 'rgba(194, 65, 12, 0.45)'
    };
  }

  // 3. Pharmacy, Clinic, Dental, Medicine (e.g. Ultradent, Orom Dorixona, Apteka)
  if (
    type === 'PHARMACY' ||
    lower.includes('apteka') ||
    lower.includes('dorixona') ||
    lower.includes('dent') ||
    lower.includes('stomatolog') ||
    lower.includes('klinika') ||
    lower.includes('tibbiyot') ||
    lower.includes('med') ||
    lower.includes('shifo') ||
    lower.includes('ultradent')
  ) {
    return {
      category: 'PHARMACY',
      icon: '💊',
      color: isDarkMode ? '#F87171' : '#DC2626',
      discBg: isDarkMode ? '#450A0A' : '#FEF2F2',
      discBorder: isDarkMode ? '#EF4444' : '#FCA5A5',
      shadow: 'rgba(220, 38, 38, 0.45)'
    };
  }

  // 4. Retail, Supermarket, Market, Clothes, Boutique (e.g. Navbahor Market, Yasin collection)
  if (
    type === 'RETAIL' ||
    lower.includes('market') ||
    lower.includes('supermarket') ||
    lower.includes('minimarket') ||
    lower.includes('do‘kon') ||
    lower.includes('dokon') ||
    lower.includes('savdo') ||
    lower.includes('collection') ||
    lower.includes('bazar') ||
    lower.includes('bozor') ||
    lower.includes('kiyim') ||
    lower.includes('boutique') ||
    lower.includes('magazin')
  ) {
    return {
      category: 'RETAIL',
      icon: '🛍️',
      color: isDarkMode ? '#4ADE80' : '#15803D',
      discBg: isDarkMode ? '#052E16' : '#F0FDF4',
      discBorder: isDarkMode ? '#22C55E' : '#86EFAC',
      shadow: 'rgba(21, 128, 61, 0.45)'
    };
  }

  // 5. Gas / Electric Charging (e.g. Uz90, Zapravka)
  if (
    type === 'GAS_STATION' ||
    lower.includes('zapravka') ||
    lower.includes('gaz') ||
    lower.includes('petrol') ||
    lower.includes('zaryad') ||
    lower.includes('uz90') ||
    lower.includes('charger')
  ) {
    return {
      category: 'GAS_STATION',
      icon: '⚡',
      color: isDarkMode ? '#2DD4BF' : '#0D9488',
      discBg: isDarkMode ? '#042F2E' : '#F0FDFA',
      discBorder: isDarkMode ? '#14B8A6' : '#5EEAD4',
      shadow: 'rgba(13, 148, 136, 0.45)'
    };
  }

  // 7. Auto Service, Repair, Parts, Car wash
  if (
    type === 'AUTO_SERVICE' ||
    lower.includes('avto') ||
    lower.includes('ustaxona') ||
    lower.includes('moy') ||
    lower.includes('tuning') ||
    lower.includes('remont') ||
    lower.includes('moylash') ||
    lower.includes('avtomoyka')
  ) {
    return {
      category: 'AUTO_SERVICE',
      icon: '🚗',
      color: isDarkMode ? '#60A5FA' : '#2563EB',
      discBg: isDarkMode ? '#172554' : '#EFF6FF',
      discBorder: isDarkMode ? '#3B82F6' : '#93C5FD',
      shadow: 'rgba(37, 99, 235, 0.45)'
    };
  }

  // 8. Education, Schools, Courses, University
  if (
    type === 'EDUCATION' ||
    lower.includes('maktab') ||
    lower.includes('kurs') ||
    lower.includes('markaz') ||
    lower.includes('academy') ||
    lower.includes('universitet') ||
    lower.includes('litsey') ||
    lower.includes('bog‘cha')
  ) {
    return {
      category: 'EDUCATION',
      icon: '🎓',
      color: isDarkMode ? '#818CF8' : '#4F46E5',
      discBg: isDarkMode ? '#1E1B4B' : '#EEF2FF',
      discBorder: isDarkMode ? '#6366F1' : '#A5B4FC',
      shadow: 'rgba(79, 70, 229, 0.45)'
    };
  }

  // 9. Organizations, Offices, State bodies, Enterprises (e.g. O'zbekgidroenergo, Matbuot, Texno-soft, Tashkilot)
  return {
    category: 'ORGANIZATION',
    icon: '🔷',
    color: isDarkMode ? '#38BDF8' : '#0369A1',
    discBg: isDarkMode ? '#082F49' : '#F0F9FF',
    discBorder: isDarkMode ? '#0284C7' : '#38BDF8',
    shadow: 'rgba(3, 105, 161, 0.45)'
  };
}

interface InteractiveMapProps {
  userLocation: { lat: number; lng: number };
  radiusM: number;
  results: StoreSearchResult[];
  nearbyStores?: NearbyStoreItem[];
  selectedResult: StoreSearchResult | null;
  selectedNearbyStore?: NearbyStoreItem | null;
  onSelectStore: (store: StoreSearchResult) => void;
  onSelectNearbyStore?: (store: NearbyStoreItem) => void;
  onOpenDetail: (store: StoreSearchResult) => void;
  onOpenNearbyDetail?: (store: NearbyStoreItem) => void;
  onNavigate: (store: StoreSearchResult | { store: any; distanceM?: number }) => void;
  onCancelRoute?: () => void;
  routeData: RouteResponse | null;
  routeTargetName?: string;
  routeTargetAddress?: string;
  routeMode?: 'walking' | 'driving';
  onChangeRouteMode?: (mode: 'walking' | 'driving') => void;
  view: 'search' | 'detail' | 'route' | 'saved' | 'profile' | 'products' | 'product-detail';
  onOpenProduct?: (variant: any) => void;
  onOpenProductModal?: (item: StoreSearchResult) => void;
  isDarkMode?: boolean;
  locationName?: string;
  userRegion?: string;
  userDistrict?: string;
  onLocationChange?: (lat: number, lng: number) => void;
  onToast?: (msg: string) => void;
  recenterTrigger?: number;
}

type PlacePopupActions = Pick<InteractiveMapProps, 'onOpenNearbyDetail' | 'onNavigate' | 'onSelectNearbyStore'>;

function bindPlacePopup(marker: L.Marker, html: string, item: NearbyStoreItem, actions: { current: PlacePopupActions }) {
  const content = document.createElement('div');
  content.innerHTML = html;
  content.querySelector('[data-popup-action="detail"]')?.addEventListener('click', (event) => {
    event.stopPropagation();
    actions.current.onOpenNearbyDetail?.(item);
  });
  content.querySelector('[data-popup-action="route"]')?.addEventListener('click', (event) => {
    event.stopPropagation();
    actions.current.onNavigate({ store: item.store, distanceM: item.distanceM });
  });
  marker.bindPopup(content, { offset: [0, -18], autoPan: false });
  marker.on('popupopen', () => {
    actions.current.onSelectNearbyStore?.(item);
  });
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  userLocation,
  radiusM,
  results,
  nearbyStores = [],
  selectedResult,
  selectedNearbyStore,
  onSelectStore,
  onSelectNearbyStore,
  onOpenDetail,
  onOpenNearbyDetail,
  onOpenProduct,
  onOpenProductModal,
  onNavigate,
  onCancelRoute,
  routeData,
  routeTargetName,
  routeTargetAddress,
  routeMode = 'walking',
  onChangeRouteMode,
  view,
  isDarkMode = false,
  locationName,
  userRegion,
  userDistrict,
  onLocationChange,
  onToast,
  recenterTrigger
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const uzumMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const gameClubsMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const korzinkaMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const prevRadiusRef = useRef<number>(radiusM);
  const prevLocRef = useRef<{ lat: number; lng: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(15);
  const [uzumPoints, setUzumPoints] = useState<any[]>(() => getMemoryCachedCatalog('uzum') || []);
  const [showUzumPoints, setShowUzumPoints] = useState<boolean>(true);
  const [gameClubs, setGameClubs] = useState<any[]>(() => getMemoryCachedCatalog('gameClubs') || []);
  const [showGameClubs, setShowGameClubs] = useState<boolean>(true);
  const [korzinkaStores, setKorzinkaStores] = useState<any[]>(() => getMemoryCachedCatalog('korzinka') || []);
  const [showKorzinka, setShowKorzinka] = useState<boolean>(true);
  const [showPharmacies, setShowPharmacies] = useState<boolean>(true);
  const [mapViewportKey, setMapViewportKey] = useState<number>(0);
  const uzumPointsRef = useRef<any[]>([]);
  const gameClubsRef = useRef<any[]>([]);
  const korzinkaStoresRef = useRef<any[]>([]);
  const popupActions = useRef({ onOpenNearbyDetail, onNavigate, onSelectNearbyStore });

  useEffect(() => {
    popupActions.current = { onOpenNearbyDetail, onNavigate, onSelectNearbyStore };
  }, [onOpenNearbyDetail, onNavigate, onSelectNearbyStore]);

  useEffect(() => {
    uzumPointsRef.current = uzumPoints;
  }, [uzumPoints]);

  useEffect(() => {
    gameClubsRef.current = gameClubs;
  }, [gameClubs]);

  useEffect(() => {
    korzinkaStoresRef.current = korzinkaStores;
  }, [korzinkaStores]);

  useEffect(() => {
    let active = true;
    const catalogs = [
      ['uzum', setUzumPoints],
      ['gameClubs', setGameClubs],
      ['korzinka', setKorzinkaStores],
    ] as const;
    for (const [catalog, setItems] of catalogs) {
      void loadMapCatalog(catalog).then(items => {
        if (active) setItems(items);
      }).catch(error => console.warn(error.message));
    }
    return () => { active = false; };
  }, []);

  // Filter Uzum Points, Game Clubs & Korzinka Supermarkets strictly to user's selected region and district (matching normal stores)
  const activeUzumInRegion = useMemo(() => {
    return uzumPoints.filter((p) => matchesLocationFilter(p, userRegion, userDistrict, userLocation));
  }, [uzumPoints, userRegion, userDistrict, userLocation]);

  const activeClubsInRegion = useMemo(() => {
    return gameClubs.filter((c) => matchesLocationFilter(c, userRegion, userDistrict, userLocation));
  }, [gameClubs, userRegion, userDistrict, userLocation]);

  const activeKorzinkaInRegion = useMemo(() => {
    return korzinkaStores.filter((k) => matchesLocationFilter(k, userRegion, userDistrict, userLocation));
  }, [korzinkaStores, userRegion, userDistrict, userLocation]);

  // Global handlers for Leaflet popups
  useEffect(() => {
    (window as any).__yaqintop_open_nearby_detail = (storeId: string) => {
      const item = nearbyStores.find((s) => s.store.id === storeId);
      if (item && onOpenNearbyDetail) {
        onOpenNearbyDetail(item);
        return;
      }
      const clubsList = gameClubsRef.current.length > 0 ? gameClubsRef.current : gameClubs;
      const club = clubsList.find((c) => c.id === storeId);
      if (club && onOpenNearbyDetail) {
        onOpenNearbyDetail({
          store: club,
          organization: { name: club.name || club.organizationName || 'Game Club', type: 'GAME_CLUB' },
          distanceM: 0,
          isOpenNow: true,
          offersCount: 6
        });
        return;
      }
      const pointsList = uzumPointsRef.current.length > 0 ? uzumPointsRef.current : uzumPoints;
      const uzum = pointsList.find((u) => u.id === storeId);
      if (uzum && onOpenNearbyDetail) {
        onOpenNearbyDetail({
          store: uzum,
          organization: { name: uzum.organizationName, type: 'RETAIL' },
          distanceM: 0,
          isOpenNow: true,
          offersCount: 2
        });
        return;
      }
      const korzinkaList = korzinkaStoresRef.current.length > 0 ? korzinkaStoresRef.current : korzinkaStores;
      const korzinka = korzinkaList.find((k) => k.id === storeId || String(k.originalId) === storeId);
      if (korzinka && onOpenNearbyDetail) {
        onOpenNearbyDetail({
          store: korzinka,
          organization: { name: korzinka.organizationName || 'Korzinka', type: 'SUPERMARKET' },
          distanceM: 0,
          isOpenNow: true,
          offersCount: 269
        });
        return;
      }
      // Fallback for direct click if data not yet in memory
      if (storeId.startsWith('gameclub-') && onOpenNearbyDetail) {
        loadMapCatalog('gameClubs')
          .then((clubs: any[]) => {
            const found = clubs.find(c => c.id === storeId);
            if (found) {
              onOpenNearbyDetail({
                store: found,
                organization: { name: found.name || found.organizationName || 'Game Club', type: 'GAME_CLUB' },
                distanceM: 0,
                isOpenNow: true,
                offersCount: 6
              });
            }
          })
          .catch(console.error);
      }
    };
    (window as any).__yaqintop_route_nearby = (storeId: string) => {
      const item = nearbyStores.find((s) => s.store.id === storeId);
      if (item && onNavigate) {
        onNavigate({ store: item.store, distanceM: item.distanceM || 0 });
        return;
      }
      const pointsList = uzumPointsRef.current.length > 0 ? uzumPointsRef.current : uzumPoints;
      const uzumItem = pointsList.find((u) => u.id === storeId);
      if (uzumItem && onNavigate) {
        onNavigate({ store: uzumItem, distanceM: 0 });
        return;
      }
      const clubsList = gameClubsRef.current.length > 0 ? gameClubsRef.current : gameClubs;
      const clubItem = clubsList.find((c) => c.id === storeId);
      if (clubItem && onNavigate) {
        onNavigate({ store: clubItem, distanceM: 0 });
        return;
      }
      const korzinkaList = korzinkaStoresRef.current.length > 0 ? korzinkaStoresRef.current : korzinkaStores;
      const korzinkaItem = korzinkaList.find((k) => k.id === storeId || String(k.originalId) === storeId);
      if (korzinkaItem && onNavigate) {
        onNavigate({ store: korzinkaItem, distanceM: 0 });
      }
    };
    (window as any).__yaqintop_open_result_detail = (storeId: string) => {
      const item = results.find((s) => s.store.id === storeId);
      if (item && onOpenDetail) {
        onOpenDetail(item);
      }
    };
    (window as any).__yaqintop_route_result = (storeId: string) => {
      const item = results.find((s) => s.store.id === storeId);
      if (item && onNavigate) {
        onNavigate(item);
      }
    };
    (window as any).__yaqintop_open_product_modal = (storeId: string) => {
      const item = results.find((s) => s.store.id === storeId);
      if (item && onOpenProductModal) {
        onOpenProductModal(item);
      } else if (item && onOpenProduct) {
        onOpenProduct(item.bestOffer?.variant?.id || item.bestOffer?.variant?.sku || '');
      }
    };

    return () => {
      delete (window as any).__yaqintop_open_nearby_detail;
      delete (window as any).__yaqintop_route_nearby;
      delete (window as any).__yaqintop_open_result_detail;
      delete (window as any).__yaqintop_route_result;
      delete (window as any).__yaqintop_open_product_modal;
    };
  }, [nearbyStores, results, uzumPoints, gameClubs, onOpenNearbyDetail, onOpenDetail, onNavigate, onOpenProductModal, onOpenProduct]);

  const [mapReady, setMapReady] = useState(false);

  const userLat = userLocation?.lat ?? 41.311081;
  const userLng = userLocation?.lng ?? 69.240562;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Clear any dangling leaflet id from strict mode remounts
    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    let map: L.Map;
    try {
      map = L.map(mapContainerRef.current, {
        center: [userLat, userLng],
        zoom: isMobile ? 16 : 15,
        zoomControl: false
      });

      // Fast, resilient OpenStreetMap tiles with keepBuffer & fast update settings
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
        keepBuffer: 12,
        updateWhenIdle: false,
        updateInterval: 100,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        crossOrigin: true
      }).addTo(map);

      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });
      setCurrentZoom(map.getZoom());

      map.on('click', () => {
        if (window.innerWidth < 768) {
          onSelectNearbyStore?.(null as any);
        }
      });

      const markersLayer = L.layerGroup().addTo(map);
      const routeMarkersLayer = L.layerGroup().addTo(map);
      const uzumMarkersLayer = L.layerGroup().addTo(map);
      const gameClubsMarkersLayer = L.layerGroup().addTo(map);
      const korzinkaMarkersLayer = L.layerGroup().addTo(map);

      map.on('moveend', () => {
        setMapViewportKey((k) => k + 1);
      });

      markersLayerRef.current = markersLayer;
      routeMarkersLayerRef.current = routeMarkersLayer;
      uzumMarkersLayerRef.current = uzumMarkersLayer;
      gameClubsMarkersLayerRef.current = gameClubsMarkersLayer;
      korzinkaMarkersLayerRef.current = korzinkaMarkersLayer;
      mapInstanceRef.current = map;
      setMapReady(true);
    } catch (err) {
      console.error('Leaflet map creation failed:', err);
      return;
    }

    // Force size recalculations to guarantee full coverage
    const timer1 = setTimeout(() => map.invalidateSize(), 50);
    const timer2 = setTimeout(() => map.invalidateSize(), 250);
    const timer3 = setTimeout(() => map.invalidateSize(), 600);

    const resizeObserver = new ResizeObserver(() => {
      try {
        map.invalidateSize();
      } catch {}
    });
    resizeObserver.observe(mapContainerRef.current);

    const handleWindowResize = () => {
      try {
        map.invalidateSize();
      } catch {}
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', handleWindowResize);
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      userMarkerRef.current = null;
      radiusCircleRef.current = null;
      routePolylineRef.current = null;
      tileLayerRef.current = null;
      uzumMarkersLayerRef.current = null;
      gameClubsMarkersLayerRef.current = null;
      korzinkaMarkersLayerRef.current = null;
      setMapReady(false);
    };
  }, []);


  // Whenever view or results count change, re-invalidate map size (without moving view)
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        try {
          mapInstanceRef.current?.invalidateSize({ pan: false });
        } catch {}
      }, 50);
    }
  }, [view, results.length, mapReady]);

  // Update User Location and Radius Circle (Red Dot + Search Area)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    try {
      // Red Dot (Qizil nuqta) with subtle pulsating radar effect
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

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        userMarkerRef.current.setIcon(userIcon);
      } else {
        const marker = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000
        }).addTo(map);

        marker.bindPopup(`
          <div style="text-align: center; padding: 4px; font-family: system-ui, sans-serif;">
            <strong style="font-size: 13px; color: ${isDarkMode ? '#E8F2EC' : '#172C28'}; display: block;">Siz turgan joy (Qizil nuqta)</strong>
            <span style="font-size: 11px; color: ${isDarkMode ? '#8B9E95' : '#566A63'};">Qidiruv markazi</span>
          </div>
        `);

        userMarkerRef.current = marker;
      }

      // Radius circle (Qidiruv maydoni chegarasi va ichki chiroyli nozik rangi)
      const strokeColor = isDarkMode ? '#4ADE80' : '#10B981';
      const fillColor = isDarkMode ? '#22C55E' : '#10B981';
      const fillOpacity = isDarkMode ? 0.16 : 0.11;

      if (radiusCircleRef.current) {
        radiusCircleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        radiusCircleRef.current.setRadius(radiusM);
        radiusCircleRef.current.setStyle({
          color: strokeColor,
          weight: 2,
          opacity: 0.85,
          dashArray: '6, 6',
          fill: true,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
          interactive: false,
          bubblingMouseEvents: false,
          className: 'search-radius-circle pointer-events-none'
        });
        const elem = radiusCircleRef.current.getElement() as SVGElement | null;
        if (elem) {
          elem.setAttribute('class', 'search-radius-circle pointer-events-none');
          elem.setAttribute('pointer-events', 'none');
          elem.setAttribute('tabindex', '-1');
          if (elem.style) {
            elem.style.setProperty('outline', 'none', 'important');
            elem.style.setProperty('pointer-events', 'none', 'important');
            elem.style.setProperty('touch-action', 'none', 'important');
          }
        }
      } else {
        const circle = L.circle([userLocation.lat, userLocation.lng], {
          radius: radiusM,
          color: strokeColor,
          weight: 2,
          opacity: 0.85,
          dashArray: '6, 6',
          fill: true,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
          interactive: false,
          bubblingMouseEvents: false,
          className: 'search-radius-circle pointer-events-none'
        }).addTo(map);

        const elem = circle.getElement() as SVGElement | null;
        if (elem) {
          elem.setAttribute('class', 'search-radius-circle pointer-events-none');
          elem.setAttribute('pointer-events', 'none');
          elem.setAttribute('tabindex', '-1');
          if (elem.style) {
            elem.style.setProperty('outline', 'none', 'important');
            elem.style.setProperty('pointer-events', 'none', 'important');
            elem.style.setProperty('touch-action', 'none', 'important');
          }
        }

        radiusCircleRef.current = circle;
      }

      // Center camera to newly selected location if coordinates shifted significantly
      const hasLocationChanged = !prevLocRef.current ||
        Math.abs(prevLocRef.current.lat - userLocation.lat) > 0.0001 ||
        Math.abs(prevLocRef.current.lng - userLocation.lng) > 0.0001;

      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      if (hasLocationChanged && view !== 'route') {
        prevLocRef.current = { lat: userLocation.lat, lng: userLocation.lng };
        map.setView([userLocation.lat, userLocation.lng], isMobile ? 16 : 15, { animate: true });
      }

      // Auto fit search circle into screen view only when radius explicitly changes
      const isRadiusChanged = prevRadiusRef.current !== radiusM;
      if (isRadiusChanged && view !== 'route' && radiusCircleRef.current && mapContainerRef.current && mapContainerRef.current.clientWidth > 0) {
        prevRadiusRef.current = radiusM;
        if (isMobile) {
          // On mobile screens, keep the view close and detailed (avoid zooming way out when radius is large)
          map.setView([userLocation.lat, userLocation.lng], 16, { animate: true });
        } else {
          map.fitBounds(radiusCircleRef.current.getBounds(), {
            padding: [50, 50],
            maxZoom: 16,
            animate: true
          });
        }
      }
    } catch (err) {
      console.error('Error updating location/circle on map:', err);
    }
  }, [mapReady, userLocation.lat, userLocation.lng, radiusM]);

  // Update theme styling on circle when isDarkMode changes WITHOUT moving or zooming the map
  useEffect(() => {
    if (!radiusCircleRef.current) return;
    const strokeColor = isDarkMode ? '#4ADE80' : '#10B981';
    radiusCircleRef.current.setStyle({
      color: strokeColor,
      weight: 2,
      opacity: 0.85,
      dashArray: '6, 6',
      fill: false,
      fillOpacity: 0,
      interactive: false,
      bubblingMouseEvents: false,
      className: 'search-radius-circle pointer-events-none'
    });
    const elem = radiusCircleRef.current.getElement() as SVGElement | null;
    if (elem) {
      elem.setAttribute('class', 'search-radius-circle pointer-events-none');
      elem.setAttribute('pointer-events', 'none');
      elem.setAttribute('tabindex', '-1');
      if (elem.style) {
        elem.style.setProperty('outline', 'none', 'important');
        elem.style.setProperty('pointer-events', 'none', 'important');
        elem.style.setProperty('touch-action', 'none', 'important');
      }
    }
  }, [isDarkMode]);

  // Update Store Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (view === 'route') return;

    const isZoomedIn = currentZoom >= 16;
    const placedBadgePositions: { x: number; y: number }[] = [];

    // Case 1: Product search active
    if (results.length > 0) {
      // Prioritize selected item so its badge is always placed and on top
      const sortedResults = [...results].sort((a, b) => {
        if (selectedResult?.store?.id === a.store?.id) return -1;
        if (selectedResult?.store?.id === b.store?.id) return 1;
        return 0;
      });

      sortedResults.forEach((item) => {
        const latLng = getStoreLatLng(item?.store);
        if (!latLng) return;

        const isSelected = selectedResult?.store?.id === item.store?.id;
        const pt = map.latLngToContainerPoint(latLng);

        let showFullName = false;
        if (isSelected) {
          showFullName = true;
          placedBadgePositions.push({ x: pt.x, y: pt.y });
        } else if (isZoomedIn) {
          // Collision avoidance: do not show label if closer than 100px horizontally and 28px vertically
          const collides = placedBadgePositions.some(
            (p) => Math.abs(pt.x - p.x) < 100 && Math.abs(pt.y - p.y) < 28
          );
          if (!collides) {
            showFullName = true;
            placedBadgePositions.push({ x: pt.x, y: pt.y });
          }
        }
        const formattedPrice = Number(item.bestOffer?.price || 0).toLocaleString('uz-UZ');

        let markerIcon: L.DivIcon;

        const isGameClub = item.store?.type === 'GAME_CLUB' || item.store?.id?.startsWith('gameclub-');
        if (isGameClub && !showGameClubs) {
          return;
        }

        const poi = getPoiTheme({ ...item.store, type: item.store?.type }, isDarkMode);
        if (poi.category === 'KORZINKA' && !showKorzinka) return;
        const isPharmacy = poi.category === 'PHARMACY' || item.store?.type === 'PHARMACY';
        if (isPharmacy && !showPharmacies) {
          return;
        }

        if (!showFullName) {
          // Compact POI disc when zoomed out
          markerIcon = L.divIcon({
            className: 'custom-store-pin',
            html: `
              <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; cursor: pointer; pointer-events: auto;">
                <div style="width: 18px; height: 18px; border-radius: 9999px; background: ${poi.discBg}; border: 1.5px solid ${poi.discBorder}; box-shadow: 0 2px 5px ${poi.shadow}; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                  ${poi.icon}
                </div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -14]
          });
        } else {
          // Native POI style: circular icon disc + crystal-clear store name & price pill
          markerIcon = L.divIcon({
            className: 'custom-store-pin',
            html: `
              <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; pointer-events: auto; cursor: pointer; user-select: none; width: max-content;">
                <div style="position: relative; width: 26px; height: 26px; border-radius: 9999px; background: ${poi.discBg}; border: 2px solid ${poi.discBorder}; box-shadow: 0 2px 6px ${poi.shadow}, 0 0 0 ${isSelected ? '3.5px #10B981' : '1.5px rgba(255,255,255,0.95)'}; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 1; transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'}; transition: transform 0.15s ease-out;">
                  ${poi.icon}
                </div>
                <div style="margin-top: 3px; display: flex; flex-direction: column; align-items: center; width: max-content; background: ${isDarkMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)'}; padding: 2.5px 8px; border-radius: 6px; border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)'}; box-shadow: 0 2px 6px rgba(0,0,0,0.22);">
                  <div style="white-space: nowrap; max-width: 170px; overflow: hidden; text-overflow: ellipsis; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; font-weight: 800; color: ${poi.color}; text-align: center; line-height: 1.25; letter-spacing: -0.15px;">
                    ${item.store.name}
                  </div>
                  <div style="font-size: 10.5px; font-weight: 800; color: #116B50; margin-top: 1px; white-space: nowrap;">
                    ${formattedPrice} so‘m
                  </div>
                </div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -22]
          });
        }

        const marker = L.marker(latLng, {
          icon: markerIcon,
          zIndexOffset: isSelected ? 1000 : (showFullName ? 200 : 50),
          title: `${item.store.name} — ${item.bestOffer?.variant?.title || 'Mahsulot'}: ${formattedPrice} so‘m`,
          keyboard: true
        });

        const popupCardBg = isDarkMode ? '#1F2D26' : '#F9FAF9';
        const popupBorder = isDarkMode ? '#2A3F36' : '#DCE5DF';
        const popupTitle = isDarkMode ? '#E8F2EC' : '#172C28';
        const popupMuted = isDarkMode ? '#8B9E95' : '#566A63';
        const productThumb = getProductThumbnail(item.bestOffer?.variant);

        const popupContent = `
          <div style="min-width: 210px; max-width: 280px; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; margin-bottom: 2px;">
              <div style="font-weight: 700; font-size: 14px; color: ${popupTitle};">
                ${item.store.name}
              </div>
              <span style="font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 4px; background: ${item.isOpenNow ? (isDarkMode ? '#1E362A' : '#E0EFE7') : '#FEE2E2'}; color: ${item.isOpenNow ? (isDarkMode ? '#4ADE80' : '#116B50') : '#B42318'}; white-space: nowrap;">
                ${item.isOpenNow ? 'Ochiq' : 'Yopiq'}
              </span>
            </div>
            <div style="font-size: 11px; color: ${popupMuted}; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;">📍 ${item.store.address || 'Toshkent shahri'}</span>
              <span style="font-weight: 600; color: ${isDarkMode ? '#4ADE80' : '#116B50'}; white-space: nowrap;" title="Siz turgan nuqtadan to‘g‘ridan-to‘g‘ri masofa">
                📍 ${item.distanceM === 0 ? 'Siz turgan joyda' : (item.distanceM >= 1000 ? (item.distanceM / 1000).toFixed(1) + ' km' : item.distanceM + ' m')}
              </span>
            </div>
            <div id="btn-popup-prod-box-${item.store.id}" onclick="window.__yaqintop_open_product_modal && window.__yaqintop_open_product_modal('${item.store.id}')" style="background: ${popupCardBg}; border: 1px solid ${popupBorder}; border-radius: 8px; padding: 6px 8px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; cursor: pointer;" title="Tovar ma‘lumotlari va muqobillarini ko‘rish">
              <img id="btn-popup-thumb-${item.store.id}" src="${productThumb}" alt="${item.bestOffer?.variant?.title || 'Mahsulot'}" style="width: 38px; height: 38px; border-radius: 6px; object-fit: cover; background: #fff; flex-shrink: 0; border: 1px solid ${popupBorder}; cursor: pointer;" />
              <div style="min-width: 0; flex: 1;">
                <div id="btn-prod-${item.store.id}" onclick="window.__yaqintop_open_product_modal && window.__yaqintop_open_product_modal('${item.store.id}')" style="font-size: 12px; font-weight: 700; color: #116B50; cursor: pointer; text-decoration: underline; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${item.bestOffer?.variant?.title || 'Mahsulot'} ↗
                </div>
                <div style="font-size: 13px; font-weight: 800; color: #116B50;">
                  ${formattedPrice} so‘m <span style="font-size: 10px; font-weight: normal; color: ${popupMuted};">/ ${item.bestOffer?.variant?.packUnit || 'dona'}</span>
                </div>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button id="btn-detail-${item.store.id}" onclick="window.__yaqintop_open_result_detail && window.__yaqintop_open_result_detail('${item.store.id}')" style="background: #087F5B; color: white; border: none; border-radius: 10px; padding: 7px 10px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                <span>🏪</span> <span style="white-space: nowrap;">Sahifasiga o‘tish</span>
              </button>
              <button id="btn-route-${item.store.id}" onclick="window.__yaqintop_route_result && window.__yaqintop_route_result('${item.store.id}')" style="background: ${isDarkMode ? '#1E2923' : '#FFFFFF'}; color: ${isDarkMode ? '#E8F2EC' : '#172B26'}; border: 1px solid ${isDarkMode ? '#2E483A' : '#E2E8F0'}; border-radius: 10px; padding: 7px 10px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                <span style="color: #087F5B;">🧭</span> <span style="white-space: nowrap;">Marshrut</span>
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          offset: [0, -18],
          autoPan: false,
          closeButton: true
        });

        marker.on('popupopen', () => {
          const detailBtn = document.getElementById(`btn-detail-${item.store.id}`);
          const routeBtn = document.getElementById(`btn-route-${item.store.id}`);
          const prodBtn = document.getElementById(`btn-prod-${item.store.id}`);
          const thumbBtn = document.getElementById(`btn-popup-thumb-${item.store.id}`);
          const prodBox = document.getElementById(`btn-popup-prod-box-${item.store.id}`);
          if (prodBox) prodBox.onclick = (e) => {
            e.stopPropagation();
            onOpenProductModal?.(item);
          };
          if (detailBtn) detailBtn.onclick = (e) => { e.stopPropagation(); onOpenDetail(item); };
          if (routeBtn) routeBtn.onclick = (e) => { e.stopPropagation(); onNavigate(item); };
          if (thumbBtn) thumbBtn.onclick = (e) => {
            e.stopPropagation();
            onOpenProductModal?.(item);
          };
          if (prodBtn) prodBtn.onclick = (e) => {
            e.stopPropagation();
            if (onOpenProductModal) {
              onOpenProductModal(item);
            } else if (onOpenProduct) {
              onOpenProduct(item.bestOffer?.variant?.id || item.bestOffer?.variant?.sku || '');
            }
          };
        });

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectStore(item);
          try {
            marker.openPopup();
          } catch {}
        });

        markersLayer.addLayer(marker);

        if (isSelected) {
          setTimeout(() => {
            try {
              marker.openPopup();
            } catch {}
          }, 40);
        }
      });
    } else {
      // Case 2: Nearby stores browse mode
      // Prioritize selected item so its badge is always placed and on top
      const sortedNearby = [...nearbyStores].sort((a, b) => {
        if (selectedNearbyStore?.store?.id === a.store?.id) return -1;
        if (selectedNearbyStore?.store?.id === b.store?.id) return 1;
        return 0;
      });

      sortedNearby.forEach(item => {
        const latLng = getStoreLatLng(item.store);
        if (!latLng) return;
        const isSelected = selectedNearbyStore?.store?.id === item.store?.id;
        const pt = map.latLngToContainerPoint(latLng);

        let showFullName = false;
        if (isSelected) {
          showFullName = true;
          placedBadgePositions.push({ x: pt.x, y: pt.y });
        } else if (isZoomedIn) {
          // Collision avoidance: do not show label if closer than 110px horizontally and 28px vertically
          const collides = placedBadgePositions.some(
            (p) => Math.abs(pt.x - p.x) < 110 && Math.abs(pt.y - p.y) < 28
          );
          if (!collides) {
            showFullName = true;
            placedBadgePositions.push({ x: pt.x, y: pt.y });
          }
        }
        const storeName = (item.store?.name || item.organization?.name || 'Do‘kon').replace(/"/g, '&quot;');

        let markerIcon: L.DivIcon;

        const isGameClub = item.store?.type === 'GAME_CLUB' || item.organization?.type === 'GAME_CLUB' || item.store?.id?.startsWith('gameclub-') || item.store?.id?.startsWith('c7000000-');
        if (isGameClub && !showGameClubs) {
          return;
        }

        const poi = getPoiTheme({ ...item.store, ...item.organization, type: item.store?.type || item.organization?.type }, isDarkMode);
        if (poi.category === 'KORZINKA' && !showKorzinka) return;
        const isPharmacy = poi.category === 'PHARMACY' || item.store?.type === 'PHARMACY' || item.organization?.type === 'PHARMACY';
        if (isPharmacy && !showPharmacies) {
          return;
        }

        if (!showFullName) {
          // Compact POI disc when zoomed out
          markerIcon = L.divIcon({
            className: 'custom-store-pin',
            html: `
              <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; cursor: pointer; pointer-events: auto;">
                <div style="width: 18px; height: 18px; border-radius: 9999px; background: ${poi.discBg}; border: 1.5px solid ${poi.discBorder}; box-shadow: 0 2px 5px ${poi.shadow}; display: flex; align-items: center; justify-content: center; font-size: 10px; transition: transform 0.15s ease-out;">
                  ${poi.icon}
                </div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -14]
          });
        } else {
          // Native Map POI style: circular icon disc + crystal-clear name label directly underneath
          markerIcon = L.divIcon({
            className: 'custom-store-pin',
            html: `
              <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; pointer-events: auto; cursor: pointer; user-select: none; width: max-content;">
                <div style="position: relative; width: 26px; height: 26px; border-radius: 9999px; background: ${poi.discBg}; border: 2px solid ${poi.discBorder}; box-shadow: 0 2px 6px ${poi.shadow}, 0 0 0 ${isSelected ? '3.5px #10B981' : '1.5px rgba(255,255,255,0.95)'}; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 1; transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'}; transition: transform 0.15s ease-out;">
                  ${poi.icon}
                </div>
                <div style="margin-top: 3px; display: inline-block; white-space: nowrap; width: max-content; max-width: 170px; overflow: hidden; text-overflow: ellipsis; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; font-weight: 800; color: ${poi.color}; text-align: center; background: ${isDarkMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)'}; padding: 2px 8px; border-radius: 6px; border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)'}; box-shadow: 0 2px 6px rgba(0,0,0,0.22); letter-spacing: -0.15px; line-height: 1.25;">
                  ${storeName}
                </div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -20]
          });
        }

        const marker = L.marker(latLng, {
          icon: markerIcon,
          zIndexOffset: isSelected ? 1000 : (showFullName ? 200 : 50),
          title: `${item.store?.name || item.organization?.name} — tovar va xizmatlarni ko‘rish`,
          keyboard: true
        });

        const popupCardBg = isDarkMode ? '#1F2D26' : '#F9FAF9';
        const popupBorder = isDarkMode ? '#2A3F36' : '#DCE5DF';
        const popupTitle = isDarkMode ? '#E8F2EC' : '#172C28';
        const popupMuted = isDarkMode ? '#8B9E95' : '#566A63';
        const storeType = item.store?.type === 'WHOLESALE' ? 'Ulgurji savdo' : 'Chakana do‘kon';
        const isOpen = item.isOpenNow ?? true;
        const openStatusHtml = isOpen
          ? `<span style="color: ${isDarkMode ? '#4ADE80' : '#116B50'}; font-weight: 700; font-size: 11px;">● Ochiq</span>`
          : `<span style="color: #EF4444; font-weight: 700; font-size: 11px;">○ Yopiq</span>`;
        const distanceHtml = item.distanceM
          ? `<span style="color: ${popupMuted}; font-size: 11px;"> · ${item.distanceM >= 1000 ? `${(item.distanceM / 1000).toFixed(1)} km` : `${item.distanceM} m`}</span>`
          : '';

        const distanceLabel = item.distanceM
          ? (item.distanceM >= 1000 ? `${(item.distanceM / 1000).toFixed(1)} km` : `${Math.round(item.distanceM)} m`)
          : '445 m';

        const popupContent = `
          <div style="min-width: 240px; max-width: 290px; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
              <div style="font-weight: 800; font-size: 15px; color: ${popupTitle}; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${storeName}
              </div>
              <div style="background: ${isDarkMode ? '#1E362A' : '#E8F5EE'}; color: ${isDarkMode ? '#4ADE80' : '#087F5B'}; font-size: 11px; font-weight: 800; padding: 2.5px 8px; border-radius: 9999px; white-space: nowrap; display: flex; align-items: center; gap: 3px;">
                <span>📍</span> <span>${distanceLabel}</span>
              </div>
            </div>
            <div style="font-size: 11.5px; color: ${popupMuted}; margin-bottom: 10px; display: flex; align-items: flex-start; gap: 4px; line-height: 1.35;">
              <span style="flex-shrink: 0;">📍</span> <span>${item.store.address || 'Guliston, Sirdaryo'}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button id="btn-nearby-detail-${item.store.id}" onclick="window.__yaqintop_open_nearby_detail && window.__yaqintop_open_nearby_detail('${item.store.id}')" style="background: #087F5B; color: white; border: none; border-radius: 10px; padding: 8px 10px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                <span>🏪</span> <span style="white-space: nowrap;">Sahifasiga o‘tish</span>
              </button>
              <button id="btn-nearby-route-${item.store.id}" onclick="window.__yaqintop_route_nearby && window.__yaqintop_route_nearby('${item.store.id}')" style="background: ${isDarkMode ? '#1E2923' : '#FFFFFF'}; color: ${isDarkMode ? '#E8F2EC' : '#172B26'}; border: 1px solid ${isDarkMode ? '#2E483A' : '#E2E8F0'}; border-radius: 10px; padding: 8px 10px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                <span style="color: #087F5B;">🧭</span> <span style="white-space: nowrap;">Marshrut</span>
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          offset: [0, -18],
          autoPan: false,
          closeButton: true
        });

        marker.on('popupopen', () => {
          const detailBtn = document.getElementById(`btn-nearby-detail-${item.store.id}`);
          const routeBtn = document.getElementById(`btn-nearby-route-${item.store.id}`);
          if (detailBtn) detailBtn.onclick = (e) => {
            e.stopPropagation();
            onOpenNearbyDetail?.(item);
          };
          if (routeBtn) routeBtn.onclick = (e) => {
            e.stopPropagation();
            onNavigate?.({ store: item.store, distanceM: item.distanceM || 0 });
          };
        });

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectNearbyStore?.(item);
          try {
            marker.openPopup();
          } catch {}
        });

        markersLayer.addLayer(marker);

        if (isSelected) {
          setTimeout(() => {
            try {
              marker.openPopup();
            } catch {}
          }, 40);
        }
      });
    }
  }, [results, nearbyStores, selectedResult, selectedNearbyStore, currentZoom, view, isDarkMode, mapReady, onSelectNearbyStore, onOpenNearbyDetail, onSelectStore, showGameClubs, showPharmacies, showKorzinka]);

  // Render Uzum Market Points (active in all environments including production deploy)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = uzumMarkersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (!showUzumPoints || view === 'route' || !activeUzumInRegion.length) return;

    const bounds = map.getBounds().pad(0.15);
    const visiblePoints = activeUzumInRegion.filter((p) => {
      const lat = p.location?.lat;
      const lng = p.location?.lng;
      return lat && lng && bounds.contains([lat, lng]);
    });

    // Render up to 120 visible points for silky smooth rendering
    visiblePoints.slice(0, 120).forEach((point) => {
      const latLng: [number, number] = [point.location.lat, point.location.lng];
      const name = point.name || 'Uzum Market topshirish punkti';
      const address = point.address || 'O‘zbekiston';

      const markerIcon = L.divIcon({
        className: 'uzum-pvz-pin',
        html: `<div style="border-radius: 50%; border: 1.5px solid #ffffff; box-shadow: 0 2px 6px rgba(112,0,255,0.45);">${uzumMark(18)}</div>`,
        iconSize: [21, 21],
        iconAnchor: [10.5, 10.5],
        popupAnchor: [0, -11]
      });

      const marker = L.marker(latLng, {
        icon: markerIcon,
        zIndexOffset: 120,
        title: `${name} — Uzum Market PVZ`
      });

      const amenitiesHtml = `
        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; margin-bottom: 8px;">
          ${point.hasDressingRoom ? '<span style="font-size: 9.5px; padding: 2px 5px; border-radius: 4px; background: #F3E8FF; color: #7000FF; font-weight: 700;">👗 Kiyib ko‘rish</span>' : ''}
          ${point.acceptReturns ? '<span style="font-size: 9.5px; padding: 2px 5px; border-radius: 4px; background: #E0F2FE; color: #0369A1; font-weight: 700;">🔄 Qaytarish</span>' : ''}
          ${point.postPaidEnabled ? '<span style="font-size: 9.5px; padding: 2px 5px; border-radius: 4px; background: #DCFCE7; color: #15803D; font-weight: 700;">💳 Karta/Naqd</span>' : ''}
        </div>
      `;

      const popupHtml = `
        <div style="min-width: 230px; max-width: 290px; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 3px;">
            ${uzumMark(19)}
            <div style="font-weight: 800; font-size: 13px; color: #7000FF; line-height: 1.2;">
              ${name}
            </div>
          </div>
          <div style="font-size: 11px; color: ${isDarkMode ? '#CBD5E1' : '#475569'}; margin-bottom: 4px;">
            📍 ${address}
          </div>
          <div style="font-size: 11px; color: #16A34A; font-weight: 700; margin-bottom: 2px;">
            ⏰ Ish vaqti: 10:00 — 20:00 (Har kuni)
          </div>
          ${amenitiesHtml}
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px;">
            <button type="button" data-popup-action="detail" style="background: #7000FF; color: white; border: none; border-radius: 10px; padding: 7px 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; box-shadow: 0 2px 6px rgba(112,0,255,0.3);">
              <span>🏪 Sahifasiga o‘tish</span>
            </button>
            <button type="button" data-popup-action="route" style="background: ${isDarkMode ? '#1E2923' : '#F1F5F9'}; color: ${isDarkMode ? '#E8F2EC' : '#1E293B'}; border: 1px solid ${isDarkMode ? '#2E483A' : '#CBD5E1'}; border-radius: 10px; padding: 7px 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <span>🧭 Marshrut</span>
            </button>
          </div>
        </div>
      `;

      bindPlacePopup(marker, popupHtml, {
        store: point,
        organization: { name: point.organizationName, type: 'RETAIL' },
        distanceM: 0,
        isOpenNow: true,
        offersCount: 2
      }, popupActions);

      layer.addLayer(marker);
    });
  }, [activeUzumInRegion, showUzumPoints, mapViewportKey, view, isDarkMode]);

  // Render Game Clubs (active in all environments including production deploy)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = gameClubsMarkersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (!showGameClubs || view === 'route' || !activeClubsInRegion.length) return;

    const bounds = map.getBounds().pad(0.15);
    const visibleClubs = activeClubsInRegion.filter((p) => {
      const lat = p.location?.lat;
      const lng = p.location?.lng;
      return lat && lng && bounds.contains([lat, lng]);
    });

    const isZoomedIn = currentZoom >= 16;

    visibleClubs.slice(0, 100).forEach((club) => {
      const latLng: [number, number] = [club.location.lat, club.location.lng];
      const name = club.name || 'Game Club';
      const address = club.address || 'Guliston, Sirdaryo';
      const is24 = club.amenities?.is24Hours;

      let markerIcon: L.DivIcon;
      if (!isZoomedIn) {
        markerIcon = L.divIcon({
          className: 'game-club-pin',
          html: `
            <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; cursor: pointer;">
              <div style="width: 18px; height: 18px; border-radius: 9999px; background: ${isDarkMode ? '#082F49' : '#F0F9FF'}; border: 1.5px solid ${isDarkMode ? '#0284C7' : '#38BDF8'}; box-shadow: 0 2px 6px rgba(2,132,199,0.45); display: flex; align-items: center; justify-content: center; font-size: 10px;">🎮</div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
          popupAnchor: [0, -14]
        });
      } else {
        markerIcon = L.divIcon({
          className: 'game-club-poi',
          html: `
            <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; cursor: pointer; pointer-events: auto; user-select: none; width: max-content;">
              <div style="width: 26px; height: 26px; border-radius: 9999px; background: ${isDarkMode ? '#082F49' : '#F0F9FF'}; border: 2px solid ${isDarkMode ? '#0284C7' : '#38BDF8'}; box-shadow: 0 2px 6px rgba(2,132,199,0.45), 0 0 0 1.5px rgba(255,255,255,0.95); display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 1;">
                🎮
              </div>
              <div style="margin-top: 3px; display: inline-block; white-space: nowrap; width: max-content; max-width: 170px; overflow: hidden; text-overflow: ellipsis; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; font-weight: 800; color: ${isDarkMode ? '#38BDF8' : '#0284C7'}; text-align: center; background: ${isDarkMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)'}; padding: 2px 8px; border-radius: 6px; border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)'}; box-shadow: 0 2px 6px rgba(0,0,0,0.22); letter-spacing: -0.15px; line-height: 1.25;">
                ${name}
              </div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
          popupAnchor: [0, -20]
        });
      }

      const marker = L.marker(latLng, {
        icon: markerIcon,
        zIndexOffset: 125,
        title: `${name} — Game Club / PlayStation`
      });

      const hoursText = is24 ? 'Kruglosutochno (24 soat)' : (club.hours?.[0]?.closeTime ? `Ochiq · ${club.hours[0].closeTime} gacha` : 'Ochiq');

      const popupHtml = `
        <div style="min-width: 230px; max-width: 290px; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 3px;">
            <span style="font-size: 14px;">🎮</span>
            <div style="font-weight: 800; font-size: 13.5px; color: #0284C7; line-height: 1.2;">
              ${name}
            </div>
          </div>
          <div style="font-size: 11px; color: ${isDarkMode ? '#CBD5E1' : '#475569'}; margin-bottom: 4px;">
            📍 ${address}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin-bottom: 6px;">
            <span style="color: #F59E0B; font-weight: 700;">★ ${club.rating} (${club.reviewCount})</span>
            <span style="color: #10B981; font-weight: 700;">⏰ ${hoursText}</span>
          </div>
          ${club.phone && club.phone !== '+998901234567' ? `<div style="font-size: 11px; color: #0284C7; font-weight: 600; margin-bottom: 6px;">📞 ${club.phone}</div>` : ''}
          <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
            <span style="font-size: 9.5px; padding: 2px 5px; border-radius: 4px; background: #E0F2FE; color: #0369A1; font-weight: 700;">🖥️ PC Gaming</span>
            <span style="font-size: 9.5px; padding: 2px 5px; border-radius: 4px; background: #EDE9FE; color: #6D28D9; font-weight: 700;">🎮 PlayStation</span>
            <span style="font-size: 9.5px; padding: 2px 5px; border-radius: 4px; background: #DCFCE7; color: #15803D; font-weight: 700;">🏆 Kiber Arena</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <button type="button" data-popup-action="detail" style="background: #0284C7; color: white; border: none; border-radius: 10px; padding: 7px 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; box-shadow: 0 2px 6px rgba(2,132,199,0.3);">
              <span>🏪 Sahifasiga o‘tish</span>
            </button>
            <button type="button" data-popup-action="route" style="background: ${isDarkMode ? '#1E2923' : '#F1F5F9'}; color: ${isDarkMode ? '#E8F2EC' : '#1E293B'}; border: 1px solid ${isDarkMode ? '#2E483A' : '#CBD5E1'}; border-radius: 10px; padding: 7px 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <span>🧭 Marshrut</span>
            </button>
          </div>
        </div>
      `;

      bindPlacePopup(marker, popupHtml, {
        store: club,
        organization: { name: club.organizationName, type: 'GAME_CLUB' },
        distanceM: 0,
        isOpenNow: true,
        offersCount: 6
      }, popupActions);

      layer.addLayer(marker);
    });
  }, [activeClubsInRegion, showGameClubs, mapViewportKey, currentZoom, view, isDarkMode]);

  // Render Korzinka Supermarkets (Active across Uzbekistan)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = korzinkaMarkersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (!showKorzinka || view === 'route' || !activeKorzinkaInRegion.length) return;

    const bounds = map.getBounds().pad(0.15);
    const visibleStores = activeKorzinkaInRegion.filter((p) => {
      const lat = p.location?.lat;
      const lng = p.location?.lng;
      return lat && lng && bounds.contains([lat, lng]);
    });

    const isZoomedIn = currentZoom >= 16;

    visibleStores.slice(0, 100).forEach((store) => {
      const latLng: [number, number] = [store.location.lat, store.location.lng];
      const name = store.name || 'Korzinka';
      const address = store.address || '';
      const is24 = store.is24Hours;

      let markerIcon: L.DivIcon;
      if (!isZoomedIn) {
        markerIcon = L.divIcon({
          className: 'korzinka-pin',
          html: `
            <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; cursor: pointer;">
              <div style="width: 20px; height: 20px; border-radius: 50%; background: #E31E24; border: 1.5px solid white; box-shadow: 0 2px 6px rgba(227,30,36,0.45); display: flex; align-items: center; justify-content: center; font-size: 12px;">${korzinkaMark}</div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
          popupAnchor: [0, -14]
        });
      } else {
        markerIcon = L.divIcon({
          className: 'korzinka-poi',
          html: `
            <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; cursor: pointer; pointer-events: auto; user-select: none; width: max-content;">
              <div style="width: 26px; height: 26px; border-radius: 50%; background: #E31E24; border: 2px solid white; box-shadow: 0 2px 6px rgba(227,30,36,0.45); display: flex; align-items: center; justify-content: center; font-size: 15px;">
                ${korzinkaMark}
              </div>
              <div style="margin-top: 3px; display: inline-block; white-space: nowrap; width: max-content; max-width: 170px; overflow: hidden; text-overflow: ellipsis; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; font-weight: 800; color: ${isDarkMode ? '#F87171' : '#E31E24'}; text-align: center; background: ${isDarkMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)'}; padding: 2px 8px; border-radius: 6px; border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)'}; box-shadow: 0 2px 6px rgba(0,0,0,0.22); letter-spacing: -0.15px; line-height: 1.25;">
                ${name}
              </div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
          popupAnchor: [0, -20]
        });
      }

      const marker = L.marker(latLng, {
        icon: markerIcon,
        zIndexOffset: 130,
        title: `${name} — Korzinka Supermarket`
      });

      const hoursText = is24 ? 'Kruglosutochno (24 soat ochiq)' : 'Ochiq';

      const popupHtml = `
        <div style="min-width: 230px; max-width: 290px; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 3px;">
            <span style="width: 19px; height: 19px; border-radius: 50%; background: #E31E24; display: inline-flex; align-items: center; justify-content: center; font-size: 12px;">${korzinkaMark}</span>
            <div style="font-weight: 800; font-size: 13.5px; color: #E31E24; line-height: 1.2;">
              ${name}
            </div>
          </div>
          <div style="font-size: 11px; color: ${isDarkMode ? '#CBD5E1' : '#475569'}; margin-bottom: 4px;">
            📍 ${address}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin-bottom: 6px;">
            <span style="color: #F59E0B; font-weight: 700;">★ ${store.rating || 4.8} (${store.reviewCount || 90})</span>
            <span style="color: #10B981; font-weight: 700;">⏰ ${hoursText}</span>
          </div>
          ${store.phone ? `<div style="font-size: 11px; color: #E31E24; font-weight: 600; margin-bottom: 6px;">📞 ${store.phone}</div>` : ''}
          <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
            <span style="font-size: 9.5px; padding: 2px 5px; border-radius: 4px; background: #FEE2E2; color: #991B1B; font-weight: 700;">Supermarket</span>
            <span style="font-size: 9.5px; padding: 2px 5px; border-radius: 4px; background: #DCFCE7; color: #15803D; font-weight: 700;">🅿️ Avtoturargoh</span>
            <span style="font-size: 9.5px; padding: 2px 5px; border-radius: 4px; background: #E0F2FE; color: #0369A1; font-weight: 700;">🏧 Bankomat</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <button type="button" data-popup-action="detail" style="background: #E31E24; color: white; border: none; border-radius: 10px; padding: 7px 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; box-shadow: 0 2px 6px rgba(227,30,36,0.3);">
              <span>🏪 Sahifasiga o‘tish</span>
            </button>
            <button type="button" data-popup-action="route" style="background: ${isDarkMode ? '#1E2923' : '#F1F5F9'}; color: ${isDarkMode ? '#E8F2EC' : '#1E293B'}; border: 1px solid ${isDarkMode ? '#2E483A' : '#CBD5E1'}; border-radius: 10px; padding: 7px 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <span>🧭 Marshrut</span>
            </button>
          </div>
        </div>
      `;

      bindPlacePopup(marker, popupHtml, {
        store,
        organization: { name: store.organizationName || 'Korzinka', type: 'SUPERMARKET' },
        distanceM: 0,
        isOpenNow: true,
        offersCount: 269
      }, popupActions);

      layer.addLayer(marker);
    });
  }, [activeKorzinkaInRegion, showKorzinka, mapViewportKey, currentZoom, view, isDarkMode]);

  // Clear the popup when selection is cleared without changing the map viewport.
  useEffect(() => {
    if (view !== 'route' && !selectedResult && !selectedNearbyStore) mapInstanceRef.current?.closePopup();
  }, [selectedResult, selectedNearbyStore, view]);

  // Update Route Polyline & Destination Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeMarkersLayer = routeMarkersLayerRef.current;
    if (!map || !routeMarkersLayer) return;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    routeMarkersLayer.clearLayers();

    if (view === 'route' && routeData && routeData.geometry && routeData.geometry.length > 0) {
      const latLngs: [number, number][] = routeData.geometry.map(([lng, lat]) => [lat, lng]);

      const isWalking = (routeMode || routeData.mode) === 'walking';
      const polyline = L.polyline(latLngs, {
        color: isDarkMode ? '#22C55E' : '#116B50',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: isWalking ? '1, 10' : undefined,
        interactive: false
      }).addTo(map);

      const polyElem = polyline.getElement() as SVGElement | null;
      if (polyElem?.style) {
        polyElem.style.outline = 'none';
        polyElem.style.pointerEvents = 'none';
      }

      routePolylineRef.current = polyline;

      const destCoords = latLngs[latLngs.length - 1];
      const destIcon = L.divIcon({
        className: 'dest-marker',
        html: `
          <div style="width: 32px; height: 32px; border-radius: 9999px; background: #116B50; border: 2px solid white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold;">
            🏁
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      L.marker(destCoords, { icon: destIcon }).addTo(routeMarkersLayer);

      setTimeout(() => {
        try {
          map.invalidateSize();
          map.fitBounds(polyline.getBounds(), { padding: [60, 60], animate: true });
        } catch {}
      }, 50);
    }
  }, [view, routeData, routeMode, isDarkMode, mapReady]);

  // Re-center map to user's location point (triggered by 'Yaqinimda' button or GPS)
  useEffect(() => {
    if (!mapReady || !recenterTrigger) return;
    const map = mapInstanceRef.current;
    if (!map) return;

    const uLat = userLocation?.lat ?? 41.311081;
    const uLng = userLocation?.lng ?? 69.240562;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const targetZoom = isMobile ? 16 : 15;

    map.setView([uLat, uLng], targetZoom, { animate: true });
    try {
      map.closePopup();
    } catch {}
  }, [recenterTrigger, mapReady]);

  // Re-center on User Location
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const uLat = userLocation?.lat ?? 41.311081;
    const uLng = userLocation?.lng ?? 69.240562;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const targetZoom = isMobile ? 16 : 15;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (onLocationChange) onLocationChange(latitude, longitude);
          map.setView([latitude, longitude], targetZoom, { animate: true });
          if (onToast) onToast('GPS joylashuv aniqlandi!');
        },
        () => {
          map.setView([uLat, uLng], targetZoom, { animate: true });
          if (onToast) onToast('Boshlang‘ich qidiruv nuqtasiga qaytildi');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      map.setView([uLat, uLng], targetZoom, { animate: true });
      if (onToast) onToast('Boshlang‘ich joylashuvga qaytildi');
    }
  };

  // Fit search radius circle in view
  const handleFitRadius = () => {
    const map = mapInstanceRef.current;
    const circle = radiusCircleRef.current;
    if (!map || !circle) return;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
      map.setView([userLocation.lat, userLocation.lng], 16, { animate: true });
    } else {
      map.fitBounds(circle.getBounds(), { padding: [50, 50], maxZoom: 16, animate: true });
    }
    if (onToast) onToast(`Qidiruv maydoni: ${radiusM >= 1000 ? `${(radiusM / 1000).toFixed(1)} km` : `${radiusM} m`}`);
  };

  // Fit all markers in view
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const uLat = userLocation?.lat ?? 41.311081;
    const uLng = userLocation?.lng ?? 69.240562;

    if (results.length > 0) {
      const validPoints: [number, number][] = results
        .map((r) => getStoreLatLng(r?.store))
        .filter((pt): pt is [number, number] => pt !== null);
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        bounds.extend([uLat, uLng]);
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
      }
    } else if (nearbyStores.length > 0) {
      const validPoints: [number, number][] = nearbyStores
        .map((r) => getStoreLatLng(r?.store))
        .filter((pt): pt is [number, number] => pt !== null);
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        bounds.extend([uLat, uLng]);
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
      }
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  

  return (
    <div className="relative w-full h-full min-h-0 flex-1 flex flex-col overflow-hidden">
      {/* Leaflet Map Canvas - Fills 100% of container */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full z-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Floating Route Mode Top Notification / Stop Action */}
      {view === 'route' && routeData && (
        <div className="absolute top-3 md:top-4 left-3 md:left-4 right-3 md:right-4 z-20 flex flex-col gap-2 max-w-md pointer-events-auto">
          <div className="bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md p-3 rounded-2xl border border-[#DCE5DF] dark:border-[#273B32] shadow-xl flex flex-col gap-2">
            {/* Top row: Store Name & Stop button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-xs md:text-sm font-bold text-[#172C28] dark:text-[#E8F2EC] truncate">
                    {routeTargetName || selectedResult?.store?.name || selectedNearbyStore?.store?.name || 'Do‘konga marshrut'}
                  </h4>
                  {(routeTargetAddress || selectedResult?.store?.address || selectedNearbyStore?.store?.address) && (
                    <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] truncate">
                      {routeTargetAddress || selectedResult?.store?.address || selectedNearbyStore?.store?.address}
                    </p>
                  )}
                </div>
              </div>

              {onCancelRoute && (
                <button
                  onClick={onCancelRoute}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold shadow-xs transition shrink-0 cursor-pointer"
                  title="Marshrutni to‘xtatish"
                >
                  <XCircle className="w-4 h-4" />
                  <span>To‘xtatish</span>
                </button>
              )}
            </div>

            {/* Bottom row: Time/Distance summary + Mode Selector (Piyoda / Mashina) + External map */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#DCE5DF]/60 dark:border-[#273B32]">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#116B50] dark:text-[#4ADE80]">
                <span>{(routeMode || routeData.mode) === 'walking' ? '🚶' : '🚗'}</span>
                <span>{Math.round(routeData.durationSec / 60) || 1} daqiqa</span>
                <span className="text-[#566A63] dark:text-[#8B9E95] font-normal">
                  · {routeData.distanceM >= 1000 ? `${(routeData.distanceM / 1000).toFixed(1)} km` : `${routeData.distanceM} m`}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {onChangeRouteMode && (
                  <div className="flex p-0.5 bg-[#F3F6F3] dark:bg-[#1A2822] rounded-lg border border-[#DCE5DF] dark:border-[#2A3F36] text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => onChangeRouteMode('walking')}
                      className={`px-2 py-1 rounded-md transition ${
                        (routeMode || routeData.mode) === 'walking'
                          ? 'bg-[#116B50] text-white shadow-xs'
                          : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                      }`}
                    >
                      🚶 Piyoda
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeRouteMode('driving')}
                      className={`px-2 py-1 rounded-md transition ${
                        (routeMode || routeData.mode) === 'driving'
                          ? 'bg-[#116B50] text-white shadow-xs'
                          : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                      }`}
                    >
                      🚗 Avto
                    </button>
                  </div>
                )}

                {routeData.externalMapUrl && (
                  <a
                    href={routeData.externalMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-[#E0EFE7] dark:bg-[#1E362A] hover:bg-[#D0E7DC] text-[#116B50] dark:text-[#4ADE80] transition flex items-center justify-center"
                    title="Google / Yandex xaritasida ochish"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Floating Map Controls (Top Right: Recenter, Radius, Fit & Zoom) */}
      <div className={`absolute right-3 md:right-4 ${view === 'route' ? 'top-32 sm:top-36' : 'top-36 sm:top-40'} md:top-4 flex flex-col gap-2 z-20`}>
        {/* Uzum Market delivery points toggle */}
        <button
          onClick={() => setShowUzumPoints(!showUzumPoints)}
          aria-label="Uzum Market nuqtalari"
          aria-pressed={showUzumPoints}
          title={showUzumPoints ? `Uzum Market nuqtalarini yashirish (${activeUzumInRegion.length.toLocaleString()} ta)` : `Uzum Market nuqtalarini ko‘rsatish (${activeUzumInRegion.length.toLocaleString()} ta)`}
          className={`w-9 h-9 sm:w-10 sm:h-10 backdrop-blur-md rounded-xl border flex items-center justify-center shadow-md transition active:scale-95 text-sm font-black cursor-pointer ${
            showUzumPoints
              ? 'bg-[#7000FF] text-white border-[#7000FF] shadow-purple-500/30 ring-2 ring-[#7000FF]/30'
              : 'bg-white/95 dark:bg-[#14201A]/95 text-[#7000FF] border-[#DCE5DF] dark:border-[#273B32] hover:bg-purple-50'
          }`}
        >
          <img src={uzumMapLogo} alt="" className={`h-6 w-6 rounded-full ${showUzumPoints ? 'ring-1 ring-white/70' : 'opacity-70'}`} />
        </button>

        {/* Pharmacy (Dorixona) toggle button */}
        <button
          onClick={() => setShowPharmacies(!showPharmacies)}
          title={showPharmacies ? 'Dorixonalarni yashirish' : 'Dorixonalarni ko‘rsatish'}
          className={`w-9 h-9 sm:w-10 sm:h-10 backdrop-blur-md rounded-xl border flex items-center justify-center shadow-md transition active:scale-95 text-sm font-black cursor-pointer ${
            showPharmacies
              ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-red-500/30 ring-2 ring-[#DC2626]/30'
              : 'bg-white/95 dark:bg-[#14201A]/95 text-[#DC2626] border-[#DCE5DF] dark:border-[#273B32] hover:bg-red-50'
          }`}
        >
          <span>💊</span>
        </button>

        {/* Korzinka Supermarkets toggle button */}
        <button
          onClick={() => setShowKorzinka(!showKorzinka)}
          aria-label="Korzinka supermarketlari"
          aria-pressed={showKorzinka}
          title={showKorzinka ? `Korzinkalarni yashirish (${activeKorzinkaInRegion.length.toLocaleString()} ta)` : `Korzinkalarni ko‘rsatish (${activeKorzinkaInRegion.length.toLocaleString()} ta)`}
          className={`w-9 h-9 sm:w-10 sm:h-10 backdrop-blur-md rounded-xl border flex items-center justify-center shadow-md transition active:scale-95 text-sm font-black cursor-pointer ${
            showKorzinka
              ? 'bg-[#E31E24] text-white border-[#E31E24] shadow-red-500/30 ring-2 ring-[#E31E24]/30'
              : 'bg-white/95 dark:bg-[#14201A]/95 text-[#E31E24] border-[#DCE5DF] dark:border-[#273B32] hover:bg-red-50'
          }`}
        >
          <span className="text-xl leading-none" aria-hidden="true">K</span>
        </button>

        {/* Game Clubs toggle button */}
        <button
          onClick={() => setShowGameClubs(!showGameClubs)}
          title={showGameClubs ? `Game Clublarni yashirish (${activeClubsInRegion.length} ta)` : `Game Clublarni ko‘rsatish (${activeClubsInRegion.length} ta)`}
          className={`w-9 h-9 sm:w-10 sm:h-10 backdrop-blur-md rounded-xl border flex items-center justify-center shadow-md transition active:scale-95 text-sm font-black cursor-pointer ${
            showGameClubs
              ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-sky-500/30 ring-2 ring-[#0284C7]/30'
              : 'bg-white/95 dark:bg-[#14201A]/95 text-[#0284C7] border-[#DCE5DF] dark:border-[#273B32] hover:bg-sky-50'
          }`}
        >
          <span>🎮</span>
        </button>
        <button
          onClick={handleRecenter}
          title="Mening joylashuvim (GPS)"
          className="w-9 h-9 sm:w-10 sm:h-10 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md rounded-xl border border-[#DCE5DF] dark:border-[#273B32] flex items-center justify-center text-red-500 shadow-md hover:bg-[#FEE2E2] dark:hover:bg-[#2A1D1D] transition active:scale-95 text-xs font-bold"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitRadius}
          title="Qidiruv maydonini to'liq ko'rsatish"
          className="w-9 h-9 sm:w-10 sm:h-10 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md rounded-xl border border-[#DCE5DF] dark:border-[#273B32] flex items-center justify-center text-[#116B50] dark:text-[#4ADE80] shadow-md hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] transition active:scale-95 text-xs font-bold"
        >
          <CircleDot className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitBounds}
          title="Barcha do'konlarni ko'rsatish"
          className="w-9 h-9 sm:w-10 sm:h-10 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md rounded-xl border border-[#DCE5DF] dark:border-[#273B32] flex items-center justify-center text-[#172C28] dark:text-[#E8F2EC] shadow-md hover:bg-[#F3F6F3] dark:hover:bg-[#1F2F27] transition active:scale-95 text-xs font-bold"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="flex flex-col bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md rounded-xl border border-[#DCE5DF] dark:border-[#273B32] shadow-md overflow-hidden">
          <button
            onClick={handleZoomIn}
            title="Kattalashtirish"
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#172C28] dark:text-[#E8F2EC] font-bold text-lg hover:bg-[#F3F6F3] dark:hover:bg-[#1F2F27] transition border-b border-[#DCE5DF] dark:border-[#273B32]"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            title="Kichiklashtirish"
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#172C28] dark:text-[#E8F2EC] font-bold text-lg hover:bg-[#F3F6F3] dark:hover:bg-[#1F2F27] transition"
          >
            −
          </button>
        </div>
      </div>

      {/* Mobile Floating Card for Selected Nearby Store (when user taps store pin on map) */}
      {!results.length && selectedNearbyStore && view !== 'route' && (
        <div className="absolute bottom-[140px] md:hidden left-3 right-3 z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md border border-[#116B50]/30 dark:border-[#4ADE80]/30 rounded-2xl p-3.5 sm:p-4 shadow-xl pointer-events-auto flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-2 py-0.5 rounded-md bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] text-[11px] font-black uppercase tracking-wider">
                    {selectedNearbyStore.store?.type === 'WHOLESALE' ? 'Ulgurji' : 'Do‘kon'}
                  </span>
                  <span className={selectedNearbyStore.isOpenNow ? 'text-[#116B50] dark:text-[#4ADE80] text-xs font-bold' : 'text-red-500 text-xs font-bold'}>
                    {selectedNearbyStore.isOpenNow ? '● Ochiq' : '○ Yopiq'}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-[#172C28] dark:text-[#E8F2EC] truncate">
                  {selectedNearbyStore.store?.name || selectedNearbyStore.organization?.name}
                </h3>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5 truncate">
                  📍 {selectedNearbyStore.store?.address || 'Toshkent shahri'}
                  {selectedNearbyStore.distanceM && (
                    <span className="font-bold text-[#116B50] dark:text-[#4ADE80] ml-1">
                      · {selectedNearbyStore.distanceM >= 1000 ? `${(selectedNearbyStore.distanceM / 1000).toFixed(1)} km` : `${selectedNearbyStore.distanceM} m`}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => onSelectNearbyStore?.(null as any)}
                className="text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title="Yopish"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#DCE5DF]/60 dark:border-[#273B32]">
              <button
                onClick={() => onOpenNearbyDetail?.(selectedNearbyStore)}
                className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-[#116B50] active:scale-95 text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <StoreIcon className="w-4 h-4" />
                <span>Sahifasiga o‘tish</span>
              </button>
              <button
                onClick={() => onNavigate?.({ store: selectedNearbyStore.store, distanceM: selectedNearbyStore.distanceM || 0 })}
                className="min-h-[44px] py-2.5 px-3.5 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] active:scale-95 text-[#116B50] dark:text-[#4ADE80] text-xs sm:text-sm font-bold transition flex items-center gap-1.5"
              >
                <Navigation className="w-4 h-4" />
                <span>Marshrut</span>
              </button>
            </div>
          </div>
        </div>
      )}

          </div>
  );
};
