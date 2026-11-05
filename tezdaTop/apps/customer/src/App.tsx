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
  Store as StoreIcon
} from 'lucide-react';
import { Button, Tag, Modal, StarRating, YaqinTopLogo } from '@yaqintop/ui';
import { StoreSearchResult, RouteResponse, Offer, Store } from '@yaqintop/contracts';
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

      {/* Top Header */}
      <header className="h-[58px] sm:h-[68px] bg-white dark:bg-[#14201A] border-b border-[#DCE5DF] dark:border-[#22332C] px-3 sm:px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div
            onClick={() => {
              setSearchQuery('');
              setSelectedResult(null);
              setSelectedNearbyStore(null);
              navigateTo(customerHomePath);
            }}
            className="flex items-center gap-1.5 cursor-pointer select-none shrink-0 group"
            title="Qidiruv bosh sahifasiga qaytish"
          >
            <YaqinTopLogo className="w-8 h-8 rounded-xl shadow-2xs shrink-0 group-hover:scale-105 transition" />
            <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-[#172C28] dark:text-white hidden min-[420px]:inline">
              YaqinTop
            </span>
          </div>

          {/* Uzbekistan Region & District Selector Trigger */}
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#DCE5DF] dark:border-[#263D33] text-xs font-semibold text-[#116B50] dark:text-[#4ADE80] bg-[#F3F8F5] dark:bg-[#162720] hover:bg-[#E2EFE7] dark:hover:bg-[#1E362C] rounded-xl transition cursor-pointer group shadow-2xs max-w-[135px] min-[360px]:max-w-[155px] sm:max-w-[190px] shrink-1"
            title="Hududni o‘zgartirish (O‘zbekiston viloyatlari va tumanlari)"
          >
            <MapPin className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0 group-hover:scale-110 transition-transform" />
            <span className="truncate">{selectedLocationName}</span>
            <ChevronDown className="w-3 h-3 text-[#566A63] dark:text-[#8B9E95] group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] shrink-0 transition-transform group-hover:translate-y-0.5" />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 ml-4">
            <a
              href={isLocalEnv ? 'http://localhost:3003' : '/'}
              onClick={(e) => {
                if (!isLocalEnv) {
                  e.preventDefault();
                  navigateTo('/');
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 text-[#566A63] dark:text-[#8B9E95] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822] hover:text-[#116B50] dark:hover:text-[#4ADE80]"
              title="Lending sahifasiga o‘tish"
            >
              <Compass className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
              <span>{t('landing', 'Lending')}</span>
            </a>

            <button
              onClick={() => navigateTo('/sevimlilar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                view === 'hub' && hubSection === 'favorites'
                  ? 'bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]'
                  : 'text-[#566A63] dark:text-[#8B9E95] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822]'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>{t('favorites', 'Sevimlilar')}</span>
            </button>

            <button
              onClick={() => navigateTo('/sharhlarim')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                view === 'hub' && hubSection === 'reviews'
                  ? 'bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]'
                  : 'text-[#566A63] dark:text-[#8B9E95] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{t('reviews', 'Sharhlarim')}</span>
            </button>

            <button
              onClick={() => navigateTo('/takliflarim')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                view === 'hub' && hubSection === 'proposals'
                  ? 'bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]'
                  : 'text-[#566A63] dark:text-[#8B9E95] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('proposals', 'Takliflarim')}</span>
            </button>

            <button
              onClick={() => navigateTo('/ariza')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                view === 'hub' && hubSection === 'inquiries'
                  ? 'bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]'
                  : 'text-[#566A63] dark:text-[#8B9E95] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t('inquiries_nav', 'Arizalar & Murojaatlar')}</span>
            </button>

            <button
              onClick={() => navigateTo('/tarix')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                view === 'hub' && hubSection === 'history'
                  ? 'bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]'
                  : 'text-[#566A63] dark:text-[#8B9E95] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t('history', 'Tarix')}</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-1.5">
          {/* PWA Install Button (Appears when mobile browser allows install) */}
          {deferredPrompt && !isAppInstalled && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#116B50] hover:bg-[#0E5842] text-white text-xs font-bold transition shadow-sm shrink-0 cursor-pointer"
              title="YaqinTop ilovasini telefoningizga o‘rnatish"
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">{t('install', 'O‘rnatish')}</span>
            </button>
          )}

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? "Yorug' tema" : "Qorong'i tema"}
            className="w-9 h-9 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#EDF5F0] dark:hover:bg-[#1E3328] transition flex items-center justify-center shadow-2xs shrink-0"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#116B50]" />}
          </button>

          {/* User Profile / Guest Button */}
          {currentUser ? (
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#EDF5F0] dark:hover:bg-[#1E3328] transition text-xs font-bold shadow-2xs shrink-0"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#116B50] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'US'}
              </div>
              <span className="hidden sm:inline">{currentUser.fullName.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setAuthErrorBanner(null);
                setIsLoginModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
              title="Tizimga kirish"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>{t('login', 'Kirish')}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col md:flex-row relative overflow-hidden h-[calc(100vh-58px)] sm:h-[calc(100vh-68px)]">
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
          <>
            {/* Left Column / Mobile Results */}
            <section
              className={`w-full md:w-[480px] lg:w-[520px] xl:w-[560px] shrink-0 bg-white dark:bg-[#14201A] border-r border-[#DCE5DF] dark:border-[#22332C] flex flex-col overflow-y-auto h-full ${
                (mobileTab === 'xarita' && view === 'search') || view === 'route' ? 'hidden md:flex' : 'flex'
              }`}
            >
          {view === 'search' && (
            <div className="p-4 sm:p-5 flex flex-col gap-4 pb-28 md:pb-8">
              {/* Mobile Switch Back to Map Header Bar */}
              <div className="md:hidden flex items-center justify-between p-2.5 bg-[#E0EFE7] dark:bg-[#1A3328] border border-[#116B50]/20 rounded-2xl">
                <div className="flex items-center gap-2">
                  <StoreIcon className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                  <span className="text-xs font-bold text-[#172C28] dark:text-white">
                    {results.length > 0 ? `${results.length} ${t('results_count', 'ta natija')}` : `${nearbyStores.length} ${t('nearby_count', 'ta yaqin do‘kon')}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileTab('xarita')}
                  className="px-3 py-1.5 rounded-xl bg-[#116B50] hover:bg-[#0D533E] active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{t('map', 'Xarita')}</span>
                </button>
              </div>

              {/* Search Mode Switcher Tabs */}
              <div className="flex p-1 bg-[#EAEFEA] dark:bg-[#1A2822] rounded-2xl gap-1 border border-[#DCE5DF] dark:border-[#263D33]">
                <button
                  type="button"
                  onClick={() => {
                    setSearchCategory('products');
                    setSearchQuery('');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    searchCategory === 'products'
                      ? 'bg-white dark:bg-[#16241E] text-[#116B50] dark:text-[#4ADE80] shadow-xs'
                      : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{t('cust_search_products', 'Mahsulot izlash')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchCategory('organizations');
                    setSearchQuery('');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    searchCategory === 'organizations'
                      ? 'bg-white dark:bg-[#16241E] text-[#116B50] dark:text-[#4ADE80] shadow-xs'
                      : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{t('cust_search_organizations', 'Tashkilot izlash')}</span>
                </button>
              </div>

              {/* Search Box */}
              <div>
                <span className="text-[11px] font-bold text-[#116B50] dark:text-[#4ADE80] uppercase tracking-wider">
                  {t('cust_find_near', 'Yaqiningizdan toping')}
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-[#172C28] dark:text-white mt-1 mb-3">
                  {searchCategory === 'products' ? t('cust_hero_prod', 'Kerakli tovar. Yaqin do‘kon.') : t('cust_hero_org', 'Tashkilot va xizmatlar qidiruvi.')}
                </h1>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="customer-search-input"
                      type="text"
                      aria-label="Tovar, mahsulot yoki do‘kon nomini qidiring"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                      placeholder={searchCategory === 'products' ? t('cust_search_input') : `${t('name')}...`}
                      className="w-full h-11 pl-3.5 pr-8 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-sm text-[#172C28] dark:text-[#E8F2EC] focus:bg-white dark:focus:bg-[#16241E] focus:outline-none focus:ring-2 focus:ring-[#116B50]"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          doSearch('');
                        }}
                        className="absolute right-2.5 top-3 text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <Button variant="primary" onClick={() => doSearch()} aria-label="Qidirish" className="px-4 flex items-center gap-1.5 font-bold">
                    <Search className="w-4 h-4" />
                    <span>{t('search_btn', 'Izlash')}</span>
                  </Button>
                </div>
              </div>

              {/* Radius Control */}
              <div className="bg-[#F9FAF9] dark:bg-[#1A2822] p-3.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#566A63] dark:text-[#8B9E95] font-medium">{t('radius', 'Qidiruv radiusi')}:</span>
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
                      onClick={() => setRadiusM(r)}
                      className={`text-[11px] px-2.5 py-1 rounded-md border ${
                        radiusM === r
                          ? 'bg-[#116B50] dark:bg-[#4ADE80] text-white dark:text-[#0E1713] border-[#116B50] dark:border-[#4ADE80] font-bold'
                          : 'bg-white dark:bg-[#14201A] text-[#566A63] dark:text-[#8B9E95] border-[#DCE5DF] dark:border-[#2A3F36] hover:bg-[#F3F6F3] dark:hover:bg-[#1E3328]'
                      }`}
                    >
                      {r >= 1000 ? `${r / 1000} km` : `${r} m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Chips */}
              <div
                className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <button
                  onClick={() => setOpenNow(!openNow)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition ${
                    openNow
                      ? 'bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] border-[#116B50] dark:border-[#4ADE80]'
                      : 'bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] border-[#DCE5DF] dark:border-[#2A3F36]'
                  }`}
                >
                  {t('open_now', 'Hozir ochiq')}
                </button>
                <button
                  onClick={() => setInStock(!inStock)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition ${
                    inStock
                      ? 'bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] border-[#116B50] dark:border-[#4ADE80]'
                      : 'bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] border-[#DCE5DF] dark:border-[#2A3F36]'
                  }`}
                >
                  {t('in_stock', 'Mavjud')}
                </button>
                <button
                  onClick={() => setFreshOnly(!freshOnly)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition ${
                    freshOnly
                      ? 'bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] border-[#116B50] dark:border-[#4ADE80]'
                      : 'bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] border-[#DCE5DF] dark:border-[#2A3F36]'
                  }`}
                >
                  {t('fresh_only', 'Faqat yangi')}
                </button>
                <button
                  onClick={() => setIsFilterModalOpen(true)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] flex items-center gap-1 hover:bg-[#F3F6F3] dark:hover:bg-[#1E3328]"
                >
                  <Filter className="w-3 h-3" /> {t('filters', 'Filtrlar')}
                </button>
              </div>

                            {/* State 1: Active Search Loading Skeleton */}
              {isSearching ? (
                <div className="flex flex-col gap-3 mt-3 animate-pulse">
                  <div className="flex items-center gap-2 text-xs text-[#116B50] dark:text-[#4ADE80] font-semibold">
                    <span className="w-3.5 h-3.5 border-2 border-[#116B50] border-t-transparent dark:border-[#4ADE80] dark:border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Eng yaqin do‘konlar va narxlar tekshirilmoqda...</span>
                  </div>
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="p-4 rounded-2xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] flex flex-col gap-2.5">
                      <div className="h-4 bg-[#E0EFE7]/60 dark:bg-[#203328] rounded-md w-1/2" />
                      <div className="h-3 bg-[#E0EFE7]/40 dark:bg-[#1A2822] rounded-md w-1/3" />
                      <div className="h-14 bg-[#F3F8F5] dark:bg-[#1A2A22] rounded-xl w-full" />
                    </div>
                  ))}
                </div>
              ) : searchError ? (
                /* State 2: Search Error State with Retry Button */
                <div className="p-5 mt-2 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex flex-col items-center text-center gap-2.5">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  <h4 className="font-bold text-sm text-red-800 dark:text-red-200">Qidiruvda xatolik yuz berdi</h4>
                  <p className="text-xs text-red-700 dark:text-red-300 max-w-xs">{searchError}</p>
                  <Button variant="primary" size="sm" onClick={() => doSearch()} className="mt-1 font-bold text-xs">
                    Qayta urinish
                  </Button>
                </div>
              ) : selectedNearbyStore ? (
                /* State 3: Selected Organization & Products/Services Showcase */
                <OrganizationSidebarShowcase
                  selectedStoreItem={selectedNearbyStore}
                  activeStoreOffers={activeStoreOffers}
                  loadingOffers={storeOffersLoading}
                  onClose={() => {
                    setSelectedNearbyStore(null);
                    setActiveStoreOffers([]);
                  }}
                  onOpenStorePage={(store) => handleOpenNearbyDetail({ store, organization: selectedNearbyStore?.organization })}
                  onNavigateRoute={(store) => fetchRoute(store, 'walking')}
                  onSelectProduct={(offer) => {
                    const currentStore = selectedNearbyStore?.store || selectedNearbyStore;
                    const currentIsOpen = selectedNearbyStore?.isOpenNow ?? true;
                    setSelectedProductModalItem({
                      store: currentStore,
                      distanceM: selectedNearbyStore?.distanceM || 0,
                      isOpenNow: currentIsOpen,
                      bestOffer: offer,
                      otherMatchingOfferCount: 0,
                      similarProducts: activeStoreOffers.filter((o) => o.id !== offer.id).slice(0, 4)
                    });
                  }}
                />
              ) : !searchQuery.trim() ? (
                /* State 4: No search query -> Initial Clean Search Prompt + Nearby Organizations List */
                <div className="flex flex-col gap-4 mt-2">
                  {/* Popular Quick Search Tags */}
                  <div>
                    <span className="text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95] uppercase tracking-wider block mb-2">
                      Tezkor qidiruv takliflari:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Snickers', 'Coca-cola', 'Twix', 'Mars', 'Bounty', 'Non', 'Sut', 'Dori'].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            setSearchCategory('products');
                            setSearchQuery(tag);
                            doSearch(tag);
                          }}
                          className="text-xs px-3 py-1.5 rounded-xl bg-[#F3F8F5] dark:bg-[#1A2E24] border border-[#DCE5DF] dark:border-[#273D32] text-[#116B50] dark:text-[#4ADE80] font-semibold hover:bg-[#E0EFE7] dark:hover:bg-[#234234] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Search className="w-3 h-3 opacity-70" />
                          <span>{tag}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nearby Organizations List */}
                  {nearbyStores.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95] uppercase tracking-wider">
                          Yaqindagi do‘kon va tashkilotlar ({nearbyStores.length})
                        </span>
                        <span className="text-[10px] text-[#116B50] dark:text-[#4ADE80] font-bold">
                          {radiusM >= 1000 ? `${(radiusM / 1000).toFixed(1)} km` : `${radiusM} m`} radiusda
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {nearbyStores.map((item) => {
                          const store = item.store || item;
                          const org = item.organization;
                          const bannerImg = getStoreBannerImage(store, org);
                          const distText =
                            item.distanceM === 0
                              ? 'Siz turgan joyda'
                              : item.distanceM >= 1000
                              ? `${(item.distanceM / 1000).toFixed(1)} km`
                              : `${item.distanceM} m`;

                          return (
                            <article
                              key={store.id}
                              onClick={() => handleSelectNearbyStore(item)}
                              className="p-3 rounded-2xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] hover:border-[#116B50] dark:hover:border-[#4ADE80] transition-all cursor-pointer flex items-center gap-3 group shadow-2xs"
                            >
                              <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#1A2822] border border-[#DCE5DF]/60 dark:border-[#273B32]">
                                <img
                                  src={bannerImg}
                                  alt={store.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80';
                                  }}
                                />
                                <span className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#16241E] ${
                                  item.isOpenNow ? 'bg-emerald-500' : 'bg-red-500'
                                }`} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] uppercase tracking-wider">
                                    {store.type === 'WHOLESALE' ? 'Ulgurji' : store.type === 'SERVICE' ? 'Xizmat' : 'Do‘kon'}
                                  </span>
                                  <span className={`text-[10px] font-bold ${
                                    item.isOpenNow ? 'text-[#116B50] dark:text-[#4ADE80]' : 'text-red-500'
                                  }`}>
                                    {item.isOpenNow ? '● Ochiq' : '○ Yopiq'}
                                  </span>
                                </div>

                                <h4 className="font-extrabold text-sm text-[#172C28] dark:text-[#E8F2EC] truncate mt-0.5 group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] transition-colors">
                                  {org?.name || store.name}
                                </h4>

                                <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] truncate mt-0.5 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
                                  <span className="truncate">{store.address || 'Toshkent shahri'}</span>
                                </p>
                              </div>

                              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                <span className="text-[11px] font-bold text-[#116B50] dark:text-[#4ADE80] bg-[#E0EFE7]/60 dark:bg-[#1E362A] px-2 py-0.5 rounded-md">
                                  {distText}
                                </span>
                                <div className="flex items-center gap-0.5 text-xs text-amber-500 font-bold">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  <span>{store.rating || 4.8}</span>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Clean Helper Card */}
                  <div className="p-5 bg-[#F9FAF9] dark:bg-[#16241E] rounded-2xl border border-dashed border-[#DCE5DF] dark:border-[#2A3F36] text-center flex flex-col items-center gap-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#172C28] dark:text-[#E8F2EC]">
                        Qidiruvni boshlang
                      </h3>
                      <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 leading-relaxed max-w-xs">
                        Yuqoridagi maydonga kerakli tovar, mahsulot yoki do‘kon nomini yozing. Tanlangan hudud (<strong className="text-[#116B50] dark:text-[#4ADE80]">{selectedLocationName}</strong>) bo‘yicha eng yaqin do‘konlar va arzon narxlar ko‘rsatiladi.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsLocationModalOpen(true)}
                      className="mt-1 font-bold text-xs flex items-center gap-1.5 border-[#DCE5DF] dark:border-[#2A3F36]"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                      <span>Hududni almashtirish</span>
                    </Button>
                  </div>
                </div>
              ) : results.length === 0 ? (
                /* State 4: Nothing Found -> Smart suggestions + Radius Expansion */
                <div className="p-6 text-center flex flex-col items-center justify-center gap-3 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-2xl border border-dashed border-[#DCE5DF] dark:border-[#2A3F36] mt-2">
                  <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-xl">
                    📦
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#172C28] dark:text-[#E8F2EC]">Hech narsa topilmadi</h4>
                    <p className="text-xs text-[#566A63] dark:text-[#8B9E95] max-w-xs mx-auto mt-1">
                      "{searchQuery}" bo‘yicha {radiusM >= 1000 ? `${(radiusM / 1000).toFixed(1)} km` : `${radiusM} m`} radiusda tovar topilmadi.
                    </p>
                  </div>

                  {radiusM < 3000 && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setRadiusM(3000);
                        doSearch();
                      }}
                      className="text-xs font-bold"
                    >
                      Radiusni 3 km ga kengaytirish
                    </Button>
                  )}

                  <div className="mt-2 text-left w-full border-t border-[#DCE5DF]/60 dark:border-[#2A3F36] pt-3">
                    <span className="text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95] block mb-2">
                      Boshqa ommabop variantlar:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Snickers', 'Coca-Cola', 'Twix', 'Mars', 'Bounty', 'Non', 'Sut'].map((variant) => (
                        <button
                          key={variant}
                          onClick={() => {
                            setSearchQuery(variant);
                            doSearch(variant);
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#273D32] text-[#116B50] dark:text-[#4ADE80] font-semibold hover:bg-[#E0EFE7] dark:hover:bg-[#234234] transition cursor-pointer"
                        >
                          {variant}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mode 2: Product Search Results */}
                  <div className="flex items-center justify-between text-xs text-[#566A63] dark:text-[#8B9E95] border-b border-[#DCE5DF] dark:border-[#2A3F36] pb-2">
                    <span className="font-semibold text-[#172C28] dark:text-[#E8F2EC]">
                      {results.length} ta do‘kon topildi
                    </span>
                    <select
                      value={selectedSort}
                      onChange={(e: any) => setSelectedSort(e.target.value)}
                      className="bg-transparent text-[#116B50] dark:text-[#4ADE80] font-semibold text-xs border-none outline-none cursor-pointer"
                    >
                      <option value="relevance" className="dark:bg-[#14201A]">Eng mos ▾</option>
                      <option value="distance" className="dark:bg-[#14201A]">Eng yaqin ▾</option>
                      <option value="price" className="dark:bg-[#14201A]">Eng arzon ▾</option>
                    </select>
                  </div>

                  {/* Cards List */}
                  <div className="flex flex-col gap-3">
                    {results.map((item) => {
                      const isSelected = selectedResult?.store.id === item.store.id;
                      return (
                        <article
                          key={item.store.id}
                          onClick={() => handleSelectStore(item)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-2 border-[#116B50] dark:border-[#4ADE80] bg-[#F6FBF7] dark:bg-[#1B2F25] shadow-sm'
                              : 'border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] hover:border-[#116B50]/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-base text-[#172C28] dark:text-[#E8F2EC]">{item.store.name}</h3>
                              <div className="flex items-center gap-2 text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                                <span className={item.isOpenNow ? 'text-[#116B50] dark:text-[#4ADE80] font-semibold' : 'text-[#B42318] dark:text-[#F87171]'}>
                                  {item.isOpenNow ? '● Ochiq' : '○ Yopiq'}
                                </span>
                                <span>·</span>
                                <span title="Siz turgan nuqtadan hisoblangan masofa">
                                  📍 {item.distanceM === 0 ? 'Siz turgan joyda' : `Sizdan ${item.distanceM >= 1000 ? (item.distanceM / 1000).toFixed(1) + ' km' : item.distanceM + ' m'}`}
                                </span>
                                <span>·</span>
                                <StarRating rating={item.store.rating} />
                              </div>
                            </div>
                            {item.store.isVerified && (
                              <Tag variant="default" className="text-[10px]">
                                Tasdiqlangan
                              </Tag>
                            )}
                          </div>

                          {/* Best Offer - Clickable entire product container */}
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProductModalItem(item);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedProductModalItem(item);
                              }
                            }}
                            title="Tovar ma‘lumotlari va muqobillarini ko‘rish uchun bosing"
                            aria-label={`${item.bestOffer.variant.title} tovar ma‘lumotlari va o‘xshash variantlar`}
                            className="my-3 p-3 bg-[#F9FAF9] dark:bg-[#1A2822] hover:bg-[#E0EFE7]/40 dark:hover:bg-[#1E362A] rounded-xl flex items-center justify-between gap-3 border border-[#DCE5DF]/70 dark:border-[#2A3F36] hover:border-[#116B50]/60 dark:hover:border-[#4ADE80]/60 transition-all cursor-pointer group shadow-2xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative w-12 h-12 rounded-xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#2A3F36] group-hover:border-[#116B50]/60 overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-2xs transition-all">
                                <img
                                  src={getProductThumbnail(item.bestOffer.variant)}
                                  alt={item.bestOffer.variant.title}
                                  loading="lazy"
                                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_THUMBNAIL;
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                                  <Eye className="w-4 h-4 text-white drop-shadow" />
                                </div>
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-[#172C28] dark:text-[#E8F2EC] group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] transition-colors truncate block">
                                  {item.bestOffer.variant.title}
                                </span>
                                <div className="text-xl font-extrabold text-[#116B50] dark:text-[#4ADE80] mt-0.5 whitespace-nowrap">
                                  {Number(item.bestOffer.price).toLocaleString('uz-UZ')}{' '}
                                  <span className="text-xs font-normal text-[#566A63] dark:text-[#8B9E95]">so‘m / {item.bestOffer.variant.packUnit}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <Tag
                                variant={
                                  item.bestOffer.stockOnHand > 10
                                    ? 'default'
                                    : item.bestOffer.stockOnHand > 0
                                    ? 'warn'
                                    : 'error'
                                }
                              >
                                {item.bestOffer.stockOnHand > 0
                                  ? `${item.bestOffer.stockOnHand} dona`
                                  : 'Tugagan'}
                              </Tag>
                              <div className="text-[10px] mt-1">
                                {item.bestOffer.freshness === 'NEW' ? (
                                  <span className="text-[#116B50] dark:text-[#4ADE80] font-semibold">✨ Bugun yangilangan</span>
                                ) : item.bestOffer.freshness === 'STALE' ? (
                                  <span className="text-amber-600 dark:text-amber-400 font-semibold">⚠️ 2 kun oldin</span>
                                ) : (
                                  <span className="text-red-500 font-semibold">⚠️ Qoldiqni tekshiring</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {item.otherMatchingOfferCount > 0 && (
                            <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mb-3">
                              Yana {item.otherMatchingOfferCount} ta mos variant
                            </p>
                          )}

                          <div className="flex items-center gap-2 pt-2 border-t border-[#DCE5DF]/60 dark:border-[#2A3F36]">
                            <Button
                              variant="primary"
                              size="sm"
                              fullWidth
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(item);
                              }}
                            >
                              Do‘konni ko‘rish
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              aria-label="Do‘konga yo‘l ko‘rsatish"
                              title="Piyoda marshrut"
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchRoute(item.store, 'walking');
                              }}
                            >
                              <Navigation className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              aria-label="Mahsulotni kuzatish va narx o‘zgarganda xabar berish"
                              title="Narx va qoldiq o‘zgarganda xabar berish"
                              onClick={(e) => {
                                e.stopPropagation();
                                showToast(`"${item.bestOffer.variant.title}" kuzatuvga olindi. Narx yoki qoldiq o‘zgarganda xabardor qilamiz.`);
                              }}
                            >
                              <Bookmark className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ROUTE VIEW */}
          {view === 'route' && (
            <div className="p-5 flex flex-col gap-4">
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
                  <h1 className="text-2xl font-bold tracking-tight text-[#172C28] dark:text-white">Do‘konga yo‘l</h1>
                  {selectedResult?.store && (
                    <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                      {selectedResult.store.name} · {selectedResult.store.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Walking / Driving Selector */}
              <div className="flex gap-2 p-1 bg-[#F3F6F3] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36]">
                <button
                  onClick={() => {
                    setRouteMode('walking');
                    if (selectedResult?.store) fetchRoute(selectedResult.store, 'walking');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    routeMode === 'walking'
                      ? 'bg-[#116B50] text-white shadow-sm'
                      : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                  }`}
                >
                  🚶 Piyoda
                </button>
                <button
                  onClick={() => {
                    setRouteMode('driving');
                    if (selectedResult?.store) fetchRoute(selectedResult.store, 'driving');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    routeMode === 'driving'
                      ? 'bg-[#116B50] text-white shadow-sm'
                      : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                  }`}
                >
                  🚗 Avtomobil
                </button>
              </div>

              {routeData ? (
                <>
                  {/* Route Summary */}
                  <div className="bg-[#E7F2EB] dark:bg-[#183324] p-4 rounded-2xl border border-[#116B50]/20">
                    <span className="text-[11px] font-bold text-[#116B50] dark:text-[#4ADE80] uppercase tracking-wider">
                      Marshrut hisobi
                    </span>
                    <div className="text-3xl font-extrabold text-[#172C28] dark:text-white mt-1">
                      {Math.round(routeData.durationSec / 60) || 1} daqiqa{' '}
                      <span className="text-base font-normal text-[#566A63] dark:text-[#8B9E95]">
                        · {routeData.distanceM >= 1000 ? `${(routeData.distanceM / 1000).toFixed(1)} km` : `${routeData.distanceM} m`}
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
                      <Button variant="primary" fullWidth className="font-bold py-2.5">
                        <ExternalLink className="w-4 h-4 mr-2" /> Tashqi xaritada ochish (Google / Yandex)
                      </Button>
                    </a>
                  )}

                  {/* Stop Route Action Button */}
                  <button
                    onClick={handleStopRoute}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs font-bold transition shadow-sm cursor-pointer active:scale-[0.99]"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Marshrutni yakunlash (Xaritaga qaytish)</span>
                  </button>
                </>
              ) : (
                <div className="p-12 text-center text-xs text-[#566A63] dark:text-[#8B9E95] flex flex-col items-center gap-3 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-2xl border border-dashed border-[#DCE5DF] dark:border-[#2A3F36]">
                  <div className="w-6 h-6 border-2 border-[#116B50] border-t-transparent rounded-full animate-spin" />
                  <span>Marshrut yuklanmoqda...</span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Map Section (Desktop right side & Mobile Map view) */}
        <section
          className={`flex-1 relative bg-[#EDF0E6] dark:bg-[#0E1713] overflow-hidden h-full flex flex-col ${
            mobileTab === 'royxat' && view === 'search' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Mobile Floating Search Bar Overlay (Only on mobile when in search view) */}
          {view === 'search' && (
            <div className="md:hidden absolute top-3 left-3 right-3 sm:left-4 sm:right-4 z-20 flex flex-col gap-2 pointer-events-none">
              <div className="bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-[#DCE5DF] dark:border-[#273B32] shadow-xl pointer-events-auto flex flex-col gap-2">
                {/* Search input & Action Button */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95] pointer-events-none">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                      placeholder={t('cust_search_input')}
                      className="w-full h-11 pl-9 pr-8 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-sm text-[#172C28] dark:text-[#E8F2EC] focus:bg-white dark:focus:bg-[#16241E] focus:outline-none focus:ring-2 focus:ring-[#116B50]"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          doSearch();
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => doSearch()}
                    className="h-11 px-4 bg-[#116B50] hover:bg-[#0d533e] active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 transition"
                  >
                    <Search className="w-4 h-4" />
                    <span>Izlash</span>
                  </button>
                  <button
                    onClick={() => setIsFilterModalOpen(true)}
                    title="Filtrlar"
                    className="h-11 w-11 bg-white dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl flex items-center justify-center shadow-sm shrink-0 hover:bg-[#F3F6F3] dark:hover:bg-[#1E3328] transition"
                  >
                    <Filter className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                  </button>
                </div>

                {/* Quick filter badges */}
                <div
                  className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none no-scrollbar text-xs"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <button
                    onClick={() => setIsFilterModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] border border-[#116B50]/30 font-bold whitespace-nowrap flex items-center gap-1.5 shrink-0"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {radiusM >= 1000 ? `${(radiusM / 1000).toFixed(1)} km` : `${radiusM} m`} ▾
                  </button>

                  <button
                    onClick={() => setOpenNow(!openNow)}
                    className={`px-3 py-1.5 rounded-xl border font-semibold whitespace-nowrap shrink-0 transition ${
                      openNow
                        ? 'bg-[#116B50] text-white border-[#116B50]'
                        : 'bg-[#F9FAF9] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border-[#DCE5DF] dark:border-[#2A3F36]'
                    }`}
                  >
                    {t('open_dot', '● Ochiq')}
                  </button>

                  <button
                    onClick={() => setInStock(!inStock)}
                    className={`px-3 py-1.5 rounded-xl border font-semibold whitespace-nowrap shrink-0 transition ${
                      inStock
                        ? 'bg-[#116B50] text-white border-[#116B50]'
                        : 'bg-[#F9FAF9] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border-[#DCE5DF] dark:border-[#2A3F36]'
                    }`}
                  >
                    {t('in_stock', 'Mavjud')}
                  </button>

                  <button
                    onClick={() => setFreshOnly(!freshOnly)}
                    className={`px-3 py-1.5 rounded-xl border font-semibold whitespace-nowrap shrink-0 transition ${
                      freshOnly
                        ? 'bg-[#116B50] text-white border-[#116B50]'
                        : 'bg-[#F9FAF9] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border-[#DCE5DF] dark:border-[#2A3F36]'
                    }`}
                  >
                    {t('new', 'Yangi')}
                  </button>

                  <select
                    value={selectedSort}
                    onChange={(e: any) => setSelectedSort(e.target.value)}
                    className="px-2.5 py-1.5 bg-[#F9FAF9] dark:bg-[#1A2822] text-[#116B50] dark:text-[#4ADE80] font-bold text-xs border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl outline-none shrink-0"
                  >
                    <option value="relevance">{t('sort_relevance', 'Eng mos')}</option>
                    <option value="distance">{t('sort_distance', 'Eng yaqin')}</option>
                    <option value="price">{t('sort_price', 'Eng arzon')}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

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

          {/* Mobile Floating View Switcher Pills */}
          {view === 'search' && (
            <div className={`md:hidden fixed ${(results.length > 0 && mobileTab === 'xarita') || (!results.length && Boolean(selectedNearbyStore)) ? 'bottom-[205px]' : 'bottom-[76px]'} left-1/2 -translate-x-1/2 z-30 pointer-events-auto transition-all duration-200`}>
              {mobileTab === 'xarita' ? (
                <button
                  type="button"
                  onClick={() => setMobileTab('royxat')}
                  className="px-4 py-2.5 bg-[#172C28] dark:bg-[#142A1F] hover:bg-black text-white rounded-full shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-bold border border-white/20 active:scale-95 transition backdrop-blur-md cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-[#4ADE80]" />
                  <span>Ro‘yxat ({results.length > 0 ? results.length : nearbyStores.length})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMobileTab('xarita')}
                  className="px-4 py-2.5 bg-[#116B50] hover:bg-[#0D533E] text-white rounded-full shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-bold border border-white/20 active:scale-95 transition backdrop-blur-md cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-white" />
                  <span>Xaritada ko‘rish</span>
                </button>
              )}
            </div>
          )}
        </section>
      </>
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
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsReviewModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" onClick={handleSubmitReview}>
              Yuborish
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#566A63] block mb-1">Baho</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className={`text-2xl ${star <= reviewRating ? 'text-[#F5A623]' : 'text-[#DCE5DF]'}`}
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
              className="w-full p-3 border border-[#DCE5DF] rounded-xl text-sm"
            />
          </div>
        </div>
      </Modal>

      {/* 2. Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={t('cust_error_report_title', 'Xato haqida xabar')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsReportModalOpen(false)}>
              {t('cancel', 'Bekor qilish')}
            </Button>
            <Button variant="primary" onClick={handleSubmitReport}>
              {t('cust_send_report', 'Xabar yuborish')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#566A63] block mb-1">Muammo turi</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full p-2.5 border border-[#DCE5DF] rounded-xl text-sm"
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
              className="w-full p-3 border border-[#DCE5DF] rounded-xl text-sm"
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
            <select
              value={selectedSort}
              onChange={(e: any) => setSelectedSort(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-sm text-[#172C28] dark:text-[#E8F2EC] outline-none"
            >
              <option value="relevance">Eng mos (Relevance)</option>
              <option value="distance">Eng yaqin masofa (Distance)</option>
              <option value="price">Eng arzon narx (Price)</option>
            </select>
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
