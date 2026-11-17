import { useCachedSession, clearSessionCache, TokenQuickLoginModal, LanguageSwitcher, useTranslation } from '@yaqintop/ui';
import React, { useState, useEffect, useRef } from 'react';
import { latLng } from 'leaflet';
import {
  Search,
  MapPin,
  Clock,
  Phone,
  Bookmark,
  Share2,
  Navigation,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  AlertTriangle,
  Heart,
  ExternalLink,
  MessageSquare,
  AlertOctagon,
  Layers,
  X,
  XCircle,
  Moon,
  Sun,
  LogIn,
  ChevronDown,
  Building2,
  Package,
  Sparkles,
  Smartphone,
  Compass,
  Eye,
  ShoppingBag,
  Star,
  Store as StoreIcon,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { Button, Tag, Modal, StarRating, YaqinTopLogo } from '@yaqintop/ui';
import { StoreSearchResult, RouteResponse, Offer, Store } from '@yaqintop/contracts';
import { CustomerHeader } from './components/CustomerHeader';
import { SearchToolbar } from './components/SearchToolbar';
import { ResultsDrawer, ResultsDrawerTrigger } from './components/ResultsDrawer';
import { SearchStatusBar } from './components/SearchStatusBar';
import { DesktopSearchSidebar, QUICK_CATEGORIES } from './components/DesktopSearchSidebar';
import { MobileBottomSheet } from './components/MobileBottomSheet';
import { getStoreLatLng, InteractiveMap, type NearbyStoreItem } from './components/InteractiveMap';
import { loadMapCatalog, loadMapList, preloadMapCatalogs, getMemoryCachedCatalog, STORES_CACHE_MAX_AGE } from './utils/map-cache';
const StoreFullPageView = React.lazy(() => import('./components/StoreFullPageView').then(m => ({ default: m.StoreFullPageView })));
const UserPersonalHubView = React.lazy(() => import('./components/UserPersonalHubView').then(m => ({ default: m.UserPersonalHubView })));
import { UnifiedUserProfileModal } from './components/UnifiedUserProfileModal';
import { UnifiedLoginModal } from './components/UnifiedLoginModal';
import { UzbekistanRegionPickerModal, detectNearestUzbekistanLocation } from './components/UzbekistanRegionPickerModal';
import { ProductQuickDetailModal } from './components/ProductQuickDetailModal';
import { AddStoreModal } from './components/AddStoreModal';
import { getStoreBannerImage } from './utils/store-images';
import { apiUrl } from './config/api.js';
const LandingApp = React.lazy(() => import('@yaqintop/landing-app').then(m => ({ default: m.LandingApp })));
import { getProductThumbnail, DEFAULT_PRODUCT_THUMBNAIL } from './utils/product-thumbnails';

const uzbekistanTime = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tashkent', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const timeInMinutes = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};
import { pickupServiceImage, returnServiceImage } from './utils/uzum-images';

const isLocalEnv = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '0.0.0.0' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.startsWith('172.') ||
  window.location.hostname.endsWith('.local') ||
  window.location.port === '3000' ||
  Boolean((import.meta as any).env?.DEV)
);

export function CustomerApp() {
  const customerHomePath = isLocalEnv ? '/' : '/customer';
  const { t } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('yaqintop_theme') === 'dark';
  });

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('yaqintop_theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Current User Session State (Null by default for Guest)
  const [currentUser, setCurrentUser] = useCachedSession();

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
      showToast("YaqinTop ilovasi telefoningizga o‘rnatildi!");
    }
  };

  const [authErrorBanner, setAuthErrorBanner] = useState<string | null>(null);
  const pendingAuthCallback = useRef<(() => void) | null>(null);

  const requireAuth = (actionName = 'ushbu amalni bajarish', callback?: () => void): boolean => {
    if (!currentUser) {
      if (callback) {
        pendingAuthCallback.current = callback;
      }
      let cleanAction = actionName.trim();
      cleanAction = cleanAction.replace(/^⚠️\s*/, '');
      cleanAction = cleanAction.replace(/\s*uchun\s+iltimos,\s*tizimga\s*kiring!?$/i, '').trim();
      const msg = `⚠️ ${cleanAction} uchun iltimos, tizimga kiring!`;
      setAuthErrorBanner(msg);
      setIsLoginModalOpen(true);
      return false;
    }
    if (callback) callback();
    return true;
  };

  const [userRegion, setUserRegion] = useState<string>(() => {
    try {
      return localStorage.getItem('yaqintop_user_region') || '';
    } catch {
      return '';
    }
  });

  const [userDistrict, setUserDistrict] = useState<string>(() => {
    try {
      return localStorage.getItem('yaqintop_user_district') || '';
    } catch {
      return '';
    }
  });

  const isUserRegionChosen = Boolean(userRegion && userRegion !== 'Barcha viloyatlar');

  const [selectedLocationName, setSelectedLocationName] = useState<string>(() => {
    try {
      const savedReg = localStorage.getItem('yaqintop_user_region');
      const savedDist = localStorage.getItem('yaqintop_user_district');
      const savedName = localStorage.getItem('yaqintop_location_name');
      if (savedReg) {
        return savedName || (savedDist ? `${savedReg}, ${savedDist}` : savedReg);
      }
      return '';
    } catch {
      return '';
    }
  });

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(() => {
    try {
      const saved = localStorage.getItem('yaqintop_user_location');
      return saved ? JSON.parse(saved) : { lat: 41.311081, lng: 69.240562 };
    } catch {
      return { lat: 41.311081, lng: 69.240562 };
    }
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [view, setView] = useState<'landing' | 'search' | 'detail' | 'route' | 'hub' | 'products' | 'product-detail'>(() => {
    if (typeof window !== 'undefined') {
      const p = (window.location.pathname || '').split('?')[0].replace(/\/+$/, '');
      if (!isLocalEnv && (p === '' || p === '/')) {
        return 'landing';
      }
    }
    return 'search';
  });
  const [activeProductParam, setActiveProductParam] = useState<string>('');
  const [hubSection, setHubSection] = useState<'favorites' | 'reviews' | 'inquiries' | 'history' | 'proposals'>('favorites');
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [mobileTab, setMobileTab] = useState<'xarita' | 'royxat'>('xarita');
  const [searchCategory, setSearchCategory] = useState<'products' | 'organizations'>('products');
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('q') || params.get('category') || '';
    }
    return '';
  });
  const [radiusM, setRadiusM] = useState(1000);
  const [openNow, setOpenNow] = useState(false);
  const [inStock, setInStock] = useState(false);
  const [freshOnly, setFreshOnly] = useState(false);
  const [selectedSort, setSelectedSort] = useState<'relevance' | 'distance' | 'price'>('relevance');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const mobileCategoriesScrollRef = useRef<HTMLDivElement>(null);

  const [results, setResults] = useState<StoreSearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<StoreSearchResult | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [selectedProductModalItem, setSelectedProductModalItem] = useState<StoreSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const nearbyRequest = useRef<AbortController | null>(null);

  // Nearby Stores State (When search query is empty)
  const [nearbyStores, setNearbyStores] = useState<any[]>(() => {
    try {
      const reg = localStorage.getItem('yaqintop_user_region');
      if (reg) {
        return getMemoryCachedCatalog('stores:' + reg) || [];
      }
    } catch {}
    return [];
  });
  const [selectedNearbyStore, setSelectedNearbyStore] = useState<any | null>(null);

  // Active Store Catalog in Detail View
  const [activeStoreDetail, setActiveStoreDetail] = useState<any | null>(null);
  const [activeStoreOffers, setActiveStoreOffers] = useState<Offer[]>([]);
  const [storeOffersLoading, setStoreOffersLoading] = useState(false);
  const [storeProductSearch, setStoreProductSearch] = useState('');
  const [storeSelectedCategory, setStoreSelectedCategory] = useState('ALL');

  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const routeDataRef = useRef<RouteResponse | null>(null);
  const [routeMode, setRouteMode] = useState<'walking' | 'driving'>('walking');

  // Modals
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);

  // Review & Report Form states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reportReason, setReportReason] = useState('WRONG_PRICE');
  const [reportDetails, setReportDetails] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStoreCreated = (newStore: any) => {
    setIsAddStoreModalOpen(false);
    showToast(`"${newStore.name}" muvaffaqiyatli qo‘shildi va xaritaga joylashtirildi!`);

    const normalizedStore = {
      store: {
        id: newStore.id,
        name: newStore.name,
        type: newStore.type,
        address: newStore.address,
        phone: newStore.phone,
        location: {
          lat: Number(newStore.latitude),
          lng: Number(newStore.longitude),
        },
        rating: 5.0,
        ratingCount: 1,
        reviewCount: 0,
        photoUrl: newStore.photoUrl,
        hours: newStore.hours || [],
        offersCount: (newStore.offers || []).length
      },
      distanceM: 0,
      isOpenNow: true
    };

    setNearbyStores(prev => [normalizedStore, ...prev.filter(s => (s.store?.id || s.id) !== newStore.id)]);

    if (newStore.latitude && newStore.longitude) {
      setUserLocation({
        lat: Number(newStore.latitude),
        lng: Number(newStore.longitude)
      });
      setSelectedNearbyStore(normalizedStore);
    }
  };

  const handleSelectLocation = (loc: { lat: number; lng: number; name: string; region?: string; district?: string }) => {
    setUserLocation({ lat: loc.lat, lng: loc.lng });
    setSelectedLocationName(loc.name);
    const chosenRegion = loc.region || '';
    const cleanDist = (loc.district && loc.district !== 'Barcha tumanlar' && loc.district !== 'Viloyat markazi') ? loc.district : '';

    setUserRegion(chosenRegion);
    setUserDistrict(cleanDist);

    setSearchQuery('');
    setResults([]);
    setSelectedResult(null);
    setSelectedNearbyStore(null);
    try {
      localStorage.setItem('yaqintop_user_location', JSON.stringify({ lat: loc.lat, lng: loc.lng }));
      localStorage.setItem('yaqintop_location_name', loc.name);
      if (chosenRegion) {
        localStorage.setItem('yaqintop_user_region', chosenRegion);
      }
      if (cleanDist) {
        localStorage.setItem('yaqintop_user_district', cleanDist);
      } else {
        localStorage.removeItem('yaqintop_user_district');
      }
    } catch (e) {
      console.error(e);
    }

    // Immediately load all organizations of the chosen region
    loadNearbyStores({ lat: loc.lat, lng: loc.lng }, '', chosenRegion);

    showToast(`Hudud o‘zgartirildi: ${loc.name}`);
    if (view !== 'search') {
      navigateTo('/');
    }
  };

  // Keep the regional list independent of GPS, sorting and opening-hours filters.
  const loadNearbyStores = async (
    loc?: { lat: number; lng: number },
    queryStr?: string,
    regionOverride?: string,
    refresh = false
  ) => {
    const effectiveRegion = regionOverride !== undefined ? regionOverride : (userRegion || (() => {
      try {
        return localStorage.getItem('yaqintop_user_region') || '';
      } catch {
        return '';
      }
    })());
    nearbyRequest.current?.abort();
    if (!effectiveRegion) {
      nearbyRequest.current = null;
      setNearbyStores([]);
      return;
    }

    const origin = latLng(loc?.lat ?? userLocation.lat, loc?.lng ?? userLocation.lng);
    const targetQuery = queryStr !== undefined ? queryStr : (searchCategory === 'organizations' ? searchQuery.trim() : '');
    const params = new URLSearchParams({ region: effectiveRegion, radiusM: '0' });
    if (targetQuery) params.set('q', targetQuery);
    const url = apiUrl(`/api/v1/stores?${params}`);
    const controller = new AbortController();
    nearbyRequest.current = controller;
    try {
      const fetchStores = async (): Promise<NearbyStoreItem[]> => {
        const response = await fetch(url, targetQuery ? { signal: controller.signal } : undefined);
        if (!response.ok) throw new Error(`Map stores HTTP ${response.status}`);
        const { items } = await response.json();
        if (!Array.isArray(items)) throw new Error('Invalid map stores response');
        return items.map(item => {
          const store = item.store ?? item;
          const location = store.location ?? {
            lat: Number(store.latitude ?? store.lat),
            lng: Number(store.longitude ?? store.lng),
          };
          return { ...item, store: { ...store, location } };
        });
      };
      const cacheKey = `stores:${effectiveRegion}`;
      const list = targetQuery ? await fetchStores() : await loadMapList(cacheKey, fetchStores, refresh, STORES_CACHE_MAX_AGE);
      if (controller.signal.aborted) return;

      const time = Object.fromEntries(uzbekistanTime.formatToParts(new Date()).map(({ type, value }) => [type, value]));
      const day = weekdays.indexOf(time.weekday);
      const minutes = Number(time.hour) * 60 + Number(time.minute);
      const items = list.map(item => {
        const store = item.store;
        const coordinates = getStoreLatLng(store);
        const distanceM = coordinates ? Math.round(origin.distanceTo(coordinates)) : item.distanceM;
        const hours = store.hours?.find(hour => hour.dayOfWeek === day);
        let isOpenNow = !store.hours?.length;
        if (hours && !hours.isClosed) {
          const opens = timeInMinutes(hours.openTime);
          const closes = timeInMinutes(hours.closeTime);
          isOpenNow = closes < opens ? minutes >= opens || minutes < closes : minutes >= opens && minutes <= closes;
        }
        return { ...item, distanceM, isOpenNow };
      }).filter(item => !openNow || item.isOpenNow);
      items.sort((a, b) => {
        const rating = selectedSort === 'relevance' ? (b.store.rating ?? 4.5) - (a.store.rating ?? 4.5) : 0;
        return rating || a.distanceM - b.distanceM;
      });
      setNearbyStores(items);
    } catch (err) {
      if (!controller.signal.aborted) console.error('Error fetching nearby stores:', err);
    } finally {
      if (nearbyRequest.current === controller) nearbyRequest.current = null;
    }
  };

  // Fetch full store details and all products/services
  const loadStoreCatalog = async (storeId: string) => {
    setStoreOffersLoading(true);
    setActiveStoreOffers([]);
    try {
      const cleanId = storeId.startsWith('/') ? storeId.slice(1) : storeId;

      if (cleanId.startsWith('gameclub-') || cleanId.includes('gameclub') || cleanId.includes('game-club')) {
        if (!activeStoreDetail || activeStoreDetail.id !== cleanId) {
          try {
            const clubs = await loadMapCatalog('gameClubs');
            if (clubs.length > 0) {
              const found = clubs.find((c: any) => c.id === cleanId || cleanId.includes(c.id) || c.id.includes(cleanId));
              if (found) {
                setActiveStoreDetail(found);
                setSelectedNearbyStore({
                  store: found,
                  organization: { name: found.name || found.organizationName || 'Game Club', type: 'GAME_CLUB' },
                  distanceM: 0,
                  isOpenNow: true,
                  offersCount: 6
                });
                setSelectedResult({
                  store: found,
                  distanceM: 0,
                  isOpenNow: true,
                  bestOffer: {
                    id: `off-pc-${found.id}`,
                    storeId: found.id,
                    price: '12000',
                    stockOnHand: 30,
                    freshness: 'FRESH',
                    status: 'ACTIVE',
                    variant: {
                      id: `v-pc-${found.id}`,
                      title: 'Kompyuter zali (Standart — Core i5, RTX 3060, 165Hz)',
                      brand: 'PC Gaming',
                      category: 'PC Gaming',
                      packUnit: 'soat'
                    }
                  } as any,
                  otherMatchingOfferCount: 5,
                  similarProducts: []
                } as any);
              }
            }
          } catch (e) {
            console.error('Error fetching game club detail:', e);
          }
        }
        setStoreOffersLoading(false);
        setActiveStoreOffers([
          {
            id: `off-pc-${cleanId}`,
            storeId: cleanId,
            price: '12000',
            stockOnHand: 30,
            freshness: 'FRESH',
            status: 'ACTIVE',
            variant: {
              id: `v-pc-${cleanId}`,
              title: 'Kompyuter zali (Standart — Core i5, RTX 3060, 165Hz)',
              brand: 'PC Gaming',
              category: 'PC Gaming',
              packSize: '1 soat',
              packUnit: 'soat',
              photoUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
              description: '165Hz professional monitor, mexanik klaviatura, quloqchin va yuqori tezlikdagi optik internet.'
            }
          },
          {
            id: `off-vip-${cleanId}`,
            storeId: cleanId,
            price: '18000',
            stockOnHand: 10,
            freshness: 'FRESH',
            status: 'ACTIVE',
            variant: {
              id: `v-vip-${cleanId}`,
              title: 'VIP Kiber Arena (Core i7, RTX 4070, 240Hz, DXRacer)',
              brand: 'Cyber Arena',
              category: 'VIP Kiber Arena',
              packSize: '1 soat',
              packUnit: 'soat',
              photoUrl: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=600&auto=format&fit=crop&q=80',
              description: 'Shaxsiy konditsionerli VIP xona, 240Hz 2K monitor, professional geymer kreslosi.'
            }
          },
          {
            id: `off-ps5-${cleanId}`,
            storeId: cleanId,
            price: '25000',
            stockOnHand: 6,
            freshness: 'FRESH',
            status: 'ACTIVE',
            variant: {
              id: `v-ps5-${cleanId}`,
              title: 'PlayStation 5 (4K TV 65", DualSense 2 ta, FIFA 25 / UFC 5 / Mortal Kombat 1)',
              brand: 'Sony PlayStation',
              category: 'PlayStation',
              packSize: '1 soat',
              packUnit: 'soat',
              photoUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80',
              description: 'Keng divanlar, 65 dyuymli 4K TV, 2 dona DualSense geympad va barcha yangi o‘yinlar.'
            }
          },
          {
            id: `off-ps4-${cleanId}`,
            storeId: cleanId,
            price: '15000',
            stockOnHand: 8,
            freshness: 'FRESH',
            status: 'ACTIVE',
            variant: {
              id: `v-ps4-${cleanId}`,
              title: 'PlayStation 4 Pro (DualShock 2 ta, PES / FIFA)',
              brand: 'Sony PlayStation',
              category: 'PlayStation',
              packSize: '1 soat',
              packUnit: 'soat',
              photoUrl: 'https://images.unsplash.com/photo-1507457379470-08b800bebc67?w=600&auto=format&fit=crop&q=80',
              description: 'Do‘stlar bilan futbol musobaqalarini o‘tkazish uchun qulay zal.'
            }
          },
          {
            id: `off-coke-${cleanId}`,
            storeId: cleanId,
            price: '8000',
            stockOnHand: 60,
            freshness: 'FRESH',
            status: 'ACTIVE',
            variant: {
              id: `v-coke-${cleanId}`,
              title: 'Coca-Cola 0.5L (Muzdek)',
              brand: 'Coca-Cola',
              category: 'Ichimliklar & Fast Food',
              packSize: '0.5 litr',
              packUnit: 'dona',
              photoUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80'
            }
          },
          {
            id: `off-snack-${cleanId}`,
            storeId: cleanId,
            price: '15000',
            stockOnHand: 40,
            freshness: 'FRESH',
            status: 'ACTIVE',
            variant: {
              id: `v-snack-${cleanId}`,
              title: 'Gamer Sandwich / Burger (Issiq)',
              brand: 'Fast Food',
              category: 'Ichimliklar & Fast Food',
              packSize: '1 dona',
              packUnit: 'dona',
              photoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80'
            }
          }
        ] as any);
        return;
      }

      if (cleanId.startsWith('uzum-') || cleanId.includes('uzum')) {
        if (!activeStoreDetail || activeStoreDetail.id !== cleanId) {
          try {
            const points = await loadMapCatalog('uzum');
            const found = points.find((p: any) => p.id === cleanId) ?? points.find((p: any) => cleanId.includes(p.id));
            if (found) {
              setActiveStoreDetail(found);
              setSelectedNearbyStore({
                store: found,
                organization: { name: found.organizationName || 'Uzum Market', type: 'RETAIL' },
                distanceM: 0,
                isOpenNow: true,
                offersCount: 2
              });
              setSelectedResult({
                store: found,
                distanceM: 0,
                isOpenNow: true,
                bestOffer: {
                  id: `off-uzum-${found.id}`,
                  storeId: found.id,
                  price: '0',
                  stockOnHand: 999,
                  freshness: 'FRESH',
                  status: 'ACTIVE',
                  variant: {
                    id: `v-uzum-${found.id}`,
                    title: 'Buyurtmalarni bepul qabul qilish (Uzum PVZ)',
                    brand: 'Uzum Market',
                    category: 'Xizmatlar',
                    packUnit: 'xizmat',
                    photoUrl: pickupServiceImage
                  }
                } as any,
                otherMatchingOfferCount: 1,
                similarProducts: []
              } as any);
            }
          } catch (e) {
            console.error('Error fetching uzum detail:', e);
          }
        }
        setStoreOffersLoading(false);
        setActiveStoreOffers([
          {
            id: `off-uzum-pickup-${cleanId}`,
            storeId: cleanId,
            price: '0',
            stockOnHand: 999,
            freshness: 'FRESH',
            status: 'ACTIVE',
            variant: {
              id: `v-uzum-pickup-${cleanId}`,
              title: 'Buyurtmalarni bepul qabul qilish (Uzum PVZ)',
              brand: 'Uzum Market',
              category: 'Xizmatlar',
              packSize: '1 buyurtma',
              packUnit: 'xizmat',
              photoUrl: pickupServiceImage,
              description: 'Uzum Market orqali xarid qilingan buyurtmalarni 24 soat ichida bepul topshirish xizmati.'
            }
          },
          {
            id: `off-uzum-return-${cleanId}`,
            storeId: cleanId,
            price: '0',
            stockOnHand: 999,
            freshness: 'FRESH',
            status: 'ACTIVE',
            variant: {
              id: `v-uzum-return-${cleanId}`,
              title: 'Tovarlarni tekshirish, kiyib ko‘rish va qaytarish',
              brand: 'Uzum Market',
              category: 'Xizmatlar',
              packSize: '1 qaytarish',
              packUnit: 'xizmat',
              photoUrl: returnServiceImage,
              description: 'Kiyib ko‘rish xonasi, tovarlarni joyida tekshirish va qulay qaytarish imkoniyati.'
            }
          }
        ] as any);
        return;
      }

      if (cleanId.startsWith('korzinka-') || cleanId.includes('korzinka')) {
        if (!activeStoreDetail || activeStoreDetail.id !== cleanId) {
          try {
            const stores = await loadMapCatalog('korzinka');
            const found = stores.find((p: any) => p.id === cleanId) ?? stores.find((p: any) => cleanId.includes(p.id) || cleanId.includes(p.originalId));
            if (found) {
              setActiveStoreDetail(found);
              setSelectedNearbyStore({
                store: found,
                organization: { name: found.organizationName || 'Korzinka', type: 'SUPERMARKET' },
                distanceM: 0,
                isOpenNow: true,
                offersCount: 269
              });
            }
          } catch (e) {
            console.error('Error fetching korzinka detail:', e);
          }
        }
        try {
          const products = await loadMapCatalog('korzinkaProducts');
          if (Array.isArray(products) && products.length > 0) {
            const offers = products.map((prod: any, idx: number) => ({
              id: `off-korzinka-${idx}-${prod.id}`,
              storeId: cleanId,
              price: String(prod.price),
              originalPrice: String(prod.originalPrice),
              stockOnHand: 50,
              freshness: 'FRESH',
              status: 'ACTIVE',
              variant: {
                id: `v-korzinka-${prod.id}`,
                title: prod.title,
                brand: 'Korzinka',
                category: prod.category || 'Supermarket',
                packSize: prod.packSize,
                packUnit: prod.packUnit || 'dona',
                photoUrl: prod.photoUrl,
                description: prod.description
              }
            }));
            setActiveStoreOffers(offers as any);
            setStoreOffersLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error fetching korzinka products:', e);
        }
      }

      const [detailRes, offersRes] = await Promise.all([
        fetch(apiUrl(`/api/v1/stores/${cleanId}`)),
        fetch(apiUrl(`/api/v1/stores/${cleanId}/offers`))
      ]);
      if (detailRes.ok) {
        const detailPayload = await detailRes.json();
        const detailData = { ...(detailPayload.store || detailPayload), organization: detailPayload.organization };
        if (!detailData.location && (detailData.latitude !== undefined || detailData.lat !== undefined)) {
          detailData.location = {
            lat: Number(detailData.latitude ?? detailData.lat),
            lng: Number(detailData.longitude ?? detailData.lng)
          };
        }
        setActiveStoreDetail(detailData);
        if (!selectedResult || selectedResult.store?.id !== storeId) {
          setSelectedResult({
            store: detailData,
            distanceM: detailData.distanceM || 200,
            isOpenNow: true,
            bestOffer: {
              id: 'default',
              storeId: detailData.id,
              price: '0',
              stockOnHand: 10,
              freshness: 'FRESH',
              status: 'ACTIVE',
              variant: {
                id: 'v-default',
                title: detailData.name,
                category: detailData.type === 'WHOLESALE' ? 'Ulgurji savdo' : 'Oziq-ovqat',
                packUnit: 'dona'
              }
            } as any,
            otherMatchingOfferCount: 0,
            similarProducts: []
          } as any);
        }
      }
      if (offersRes.ok) {
        const offersData = await offersRes.json();
        const rawOffers = Array.isArray(offersData.offers) ? offersData.offers : [];
        const seenOffers = new Set<string>();
        const uniqueOffers: any[] = [];
        for (const o of rawOffers) {
          const key = o.variantId || o.variant?.id || o.id;
          if (key && !seenOffers.has(key)) {
            seenOffers.add(key);
            uniqueOffers.push(o);
          }
        }
        setActiveStoreOffers(uniqueOffers);
      }
    } catch (err) {
      console.error('Error loading store catalog:', err);
    } finally {
      setStoreOffersLoading(false);
    }
  };

  // Format clean store URL with coordinates & slug (replaces raw UUID)
  const getStoreUrl = (store: { id: string; name?: string; location?: { lat: number; lng: number } }) => {
    if (store.id && (store.id.startsWith('gameclub-') || store.id.startsWith('uzum-') || store.id.startsWith('korzinka-'))) {
      return `/dokon/${store.id}`;
    }
    if (store.location && typeof store.location.lat === 'number' && typeof store.location.lng === 'number') {
      const lat = store.location.lat.toFixed(6);
      const lng = store.location.lng.toFixed(6);
      const slug = (store.name || 'dokon').toLowerCase().replace(/[^a-z0-9а-яёўқғҳ]+/gi, '-').replace(/^-+|-+$/g, '');
      return `/dokon/${slug}/@${lat},${lng}`;
    }
    return `/dokon/${store.id}`;
  };

  // Open product detail page
  const handleOpenProductDetail = (variantOrTitle: { id?: string; title: string }) => {
    const slug = (variantOrTitle.title || variantOrTitle.id || '')
      .toLowerCase()
      .replace(/[^a-z0-9а-яёўқғҳ]+/gi, '-')
      .replace(/^-+|-+$/g, '');
    setActiveProductParam(slug || variantOrTitle.id || '');
    setView('product-detail');
    navigateTo(`/mahsulot/${slug || variantOrTitle.id}`);
  };

  // Handler to show product availability on map
  const handleShowProductOnMap = (product: any, targetStoreId?: string) => {
    const mappedResults: StoreSearchResult[] = (product.stores || []).map((s: any) => ({
      store: {
        id: s.storeId,
        organizationId: '',
        name: s.storeName,
        inn: '',
        region: 'Toshkent shahri',
        city: 'Toshkent',
        district: s.storeDistrict,
        address: s.storeAddress,
        phone: s.storePhone || '',
        location: s.location,
        rating: s.storeRating,
        reviewCount: 10,
        isVerified: true,
        status: 'ACTIVE',
        type: s.storeType as any,
        hours: [],
        createdAt: '',
        updatedAt: ''
      },
      bestOffer: {
        id: s.offerId,
        storeId: s.storeId,
        variantId: product.id,
        price: s.price.toString(),
        minOrderQuantity: 1,
        stockOnHand: s.stockOnHand,
        stockVerifiedAt: s.stockVerifiedAt || new Date().toISOString(),
        priceUpdatedAt: new Date().toISOString(),
        freshness: 'FRESH' as any,
        status: 'ACTIVE' as any,
        wholesaleTiers: s.wholesaleTiers || [],
        version: 1,
        variant: {
          id: product.id,
          productId: product.productId,
          title: product.title,
          brand: product.brand,
          category: product.category,
          packSize: product.packSize,
          packUnit: product.packUnit,
          barcode: product.barcode,
          sku: product.sku
        }
      },
      isOpenNow: s.isOpenNow,
      distanceM: s.distanceM,
      otherMatchingOfferCount: 0,
      similarProducts: []
    }));

    setResults(mappedResults);
    setSearchCategory('products');
    setSearchQuery(product.title);
    setRadiusM(0);

    if (targetStoreId) {
      const target = mappedResults.find((r) => r.store.id === targetStoreId);
      if (target) setSelectedResult(target);
      else if (mappedResults.length > 0) setSelectedResult(mappedResults[0]);
    } else if (mappedResults.length > 0) {
      setSelectedResult(mappedResults[0]);
    }

    setView('search');
    setMobileTab('xarita');
    navigateTo('/');
    showToast(`Xaritada "${product.title}" mavjud bo‘lgan ${mappedResults.length} ta do‘kon ko‘rsatilmoqda`);
  };

  // URL Routing Sync
  const handleRoute = (path: string) => {
    const cleanPath = (path || '/').split('?')[0];
    const normalized = cleanPath === '' ? '/' : cleanPath;

    // 1. LOCAL DEV SPECIAL CASE (localhost:3000):
    // On local dev port 3000, Customer is at root '/'. If user visits '/customer', clean to '/'
    if (isLocalEnv) {
      if (normalized === '/customer' || normalized.startsWith('/customer/')) {
        const cleanTarget = normalized.replace(/^\/customer(?=\/|$)/, '') || '/';
        window.history.replaceState(null, '', cleanTarget);
        setCurrentPath(cleanTarget);
        handleRoute(cleanTarget);
        return;
      }
    }

    setCurrentPath(normalized);

    // 2. PRODUCTION ROOT (yaqintop.uz/) -> Always render Landing Page!
    if (!isLocalEnv && (normalized === '/' || normalized === '')) {
      setView('landing');
      setRouteData(null);
      if (typeof document !== 'undefined') {
        const lang = localStorage.getItem('yaqintop_lang') || 'uz';
        if (lang === 'ru') {
          document.title = 'YaqinTop — Экосистема поиска местных товаров и магазинов | Узбекистан';
        } else if (lang === 'en') {
          document.title = 'YaqinTop — Local Store & Product Search Ecosystem | Uzbekistan';
        } else {
          document.title = 'YaqinTop — Mahalliy Tovar va Xizmatlar Qidiruv Ekotizimi | O‘zbekiston';
        }
      }
      return;
    }

    // Explicit '/lending' route also renders Landing Page
    if (normalized === '/lending') {
      setView('landing');
      setRouteData(null);
      return;
    }

    // Set Customer App title
    if (typeof document !== 'undefined') {
      document.title = 'YaqinTop — Yaqiningizdagi tovarlar, xizmatlar va do‘konlar qidiruvi';
    }

    // Customer internal routes (relative to customer base)
    // On prod, path is /customer, /customer/dokon/..., etc. -> relPath is /, /dokon/..., etc.
    // On local, path is /, /dokon/..., etc. -> relPath is /, /dokon/..., etc.
    const relPath = normalized.replace(/^\/customer(?=\/|$)/, '') || '/';

    if (relPath !== '/marshrut') {
      setRouteData(null);
    }

    if (relPath === '/sevimlilar' || relPath === '/sharhlarim' || relPath === '/ariza' || relPath === '/murojaatlar' || relPath === '/tarix' || relPath === '/takliflarim' || relPath === '/takliflar') {
      if (!currentUser) {
        setAuthErrorBanner('⚠️ Shaxsiy kabinet va ma‘lumotlarni ko‘rish uchun iltimos, tizimga kiring!');
        setIsLoginModalOpen(true);
        window.history.replaceState(null, '', customerHomePath);
        setCurrentPath(customerHomePath);
        setView('search');
        return;
      }
    }

    if (relPath === '/sevimlilar') {
      setView('hub');
      setHubSection('favorites');
    } else if (relPath === '/sharhlarim') {
      setView('hub');
      setHubSection('reviews');
    } else if (relPath === '/ariza' || relPath === '/murojaatlar') {
      setView('hub');
      setHubSection('inquiries');
    } else if (relPath === '/tarix') {
      setView('hub');
      setHubSection('history');
    } else if (relPath === '/takliflarim' || relPath === '/takliflar') {
      setView('hub');
      setHubSection('proposals');
    } else if (relPath === '/marshrut') {
      if (routeData || routeDataRef.current) {
        if (!routeData && routeDataRef.current) {
          setRouteData(routeDataRef.current);
        }
        setView('route');
      } else {
        // Prevent history loop on back/forward or reload when route data is not in memory
        window.history.replaceState(null, '', customerHomePath);
        setCurrentPath(customerHomePath);
        setView('search');
      }
    } else if (relPath === '/mahsulotlar' || relPath === '/tovarlar') {
      setView('products');
    } else if (relPath.startsWith('/dokon/')) {
      const storeId = relPath.replace('/dokon/', '').trim();
      if (storeId) {
        loadStoreCatalog(storeId);
        setView('detail');
      }
    } else {
      setView('search');
    }
  };

  const navigateTo = (path: string, options?: { replace?: boolean }) => {
    let target = path;

    if (target === '/' && !isLocalEnv) {
      target = '/';
    } else if (isLocalEnv) {
      if (target === '/customer' || target === '') {
        target = '/';
      } else if (target.startsWith('/customer/')) {
        target = target.replace(/^\/customer(?=\/|$)/, '') || '/';
      }
    } else {
      // Production:
      if (target === '/customer' || target === '/customer/') {
        target = '/customer';
      } else if (
        !target.startsWith('/customer') &&
        !target.startsWith('/admin') &&
        !target.startsWith('/owner') &&
        !target.startsWith('/moderator') &&
        target !== '/' &&
        target !== '/lending'
      ) {
        target = target.startsWith('/') ? `/customer${target}` : `/customer/${target}`;
      }
    }

    if (options?.replace) {
      window.history.replaceState(null, '', target);
    } else {
      window.history.pushState(null, '', target);
    }
    handleRoute(target);
  };

  const handleStopRoute = () => {
    setRouteData(null);
    setView('search');
    window.history.replaceState(null, '', customerHomePath);
    setCurrentPath(customerHomePath);
    showToast('Marshrut rejimi to‘xtatildi');
  };

  // Preload map catalogs from persistent IndexedDB cache / network
  useEffect(() => {
    preloadMapCatalogs();
  }, []);

  // Request user's real geolocation on initial load
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          const detected = detectNearestUzbekistanLocation(coords.lat, coords.lng);
          if (detected) {
            setSelectedLocationName(detected.name);
            try {
              localStorage.setItem('yaqintop_location_name', detected.name);
            } catch (e) {
              console.error(e);
            }
          }
          try {
            localStorage.setItem('yaqintop_user_location', JSON.stringify(coords));
          } catch (e) {
            console.error(e);
          }
        },
        (err) => {
          console.warn('Geolocation access not granted or unavailable:', err);
        },
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 600000 }
      );
    }
  }, []);

  const handleLocateUser = () => {
    // Joylashuv nuqtasiga darhol qaytish va xaritani markazlashtirish
    setRecenterTrigger((prev) => prev + 1);
    setSelectedResult(null);
    setSelectedNearbyStore(null);

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      showToast('Joylashuv nuqtasiga qaytilmoqda...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          setRecenterTrigger((prev) => prev + 1);
          const detected = detectNearestUzbekistanLocation(coords.lat, coords.lng);
          if (detected) {
            setSelectedLocationName(detected.name);
            try {
              localStorage.setItem('yaqintop_location_name', detected.name);
            } catch (e) {
              console.error(e);
            }
          }
          try {
            localStorage.setItem('yaqintop_user_location', JSON.stringify(coords));
          } catch (e) {
            console.error(e);
          }
          loadNearbyStores(coords);
          showToast(`Joylashuv nuqtasiga qaytildi: ${detected?.name || ''}`);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          showToast('Joriy joylashuv nuqtasiga qaytildi');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      showToast('Joriy joylashuv nuqtasiga qaytildi');
    }
  };

  // Listen to popstate (browser back/forward button) and initial URL load
  useEffect(() => {
    handleRoute(window.location.pathname || '/');
    const onPopState = () => {
      handleRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);

    // Intercept clicks on links pointing to /customer or / for instant SPA transition
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href) return;
      if (href === '/' || href.startsWith('/customer')) {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && target.target !== '_blank') {
          if (href === '/' && isLocalEnv) return;
          e.preventDefault();
          navigateTo(href);
        }
      }
    };
    document.addEventListener('click', handleLinkClick);

    return () => {
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  // Fetch search results from API (Debounced with AbortController)
  const doSearch = async (queryStr?: string, loc?: { lat: number; lng: number }) => {
    const q = (typeof queryStr === 'string' ? queryStr : searchQuery).trim();

    if (searchCategory === 'organizations') {
      setResults([]);
      setSelectedResult(null);
      setSearchError(null);
      loadNearbyStores(loc, q);
      return;
    }

    if (!q) {
      setResults([]);
      setSelectedResult(null);
      setSearchError(null);
      loadNearbyStores(loc);
      return;
    }

    // Cancel prior in-flight search
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setIsSearching(true);
    setSearchError(null);

    const targetLoc = loc || userLocation;
    try {
      const res = await fetch(apiUrl('/api/v1/search/products'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          q,
          lat: targetLoc.lat,
          lng: targetLoc.lng,
          radiusM,
          region: userRegion || undefined,
          district: (userDistrict && userDistrict !== 'Barcha tumanlar' && userDistrict !== 'Viloyat markazi') ? userDistrict : undefined,
          openNow: openNow || undefined,
          inStock: inStock || undefined,
          freshOnly: freshOnly || undefined,
          sort: selectedSort,
          limit: 50
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Server xatoligi (${res.status})`);
      }

      const data = await res.json();
      setResults(data.items || []);
      // Do not auto-select any store on search or category selection - only when user explicitly clicks
      setSelectedResult(null);
      setSelectedNearbyStore(null);

      // Save to search history only on deliberate, non-empty queries (length >= 2)
      if (q.length >= 2) {
        try {
          const history = JSON.parse(localStorage.getItem('yaqintop_search_history') || '[]');
          const newEntry = { query: q, timestamp: new Date().toISOString() };
          const updated = [newEntry, ...history.filter((h: any) => h.query.toLowerCase() !== q.toLowerCase())].slice(0, 30);
          localStorage.setItem('yaqintop_search_history', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Ignored, new request overtook
        return;
      }
      console.error(err);
      setSearchError(err?.message || 'Qidiruvda xatolik yuz berdi. Internetni tekshirib qayta urining.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setActiveCategoryId('all');
    setSearchQuery('');
    setResults([]);
    setSelectedResult(null);
    setSearchError(null);
    loadNearbyStores();
  };

  const handleSelectCategory = (cat: typeof QUICK_CATEGORIES[0]) => {
    setActiveCategoryId(cat.id);
    setSelectedResult(null);
    setSelectedNearbyStore(null);
    if (!cat.query) {
      handleClearSearch();
    } else {
      setSearchQuery(cat.query);
      doSearch(cat.query);
    }
  };

  const isFirstSearchRef = useRef(true);

  // Debounced Search Effect (Load nearby stores on first load if no query, 350ms delay when user types)
  useEffect(() => {
    if (isFirstSearchRef.current) {
      isFirstSearchRef.current = false;
      if (searchQuery.trim()) {
        doSearch();
      } else {
        loadNearbyStores();
      }
      return;
    }

    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        doSearch();
      } else {
        setResults([]);
        setSelectedResult(null);
        loadNearbyStores();
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [userLocation, radiusM, openNow, inStock, freshOnly, selectedSort, searchQuery]);

  // Fetch route
  const fetchRoute = async (storeParam: any, mode: 'walking' | 'driving') => {
    const targetStore = storeParam?.store || storeParam || selectedResult?.store || selectedNearbyStore?.store || activeStoreDetail;
    if (!targetStore) {
      showToast('Do‘kon ma’lumotlari topilmadi');
      return;
    }

    const sLat = Number(targetStore.entranceLocation?.lat ?? targetStore.location?.lat ?? targetStore.latitude ?? targetStore.lat ?? 41.311081);
    const sLng = Number(targetStore.entranceLocation?.lng ?? targetStore.location?.lng ?? targetStore.longitude ?? targetStore.lng ?? 69.240562);

    const normalizedStore = {
      ...targetStore,
      location: { lat: sLat, lng: sLng }
    };

    // Ensure selectedResult is set so the route panel displays the store info
    const formattedResult: StoreSearchResult = {
      store: normalizedStore,
      distanceM: targetStore.distanceM || 250,
      isOpenNow: true,
      bestOffer: {
        id: 'default',
        storeId: targetStore.id,
        price: '0',
        stockOnHand: 10,
        freshness: 'FRESH',
        status: 'ACTIVE',
        variant: {
          id: 'v-default',
          title: targetStore.name,
          category: targetStore.type === 'WHOLESALE' ? 'Ulgurji' : 'Oziq-ovqat',
          packUnit: 'dona'
        }
      } as any,
      otherMatchingOfferCount: 0,
      similarProducts: []
    };
    setSelectedResult(formattedResult);
    setRouteMode(mode);

    const dest = { lat: sLat, lng: sLng };
    const origin = {
      lat: Number(userLocation?.lat ?? 41.311081),
      lng: Number(userLocation?.lng ?? 69.240562)
    };

    try {
      const res = await fetch(apiUrl('/api/v1/routes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination: dest,
          mode
        })
      });
      if (res.ok) {
        const data = await res.json();
        routeDataRef.current = data;
        setRouteData(data);
        setMobileTab('xarita');
        setView('route');
        navigateTo('/marshrut', { replace: true });
      } else {
        // Fallback local route calculation
        const straightM = Math.round(
          Math.sqrt(
            Math.pow((dest.lat - origin.lat) * 111000, 2) +
            Math.pow((dest.lng - origin.lng) * 85000, 2)
          )
        ) || 300;
        const durationSec = mode === 'walking' ? Math.round(straightM / 1.2) : Math.round(straightM / 8.3);
        const fallbackRoute: RouteResponse = {
          mode,
          distanceM: straightM,
          durationSec,
          geometry: [[origin.lng, origin.lat], [dest.lng, dest.lat]],
          steps: [],
          provider: 'local-osrm-fallback',
          isApproximateTraffic: true,
          externalMapUrl: `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&travelmode=${mode}`
        };
        routeDataRef.current = fallbackRoute;
        setRouteData(fallbackRoute);
        setMobileTab('xarita');
        setView('route');
        navigateTo('/marshrut', { replace: true });
      }
    } catch {
      // Fallback local route calculation on network error
      const straightM = Math.round(
        Math.sqrt(
          Math.pow((dest.lat - origin.lat) * 111000, 2) +
          Math.pow((dest.lng - origin.lng) * 85000, 2)
        )
      ) || 300;
      const durationSec = mode === 'walking' ? Math.round(straightM / 1.2) : Math.round(straightM / 8.3);
      const fallbackRoute: RouteResponse = {
        mode,
        distanceM: straightM,
        durationSec,
        geometry: [[origin.lng, origin.lat], [dest.lng, dest.lat]],
        steps: [],
        provider: 'local-osrm-fallback',
        isApproximateTraffic: true,
        externalMapUrl: `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&travelmode=${mode}`
      };
      routeDataRef.current = fallbackRoute;
      setRouteData(fallbackRoute);
      setMobileTab('xarita');
      setView('route');
      navigateTo('/marshrut', { replace: true });
    }
  };

  const handleSelectStore = (item: StoreSearchResult) => {
    setSelectedResult(item);
    if (item?.store?.id) {
      setSelectedNearbyStore({
        store: item.store,
        organization: (item.store as any).organization,
        distanceM: item.distanceM,
        isOpenNow: item.isOpenNow,
        offersCount: (item as any).offersCount
      });
      loadStoreCatalog(item.store.id);
    }
  };

  const handleSelectNearbyStore = (item: any) => {
    setSelectedNearbyStore(item);
    if (item?.store?.id) {
      loadStoreCatalog(item.store.id);
    }
  };

  const recordStoreView = (store: any) => {
    try {
      const viewed = JSON.parse(localStorage.getItem('yaqintop_viewed_stores') || '[]');
      const newEntry = {
        id: store.id,
        name: store.name,
        address: store.address || 'Toshkent shahri',
        rating: store.rating || 4.8,
        photoUrl: store.photoUrl,
        timestamp: new Date().toISOString()
      };
      const updated = [newEntry, ...viewed.filter((v: any) => v.id !== store.id)].slice(0, 30);
      localStorage.setItem('yaqintop_viewed_stores', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenDetail = (item: StoreSearchResult) => {
    setSelectedResult(item);
    setActiveStoreDetail(item.store);
    recordStoreView(item.store);
    setView('detail');
    const url = getStoreUrl(item.store);
    loadStoreCatalog(item.store.id);
    navigateTo(url);
  };

  const handleOpenNearbyDetail = (item: any) => {
    setSelectedNearbyStore(item);
    setActiveStoreDetail(item.store);
    recordStoreView(item.store);
    setSelectedResult({
      store: item.store,
      distanceM: item.distanceM,
      isOpenNow: item.isOpenNow,
      bestOffer: {
        id: 'default',
        storeId: item.store.id,
        price: '0',
        stockOnHand: item.offersCount || 0,
        freshness: 'FRESH',
        status: 'ACTIVE',
        variant: {
          id: 'v-default',
          title: item.store.name,
          category: (item.store.type as string) === 'WHOLESALE' ? 'Ulgurji savdo' : 'Oziq-ovqat',
          packUnit: 'dona'
        }
      } as any,
      otherMatchingOfferCount: 0,
      similarProducts: []
    } as any);
    setView('detail');
    const url = getStoreUrl(item.store);
    loadStoreCatalog(item.store.id);
    navigateTo(url);
  };

  // Filtered store catalog products
  const filteredOffers = activeStoreOffers.filter((off) => {
    const matchesSearch = !storeProductSearch.trim() ||
      off.variant.title.toLowerCase().includes(storeProductSearch.toLowerCase().trim()) ||
      (off.variant.barcode && off.variant.barcode.includes(storeProductSearch.trim()));
    const matchesCategory = storeSelectedCategory === 'ALL' || off.variant.category === storeSelectedCategory;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = Array.from(new Set(activeStoreOffers.map(o => o.variant.category).filter((c): c is string => Boolean(c))));

  // Submit review
  const handleSubmitReview = async () => {
    if (!requireAuth('Sharh va baho qoldirish')) return;
    if (!selectedResult && !selectedNearbyStore) return;
    const storeId = selectedResult?.store.id || selectedNearbyStore?.store.id;
    try {
      const res = await fetch(apiUrl(`/api/v1/stores/${storeId}/reviews`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
      });
      if (res.ok) {
        showToast('Sharhingiz qabul qilindi!');
        setIsReviewModalOpen(false);
        setReviewComment('');
        if (searchQuery.trim()) doSearch();
        else loadNearbyStores(undefined, undefined, undefined, true);
      } else {
        const err = await res.json();
        showToast(err.message || 'Xatolik yuz berdi');
      }
    } catch {
      showToast('Serverga ulanishda xatolik');
    }
  };

  // Submit report
  const handleSubmitReport = async () => {
    if (!requireAuth('Xato haqida murojaat yuborish')) return;
    if (!selectedResult && !selectedNearbyStore) return;
    const storeId = selectedResult?.store.id || selectedNearbyStore?.store.id;
    try {
      const res = await fetch(apiUrl('/api/v1/reports'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          offerId: selectedResult?.bestOffer?.id || undefined,
          reason: reportReason,
          details: reportDetails
        })
      });
      if (res.ok) {
        showToast('Xabar yuborildi. Administrator tekshirib chiqadi.');
        setIsReportModalOpen(false);
        setReportDetails('');
      }
    } catch {
      showToast('Serverga ulanishda xatolik');
    }
  };

  if (view === 'landing') {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-[#F3F8F5] dark:bg-[#111A15] flex items-center justify-center"><div className="w-8 h-8 border-3 border-[#116B50] border-t-transparent rounded-full animate-spin" /></div>}>
        <LandingApp />
      </React.Suspense>
    );
  }

  return (
    <div className={`h-screen w-screen flex flex-col font-sans antialiased overflow-hidden transition-colors ${isDarkMode ? 'dark bg-[#0E1713] text-[#E8F2EC]' : 'bg-[#F3F6F3] text-[#172C28]'}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#172C28] dark:bg-[#1E3328] text-white dark:text-[#E8F2EC] px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in fade-in border border-transparent dark:border-[#2E483A]">
          {toastMessage}
        </div>
      )}

      {/* Red Auth Guard Warning Banner for Guests */}
      {authErrorBanner && (
        <div className="bg-red-600 dark:bg-red-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold flex items-center justify-between gap-2 shadow-lg z-40 animate-in slide-in-from-top duration-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-300" />
            <span className="line-clamp-2 leading-snug">{authErrorBanner}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => {
                setAuthErrorBanner(null);
                setIsLoginModalOpen(true);
              }}
              className="px-2.5 sm:px-3 py-1 bg-white text-red-700 rounded-lg text-[11px] sm:text-xs font-extrabold hover:bg-red-50 transition shadow whitespace-nowrap cursor-pointer"
            >
              Tizimga kirish
            </button>
            <button
              onClick={() => setAuthErrorBanner(null)}
              className="p-1 hover:bg-red-800 rounded transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header - Map-First Compact Redesign */}
      <CustomerHeader
        selectedLocationName={selectedLocationName}
        isRegionChosen={isUserRegionChosen}
        onOpenLocationPicker={() => setIsLocationModalOpen(true)}
        onOpenAddStore={() => requireAuth('Tashkilot yoki do‘kon qo‘shish', () => setIsAddStoreModalOpen(true))}
        onNavigateHome={() => {
          setSearchQuery('');
          setSelectedResult(null);
          setSelectedNearbyStore(null);
          navigateTo(customerHomePath);
        }}
        onNavigate={navigateTo}
        currentView={view}
        hubSection={hubSection}
        isLocalEnv={isLocalEnv}
        deferredPrompt={deferredPrompt}
        isAppInstalled={isAppInstalled}
        onInstallClick={handleInstallClick}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenLogin={() => {
          setAuthErrorBanner(null);
          setIsLoginModalOpen(true);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 relative overflow-hidden h-[calc(100dvh-56px)] md:h-[calc(100dvh-50px)] w-full">
        {view === 'hub' ? (
          <React.Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-[#F3F6F3] dark:bg-[#0E1713]"><div className="w-8 h-8 border-3 border-[#087F5B] border-t-transparent rounded-full animate-spin" /></div>}>
            <UserPersonalHubView
              activeSection={hubSection}
              onNavigateSection={(sec) => {
                setHubSection(sec);
                const pathToMap: Record<string, string> = {
                  favorites: '/sevimlilar',
                  reviews: '/sharhlarim',
                  proposals: '/takliflarim',
                  inquiries: '/ariza',
                  history: '/tarix'
                };
                navigateTo(pathToMap[sec] || '/sevimlilar');
              }}
              onBackToSearch={() => navigateTo(customerHomePath)}
              onOpenStore={(storeId) => {
                loadStoreCatalog(storeId);
                navigateTo(`/dokon/${storeId}`);
              }}
              onGetRoute={(store) => {
                fetchRoute(store, 'walking');
              }}
              onSearchQuery={(q) => {
                setSearchQuery(q);
                navigateTo(customerHomePath);
                doSearch(q);
              }}
              isDarkMode={isDarkMode}
              currentUser={currentUser}
              onShowToast={showToast}
            />
          </React.Suspense>
        ) : view === 'detail' && (selectedResult || selectedNearbyStore || activeStoreDetail) ? (
          <React.Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-[#F3F6F3] dark:bg-[#0E1713]"><div className="w-8 h-8 border-3 border-[#087F5B] border-t-transparent rounded-full animate-spin" /></div>}>
            <StoreFullPageView
              store={selectedResult?.store || selectedNearbyStore?.store || activeStoreDetail}
              organization={activeStoreDetail?.organization || selectedNearbyStore?.organization || (selectedResult?.store as any)?.organization}
              offers={activeStoreOffers}
              loadingOffers={storeOffersLoading}
              isDarkMode={isDarkMode}
              userLocation={userLocation}
              matchedOffer={selectedResult?.bestOffer?.id !== 'default' ? selectedResult?.bestOffer : null}
              currentUser={currentUser}
              onRequireAuth={(msg) => requireAuth(msg || 'Ushbu amalni bajarish')}
              onBack={() => navigateTo(customerHomePath)}
              onGetRoute={(mode) => fetchRoute((selectedResult?.store || selectedNearbyStore?.store || activeStoreDetail), mode)}
              onReportError={() => requireAuth('Murojaat yuborish', () => setIsReportModalOpen(true))}
              onShowToast={showToast}
            />
          </React.Suspense>
        ) : (
          <div className="relative flex-1 w-full h-full overflow-hidden md:bg-[#F8FAFC] md:dark:bg-[#0B130E]">
            <div className="w-full h-full md:max-w-[1400px] md:mx-auto md:p-3 lg:p-3.5 md:flex md:gap-3.5 md:items-stretch overflow-hidden">
              {/* Desktop Left Sidebar: Location, Categories, Search, Filters & Results List */}
              <DesktopSearchSidebar
                selectedLocationName={selectedLocationName}
                isRegionChosen={isUserRegionChosen}
                onOpenLocationPicker={() => setIsLocationModalOpen(true)}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onSearch={(q) => doSearch(q)}
                onClearSearch={handleClearSearch}
                radiusM={radiusM}
                onRadiusChange={(r) => {
                  setRadiusM(r);
                  if (searchQuery.trim()) {
                    doSearch(searchQuery);
                  } else {
                    loadNearbyStores();
                  }
                }}
                onOpenFilter={() => setIsFilterModalOpen(true)}
                results={results}
                nearbyStores={nearbyStores}
                selectedResult={selectedResult}
                selectedNearbyStore={selectedNearbyStore}
                onSelectStore={handleSelectStore}
                onSelectNearbyStore={handleSelectNearbyStore}
                onOpenStore={(storeId) => {
                  loadStoreCatalog(storeId);
                  navigateTo(`/dokon/${storeId}`);
                }}
                onGetRoute={(store) => {
                  fetchRoute(store, routeMode);
                }}
                onOpenProductModal={(item) => setSelectedProductModalItem(item)}
                isLoading={isSearching}
                onLocateUser={handleLocateUser}
                view={view}
                routeData={routeData}
                routeMode={routeMode}
                onChangeRouteMode={(mode) => {
                  setRouteMode(mode);
                  const storeToRoute = selectedResult?.store || selectedNearbyStore?.store || activeStoreDetail;
                  if (storeToRoute) fetchRoute(storeToRoute, mode);
                }}
                onStopRoute={handleStopRoute}
                activeCategoryId={activeCategoryId}
                onSelectCategory={setActiveCategoryId}
              />

              {/* Map Column: Compact rounded card on Desktop; Full-screen on Mobile */}
              <div className="relative flex-1 min-w-0 w-full h-full md:rounded-3xl md:border md:border-[#CBD5E1] md:dark:border-[#273B32] md:shadow-md md:overflow-hidden">
                {/* Mobile Top Search Bar & Categories (<768px) */}
                {view === 'search' && (
                  <div className="md:hidden absolute top-2.5 left-2.5 right-2.5 z-20 pointer-events-auto flex flex-col gap-2">
                    {/* Row 1: Location Pill + Main Search Pill */}
                    <div className="flex items-center gap-1.5 w-full">
                      {/* Location Pill */}
                      <button
                        type="button"
                        onClick={() => setIsLocationModalOpen(true)}
                        className={`h-11 px-2.5 rounded-full shadow-md flex items-center gap-1 text-xs font-bold shrink-0 active:scale-95 transition cursor-pointer ${
                          !isUserRegionChosen
                            ? 'border-2 border-red-500 bg-red-50 dark:bg-red-950/60 text-red-700 ring-2 ring-red-400 animate-pulse'
                            : 'bg-white dark:bg-[#14201A] border border-[#CBD5E1] dark:border-[#273B32] text-[#087F5B] dark:text-[#4ADE80]'
                        }`}
                        title="Hududni tanlash"
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          !isUserRegionChosen ? 'bg-red-100 text-red-600' : 'bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80]'
                        }`}>
                          <MapPin className="w-3 h-3" />
                        </div>
                        <span className={`max-w-[48px] min-[390px]:max-w-[62px] truncate ${!isUserRegionChosen ? 'font-black text-red-700' : ''}`}>
                          {!isUserRegionChosen ? 'Tanlang!' : (selectedLocationName.split(',')[0] || 'Tanlang')}
                        </span>
                      </button>

                      {/* Main Search Pill */}
                      <div className="flex-1 min-w-0 h-11 flex items-center gap-1.5 p-1 pl-1 pr-1.5 rounded-full bg-white dark:bg-[#14201A] border-2 border-[#CBD5E1] dark:border-[#2E4237] shadow-md focus-within:border-[#087F5B] transition-all">
                        <button
                          type="button"
                          onClick={() => doSearch()}
                          className="w-8 h-8 rounded-full bg-[#087F5B] hover:bg-[#065F46] active:scale-95 text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
                          title="Qidirish"
                        >
                          <Search className={`w-3.5 h-3.5 text-white stroke-[2.5] ${isSearching ? 'animate-spin' : ''}`} />
                        </button>

                        <div className="flex-1 flex flex-col justify-center min-w-0 px-1">
                          <div className="relative flex items-center mt-0.5 min-w-0 w-full">
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                              placeholder="Tovar yoki mahsulot nomini yozing..."
                              className="w-full min-w-0 bg-transparent text-xs font-medium text-[#1E293B] dark:text-white placeholder:text-[#64748B] dark:placeholder:text-[#94A3B8] focus:outline-none pr-4 leading-tight truncate"
                            />
                            {searchQuery && (
                              <button
                                onClick={handleClearSearch}
                                className="absolute right-0 text-[#94A3B8] hover:text-red-500 p-0.5"
                                title="Tozalash"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setIsFilterModalOpen(true)}
                          className="w-7 h-7 rounded-full bg-[#F1F5F9] dark:bg-[#1E2D25] text-[#64748B] dark:text-[#94A3B8] hover:text-[#172B26] dark:hover:text-white flex items-center justify-center shrink-0 active:scale-95 transition cursor-pointer"
                          title="Filtrlar"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2]" />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Categories Scroll Row (with smooth scroll + arrows) */}
                    <div className="relative flex items-center px-1.5 py-2 sm:py-2.5 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md rounded-2xl shadow-md border border-[#CBD5E1]/80 dark:border-[#273B32]/80">
                      {/* Scroll Left Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (mobileCategoriesScrollRef.current) {
                            const w = mobileCategoriesScrollRef.current.clientWidth;
                            mobileCategoriesScrollRef.current.scrollBy({ left: -w, behavior: 'smooth' });
                          }
                        }}
                        className="w-5.5 h-5.5 rounded-full bg-white dark:bg-[#1A2822] border border-[#CBD5E1] dark:border-[#2E4237] text-[#566A63] hover:text-[#087F5B] flex items-center justify-center shrink-0 shadow-2xs cursor-pointer mr-0.5 select-none active:scale-90"
                        title="Oldingi"
                        aria-label="Oldingi"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      {/* Scrollable Container */}
                      <div
                        ref={mobileCategoriesScrollRef}
                        className="flex-1 overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-1 py-1 snap-x snap-mandatory"
                      >
                        {QUICK_CATEGORIES.map((cat) => {
                          const isSelected = activeCategoryId === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleSelectCategory(cat)}
                              className="flex flex-col items-center gap-1 shrink-0 basis-[calc((100%-18px)/6)] min-w-0 snap-start group cursor-pointer transition select-none active:scale-95"
                              title={cat.name}
                            >
                              <div
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base transition-all duration-150 ${
                                  isSelected
                                    ? 'bg-[#E8F5EE] dark:bg-[#1E362A] border-2 border-[#087F5B] shadow-2xs scale-105'
                                    : 'bg-[#F8FAFC] dark:bg-[#1A2822] border border-[#CBD5E1] dark:border-[#2E4237] shadow-2xs'
                                }`}
                              >
                                <span className="leading-none">{cat.icon}</span>
                              </div>
                              <span
                                className={`text-[9.5px] leading-tight text-center truncate w-full px-0.5 ${
                                  isSelected
                                    ? 'font-extrabold text-[#087F5B] dark:text-[#4ADE80]'
                                    : 'font-medium text-[#566A63] dark:text-[#94A3B8]'
                                }`}
                              >
                                {cat.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Scroll Right Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (mobileCategoriesScrollRef.current) {
                            const w = mobileCategoriesScrollRef.current.clientWidth;
                            mobileCategoriesScrollRef.current.scrollBy({ left: w, behavior: 'smooth' });
                          }
                        }}
                        className="w-5.5 h-5.5 rounded-full bg-white dark:bg-[#1A2822] border border-[#CBD5E1] dark:border-[#2E4237] text-[#566A63] hover:text-[#087F5B] flex items-center justify-center shrink-0 shadow-2xs cursor-pointer ml-0.5 select-none active:scale-90"
                        title="Keyingi"
                        aria-label="Keyingi"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Main Interactive Map - Dominant full-size element */}
                <InteractiveMap
                  userLocation={userLocation}
                  radiusM={radiusM}
                  locationName={selectedLocationName}
                  userRegion={userRegion}
                  userDistrict={userDistrict}
                  results={results}
                  nearbyStores={nearbyStores}
                  selectedResult={selectedResult}
                  selectedNearbyStore={selectedNearbyStore}
                  routeTargetName={selectedResult?.store?.name || selectedNearbyStore?.store?.name || activeStoreDetail?.name}
                  routeTargetAddress={selectedResult?.store?.address || selectedNearbyStore?.store?.address || activeStoreDetail?.address}
                  onSelectStore={handleSelectStore}
                  onSelectNearbyStore={handleSelectNearbyStore}
                  onOpenDetail={handleOpenDetail}
                  onOpenProduct={(v) => handleOpenProductDetail(v)}
                  onOpenProductModal={(item) => setSelectedProductModalItem(item)}
                  onOpenNearbyDetail={handleOpenNearbyDetail}
                  onNavigate={(item) => fetchRoute(item.store, routeMode)}
                  onCancelRoute={handleStopRoute}
                  routeData={routeData}
                  routeMode={routeMode}
                  onChangeRouteMode={(mode) => {
                    setRouteMode(mode);
                    const storeToRoute = selectedResult?.store || selectedNearbyStore?.store || activeStoreDetail;
                    if (storeToRoute) {
                      fetchRoute(storeToRoute, mode);
                    }
                  }}
                  view={view}
                  isDarkMode={isDarkMode}
                  recenterTrigger={recenterTrigger}
                  onLocationChange={(lat, lng) => {
                    setUserLocation({ lat, lng });
                    const detected = detectNearestUzbekistanLocation(lat, lng);
                    if (detected) {
                      setSelectedLocationName(detected.name);
                      try {
                        localStorage.setItem('yaqintop_location_name', detected.name);
                        localStorage.setItem('yaqintop_user_location', JSON.stringify({ lat, lng }));
                      } catch (e) {
                        console.error(e);
                      }
                    }
                  }}
                  onToast={showToast}
                />

                {/* Mobile Draggable Bottom Sheet (<768px) */}
                {view === 'search' && (
                  <MobileBottomSheet
                    items={results}
                    selectedItem={selectedResult}
                    onSelectItem={(item) => {
                      handleSelectStore(item);
                    }}
                    onOpenStore={(storeId) => {
                      loadStoreCatalog(storeId);
                      navigateTo(`/dokon/${storeId}`);
                    }}
                    onGetRoute={(store) => {
                      fetchRoute(store, routeMode);
                    }}
                    searchQuery={searchQuery}
                    onClearSearch={handleClearSearch}
                    onSearchQuery={(q) => {
                      setSearchQuery(q);
                      doSearch(q);
                    }}
                    onOpenProductModal={(item) => setSelectedProductModalItem(item)}
                    locationName={selectedLocationName}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden h-16 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md border-t border-[#DCE5DF] dark:border-[#22332C] flex items-center justify-around fixed bottom-0 left-0 right-0 z-40 px-1 shadow-lg">
        <a
          href={isLocalEnv ? 'http://localhost:3003' : '/'}
          onClick={(e) => {
            if (!isLocalEnv) {
              e.preventDefault();
              navigateTo('/');
            }
          }}
          className="flex-1 py-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95] hover:text-[#116B50] dark:hover:text-[#4ADE80] min-w-0"
          title="Lending sahifasiga o‘tish"
        >
          <Compass className="w-5 h-5 text-[#116B50] dark:text-[#4ADE80]" />
          <span>Lending</span>
        </a>

        <button
          onClick={() => {
            if (view === 'route') {
              handleStopRoute();
            } else if (view !== 'search') {
              navigateTo(customerHomePath);
              setMobileTab('xarita');
            } else {
              setMobileTab(mobileTab === 'xarita' ? 'royxat' : 'xarita');
            }
          }}
          className={`flex-1 py-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold min-w-0 ${
            view === 'search' || view === 'route'
              ? 'text-[#116B50] dark:text-[#4ADE80]'
              : 'text-[#566A63] dark:text-[#8B9E95]'
          }`}
        >
          {view === 'search' && mobileTab === 'royxat' ? (
            <>
              <MapPin className="w-5 h-5" />
              <span>Xarita</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Izlash</span>
            </>
          )}
        </button>

        <button
          onClick={() => requireAuth('Tashkilot yoki do‘kon qo‘shish', () => setIsAddStoreModalOpen(true))}
          className="flex-1 py-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-[#116B50] dark:text-[#4ADE80] min-w-0 active:scale-95 transition-transform"
          title="Tashkilot yoki do‘kon qo‘shish"
        >
          <div className="w-6 h-6 rounded-full bg-[#116B50] text-white flex items-center justify-center shadow-sm">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span>+ Qo‘shish</span>
        </button>

        <button
          onClick={() => navigateTo('/sevimlilar')}
          className={`flex-1 py-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold min-w-0 ${
            view === 'hub' && hubSection === 'favorites'
              ? 'text-[#116B50] dark:text-[#4ADE80]'
              : 'text-[#566A63] dark:text-[#8B9E95]'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span>Sevimlilar</span>
        </button>

        <button
          onClick={() => navigateTo('/ariza')}
          className={`flex-1 py-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold min-w-0 ${
            view === 'hub' && hubSection === 'inquiries'
              ? 'text-[#116B50] dark:text-[#4ADE80]'
              : 'text-[#566A63] dark:text-[#8B9E95]'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          <span>Arizalar</span>
        </button>

        <button
          onClick={() => navigateTo('/tarix')}
          className={`flex-1 py-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold min-w-0 ${
            view === 'hub' && hubSection === 'history'
              ? 'text-[#116B50] dark:text-[#4ADE80]'
              : 'text-[#566A63] dark:text-[#8B9E95]'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span>Tarix</span>
        </button>

        <button
          onClick={() => {
            if (currentUser) setIsProfileModalOpen(true);
            else setIsLoginModalOpen(true);
          }}
          className="flex-1 py-1 min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95] min-w-0"
        >
          <div className="w-5 h-5 rounded-full bg-[#116B50] text-white text-[9px] font-bold flex items-center justify-center">
            {currentUser?.fullName ? currentUser.fullName[0].toUpperCase() : '○'}
          </div>
          <span>Profil</span>
        </button>
      </nav>

      {/* MODALS */}
      {/* 1. Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Sharh yozish"
        maxWidth="max-w-[460px]"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsReviewModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" onClick={handleSubmitReview} className="bg-[#087F5B] hover:bg-[#065F46] border-none text-white">
              Yuborish
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 px-0.5">
          <div>
            <label className="text-xs font-semibold text-[#566A63] block mb-1">Baho</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className={`text-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer ${star <= reviewRating ? 'text-[#F5A623]' : 'text-[#DCE5DF]'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#566A63] block mb-1">Fikringiz</label>
            <textarea
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Do‘kondagi tovar narxi, xizmat ko‘rsatish va holat haqida yozing (kamida 10 ta belgi)..."
              className="w-full p-3 border border-[#DCE5DF] dark:border-[#2A3F36] hover:border-[#087F5B]/60 rounded-xl text-sm bg-white dark:bg-[#16241E] text-[#172B26] dark:text-[#E8F2EC] focus:outline-none focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/20 transition-all"
            />
          </div>
        </div>
      </Modal>

      {/* 2. Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={t('cust_error_report_title', 'Xato haqida xabar')}
        maxWidth="max-w-[460px]"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsReportModalOpen(false)}>
              {t('cancel', 'Bekor qilish')}
            </Button>
            <Button variant="primary" onClick={handleSubmitReport} className="bg-[#087F5B] hover:bg-[#065F46] border-none text-white">
              {t('cust_send_report', 'Xabar yuborish')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 px-0.5">
          <div>
            <label className="text-xs font-semibold text-[#566A63] block mb-1">Muammo turi</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#CBD5E1] dark:border-[#273B32] hover:border-[#087F5B]/60 rounded-xl text-sm font-semibold text-[#172B26] dark:text-[#E8F2EC] focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/20 outline-none transition-all cursor-pointer"
            >
              <option value="WRONG_PRICE">Narx noto‘g‘ri (kassada boshqa narx)</option>
              <option value="UNAVAILABLE_PRODUCT">Mahsulot do‘konda yo‘q</option>
              <option value="WRONG_LOCATION">Lokatsiya yoki kirish joyi xato</option>
              <option value="CLOSED_STORE">Do‘kon yopiq yoki ishlamayapti</option>
              <option value="WRONG_HOURS">Ish vaqti noto‘g‘ri ko‘rsatilgan</option>
              <option value="OTHER">Boshqa masala</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#566A63] block mb-1">Batafsil izoh</label>
            <textarea
              rows={3}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Muammo haqida aniqroq ma’lumot bering..."
              className="w-full p-3 border border-[#DCE5DF] dark:border-[#2A3F36] hover:border-[#087F5B]/60 rounded-xl text-sm bg-white dark:bg-[#16241E] text-[#172B26] dark:text-[#E8F2EC] focus:outline-none focus:border-[#087F5B] focus:ring-2 focus:ring-[#087F5B]/20 transition-all"
            />
          </div>
        </div>
      </Modal>

      {/* 3. User Profile Modal */}
      <UnifiedUserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onLogout={() => {
          void clearSessionCache();
          setCurrentUser(null);
          showToast('Tizimdan muvaffaqiyatli chiqildi');
          setIsProfileModalOpen(false);
          setIsLoginModalOpen(true);
        }}
        onLoginPrompt={() => {
          setIsProfileModalOpen(false);
          setIsLoginModalOpen(true);
        }}
        onUserUpdated={(updated) => {
          setCurrentUser(updated);
        }}
      />

      {/* Product Quick Detail Modal with Similar Products */}
      <ProductQuickDetailModal
        isOpen={!!selectedProductModalItem}
        item={selectedProductModalItem}
        onClose={() => setSelectedProductModalItem(null)}
        onOpenStorePage={(store) => handleOpenDetail({ store } as any)}
        onNavigateRoute={(store) => fetchRoute(store, routeMode)}
        onSearchQuery={(q) => {
          setSearchQuery(q);
          doSearch(q);
        }}
        onBookmarkProduct={(title) => {
          showToast(`"${title}" kuzatuvga olindi. Narx yoki qoldiq o‘zgarganda xabar beramiz.`);
        }}
      />

      {/* 4. Login Modal */}
      <UnifiedLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          pendingAuthCallback.current = null;
        }}
        appTitle="YaqinTop Xaridor"
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Xush kelibsiz, ${user.fullName}!`);
          if (pendingAuthCallback.current) {
            const cb = pendingAuthCallback.current;
            pendingAuthCallback.current = null;
            setTimeout(() => {
              cb();
            }, 100);
          }
        }}
      />

      {/* 4. Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Qidiruv filtrlari va radiusi"
        maxWidth="max-w-[480px]"
        footer={
          <div className="flex gap-2 w-full">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setRadiusM(1000);
                setOpenNow(false);
                setInStock(false);
                setFreshOnly(false);
                setSelectedSort('relevance');
                setIsFilterModalOpen(false);
                if (searchQuery.trim()) {
                  doSearch();
                } else {
                  loadNearbyStores();
                }
              }}
            >
              Tozalash
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setIsFilterModalOpen(false);
                if (searchQuery.trim()) {
                  doSearch();
                } else {
                  loadNearbyStores();
                }
              }}
            >
              Qo‘llash
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Radius Selection */}
          <div className="bg-[#F9FAF9] dark:bg-[#1A2822] p-3.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[#566A63] dark:text-[#8B9E95] font-medium">Qidiruv radiusi:</span>
              <strong className="text-sm text-[#116B50] dark:text-[#4ADE80] font-bold">
                {radiusM >= 1000 ? `${(radiusM / 1000).toFixed(1)} km` : `${radiusM} m`}
              </strong>
            </div>
            <input
              type="range"
              min="50"
              max="3000"
              step="50"
              value={radiusM}
              onChange={(e) => setRadiusM(Number(e.target.value))}
              className="w-full accent-[#116B50] dark:accent-[#4ADE80] cursor-pointer"
            />
            <div className="flex justify-between gap-1 mt-2">
              {[100, 500, 1000, 3000].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusM(r)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border ${
                    radiusM === r
                      ? 'bg-[#116B50] dark:bg-[#4ADE80] text-white dark:text-[#0E1713] border-[#116B50] dark:border-[#4ADE80] font-bold'
                      : 'bg-white dark:bg-[#14201A] text-[#566A63] dark:text-[#8B9E95] border-[#DCE5DF] dark:border-[#2A3F36]'
                  }`}
                >
                  {r >= 1000 ? `${r / 1000} km` : `${r} m`}
                </button>
              ))}
            </div>
          </div>

          {/* Sort selection */}
          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1.5">
              Saralash tartibi
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'distance', label: "Yaqinlik bo'yicha" },
                { value: 'price', label: 'Arzonroq' },
                { value: 'relevance', label: 'Reytingi yuqori' }
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSelectedSort(s.value as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center border cursor-pointer ${
                    selectedSort === s.value
                      ? 'bg-[#E8F5EE] dark:bg-[#1E362A] text-[#087F5B] dark:text-[#4ADE80] border-[#087F5B] shadow-2xs'
                      : 'bg-white dark:bg-[#16241E] text-[#64748B] dark:text-[#8B9E95] border-[#CBD5E1] dark:border-[#273B32] hover:bg-slate-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-[#DCE5DF] dark:border-[#2A3F36]">
            <label className="flex items-center gap-2.5 text-sm font-medium text-[#172C28] dark:text-[#E8F2EC] cursor-pointer">
              <input
                type="checkbox"
                checked={openNow}
                onChange={(e) => setOpenNow(e.target.checked)}
                className="w-4 h-4 accent-[#116B50]"
              />
              Faqat hozir ochiq do‘konlar
            </label>
            <label className="flex items-center gap-2.5 text-sm font-medium text-[#172C28] dark:text-[#E8F2EC] cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 accent-[#116B50]"
              />
              Faqat tovar qoldig‘i mavjud do‘konlar
            </label>
            <label className="flex items-center gap-2.5 text-sm font-medium text-[#172C28] dark:text-[#E8F2EC] cursor-pointer">
              <input
                type="checkbox"
                checked={freshOnly}
                onChange={(e) => setFreshOnly(e.target.checked)}
                className="w-4 h-4 accent-[#116B50]"
              />
              Faqat yangi ma’lumot (24 soat ichida tekshirilgan)
            </label>
          </div>
        </div>
      </Modal>

      {/* Uzbekistan Region & District Picker Modal */}
      <UzbekistanRegionPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        selectedLocation={userLocation}
        onSelectLocation={handleSelectLocation}
      />

      {/* Add Store / Organization / Service Modal */}
      <AddStoreModal
        isOpen={isAddStoreModalOpen}
        onClose={() => setIsAddStoreModalOpen(false)}
        onStoreCreated={handleStoreCreated}
        currentUser={currentUser}
        userLocation={userLocation}
        initialRegion={userRegion}
        initialDistrict={userDistrict}
        onToast={showToast}
      />

      {/* Global Token Quick Login (Ctrl + Alt + T) */}
      <TokenQuickLoginModal apiBaseUrl={apiUrl('')} />
    </div>
  );
}
