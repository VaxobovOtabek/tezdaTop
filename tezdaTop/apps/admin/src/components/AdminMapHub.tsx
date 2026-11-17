import { apiFetch } from '@yaqintop/ui';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { matchesRegion, matchesDistrict, normalizeArea, mapViewport } from './map-geography';
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
import { Tag, Button, Modal, useTranslation, UZBEKISTAN_REGIONS } from '@yaqintop/ui';
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
  localCatalog?: boolean;
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

// Helper to filter local points (Uzum PVZ, Game Clubs, Korzinka) strictly by selected region and mandatory district
const matchesLocationFilter = (
  item: any,
  selectedRegion?: string,
  selectedDistrict?: string
): boolean => {
  if (!selectedRegion || !selectedDistrict || selectedDistrict === 'Barcha tumanlar') {
    return false;
  }
  return matchesDistrict(
    {
      region: item.region,
      city: item.city,
      district: item.district,
      address: item.address,
      name: item.name || item.title,
      location: item.location
    },
    selectedDistrict,
    selectedRegion
  );
};

// Map POI theme matching Google Maps / Yandex Maps styling (Icon Disc + Name label underneath)
export function getPoiTheme(item: any, isDarkMode = false) {
  const type = String(item?.type || item?.organization?.type || item?.category || '').toUpperCase();
  const name = String(item?.name || item?.organization?.name || item?.store?.name || 'Tashkilot').trim();
  const lower = (name + ' ' + (item?.description || '')).toLowerCase();

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

  // 6. Beauty, Barber, Salon
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

  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');
  const [selectedStore, setSelectedStore] = useState<EnrichedStore | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(() => {
    try {
      const saved = localStorage.getItem('yaqintop_admin_region') || '';
      return saved === 'Barcha viloyatlar' ? '' : saved;
    } catch {
      return '';
    }
  });
  const [selectedDistrict, setSelectedDistrict] = useState(() => {
    try {
      const saved = localStorage.getItem('yaqintop_admin_city') || '';
      return saved === 'Barcha tumanlar' ? '' : saved;
    } catch {
      return '';
    }
  });
  const isRegionChosen = Boolean(selectedRegion && selectedRegion !== 'Barcha viloyatlar');
  const [filterMode, setFilterMode] = useState<'ALL' | 'WITH_ISSUES' | 'ACTIVE' | 'PENDING'>('ALL');

  // On-demand regional stores (fetched only when region AND mandatory district are chosen)
  const [regionStores, setRegionStores] = useState<EnrichedStore[]>([]);
  const [isLoadingRegionStores, setIsLoadingRegionStores] = useState(false);

  useEffect(() => {
    if (!selectedRegion || !selectedDistrict || selectedDistrict === 'Barcha tumanlar') {
      setRegionStores([]);
      return;
    }
    const controller = new AbortController();
    setIsLoadingRegionStores(true);

    const query = new URLSearchParams({
      region: selectedRegion,
      city: selectedDistrict,
      forMap: 'true'
    });

    apiFetch(`/api/v1/admin/stores?${query.toString()}`, { signal: controller.signal })
      .then(res => (res.ok ? res.json() : { stores: [] }))
      .then(data => {
        if (!controller.signal.aborted && Array.isArray(data.stores)) {
          setRegionStores(data.stores);
        }
      })
      .catch(err => {
        if (!controller.signal.aborted) console.error('Error fetching stores for region:', err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingRegionStores(false);
      });

    return () => controller.abort();
  }, [selectedRegion, selectedDistrict]);

  // Local development: Uzum points, Game clubs & Korzinka supermarkets (strictly tree-shaken in production)
  const [uzumPoints, setUzumPoints] = useState<any[]>([]);
  const [showUzumPoints, setShowUzumPoints] = useState<boolean>(true);
  const [gameClubs, setGameClubs] = useState<any[]>([]);
  const [showGameClubs, setShowGameClubs] = useState<boolean>(true);
  const [korzinkaStores, setKorzinkaStores] = useState<any[]>([]);
  const [showKorzinka, setShowKorzinka] = useState<boolean>(true);
  const [showPharmacies, setShowPharmacies] = useState<boolean>(true);
  const uzumMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const gameClubsMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const korzinkaMarkersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const loadUzumPoints = async () => {
      const candidateUrls = [
        '/api/local/uzum-points',
        '/uzum_delivery_points_yaqintop.json',
        '/admin/uzum_delivery_points_yaqintop.json',
        '/customer/uzum_delivery_points_yaqintop.json',
        'https://tezda-customer.vercel.app/uzum_delivery_points_yaqintop.json',
        'https://tez-api.vercel.app/api/local/uzum-points'
      ];
      for (const url of candidateUrls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              setUzumPoints(data);
              return;
            }
          }
        } catch {}
      }
    };

    loadUzumPoints();

    const loadGameClubs = async () => {
      const candidateUrls = [
        '/api/local/game-clubs',
        '/game_clubs_yaqintop.json',
        '/admin/game_clubs_yaqintop.json',
        '/customer/game_clubs_yaqintop.json',
        'https://tezda-customer.vercel.app/game_clubs_yaqintop.json',
        'https://tez-api.vercel.app/api/local/game-clubs'
      ];
      for (const url of candidateUrls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              setGameClubs(data);
              return;
            }
          }
        } catch {}
      }
    };

    loadGameClubs();

    const loadKorzinkaStores = async () => {
      const candidateUrls = [
        '/api/local/korzinka-stores',
        '/korzinka_stores_yaqintop.json',
        '/admin/korzinka_stores_yaqintop.json',
        '/customer/korzinka_stores_yaqintop.json',
        'https://tezda-customer.vercel.app/korzinka_stores_yaqintop.json',
        'https://tez-api.vercel.app/api/local/korzinka-stores'
      ];
      for (const url of candidateUrls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              setKorzinkaStores(data);
              return;
            }
          }
        } catch {}
      }
    };

    loadKorzinkaStores();
  }, []);

  const activeUzumInRegion = useMemo(() => {
    if (!selectedRegion || !selectedDistrict || selectedDistrict === 'Barcha tumanlar') return [];
    return uzumPoints.filter((p) => matchesLocationFilter(p, selectedRegion, selectedDistrict));
  }, [uzumPoints, selectedRegion, selectedDistrict]);

  const activeClubsInRegion = useMemo(() => {
    if (!selectedRegion || !selectedDistrict || selectedDistrict === 'Barcha tumanlar') return [];
    return gameClubs.filter((c) => matchesLocationFilter(c, selectedRegion, selectedDistrict));
  }, [gameClubs, selectedRegion, selectedDistrict]);

  const activeKorzinkaInRegion = useMemo(() => {
    if (!selectedRegion || !selectedDistrict || selectedDistrict === 'Barcha tumanlar') return [];
    return korzinkaStores.filter((k) => matchesLocationFilter(k, selectedRegion, selectedDistrict));
  }, [korzinkaStores, selectedRegion, selectedDistrict]);

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
      const res = await apiFetch(`/api/v1/stores/${storeId}/offers`);
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
    if (selectedStore?.id && !selectedStore.localCatalog) {
      loadOffers(selectedStore.id);
    } else {
      setStoreOffers([]);
    }
  }, [selectedStore?.id, selectedStore?.localCatalog]);

  const handleDeleteOffer = async (offerId: string) => {
    if (!window.confirm('Haqiqatan ham ushbu tovar/xizmatni o‘chirmoqchimisiz?')) return;
    try {
      const res = await apiFetch(`/api/v1/admin/offers/${offerId}`, { method: 'DELETE' });
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
  // Edit Offer Modal state
  const [isEditOfferModalOpen, setIsEditOfferModalOpen] = useState(false);
  const [isSubmittingEditOffer, setIsSubmittingEditOffer] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [isAddingNewEditCategory, setIsAddingNewEditCategory] = useState(false);
  const [newEditCategoryName, setNewEditCategoryName] = useState('');
  const [editOfferForm, setEditOfferForm] = useState({
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

  const handleOpenEditOffer = (off: any) => {
    const v = off.variant || {};
    const isSvc = v.type === 'SERVICE';
    setEditingOfferId(off.id);
    setIsAddingNewEditCategory(false);
    setNewEditCategoryName('');
    setEditOfferForm({
      type: isSvc ? 'SERVICE' : 'PRODUCT',
      title: v.title || '',
      category: v.category || 'Umumiy',
      price: off.price ? off.price.toString() : '',
      packUnit: v.packUnit || (isSvc ? 'xizmat' : 'dona'),
      stockOnHand: (off.stockOnHand ?? 10).toString(),
      barcode: v.barcode || '',
      brand: v.brand || '',
      photoUrl: v.photoUrl || '',
      description: v.description || ''
    });
    setIsEditOfferModalOpen(true);
  };

  const handleSubmitEditOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfferId) return;
    if (!editOfferForm.title.trim()) {
      showToast('Tovar yoki xizmat nomini kiriting');
      return;
    }
    if (!editOfferForm.price) {
      showToast('Narxni kiriting');
      return;
    }

    setIsSubmittingEditOffer(true);
    try {
      const res = await apiFetch(`/api/v1/admin/offers/${editingOfferId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editOfferForm.title.trim(),
          type: editOfferForm.type,
          category: editOfferForm.category,
          price: parseFloat(editOfferForm.price),
          packUnit: editOfferForm.packUnit,
          stockOnHand: parseInt(editOfferForm.stockOnHand || '10', 10),
          barcode: editOfferForm.barcode.trim(),
          brand: editOfferForm.brand.trim(),
          photoUrl: editOfferForm.photoUrl,
          description: editOfferForm.description.trim()
        })
      });

      if (res.ok) {
        showToast('Tovar/xizmat ma’lumotlari va rasmi muvaffaqiyatli yangilandi!');
        setIsEditOfferModalOpen(false);
        if (selectedStore?.id) loadOffers(selectedStore.id);
        onStoreCreatedOrUpdated?.();
      } else {
        const err = await res.json();
        showToast(err.message || 'Xatolik yuz berdi');
      }
    } catch {
      showToast('Server bilan aloqa xatosi');
    } finally {
      setIsSubmittingEditOffer(false);
    }
  };

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

  const [availableCategories, setAvailableCategories] = useState<string[]>([
    'Fastfud',
    'Oziq-ovqat',
    'Ichimliklar',
    'Shirinliklar',
    'Non mahsulotlari',
    'Sut mahsulotlari',
    'Go‘sht mahsulotlari',
    'Meva va sabzavotlar',
    'Maishiy kimyo',
    'Xo‘jalik mollari',
    'Kiyim-kechak',
    'Elektronika',
    'Avtomobil mollari',
    'Dori-darmon',
    'Kanselyariya',
    'Xizmat'
  ]);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const loadCategories = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/admin/categories');
      if (res.ok) {
        const data = await res.json();
        const incomingNames: string[] = [];
        if (Array.isArray(data.categories)) {
          for (const item of data.categories) {
            const name = typeof item === 'string' ? item : item?.name;
            if (name && typeof name === 'string' && name.trim()) incomingNames.push(name.trim());
          }
        }
        if (Array.isArray(data.items)) {
          for (const item of data.items) {
            const name = typeof item === 'string' ? item : item?.name;
            if (name && typeof name === 'string' && name.trim()) incomingNames.push(name.trim());
          }
        }
        if (incomingNames.length > 0) {
          setAvailableCategories(prev => {
            const set = new Set([...incomingNames, ...prev]);
            return Array.from(set).sort((a, b) => String(a || '').localeCompare(String(b || ''), 'uz'));
          });
        }
      }
    } catch {
      // Keep existing presets
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (isAddOfferModalOpen) {
      loadCategories();
    }
  }, [isAddOfferModalOpen, loadCategories]);

  useEffect(() => {
    if (storeOffers && storeOffers.length > 0) {
      const existingOfferCats = storeOffers
        .map(o => o.variant?.category)
        .filter((c): c is string => Boolean(c && typeof c === 'string' && c.trim()));
      if (existingOfferCats.length > 0) {
        setAvailableCategories(prev => {
          const set = new Set([...existingOfferCats, ...prev]);
          return Array.from(set).sort((a, b) => String(a || '').localeCompare(String(b || ''), 'uz'));
        });
      }
    }
  }, [storeOffers]);

  const handleAddNewCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      showToast('Kategoriya nomini kiriting');
      return;
    }
    setAvailableCategories(prev => {
      const set = new Set([trimmed, ...prev]);
      return Array.from(set).sort((a, b) => String(a || '').localeCompare(String(b || ''), 'uz'));
    });
    setNewOfferForm(prev => ({ ...prev, category: trimmed }));
    setNewCategoryName('');
    setIsAddingNewCategory(false);
    showToast(`"${trimmed}" kategoriyasi tanlandi`);
  };

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
      const res = await apiFetch(`/api/v1/admin/stores/${selectedStore.id}/offers`, {
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

  // Filter stores - District selection is strictly mandatory
  const districtOptions = useMemo(() => {
    if (!selectedRegion) return [];
    const norm = normalizeArea(selectedRegion);
    const regData = UZBEKISTAN_REGIONS.find(
      (r) => normalizeArea(r.name) === norm || norm.includes(normalizeArea(r.name))
    );
    const predefined = regData ? regData.districts.map((d) => d.name) : [];
    const sourceStores = regionStores.length > 0 ? regionStores : stores;
    const fromStores = sourceStores
      .filter((st) => matchesRegion(st, selectedRegion))
      .flatMap((st) => [st.district, st.city])
      .filter((name): name is string => !!name?.trim());
    return Array.from(new Set([...predefined, ...fromStores]))
      .filter((d) => d && d !== 'Barcha tumanlar')
      .sort((a, b) => String(a || '').localeCompare(String(b || ''), 'uz'));
  }, [stores, regionStores, selectedRegion]);

  const filteredStores = useMemo(() => {
    if (!selectedRegion || !selectedDistrict || selectedDistrict === 'Barcha tumanlar') return [];

    const sourceStores = regionStores.length > 0 ? regionStores : stores.filter((st) => matchesRegion(st, selectedRegion));

    return sourceStores.filter((st) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        st.name.toLowerCase().includes(query) ||
        st.address.toLowerCase().includes(query) ||
        (st.inn && st.inn.includes(query)) ||
        (st.organizationName && st.organizationName.toLowerCase().includes(query)) ||
        st.phone.includes(query);

      const matchRegion = matchesRegion(st, selectedRegion);
      const matchDistrict = matchesDistrict(st, selectedDistrict, selectedRegion);

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
  }, [stores, regionStores, searchQuery, selectedRegion, selectedDistrict, filterMode]);

  useEffect(() => {
    setSelectedStore((current) => (current && filteredStores.some((store) => store.id === current.id) ? current : null));
  }, [filteredStores]);

  const activePharmaciesInRegion = useMemo(() => {
    return filteredStores.filter((store) => {
      const theme = getPoiTheme(store, isDarkMode);
      return theme.category === 'PHARMACY' || store.type === 'PHARMACY';
    });
  }, [filteredStores, isDarkMode]);

  const storesWithIssuesCount = filteredStores.filter(
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
      const uzumLayer = L.layerGroup().addTo(map);
      uzumMarkersLayerRef.current = uzumLayer;
      const clubsLayer = L.layerGroup().addTo(map);
      gameClubsMarkersLayerRef.current = clubsLayer;
      const korzinkaLayer = L.layerGroup().addTo(map);
      korzinkaMarkersLayerRef.current = korzinkaLayer;
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

    const isZoomedIn = currentZoom >= 16;

    filteredStores.filter(validLocation).forEach((store) => {
      const lat = store.location.lat;
      const lng = store.location.lng;
      const hasIssues = (store.openReportsCount || 0) > 0 || store.status === 'PENDING' || store.status === 'NEEDS_CHANGES';
      const issueCount = store.openReportsCount || (store.status === 'PENDING' ? 1 : 0);
      const isSelected = selectedStore?.id === store.id;

      const poi = getPoiTheme(store, isDarkMode);

      const isGameClub = store.type === 'GAME_CLUB';
      if (isGameClub && !showGameClubs) {
        return;
      }

      const isPharmacy = poi.category === 'PHARMACY' || store.type === 'PHARMACY';
      if (isPharmacy && !showPharmacies) {
        return;
      }

      // When zoomed out (currentZoom < 14) and NOT selected: show sleek POI disc
      if (!isZoomedIn && !isSelected) {
        const dotHtml = `
          <div class="custom-admin-dot-marker" style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); cursor: pointer; user-select: none;">
            <div style="position: relative; width: 18px; height: 18px; border-radius: 9999px; background: ${poi.discBg}; border: 1.5px solid ${hasIssues ? '#EF4444' : poi.discBorder}; box-shadow: 0 2px 5px ${poi.shadow}; display: flex; align-items: center; justify-content: center; font-size: 10px;">
              ${poi.icon}
              ${hasIssues ? `
                <div style="position: absolute; top: -3px; right: -3px; width: 7px; height: 7px; border-radius: 9999px; background: #DC2626; border: 1px solid white;"></div>
              ` : ''}
            </div>
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
          `<div style="font-weight: 700; font-size: 11px; padding: 2px 4px;">${hasIssues ? '🔴 ' : poi.icon + ' '}${store.name}</div>`,
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

      // Detailed POI (Icon Disc + Crystal-Clear Name label underneath) when zoomed in (>= 14) or selected
      const markerHtml = `
        <div class="custom-admin-marker" style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; pointer-events: auto; cursor: pointer; user-select: none; width: max-content;">
          ${isSelected ? `
            <div style="background: #10B981; color: white; font-size: 8.5px; font-weight: 800; padding: 1px 6px; border-radius: 9999px; margin-bottom: 2px; box-shadow: 0 2px 5px rgba(0,0,0,0.25); border: 1px solid white; white-space: nowrap;">
              ✓ TANLANGAN
            </div>
          ` : ''}
          <div style="position: relative; width: 26px; height: 26px; border-radius: 9999px; background: ${poi.discBg}; border: 2px solid ${hasIssues ? '#EF4444' : poi.discBorder}; box-shadow: 0 2px 6px ${poi.shadow}, 0 0 0 ${isSelected ? '3.5px #10B981' : '1.5px rgba(255,255,255,0.95)'}; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 1; transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'}; transition: transform 0.15s ease-out;">
            ${poi.icon}
            ${hasIssues ? `
              <div style="position: absolute; top: -5px; right: -5px; min-width: 15px; height: 15px; padding: 0 2px; background: #DC2626; color: white; font-size: 8.5px; font-weight: 800; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border: 1.5px solid white;">
                ${issueCount}
              </div>
            ` : ''}
          </div>
          <div style="margin-top: 3px; display: inline-block; white-space: nowrap; width: max-content; max-width: 170px; overflow: hidden; text-overflow: ellipsis; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; font-weight: 800; color: ${hasIssues ? '#DC2626' : poi.color}; text-align: center; background: ${isDarkMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)'}; padding: 2px 8px; border-radius: 6px; border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)'}; box-shadow: 0 2px 6px rgba(0,0,0,0.22); letter-spacing: -0.15px; line-height: 1.25;">
            ${store.name}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-admin-marker-wrap',
        html: markerHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -20]
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

  }, [filteredStores, selectedStore, currentZoom, isDarkMode, showGameClubs, showPharmacies]);

  // Render Uzum Market Points (active in all environments including deploy)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = uzumMarkersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (!showUzumPoints || !activeUzumInRegion.length) return;

    const isZoomedIn = currentZoom >= 16;

    activeUzumInRegion.slice(0, 150).forEach((point) => {
      const lat = point.location?.lat;
      const lng = point.location?.lng;
      if (!lat || !lng) return;

      const markerIcon = isZoomedIn
        ? L.divIcon({
            className: 'admin-uzum-pvz-pin',
            html: `
              <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none; width: max-content;">
                <div style="width: 26px; height: 26px; border-radius: 9999px; background: #F3E8FF; border: 2px solid #A855F7; box-shadow: 0 2px 6px rgba(112,0,255,0.4), 0 0 0 1.5px rgba(255,255,255,0.95); display: flex; align-items: center; justify-content: center; font-size: 13px;">
                  🟣
                </div>
                <div style="margin-top: 3px; display: inline-block; white-space: nowrap; width: max-content; max-width: 170px; overflow: hidden; text-overflow: ellipsis; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; font-weight: 800; color: #7000FF; text-align: center; background: ${isDarkMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)'}; padding: 2px 8px; border-radius: 6px; border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)'}; box-shadow: 0 2px 6px rgba(0,0,0,0.22); letter-spacing: -0.15px; line-height: 1.25;">
                  ${point.name || 'Uzum PVZ'}
                </div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -18]
          })
        : L.divIcon({
            className: 'admin-uzum-pvz-dot',
            html: `
              <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); cursor: pointer; user-select: none;">
                <div style="width: 18px; height: 18px; border-radius: 9999px; background: #F3E8FF; border: 1.5px solid #A855F7; box-shadow: 0 2px 5px rgba(112,0,255,0.35); display: flex; align-items: center; justify-content: center; font-size: 10px;">
                  🟣
                </div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -10]
          });

      const marker = L.marker([lat, lng], { icon: markerIcon });
      marker.bindTooltip(
        `<div style="font-weight: 700; font-size: 11px; padding: 2px 4px;">🟣 ${point.name || 'Uzum Market PVZ'}</div>`,
        { direction: 'top', offset: [0, -10], opacity: 0.95 }
      );

      const popupHtml = `
        <div style="min-width: 220px; max-width: 280px; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 3px;">
            <span style="font-size: 13px;">🟣</span>
            <div style="font-weight: 800; font-size: 13px; color: #7000FF; line-height: 1.2;">
              ${point.name || 'Uzum Market PVZ'}
            </div>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
            📍 ${point.address || point.city || 'O‘zbekiston'}
          </div>
          <div style="font-size: 10px; font-weight: 700; color: #16A34A; margin-bottom: 4px;">
            ⏰ Ish vaqti: 10:00 — 20:00 (Har kuni)
          </div>
          <span style="font-size: 9.5px; padding: 2px 6px; border-radius: 4px; background: #F3E8FF; color: #7000FF; font-weight: 800; display: inline-block;">
            Lokal Uzum Nuqtasi (Dev)
          </span>
        </div>
      `;
      marker.bindPopup(popupHtml, { offset: [0, -14] });

      marker.on('click', (e) => {
        if (!isZoomedIn) {
          L.DomEvent.stopPropagation(e);
          const curZoom = map.getZoom();
          map.setView([lat, lng], Math.max(curZoom, 16), { animate: true });
        }
      });

      layer.addLayer(marker);
    });
  }, [activeUzumInRegion, showUzumPoints, currentZoom, isDarkMode]);

  // Render Game Clubs (active in all environments including deploy)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = gameClubsMarkersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (!showGameClubs || !activeClubsInRegion.length) return;

    const isZoomedIn = currentZoom >= 16;

    activeClubsInRegion.slice(0, 150).forEach((club) => {
      const lat = club.location?.lat;
      const lng = club.location?.lng;
      if (!lat || !lng) return;

      const markerIcon = isZoomedIn
        ? L.divIcon({
            className: 'admin-game-club-pin',
            html: `
              <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none; width: max-content;">
                <div style="width: 26px; height: 26px; border-radius: 9999px; background: #F0F9FF; border: 2px solid #38BDF8; box-shadow: 0 2px 6px rgba(2,132,199,0.45), 0 0 0 1.5px rgba(255,255,255,0.95); display: flex; align-items: center; justify-content: center; font-size: 13px;">
                  🎮
                </div>
                <div style="margin-top: 3px; display: inline-block; white-space: nowrap; width: max-content; max-width: 170px; overflow: hidden; text-overflow: ellipsis; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; font-weight: 800; color: #0284C7; text-align: center; background: ${isDarkMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)'}; padding: 2px 8px; border-radius: 6px; border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)'}; box-shadow: 0 2px 6px rgba(0,0,0,0.22); letter-spacing: -0.15px; line-height: 1.25;">
                  ${club.name || 'Game Club'}
                </div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -18]
          })
        : L.divIcon({
            className: 'admin-game-club-dot',
            html: `
              <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); cursor: pointer; user-select: none;">
                <div style="width: 18px; height: 18px; border-radius: 9999px; background: #F0F9FF; border: 1.5px solid #38BDF8; box-shadow: 0 2px 5px rgba(2,132,199,0.4); display: flex; align-items: center; justify-content: center; font-size: 10px;">
                  🎮
                </div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -10]
          });

      const marker = L.marker([lat, lng], { icon: markerIcon });
      marker.bindTooltip(
        `<div style="font-weight: 700; font-size: 11px; padding: 2px 4px;">🎮 ${club.name || 'Game Club'}</div>`,
        { direction: 'top', offset: [0, -10], opacity: 0.95 }
      );

      const popupHtml = `
        <div style="min-width: 220px; max-width: 280px; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 3px;">
            <span style="font-size: 13px;">🎮</span>
            <div style="font-weight: 800; font-size: 13px; color: #0284C7; line-height: 1.2;">
              ${club.name || 'Game Club'}
            </div>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
            📍 ${club.address || club.city || 'O‘zbekiston'}
          </div>
          <div style="font-size: 11px; color: #F59E0B; font-weight: 700; margin-bottom: 4px;">
            ★ ${club.rating || '4.8'} (${club.reviewCount || 10})
          </div>
          <span style="font-size: 9.5px; padding: 2px 6px; border-radius: 4px; background: #E0F2FE; color: #0369A1; font-weight: 800; display: inline-block;">
            Lokal Game Club (Dev)
          </span>
        </div>
      `;
      marker.bindPopup(popupHtml, { offset: [0, -14] });

      marker.on('click', (e) => {
        if (!isZoomedIn) {
          L.DomEvent.stopPropagation(e);
          const curZoom = map.getZoom();
          map.setView([lat, lng], Math.max(curZoom, 16), { animate: true });
        }
      });

      layer.addLayer(marker);
    });
  }, [activeClubsInRegion, showGameClubs, currentZoom, isDarkMode]);

  // Render Korzinka Supermarkets (active across Uzbekistan)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = korzinkaMarkersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (!showKorzinka || !activeKorzinkaInRegion.length) return;

    const isZoomedIn = currentZoom >= 16;

    activeKorzinkaInRegion.slice(0, 200).forEach((store) => {
      const lat = store.location?.lat;
      const lng = store.location?.lng;
      if (!lat || !lng) return;

      const markerIcon = isZoomedIn
        ? L.divIcon({
            className: 'admin-korzinka-pin',
            html: `
              <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none; width: max-content;">
                <div style="width: 26px; height: 26px; border-radius: 9999px; background: #FEF2F2; border: 2px solid #EF4444; box-shadow: 0 2px 6px rgba(227,30,36,0.45), 0 0 0 1.5px rgba(255,255,255,0.95); display: flex; align-items: center; justify-content: center; font-size: 13px;">
                  🛒
                </div>
                <div style="margin-top: 3px; display: inline-block; white-space: nowrap; width: max-content; max-width: 170px; overflow: hidden; text-overflow: ellipsis; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11.5px; font-weight: 800; color: #E31E24; text-align: center; background: ${isDarkMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)'}; padding: 2px 8px; border-radius: 6px; border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)'}; box-shadow: 0 2px 6px rgba(0,0,0,0.22); letter-spacing: -0.15px; line-height: 1.25;">
                  ${store.name || 'Korzinka'}
                </div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -18]
          })
        : L.divIcon({
            className: 'admin-korzinka-dot',
            html: `
              <div style="position: absolute; left: 0; bottom: 0; transform: translate(-50%, -50%); cursor: pointer; user-select: none;">
                <div style="width: 20px; height: 20px; border-radius: 9999px; background: #FEF2F2; border: 1.5px solid #EF4444; box-shadow: 0 2px 5px rgba(227,30,36,0.4); display: flex; align-items: center; justify-content: center; font-size: 11px;">
                  🛒
                </div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -10]
          });

      const marker = L.marker([lat, lng], { icon: markerIcon });
      marker.bindTooltip(
        `<div style="font-weight: 700; font-size: 11px; padding: 2px 4px;">🛒 ${store.name || 'Korzinka'}</div>`,
        { direction: 'top', offset: [0, -12] }
      );

      const hoursText = store.is24Hours ? '24 soat ochiq' : 'Ochiq';
      const popupHtml = `
        <div style="min-width: 220px; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 3px;">
            <span style="font-size: 13px;">🛒</span>
            <div style="font-weight: 800; font-size: 13px; color: #E31E24; line-height: 1.2;">
              ${store.name || 'Korzinka Supermarket'}
            </div>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
            📍 ${store.address || store.city || 'O‘zbekiston'}
          </div>
          <div style="font-size: 10px; font-weight: 700; color: #16A34A; margin-bottom: 4px;">
            ⏰ Ish vaqti: ${hoursText}
          </div>
          ${store.phone ? `<div style="font-size: 10px; color: #E31E24; font-weight: 600; margin-bottom: 4px;">📞 ${store.phone}</div>` : ''}
          <span style="font-size: 9.5px; padding: 2px 6px; border-radius: 4px; background: #FEE2E2; color: #991B1B; font-weight: 800; display: inline-block;">
            Korzinka Supermarket (${store.branchCode || 'K'})
          </span>
        </div>
      `;
      marker.bindPopup(popupHtml, { offset: [0, -14] });

      marker.on('click', (e) => {
        if (!isZoomedIn) {
          L.DomEvent.stopPropagation(e);
          const curZoom = map.getZoom();
          map.setView([lat, lng], Math.max(curZoom, 16), { animate: true });
        }
      });

      layer.addLayer(marker);
    });
  }, [activeKorzinkaInRegion, showKorzinka, currentZoom, isDarkMode]);

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

    // Check if a specific district was chosen and center directly on its coordinates
    if (selectedRegion && selectedDistrict && selectedDistrict !== 'Barcha tumanlar') {
      const regData = UZBEKISTAN_REGIONS.find((r) => normalizeArea(r.name) === normalizeArea(selectedRegion));
      const distData = regData?.districts.find(
        (d) => normalizeArea(d.name) === normalizeArea(selectedDistrict) || d.name.toLowerCase().includes(selectedDistrict.toLowerCase())
      );
      if (distData) {
        map.setView([distData.lat, distData.lng], 14, { animate: true });
        isInitialGeoFitDone.current = true;
        return;
      }
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

  }, [selectedRegion, selectedDistrict, filteredStores]);

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
            {selectedRegion ? `${selectedRegion}: ${filteredStores.length} ta do‘kon` : 'Viloyat tanlanmagan'}
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
            onChange={(e) => {
              const val = e.target.value;
              setSelectedRegion(val);
              setSelectedDistrict('');
              try {
                localStorage.setItem('yaqintop_admin_region', val);
                localStorage.removeItem('yaqintop_admin_city');
              } catch {}
            }}
            className="w-full p-2 rounded-xl text-xs font-bold transition-all border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] focus:border-[#116B50]"
          >
            <option value="">Viloyatni tanlang...</option>
            {REGION_OPTIONS.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        </div>

        {/* District (Mandatory when region is chosen) */}
        <div>
          <select
            aria-label="Tuman yoki shahar"
            value={selectedDistrict}
            disabled={!selectedRegion}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedDistrict(val);
              try {
                if (val) {
                  localStorage.setItem('yaqintop_admin_city', val);
                } else {
                  localStorage.removeItem('yaqintop_admin_city');
                }
              } catch {}
            }}
            className={`w-full p-2 rounded-xl text-xs font-bold transition-all ${
              !selectedRegion
                ? 'opacity-60 cursor-not-allowed border border-[#DCE5DF] dark:border-[#273B32] bg-gray-100 dark:bg-gray-800'
                : !selectedDistrict
                ? 'border-2 border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30 font-extrabold animate-pulse'
                : 'border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] focus:border-[#116B50]'
            }`}
          >
            <option value="">
              {!selectedRegion ? 'Avval viloyatni tanlang...' : 'Shahar / tumanni tanlang (Majburiy)...'}
            </option>
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
            Barchasi ({filteredStores.length})
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

      {/* Mobile Map / List View Switcher */}
      <div className="lg:hidden flex p-1 bg-[#EAEFEA] dark:bg-[#1A2822] rounded-2xl gap-1 border border-[#DCE5DF] dark:border-[#263D33] shadow-xs">
        <button
          type="button"
          onClick={() => {
            setMobileTab('map');
            setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            mobileTab === 'map'
              ? 'bg-[#116B50] text-white shadow-sm'
              : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Xarita</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            mobileTab === 'list'
              ? 'bg-[#116B50] text-white shadow-sm'
              : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Do‘konlar ({filteredStores.length})</span>
        </button>
      </div>

      {/* Main Map + Store List Panel */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Left Side: Leaflet Map Container */}
        <div className={`flex-1 rounded-2xl overflow-hidden border border-[#DCE5DF] dark:border-[#22332C] relative shadow-sm min-h-[350px] ${mobileTab === 'list' ? 'hidden lg:block' : 'block'} ${isAddStoreMode ? 'cursor-crosshair' : ''}`}>
          <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

          {/* Floating Category Toggles (Dorixona, Game Club, Uzum) */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
            {/* Pharmacy (Dorixona) toggle */}
            <button
              type="button"
              onClick={() => setShowPharmacies(!showPharmacies)}
              title={showPharmacies ? `Dorixonalarni yashirish (${activePharmaciesInRegion.length} ta)` : `Dorixonalarni ko‘rsatish (${activePharmaciesInRegion.length} ta)`}
              className={`w-9 h-9 sm:w-10 sm:h-10 backdrop-blur-md rounded-xl border flex items-center justify-center shadow-md transition active:scale-95 text-sm font-black cursor-pointer ${
                showPharmacies
                  ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-red-500/30 ring-2 ring-[#DC2626]/30'
                  : 'bg-white/95 dark:bg-[#14201A]/95 text-[#DC2626] border-[#DCE5DF] dark:border-[#273B32] hover:bg-red-50'
              }`}
            >
              <span>💊</span>
            </button>

            {/* Game Clubs toggle */}
            <button
              type="button"
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

            {/* Korzinka Supermarkets toggle */}
            <button
              type="button"
              onClick={() => setShowKorzinka(!showKorzinka)}
              title={showKorzinka ? `Korzinkalarni yashirish (${activeKorzinkaInRegion.length} ta)` : `Korzinkalarni ko‘rsatish (${activeKorzinkaInRegion.length} ta)`}
              className={`w-9 h-9 sm:w-10 sm:h-10 backdrop-blur-md rounded-xl border flex items-center justify-center shadow-md transition active:scale-95 text-sm font-black cursor-pointer ${
                showKorzinka
                  ? 'bg-[#E31E24] text-white border-[#E31E24] shadow-red-500/30 ring-2 ring-[#E31E24]/30'
                  : 'bg-white/95 dark:bg-[#14201A]/95 text-[#E31E24] border-[#DCE5DF] dark:border-[#273B32] hover:bg-red-50'
              }`}
            >
              <span>🛒</span>
            </button>

            {/* Uzum Market points toggle */}
            <button
              type="button"
              onClick={() => setShowUzumPoints(!showUzumPoints)}
              title={showUzumPoints ? `Uzum Market nuqtalarini yashirish (${activeUzumInRegion.length} ta)` : `Uzum Market nuqtalarini ko‘rsatish (${activeUzumInRegion.length} ta)`}
              className={`w-9 h-9 sm:w-10 sm:h-10 backdrop-blur-md rounded-xl border flex items-center justify-center shadow-md transition active:scale-95 text-sm font-black cursor-pointer ${
                showUzumPoints
                  ? 'bg-[#7000FF] text-white border-[#7000FF] shadow-purple-500/30 ring-2 ring-[#7000FF]/30'
                  : 'bg-white/95 dark:bg-[#14201A]/95 text-[#7000FF] border-[#DCE5DF] dark:border-[#273B32] hover:bg-purple-50'
              }`}
            >
              <span>U</span>
            </button>
          </div>

          {/* Empty region guidance overlay on map */}
          {!selectedRegion && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/10 backdrop-blur-[2px] pointer-events-none">
              <div className="bg-white/95 dark:bg-[#14201A]/95 border-2 border-dashed border-[#116B50] dark:border-[#4ADE80] rounded-2xl p-6 shadow-2xl max-w-sm text-center pointer-events-auto">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-sm text-[#172C28] dark:text-white mb-1.5">
                  Viloyatni tanlang
                </h3>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] leading-relaxed mb-3">
                  Xaritada tashkilotlarni ko‘rish uchun avval yuqoridagi menyudan viloyat va tumanni tanlang.
                </p>
                <div className="text-[11px] font-bold text-[#116B50] dark:text-[#4ADE80] bg-emerald-50 dark:bg-[#1B2F25] px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 inline-flex items-center gap-1.5">
                  <span>☝️</span>
                  <span>Yuqoridagi «Viloyat» filtrini oching</span>
                </div>
              </div>
            </div>
          )}

          {/* Mandatory district selection floating overlay on map */}
          {selectedRegion && !selectedDistrict && (
            <div className="absolute inset-x-4 bottom-5 z-20 max-w-xl mx-auto bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border-2 border-emerald-500 transition-all pointer-events-auto animate-in slide-in-from-bottom duration-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-lg font-bold shrink-0">
                  📍
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-xs sm:text-sm text-[#172C28] dark:text-white">
                      Shahar yoki tumanni tanlang (Majburiy)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-600 text-white uppercase tracking-wider">
                      Majburiy
                    </span>
                  </div>
                  <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                    <span className="font-bold text-[#116B50] dark:text-[#4ADE80]">{selectedRegion}</span> bo‘yicha do‘konlar va xizmatlarni ko‘rish uchun quyidagi tumanlardan birini tanlang:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5 max-h-32 overflow-y-auto pr-1">
                    {districtOptions.map((dist) => (
                      <button
                        key={dist}
                        type="button"
                        onClick={() => {
                          setSelectedDistrict(dist);
                          try {
                            localStorage.setItem('yaqintop_admin_city', dist);
                          } catch {}
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/60 transition shadow-xs hover:scale-[1.02] active:scale-95 cursor-pointer"
                      >
                        {dist}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* Map Legend Floating Overlay (Bottom Left) */}
          <div className="absolute bottom-4 left-3 z-10 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-sm p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#22332C] shadow-lg text-[10.5px] flex flex-col gap-1 pointer-events-auto">
            <span className="font-extrabold text-[#172C28] dark:text-white mb-0.5">Xarita belgilari</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#116B50]"></span>
              <span className="text-[#566A63] dark:text-[#8B9E95]">Faol do‘kon</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
              <span className="text-red-600 dark:text-red-400 font-semibold">🔴 Shikoyat / Moderatsiya</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              <span className="text-[#566A63] dark:text-[#8B9E95]">Kutilayotgan ariza</span>
            </div>
          </div>

          {/* Mobile floating selected store preview on top of map */}
          {selectedStore && mobileTab === 'map' && (
            <div className="lg:hidden absolute bottom-4 left-3 right-3 z-20 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md p-3.5 rounded-2xl border-2 border-[#116B50] dark:border-[#4ADE80] shadow-2xl flex items-center justify-between gap-2 animate-in slide-in-from-bottom duration-200">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-[#172C28] dark:text-white truncate">{selectedStore.name}</span>
                  <Tag variant={selectedStore.status === 'ACTIVE' ? 'default' : 'warn'} className="text-[9px]">
                    {selectedStore.status}
                  </Tag>
                </div>
                <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] truncate block">
                  {selectedStore.organizationName}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileTab('list')}
                  className="px-2.5 py-1.5 bg-[#116B50] text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Batafsil
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStore(null)}
                  className="p-1 text-[#566A63] hover:text-red-500 font-bold text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Stores Directory & Interactive Inspector */}
        <div className={`w-full lg:w-96 flex flex-col gap-3 min-h-0 ${mobileTab === 'map' ? 'hidden lg:flex' : 'flex'}`}>
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
                    {selectedStore.localCatalog ? 'Lokal katalog' : `${selectedStore.organizationName} (INN: ${selectedStore.inn || '308123456'})`}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileTab('map');
                      setTimeout(() => {
                        mapInstanceRef.current?.invalidateSize();
                        if (selectedStore.location) {
                          mapInstanceRef.current?.setView([selectedStore.location.lat, selectedStore.location.lng], 16, { animate: true });
                        }
                      }, 50);
                    }}
                    className="lg:hidden px-2 py-1 bg-[#116B50] hover:bg-[#0D533E] text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition shadow-xs"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Xarita</span>
                  </button>
                  <button
                    onClick={() => setSelectedStore(null)}
                    className="text-xs text-[#566A63] hover:text-red-500 font-bold p-1"
                  >
                    ✕
                  </button>
                </div>
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
                            await apiFetch(`/api/v1/admin/stores/${selectedStore.id}/resolve-issues`, {
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
                              await apiFetch(`/api/v1/admin/applications/${selectedStore.id}`, {
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
                      : selectedStore.localCatalog ? '—' : '08:00 - 22:00'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {!selectedStore.localCatalog && <div className="flex flex-col gap-2 pt-2 border-t border-[#DCE5DF] dark:border-[#22332C]">
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
              </div>}

              {/* Store Offers & Services List */}
              {!selectedStore.localCatalog && (
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

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditOffer(off)}
                              title="Tahrirlash va Rasm"
                              className="p-1 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition shrink-0 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOffer(off.id)}
                              title="O‘chirish"
                              className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition shrink-0 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>)}
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
                {selectedRegion || 'Viloyat tanlanmagan'}
              </span>
            </div>

            {!selectedRegion ? (
              <div className="p-6 text-center flex flex-col items-center justify-center my-auto">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center mb-2">
                  <MapPin className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-[#172C28] dark:text-white mb-1">
                  Viloyat tanlanmagan
                </p>
                <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] max-w-[200px]">
                  Tashkilotlarni ko‘rish uchun yuqoridagi filtrdan viloyatni tanlang.
                </p>
              </div>
            ) : !selectedDistrict ? (
              <div className="p-6 text-center flex flex-col items-center justify-center my-auto">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center mb-2">
                  <MapPin className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-[#172C28] dark:text-white mb-1">
                  Shahar / tuman tanlanmagan
                </p>
                <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] max-w-[220px]">
                  «{selectedRegion}» bo‘yicha do‘konlarni ko‘rish uchun shahar yoki tumanni tanlang (Majburiy).
                </p>
              </div>
            ) : filteredStores.length === 0 ? (
              <p role="status" className="p-4 text-xs text-center text-[#566A63] dark:text-[#8B9E95]">
                {isLoadingRegionStores ? 'Do‘konlar yuklanmoqda...' : 'Ushbu hududda do‘kon topilmadi.'}
              </p>
            ) : (
              filteredStores.map((st) => {
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
            }))}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[#172C28] dark:text-[#E8F2EC]">Kategoriya *</label>
                  {!isAddingNewCategory && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCategory(true)}
                      className="text-[11px] font-bold text-[#116B50] dark:text-[#4ADE80] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>+ Yangi kategoriya</span>
                    </button>
                  )}
                </div>

                {!isAddingNewCategory ? (
                  <select
                    value={newOfferForm.category}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsAddingNewCategory(true);
                      } else {
                        setNewOfferForm({ ...newOfferForm, category: e.target.value });
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] font-medium"
                  >
                    {newOfferForm.category && !availableCategories.includes(newOfferForm.category) && (
                      <option value={newOfferForm.category}>{newOfferForm.category}</option>
                    )}
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__NEW__" className="font-bold text-[#116B50]">
                      ➕ Yangi kategoriya yozish...
                    </option>
                  </select>
                ) : (
                  <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">Yangi kategoriya:</span>
                      <button
                        type="button"
                        onClick={() => { setIsAddingNewCategory(false); setNewCategoryName(''); }}
                        className="text-[10px] text-gray-500 hover:text-red-500 font-bold cursor-pointer"
                      >
                        ✕ Bekor qilish
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewCategory();
                          }
                        }}
                        placeholder="Masalan: Fastfood, Burgerlar..."
                        className="flex-1 p-2 rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] text-xs text-[#172C28] dark:text-[#E8F2EC]"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewCategory}
                        className="px-3 py-2 bg-[#116B50] hover:bg-[#0d533e] text-white rounded-lg text-xs font-bold shrink-0 transition shadow-xs cursor-pointer"
                      >
                        Qo‘shish
                      </button>
                    </div>
                  </div>
                )}
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

      {/* EDIT OFFER MODAL */}
      {isEditOfferModalOpen && (
        <Modal
          isOpen={isEditOfferModalOpen}
          onClose={() => setIsEditOfferModalOpen(false)}
          title={`"${editOfferForm.title || 'Tovar/Xizmat'}" ma’lumotlarini tahrirlash`}
        >
          <form onSubmit={handleSubmitEditOffer} className="flex flex-col gap-4 text-xs">
            {/* Type selector: Tovar vs Usluga */}
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Turi *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditOfferForm(prev => ({ ...prev, type: 'PRODUCT', packUnit: prev.type === 'SERVICE' ? 'dona' : prev.packUnit }))}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    editOfferForm.type === 'PRODUCT'
                      ? 'border-[#116B50] bg-emerald-50 dark:bg-emerald-950/40 text-[#116B50] dark:text-[#4ADE80] ring-1 ring-[#116B50]'
                      : 'border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] text-[#566A63]'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>📦 Tovar (Mahsulot)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditOfferForm(prev => ({ ...prev, type: 'SERVICE', packUnit: prev.type === 'PRODUCT' ? 'xizmat' : prev.packUnit }))}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    editOfferForm.type === 'SERVICE'
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
                {editOfferForm.type === 'SERVICE' ? 'Xizmat nomi *' : 'Tovar / Mahsulot nomi *'}
              </label>
              <input
                type="text"
                required
                value={editOfferForm.title || ''}
                onChange={(e) => setEditOfferForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder={editOfferForm.type === 'SERVICE' ? 'Masalan: Avtomobil diagnostikasi yoki Soch turmagi' : 'Masalan: Flesh 0.5l yoki Qora non'}
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
                  value={editOfferForm.price || ''}
                  onChange={(e) => setEditOfferForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="Masalan: 15000"
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] font-mono"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">Birligi</label>
                <select
                  value={editOfferForm.packUnit || ''}
                  onChange={(e) => setEditOfferForm(prev => ({ ...prev, packUnit: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
                >
                  {editOfferForm.type === 'SERVICE' ? (
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
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[#172C28] dark:text-[#E8F2EC]">Kategoriya *</label>
                  {!isAddingNewEditCategory && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewEditCategory(true)}
                      className="text-[11px] font-bold text-[#116B50] dark:text-[#4ADE80] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>+ Yangi kategoriya</span>
                    </button>
                  )}
                </div>

                {!isAddingNewEditCategory ? (
                  <select
                    value={editOfferForm.category || ''}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsAddingNewEditCategory(true);
                      } else {
                        setEditOfferForm(prev => ({ ...prev, category: e.target.value }));
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] font-medium"
                  >
                    {editOfferForm.category && !availableCategories.includes(editOfferForm.category) && (
                      <option value={editOfferForm.category}>{editOfferForm.category}</option>
                    )}
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__NEW__" className="font-bold text-[#116B50]">
                      ➕ Yangi kategoriya yozish...
                    </option>
                  </select>
                ) : (
                  <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">Yangi kategoriya:</span>
                      <button
                        type="button"
                        onClick={() => { setIsAddingNewEditCategory(false); setNewEditCategoryName(''); }}
                        className="text-[10px] text-gray-500 hover:text-red-500 font-bold cursor-pointer"
                      >
                        ✕ Bekor qilish
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={newEditCategoryName}
                        onChange={(e) => setNewEditCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newEditCategoryName.trim()) {
                              const trimmed = newEditCategoryName.trim();
                              if (!availableCategories.includes(trimmed)) {
                                setAvailableCategories(prev => [...prev, trimmed]);
                              }
                              setEditOfferForm(prev => ({ ...prev, category: trimmed }));
                              setNewEditCategoryName('');
                              setIsAddingNewEditCategory(false);
                            }
                          }
                        }}
                        placeholder="Masalan: Fastfood, Burgerlar..."
                        className="flex-1 p-2 rounded-lg border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] text-xs text-[#172C28] dark:text-[#E8F2EC]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newEditCategoryName.trim()) {
                            const trimmed = newEditCategoryName.trim();
                            if (!availableCategories.includes(trimmed)) {
                              setAvailableCategories(prev => [...prev, trimmed]);
                            }
                            setEditOfferForm(prev => ({ ...prev, category: trimmed }));
                            setNewEditCategoryName('');
                            setIsAddingNewEditCategory(false);
                          }
                        }}
                        className="px-3 py-2 bg-[#116B50] hover:bg-[#0d533e] text-white rounded-lg text-xs font-bold shrink-0 transition shadow-xs cursor-pointer"
                      >
                        Qo‘shish
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">
                  {editOfferForm.type === 'SERVICE' ? 'Mavjudligi' : 'Soni / Qoldiq (dona)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={editOfferForm.stockOnHand || ''}
                  onChange={(e) => setEditOfferForm(prev => ({ ...prev, stockOnHand: e.target.value }))}
                  placeholder="10"
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] font-mono"
                />
              </div>
            </div>

            {/* Barcode & Brand (Optional) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">
                  Shtrix-kod (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={editOfferForm.barcode || ''}
                  onChange={(e) => setEditOfferForm(prev => ({ ...prev, barcode: e.target.value }))}
                  placeholder="47800..."
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] font-mono"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">
                  Brend / Ishlab chiqaruvchi
                </label>
                <input
                  type="text"
                  value={editOfferForm.brand || ''}
                  onChange={(e) => setEditOfferForm(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="Masalan: Nestle, Artel"
                  className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
                />
              </div>
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">
                Tavsif yoki qo‘shimcha ma’lumot (ixtiyoriy)
              </label>
              <textarea
                rows={2}
                value={editOfferForm.description || ''}
                onChange={(e) => setEditOfferForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mahsulot yoki xizmat haqida qisqacha ma’lumot..."
                className="w-full p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>

            {/* Photo Section */}
            <div>
              <label className="font-semibold block mb-1 text-[#172C28] dark:text-[#E8F2EC]">
                Rasmi (Foto)
              </label>
              {editOfferForm.photoUrl ? (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#DCE5DF] dark:border-[#273B32] bg-[#E2EEE4] dark:bg-[#182C22] group">
                  <img src={editOfferForm.photoUrl} alt="Offer preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <label className="px-3 py-1.5 rounded-xl bg-white text-[#172C28] text-xs font-bold hover:bg-gray-100 transition cursor-pointer flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Almashtirish</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, (url) => setEditOfferForm(prev => ({ ...prev, photoUrl: url })))}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditOfferForm(prev => ({ ...prev, photoUrl: '' }))}
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
                      onChange={(e) => handlePhotoUpload(e, (url) => setEditOfferForm(prev => ({ ...prev, photoUrl: url })))}
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
                    value={editOfferForm.photoUrl || ''}
                    onChange={(e) => setEditOfferForm(prev => ({ ...prev, photoUrl: e.target.value }))}
                    className="w-full p-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE5DF] dark:border-[#22332C]">
              <Button variant="secondary" type="button" onClick={() => setIsEditOfferModalOpen(false)}>
                Bekor qilish
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmittingEditOffer}
                className="bg-[#116B50] hover:bg-[#0d533e]"
              >
                {isSubmittingEditOffer ? 'Saqlanmoqda...' : 'O‘zgarishlarni saqlash'}
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
