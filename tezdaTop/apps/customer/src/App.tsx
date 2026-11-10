import { useCachedSession, clearSessionCache, TokenQuickLoginModal, LanguageSwitcher, useTranslation } from '@yaqintop/ui';
import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Clock,
  Phone,
  Bookmark,
  Share2,
  Navigation,
  ArrowLeft,
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
  SlidersHorizontal
} from 'lucide-react';
import { Button, Tag, Modal, StarRating, YaqinTopLogo } from '@yaqintop/ui';
import { StoreSearchResult, RouteResponse, Offer, Store } from '@yaqintop/contracts';
import { CustomerHeader } from './components/CustomerHeader';
import { SearchToolbar } from './components/SearchToolbar';
import { ResultsDrawer, ResultsDrawerTrigger } from './components/ResultsDrawer';
import { SearchStatusBar } from './components/SearchStatusBar';
import { MobileBottomSheet } from './components/MobileBottomSheet';
import { InteractiveMap } from './components/InteractiveMap';
import { StoreFullPageView } from './components/StoreFullPageView';
import { UserPersonalHubView } from './components/UserPersonalHubView';
import { UnifiedUserProfileModal } from './components/UnifiedUserProfileModal';
import { UnifiedLoginModal } from './components/UnifiedLoginModal';
import { ProductsCatalogView, CatalogProduct } from './components/ProductsCatalogView';
import { ProductDetailPageView, DetailedProduct, AlternativeProduct } from './components/ProductDetailPageView';
import { UzbekistanRegionPickerModal, detectNearestUzbekistanLocation } from './components/UzbekistanRegionPickerModal';
import { ProductQuickDetailModal } from './components/ProductQuickDetailModal';
import { OrganizationSidebarShowcase } from './components/OrganizationSidebarShowcase';
import { getStoreBannerImage } from './utils/store-images';
import { apiUrl } from './config/api.js';
const LandingApp = React.lazy(() => import('@yaqintop/landing-app').then(m => ({ default: m.LandingApp })));
import { getProductThumbnail, DEFAULT_PRODUCT_THUMBNAIL } from './utils/product-thumbnails';

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

  const requireAuth = (actionName = 'ushbu amalni bajarish', callback?: () => void): boolean => {
    if (!currentUser) {
      const msg = actionName.startsWith('⚠️') ? actionName : `⚠️ ${actionName} uchun iltimos, tizimga kiring!`;
      setAuthErrorBanner(msg);
      setIsLoginModalOpen(true);
      return false;
    }
    if (callback) callback();
    return true;
  };

  const [selectedLocationName, setSelectedLocationName] = useState<string>(() => {
    try {
      return localStorage.getItem('yaqintop_location_name') || 'Toshkent, Yunusobod';
    } catch {
      return 'Toshkent, Yunusobod';
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

  const [results, setResults] = useState<StoreSearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<StoreSearchResult | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [selectedProductModalItem, setSelectedProductModalItem] = useState<StoreSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Nearby Stores State (When search query is empty)
  const [nearbyStores, setNearbyStores] = useState<any[]>([]);
  const [selectedNearbyStore, setSelectedNearbyStore] = useState<any | null>(null);

  // Active Store Catalog in Detail View
  const [activeStoreDetail, setActiveStoreDetail] = useState<any | null>(null);
  const [activeStoreOffers, setActiveStoreOffers] = useState<Offer[]>([]);
  const [storeOffersLoading, setStoreOffersLoading] = useState(false);
  const [storeProductSearch, setStoreProductSearch] = useState('');
  const [storeSelectedCategory, setStoreSelectedCategory] = useState('ALL');

  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const routeDataRef = useRef<RouteResponse | null>(null);
  const [routeMode, setRouteMode] = useState<'walking' | 'driving'>('walking');

  // Modals
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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

  const handleSelectLocation = (loc: { lat: number; lng: number; name: string }) => {
    setUserLocation({ lat: loc.lat, lng: loc.lng });
    setSelectedLocationName(loc.name);
    setSearchQuery('');
    setResults([]);
    setSelectedResult(null);
    setNearbyStores([]);
    setSelectedNearbyStore(null);
    try {
      localStorage.setItem('yaqintop_user_location', JSON.stringify({ lat: loc.lat, lng: loc.lng }));
      localStorage.setItem('yaqintop_location_name', loc.name);
    } catch (e) {
      console.error(e);
    }
    showToast(`Hudud o‘zgartirildi: ${loc.name}`);
    if (view !== 'search') {
      navigateTo('/');
    }
  };

  // Fetch all nearby stores or search organizations
  const loadNearbyStores = async (loc?: { lat: number; lng: number }, queryStr?: string) => {
    try {
      const uLat = loc?.lat ?? userLocation?.lat ?? 41.311081;
      const uLng = loc?.lng ?? userLocation?.lng ?? 69.240562;
      const targetQuery = queryStr !== undefined ? queryStr : (searchCategory === 'organizations' ? searchQuery.trim() : '');
      const queryParam = targetQuery ? `&q=${encodeURIComponent(targetQuery)}` : '';
      const radiusParam = radiusM ? `&radiusM=${radiusM}` : '&radiusM=0';
      const res = await fetch(apiUrl(`/api/v1/stores?lat=${uLat}&lng=${uLng}${radiusParam}${openNow ? '&openNow=true' : ''}${queryParam}`));
      if (res.ok) {
        const data = await res.json();
        const items = (data.items || []).map((item: any) => {
          const store = item.store || item;
          if (!store.location && (store.latitude !== undefined || store.lat !== undefined)) {
            store.location = {
              lat: Number(store.latitude ?? store.lat),
              lng: Number(store.longitude ?? store.lng)
            };
          }
          return item;
        });
        setNearbyStores(items);
        // Do not auto-select store on load, only when user clicks pin or chooses one
      }
    } catch (err) {
      console.error('Error fetching nearby stores:', err);
    }
  };

  // Fetch full store details and all products/services
  const loadStoreCatalog = async (storeId: string) => {
    setStoreOffersLoading(true);
    setActiveStoreOffers([]);
    try {
      const cleanId = storeId.startsWith('/') ? storeId.slice(1) : storeId;
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
  const handleShowProductOnMap = (product: CatalogProduct, targetStoreId?: string) => {
    const mappedResults: StoreSearchResult[] = product.stores.map((s) => ({
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
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, []);

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
          openNow: openNow || undefined,
          inStock: inStock || undefined,
          freshOnly: freshOnly || undefined,
          sort: selectedSort,
          limit: 20
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Server xatoligi (${res.status})`);
      }

      const data = await res.json();
      setResults(data.items || []);
      if (data.items && data.items.length > 0) {
        setSelectedResult(data.items[0]);
      } else {
        setSelectedResult(null);
      }

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
    setSearchQuery('');
    setResults([]);
    setSelectedResult(null);
    setSearchError(null);
    doSearch('');
  };

  // Debounced Search Effect (350ms delay prevents excessive per-character API hammering)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchCategory === 'organizations') {
        setResults([]);
        setSelectedResult(null);
        loadNearbyStores(undefined, searchQuery.trim());
      } else if (searchQuery.trim()) {
        doSearch();
      } else {
        setResults([]);
        setSelectedResult(null);
        loadNearbyStores();
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [userLocation, radiusM, openNow, inStock, freshOnly, selectedSort, searchQuery, searchCategory]);

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
        else loadNearbyStores();
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
        <div className="bg-red-600 dark:bg-red-700 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-lg z-40 animate-in slide-in-from-top duration-200 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce text-yellow-300" />
            <span>{authErrorBanner}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAuthErrorBanner(null);
                setIsLoginModalOpen(true);
              }}
              className="px-3 py-1 bg-white text-red-700 rounded-lg text-xs font-extrabold hover:bg-red-50 transition shadow"
            >
              Tizimga kirish
            </button>
            <button
              onClick={() => setAuthErrorBanner(null)}
              className="p-1 hover:bg-red-800 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header - Map-First Compact Redesign */}
      <CustomerHeader
        selectedLocationName={selectedLocationName}
        onOpenLocationPicker={() => setIsLocationModalOpen(true)}
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
      <main className="flex-1 relative overflow-hidden h-[calc(100dvh-60px)] w-full">
        {view === 'hub' ? (
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
        ) : view === 'detail' && (selectedResult || selectedNearbyStore || activeStoreDetail) ? (
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
        ) : (
          <div className="relative flex-1 w-full h-full overflow-hidden">
            {/* Desktop Left Results Drawer */}
            {view === 'search' && (
              <ResultsDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onOpen={() => setIsDrawerOpen(true)}
                searchQuery={searchQuery}
                locationName={selectedLocationName}
                items={results.length > 0 ? results : nearbyStores}
                selectedItem={selectedResult || selectedNearbyStore}
                onSelectItem={(item) => {
                  if (item.store && item.bestOffer) {
                    handleSelectStore(item);
                  } else {
                    handleSelectNearbyStore(item);
                  }
                }}
                onOpenStore={(storeId) => {
                  loadStoreCatalog(storeId);
                  navigateTo(`/dokon/${storeId}`);
                }}
                onGetRoute={(store) => {
                  fetchRoute(store, routeMode);
                }}
                onClearSearch={handleClearSearch}
                isLoading={isSearching}
              />
            )}

            {/* Top Floating Bar: Reopen Trigger + SearchToolbar in single flex container (NEVER overlaps) */}
            {view === 'search' && (
              <div
                className={`flex absolute top-3 sm:top-4 z-20 items-center gap-2 sm:gap-2.5 transition-all duration-300 pointer-events-none left-3 sm:left-4 right-3 sm:right-16 md:right-20 ${
                  isDrawerOpen ? 'md:left-[388px] lg:left-[408px]' : ''
                }`}
              >
                {!isDrawerOpen && (
                  <div className="pointer-events-auto shrink-0 hidden md:block">
                    <ResultsDrawerTrigger
                      count={(results.length > 0 ? results : nearbyStores).length}
                      onOpen={() => setIsDrawerOpen(true)}
                    />
                  </div>
                )}

                <div className="pointer-events-auto min-w-0 flex-1 max-w-full">
                  <SearchToolbar
                    selectedLocationName={selectedLocationName}
                    onOpenLocationPicker={() => setIsLocationModalOpen(true)}
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    onSearch={(q) => doSearch(q)}
                    onClearSearch={handleClearSearch}
                    radiusM={radiusM}
                    onRadiusChange={(r) => {
                      setRadiusM(r);
                      doSearch(searchQuery);
                    }}
                    selectedSort={selectedSort}
                    onSortChange={(s) => {
                      setSelectedSort(s);
                      doSearch(searchQuery);
                    }}
                    isSearching={isSearching}
                    isDrawerOpen={isDrawerOpen}
                    onOpenFilter={() => setIsFilterModalOpen(true)}
                  />
                </div>
              </div>
            )}

            {/* Desktop Bottom Status Bar */}
            {view === 'search' && (
              <SearchStatusBar
                totalResults={(results.length > 0 ? results : nearbyStores).length}
                radiusM={radiusM}
                searchQuery={searchQuery}
                locationName={selectedLocationName}
                isDrawerOpen={isDrawerOpen}
                onClearSearch={handleClearSearch}
                onOpenDrawer={() => setIsDrawerOpen(true)}
              />
            )}

            {/* Mobile Top Search Bar (<768px) - Matching Pill Reference */}
            {view === 'search' && (
              <div className="md:hidden absolute top-3 left-3 right-3 z-20 pointer-events-auto flex items-center gap-2">
                {/* Location Pill */}
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="h-12 px-3 rounded-full bg-white dark:bg-[#14201A] border border-[#CBD5E1] dark:border-[#273B32] shadow-md flex items-center gap-1.5 text-[#087F5B] dark:text-[#4ADE80] text-xs font-bold shrink-0 active:scale-95 transition"
                  title="Hududni tanlash"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="max-w-[65px] truncate">{selectedLocationName.split(',')[0]}</span>
                </button>

                {/* Main Search Pill matching Reference */}
                <div className="flex-1 flex items-center gap-2 p-1 pl-1.5 pr-1.5 rounded-full bg-white dark:bg-[#14201A] border-2 border-[#CBD5E1] dark:border-[#2E4237] shadow-md focus-within:border-[#087F5B] transition-all">
                  <button
                    type="button"
                    onClick={() => doSearch()}
                    className="w-10 h-10 rounded-full bg-[#087F5B] active:scale-95 text-white flex items-center justify-center shrink-0 shadow-xs"
                    title="Qidirish"
                  >
                    <Search className={`w-4 h-4 text-white stroke-[2.5] ${isSearching ? 'animate-spin' : ''}`} />
                  </button>

                  <div className="flex-1 flex flex-col justify-center min-w-0 px-1">
                    <span className="text-[10px] font-black text-[#1E293B] dark:text-[#E2E8F0] tracking-wider uppercase leading-none truncate">
                      QAYSI MAHSULOT YOKI XIZMAT?
                    </span>
                    <div className="relative flex items-center mt-0.5">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                        placeholder="Masalan: Burger, lavash, dorixona"
                        className="w-full bg-transparent text-xs font-medium text-[#1E293B] dark:text-white placeholder:text-[#64748B] dark:placeholder:text-[#94A3B8] focus:outline-none pr-5 leading-tight"
                      />
                      {searchQuery && (
                        <button
                          onClick={handleClearSearch}
                          className="absolute right-0 text-[#94A3B8] hover:text-red-500 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsFilterModalOpen(true)}
                    className="w-9 h-9 rounded-2xl bg-[#F1F5F9] dark:bg-[#1E2D25] text-[#64748B] dark:text-[#94A3B8] hover:text-[#172B26] dark:hover:text-white flex items-center justify-center shrink-0 active:scale-95 transition"
                    title="Filtrlar"
                  >
                    <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
                  </button>
                </div>
              </div>
            )}

            {/* ROUTE VIEW Panel (Floating on Desktop & Mobile) */}
            {view === 'route' && (
              <div className="absolute top-4 left-4 z-20 w-[380px] max-w-[calc(100vw-32px)] bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md rounded-3xl shadow-2xl border border-[#E2E8F0] dark:border-[#273B32] p-5 flex flex-col gap-4 max-h-[calc(100vh-100px)] overflow-y-auto">
                <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/40 p-3 rounded-2xl border border-red-200 dark:border-red-900/50">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                    <span className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]">Marshrut rejimi faol</span>
                  </div>

                  <button
                    onClick={handleStopRoute}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                    title="Marshrutni to‘xtatish"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>To‘xtatish</span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#172C28] dark:text-white">Do‘konga yo‘l</h1>
                    {(selectedResult?.store || selectedNearbyStore?.store) && (
                      <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5 line-clamp-1">
                        {(selectedResult?.store || selectedNearbyStore?.store)?.name} · {(selectedResult?.store || selectedNearbyStore?.store)?.address}
                      </p>
                    )}
                  </div>
                </div>

                {/* Walking / Driving Selector */}
                <div className="flex gap-2 p-1 bg-[#F3F6F3] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36]">
                  <button
                    onClick={() => {
                      setRouteMode('walking');
                      const targetStore = selectedResult?.store || selectedNearbyStore?.store || activeStoreDetail;
                      if (targetStore) fetchRoute(targetStore, 'walking');
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                      routeMode === 'walking'
                        ? 'bg-[#087F5B] text-white shadow-sm'
                        : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                    }`}
                  >
                    🚶 Piyoda
                  </button>
                  <button
                    onClick={() => {
                      setRouteMode('driving');
                      const targetStore = selectedResult?.store || selectedNearbyStore?.store || activeStoreDetail;
                      if (targetStore) fetchRoute(targetStore, 'driving');
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                      routeMode === 'driving'
                        ? 'bg-[#087F5B] text-white shadow-sm'
                        : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                    }`}
                  >
                    🚗 Avtomobil
                  </button>
                </div>

                {routeData ? (
                  <>
                    {/* Route Summary */}
                    <div className="bg-[#E8F5EE] dark:bg-[#183324] p-4 rounded-2xl border border-[#087F5B]/20">
                      <span className="text-[11px] font-bold text-[#087F5B] dark:text-[#4ADE80] uppercase tracking-wider">
                        Marshrut hisobi
                      </span>
                      <div className="text-2xl font-extrabold text-[#172C28] dark:text-white mt-1">
                        {Math.round(routeData.durationSec / 60) || 1} daqiqa{' '}
                        <span className="text-sm font-normal text-[#566A63] dark:text-[#8B9E95]">
                          · ${routeData.distanceM >= 1000 ? `${(routeData.distanceM / 1000).toFixed(1)} km` : `${routeData.distanceM} m`}
                        </span>
                      </div>
                      <div className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                        {routeMode === 'walking' ? 'Piyoda yurish tezligi bo‘yicha' : 'Avtomobil harakati bo‘yicha'} · Aniq marshrut
                      </div>
                    </div>

                    {routeData.externalMapUrl && (
                      <a
                        href={routeData.externalMapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full"
                      >
                        <Button variant="primary" fullWidth className="font-bold py-2.5 bg-[#087F5B] hover:bg-[#065F46]">
                          <ExternalLink className="w-4 h-4 mr-2" /> Tashqi xaritada ochish (Google / Yandex)
                        </Button>
                      </a>
                    )}

                    {/* Stop Route Action Button */}
                    <button
                      onClick={handleStopRoute}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs font-bold transition shadow-sm cursor-pointer active:scale-[0.99]"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Marshrutni yakunlash</span>
                    </button>
                  </>
                ) : (
                  <div className="p-8 text-center text-xs text-[#566A63] dark:text-[#8B9E95] flex flex-col items-center gap-3 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-2xl border border-dashed border-[#DCE5DF] dark:border-[#2A3F36]">
                    <div className="w-6 h-6 border-2 border-[#087F5B] border-t-transparent rounded-full animate-spin" />
                    <span>Marshrut hisoblanmoqda...</span>
                  </div>
                )}
              </div>
            )}

            {/* Main Interactive Map - Dominant full-size element */}
            <InteractiveMap
              userLocation={userLocation}
              radiusM={radiusM}
              locationName={selectedLocationName}
              results={results}
              nearbyStores={nearbyStores}
              selectedResult={selectedResult}
              selectedNearbyStore={selectedNearbyStore}
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
                items={results.length > 0 ? results : nearbyStores}
                selectedItem={selectedResult || selectedNearbyStore}
                onSelectItem={(item) => {
                  if (item.store && item.bestOffer) {
                    handleSelectStore(item);
                  } else {
                    handleSelectNearbyStore(item);
                  }
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
                locationName={selectedLocationName}
              />
            )}
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
        onClose={() => setIsLoginModalOpen(false)}
        appTitle="YaqinTop Xaridor"
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Xush kelibsiz, ${user.fullName}!`);
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
                doSearch();
              }}
            >
              Tozalash
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setIsFilterModalOpen(false);
                doSearch();
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

      {/* Global Token Quick Login (Ctrl + Alt + T) */}
      <TokenQuickLoginModal apiBaseUrl={apiUrl('')} />
    </div>
  );
}
