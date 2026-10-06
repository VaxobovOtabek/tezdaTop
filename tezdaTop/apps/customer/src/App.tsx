import React, { useState, useEffect } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { Button, Tag, Modal, StarRating } from '@yaqintop/ui';
import { StoreSearchResult, RouteResponse, Offer, Store } from '@yaqintop/contracts';
import { InteractiveMap } from './components/InteractiveMap';
import { StoreFullPageView } from './components/StoreFullPageView';
import { UserPersonalHubView } from './components/UserPersonalHubView';
import { UnifiedUserProfileModal } from './components/UnifiedUserProfileModal';
import { UnifiedLoginModal } from './components/UnifiedLoginModal';
import { UzbekistanRegionPickerModal } from './components/UzbekistanRegionPickerModal';
import { apiUrl } from './config/api.js';

export function CustomerApp() {
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
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('yaqintop_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

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
  const [view, setView] = useState<'search' | 'detail' | 'route' | 'hub'>('search');
  const [hubSection, setHubSection] = useState<'favorites' | 'reviews' | 'inquiries' | 'history'>('favorites');
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [mobileTab, setMobileTab] = useState<'xarita' | 'royxat'>('xarita');
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusM, setRadiusM] = useState(1000);
  const [openNow, setOpenNow] = useState(false);
  const [inStock, setInStock] = useState(false);
  const [freshOnly, setFreshOnly] = useState(false);
  const [selectedSort, setSelectedSort] = useState<'relevance' | 'distance' | 'price'>('relevance');

  const [results, setResults] = useState<StoreSearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<StoreSearchResult | null>(null);
  
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

  // Fetch all nearby stores when no query
  const loadNearbyStores = async (loc?: { lat: number; lng: number }) => {
    try {
      const uLat = loc?.lat ?? userLocation?.lat ?? 41.311081;
      const uLng = loc?.lng ?? userLocation?.lng ?? 69.240562;
      const res = await fetch(apiUrl(`/api/v1/stores?lat=${uLat}&lng=${uLng}&radiusM=${radiusM}${openNow ? '&openNow=true' : ''}`));
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
        if (items.length > 0) {
          setSelectedNearbyStore(items[0]);
        } else {
          setSelectedNearbyStore(null);
        }
      }
    } catch (err) {
      console.error('Error fetching nearby stores:', err);
    }
  };

  // Fetch full store details and all products/services
  const loadStoreCatalog = async (storeId: string) => {
    setStoreOffersLoading(true);
    try {
      const [detailRes, offersRes] = await Promise.all([
        fetch(apiUrl(`/api/v1/stores/${storeId}`)),
        fetch(apiUrl(`/api/v1/stores/${storeId}/offers`))
      ]);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
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
        setActiveStoreOffers(offersData.offers || []);
      }
    } catch (err) {
      console.error('Error loading store catalog:', err);
    } finally {
      setStoreOffersLoading(false);
    }
  };

  // URL Routing Sync
  const handleRoute = (path: string) => {
    const cleanPath = path.split('?')[0];
    setCurrentPath(cleanPath);

    if (cleanPath !== '/marshrut') {
      setRouteData(null);
    }

    if (cleanPath === '/sevimlilar' || cleanPath === '/sharhlarim' || cleanPath === '/ariza' || cleanPath === '/murojaatlar' || cleanPath === '/tarix') {
      if (!currentUser) {
        setAuthErrorBanner('⚠️ Shaxsiy kabinet va ma‘lumotlarni ko‘rish uchun iltimos, tizimga kiring!');
        setIsLoginModalOpen(true);
        window.history.replaceState(null, '', '/');
        setCurrentPath('/');
        setView('search');
        return;
      }
    }

    if (cleanPath === '/sevimlilar') {
      setView('hub');
      setHubSection('favorites');
    } else if (cleanPath === '/sharhlarim') {
      setView('hub');
      setHubSection('reviews');
    } else if (cleanPath === '/ariza' || cleanPath === '/murojaatlar') {
      setView('hub');
      setHubSection('inquiries');
    } else if (cleanPath === '/tarix') {
      setView('hub');
      setHubSection('history');
    } else if (cleanPath === '/marshrut') {
      if (routeData) {
        setView('route');
      } else {
        // Prevent history loop on back/forward or reload when route data is not in memory
        window.history.replaceState(null, '', '/');
        setCurrentPath('/');
        setView('search');
      }
    } else if (cleanPath.startsWith('/dokon/')) {
      const storeId = cleanPath.replace('/dokon/', '').trim();
      if (storeId) {
        loadStoreCatalog(storeId);
        setView('detail');
      }
    } else {
      setView('search');
    }
  };

  const navigateTo = (path: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      window.history.replaceState(null, '', path);
    } else {
      window.history.pushState(null, '', path);
    }
    handleRoute(path);
  };

  const handleStopRoute = () => {
    setRouteData(null);
    setView('search');
    window.history.replaceState(null, '', '/');
    setCurrentPath('/');
    showToast('Marshrut rejimi to‘xtatildi');
  };

  // Listen to popstate (browser back/forward button) and initial URL load
  useEffect(() => {
    handleRoute(window.location.pathname || '/');
    const onPopState = () => {
      handleRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Fetch search results from API
  const doSearch = async (queryStr?: string, loc?: { lat: number; lng: number }) => {
    const q = (typeof queryStr === 'string' ? queryStr : searchQuery).trim();
    if (!q) {
      setResults([]);
      setSelectedResult(null);
      setNearbyStores([]);
      setSelectedNearbyStore(null);
      return;
    }

    // Save to search history
    try {
      const history = JSON.parse(localStorage.getItem('yaqintop_search_history') || '[]');
      const newEntry = { query: q, timestamp: new Date().toISOString() };
      const updated = [newEntry, ...history.filter((h: any) => h.query.toLowerCase() !== q.toLowerCase())].slice(0, 30);
      localStorage.setItem('yaqintop_search_history', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    const targetLoc = loc || userLocation;
    try {
      const res = await fetch(apiUrl('/api/v1/search/products'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      if (res.ok) {
        const data = await res.json();
        setResults(data.items || []);
        if (data.items && data.items.length > 0) {
          setSelectedResult(data.items[0]);
        } else {
          setSelectedResult(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      doSearch();
    } else {
      setResults([]);
      setSelectedResult(null);
      setNearbyStores([]);
      setSelectedNearbyStore(null);
    }
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
        setRouteData(data);
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
          steps: [
            { instruction: 'Hozirgi joyingizdan to‘g‘ri harakatlaning', distanceM: Math.round(straightM * 0.4), durationSec: Math.round(durationSec * 0.4) },
            { instruction: `${targetStore.name} do‘koniga yetib keldingiz`, distanceM: Math.round(straightM * 0.6), durationSec: Math.round(durationSec * 0.6) }
          ],
          provider: 'local-osrm-fallback',
          isApproximateTraffic: true,
          externalMapUrl: `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&travelmode=${mode}`
        };
        setRouteData(fallbackRoute);
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
        steps: [
          { instruction: 'Hozirgi joyingizdan to‘g‘ri harakatlaning', distanceM: Math.round(straightM * 0.4), durationSec: Math.round(durationSec * 0.4) },
          { instruction: `${targetStore.name} do‘koniga yetib keldingiz`, distanceM: Math.round(straightM * 0.6), durationSec: Math.round(durationSec * 0.6) }
        ],
        provider: 'local-osrm-fallback',
        isApproximateTraffic: true,
        externalMapUrl: `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&travelmode=${mode}`
      };
      setRouteData(fallbackRoute);
      setView('route');
      navigateTo('/marshrut', { replace: true });
    }
  };

  const handleSelectStore = (item: StoreSearchResult) => {
    setSelectedResult(item);
  };

  const handleSelectNearbyStore = (item: any) => {
    setSelectedNearbyStore(item);
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
    recordStoreView(item.store);
    loadStoreCatalog(item.store.id);
    navigateTo(`/dokon/${item.store.id}`);
  };

  const handleOpenNearbyDetail = (item: any) => {
    setSelectedNearbyStore(item);
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
    loadStoreCatalog(item.store.id);
    navigateTo(`/dokon/${item.store.id}`);
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
      <header className="h-[58px] sm:h-[68px] bg-white dark:bg-[#14201A] border-b border-[#DCE5DF] dark:border-[#22332C] px-2.5 sm:px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
          <div
            onClick={() => navigateTo('/')}
            className="flex items-center gap-1.5 cursor-pointer select-none shrink-0"
          >
            <div className="w-7 h-8 sm:w-8 sm:h-9 bg-[#116B50] rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-sm flex items-center justify-center text-white font-extrabold text-base sm:text-xl shadow-sm">
              Y
            </div>
            <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-[#172C28] dark:text-white hidden min-[420px]:inline">
              YaqinTop
            </span>
          </div>

          {/* Uzbekistan Region & District Selector Trigger */}
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 border border-[#DCE5DF] dark:border-[#263D33] text-[11px] sm:text-xs font-semibold text-[#116B50] dark:text-[#4ADE80] bg-[#F3F8F5] dark:bg-[#162720] hover:bg-[#E2EFE7] dark:hover:bg-[#1E362C] rounded-xl transition cursor-pointer group shadow-2xs max-w-[125px] min-[360px]:max-w-[145px] sm:max-w-[190px] shrink-1"
            title="Hududni o‘zgartirish (O‘zbekiston viloyatlari va tumanlari)"
          >
            <MapPin className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0 group-hover:scale-110 transition-transform" />
            <span className="truncate">{selectedLocationName}</span>
            <ChevronDown className="w-3 h-3 text-[#566A63] dark:text-[#8B9E95] group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] shrink-0 transition-transform group-hover:translate-y-0.5" />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 ml-4">
            <button
              onClick={() => navigateTo('/')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                view === 'search' || (view as string) === 'route'
                  ? 'bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]'
                  : 'text-[#566A63] dark:text-[#8B9E95] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Xarita & Izlash</span>
            </button>

            <button
              onClick={() => navigateTo('/sevimlilar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                view === 'hub' && hubSection === 'favorites'
                  ? 'bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]'
                  : 'text-[#566A63] dark:text-[#8B9E95] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822]'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Sevimlilar</span>
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
              <span>Sharhlarim</span>
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
              <span>Arizalar & Murojaatlar</span>
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
              <span>Tarix</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-1.5">
          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? "Yorug' tema" : "Qorong'i tema"}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#EDF5F0] dark:hover:bg-[#1E3328] transition flex items-center justify-center shadow-2xs shrink-0"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#116B50]" />}
          </button>

          {/* User Profile / Guest Button */}
          {currentUser ? (
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#EDF5F0] dark:hover:bg-[#1E3328] transition text-xs font-bold shadow-2xs shrink-0"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#116B50] text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center shrink-0">
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
              className="flex items-center gap-1 sm:gap-1.5 text-xs font-bold px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
              title="Tizimga kirish"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>Kirish</span>
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
                inquiries: '/ariza',
                history: '/tarix'
              };
              navigateTo(pathToMap[sec] || '/sevimlilar');
            }}
            onBackToSearch={() => navigateTo('/')}
            onOpenStore={(storeId) => {
              loadStoreCatalog(storeId);
              navigateTo(`/dokon/${storeId}`);
            }}
            onGetRoute={(store) => {
              fetchRoute(store, 'walking');
            }}
            onSearchQuery={(q) => {
              setSearchQuery(q);
              navigateTo('/');
              doSearch(q);
            }}
            isDarkMode={isDarkMode}
            currentUser={currentUser}
            onShowToast={showToast}
          />
        ) : view === 'detail' && (selectedResult || selectedNearbyStore || activeStoreDetail) ? (
          <StoreFullPageView
            store={selectedResult?.store || selectedNearbyStore?.store || activeStoreDetail}
            organization={activeStoreDetail?.organization || selectedNearbyStore?.organization}
            offers={activeStoreOffers}
            loadingOffers={storeOffersLoading}
            isDarkMode={isDarkMode}
            userLocation={userLocation}
            matchedOffer={selectedResult?.bestOffer?.id !== 'default' ? selectedResult?.bestOffer : null}
            currentUser={currentUser}
            onRequireAuth={(msg) => requireAuth(msg || 'Ushbu amalni bajarish')}
            onBack={() => navigateTo('/')}
            onGetRoute={(mode) => fetchRoute((selectedResult?.store || selectedNearbyStore?.store || activeStoreDetail), mode)}
            onReportError={() => requireAuth('Murojaat yuborish', () => setIsReportModalOpen(true))}
            onShowToast={showToast}
          />
        ) : (
          <>
            {/* Left Column / Mobile Results */}
            <section
              className={`w-full md:w-[420px] lg:w-[450px] bg-white dark:bg-[#14201A] border-r border-[#DCE5DF] dark:border-[#22332C] flex flex-col overflow-y-auto h-full ${
                mobileTab === 'xarita' && view === 'search' ? 'hidden md:flex' : 'flex'
              }`}
            >
          {view === 'search' && (
            <div className="p-5 flex flex-col gap-4">
              {/* Search Box */}
              <div>
                <span className="text-[11px] font-bold text-[#116B50] dark:text-[#4ADE80] uppercase tracking-wider">
                  Yaqiningizdan toping
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-[#172C28] dark:text-white mt-1 mb-3">
                  Kerakli tovar. Yaqin do‘kon.
                </h1>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                      placeholder="Mahsulot nomi, masalan: snikers"
                      className="w-full h-11 pl-3.5 pr-8 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-sm text-[#172C28] dark:text-[#E8F2EC] focus:bg-white dark:focus:bg-[#16241E]"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          doSearch();
                        }}
                        className="absolute right-2.5 top-3 text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <Button variant="primary" onClick={() => doSearch()} aria-label="Qidirish" className="px-4 flex items-center gap-1.5 font-bold">
                    <Search className="w-4 h-4" />
                    <span>Izlash</span>
                  </Button>
                </div>
              </div>

              {/* Radius Control */}
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
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setOpenNow(!openNow)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition ${
                    openNow
                      ? 'bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] border-[#116B50] dark:border-[#4ADE80]'
                      : 'bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] border-[#DCE5DF] dark:border-[#2A3F36]'
                  }`}
                >
                  Hozir ochiq
                </button>
                <button
                  onClick={() => setInStock(!inStock)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition ${
                    inStock
                      ? 'bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] border-[#116B50] dark:border-[#4ADE80]'
                      : 'bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] border-[#DCE5DF] dark:border-[#2A3F36]'
                  }`}
                >
                  Mavjud
                </button>
                <button
                  onClick={() => setFreshOnly(!freshOnly)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition ${
                    freshOnly
                      ? 'bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] border-[#116B50] dark:border-[#4ADE80]'
                      : 'bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] border-[#DCE5DF] dark:border-[#2A3F36]'
                  }`}
                >
                  Faqat yangi
                </button>
                <button
                  onClick={() => setIsFilterModalOpen(true)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] flex items-center gap-1 hover:bg-[#F3F6F3] dark:hover:bg-[#1E3328]"
                >
                  <Filter className="w-3 h-3" /> Filtrlar
                </button>
              </div>

              {/* Mode 1: No search query -> Initial Clean Search Prompt */}
              {!searchQuery.trim() ? (
                <div className="flex flex-col gap-4 mt-2">
                  {/* Popular Quick Search Tags */}
                  <div>
                    <span className="text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95] uppercase tracking-wider block mb-2">
                      Tezkor qidiruv takliflari:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Snikers', 'Coca-cola', 'Non', 'Sut', 'Tuxum', 'Yog‘', 'Go‘sht', 'Shakar', 'Suv', 'Dori'].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
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
                <div className="p-8 text-center flex flex-col items-center justify-center gap-2 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-2xl border border-dashed border-[#DCE5DF] dark:border-[#2A3F36] mt-2">
                  <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-xl">
                    📦
                  </div>
                  <h4 className="font-bold text-sm text-[#172C28] dark:text-[#E8F2EC]">Hech narsa topilmadi</h4>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] max-w-xs mx-auto">
                    "{searchQuery}" bo‘yicha {radiusM >= 1000 ? `${(radiusM / 1000).toFixed(1)} km` : `${radiusM} m`} radiusda tovar topilmadi. Qidiruv radiusini kengaytirib ko‘ring.
                  </p>
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
                                <span>{item.distanceM} m</span>
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

                          {/* Best Offer */}
                          <div className="my-3 p-3 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl flex items-center justify-between border border-[#DCE5DF]/60 dark:border-[#2A3F36]">
                            <div>
                              <span className="text-xs font-semibold text-[#172C28] dark:text-[#E8F2EC]">
                                {item.bestOffer.variant.title}
                              </span>
                              <div className="text-xl font-extrabold text-[#116B50] dark:text-[#4ADE80] mt-0.5">
                                {Number(item.bestOffer.price).toLocaleString('uz-UZ')}{' '}
                                <span className="text-xs font-normal text-[#566A63] dark:text-[#8B9E95]">so‘m / {item.bestOffer.variant.packUnit}</span>
                              </div>
                            </div>
                            <div className="text-right">
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
                              <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                                {item.bestOffer.freshness === 'NEW'
                                  ? '10 daqiqa oldin'
                                  : item.bestOffer.freshness === 'STALE'
                                  ? '2 kun oldin'
                                  : 'Tekshiring'}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchRoute(item.store, 'walking');
                              }}
                            >
                              <Navigation className="w-3.5 h-3.5" />
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

                  {/* Turn-by-Turn Steps */}
                  <div className="flex flex-col border border-[#DCE5DF] dark:border-[#2A3F36] rounded-2xl bg-white dark:bg-[#16241E] divide-y divide-[#DCE5DF]/60 dark:divide-[#2A3F36]">
                    {routeData.steps.map((st, i) => (
                      <div key={i} className="p-3.5 flex items-start gap-3 text-xs text-[#172C28] dark:text-[#E8F2EC]">
                        <span className="w-5 h-5 rounded-full bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] font-bold flex items-center justify-center shrink-0 text-[11px]">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <span className="font-semibold">{st.instruction}</span>
                          <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                            {st.distanceM} m · ~{Math.round(st.durationSec / 60) || 1} daqiqa
                          </div>
                        </div>
                      </div>
                    ))}
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
            <div className="md:hidden absolute top-2 left-2 right-2 z-20 flex flex-col gap-1.5 pointer-events-none">
              <div className="bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md p-2.5 rounded-2xl border border-[#DCE5DF] dark:border-[#273B32] shadow-xl pointer-events-auto flex flex-col gap-2">
                {/* Search input & Action Button */}
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95] pointer-events-none">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                      placeholder="Mahsulot nomi (masalan: snikers)..."
                      className="w-full h-10 pl-8 pr-7 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC] focus:bg-white dark:focus:bg-[#16241E] focus:outline-none focus:ring-1 focus:ring-[#116B50]"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          doSearch();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => doSearch()}
                    className="h-10 px-3.5 bg-[#116B50] hover:bg-[#0d533e] active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 transition"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Izlash</span>
                  </button>
                  <button
                    onClick={() => setIsFilterModalOpen(true)}
                    title="Filtrlar"
                    className="h-10 px-2.5 bg-white dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl flex items-center justify-center shadow-sm shrink-0 hover:bg-[#F3F6F3] dark:hover:bg-[#1E3328] transition"
                  >
                    <Filter className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                  </button>
                </div>

                {/* Quick filter badges */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
                  <button
                    onClick={() => setIsFilterModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] border border-[#116B50]/30 font-bold whitespace-nowrap flex items-center gap-1 shrink-0"
                  >
                    <MapPin className="w-3 h-3" />
                    {radiusM >= 1000 ? `${(radiusM / 1000).toFixed(1)} km` : `${radiusM} m`} ▾
                  </button>

                  <button
                    onClick={() => setOpenNow(!openNow)}
                    className={`px-2.5 py-1 rounded-lg border font-semibold whitespace-nowrap shrink-0 transition ${
                      openNow
                        ? 'bg-[#116B50] text-white border-[#116B50]'
                        : 'bg-[#F9FAF9] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border-[#DCE5DF] dark:border-[#2A3F36]'
                    }`}
                  >
                    ● Ochiq
                  </button>

                  <button
                    onClick={() => setInStock(!inStock)}
                    className={`px-2.5 py-1 rounded-lg border font-semibold whitespace-nowrap shrink-0 transition ${
                      inStock
                        ? 'bg-[#116B50] text-white border-[#116B50]'
                        : 'bg-[#F9FAF9] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border-[#DCE5DF] dark:border-[#2A3F36]'
                    }`}
                  >
                    Mavjud
                  </button>

                  <button
                    onClick={() => setFreshOnly(!freshOnly)}
                    className={`px-2.5 py-1 rounded-lg border font-semibold whitespace-nowrap shrink-0 transition ${
                      freshOnly
                        ? 'bg-[#116B50] text-white border-[#116B50]'
                        : 'bg-[#F9FAF9] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border-[#DCE5DF] dark:border-[#2A3F36]'
                    }`}
                  >
                    Yangi
                  </button>

                  <select
                    value={selectedSort}
                    onChange={(e: any) => setSelectedSort(e.target.value)}
                    className="px-2 py-1 bg-[#F9FAF9] dark:bg-[#1A2822] text-[#116B50] dark:text-[#4ADE80] font-bold text-[11px] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-lg outline-none shrink-0"
                  >
                    <option value="relevance">Eng mos</option>
                    <option value="distance">Eng yaqin</option>
                    <option value="price">Eng arzon</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <InteractiveMap
            userLocation={userLocation}
            radiusM={radiusM}
            results={results}
            nearbyStores={nearbyStores}
            selectedResult={selectedResult}
            selectedNearbyStore={selectedNearbyStore}
            onSelectStore={handleSelectStore}
            onSelectNearbyStore={handleSelectNearbyStore}
            onOpenDetail={handleOpenDetail}
            onOpenNearbyDetail={handleOpenNearbyDetail}
            onNavigate={(item) => fetchRoute(item.store, routeMode)}
            onCancelRoute={handleStopRoute}
            routeData={routeData}
            view={view}
            isDarkMode={isDarkMode}
            onLocationChange={(lat, lng) => {
              setUserLocation({ lat, lng });
            }}
            onToast={showToast}
          />
        </section>
      </>
    )}
  </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden h-16 bg-white dark:bg-[#14201A] border-t border-[#DCE5DF] dark:border-[#22332C] flex items-center justify-around fixed bottom-0 left-0 right-0 z-40">
        <button
          onClick={() => {
            navigateTo('/');
            setMobileTab('xarita');
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            view === 'search' && mobileTab === 'xarita'
              ? 'text-[#116B50] dark:text-[#4ADE80]'
              : 'text-[#566A63] dark:text-[#8B9E95]'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Izlash</span>
        </button>

        <button
          onClick={() => navigateTo('/sevimlilar')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            view === 'hub' && hubSection === 'favorites'
              ? 'text-[#116B50] dark:text-[#4ADE80]'
              : 'text-[#566A63] dark:text-[#8B9E95]'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Sevimlilar</span>
        </button>

        <button
          onClick={() => navigateTo('/ariza')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            view === 'hub' && hubSection === 'inquiries'
              ? 'text-[#116B50] dark:text-[#4ADE80]'
              : 'text-[#566A63] dark:text-[#8B9E95]'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Arizalar</span>
        </button>

        <button
          onClick={() => navigateTo('/tarix')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            view === 'hub' && hubSection === 'history'
              ? 'text-[#116B50] dark:text-[#4ADE80]'
              : 'text-[#566A63] dark:text-[#8B9E95]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Tarix</span>
        </button>

        <button
          onClick={() => {
            if (currentUser) setIsProfileModalOpen(true);
            else setIsLoginModalOpen(true);
          }}
          className="flex flex-col items-center gap-1 text-[10px] font-semibold text-[#566A63] dark:text-[#8B9E95]"
        >
          <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px] font-bold">
            {currentUser?.fullName ? currentUser.fullName[0] : '○'}
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
        title="Xato haqida xabar"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsReportModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" onClick={handleSubmitReport}>
              Xabar yuborish
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
    </div>
  );
}
