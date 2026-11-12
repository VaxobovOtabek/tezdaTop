import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Truck,
  LayoutDashboard,
  Store,
  FileText,
  DollarSign,
  TrendingUp,
  MapPin,
  Globe,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Phone,
  Building2,
  Calendar,
  Package,
  Layers,
  Printer,
  Download,
  Navigation,
  Check,
  X,
  CreditCard,
  Banknote,
  RotateCcw,
  Sun,
  Moon,
  LogOut,
  User,
  Shield,
  Eye,
  EyeOff,
  Lock,
  ChevronRight,
  Info,
  Key,
  Copy
} from 'lucide-react';
import { useCachedSession, clearSessionCache, saveCachedSession, TokenQuickLoginModal, Button, Modal, Tag, LanguageSwitcher } from '@yaqintop/ui';
import { DealerMapHub } from './components/DealerMapHub';
import { useDealerI18n } from './i18n/dealer-i18n';

// Type Definitions
export interface DealerProfile {
  id: string;
  userId: string;
  companyName: string;
  contactName: string;
  login: string;
  phone: string;
  status: string;
  region: string;
  city: string;
  allowExperimentalMap: boolean;
  storeCount: number;
  totalDebt: number;
}

export interface ClientStore {
  id: string;
  dealerId: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeInn: string;
  category: string;
  lat: number;
  lng: number;
  currentDebtBalance: number;
  creditLimit: number;
  lastSupplyDate: string | null;
  status: string;
  debtStatus: 'GREEN' | 'YELLOW' | 'RED';
  daysSinceSupply: number;
  notes: string;
}

export interface DealerProduct {
  id: string;
  dealerId: string;
  name: string;
  categoryId: string;
  categoryName: string;
  sku: string;
  unit: string;
  wholesalePrice: number;
  stockQuantity: number;
}

export interface SupplyOrderItem {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SupplyOrder {
  id: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  paymentType: string;
  status: string;
  itemCount: number;
  notes?: string;
  createdAt: string;
}

export interface AktSverkaData {
  store: {
    id: string;
    name: string;
    address: string;
    phone: string;
    inn: string;
    creditLimit: number;
    currentDebtBalance: number;
    lastSupplyDate: string | null;
  };
  summary: {
    totalSupplied: number;
    totalPaid: number;
    totalReturned: number;
    currentDebtBalance: number;
  };
  transactions: {
    id: string;
    date: string;
    type: 'SUPPLY' | 'PAYMENT' | 'RETURN';
    orderNumber: string | null;
    amount: number;
    balanceAfter: number;
    comment: string;
    paymentMethod: string | null;
  }[];
}

export interface GlobalDistributionPoint {
  storeId: string;
  storeName: string;
  storeAddress: string;
  lat: number;
  lng: number;
  category: string;
  productName: string;
  unit: string;
  supplyVolume: 'LOW' | 'MEDIUM' | 'HIGH';
  lastDistributedAt: string;
}

export interface AvailableStore {
  id: string;
  name: string;
  address: string;
  phone: string;
  inn: string;
  organizationName: string;
  category: string;
  rating: number;
  isAttached: boolean;
}

export default function App() {
  const [currentUser, setCurrentUser] = useCachedSession();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('yaqintop_dealer_dark') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const { lang, t } = useDealerI18n();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stores' | 'supplies' | 'cash' | 'products' | 'analytics' | 'map'>('dashboard');

  // Core Data State
  const [dealer, setDealer] = useState<DealerProfile | null>(null);
  const [stores, setStores] = useState<ClientStore[]>([]);
  const [products, setProducts] = useState<DealerProduct[]>([]);
  const [orders, setOrders] = useState<SupplyOrder[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isAttachStoreModalOpen, setIsAttachStoreModalOpen] = useState(false);
  const [isNewStoreModalOpen, setIsNewStoreModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isAktSverkaModalOpen, setIsAktSverkaModalOpen] = useState(false);
  const [isMobileQuickActionsOpen, setIsMobileQuickActionsOpen] = useState(false);
  const [cashMobileTab, setCashMobileTab] = useState<'payment' | 'return'>('payment');
  const [selectedStoreForAction, setSelectedStoreForAction] = useState<ClientStore | null>(null);
  const [aktSverkaData, setAktSverkaData] = useState<AktSverkaData | null>(null);

  // Login Form
  const [authMode, setAuthMode] = useState<'CREDENTIALS' | 'TOKEN'>('CREDENTIALS');
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isTokenLoggingIn, setIsTokenLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Supply Form State
  const [supplyStoreId, setSupplyStoreId] = useState('');
  const [supplyLines, setSupplyLines] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([]);
  const [supplyPaidAmount, setSupplyPaidAmount] = useState<number>(0);
  const [supplyPaymentType, setSupplyPaymentType] = useState<'CASH' | 'TRANSFER' | 'CARD' | 'DEBT' | 'PARTIAL'>('PARTIAL');
  const [supplyNotes, setSupplyNotes] = useState('');

  // Payment (Inkassatsiya) Form State
  const [payStoreId, setPayStoreId] = useState('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'CASH' | 'TRANSFER' | 'CARD'>('CASH');
  const [payComment, setPayComment] = useState('');

  // Return (Vozvrat) Form State
  const [returnStoreId, setReturnStoreId] = useState('');
  const [returnProductId, setReturnProductId] = useState('');
  const [returnQuantity, setReturnQuantity] = useState<number>(1);
  const [returnComment, setReturnComment] = useState('');

  // Store Attach & Create Form State
  const [attachQuery, setAttachQuery] = useState('');
  const [attachCreditLimit, setAttachCreditLimit] = useState(5000000);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStorePhone, setNewStorePhone] = useState('+998');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreLat, setNewStoreLat] = useState(41.311081);
  const [newStoreLng, setNewStoreLng] = useState(69.240562);
  const [newStoreInn, setNewStoreInn] = useState('');

  // Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Oziq-ovqat va ichimliklar');
  const [newProdPrice, setNewProdPrice] = useState<number>(10000);
  const [newProdStock, setNewProdStock] = useState<number>(100);
  const [newProdUnit, setNewProdUnit] = useState('dona');
  const [newProdSku, setNewProdSku] = useState('');

  // Filter States
  const [storeFilterStatus, setStoreFilterStatus] = useState<'ALL' | 'GREEN' | 'YELLOW' | 'RED'>('ALL');
  const [storeSearch, setStoreSearch] = useState('');

  // Available Stores Discovery State
  const [availableStores, setAvailableStores] = useState<AvailableStore[]>([]);
  const [isLoadingAvailableStores, setIsLoadingAvailableStores] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // GIS Map Mode States
  const [mapMode, setMapMode] = useState<'crm' | 'global'>('crm');
  const [selectedStoresForRoute, setSelectedStoresForRoute] = useState<string[]>([]);
  const [calculatedRoute, setCalculatedRoute] = useState<any>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [globalGoods, setGlobalGoods] = useState<GlobalDistributionPoint[]>([]);
  const [globalCategoryFilter, setGlobalCategoryFilter] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('yaqintop_token') || localStorage.getItem('yaqintop_session_token') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadAvailableStores = async (query = '') => {
    setIsLoadingAvailableStores(true);
    try {
      const q = encodeURIComponent(query.trim());
      const res = await fetch(`/api/v1/dealer/stores/available?q=${q}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableStores(data.stores || []);
      }
    } catch {
      // silently handle
    } finally {
      setIsLoadingAvailableStores(false);
    }
  };

  const openNewSupplyModal = (initialStoreId?: string) => {
    const targetStoreId = initialStoreId || (stores.length > 0 ? stores[0].storeId : '');
    setSupplyStoreId(targetStoreId);
    if (products.length > 0) {
      setSupplyLines([
        { productId: products[0].id, quantity: 1, unitPrice: products[0].wholesalePrice }
      ]);
    } else {
      setSupplyLines([]);
    }
    setSupplyPaidAmount(0);
    setSupplyNotes('');
    setIsSupplyModalOpen(true);
  };

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('yaqintop_dealer_dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('yaqintop_dealer_dark', 'false');
    }
  }, [isDarkMode]);

  // Load Initial Data (parallelized fetch for max speed)
  const isInitialMount = useRef(true);

  const loadAnalytics = async (period: string) => {
    try {
      const res = await fetch(`/api/v1/dealer/analytics?period=${period}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const aData = await res.json();
        setAnalytics(aData.analytics);
      }
    } catch {
      // ignore
    }
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();

      // Parallel fetch me, stores, products, supplies, analytics in a single Promise.all
      const [meRes, storesRes, prodsRes, ordersRes, analyticsRes] = await Promise.all([
        fetch('/api/v1/dealer/me', { headers }),
        fetch('/api/v1/dealer/stores', { headers }),
        fetch('/api/v1/dealer/products', { headers }),
        fetch('/api/v1/dealer/supplies', { headers }),
        fetch(`/api/v1/dealer/analytics?period=${selectedPeriod}`, { headers })
      ]);

      if (meRes.status === 401 || meRes.status === 403) {
        setCurrentUser(null);
        clearSessionCache();
        setIsLoading(false);
        return;
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        setDealer(meData);
      }

      if (storesRes.ok) {
        const sData = await storesRes.json();
        setStores(sData.stores || []);
      }

      if (prodsRes.ok) {
        const pData = await prodsRes.json();
        setProducts(pData.products || []);
      }

      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        setOrders(oData.orders || []);
      }

      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        setAnalytics(aData.analytics);
      }
    } catch {
      showToast('Ma’lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadInitialData();
    } else {
      loadAnalytics(selectedPeriod);
    }
  }, [selectedPeriod, currentUser]);

  useEffect(() => {
    if (currentUser) {
      setIsLoginModalOpen(false);
      loadInitialData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (isAttachStoreModalOpen) {
      loadAvailableStores('');
    }
  }, [isAttachStoreModalOpen]);

  useEffect(() => {
    if (isSupplyModalOpen) {
      if (stores.length > 0 && (!supplyStoreId || !stores.some(s => s.storeId === supplyStoreId))) {
        setSupplyStoreId(stores[0].storeId);
      }
      if (products.length > 0 && supplyLines.length === 0) {
        setSupplyLines([{ productId: products[0].id, quantity: 1, unitPrice: products[0].wholesalePrice }]);
      }
    }
  }, [isSupplyModalOpen, stores, products]);

  // Fetch Global goods map when mode toggled
  useEffect(() => {
    if (mapMode === 'global') {
      const fetchGlobal = async () => {
        try {
          const res = await fetch(`/api/v1/dealer/map/global-goods?category=${encodeURIComponent(globalCategoryFilter)}`, {
            headers: getAuthHeaders()
          });
          if (res.ok) {
            const data = await res.json();
            setGlobalGoods(data.distribution || []);
          } else if (res.status === 403) {
            showToast('Eksperimental xarita uchun ma’muriyatdan ruxsat berilmagan');
            setMapMode('crm');
          }
        } catch {
          // ignore
        }
      };
      fetchGlobal();
    }
  }, [mapMode, globalCategoryFilter]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !passwordInput.trim()) {
      setLoginError('Login va parolni kiriting');
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginInput.trim(), password: passwordInput.trim() })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        if (!['DEALER', 'DEALER_AGENT', 'SUPERADMIN', 'ADMIN'].includes(data.user.role)) {
          setLoginError('Bu hisob dillerlik tizimiga tegishli emas');
          return;
        }

        saveCachedSession(data.user, data.token, data.expiresAt);
        setCurrentUser(data.user);
        localStorage.setItem('yaqintop_token', data.token);
        localStorage.setItem('yaqintop_session_token', data.token);
        setIsLoginModalOpen(false);
        showToast('Tizimga muvaffaqiyatli kirildi');
        loadInitialData();
      } else {
        setLoginError(data.message || 'Login yoki parol noto‘g‘ri');
      }
    } catch (err: any) {
      setLoginError('Server bilan bog‘lanishda xatolik');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Direct Token Login
  const handleTokenLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanToken = tokenInput.trim();
    if (!cleanToken) {
      setLoginError('Iltimos, tokenni kiriting');
      return;
    }

    setIsTokenLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/v1/auth/token-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: cleanToken })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        if (!['DEALER', 'DEALER_AGENT', 'SUPERADMIN', 'ADMIN'].includes(data.user.role)) {
          setLoginError('Ushbu token dillerlik tizimiga tegishli emas');
          return;
        }

        saveCachedSession(data.user, data.token || cleanToken, data.expiresAt);
        setCurrentUser(data.user);
        localStorage.setItem('yaqintop_token', data.token || cleanToken);
        localStorage.setItem('yaqintop_session_token', data.token || cleanToken);
        setIsLoginModalOpen(false);
        showToast(`"${data.user.fullName}" diller hisobiga muvaffaqiyatli kirildi!`);
        loadInitialData();
      } else {
        setLoginError(data.message || 'Token yaroqsiz yoki muddati tugagan');
      }
    } catch {
      setLoginError('Server bilan bog‘lanishda xatolik yuz berdi');
    } finally {
      setIsTokenLoggingIn(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setTokenInput(text.trim());
          setLoginError(null);
        }
      }
    } catch {
      setLoginError('Xotiradan nusxa olishga ruxsat berilmadi. Tokenni qo‘lda (Ctrl+V) joylashtiring.');
    }
  };

  const handleLogout = () => {
    clearSessionCache();
    localStorage.removeItem('yaqintop_token');
    localStorage.removeItem('yaqintop_session_token');
    setCurrentUser(null);
    setDealer(null);
    setIsLoginModalOpen(false);
    showToast('Tizimdan chiqildi');
  };

  // Handle Supply Order Creation (Tovar topshirish / Nakladnoy)
  const handleCreateSupplyOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalStoreId = supplyStoreId || (stores.length > 0 ? stores[0].storeId : '');
    if (!finalStoreId) {
      showToast('Do‘kon tanlanishi shart');
      return;
    }
    if (supplyLines.length === 0) {
      showToast('Kamida 1 ta mahsulot tanlang');
      return;
    }

    try {
      const res = await fetch('/api/v1/dealer/supplies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          storeId: finalStoreId,
          items: supplyLines,
          paidAmount: Number(supplyPaidAmount || 0),
          paymentType: supplyPaymentType,
          notes: supplyNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Yuk xati ${data.order?.orderNumber || ''} yaratildi! Do‘konda tovar zudlik bilan In Stock bo‘ldi.`);
        setIsSupplyModalOpen(false);
        setSupplyLines([]);
        setSupplyPaidAmount(0);
        setSupplyNotes('');
        loadInitialData();
      } else {
        showToast(data.message || 'Yuk xatini rasmiylashtirishda xatolik');
      }
    } catch {
      showToast('Server bilan bog‘lanishda xatolik');
    }
  };

  // Handle Inkassatsiya (Qarz yig'ish)
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalStoreId = payStoreId || (stores.length > 0 ? stores[0].storeId : '');
    if (!finalStoreId || payAmount <= 0) {
      showToast('Do‘kon va to‘lov summasini kiriting');
      return;
    }

    try {
      const res = await fetch('/api/v1/dealer/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          storeId: finalStoreId,
          amount: Number(payAmount),
          paymentMethod: payMethod,
          comment: payComment
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`To‘lov qabul qilindi! Qoldiq qarz: ${data.currentDebtBalance.toLocaleString()} so‘m`);
        setIsPaymentModalOpen(false);
        setPayAmount(0);
        setPayComment('');
        loadInitialData();
      } else {
        showToast(data.message || 'To‘lovni kiritishda xatolik');
      }
    } catch {
      showToast('Server bilan bog‘lanishda xatolik');
    }
  };

  // Handle Return (Vozvrat)
  const handleRecordReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalStoreId = returnStoreId || (stores.length > 0 ? stores[0].storeId : '');
    const finalProdId = returnProductId || (products.length > 0 ? products[0].id : '');
    if (!finalStoreId || !finalProdId || returnQuantity <= 0) {
      showToast('Do‘kon, tovar va miqdorini tanlang');
      return;
    }

    try {
      const res = await fetch('/api/v1/dealer/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          storeId: finalStoreId,
          items: [{ productId: finalProdId, quantity: Number(returnQuantity) }],
          comment: returnComment
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Tovar muvaffaqiyatli qaytarildi! Summa: ${data.returnTotal.toLocaleString()} so‘m`);
        setIsReturnModalOpen(false);
        setReturnQuantity(1);
        setReturnComment('');
        loadInitialData();
      } else {
        showToast(data.message || 'Qaytarishda xatolik');
      }
    } catch {
      showToast('Server bilan bog‘lanishda xatolik');
    }
  };

  // Open Akt-Sverka
  const openAktSverka = async (store: ClientStore) => {
    setSelectedStoreForAction(store);
    try {
      const res = await fetch(`/api/v1/dealer/stores/${store.storeId}/akt-sverka`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAktSverkaData(data);
        setIsAktSverkaModalOpen(true);
      } else {
        showToast('Akt-sverkani yuklab bo‘lmadi');
      }
    } catch {
      showToast('Server bilan bog‘lanishda xatolik');
    }
  };

  // Attach Store
  const handleAttachStore = async (e?: React.FormEvent, directStoreId?: string) => {
    if (e && e.preventDefault) e.preventDefault();
    const queryToUse = (directStoreId || attachQuery).trim();
    if (!queryToUse) {
      showToast('Do‘kon nomi, STIR yoki ID kiritilishi kerak');
      return;
    }

    try {
      const res = await fetch('/api/v1/dealer/stores/attach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          query: queryToUse,
          creditLimit: Number(attachCreditLimit) || 5000000
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Do‘kon mijozlar bazasiga muvaffaqiyatli biriktirildi');
        setIsAttachStoreModalOpen(false);
        setAttachQuery('');
        await loadInitialData();
        await loadAvailableStores('');
      } else {
        showToast(data.message || 'Do‘kon topilmadi');
      }
    } catch {
      showToast('Server bilan bog‘lanishda xatolik');
    }
  };

  // Create Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || newProdPrice <= 0) {
      showToast('Mahsulot nomi va ulgurji narxi kiritilishi shart');
      return;
    }

    setIsCreatingProduct(true);
    try {
      const res = await fetch('/api/v1/dealer/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          name: newProdName.trim(),
          categoryId: 'general',
          categoryName: newProdCategory.trim() || 'Umumiy tovarlar',
          sku: newProdSku.trim() || undefined,
          unit: newProdUnit.trim() || 'dona',
          wholesalePrice: Number(newProdPrice),
          stockQuantity: Number(newProdStock || 0)
        })
      });

      const data = await res.json();
      if (res.ok && data.product) {
        showToast(`Yangi tovar "${data.product.name}" muvaffaqiyatli qo‘shildi!`);
        setIsProductModalOpen(false);
        setNewProdName('');
        setNewProdSku('');
        setNewProdPrice(10000);
        setNewProdStock(100);
        const prodsRes = await fetch('/api/v1/dealer/products', { headers: getAuthHeaders() });
        if (prodsRes.ok) {
          const pData = await prodsRes.json();
          setProducts(pData.products || []);
        }
      } else {
        showToast(data.message || 'Mahsulot qo‘shishda xatolik');
      }
    } catch {
      showToast('Server bilan bog‘lanishda xatolik');
    } finally {
      setIsCreatingProduct(false);
    }
  };

  // Create New Store Pin
  const handleCreateNewStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !newStoreAddress.trim()) {
      showToast('Do‘kon nomi va manzilini kiriting');
      return;
    }

    try {
      const res = await fetch('/api/v1/dealer/stores/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          name: newStoreName.trim(),
          phone: newStorePhone.trim(),
          address: newStoreAddress.trim(),
          lat: newStoreLat,
          lng: newStoreLng,
          inn: newStoreInn.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Yangi savdo nuqtasi yaratildi va bazangizga qo‘shildi');
        setIsNewStoreModalOpen(false);
        setNewStoreName('');
        setNewStoreAddress('');
        loadInitialData();
      } else {
        showToast(data.message || 'Xatolik yuz berdi');
      }
    } catch {
      showToast('Server bilan bog‘lanishda xatolik');
    }
  };

  // Calculate Delivery Route
  const handleCalculateRoute = async () => {
    if (selectedStoresForRoute.length === 0) {
      showToast('Kamida bitta do‘konni marshrutga belgilang');
      return;
    }

    setIsCalculatingRoute(true);
    try {
      const res = await fetch('/api/v1/dealer/map/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          storeIds: selectedStoresForRoute
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCalculatedRoute(data.route);
        showToast(`Optimal marshrut tuzildi: ${data.route.totalDistanceKm} km, ~${data.route.totalDurationMin} daqiqa`);
      } else {
        showToast('Marshrut hisoblashda xatolik');
      }
    } catch {
      showToast('Server bilan bog‘lanishda xatolik');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Add line in supply modal
  const addSupplyLine = () => {
    if (products.length === 0) return;
    const firstProd = products[0];
    setSupplyLines(prev => [
      ...prev,
      { productId: firstProd.id, quantity: 1, unitPrice: firstProd.wholesalePrice }
    ]);
  };

  const removeSupplyLine = (index: number) => {
    setSupplyLines(prev => prev.filter((_, i) => i !== index));
  };

  const updateSupplyLine = (index: number, field: string, val: any) => {
    setSupplyLines(prev => {
      const next = [...prev];
      if (field === 'productId') {
        const prod = products.find(p => p.id === val);
        next[index] = {
          ...next[index],
          productId: val,
          unitPrice: prod?.wholesalePrice || next[index].unitPrice
        };
      } else if (field === 'quantity') {
        next[index] = { ...next[index], quantity: Number(val) };
      } else if (field === 'unitPrice') {
        next[index] = { ...next[index], unitPrice: Number(val) };
      }
      return next;
    });
  };

  const supplyTotalAmount = useMemo(() => {
    return supplyLines.reduce((acc, line) => acc + (line.quantity * line.unitPrice), 0);
  }, [supplyLines]);

  const supplyDebtGenerated = Math.max(0, supplyTotalAmount - supplyPaidAmount);

  // Memoized filtered stores to avoid recalculating on unrelated state changes
  const filteredStores = useMemo(() => {
    const q = storeSearch.toLowerCase().trim();
    return stores.filter(s => {
      const matchesSearch =
        !q ||
        s.storeName.toLowerCase().includes(q) ||
        (s.storeInn && s.storeInn.includes(q)) ||
        s.storeAddress.toLowerCase().includes(q);

      const matchesStatus =
        storeFilterStatus === 'ALL' ||
        s.debtStatus === storeFilterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [stores, storeSearch, storeFilterStatus]);

  const isDealerAuthorized = Boolean(
    currentUser && ['DEALER', 'DEALER_AGENT', 'SUPERADMIN', 'ADMIN'].includes(currentUser.role)
  );

  // If user is not logged in as a dealer, lock the page and show ONLY the Login Screen (no background dashboard)
  if (!isDealerAuthorized) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-[#F4FAF6] via-[#EDF5F0] to-[#E2EFE7] dark:from-[#080E0A] dark:via-[#0D1711] dark:to-[#122119] text-[#172C28] dark:text-[#E8F2EC] selection:bg-[#116B50] selection:text-white p-4 sm:p-6 transition-colors duration-200">
        {/* Top Navbar */}
        <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#116B50] text-white flex items-center justify-center font-black shadow-lg shadow-[#116B50]/25">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-[#172C28] dark:text-white">
                  {t('app_title')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#116B50]/10 text-[#116B50] dark:text-[#4ADE80] border border-[#116B50]/20">
                  {t('app_tag')}
                </span>
              </div>
              <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] font-medium hidden sm:block">
                {t('header_subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-white/80 dark:bg-[#14201A]/80 border border-[#DCE5DF] dark:border-[#22332C] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] text-[#566A63] dark:text-[#8B9E95] transition cursor-pointer shadow-xs"
              title={t('theme_toggle')}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Center Login Card */}
        <main className="flex-1 flex items-center justify-center my-6">
          <div className="w-full max-w-md bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header / Security Badge */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center mb-3 shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#172C28] dark:text-white">
                {t('login_modal_title')}
              </h1>
             
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {authMode === 'CREDENTIALS' ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] block mb-1.5">
                    {t('login_username_label')}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="diller1 yoki +998901234567"
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:bg-white dark:focus:bg-[#16241E] focus:outline-none focus:ring-2 focus:ring-[#116B50]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] block mb-1.5">
                    {t('login_password_label')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:bg-white dark:focus:bg-[#16241E] focus:outline-none focus:ring-2 focus:ring-[#116B50]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoggingIn}
                  className="w-full py-3 bg-[#116B50] hover:bg-[#0E5842] active:scale-98 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  <Key className="w-4 h-4" />
                  <span>{isLoggingIn ? t('verifying') : t('sign_in')}</span>
                </Button>

               
                
              </form>
            ) : (
              <form onSubmit={handleTokenLogin} className="flex flex-col gap-4">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                  <Key className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>{t('login_token_info')}</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]">
                      {t('login_token_label')}
                    </label>
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="text-[11px] text-[#116B50] dark:text-[#4ADE80] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t('login_paste_clipboard')}</span>
                    </button>
                  </div>
                  <textarea
                    required
                    rows={3}
                    placeholder="yaqintop_sess_..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#116B50]"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={isTokenLoggingIn}
                  className="w-full py-3 bg-[#116B50] hover:bg-[#0E5842] active:scale-98 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>{isTokenLoggingIn ? t('verifying') : t('login_token_submit')}</span>
                </Button>

                <div className="text-center pt-2 border-t border-[#DCE5DF]/60 dark:border-[#22332C]">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('CREDENTIALS'); setLoginError(null); }}
                    className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold hover:underline cursor-pointer"
                  >
                    {t('login_back_credentials')}
                  </button>
                </div>
              </form>
            )}

            {/* Back to Home / Customer link */}
            <div className="mt-6 pt-4 border-t border-[#DCE5DF]/60 dark:border-[#22332C] flex items-center justify-between text-xs text-[#566A63] dark:text-[#8B9E95]">
              <a
                href="/"
                className="hover:text-[#116B50] dark:hover:text-[#4ADE80] font-medium transition flex items-center gap-1"
              >
                <span>← Asosiy lending</span>
              </a>
              <a
                href="/customer"
                className="hover:text-[#116B50] dark:hover:text-[#4ADE80] font-medium transition"
              >
                <span>Xaridor ilovasi →</span>
              </a>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-3 text-xs text-[#566A63] dark:text-[#8B9E95]">
          © 2026 YaqinTop. Barcha huquqlar himoyalangan.
        </footer>

        {/* Global Token Quick Login Modal (Ctrl + Alt + T) */}
        <TokenQuickLoginModal
          onLoginSuccess={(user) => {
            if (['DEALER', 'DEALER_AGENT', 'SUPERADMIN', 'ADMIN'].includes(user.role)) {
              saveCachedSession(user, user.token || 'quick', Date.now() + 86400000);
              setCurrentUser(user);
              showToast('Tizimga kirildi');
            } else {
              setLoginError('Bu hisob dillerlik tizimiga tegishli emas');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF9] dark:bg-[#0B130E] text-[#172C28] dark:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#116B50] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#14201A] border-b border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#116B50] text-white flex items-center justify-center font-black text-lg shadow-md shadow-[#116B50]/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-[#172C28] dark:text-white">
                  {t('app_title')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#116B50]/10 text-[#116B50] dark:text-[#4ADE80] border border-[#116B50]/20">
                  {t('app_tag')}
                </span>
              </div>
              <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] font-medium hidden sm:block">
                {dealer ? `${dealer.companyName} (${dealer.contactName})` : t('header_subtitle')}
              </p>
            </div>
          </div>

          {/* Quick Metrics in Header */}
          {dealer && (
            <>
              <div className="hidden lg:flex items-center gap-6 text-xs">
                <div>
                  <span className="text-[#566A63] dark:text-[#8B9E95] block text-[10px] uppercase font-bold">{t('clients_label')}</span>
                  <span className="font-black text-[#172C28] dark:text-white">{dealer.storeCount} {t('stores_count')}</span>
                </div>
                <div>
                  <span className="text-[#566A63] dark:text-[#8B9E95] block text-[10px] uppercase font-bold">{t('total_debt_label')}</span>
                  <span className={`font-black ${dealer.totalDebt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {dealer.totalDebt.toLocaleString()} {t('currency')}
                  </span>
                </div>
              </div>

              {/* Mobile compact balance */}
              <div className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] text-[11px] font-bold border border-[#DCE5DF] dark:border-[#22332C]">
                <span className="text-[#566A63] dark:text-[#8B9E95]">{t('debt_short')}</span>
                <span className={dealer.totalDebt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                  {dealer.totalDebt > 1000000 ? `${(dealer.totalDebt / 1000000).toFixed(1)}M` : dealer.totalDebt.toLocaleString()}
                </span>
              </div>
            </>
          )}

          {/* Actions & Profile */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-[#566A63] dark:text-[#8B9E95] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822] transition"
              title={t('theme_toggle')}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {dealer ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <span className="text-xs font-bold block text-[#172C28] dark:text-white">
                    {dealer.contactName}
                  </span>
                  <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] block">
                    {dealer.region}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  title={t('sign_out')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsLoginModalOpen(true)}
                className="text-xs font-bold bg-[#116B50] hover:bg-[#0E5842] text-white"
              >
                {t('sign_in')}
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden md:flex border-t border-[#DCE5DF]/60 dark:border-[#22332C] px-4 max-w-7xl mx-auto gap-1">
          {[
            { id: 'dashboard', label: t('tab_dashboard'), icon: LayoutDashboard },
            { id: 'stores', label: `${t('tab_stores')} (${stores.length})`, icon: Store },
            { id: 'supplies', label: t('tab_invoices'), icon: FileText },
            { id: 'cash', label: t('tab_cash'), icon: DollarSign },
            { id: 'products', label: `${t('tab_products')} (${products.length})`, icon: Package },
            { id: 'analytics', label: t('tab_reports'), icon: TrendingUp },
            { id: 'map', label: t('tab_map'), icon: MapPin }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
                  active
                    ? 'border-[#116B50] text-[#116B50] dark:text-[#4ADE80] bg-[#116B50]/5 dark:bg-[#4ADE80]/5'
                    : 'border-transparent text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Horizontal Scrollable Tabs Bar */}
        <div className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#14201A] border-t border-[#DCE5DF]/60 dark:border-[#22332C] overflow-x-auto scrollbar-none">
          {[
            { id: 'dashboard', label: t('tab_dashboard'), icon: LayoutDashboard },
            { id: 'stores', label: `${t('tab_stores')} (${stores.length})`, icon: Store },
            { id: 'supplies', label: t('tab_supplies_short'), icon: FileText },
            { id: 'cash', label: t('tab_cash_short'), icon: DollarSign },
            { id: 'products', label: `${t('tab_products')} (${products.length})`, icon: Package },
            { id: 'analytics', label: t('tab_reports'), icon: TrendingUp },
            { id: 'map', label: t('map_tab_map'), icon: MapPin }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition shrink-0 active:scale-95 ${
                  active
                    ? 'bg-[#116B50] text-white shadow-sm'
                    : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 pb-20 md:pb-6">
        {/* ================= TAB 1: DASHBOARD ================= */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            {/* Quick Action Floating Bar (2-3 Click Operations) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#116B50] to-[#0E5842] text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black">{t('dash_quick_actions')}</h2>
                <p className="text-xs text-white/80 mt-0.5">
                  {t('dash_quick_actions_sub')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => openNewSupplyModal()}
                  className="px-3 py-2 rounded-xl bg-white text-[#116B50] text-xs font-black flex items-center gap-1.5 shadow hover:bg-emerald-50 transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ {t('action_new_supply')}</span>
                </button>

                <button
                  onClick={() => {
                    setPayStoreId(stores[0]?.storeId || '');
                    setPayAmount(0);
                    setIsPaymentModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#172C28] text-xs font-black flex items-center gap-1.5 shadow transition active:scale-95"
                >
                  <Banknote className="w-4 h-4" />
                  <span>💰 {t('action_new_payment')}</span>
                </button>

                <button
                  onClick={() => {
                    setReturnStoreId(stores[0]?.storeId || '');
                    setReturnProductId(products[0]?.id || '');
                    setIsReturnModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>↩️ {t('btn_return')}</span>
                </button>

                <button
                  onClick={() => setIsAttachStoreModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  <Store className="w-4 h-4" />
                  <span>+ {t('action_link_store')}</span>
                </button>
              </div>
            </div>

            {/* KPI Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                <div className="flex items-center justify-between text-[#566A63] dark:text-[#8B9E95] text-xs font-bold">
                  <span>{t('dash_turnover')}</span>
                  <TrendingUp className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                </div>
                <div className="text-xl md:text-2xl font-black text-[#172C28] dark:text-white mt-2">
                  {(analytics?.totalTurnover || 0).toLocaleString()} {t('currency')}
                </div>
                <div className="text-[11px] text-[#116B50] dark:text-[#4ADE80] font-semibold mt-1">
                  {t('dash_turnover_desc')}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                <div className="flex items-center justify-between text-[#566A63] dark:text-[#8B9E95] text-xs font-bold">
                  <span>{t('dash_cash')}</span>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                  {(analytics?.totalCollected || 0).toLocaleString()} {t('currency')}
                </div>
                <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                  {t('dash_cash_desc')}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                <div className="flex items-center justify-between text-[#566A63] dark:text-[#8B9E95] text-xs font-bold">
                  <span>{t('dash_debt')}</span>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-xl md:text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
                  {(analytics?.totalDebtOutstanding || 0).toLocaleString()} {t('currency')}
                </div>
                <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                  {t('dash_debt_desc')}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                <div className="flex items-center justify-between text-[#566A63] dark:text-[#8B9E95] text-xs font-bold">
                  <span>{t('dash_stores')}</span>
                  <Store className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-xl md:text-2xl font-black text-[#172C28] dark:text-white mt-2">
                  {stores.length} {t('items_count')}
                </div>
                <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                  {t('dash_stores_desc')}
                </div>
              </div>
            </div>

            {/* Recent Orders & Debt Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Recent Orders */}
              <div className="lg:col-span-2 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-[#172C28] dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                    <span>{t('dash_recent_invoices')}</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('supplies')}
                    className="text-xs font-bold text-[#116B50] dark:text-[#4ADE80] hover:underline flex items-center gap-1"
                  >
                    <span>{t('dash_view_all')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-[#DCE5DF]/60 dark:divide-[#22332C]">
                  {orders.slice(0, 5).map(o => (
                    <div key={o.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-[#172C28] dark:text-white flex items-center gap-2">
                          <span className="font-mono text-[#116B50] dark:text-[#4ADE80]">{o.orderNumber}</span>
                          <span>•</span>
                          <span>{o.storeName}</span>
                        </div>
                        <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                          {new Date(o.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ')} • {o.itemCount} {t('items_count')} • {o.paymentType}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-[#172C28] dark:text-white">
                          {o.totalAmount.toLocaleString()} {t('currency')}
                        </div>
                        {o.debtAmount > 0 ? (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            {t('debt_short')} {o.debtAmount.toLocaleString()} {t('currency')}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {t('status_paid')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="py-8 text-center text-xs text-[#566A63] dark:text-[#8B9E95]">
                      {t('dash_no_orders')}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col: Debt Status Distribution */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#172C28] dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>{t('dash_debt_status')}</span>
                  </h3>

                  <div className="flex flex-col gap-3">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{t('filter_debt_green')}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                        {stores.filter(s => s.debtStatus === 'GREEN').length} {t('stores_count')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-300">{t('filter_debt_yellow')}</span>
                      </div>
                      <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                        {stores.filter(s => s.debtStatus === 'YELLOW').length} {t('stores_count')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                        <span className="text-xs font-bold text-rose-800 dark:text-rose-300">{t('filter_debt_red')}</span>
                      </div>
                      <span className="text-xs font-black text-rose-700 dark:text-rose-400">
                        {stores.filter(s => s.debtStatus === 'RED').length} {t('stores_count')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#DCE5DF]/60 dark:border-[#22332C] mt-4">
                  <button
                    onClick={() => setActiveTab('map')}
                    className="w-full py-2.5 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] text-[#172C28] dark:text-white hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <MapPin className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                    <span>{t('dash_view_map')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: DO'KONLARIM ================= */}
        {activeTab === 'stores' && (
          <div className="flex flex-col gap-5">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95]" />
                <input
                  type="text"
                  placeholder={t('search_stores_ph')}
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                {(['ALL', 'GREEN', 'YELLOW', 'RED'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setStoreFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      storeFilterStatus === st
                        ? st === 'GREEN' ? 'bg-emerald-600 text-white' : st === 'YELLOW' ? 'bg-amber-500 text-white' : st === 'RED' ? 'bg-rose-600 text-white' : 'bg-[#116B50] text-white'
                        : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                    }`}
                  >
                    {st === 'ALL' ? t('filter_all_stores') : st === 'GREEN' ? `${t('filter_debt_green')} (🟢)` : st === 'YELLOW' ? `${t('filter_debt_yellow')} (🟡)` : `${t('filter_debt_red')} (🔴)`}
                  </button>
                ))}
              </div>

              {/* Add Store Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewStoreModalOpen(true)}
                  className="text-xs font-bold"
                >
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  {t('btn_create_new_point')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAttachStoreModalOpen(true)}
                  className="text-xs font-bold bg-[#116B50] hover:bg-[#0E5842] text-white"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {t('btn_link_existing')}
                </Button>
              </div>
            </div>

            {/* Stores Grid / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStores.map(store => (
                <div
                  key={store.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-bold text-sm text-[#172C28] dark:text-white flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
                        <span>{store.storeName}</span>
                      </div>
                      {store.debtStatus === 'GREEN' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                          {t('filter_debt_green')}
                        </span>
                      )}
                      {store.debtStatus === 'YELLOW' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                          {t('filter_debt_yellow')}
                        </span>
                      )}
                      {store.debtStatus === 'RED' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shrink-0 animate-pulse">
                          {t('filter_debt_red')}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#566A63] dark:text-[#8B9E95] flex flex-col gap-1.5 mb-3">
                      <div className="truncate">📍 {store.storeAddress || t('no_address')}</div>
                      <div className="flex items-center justify-between">
                        <span>📞 {store.storePhone || t('no_phone')}</span>
                        {store.storePhone && (
                          <a
                            href={`tel:${store.storePhone.replace(/\s+/g, '')}`}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] hover:bg-emerald-100 transition active:scale-95 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{t('map_sidebar_call')}</span>
                          </a>
                        )}
                      </div>
                      {store.storeInn && <div>{t('map_sidebar_tin')} <span className="font-mono">{store.storeInn}</span></div>}
                    </div>

                    <div className="p-3 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#566A63] dark:text-[#8B9E95]">{t('th_debt_balance')}:</span>
                        <span className={`font-black text-sm ${store.currentDebtBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {store.currentDebtBalance.toLocaleString()} {t('currency')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                        <span>{t('th_credit_limit')}:</span>
                        <span>{store.creditLimit.toLocaleString()} {t('currency')}</span>
                      </div>
                      {store.lastSupplyDate && (
                        <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] mt-1 pt-1 border-t border-[#DCE5DF]/60 dark:border-[#22332C]">
                          {t('th_last_supply')}: {new Date(store.lastSupplyDate).toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ')} ({store.daysSinceSupply} {t('days_ago')})
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3 Core Quick Action Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#DCE5DF]/60 dark:border-[#22332C]">
                    <button
                      onClick={() => openNewSupplyModal(store.storeId)}
                      className="py-2 px-2 rounded-xl bg-[#116B50] hover:bg-[#0E5842] text-white text-[11px] font-bold text-center transition active:scale-95 shadow-xs"
                    >
                      + {t('btn_supply')}
                    </button>

                    <button
                      onClick={() => {
                        setPayStoreId(store.storeId);
                        setPayAmount(Math.min(store.currentDebtBalance, 1000000));
                        setIsPaymentModalOpen(true);
                      }}
                      className="py-2 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold text-center transition active:scale-95 shadow-xs"
                    >
                      {t('btn_collection')}
                    </button>

                    <button
                      onClick={() => openAktSverka(store)}
                      className="py-2 px-2 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] text-[#172C28] dark:text-white text-[11px] font-semibold text-center transition active:scale-95 border border-[#DCE5DF] dark:border-[#22332C]"
                    >
                      {t('btn_akt_sverka')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: NAKLADNOYLAR (YUK XATLARI) ================= */}
        {activeTab === 'supplies' && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
              <div>
                <h2 className="text-base font-black text-[#172C28] dark:text-white">{t('invoices_title')}</h2>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
                  {t('invoices_subtitle')}
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => openNewSupplyModal()}
                className="text-xs font-bold bg-[#116B50] hover:bg-[#0E5842] text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('btn_new_invoice')}
              </Button>
            </div>

            {/* Mobile Orders Card List (< md) */}
            <div className="md:hidden flex flex-col gap-3">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-[#116B50] dark:text-[#4ADE80] bg-[#116B50]/10 px-2 py-0.5 rounded-lg">
                        {o.orderNumber}
                      </span>
                      <h4 className="font-bold text-sm text-[#172C28] dark:text-white mt-1">
                        {o.storeName}
                      </h4>
                      <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                        📍 {o.storeAddress}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                      {t('status_delivered')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] text-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#566A63] dark:text-[#8B9E95] block">{t('modal_supply_subtotal')}</span>
                      <span className="font-black text-xs text-[#172C28] dark:text-white">
                        {o.totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#566A63] dark:text-[#8B9E95] block">{t('th_inv_paid')}</span>
                      <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {o.paidAmount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#566A63] dark:text-[#8B9E95] block">{t('debt_short')}</span>
                      <span className="font-bold text-xs text-amber-600 dark:text-amber-400">
                        {o.debtAmount > 0 ? o.debtAmount.toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#566A63] dark:text-[#8B9E95] pt-2 border-t border-[#DCE5DF]/60 dark:border-[#22332C]">
                    <div className="flex items-center gap-1 font-semibold text-[#172C28] dark:text-white">
                      <CreditCard className="w-3.5 h-3.5 text-[#116B50]" />
                      <span>{o.paymentType}</span>
                    </div>
                    <div>
                      {new Date(o.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ')} {new Date(o.createdAt).toLocaleTimeString(lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="p-8 text-center text-xs text-[#566A63] dark:text-[#8B9E95] bg-white dark:bg-[#14201A] rounded-2xl border border-[#DCE5DF] dark:border-[#22332C]">
                  {t('invoices_empty')}
                </div>
              )}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] uppercase font-bold border-b border-[#DCE5DF] dark:border-[#22332C]">
                    <tr>
                      <th className="py-3 px-4">{t('th_inv_number')}</th>
                      <th className="py-3 px-4">{t('th_inv_store')}</th>
                      <th className="py-3 px-4">{t('th_tx_date')}</th>
                      <th className="py-3 px-4">{t('th_inv_total')}</th>
                      <th className="py-3 px-4">{t('th_inv_paid')}</th>
                      <th className="py-3 px-4">{t('th_inv_debt')}</th>
                      <th className="py-3 px-4">{t('th_inv_payment_type')}</th>
                      <th className="py-3 px-4 text-center">{t('th_status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF]/60 dark:divide-[#22332C]">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-[#F9FAF9] dark:hover:bg-[#1A2822]/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-[#116B50] dark:text-[#4ADE80]">
                          {o.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#172C28] dark:text-white">{o.storeName}</div>
                          <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">{o.storeAddress}</div>
                        </td>
                        <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95]">
                          {new Date(o.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ')} {new Date(o.createdAt).toLocaleTimeString(lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 font-black text-[#172C28] dark:text-white">
                          {o.totalAmount.toLocaleString()} {t('currency')}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {o.paidAmount.toLocaleString()} {t('currency')}
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-600 dark:text-amber-400">
                          {o.debtAmount > 0 ? `${o.debtAmount.toLocaleString()} ${t('currency')}` : '—'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#172C28] dark:text-white">
                          {o.paymentType}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            {t('status_delivered')}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#566A63] dark:text-[#8B9E95]">
                          {t('invoices_empty')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: KASSA & INKASSATSIYA ================= */}
        {activeTab === 'cash' && (
          <div className="flex flex-col gap-5">
            {/* Mobile Segmented Switcher (< md) */}
            <div className="md:hidden flex p-1 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-xs">
              <button
                type="button"
                onClick={() => setCashMobileTab('payment')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 ${
                  cashMobileTab === 'payment'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-[#566A63] dark:text-[#8B9E95]'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>{t('action_new_payment')}</span>
              </button>
              <button
                type="button"
                onClick={() => setCashMobileTab('return')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 ${
                  cashMobileTab === 'return'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-[#566A63] dark:text-[#8B9E95]'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('modal_return_title')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Inkassatsiya Form */}
              <div className={`p-5 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm ${cashMobileTab === 'payment' ? 'block' : 'hidden md:block'}`}>
                <h3 className="text-sm font-black text-[#172C28] dark:text-white mb-2 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>{t('modal_pay_title')}</span>
                </h3>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mb-4">
                  {t('cash_pay_desc')}
                </p>

                <form onSubmit={handleRecordPayment} className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                      {t('modal_supply_select_store')}
                    </label>
                    <select
                      value={payStoreId}
                      onChange={(e) => setPayStoreId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
                    >
                      {stores.map(s => (
                        <option key={s.storeId} value={s.storeId}>
                          {s.storeName} ({t('debt_short')} {s.currentDebtBalance.toLocaleString()} {t('currency')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                      {t('modal_pay_amount')}
                    </label>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="1000"
                      value={payAmount || ''}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50] font-bold"
                    />

                    {/* Quick amount shortcut pills */}
                    <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
                      {[100000, 500000, 1000000, 2000000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setPayAmount(amt)}
                          className="px-2.5 py-1 rounded-lg bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] text-[11px] font-bold shrink-0 hover:bg-[#c7e5d5] transition active:scale-95"
                        >
                          +{(amt / 1000).toLocaleString()} {lang === 'en' ? 'k' : 'ming'}
                        </button>
                      ))}
                      {(() => {
                        const cur = stores.find(s => s.storeId === payStoreId) || stores[0];
                        return cur && cur.currentDebtBalance > 0 ? (
                          <button
                            type="button"
                            onClick={() => setPayAmount(cur.currentDebtBalance)}
                            className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[11px] font-bold shrink-0 hover:bg-amber-200 transition active:scale-95"
                          >
                            {t('pay_shortcut_full')} ({cur.currentDebtBalance.toLocaleString()} {t('currency')})
                          </button>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                      {t('th_inv_payment_type')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['CASH', 'TRANSFER', 'CARD'] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPayMethod(m)}
                          className={`py-2 rounded-xl text-xs font-bold border transition ${
                            payMethod === m
                              ? 'bg-[#116B50] text-white border-[#116B50]'
                              : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border-[#DCE5DF] dark:border-[#22332C]'
                          }`}
                        >
                          {m === 'CASH' ? t('pay_cash') : m === 'TRANSFER' ? t('pay_bank') : t('pay_card')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                      {t('th_tx_comment')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('modal_pay_comment')}
                      value={payComment}
                      onChange={(e) => setPayComment(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-2.5 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    {t('modal_pay_submit')}
                  </Button>
                </form>
              </div>

              {/* Card 2: Vozvrat Form */}
              <div className={`p-5 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm ${cashMobileTab === 'return' ? 'block' : 'hidden md:block'}`}>
                <h3 className="text-sm font-black text-[#172C28] dark:text-white mb-2 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-purple-500" />
                  <span>{t('modal_return_title')}</span>
                </h3>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mb-4">
                  {t('modal_return_desc')}
                </p>

                <form onSubmit={handleRecordReturn} className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                      {t('modal_supply_select_store')}
                    </label>
                    <select
                      value={returnStoreId}
                      onChange={(e) => setReturnStoreId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
                    >
                      {stores.map(s => (
                        <option key={s.storeId} value={s.storeId}>
                          {s.storeName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                      {t('modal_supply_product')} *
                    </label>
                    <select
                      value={returnProductId}
                      onChange={(e) => setReturnProductId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.wholesalePrice.toLocaleString()} {t('currency')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                      {t('modal_return_qty')}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={returnQuantity}
                      onChange={(e) => setReturnQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                      {t('modal_return_reason')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('modal_return_reason')}
                      value={returnComment}
                      onChange={(e) => setReturnComment(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-2.5 mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                  >
                    {t('modal_return_submit')}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: TOVARLAR KATALOGI ================= */}
        {activeTab === 'products' && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
              <div>
                <h2 className="text-base font-black text-[#172C28] dark:text-white">{t('products_title')}</h2>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
                  {t('products_subtitle')}
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsProductModalOpen(true)}
                className="text-xs font-bold bg-[#116B50] hover:bg-[#0E5842] text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('btn_add_product')}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-bold text-sm text-[#172C28] dark:text-white">
                        {p.name}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        {p.unit}
                      </span>
                    </div>

                    <div className="text-xs text-[#566A63] dark:text-[#8B9E95] mb-3">
                      <div>{t('th_prod_category')}: {p.categoryName}</div>
                      {p.sku && <div>{t('th_prod_sku')}: <span className="font-mono">{p.sku}</span></div>}
                    </div>

                    <div className="p-3 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#566A63] dark:text-[#8B9E95]">{t('th_prod_price')}:</span>
                        <span className="font-black text-sm text-[#116B50] dark:text-[#4ADE80]">
                          {p.wholesalePrice.toLocaleString()} {t('currency')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-[#566A63] dark:text-[#8B9E95]">{t('th_prod_stock')}:</span>
                        <span className="font-bold text-[#172C28] dark:text-white">
                          {p.stockQuantity} {p.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 6: HISOBOTLAR VA ANALITIKA ================= */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-6">
            {/* Period Selector & Export */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
              <div className="flex items-center gap-1.5 w-full md:w-auto">
                {(['today', 'week', 'month', 'year'] as const).map(per => (
                  <button
                    key={per}
                    onClick={() => setSelectedPeriod(per)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      selectedPeriod === per
                        ? 'bg-[#116B50] text-white'
                        : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                    }`}
                  >
                    {per === 'today' ? t('period_today') : per === 'week' ? t('period_week') : per === 'month' ? t('period_month') : t('period_year')}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  const csv = [
                    `${t('th_inv_store')},${t('rep_turnover_stat')}`,
                    ...(analytics?.topStoresByVolume || []).map((s: any) => `"${s.storeName}",${s.volume}`)
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `diller_hisobot_${selectedPeriod}.csv`;
                  a.click();
                  showToast('Excel/CSV hisoboti yuklab olindi');
                }}
                className="px-3 py-2 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] text-xs font-bold flex items-center gap-1.5 transition text-[#116B50] dark:text-[#4ADE80]"
              >
                <Download className="w-4 h-4" />
                <span>{t('btn_download_excel')}</span>
              </button>
            </div>

            {/* Ranking Grids */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* TOP Stores */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                <h3 className="text-sm font-black text-[#172C28] dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#116B50]" />
                  <span>{t('rep_top_stores')}</span>
                </h3>
                <div className="flex flex-col gap-2.5">
                  {(analytics?.topStoresByVolume || []).map((s: any, idx: number) => (
                    <div key={s.storeId} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#F9FAF9] dark:bg-[#1A2822]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#116B50] text-white flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-[#172C28] dark:text-white">{s.storeName}</span>
                      </div>
                      <span className="font-black text-[#116B50] dark:text-[#4ADE80]">
                        {s.volume.toLocaleString()} {t('currency')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOP Debt Stores */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                <h3 className="text-sm font-black text-[#172C28] dark:text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>{t('dash_top_debt')}</span>
                </h3>
                <div className="flex flex-col gap-2.5">
                  {(analytics?.topDebtStores || []).map((s: any, idx: number) => (
                    <div key={s.storeId} className="flex items-center justify-between text-xs p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-[#172C28] dark:text-white">{s.storeName}</span>
                      </div>
                      <span className="font-black text-amber-600 dark:text-amber-400">
                        {s.debt.toLocaleString()} {t('currency')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOP Products */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                <h3 className="text-sm font-black text-[#172C28] dark:text-white mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span>{t('rep_top_products')}</span>
                </h3>
                <div className="flex flex-col gap-2.5">
                  {(analytics?.topProducts || []).map((p: any, idx: number) => (
                    <div key={p.productId} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#F9FAF9] dark:bg-[#1A2822]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-[#172C28] dark:text-white truncate max-w-[140px]">{p.name}</span>
                      </div>
                      <span className="font-black text-[#172C28] dark:text-white">
                        {p.quantity} {t('items_count')} ({p.subtotal.toLocaleString()} {t('currency')})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 7: GIS VA XARITA MODULI (REAL LEAFLET + CRM + EKSPERIMENTAL) ================= */}
        {activeTab === 'map' && (
          <DealerMapHub
            stores={stores}
            isDarkMode={isDarkMode}
            onOpenSupply={(store) => {
              openNewSupplyModal(store.storeId);
            }}
            onOpenPayment={(store) => {
              setPayStoreId(store.storeId);
              setPayAmount(Math.min(store.currentDebtBalance, 1000000) || 500000);
              setIsPaymentModalOpen(true);
            }}
            onOpenReturn={(store) => {
              setReturnStoreId(store.storeId);
              if (products.length > 0) setReturnProductId(products[0].id);
              setIsReturnModalOpen(true);
            }}
            onOpenAktSverka={(store) => {
              openAktSverka(store);
            }}
            onAddStoreAtCoords={(lat, lng) => {
              setNewStoreLat(lat);
              setNewStoreLng(lng);
              setIsNewStoreModalOpen(true);
            }}
            selectedStoresForRoute={selectedStoresForRoute}
            setSelectedStoresForRoute={setSelectedStoresForRoute}
            calculatedRoute={calculatedRoute}
            isCalculatingRoute={isCalculatingRoute}
            onCalculateRoute={handleCalculateRoute}
            onClearRoute={() => setCalculatedRoute(null)}
            mapMode={mapMode}
            setMapMode={setMapMode}
            allowExperimentalMap={dealer?.allowExperimentalMap ?? false}
            globalGoods={globalGoods}
            globalCategoryFilter={globalCategoryFilter}
            setGlobalCategoryFilter={setGlobalCategoryFilter}
          />
        )}
      </main>

      {/* Mobile Floating Action Button (FAB) for Instant 1-Tap Actions */}
      <div className="md:hidden fixed bottom-18 right-4 z-40">
        <button
          onClick={() => setIsMobileQuickActionsOpen(true)}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#116B50] to-[#10B981] text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition border-2 border-white dark:border-[#14201A]"
          title="Tezkor diller amallari"
          aria-label="Tezkor amallar"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md border-t border-[#DCE5DF] dark:border-[#22332C] px-1 py-1 flex items-center justify-around shadow-2xl pb-[max(0.35rem,env(safe-area-inset-bottom))]">
        {[
          { id: 'dashboard', label: t('tab_dashboard'), icon: LayoutDashboard },
          { id: 'stores', label: t('map_tab_stores'), icon: Store },
          { id: 'supplies', label: t('tab_supplies_short'), icon: FileText },
          { id: 'cash', label: t('tab_cash_short'), icon: DollarSign },
          { id: 'map', label: t('map_tab_map'), icon: MapPin }
        ].map(item => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded-xl transition active:scale-95 relative ${
                active
                  ? 'text-[#116B50] dark:text-[#4ADE80] font-black'
                  : 'text-[#566A63] dark:text-[#8B9E95] font-medium hover:text-[#172C28]'
              }`}
            >
              <div className={`p-1 rounded-lg ${active ? 'bg-[#116B50]/10 dark:bg-[#4ADE80]/10' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Quick Actions Bottom Sheet Modal */}
      <Modal
        isOpen={isMobileQuickActionsOpen}
        onClose={() => setIsMobileQuickActionsOpen(false)}
        title={`⚡ ${t('dash_quick_actions')}`}
      >
        <div className="flex flex-col gap-2.5 py-2">
          <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mb-1">
            {t('mobile_quick_actions_sub')}
          </p>

          <button
            onClick={() => {
              setIsMobileQuickActionsOpen(false);
              openNewSupplyModal();
            }}
            className="p-3.5 rounded-2xl bg-[#E0EFE7] dark:bg-[#1E362A] hover:bg-[#cbe5d8] text-[#116B50] dark:text-[#4ADE80] text-xs font-bold flex items-center justify-between transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#116B50] text-white flex items-center justify-center shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-extrabold text-sm text-[#172C28] dark:text-white">{t('action_new_supply')}</div>
                <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">{t('dash_turnover_desc')}</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#566A63]" />
          </button>

          <button
            onClick={() => {
              setIsMobileQuickActionsOpen(false);
              setPayStoreId(stores[0]?.storeId || '');
              setPayAmount(0);
              setIsPaymentModalOpen(true);
            }}
            className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-between transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Banknote className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-extrabold text-sm text-[#172C28] dark:text-white">{t('action_new_payment')}</div>
                <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">{t('dash_cash_desc')}</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#566A63]" />
          </button>

          <button
            onClick={() => {
              setIsMobileQuickActionsOpen(false);
              setReturnStoreId(stores[0]?.storeId || '');
              setReturnProductId(products[0]?.id || '');
              setIsReturnModalOpen(true);
            }}
            className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-800 dark:text-purple-300 text-xs font-bold flex items-center justify-between transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-extrabold text-sm text-[#172C28] dark:text-white">{t('modal_return_title')}</div>
                <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">{t('btn_return')}</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#566A63]" />
          </button>

          <button
            onClick={() => {
              setIsMobileQuickActionsOpen(false);
              setIsNewStoreModalOpen(true);
            }}
            className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sky-800 dark:text-sky-300 text-xs font-bold flex items-center justify-between transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-extrabold text-sm text-[#172C28] dark:text-white">{t('modal_new_store_title')}</div>
                <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">{t('modal_new_store_desc')}</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#566A63]" />
          </button>
        </div>
      </Modal>

      {/* ================= MODAL: NEW SUPPLY ORDER (NAKLADNOY) ================= */}
      <Modal
        isOpen={isSupplyModalOpen}
        onClose={() => setIsSupplyModalOpen(false)}
        title={t('modal_supply_title')}
      >
        <form onSubmit={handleCreateSupplyOrder} className="flex flex-col gap-3.5 py-1">
          {stores.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center flex flex-col items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Hali birorta ham do‘kon biriktirilmagan!
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 max-w-sm">
                Yuk xati (nakladnoy) rasmiylashtirishdan oldin do‘konni mijozlar bazangizga biriktirishingiz kerak.
              </p>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => {
                  setIsSupplyModalOpen(false);
                  setIsAttachStoreModalOpen(true);
                }}
                className="bg-[#116B50] hover:bg-[#0E5842] text-white font-bold text-xs"
              >
                <Store className="w-4 h-4 mr-1.5" />
                + Yangi Do‘kon Biriktirish
              </Button>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                {t('modal_supply_select_store')} *
              </label>
              <select
                value={supplyStoreId || stores[0]?.storeId}
                onChange={(e) => setSupplyStoreId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
              >
                {stores.map(s => (
                  <option key={s.storeId} value={s.storeId}>
                    {s.storeName} ({t('debt_short')} {s.currentDebtBalance.toLocaleString()} {t('currency')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {products.length === 0 ? (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-center flex flex-col items-center gap-2">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div className="text-xs font-bold text-blue-900 dark:text-blue-200">
                Omborda tovarlar mavjud emas
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setIsSupplyModalOpen(false);
                  setIsProductModalOpen(true);
                }}
                className="text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Yangi tovar qo‘shish
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
                  {t('modal_supply_goods_list')} *
                </label>
                <button
                  type="button"
                  onClick={addSupplyLine}
                  className="text-[11px] font-bold text-[#116B50] dark:text-[#4ADE80] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {t('modal_supply_add_line')}
                </button>
              </div>

              {supplyLines.length === 0 ? (
                <div className="p-3 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] text-center">
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mb-2">Tovarlar tanlanmagan</p>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={addSupplyLine}
                    className="text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    + Tovar qo‘shish
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                  {supplyLines.map((line, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] flex items-center gap-2">
                      <select
                        value={line.productId}
                        onChange={(e) => updateSupplyLine(idx, 'productId', e.target.value)}
                        className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.wholesalePrice.toLocaleString()} {t('currency')})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        placeholder={t('modal_supply_qty')}
                        value={line.quantity}
                        onChange={(e) => updateSupplyLine(idx, 'quantity', e.target.value)}
                        className="w-16 px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white text-center font-bold"
                      />

                      <div className="text-xs font-bold text-right min-w-[80px]">
                        {(line.quantity * line.unitPrice).toLocaleString()}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSupplyLine(idx)}
                        className="p-1 text-rose-500 hover:text-rose-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-3 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] text-xs">
            <div className="flex items-center justify-between font-black text-sm text-[#116B50] dark:text-[#4ADE80]">
              <span>{t('modal_supply_total_amount')}</span>
              <span>{supplyTotalAmount.toLocaleString()} {t('currency')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                {t('modal_supply_paid_amount')}
              </label>
              <input
                type="number"
                min="0"
                max={supplyTotalAmount}
                value={supplyPaidAmount || ''}
                onChange={(e) => setSupplyPaidAmount(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                {t('modal_supply_pay_method')}
              </label>
              <select
                value={supplyPaymentType}
                onChange={(e) => setSupplyPaymentType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white font-bold"
              >
                <option value="PARTIAL">{t('status_partial')}</option>
                <option value="CASH">{t('pay_cash')}</option>
                <option value="TRANSFER">{t('pay_bank')}</option>
                <option value="CARD">{t('pay_card')}</option>
                <option value="DEBT">{t('pay_credit')}</option>
              </select>
            </div>
          </div>

          {supplyDebtGenerated > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 font-bold flex items-center justify-between">
              <span>{t('modal_supply_debt_amount')}</span>
              <span>{supplyDebtGenerated.toLocaleString()} {t('currency')}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              {t('form_comment')}
            </label>
            <input
              type="text"
              placeholder={t('form_comment')}
              value={supplyNotes}
              onChange={(e) => setSupplyNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE5DF] dark:border-[#22332C]">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsSupplyModalOpen(false)}
            >
              {t('btn_cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              className="bg-[#116B50] hover:bg-[#0E5842] text-white font-bold"
            >
              {t('modal_supply_submit')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: AKT SVERKA ================= */}
      {aktSverkaData && (
        <Modal
          isOpen={isAktSverkaModalOpen}
          onClose={() => setIsAktSverkaModalOpen(false)}
          title={`${t('btn_akt_sverka')}: ${aktSverkaData.store.name}`}
        >
          <div className="flex flex-col gap-4 py-1">
            <div className="flex items-center justify-between border-b pb-3 border-[#DCE5DF] dark:border-[#22332C]">
              <div>
                <div className="font-bold text-sm text-[#172C28] dark:text-white">{aktSverkaData.store.name}</div>
                <div className="text-xs text-[#566A63] dark:text-[#8B9E95]">{aktSverkaData.store.address}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] block">{t('modal_akt_final_debt')}</span>
                <span className="text-base font-black text-amber-600 dark:text-amber-400">
                  {aktSverkaData.summary.currentDebtBalance.toLocaleString()} {t('currency')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300">
                <div className="text-[10px] font-bold">{t('modal_akt_total_supplied')}</div>
                <div className="font-black mt-0.5">{aktSverkaData.summary.totalSupplied.toLocaleString()}</div>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                <div className="text-[10px] font-bold">{t('modal_akt_total_paid')}</div>
                <div className="font-black mt-0.5">{aktSverkaData.summary.totalPaid.toLocaleString()}</div>
              </div>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300">
                <div className="text-[10px] font-bold">{t('btn_return')}</div>
                <div className="font-black mt-0.5">{aktSverkaData.summary.totalReturned.toLocaleString()}</div>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border border-[#DCE5DF] dark:border-[#22332C] rounded-xl overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] uppercase font-bold sticky top-0">
                  <tr>
                    <th className="py-2 px-3">{t('th_tx_date')}</th>
                    <th className="py-2 px-3">{t('th_tx_type')}</th>
                    <th className="py-2 px-3 text-right">{t('th_tx_amount')}</th>
                    <th className="py-2 px-3 text-right">{t('th_tx_balance')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5DF]/60 dark:divide-[#22332C]">
                  {aktSverkaData.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#F9FAF9] dark:hover:bg-[#1A2822]/50">
                      <td className="py-2 px-3 text-[#566A63] dark:text-[#8B9E95]">
                        {new Date(tx.date).toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ')}
                      </td>
                      <td className="py-2 px-3 font-medium">
                        {tx.type === 'SUPPLY' ? `📦 ${t('tx_supply_badge')}` : tx.type === 'PAYMENT' ? `💰 ${t('tx_payment_badge')}` : `↩️ ${t('tx_return_badge')}`}
                        {tx.orderNumber && <span className="font-mono text-[10px] ml-1 text-[#116B50]">({tx.orderNumber})</span>}
                      </td>
                      <td className={`py-2 px-3 text-right font-bold ${tx.type === 'SUPPLY' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {tx.type === 'SUPPLY' ? '+' : '-'}{tx.amount.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-black">
                        {tx.balanceAfter.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl border border-[#DCE5DF] dark:border-[#22332C] text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                {t('modal_akt_print')}
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAktSverkaModalOpen(false)}
              >
                {t('btn_close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL: ATTACH STORE ================= */}
      <Modal
        isOpen={isAttachStoreModalOpen}
        onClose={() => setIsAttachStoreModalOpen(false)}
        title={t('modal_link_title')}
      >
        <div className="flex flex-col gap-3 py-1">
          <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
            {t('modal_link_desc')}
          </p>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              {t('form_store_credit_limit')} (so‘m)
            </label>
            <input
              type="number"
              step="500000"
              value={attachCreditLimit}
              onChange={(e) => setAttachCreditLimit(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white font-bold"
            />
          </div>

          {/* Search Box */}
          <form onSubmit={(e) => { e.preventDefault(); handleAttachStore(e); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#566A63] dark:text-[#8B9E95]" />
              <input
                type="text"
                placeholder="Do‘kon nomi, STIR/INN, telefon yoki manzil..."
                value={attachQuery}
                onChange={(e) => {
                  setAttachQuery(e.target.value);
                  loadAvailableStores(e.target.value);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              className="bg-[#116B50] hover:bg-[#0E5842] text-white font-bold text-xs shrink-0"
            >
              Qidirish
            </Button>
          </form>

          {/* List of Available Platform Stores */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95]">
              <span>YaqinTop platformasidagi do‘konlar ({availableStores.length})</span>
              {isLoadingAvailableStores && <span className="text-[#116B50] animate-pulse">Yuklanmoqda...</span>}
            </div>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {availableStores.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] text-center flex flex-col items-center gap-2">
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
                    {attachQuery ? 'Qidiruv bo‘yicha do‘kon topilmadi.' : 'Do‘konlar ro‘yxati bo‘sh.'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setIsAttachStoreModalOpen(false);
                      setIsNewStoreModalOpen(true);
                    }}
                    className="text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Xaritada yangi do‘kon ochish
                  </Button>
                </div>
              ) : (
                availableStores.map(st => (
                  <div
                    key={st.id}
                    className="p-3 rounded-xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] hover:border-[#116B50] transition flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-xs text-[#172C28] dark:text-white truncate">
                          {st.name}
                        </span>
                        {st.category && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]">
                            {st.category}
                          </span>
                        )}
                        {st.isAttached && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            Mijozingiz
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#566A63] dark:text-[#8B9E95] truncate">
                        {st.organizationName && `${st.organizationName} • `}{st.address || 'Manzil ko‘rsatilmagan'}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                        {st.inn && <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">STIR: {st.inn}</span>}
                        {st.phone && <span>Tel: {st.phone}</span>}
                      </div>
                    </div>

                    <div>
                      {st.isAttached ? (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800">
                          Biriktirilgan
                        </span>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          type="button"
                          onClick={() => handleAttachStore(undefined, st.id)}
                          className="bg-[#116B50] hover:bg-[#0E5842] text-white font-bold text-xs px-2.5 py-1"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Biriktirish
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#DCE5DF] dark:border-[#22332C]">
            <button
              type="button"
              onClick={() => {
                setIsAttachStoreModalOpen(false);
                setIsNewStoreModalOpen(true);
              }}
              className="text-xs font-bold text-[#116B50] dark:text-[#4ADE80] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Yangi do‘kon (Xaritada ochish)
            </button>

            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsAttachStoreModalOpen(false)}
            >
              {t('btn_close')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= MODAL: CREATE STORE PIN ================= */}
      <Modal
        isOpen={isNewStoreModalOpen}
        onClose={() => setIsNewStoreModalOpen(false)}
        title={t('modal_new_store_title')}
      >
        <form onSubmit={handleCreateNewStore} className="flex flex-col gap-3 py-1">
          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              {t('form_store_name')}
            </label>
            <input
              type="text"
              required
              placeholder="Omad Oziq-Ovqat Do‘koni"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                {t('form_store_phone')}
              </label>
              <input
                type="text"
                value={newStorePhone}
                onChange={(e) => setNewStorePhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                {t('form_store_inn')}
              </label>
              <input
                type="text"
                placeholder="300000000"
                value={newStoreInn}
                onChange={(e) => setNewStoreInn(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              {t('form_store_address')}
            </label>
            <input
              type="text"
              required
              placeholder="Yunusobod 14-mavze, 22-uy ro‘parasi"
              value={newStoreAddress}
              onChange={(e) => setNewStoreAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                {t('form_store_lat')}
              </label>
              <input
                type="number"
                step="0.000001"
                value={newStoreLat}
                onChange={(e) => setNewStoreLat(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                {t('form_store_lng')}
              </label>
              <input
                type="number"
                step="0.000001"
                value={newStoreLng}
                onChange={(e) => setNewStoreLng(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE5DF] dark:border-[#22332C]">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsNewStoreModalOpen(false)}
            >
              {t('btn_cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              className="bg-[#116B50] hover:bg-[#0E5842] text-white font-bold"
            >
              {t('btn_submit_new_store')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: ADD PRODUCT ================= */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Yangi Mahsulot Qo‘shish"
      >
        <form onSubmit={handleCreateProduct} className="flex flex-col gap-3 py-1">
          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              Mahsulot nomi *
            </label>
            <input
              type="text"
              required
              placeholder="Masalan: Snickers 50g, Coca-Cola 1.5L..."
              value={newProdName}
              onChange={(e) => setNewProdName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                Kategoriya
              </label>
              <input
                type="text"
                placeholder="Ichimliklar, Shirinliklar..."
                value={newProdCategory}
                onChange={(e) => setNewProdCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                O‘lchov birligi
              </label>
              <select
                value={newProdUnit}
                onChange={(e) => setNewProdUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white"
              >
                <option value="dona">dona</option>
                <option value="blok">blok</option>
                <option value="qadoq">qadoq</option>
                <option value="quti">quti</option>
                <option value="kg">kg</option>
                <option value="litr">litr</option>
                <option value="qop">qop</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                Ulgurji narxi (so‘m) *
              </label>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={newProdPrice}
                onChange={(e) => setNewProdPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                Ombordagi qoldiq
              </label>
              <input
                type="number"
                min="0"
                value={newProdStock}
                onChange={(e) => setNewProdStock(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              SKU / Artikil (ixtiyoriy)
            </label>
            <input
              type="text"
              placeholder="Masalan: SNK-50G-24"
              value={newProdSku}
              onChange={(e) => setNewProdSku(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE5DF] dark:border-[#22332C]">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsProductModalOpen(false)}
            >
              {t('btn_cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isCreatingProduct}
              className="bg-[#116B50] hover:bg-[#0E5842] text-white font-bold"
            >
              {isCreatingProduct ? 'Qo‘shilmoqda...' : 'Tovar qo‘shish'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: PAYMENT (INKASSATSIYA) ================= */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={t('modal_pay_title')}
      >
        <form onSubmit={handleRecordPayment} className="flex flex-col gap-3 py-1">
          {stores.length === 0 ? (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
              <p className="text-xs text-amber-900 dark:text-amber-200 font-bold">Hali birorta ham do‘kon biriktirilmagan</p>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                {t('modal_supply_select_store')}
              </label>
              <select
                value={payStoreId || stores[0]?.storeId}
                onChange={(e) => setPayStoreId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
              >
                {stores.map(s => (
                  <option key={s.storeId} value={s.storeId}>
                    {s.storeName} ({t('debt_short')} {s.currentDebtBalance.toLocaleString()} {t('currency')})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              {t('modal_pay_amount')}
            </label>
            <input
              type="number"
              required
              min="1000"
              step="1000"
              value={payAmount || ''}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50] font-bold"
            />

            {/* Quick amount shortcut pills */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
              {[100000, 500000, 1000000, 2000000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setPayAmount(amt)}
                  className="px-2.5 py-1 rounded-lg bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] text-[11px] font-bold shrink-0 hover:bg-[#c7e5d5] transition active:scale-95"
                >
                  +{(amt / 1000).toLocaleString()} {lang === 'en' ? 'k' : 'ming'}
                </button>
              ))}
              {(() => {
                const cur = stores.find(s => s.storeId === payStoreId) || stores[0];
                return cur && cur.currentDebtBalance > 0 ? (
                  <button
                    type="button"
                    onClick={() => setPayAmount(cur.currentDebtBalance)}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[11px] font-bold shrink-0 hover:bg-amber-200 transition active:scale-95"
                  >
                    {t('pay_shortcut_full')} ({cur.currentDebtBalance.toLocaleString()} {t('currency')})
                  </button>
                ) : null;
              })()}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              {t('th_inv_payment_type')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['CASH', 'TRANSFER', 'CARD'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayMethod(m)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    payMethod === m
                      ? 'bg-[#116B50] text-white border-[#116B50]'
                      : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border-[#DCE5DF] dark:border-[#22332C]'
                  }`}
                >
                  {m === 'CASH' ? t('pay_cash') : m === 'TRANSFER' ? t('pay_bank') : t('pay_card')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              {t('th_tx_comment')}
            </label>
            <input
              type="text"
              placeholder={t('modal_pay_comment')}
              value={payComment}
              onChange={(e) => setPayComment(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE5DF] dark:border-[#22332C]">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              {t('btn_cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              {t('modal_pay_submit')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: RETURN (VOZVRAT) ================= */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title={t('modal_return_title')}
      >
        <form onSubmit={handleRecordReturn} className="flex flex-col gap-3 py-1">
          <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
            {t('modal_return_desc')}
          </p>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              {t('modal_supply_select_store')}
            </label>
            <select
              value={returnStoreId || stores[0]?.storeId}
              onChange={(e) => setReturnStoreId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
            >
              {stores.map(s => (
                <option key={s.storeId} value={s.storeId}>
                  {s.storeName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              {t('modal_supply_product')} *
            </label>
            <select
              value={returnProductId || products[0]?.id}
              onChange={(e) => setReturnProductId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.wholesalePrice.toLocaleString()} {t('currency')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              {t('modal_return_qty')}
            </label>
            <input
              type="number"
              required
              min="1"
              value={returnQuantity}
              onChange={(e) => setReturnQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              {t('modal_return_reason')}
            </label>
            <input
              type="text"
              placeholder={t('modal_return_reason')}
              value={returnComment}
              onChange={(e) => setReturnComment(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white focus:outline-none focus:border-[#116B50]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE5DF] dark:border-[#22332C]">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsReturnModalOpen(false)}
            >
              {t('btn_cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
            >
              {t('modal_return_submit')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: LOGIN ================= */}
      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => {}}
        title={t('login_modal_title')}
      >
        <div className="flex flex-col gap-3 py-1">
          {/* Auth Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F3F6F3] dark:bg-[#1A2822] rounded-xl">
            <button
              type="button"
              onClick={() => { setAuthMode('CREDENTIALS'); setLoginError(null); }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authMode === 'CREDENTIALS'
                  ? 'bg-white dark:bg-[#14201A] text-[#116B50] dark:text-[#4ADE80] shadow-sm'
                  : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{t('login_credentials_tab')}</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('TOKEN'); setLoginError(null); }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authMode === 'TOKEN'
                  ? 'bg-white dark:bg-[#14201A] text-[#116B50] dark:text-[#4ADE80] shadow-sm'
                  : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{t('quick_login_token')}</span>
            </button>
          </div>

          {loginError && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-600 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {authMode === 'CREDENTIALS' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] text-xs text-[#116B50] dark:text-[#4ADE80] font-medium flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{t('login_notice')}</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                  {t('login_username_label')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="diller1 / +998901234567"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                  {t('login_password_label')}
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isLoggingIn}
                className="w-full py-2.5 bg-[#116B50] hover:bg-[#0E5842] text-white font-bold text-xs"
              >
                {isLoggingIn ? t('verifying') : t('sign_in')}
              </Button>

              <div className="pt-2 text-center border-t border-[#DCE5DF]/60 dark:border-[#22332C]">
                <button
                  type="button"
                  onClick={() => { setAuthMode('TOKEN'); setLoginError(null); }}
                  className="text-xs text-[#116B50] dark:text-[#4ADE80] font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{t('login_token_switch')}</span>
                </button>
              </div>

              <p className="text-[11px] text-center text-[#566A63] dark:text-[#8B9E95]">
                {t('login_demo_hint')}
              </p>
            </form>
          ) : (
            <form onSubmit={handleTokenLogin} className="flex flex-col gap-3.5">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                <Key className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>
                  {t('login_token_info')}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
                    {t('login_token_label')}
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="text-[11px] text-[#116B50] dark:text-[#4ADE80] font-bold hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t('login_paste_clipboard')}</span>
                  </button>
                </div>
                <textarea
                  required
                  rows={3}
                  placeholder="yaqintop_sess_..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#22332C] text-[#172C28] dark:text-white resize-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isTokenLoggingIn}
                className="w-full py-2.5 bg-[#116B50] hover:bg-[#0E5842] text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Key className="w-4 h-4" />
                <span>{isTokenLoggingIn ? t('verifying') : t('login_token_submit')}</span>
              </Button>

              <div className="pt-2 text-center border-t border-[#DCE5DF]/60 dark:border-[#22332C]">
                <button
                  type="button"
                  onClick={() => { setAuthMode('CREDENTIALS'); setLoginError(null); }}
                  className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold hover:underline"
                >
                  {t('login_back_credentials')}
                </button>
              </div>

              <p className="text-[11px] text-center text-[#566A63] dark:text-[#8B9E95]">
                {t('login_shortcut_hint')}
              </p>
            </form>
          )}
        </div>
      </Modal>

      {/* Global Token Quick Login Modal (Ctrl + Alt + T) */}
      <TokenQuickLoginModal
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsLoginModalOpen(false);
          showToast(`"${user.fullName}" diller hisobiga muvaffaqiyatli kirildi!`);
          loadInitialData();
        }}
      />
    </div>
  );
}
