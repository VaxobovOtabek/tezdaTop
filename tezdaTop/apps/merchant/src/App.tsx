import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  PlusCircle,
  ShoppingCart,
  RotateCcw,
  Receipt,
  FileSpreadsheet,
  Mail,
  Settings,
  Bell,
  Search,
  ChevronDown,
  TrendingUp,
  Coins,
  AlertTriangle,
  Upload,
  Download,
  Calendar,
  X,
  Check,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sun,
  Moon,
  Building2,
  MapPin,
  Image as ImageIcon,
  Plus,
  Save,
  Globe,
  Trash2,
  Edit3,
  SlidersHorizontal,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  DollarSign,
  CreditCard,
  Wallet,
  RefreshCw,
  BarChart3,
  Info,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import { Button, Tag, Modal } from '@yaqintop/ui';
import { StockDocument, Offer, MerchantSummary } from '@yaqintop/contracts';
import { UnifiedUserProfileModal } from './components/UnifiedUserProfileModal';
import { UnifiedLoginModal } from './components/UnifiedLoginModal';
import { MerchantInquiriesInbox } from './components/MerchantInquiriesInbox';

// Helper for strictly validating and formatting Uzbek phone numbers
export const formatUzPhone = (value: string): string => {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }
  digits = digits.slice(0, 9);
  if (!digits) return '+998 ';
  
  let formatted = '+998 ';
  if (digits.length > 0) {
    formatted += digits.substring(0, 2);
  }
  if (digits.length >= 3) {
    formatted += ' ' + digits.substring(2, 5);
  }
  if (digits.length >= 6) {
    formatted += ' ' + digits.substring(5, 7);
  }
  if (digits.length >= 8) {
    formatted += ' ' + digits.substring(7, 9);
  }
  return formatted;
};

// Helper for STIR/INN: strictly maximum 9 digits, no letters
export const formatUzTin = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 9);
};

export interface ExpenseItem {
  id: string;
  organizationId: string;
  storeId: string;
  category: string;
  amount: number | string;
  date: string;
  description: string;
  createdAt: string;
}

export function MerchantApp() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'catalog' | 'stock' | 'receipt' | 'sales' | 'returns' | 'expenses' | 'reports' | 'inbox' | 'organization' | 'settings'
  >('dashboard');

  const [dashboardData, setDashboardData] = useState<MerchantSummary | null>(null);
  const [recentDocs, setRecentDocs] = useState<StockDocument[]>([]);
  const [allDocs, setAllDocs] = useState<StockDocument[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Barchasi');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'LOW' | 'OUT' | 'OK'>('ALL');

  // Organization & Store Information State
  const [orgInfo, setOrgInfo] = useState({
    name: 'Navbahor Market',
    legalName: 'Navbahor Savdo MCHJ',
    tin: '304892110',
    phone: '+998 71 200 11 22',
    email: 'info@navbahormarket.uz',
    website: 'https://navbahor.uz',
    logoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&q=80',
    description: 'Chakana va ulgurji oziq-ovqat mahsulotlari do‘koni. Toshkent shahrida tezkor va sifatli xizmat.'
  });

  // Branches / Store Locations
  const [branches, setBranches] = useState([
    {
      id: '22222222-2222-4222-a222-222222222222',
      name: 'Asosiy filial',
      address: 'Navbahor ko‘chasi, 14-uy',
      landmark: 'Chilonzor metro bekati yonida',
      phone: '+998 71 200-11-22',
      lat: 41.311081,
      lng: 69.240562,
      is24_7: false,
      openTime: '08:00',
      closeTime: '23:00'
    },
    {
      id: '33333333-3333-4333-a333-333333333333',
      name: 'Yunusobod filiali',
      address: 'Amir Temur shoh ko‘chasi, 45-uy',
      landmark: 'Megaplanet ro‘parasi',
      phone: '+998 71 200-33-44',
      lat: 41.332150,
      lng: 69.284320,
      is24_7: true,
      openTime: '00:00',
      closeTime: '23:59'
    }
  ]);

  // Working Hours Schedule
  const [weeklySchedule, setWeeklySchedule] = useState([
    { day: 'Dushanba', open: '08:00', close: '23:00', isDayOff: false },
    { day: 'Seshanba', open: '08:00', close: '23:00', isDayOff: false },
    { day: 'Chorshanba', open: '08:00', close: '23:00', isDayOff: false },
    { day: 'Payshanba', open: '08:00', close: '23:00', isDayOff: false },
    { day: 'Juma', open: '08:00', close: '23:00', isDayOff: false },
    { day: 'Shanba', open: '08:00', close: '23:00', isDayOff: false },
    { day: 'Yakshanba', open: '09:00', close: '22:00', isDayOff: false }
  ]);

  // Current User Session State
  const [currentUser, setCurrentUser] = useState<any>({
    id: 'cccc2222-2222-4ccc-cccc-222222222222',
    fullName: 'Oybek Tursunov',
    email: 'owner@navbahor.uz',
    phone: '+998 90 222 33 44',
    role: 'OWNER',
    organizationName: 'Navbahor Savdo MCHJ',
    status: 'ACTIVE'
  });

  // Modals
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Selected for edits
  const [selectedOfferToEdit, setSelectedOfferToEdit] = useState<Offer | null>(null);
  const [selectedDocDetails, setSelectedDocDetails] = useState<StockDocument | null>(null);

  // Form states - Sale & Receipt
  const [formVariantId, setFormVariantId] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formPrice, setFormPrice] = useState('8000');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'CASH' | 'CARD' | 'OTHER'>('CASH');
  const [formSupplierOrCustomer, setFormSupplierOrCustomer] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Form states - Return
  const [returnVariantId, setReturnVariantId] = useState('');
  const [returnQuantity, setReturnQuantity] = useState('1');
  const [returnPrice, setReturnPrice] = useState('8000');
  const [returnReason, setReturnReason] = useState('Sifat nuqsoni (Nuqsonli tovar)');
  const [returnRestockable, setReturnRestockable] = useState(true);
  const [returnOriginalSaleId, setReturnOriginalSaleId] = useState('');

  // Form states - Expense
  const [expenseCategory, setExpenseCategory] = useState('IJARA');
  const [expenseAmount, setExpenseAmount] = useState('50000');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseDesc, setExpenseDesc] = useState('');

  // Form states - Stock Adjustment
  const [adjVariantId, setAdjVariantId] = useState('');
  const [adjCountedQty, setAdjCountedQty] = useState('10');
  const [adjReason, setAdjReason] = useState('Sanashdagi tafovut / Inventarizatsiya');
  const [adjNotes, setAdjNotes] = useState('');

  // New Product Form
  const [newProd, setNewProd] = useState({
    title: '',
    brand: 'Nestle',
    category: 'Oziq-ovqat',
    barcode: '',
    packUnit: 'dona',
    retailPrice: '12000',
    costPrice: '9500',
    stockOnHand: '50',
    imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=200&q=80'
  });

  // Edit Product Form
  const [editProd, setEditProd] = useState({
    id: '',
    title: '',
    price: '',
    stockOnHand: 0,
    status: 'ACTIVE' as 'ACTIVE' | 'OUT_OF_STOCK' | 'INACTIVE'
  });

  // New Branch Form
  const [newBranch, setNewBranch] = useState({
    name: '',
    address: '',
    landmark: '',
    phone: '+998 71 ',
    lat: '41.311081',
    lng: '69.240562',
    is24_7: false,
    openTime: '08:00',
    closeTime: '23:00'
  });

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('yaqintop_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('yaqintop_theme', theme);
  }, [theme]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      const [dashRes, offersRes, docsRes, expensesRes, inboxRes] = await Promise.all([
        fetch('/api/v1/merchant/dashboard'),
        fetch('/api/v1/merchant/offers'),
        fetch('/api/v1/merchant/stock-documents'),
        fetch('/api/v1/merchant/expenses'),
        fetch('/api/v1/merchant/inbox')
      ]);

      if (dashRes.ok) {
        const d = await dashRes.json();
        setDashboardData(d.summary);
        setRecentDocs(d.recentDocs || []);
      }
      if (offersRes.ok) {
        const o = await offersRes.json();
        const offList: Offer[] = o.offers || [];
        setOffers(offList);
        if (offList.length > 0) {
          if (!formVariantId) {
            setFormVariantId(offList[0].variantId);
            setFormPrice(offList[0].price);
          }
          if (!returnVariantId) {
            setReturnVariantId(offList[0].variantId);
            setReturnPrice(offList[0].price);
          }
          if (!adjVariantId) {
            setAdjVariantId(offList[0].variantId);
            setAdjCountedQty(String(offList[0].stockOnHand));
          }
        }
      }
      if (docsRes.ok) {
        const docs = await docsRes.json();
        setAllDocs(docs.documents || []);
      }
      if (expensesRes.ok) {
        const ex = await expensesRes.json();
        setExpenses(ex.expenses || []);
      }
      if (inboxRes.ok) {
        const c = await inboxRes.json();
        setCorrections(c.corrections || []);
      }
    } catch (err) {
      console.error('Error loading merchant data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered lists
  const salesDocs = useMemo(() => {
    return allDocs.filter((d) => d.docType === 'SALE');
  }, [allDocs]);

  const receiptDocs = useMemo(() => {
    return allDocs.filter((d) => d.docType === 'RECEIPT');
  }, [allDocs]);

  const returnDocs = useMemo(() => {
    return allDocs.filter((d) => d.docType === 'RETURN');
  }, [allDocs]);

  const adjustmentDocs = useMemo(() => {
    return allDocs.filter((d) => d.docType === 'ADJUSTMENT');
  }, [allDocs]);

  // Categories list from offers
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    offers.forEach((o) => {
      if (o.variant.category) set.add(o.variant.category);
    });
    return ['Barchasi', ...Array.from(set)];
  }, [offers]);

  // Filtered offers for Catalog
  const filteredCatalogOffers = useMemo(() => {
    return offers.filter((o) => {
      const matchesSearch =
        o.variant.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.variant.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.variant.barcode && o.variant.barcode.includes(searchQuery));
      const matchesCategory =
        selectedCategoryFilter === 'Barchasi' || o.variant.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [offers, searchQuery, selectedCategoryFilter]);

  // Filtered offers for Stock Management
  const filteredStockOffers = useMemo(() => {
    return offers.filter((o) => {
      const matchesSearch =
        o.variant.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.variant.brand || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (stockStatusFilter === 'LOW') {
        return o.stockOnHand > 0 && o.stockOnHand <= 10;
      }
      if (stockStatusFilter === 'OUT') {
        return o.stockOnHand <= 0;
      }
      if (stockStatusFilter === 'OK') {
        return o.stockOnHand > 10;
      }
      return true;
    });
  }, [offers, searchQuery, stockStatusFilter]);

  // Stock Aggregates
  const totalStockOnHand = useMemo(() => {
    return offers.reduce((sum, o) => sum + (o.stockOnHand || 0), 0);
  }, [offers]);

  const totalStockCostValue = useMemo(() => {
    return offers.reduce((sum, o) => {
      const cost = parseFloat(o.price) * 0.75; // Approx cost 75%
      return sum + cost * (o.stockOnHand || 0);
    }, 0);
  }, [offers]);

  const totalStockRetailValue = useMemo(() => {
    return offers.reduce((sum, o) => {
      return sum + parseFloat(o.price) * (o.stockOnHand || 0);
    }, 0);
  }, [offers]);

  const lowStockCount = useMemo(() => {
    return offers.filter((o) => o.stockOnHand > 0 && o.stockOnHand <= 10).length;
  }, [offers]);

  const outOfStockCount = useMemo(() => {
    return offers.filter((o) => o.stockOnHand <= 0).length;
  }, [offers]);

  // Total Sales & Expenses Sums
  const totalSalesSum = useMemo(() => {
    return salesDocs.reduce((acc, d) => acc + parseFloat(d.totalAmount || '0'), 0);
  }, [salesDocs]);

  const totalReceiptsSum = useMemo(() => {
    return receiptDocs.reduce((acc, d) => acc + parseFloat(d.totalAmount || '0'), 0);
  }, [receiptDocs]);

  const totalReturnsSum = useMemo(() => {
    return returnDocs.reduce((acc, d) => acc + parseFloat(d.totalAmount || '0'), 0);
  }, [returnDocs]);

  const totalExpensesSum = useMemo(() => {
    return expenses.reduce((acc, e) => acc + parseFloat(String(e.amount || 0)), 0);
  }, [expenses]);

  // ================= POST ACTIONS =================

  // 1. Post Sale
  const handlePostSale = async () => {
    try {
      const selectedOffer = offers.find((o) => o.variantId === formVariantId);
      if (!selectedOffer) {
        showToast('Mahsulot tanlanmadi');
        return;
      }
      const qty = parseFloat(formQuantity);
      if (isNaN(qty) || qty <= 0) {
        showToast('Miqdor to‘g‘ri kiritilishi kerak');
        return;
      }
      if (qty > selectedOffer.stockOnHand) {
        showToast(`Qoldiq yetarli emas! Omborda faqat ${selectedOffer.stockOnHand} dona bor.`);
        return;
      }

      const total = (qty * parseFloat(formPrice)).toFixed(2);
      const res = await fetch('/api/v1/merchant/stock-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `sale_${Date.now()}`
        },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          organizationId: '11111111-1111-4111-a111-111111111111',
          storeId: branches[0]?.id || '22222222-2222-4222-a222-222222222222',
          docType: 'SALE',
          status: 'DRAFT',
          documentNumber: `STV-${Math.floor(100 + Math.random() * 900)}`,
          date: new Date().toISOString(),
          supplierOrCustomer: formSupplierOrCustomer || 'Chakana xaridor',
          paymentMethod: formPaymentMethod,
          totalAmount: total,
          notes: formNotes || 'Do‘kon kassa sotuvi',
          lines: [
            {
              id: crypto.randomUUID(),
              variantId: formVariantId,
              variantTitle: selectedOffer.variant.title,
              quantity: qty.toFixed(3),
              unitPriceOrCost: formPrice,
              subtotal: total,
              isRestockable: true
            }
          ]
        })
      });

      if (res.ok) {
        showToast('Sotuv muvaffaqiyatli kiritildi va ombor qoldig‘idan ayirildi!');
        setIsSaleModalOpen(false);
        setFormQuantity('1');
        setFormSupplierOrCustomer('');
        setFormNotes('');
        loadData();
      } else {
        const err = await res.json();
        showToast(err.message || 'Xatolik yuz berdi');
      }
    } catch {
      showToast('Serverga ulanishda xatolik');
    }
  };

  // 2. Post Receipt
  const handlePostReceipt = async () => {
    try {
      const selectedOffer = offers.find((o) => o.variantId === formVariantId);
      const qty = parseFloat(formQuantity);
      if (isNaN(qty) || qty <= 0) {
        showToast('Kirim miqdori to‘g‘ri kiritilishi shart');
        return;
      }
      const total = (qty * parseFloat(formPrice)).toFixed(2);

      const res = await fetch('/api/v1/merchant/stock-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `receipt_${Date.now()}`
        },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          organizationId: '11111111-1111-4111-a111-111111111111',
          storeId: branches[0]?.id || '22222222-2222-4222-a222-222222222222',
          docType: 'RECEIPT',
          status: 'DRAFT',
          documentNumber: `KRM-${Math.floor(100 + Math.random() * 900)}`,
          date: new Date().toISOString(),
          supplierOrCustomer: formSupplierOrCustomer || 'Distribyutsiya kompaniyasi',
          paymentMethod: formPaymentMethod,
          totalAmount: total,
          notes: formNotes || 'Tovarlar qabuli',
          lines: [
            {
              id: crypto.randomUUID(),
              variantId: formVariantId,
              variantTitle: selectedOffer?.variant.title || 'Yangi tovar',
              quantity: qty.toFixed(3),
              unitPriceOrCost: formPrice,
              subtotal: total,
              isRestockable: true
            }
          ]
        })
      });

      if (res.ok) {
        showToast('Kirim muvaffaqiyatli tasdiqlandi va ombor qoldig‘i oshirildi!');
        setIsReceiptModalOpen(false);
        setFormQuantity('1');
        setFormSupplierOrCustomer('');
        setFormNotes('');
        loadData();
      } else {
        const err = await res.json();
        showToast(err.message || 'Xatolik yuz berdi');
      }
    } catch {
      showToast('Serverga ulanishda xatolik');
    }
  };

  // 3. Post Return (Qaytarish)
  const handlePostReturn = async () => {
    try {
      const selectedOffer = offers.find((o) => o.variantId === returnVariantId);
      const qty = parseFloat(returnQuantity);
      if (isNaN(qty) || qty <= 0) {
        showToast('Qaytarilayotgan miqdor to‘g‘ri kiritilishi kerak');
        return;
      }
      const total = (qty * parseFloat(returnPrice)).toFixed(2);

      // Find original sale line snapshot or default to a generated one
      let originalLineId = returnOriginalSaleId;
      if (!originalLineId) {
        const existingSale = salesDocs.find((d) => d.lines.some((l) => l.variantId === returnVariantId));
        if (existingSale && existingSale.lines[0]?.id) {
          originalLineId = existingSale.lines[0].id;
        }
      }

      const res = await fetch('/api/v1/merchant/stock-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `return_${Date.now()}`
        },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          organizationId: '11111111-1111-4111-a111-111111111111',
          storeId: branches[0]?.id || '22222222-2222-4222-a222-222222222222',
          docType: 'RETURN',
          status: 'DRAFT',
          documentNumber: `QYT-${Math.floor(100 + Math.random() * 900)}`,
          date: new Date().toISOString(),
          supplierOrCustomer: 'Xaridor tomonidan qaytarish',
          paymentMethod: 'CASH',
          totalAmount: total,
          notes: `Sabab: ${returnReason}. ${returnRestockable ? 'Qayta sotuvga qo‘yildi' : 'Yaroqsiz deb hisobdan chiqarildi'}`,
          lines: [
            {
              id: crypto.randomUUID(),
              originalSaleLineId: originalLineId || crypto.randomUUID(),
              variantId: returnVariantId,
              variantTitle: selectedOffer?.variant.title || 'Tovar',
              quantity: qty.toFixed(3),
              unitPriceOrCost: returnPrice,
              subtotal: total,
              isRestockable: returnRestockable,
              reason: returnReason
            }
          ]
        })
      });

      if (res.ok) {
        showToast('Qaytarish rasmiylashtirildi va hisob-kitob yangilandi!');
        setIsReturnModalOpen(false);
        loadData();
      } else {
        const err = await res.json();
        showToast(err.message || 'Xatolik yuz berdi');
      }
    } catch {
      showToast('Serverga ulanishda xatolik');
    }
  };

  // 4. Post Expense (Xarajat)
  const handlePostExpense = async () => {
    try {
      const amt = parseFloat(expenseAmount);
      if (isNaN(amt) || amt <= 0) {
        showToast('Xarajat summasi kiritilishi shart');
        return;
      }

      const res = await fetch('/api/v1/merchant/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: branches[0]?.id || '22222222-2222-4222-a222-222222222222',
          category: expenseCategory,
          amount: amt,
          date: expenseDate,
          description: expenseDesc || `${expenseCategory} xarajati`
        })
      });

      if (res.ok) {
        showToast('Xarajat muvaffaqiyatli saqlandi!');
        setIsExpenseModalOpen(false);
        setExpenseDesc('');
        loadData();
      } else {
        const err = await res.json();
        showToast(err.message || 'Xarajat saqlashda xatolik');
      }
    } catch {
      showToast('Serverga ulanishda xatolik');
    }
  };

  // 5. Post Inventory Adjustment (Qoldiqni to‘g‘rilash)
  const handlePostAdjustment = async () => {
    try {
      const selectedOffer = offers.find((o) => o.variantId === adjVariantId);
      if (!selectedOffer) {
        showToast('Mahsulot tanlanmadi');
        return;
      }
      const counted = parseFloat(adjCountedQty);
      if (isNaN(counted) || counted < 0) {
        showToast('Haqiqiy sanalgan miqdor to‘g‘ri kiritilishi kerak');
        return;
      }

      const res = await fetch('/api/v1/merchant/stock-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `adj_${Date.now()}`
        },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          organizationId: '11111111-1111-4111-a111-111111111111',
          storeId: branches[0]?.id || '22222222-2222-4222-a222-222222222222',
          docType: 'ADJUSTMENT',
          status: 'DRAFT',
          documentNumber: `INV-${Math.floor(100 + Math.random() * 900)}`,
          date: new Date().toISOString(),
          supplierOrCustomer: 'Ichki inventarizatsiya',
          paymentMethod: 'OTHER',
          totalAmount: '0.00',
          notes: `Sabab: ${adjReason}. Izoh: ${adjNotes || 'Tafovut to‘g‘rilandi'}`,
          lines: [
            {
              id: crypto.randomUUID(),
              variantId: adjVariantId,
              variantTitle: selectedOffer.variant.title,
              quantity: counted.toFixed(3),
              unitPriceOrCost: selectedOffer.price,
              subtotal: '0.00',
              isRestockable: true,
              reason: adjReason
            }
          ]
        })
      });

      if (res.ok) {
        showToast(`Ombor qoldig‘i muvaffaqiyatli ${counted} donaga to‘g‘rilandi!`);
        setIsAdjustmentModalOpen(false);
        setAdjNotes('');
        loadData();
      } else {
        const err = await res.json();
        showToast(err.message || 'Xatolik yuz berdi');
      }
    } catch {
      showToast('Serverga ulanishda xatolik');
    }
  };

  // 6. Add new product
  const handleAddProduct = async () => {
    if (!newProd.title || !newProd.retailPrice) {
      showToast('Iltimos, mahsulot nomi va narxini kiriting');
      return;
    }
    try {
      const res = await fetch('/api/v1/merchant/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: branches[0]?.id || '22222222-2222-4222-a222-222222222222',
          title: newProd.title,
          brand: newProd.brand,
          category: newProd.category,
          barcode: newProd.barcode,
          packUnit: newProd.packUnit,
          price: newProd.retailPrice,
          costPrice: newProd.costPrice,
          stockOnHand: newProd.stockOnHand,
          imageUrl: newProd.imageUrl
        })
      });

      if (res.ok) {
        showToast('Yangi mahsulot katalogga qo‘shildi va saqlandi!');
        setIsAddProductModalOpen(false);
        setNewProd({
          title: '',
          brand: 'Nestle',
          category: 'Oziq-ovqat',
          barcode: '',
          packUnit: 'dona',
          retailPrice: '12000',
          costPrice: '9500',
          stockOnHand: '50',
          imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=200&q=80'
        });
        loadData();
      } else {
        showToast('Mahsulotni saqlashda xatolik');
      }
    } catch {
      showToast('Server bilan bog‘lanishda xatolik');
    }
  };

  // 7. Update Product (Price / Status)
  const handleUpdateProduct = async () => {
    if (!editProd.id || !editProd.price) return;
    try {
      const res = await fetch(`/api/v1/merchant/offers/${editProd.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: editProd.price
        })
      });

      if (res.ok) {
        showToast('Mahsulot ma’lumotlari muvaffaqiyatli yangilandi!');
        setIsEditProductModalOpen(false);
        loadData();
      } else {
        showToast('Yangilashda xatolik yuz berdi');
      }
    } catch {
      showToast('Server bilan bog‘lanishda xatolik');
    }
  };

  // 8. Delete Product from Catalog
  const handleDeleteProduct = async (offerId: string) => {
    if (!window.confirm('Haqiqatan ham bu mahsulotni katalogdan o‘chirmoqchimisiz?')) return;
    try {
      const res = await fetch(`/api/v1/merchant/offers/${offerId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Mahsulot katalogdan o‘chirildi');
        loadData();
      } else {
        showToast('O‘chirishda xatolik yuz berdi');
      }
    } catch {
      showToast('Server bilan bog‘lanishda xatolik');
    }
  };

  // Add new branch
  const handleAddBranch = () => {
    if (!newBranch.name || !newBranch.address) {
      showToast('Iltimos, filial nomi va manzilini to‘liq kiriting');
      return;
    }
    const branch = {
      id: crypto.randomUUID(),
      name: newBranch.name,
      address: newBranch.address,
      landmark: newBranch.landmark || '—',
      phone: newBranch.phone || orgInfo.phone,
      lat: parseFloat(newBranch.lat) || 41.311081,
      lng: parseFloat(newBranch.lng) || 69.240562,
      is24_7: newBranch.is24_7,
      openTime: newBranch.openTime,
      closeTime: newBranch.closeTime
    };
    setBranches([...branches, branch]);
    setIsAddBranchModalOpen(false);
    setNewBranch({
      name: '',
      address: '',
      landmark: '',
      phone: '+998 71 ',
      lat: '41.311081',
      lng: '69.240562',
      is24_7: false,
      openTime: '08:00',
      closeTime: '23:00'
    });
    showToast('Yangi filial muvaffaqiyatli qo‘shildi!');
  };

  // Delete branch
  const handleDeleteBranch = (id: string) => {
    if (branches.length <= 1) {
      showToast('Kamida 1 ta filial mavjud bo‘lishi shart');
      return;
    }
    setBranches(branches.filter((b) => b.id !== id));
    showToast('Filial o‘chirildi');
  };

  // Save organization info
  const handleSaveOrgInfo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    showToast('Tashkilot ma‘lumotlari muvaffaqiyatli saqlandi!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F6F3] dark:bg-[#0E1713] text-[#172C28] dark:text-[#E8F2EC] font-sans antialiased transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#172C28] dark:bg-[#1E3328] text-white dark:text-[#E8F2EC] px-5 py-3 rounded-xl shadow-2xl text-sm font-medium border border-transparent dark:border-[#2A3F36] flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#4ADE80]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-[72px] bg-white dark:bg-[#14201A] border-b border-[#DCE5DF] dark:border-[#22332C] px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-9 bg-[#116B50] rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-sm flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
              Y
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tight text-[#172C28] dark:text-white leading-none block">
                YaqinTop
              </span>
              <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] font-medium leading-none block mt-0.5">
                Do‘kon boshqaruvi
              </span>
            </div>
          </div>

          {/* Store & Branch Switchers */}
          <div className="hidden md:flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-[#F3F6F3] dark:bg-[#1A2822] hover:bg-[#E8EDE8] dark:hover:bg-[#22362E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-semibold text-[#172C28] dark:text-[#E8F2EC]">
              <span>🏪 {orgInfo.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#566A63] dark:text-[#8B9E95]" />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-[#F3F6F3] dark:bg-[#1A2822] hover:bg-[#E8EDE8] dark:hover:bg-[#22362E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-semibold text-[#172C28] dark:text-[#E8F2EC]">
              <span>📍 {branches[0]?.name || 'Asosiy filial'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#566A63] dark:text-[#8B9E95]" />
            </button>
          </div>
        </div>

        {/* Global Actions, Search & Profile */}
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block w-72">
            <Search className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tovar yoki shtrix-kod qidirish..."
              className="w-full h-10 pl-9 pr-4 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC] placeholder-[#566A63]/70 dark:placeholder-[#8B9E95] focus:bg-white dark:focus:bg-[#14201A] focus:outline-none"
            />
          </div>

          {/* Fast Quick Action Buttons */}
          <button
            onClick={() => setIsSaleModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#116B50] hover:bg-[#0E5842] text-white text-xs font-bold rounded-xl shadow-sm transition"
            title="Yangi sotuv kiritish"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>+ Sotuv</span>
          </button>

          <button
            onClick={() => setIsReceiptModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#1A2822] hover:bg-[#F3F6F3] dark:hover:bg-[#22362E] text-[#116B50] dark:text-[#4ADE80] border border-[#DCE5DF] dark:border-[#2A3F36] text-xs font-bold rounded-xl transition shadow-sm"
            title="Yangi kirim qilish"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Kirim</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-10 h-10 rounded-xl border border-[#DCE5DF] dark:border-[#2D453E] flex items-center justify-center text-[#172C28] dark:text-[#E1ECE7] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2E28] transition-colors"
            title={theme === 'light' ? "Qora mavzuga o'tish" : "Yorug' mavzuga o'tish"}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Notifications */}
          <button
            onClick={() => setActiveTab('inbox')}
            className="relative w-10 h-10 rounded-xl border border-[#DCE5DF] dark:border-[#2D453E] flex items-center justify-center text-[#172C28] dark:text-[#E1ECE7] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2E28]"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#B42318] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Profile */}
          {currentUser ? (
            <div
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 pl-2 border-l border-[#DCE5DF] dark:border-[#22332C] cursor-pointer hover:opacity-80 transition select-none"
              title="Shaxsiy profilni ochish"
            >
              <div className="w-9 h-9 rounded-full bg-[#116B50] text-white text-xs font-bold flex items-center justify-center shadow-sm">
                {currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'OT'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] block leading-tight">
                  {currentUser.fullName}
                </span>
                <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] block">
                  {currentUser.role || 'Do‘kon egasi'}
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-[#116B50] text-white hover:bg-[#0B563F] transition shadow-sm"
            >
              Kirish
            </button>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white dark:bg-[#14201A] border-r border-[#DCE5DF] dark:border-[#22332C] flex flex-col p-4 shrink-0 overflow-y-auto transition-colors">
          <nav className="flex flex-col gap-1">
            {[
              { id: 'dashboard', label: 'Umumiy ko‘rsatkichlar', icon: LayoutDashboard },
              { id: 'organization', label: 'Tashkilot va Filiallar', icon: Building2 },
              { id: 'catalog', label: 'Tovarlar katalogi', icon: Package },
              { id: 'stock', label: 'Qoldiq nazorati & Zaxira', icon: Boxes },
              { id: 'sales', label: 'Sotuvlar', icon: ShoppingCart },
              { id: 'receipt', label: 'Kirim qilish', icon: PlusCircle },
              { id: 'returns', label: 'Qaytarishlar (Vozvrat)', icon: RotateCcw },
              { id: 'expenses', label: 'Xarajatlar', icon: Receipt },
              { id: 'reports', label: 'Moliyaviy hisobotlar', icon: FileSpreadsheet },
              { id: 'inbox', label: 'Xabarlar & Murojaatlar', icon: Mail, badge: 3 },
              { id: 'settings', label: 'Sozlamalar', icon: Settings }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]'
                      : 'text-[#566A63] dark:text-[#8B9E95] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822] hover:text-[#172C28] dark:hover:text-[#E8F2EC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="w-4 h-4 bg-[#B42318] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Stock Status Widget in Sidebar */}
          <div className="mt-auto pt-4 border-t border-[#DCE5DF] dark:border-[#22332C]">
            <div className="p-3 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#566A63] dark:text-[#8B9E95]">Ombor holati:</span>
                <span className="text-[#116B50] dark:text-[#4ADE80]">{totalStockOnHand} dona</span>
              </div>
              <div className="w-full bg-[#E0EFE7] dark:bg-[#2A3F36] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#116B50] dark:bg-[#4ADE80] h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(10, (offers.filter(o => o.stockOnHand > 0).length / (offers.length || 1)) * 100))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                <span>Kam qolgan: <strong className="text-amber-600 dark:text-amber-400">{lowStockCount}</strong></span>
                <span>Tugagan: <strong className="text-rose-600 dark:text-rose-400">{outOfStockCount}</strong></span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#F3F6F3] dark:bg-[#0E1713] transition-colors">
          
          {/* ================= 1. DASHBOARD TAB ================= */}
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-[#E8F2EC]">
                    Bugungi ko‘rsatkichlar
                  </h1>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">Kiritilgan operatsiyalar asosida real vaqt monitoringi</p>
                </div>
                <button className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-semibold text-[#172C28] dark:text-[#E8F2EC] shadow-sm self-start">
                  <Calendar className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                  <span>Bugun: {new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </button>
              </div>

              {/* Top 3 KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Sof Sotuv Tushumi */}
                <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-5 shadow-sm flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
                      <div className="w-8 h-8 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] flex items-center justify-center text-[#116B50] dark:text-[#4ADE80]">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <span>Sof sotuv tushumi</span>
                    </div>
                    <div className="text-2xl font-extrabold text-[#172C28] dark:text-[#E8F2EC] mt-3">
                      {Number(dashboardData?.netSales || totalSalesSum || 1280000).toLocaleString('uz-UZ')} so‘m
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#116B50] dark:text-[#4ADE80] font-semibold mt-1">
                      <span>↗ +12%</span>
                      <span className="text-[#566A63] dark:text-[#8B9E95] font-normal">Sotuvlar soni: {salesDocs.length || 8} ta</span>
                    </div>
                  </div>
                </div>

                {/* 2. Yalpi Foyda */}
                <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-5 shadow-sm flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
                      <div className="w-8 h-8 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] flex items-center justify-center text-[#116B50] dark:text-[#4ADE80]">
                        <Coins className="w-4 h-4" />
                      </div>
                      <span>Yalpi foyda</span>
                    </div>
                    <div className="text-2xl font-extrabold text-[#172C28] dark:text-[#E8F2EC] mt-3">
                      {Number(dashboardData?.grossProfit || (totalSalesSum * 0.25) || 286000).toLocaleString('uz-UZ')} so‘m
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#116B50] dark:text-[#4ADE80] font-semibold mt-1">
                      <span>↗ +8%</span>
                      <span className="text-[#566A63] dark:text-[#8B9E95] font-normal">O‘rtacha marja: ~25%</span>
                    </div>
                  </div>
                </div>

                {/* 3. Kam Qolgan Tovar */}
                <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-5 shadow-sm flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
                      <div className="w-8 h-8 rounded-xl bg-[#FFF2DC] dark:bg-[#382613] flex items-center justify-center text-[#8A4B08] dark:text-[#FBBF24]">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <span>Kam qolgan tovarlar</span>
                    </div>
                    <div className="text-2xl font-extrabold text-[#172C28] dark:text-[#E8F2EC] mt-3">
                      {lowStockCount + outOfStockCount} ta
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#8A4B08] dark:text-[#FBBF24] font-semibold mt-1">
                      <span>▲ Zaxira to‘ldirish talab etiladi</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Column Section: Chart + Stock Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: 7-Day Sales Bar Chart */}
                <div className="lg:col-span-7 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-[#172C28] dark:text-[#E8F2EC]">Sotuvlar dinamikasi</h2>
                    <span className="text-xs text-[#566A63] dark:text-[#8B9E95] border border-[#DCE5DF] dark:border-[#2A3F36] px-2.5 py-1.5 rounded-lg">
                      So‘nggi 7 kun
                    </span>
                  </div>

                  <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-[#DCE5DF] dark:border-[#22332C]">
                    {[
                      { day: '28 sen', amount: 220000, h: '45%' },
                      { day: '29 sen', amount: 310000, h: '70%' },
                      { day: '30 sen', amount: 275000, h: '60%' },
                      { day: '1 okt', amount: 340000, h: '80%' },
                      { day: '2 okt', amount: 290000, h: '65%' },
                      { day: '3 okt', amount: 365000, h: '90%' },
                      { day: '4 okt', amount: 280000, h: '62%' }
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] font-semibold">
                          {(bar.amount / 1000).toFixed(0)}k
                        </span>
                        <div
                          style={{ height: bar.h }}
                          className="w-full max-w-[36px] bg-[#116B50] dark:bg-[#4ADE80] rounded-t-md hover:bg-[#0B563F] dark:hover:bg-[#22C55E] transition-all cursor-pointer"
                        />
                        <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">{bar.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Stock Alerts */}
                <div className="lg:col-span-5 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-[#172C28] dark:text-[#E8F2EC]">Qoldiq ogohlantirishlari</h2>
                    <button
                      onClick={() => {
                        setStockStatusFilter('LOW');
                        setActiveTab('stock');
                      }}
                      className="text-xs text-[#116B50] dark:text-[#4ADE80] font-semibold flex items-center gap-1 hover:underline"
                    >
                      Barchasini ko‘rish <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {offers.filter(o => o.stockOnHand <= 10).slice(0, 3).map(off => (
                      <div key={off.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAF9] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36]">
                        <div>
                          <h4 className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]">{off.variant.title}</h4>
                          <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">{off.variant.brand} · {off.variant.category}</span>
                        </div>
                        <Tag variant={off.stockOnHand <= 0 ? 'error' : 'warn'}>
                          {off.stockOnHand <= 0 ? '! Tugagan' : `▲ ${off.stockOnHand} ${off.variant.packUnit}`}
                        </Tag>
                      </div>
                    ))}
                    {offers.filter(o => o.stockOnHand <= 10).length === 0 && (
                      <div className="p-4 text-center text-xs text-[#566A63] dark:text-[#8B9E95]">
                        Barcha tovarlar zaxirasi yetarli darajada!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Section: Oxirgi operatsiyalar Table */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <h2 className="text-lg font-bold text-[#172C28] dark:text-[#E8F2EC]">Oxirgi operatsiyalar</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="primary" size="sm" onClick={() => setIsSaleModalOpen(true)}>
                      + Sotuv
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setIsReceiptModalOpen(true)}>
                      + Kirim
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                    <thead>
                      <tr className="border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] bg-[#F9FAF9] dark:bg-[#1A2822]">
                        <th className="py-3 px-4 font-semibold">#</th>
                        <th className="py-3 px-4 font-semibold">Sana va vaqt</th>
                        <th className="py-3 px-4 font-semibold">Hujjat turi</th>
                        <th className="py-3 px-4 font-semibold">Tovar / Tavsif</th>
                        <th className="py-3 px-4 font-semibold">Miqdor</th>
                        <th className="py-3 px-4 font-semibold">Narx</th>
                        <th className="py-3 px-4 font-semibold">Jami</th>
                        <th className="py-3 px-4 font-semibold">Holat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                      {allDocs.slice(0, 8).map((doc, idx) => (
                        <tr key={doc.id} className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/50">
                          <td className="py-3 px-4 font-medium">{idx + 1}</td>
                          <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95]">
                            {new Date(doc.date).toLocaleString('uz-UZ', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <Tag variant={doc.docType === 'SALE' ? 'default' : doc.docType === 'RECEIPT' ? 'warn' : doc.docType === 'RETURN' ? 'error' : 'gray'}>
                              {doc.docType === 'SALE' ? 'Sotuv' : doc.docType === 'RECEIPT' ? 'Kirim' : doc.docType === 'RETURN' ? 'Qaytarish' : 'Tuzatish'}
                            </Tag>
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            {doc.lines[0]?.variantTitle || 'Tovar'}
                          </td>
                          <td className="py-3 px-4">{Number(doc.lines[0]?.quantity || 1)} dona</td>
                          <td className="py-3 px-4">
                            {Number(doc.lines[0]?.unitPriceOrCost || 0).toLocaleString('uz-UZ')} so‘m
                          </td>
                          <td className="py-3 px-4 font-bold text-[#116B50] dark:text-[#4ADE80]">
                            {Number(doc.totalAmount).toLocaleString('uz-UZ')} so‘m
                          </td>
                          <td className="py-3 px-4">
                            <Tag variant="default">Tasdiqlangan</Tag>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. CATALOG TAB (Tovarlar katalogi) ================= */}
          {activeTab === 'catalog' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-[#E8F2EC]">
                    Tovarlar katalogi
                  </h1>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Do‘kondagi barcha tovarlar nomlari, brendlar, narxlar va shtrix-kodlar
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)}>
                    <Upload className="w-3.5 h-3.5 mr-1" /> CSV Import
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setIsAddProductModalOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Yangi tovar qo‘shish
                  </Button>
                </div>
              </div>

              {/* KPI Cards for Catalog */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#14201A] p-4 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Jami tovarlar soni</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#172C28] dark:text-[#E8F2EC]">
                    {offers.length} xil
                  </strong>
                </div>
                <div className="bg-white dark:bg-[#14201A] p-4 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Sotuvda mavjud</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#116B50] dark:text-[#4ADE80]">
                    {offers.filter(o => o.stockOnHand > 0).length} ta
                  </strong>
                </div>
                <div className="bg-white dark:bg-[#14201A] p-4 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Mavjud toifalar</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#172C28] dark:text-[#E8F2EC]">
                    {categoriesList.length - 1} ta
                  </strong>
                </div>
                <div className="bg-white dark:bg-[#14201A] p-4 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">O‘rtacha chakana narx</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#172C28] dark:text-[#E8F2EC]">
                    {offers.length > 0
                      ? Math.round(offers.reduce((a, b) => a + parseFloat(b.price), 0) / offers.length).toLocaleString('uz-UZ')
                      : '0'}{' '}
                    so‘m
                  </strong>
                </div>
              </div>

              {/* Category Filter Pills & Search */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#14201A] p-4 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] mr-1">Toifa:</span>
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        selectedCategoryFilter === cat
                          ? 'bg-[#116B50] text-white shadow-sm'
                          : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                  <thead>
                    <tr className="border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] bg-[#F9FAF9] dark:bg-[#1A2822]">
                      <th className="py-3 px-4 font-semibold">Mahsulot</th>
                      <th className="py-3 px-4 font-semibold">Shtrix-kod</th>
                      <th className="py-3 px-4 font-semibold">Chakana narx</th>
                      <th className="py-3 px-4 font-semibold">Taxminiy tannarx</th>
                      <th className="py-3 px-4 font-semibold">Marja (%)</th>
                      <th className="py-3 px-4 font-semibold">Holat</th>
                      <th className="py-3 px-4 font-semibold text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                    {filteredCatalogOffers.map((off) => {
                      const cost = parseFloat(off.price) * 0.75;
                      const marginPct = (((parseFloat(off.price) - cost) / parseFloat(off.price)) * 100).toFixed(0);
                      return (
                        <tr key={off.id} className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {off.variant.photoUrl ? (
                                <img
                                  src={off.variant.photoUrl}
                                  alt={off.variant.title}
                                  className="w-9 h-9 rounded-lg object-cover border border-[#DCE5DF] dark:border-[#2A3F36] shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-[#E0EFE7] dark:bg-[#1E362A] flex items-center justify-center text-[#116B50] dark:text-[#4ADE80] shrink-0">
                                  <Package className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <strong className="block text-sm text-[#172C28] dark:text-[#E8F2EC]">{off.variant.title}</strong>
                                <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                                  {off.variant.brand} · {off.variant.category} · {off.variant.packUnit}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[#566A63] dark:text-[#8B9E95]">
                            {off.variant.barcode || '—'}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#116B50] dark:text-[#4ADE80]">
                            {Number(off.price).toLocaleString('uz-UZ')} so‘m
                          </td>
                          <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95]">
                            {Number(cost.toFixed(0)).toLocaleString('uz-UZ')} so‘m
                          </td>
                          <td className="py-3 px-4 font-semibold text-amber-600 dark:text-amber-400">
                            +{marginPct}%
                          </td>
                          <td className="py-3 px-4">
                            <Tag variant={off.status === 'ACTIVE' ? 'default' : 'error'}>
                              {off.status === 'ACTIVE' ? 'Sotuvda faol' : 'To‘xtatilgan'}
                            </Tag>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedOfferToEdit(off);
                                  setEditProd({
                                    id: off.id,
                                    title: off.variant.title,
                                    price: off.price,
                                    stockOnHand: off.stockOnHand,
                                    status: off.status
                                  });
                                  setIsEditProductModalOpen(true);
                                }}
                                className="p-1.5 hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] rounded-lg transition"
                                title="Narx va ma’lumotlarni tahrirlash"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(off.id)}
                                className="p-1.5 hover:bg-[#FEF0EE] dark:hover:bg-[#381B18] text-[#B42318] dark:text-[#F87171] rounded-lg transition"
                                title="Katalogdan o‘chirish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= 3. STOCK TAB (Qoldiq nazorati & Zaxira) ================= */}
          {activeTab === 'stock' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-[#E8F2EC]">
                    Qoldiq nazorati & Inventarizatsiya
                  </h1>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Do‘kon omboridagi haqiqiy qoldiqlar, zaxira qiymati va inventarizatsiya auditi
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setIsAdjustmentModalOpen(true)}>
                    <SlidersHorizontal className="w-3.5 h-3.5 mr-1" /> ⚡ Qoldiqni to‘g‘rilash (Audit)
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setIsReceiptModalOpen(true)}>
                    <PlusCircle className="w-3.5 h-3.5 mr-1" /> + Kirim qilish
                  </Button>
                </div>
              </div>

              {/* Stock KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Jami ombor qoldig‘i</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#172C28] dark:text-[#E8F2EC]">
                    {totalStockOnHand} dona
                  </strong>
                  <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-0.5 block">
                    {offers.length} xil tovar bo‘yicha
                  </span>
                </div>

                <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Tannarxdagi zaxira qiymati</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#116B50] dark:text-[#4ADE80]">
                    {Number(totalStockCostValue.toFixed(0)).toLocaleString('uz-UZ')} so‘m
                  </strong>
                  <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-0.5 block">
                    Sotuvda: {Number(totalStockRetailValue.toFixed(0)).toLocaleString('uz-UZ')} so‘m
                  </span>
                </div>

                <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Kam qolgan tovarlar</span>
                  <strong className="block text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                    {lowStockCount} ta
                  </strong>
                  <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 block">
                    10 donadan kam
                  </span>
                </div>

                <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Tugagan tovarlar</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#B42318] dark:text-[#F87171]">
                    {outOfStockCount} ta
                  </strong>
                  <span className="text-[11px] text-[#B42318]/80 dark:text-[#F87171]/80 mt-0.5 block">
                    0 dona qoldiq
                  </span>
                </div>
              </div>

              {/* Stock Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#14201A] p-4 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStockStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      stockStatusFilter === 'ALL'
                        ? 'bg-[#116B50] text-white shadow-sm'
                        : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95]'
                    }`}
                  >
                    Barchasi ({offers.length})
                  </button>
                  <button
                    onClick={() => setStockStatusFilter('LOW')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      stockStatusFilter === 'LOW'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    ⚠️ Kam qolgan ({lowStockCount})
                  </button>
                  <button
                    onClick={() => setStockStatusFilter('OUT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      stockStatusFilter === 'OUT'
                        ? 'bg-[#B42318] text-white shadow-sm'
                        : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    🔴 Tugagan ({outOfStockCount})
                  </button>
                  <button
                    onClick={() => setStockStatusFilter('OK')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      stockStatusFilter === 'OK'
                        ? 'bg-[#116B50] text-white shadow-sm'
                        : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#116B50] dark:text-[#4ADE80]'
                    }`}
                  >
                    🟢 Yetarli qoldiq
                  </button>
                </div>
              </div>

              {/* Stock Balances Table */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                  <thead>
                    <tr className="border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] bg-[#F9FAF9] dark:bg-[#1A2822]">
                      <th className="py-3 px-4 font-semibold">Mahsulot</th>
                      <th className="py-3 px-4 font-semibold">Toifa</th>
                      <th className="py-3 px-4 font-semibold">Joriy qoldiq</th>
                      <th className="py-3 px-4 font-semibold">Xavfsiz limit</th>
                      <th className="py-3 px-4 font-semibold">Zaxira qiymati</th>
                      <th className="py-3 px-4 font-semibold">Zaxira holati</th>
                      <th className="py-3 px-4 font-semibold text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                    {filteredStockOffers.map((off) => {
                      const costValue = (parseFloat(off.price) * 0.75 * off.stockOnHand).toFixed(0);
                      return (
                        <tr key={off.id} className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/50">
                          <td className="py-3 px-4 font-semibold">
                            <span className="block text-sm text-[#172C28] dark:text-[#E8F2EC]">{off.variant.title}</span>
                            <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                              {off.variant.brand} · Kod: {off.variant.barcode || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95]">{off.variant.category}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 font-bold text-sm text-[#172C28] dark:text-[#E8F2EC]">
                              {off.stockOnHand} {off.variant.packUnit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95]">10 {off.variant.packUnit}</td>
                          <td className="py-3 px-4 font-bold text-[#116B50] dark:text-[#4ADE80]">
                            {Number(costValue).toLocaleString('uz-UZ')} so‘m
                          </td>
                          <td className="py-3 px-4">
                            {off.stockOnHand > 10 ? (
                              <Tag variant="default">🟢 Yetarli</Tag>
                            ) : off.stockOnHand > 0 ? (
                              <Tag variant="warn">⚠️ Kam qolgan</Tag>
                            ) : (
                              <Tag variant="error">🔴 Tugagan</Tag>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAdjVariantId(off.variantId);
                                  setAdjCountedQty(String(off.stockOnHand));
                                  setIsAdjustmentModalOpen(true);
                                }}
                              >
                                ⚡ To‘g‘rilash
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setFormVariantId(off.variantId);
                                  setFormPrice(String(Math.round(parseFloat(off.price) * 0.75)));
                                  setIsReceiptModalOpen(true);
                                }}
                              >
                                + Kirim
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= 4. SALES TAB (Sotuvlar) ================= */}
          {activeTab === 'sales' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-[#E8F2EC]">
                    Sotuvlar jurnali
                  </h1>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Kassa cheklari, tovarlar sotuvi, to‘lov turlari va tushumlar
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={() => setIsSaleModalOpen(true)}>
                  <ShoppingCart className="w-3.5 h-3.5 mr-1" /> + Yangi sotuv kiritish
                </Button>
              </div>

              {/* Sales KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Jami tushum (Sotuv)</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#116B50] dark:text-[#4ADE80]">
                    {Number(totalSalesSum).toLocaleString('uz-UZ')} so‘m
                  </strong>
                </div>
                <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Sotuv cheklari soni</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#172C28] dark:text-[#E8F2EC]">
                    {salesDocs.length} ta
                  </strong>
                </div>
                <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">O‘rtacha chek summasi</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#172C28] dark:text-[#E8F2EC]">
                    {salesDocs.length > 0
                      ? Math.round(totalSalesSum / salesDocs.length).toLocaleString('uz-UZ')
                      : '0'}{' '}
                    so‘m
                  </strong>
                </div>
              </div>

              {/* Sales Table */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                  <thead>
                    <tr className="border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] bg-[#F9FAF9] dark:bg-[#1A2822]">
                      <th className="py-3 px-4 font-semibold">Chek raqami</th>
                      <th className="py-3 px-4 font-semibold">Sana va vaqt</th>
                      <th className="py-3 px-4 font-semibold">Mijoz / Kassir</th>
                      <th className="py-3 px-4 font-semibold">Sotilgan tovar</th>
                      <th className="py-3 px-4 font-semibold">Miqdor</th>
                      <th className="py-3 px-4 font-semibold">To‘lov turi</th>
                      <th className="py-3 px-4 font-semibold">Jami summa</th>
                      <th className="py-3 px-4 font-semibold">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                    {salesDocs.length > 0 ? (
                      salesDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/50">
                          <td className="py-3 px-4 font-mono font-bold text-[#116B50] dark:text-[#4ADE80]">
                            {doc.documentNumber}
                          </td>
                          <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95]">
                            {new Date(doc.date).toLocaleString('uz-UZ', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-4 font-medium">{doc.supplierOrCustomer || 'Chakana mijoz'}</td>
                          <td className="py-3 px-4 font-semibold">{doc.lines[0]?.variantTitle || 'Tovar'}</td>
                          <td className="py-3 px-4">{Number(doc.lines[0]?.quantity || 1)} dona</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 font-semibold text-[#566A63] dark:text-[#8B9E95]">
                              {doc.paymentMethod === 'CARD' ? <CreditCard className="w-3.5 h-3.5" /> : <Wallet className="w-3.5 h-3.5" />}
                              {doc.paymentMethod === 'CARD' ? 'Karta' : 'Naqd'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-[#116B50] dark:text-[#4ADE80]">
                            {Number(doc.totalAmount).toLocaleString('uz-UZ')} so‘m
                          </td>
                          <td className="py-3 px-4">
                            <Tag variant="default">Tasdiqlangan</Tag>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#566A63] dark:text-[#8B9E95]">
                          Hozircha sotuvlar yozuvi mavjud emas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= 5. RECEIPT TAB (Kirim qilish) ================= */}
          {activeTab === 'receipt' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-[#E8F2EC]">
                    Kirim jurnali
                  </h1>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Ta‘minotchi va distribyutorlardan kelgan tovarlar qabuli va tannarx hisobi
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)}>
                    <Upload className="w-3.5 h-3.5 mr-1" /> CSV orqali kirim
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setIsReceiptModalOpen(true)}>
                    <PlusCircle className="w-3.5 h-3.5 mr-1" /> + Yangi kirim qilish
                  </Button>
                </div>
              </div>

              {/* Receipts KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Jami kirim summasi</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#172C28] dark:text-[#E8F2EC]">
                    {Number(totalReceiptsSum).toLocaleString('uz-UZ')} so‘m
                  </strong>
                </div>
                <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Kirim hujjatlari</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#172C28] dark:text-[#E8F2EC]">
                    {receiptDocs.length} ta
                  </strong>
                </div>
                <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Qabul qilingan mahsulotlar</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#116B50] dark:text-[#4ADE80]">
                    {receiptDocs.reduce((sum, d) => sum + Number(d.lines[0]?.quantity || 0), 0)} dona
                  </strong>
                </div>
              </div>

              {/* Receipts Table */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                  <thead>
                    <tr className="border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] bg-[#F9FAF9] dark:bg-[#1A2822]">
                      <th className="py-3 px-4 font-semibold">Hujjat #</th>
                      <th className="py-3 px-4 font-semibold">Sana</th>
                      <th className="py-3 px-4 font-semibold">Ta‘minotchi</th>
                      <th className="py-3 px-4 font-semibold">Mahsulot</th>
                      <th className="py-3 px-4 font-semibold">Kirim miqdori</th>
                      <th className="py-3 px-4 font-semibold">Birlik tannarxi</th>
                      <th className="py-3 px-4 font-semibold">Jami xarid summasi</th>
                      <th className="py-3 px-4 font-semibold">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                    {receiptDocs.length > 0 ? (
                      receiptDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/50">
                          <td className="py-3 px-4 font-mono font-bold text-[#116B50] dark:text-[#4ADE80]">
                            {doc.documentNumber}
                          </td>
                          <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95]">
                            {new Date(doc.date).toLocaleString('uz-UZ', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-4 font-semibold">{doc.supplierOrCustomer || 'Distribyutor'}</td>
                          <td className="py-3 px-4 font-medium">{doc.lines[0]?.variantTitle || 'Tovar'}</td>
                          <td className="py-3 px-4 font-bold text-[#172C28] dark:text-[#E8F2EC]">
                            +{Number(doc.lines[0]?.quantity || 1)} dona
                          </td>
                          <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95]">
                            {Number(doc.lines[0]?.unitPriceOrCost || 0).toLocaleString('uz-UZ')} so‘m
                          </td>
                          <td className="py-3 px-4 font-bold text-[#116B50] dark:text-[#4ADE80]">
                            {Number(doc.totalAmount).toLocaleString('uz-UZ')} so‘m
                          </td>
                          <td className="py-3 px-4">
                            <Tag variant="default">Kirim qilingan</Tag>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#566A63] dark:text-[#8B9E95]">
                          Hozircha kirim hujjatlari mavjud emas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= 6. RETURNS TAB (Qaytarishlar) ================= */}
          {activeTab === 'returns' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-[#E8F2EC]">
                    Qaytarishlar (Vozvrat)
                  </h1>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Xaridorlar tomonidan qaytarilgan tovarlar, sabablari va qayta zaxiraga qo‘yish nazorati
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={() => setIsReturnModalOpen(true)}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> + Qaytarish rasmiylashtirish
                </Button>
              </div>

              {/* Returns KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Jami qaytarilgan summa</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#B42318] dark:text-[#F87171]">
                    {Number(totalReturnsSum).toLocaleString('uz-UZ')} so‘m
                  </strong>
                </div>
                <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Qaytarish holatlari</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#172C28] dark:text-[#E8F2EC]">
                    {returnDocs.length} ta
                  </strong>
                </div>
                <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Qayta sotuvga olingan</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#116B50] dark:text-[#4ADE80]">
                    {returnDocs.filter(d => d.lines[0]?.isRestockable).length} ta
                  </strong>
                </div>
              </div>

              {/* Returns Table */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                  <thead>
                    <tr className="border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] bg-[#F9FAF9] dark:bg-[#1A2822]">
                      <th className="py-3 px-4 font-semibold">Hujjat #</th>
                      <th className="py-3 px-4 font-semibold">Sana</th>
                      <th className="py-3 px-4 font-semibold">Qaytarilgan tovar</th>
                      <th className="py-3 px-4 font-semibold">Miqdor</th>
                      <th className="py-3 px-4 font-semibold">Qaytarish sababi</th>
                      <th className="py-3 px-4 font-semibold">Tovar taqdiri</th>
                      <th className="py-3 px-4 font-semibold">Qaytarilgan summa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                    {returnDocs.length > 0 ? (
                      returnDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/50">
                          <td className="py-3 px-4 font-mono font-bold text-[#B42318] dark:text-[#F87171]">
                            {doc.documentNumber}
                          </td>
                          <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95]">
                            {new Date(doc.date).toLocaleString('uz-UZ', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-4 font-semibold">{doc.lines[0]?.variantTitle || 'Tovar'}</td>
                          <td className="py-3 px-4 font-bold">{Number(doc.lines[0]?.quantity || 1)} dona</td>
                          <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95]">
                            {doc.lines[0]?.reason || doc.notes || 'Mijoz rad etdi'}
                          </td>
                          <td className="py-3 px-4">
                            {doc.lines[0]?.isRestockable ? (
                              <Tag variant="default">Javonga qaytarildi</Tag>
                            ) : (
                              <Tag variant="error">Chiqimga chiqarildi</Tag>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#B42318] dark:text-[#F87171]">
                            -{Number(doc.totalAmount).toLocaleString('uz-UZ')} so‘m
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#566A63] dark:text-[#8B9E95]">
                          Hozircha qaytarish yozuvlari mavjud emas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= 7. EXPENSES TAB (Xarajatlar) ================= */}
          {activeTab === 'expenses' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-[#E8F2EC]">
                    Do‘kon xarajatlari
                  </h1>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Ijara, ish haqi, kommunal xizmatlar, transport va boshqa operatsion xarajatlar
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={() => setIsExpenseModalOpen(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> + Yangi xarajat kiritish
                </Button>
              </div>

              {/* Expenses KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Jami xarajatlar</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#B42318] dark:text-[#F87171]">
                    {Number(totalExpensesSum).toLocaleString('uz-UZ')} so‘m
                  </strong>
                </div>
                <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Xarajatlar soni</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#172C28] dark:text-[#E8F2EC]">
                    {expenses.length} ta
                  </strong>
                </div>
                <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Eng katta toifa</span>
                  <strong className="block text-2xl font-bold mt-1 text-[#172C28] dark:text-[#E8F2EC]">
                    Ijara va Ish haqi
                  </strong>
                </div>
              </div>

              {/* Expenses Table */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                  <thead>
                    <tr className="border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] bg-[#F9FAF9] dark:bg-[#1A2822]">
                      <th className="py-3 px-4 font-semibold">Sana</th>
                      <th className="py-3 px-4 font-semibold">Xarajat toifasi</th>
                      <th className="py-3 px-4 font-semibold">Tafsilot / Izoh</th>
                      <th className="py-3 px-4 font-semibold">Summa</th>
                      <th className="py-3 px-4 font-semibold">Mas’ul</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                    {expenses.length > 0 ? (
                      expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/50">
                          <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95] font-medium">{exp.date}</td>
                          <td className="py-3 px-4">
                            <Tag variant={exp.category === 'IJARA' ? 'warn' : exp.category === 'ISHOYI' ? 'default' : 'gray'}>
                              {exp.category}
                            </Tag>
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#172C28] dark:text-[#E8F2EC]">
                            {exp.description || 'Operatsion xarajat'}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#B42318] dark:text-[#F87171]">
                            -{Number(exp.amount).toLocaleString('uz-UZ')} so‘m
                          </td>
                          <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95]">Oybek Tursunov</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#566A63] dark:text-[#8B9E95]">
                          Hozircha xarajatlar yozuvi mavjud emas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= 8. ORGANIZATION & SETTINGS TAB ================= */}
          {(activeTab === 'organization' || activeTab === 'settings') && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-[#E8F2EC]">
                    Tashkilot va Do‘kon Boshqaruvi
                  </h1>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Tashkilot profili, do‘kon manzillari, ish tartibi va tovarlar ma’lumotlari
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsAddProductModalOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Yangi tovar
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setIsAddBranchModalOpen(true)}>
                    <MapPin className="w-3.5 h-3.5 mr-1" /> Filial qo‘shish
                  </Button>
                </div>
              </div>

              {/* Organization Form */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-[#DCE5DF] dark:border-[#22332C] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#172C28] dark:text-[#E8F2EC]">Tashkilot asosiy ma’lumotlari</h3>
                      <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">Kompaniya rekvizitlari va brend ma’lumotlari</p>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" onClick={handleSaveOrgInfo}>
                    <Save className="w-3.5 h-3.5 mr-1" /> Saqlash
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Logo Preview & File Upload */}
                  <div className="flex flex-col items-center justify-center p-4 bg-[#F9FAF9] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-2xl text-center gap-3">
                    <div className="relative group w-24 h-24 rounded-2xl overflow-hidden border border-[#DCE5DF] dark:border-[#2A3F36] shadow-sm bg-white dark:bg-[#16241E]">
                      <img src={orgInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      <label
                        htmlFor="logo-file-input"
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition text-[10px] font-bold gap-1"
                      >
                        <Upload className="w-4 h-4" />
                        O‘zgartirish
                      </label>
                    </div>

                    <div className="w-full flex flex-col gap-2">
                      <input
                        id="logo-file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setOrgInfo({ ...orgInfo, logoUrl: reader.result });
                                showToast('Logotip rasm faylidan yuklandi!');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />

                      <label
                        htmlFor="logo-file-input"
                        className="w-full py-1.5 px-3 bg-white dark:bg-[#16241E] hover:bg-[#EDF5F0] dark:hover:bg-[#1E362A] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-semibold text-[#116B50] dark:text-[#4ADE80] cursor-pointer flex items-center justify-center gap-1.5 transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Kompyuterdan tanlash
                      </label>

                      <div className="w-full text-left">
                        <label className="text-[11px] font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                          yoki Rasm URL manzili
                        </label>
                        <input
                          type="text"
                          value={orgInfo.logoUrl}
                          onChange={(e) => setOrgInfo({ ...orgInfo, logoUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full p-2 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Do‘kon nomi *</label>
                      <input
                        type="text"
                        value={orgInfo.name}
                        onChange={(e) => setOrgInfo({ ...orgInfo, name: e.target.value })}
                        className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Yuridik nomi</label>
                      <input
                        type="text"
                        value={orgInfo.legalName}
                        onChange={(e) => setOrgInfo({ ...orgInfo, legalName: e.target.value })}
                        className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">STIR (INN) *</label>
                        <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">{orgInfo.tin.length}/9 raqam</span>
                      </div>
                      <input
                        type="text"
                        maxLength={9}
                        value={orgInfo.tin}
                        onChange={(e) => setOrgInfo({ ...orgInfo, tin: formatUzTin(e.target.value) })}
                        className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-mono text-[#172C28] dark:text-[#E8F2EC]"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">Aloqa telefoni *</label>
                        <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">O‘zbekiston (+998)</span>
                      </div>
                      <input
                        type="text"
                        maxLength={17}
                        value={orgInfo.phone}
                        onChange={(e) => setOrgInfo({ ...orgInfo, phone: formatUzPhone(e.target.value) })}
                        className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-mono text-[#172C28] dark:text-[#E8F2EC]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Email</label>
                      <input
                        type="email"
                        value={orgInfo.email}
                        onChange={(e) => setOrgInfo({ ...orgInfo, email: e.target.value })}
                        className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Veb-sayt</label>
                      <input
                        type="text"
                        value={orgInfo.website}
                        onChange={(e) => setOrgInfo({ ...orgInfo, website: e.target.value })}
                        className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Branches Section */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#DCE5DF] dark:border-[#22332C] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#172C28] dark:text-[#E8F2EC]">Filiallar va do‘kon manzillari ({branches.length})</h3>
                      <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">Karta koordinatalari va mijozlar uchun yo‘nalishlar</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setIsAddBranchModalOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Yangi filial
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {branches.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl bg-[#F9FAF9] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#172C28] dark:text-[#E8F2EC]">{b.name}</h4>
                            {b.is24_7 && <Tag variant="default">24/7 Ochiq</Tag>}
                          </div>
                          <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#116B50] dark:text-[#4ADE80]" />
                            {b.address}
                          </p>
                          {b.landmark && (
                            <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] block mt-0.5">
                              Mo‘ljal: {b.landmark}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteBranch(b.id)}
                          className="text-[#B42318] dark:text-[#F87171] hover:bg-[#FEF0EE] dark:hover:bg-[#381B18] p-1.5 rounded-lg transition"
                          title="Filialni o‘chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-[#DCE5DF]/60 dark:border-[#2A3F36]">
                        <div className="flex items-center gap-2 text-[#566A63] dark:text-[#8B9E95]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{b.is24_7 ? 'Kechayu-kunduz' : `${b.openTime} – ${b.closeTime}`}</span>
                        </div>
                        <span className="text-[11px] font-mono bg-white dark:bg-[#16241E] px-2 py-0.5 rounded border border-[#DCE5DF] dark:border-[#2A3F36] text-[#116B50] dark:text-[#4ADE80]">
                          📍 {b.lat.toFixed(4)}, {b.lng.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= 9. REPORTS TAB ================= */}
          {activeTab === 'reports' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-[#E8F2EC]">
                    Moliyaviy hisobotlar
                  </h1>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Kiritilgan barcha operatsiyalar asosidagi yalpi foyda va sof natija
                  </p>
                </div>
                <a href="/api/v1/merchant/reports/export" target="_blank" download>
                  <Button variant="primary" size="sm">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> CSV Eksport (Xavfsiz)
                  </Button>
                </a>
              </div>

              {dashboardData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C]">
                    <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Sof sotuv tushumi</span>
                    <strong className="block text-2xl font-bold mt-1 text-[#172C28] dark:text-[#E8F2EC]">
                      {Number(dashboardData.netSales).toLocaleString('uz-UZ')} so‘m
                    </strong>
                  </div>
                  <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C]">
                    <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Tannarx (COGS)</span>
                    <strong className="block text-2xl font-bold mt-1 text-[#172C28] dark:text-[#E8F2EC]">
                      {Number(dashboardData.cogs).toLocaleString('uz-UZ')} so‘m
                    </strong>
                  </div>
                  <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C]">
                    <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Yalpi foyda</span>
                    <strong className="block text-2xl font-bold mt-1 text-[#116B50] dark:text-[#4ADE80]">
                      {Number(dashboardData.grossProfit).toLocaleString('uz-UZ')} so‘m
                    </strong>
                  </div>
                  <div className="bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C]">
                    <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">Operatsion natija</span>
                    <strong className="block text-2xl font-bold mt-1 text-[#172C28] dark:text-[#E8F2EC]">
                      {Number(dashboardData.operatingResult).toLocaleString('uz-UZ')} so‘m
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 10. INBOX / INQUIRIES TAB ================= */}
          {activeTab === 'inbox' && (
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
              <MerchantInquiriesInbox
                storeId={branches[0]?.id || '22222222-2222-4222-a222-222222222222'}
                isDarkMode={theme === 'dark'}
                onShowToast={(msg) => showToast(msg)}
              />
            </div>
          )}
        </main>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. SALE MODAL (+ Sotuv) */}
      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        title="Yangi sotuv kiritish"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsSaleModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" onClick={handlePostSale}>
              Sotuvni tasdiqlash
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Mahsulotni tanlang</label>
            <select
              value={formVariantId}
              onChange={(e) => {
                setFormVariantId(e.target.value);
                const off = offers.find((o) => o.variantId === e.target.value);
                if (off) setFormPrice(off.price);
              }}
              className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
            >
              {offers.map((o) => (
                <option key={o.variantId} value={o.variantId} className="dark:bg-[#16241E]">
                  {o.variant.title} (Omborda: {o.stockOnHand} {o.variant.packUnit}) — {Number(o.price).toLocaleString('uz-UZ')} so‘m
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Miqdor (dona)</label>
              <input
                type="number"
                min="1"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Sotuv narxi (so‘m)</label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">To‘lov turi</label>
              <select
                value={formPaymentMethod}
                onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
              >
                <option value="CASH">Naqd pul</option>
                <option value="CARD">Plastik karta (Humo/Uzcard)</option>
                <option value="OTHER">Click / Payme</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Mijoz / Izoh</label>
              <input
                type="text"
                value={formSupplierOrCustomer}
                onChange={(e) => setFormSupplierOrCustomer(e.target.value)}
                placeholder="Chakana xaridor"
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="bg-[#F9FAF9] dark:bg-[#1A2822] p-3 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] flex justify-between items-center text-sm">
            <span className="font-medium text-[#566A63] dark:text-[#8B9E95]">Jami kassa summasi:</span>
            <strong className="text-lg text-[#116B50] dark:text-[#4ADE80]">
              {(parseFloat(formQuantity || '0') * parseFloat(formPrice || '0')).toLocaleString('uz-UZ')} so‘m
            </strong>
          </div>
        </div>
      </Modal>

      {/* 2. RECEIPT MODAL (+ Kirim) */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Yangi tovar kirimi (Ta‘minotchidan qabul)"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsReceiptModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" onClick={handlePostReceipt}>
              Kirimni tasdiqlash
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Mahsulotni tanlang</label>
            <select
              value={formVariantId}
              onChange={(e) => {
                setFormVariantId(e.target.value);
                const off = offers.find((o) => o.variantId === e.target.value);
                if (off) setFormPrice(String(Math.round(parseFloat(off.price) * 0.75)));
              }}
              className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
            >
              {offers.map((o) => (
                <option key={o.variantId} value={o.variantId} className="dark:bg-[#16241E]">
                  {o.variant.title} (Joriy qoldiq: {o.stockOnHand} {o.variant.packUnit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Kirim miqdori (dona)</label>
              <input
                type="number"
                min="1"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Birlik xarid tannarxi (so‘m)</label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Ta‘minotchi kompaniya nomi</label>
            <input
              type="text"
              value={formSupplierOrCustomer}
              onChange={(e) => setFormSupplierOrCustomer(e.target.value)}
              placeholder="Masalan: Nestle Distribyutsiya yoki Mars LLC"
              className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
            />
          </div>

          <div className="bg-[#F9FAF9] dark:bg-[#1A2822] p-3 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] flex justify-between items-center text-sm">
            <span className="font-medium text-[#566A63] dark:text-[#8B9E95]">Jami kirim summasi:</span>
            <strong className="text-lg text-[#116B50] dark:text-[#4ADE80]">
              {(parseFloat(formQuantity || '0') * parseFloat(formPrice || '0')).toLocaleString('uz-UZ')} so‘m
            </strong>
          </div>
        </div>
      </Modal>

      {/* 3. RETURN MODAL (+ Qaytarish) */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Mahsulotni qaytarish (Vozvrat)"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsReturnModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" onClick={handlePostReturn}>
              Qaytarishni tasdiqlash
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Qaytarilayotgan mahsulot</label>
            <select
              value={returnVariantId}
              onChange={(e) => {
                setReturnVariantId(e.target.value);
                const off = offers.find((o) => o.variantId === e.target.value);
                if (off) setReturnPrice(off.price);
              }}
              className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
            >
              {offers.map((o) => (
                <option key={o.variantId} value={o.variantId} className="dark:bg-[#16241E]">
                  {o.variant.title} — {Number(o.price).toLocaleString('uz-UZ')} so‘m
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Qaytarish miqdori (dona)</label>
              <input
                type="number"
                min="1"
                value={returnQuantity}
                onChange={(e) => setReturnQuantity(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Qaytariladigan narx (so‘m)</label>
              <input
                type="number"
                value={returnPrice}
                onChange={(e) => setReturnPrice(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Qaytarish sababi</label>
            <select
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
            >
              <option value="Sifat nuqsoni (Nuqsonli tovar)">Sifat nuqsoni (Nuqsonli tovar)</option>
              <option value="Yaroqlilik muddati o‘tgan">Yaroqlilik muddati o‘tgan</option>
              <option value="Mijoz rad etdi / Xato olingan">Mijoz rad etdi / Xato olingan</option>
              <option value="Boshqa sabab">Boshqa sabab</option>
            </select>
          </div>

          <div className="p-3 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#172C28] dark:text-[#E8F2EC] cursor-pointer">
              <input
                type="checkbox"
                checked={returnRestockable}
                onChange={(e) => setReturnRestockable(e.target.checked)}
                className="accent-[#116B50]"
              />
              Tovarni ombor javoniga qaytarish (Ombor qoldig‘iga qo‘shiladi)
            </label>
            <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
              {returnRestockable
                ? '🟢 Tovar soz holatda, qaytadan sotuvga chiqariladi.'
                : '🔴 Tovar yaroqsiz / nuqsonli, hisobdan chiqim qilinadi.'}
            </span>
          </div>

          <div className="bg-[#FEF0EE] dark:bg-[#381B18] p-3 rounded-xl border border-[#FECDCA] dark:border-[#5C2320] flex justify-between items-center text-sm">
            <span className="font-medium text-[#B42318] dark:text-[#F87171]">Qaytariladigan summa:</span>
            <strong className="text-lg text-[#B42318] dark:text-[#F87171]">
              {(parseFloat(returnQuantity || '0') * parseFloat(returnPrice || '0')).toLocaleString('uz-UZ')} so‘m
            </strong>
          </div>
        </div>
      </Modal>

      {/* 4. EXPENSE MODAL (+ Yangi Xarajat) */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Yangi xarajat kiritish"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsExpenseModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" onClick={handlePostExpense}>
              Xarajatni saqlash
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Xarajat toifasi</label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
              >
                <option value="IJARA">Do‘kon ijarasi</option>
                <option value="ISHOYI">Xodimlar maoshi</option>
                <option value="KOMMUNAL">Kommunal & Internet</option>
                <option value="LOGISTIKA">Transport & Yetkazib berish</option>
                <option value="SOLIQ">Soliq va litsenziyalar</option>
                <option value="MARKETING">Reklama va marketing</option>
                <option value="BOSHQA">Boshqa xo‘jalik xarajati</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Sana</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Xarajat summasi (so‘m) *</label>
            <input
              type="number"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder="Masalan: 50000"
              className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Tafsilot / Izoh</label>
            <textarea
              rows={2}
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
              placeholder="Masalan: Sentabr oyi uchun elektr energiya to‘lovi"
              className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
            />
          </div>
        </div>
      </Modal>

      {/* 5. INVENTORY ADJUSTMENT MODAL (Audit) */}
      <Modal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        title="⚡ Qoldiqni to‘g‘rilash (Inventarizatsiya)"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAdjustmentModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" onClick={handlePostAdjustment}>
              Audit natijasini saqlash
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Mahsulot</label>
            <select
              value={adjVariantId}
              onChange={(e) => {
                setAdjVariantId(e.target.value);
                const off = offers.find((o) => o.variantId === e.target.value);
                if (off) setAdjCountedQty(String(off.stockOnHand));
              }}
              className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
            >
              {offers.map((o) => (
                <option key={o.variantId} value={o.variantId} className="dark:bg-[#16241E]">
                  {o.variant.title} (Hozirgi tizimdagi qoldiq: {o.stockOnHand} {o.variant.packUnit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36]">
              <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] block">Tizimdagi qoldiq:</span>
              <strong className="text-lg font-bold text-[#172C28] dark:text-[#E8F2EC]">
                {offers.find((o) => o.variantId === adjVariantId)?.stockOnHand || 0} dona
              </strong>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                Haqiqiy sanalgan qoldiq *
              </label>
              <input
                type="number"
                min="0"
                value={adjCountedQty}
                onChange={(e) => setAdjCountedQty(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">To‘g‘rilash sababi</label>
            <select
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
            >
              <option value="Sanashdagi tafovut / Inventarizatsiya">Sanashdagi tafovut / Inventarizatsiya</option>
              <option value="Muddati o‘tganligi sababli hisobdan chiqarish">Muddati o‘tganligi sababli hisobdan chiqarish</option>
              <option value="Shikastlangan / Buzilgan tovar">Shikastlangan / Buzilgan tovar</option>
              <option value="Boshqa audit sababi">Boshqa audit sababi</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Izoh</label>
            <input
              type="text"
              value={adjNotes}
              onChange={(e) => setAdjNotes(e.target.value)}
              placeholder="Audit xodimi izohi..."
              className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
            />
          </div>
        </div>
      </Modal>

      {/* 6. EDIT PRODUCT MODAL (Narx va holat) */}
      <Modal
        isOpen={isEditProductModalOpen}
        onClose={() => setIsEditProductModalOpen(false)}
        title="Mahsulotni tahrirlash"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditProductModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" onClick={handleUpdateProduct}>
              Saqlash
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Mahsulot nomi</label>
            <input
              type="text"
              disabled
              value={editProd.title}
              className="w-full p-2.5 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm opacity-80"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Chakana sotuv narxi (so‘m) *</label>
            <input
              type="number"
              value={editProd.price}
              onChange={(e) => setEditProd({ ...editProd, price: e.target.value })}
              className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm font-bold"
            />
          </div>
        </div>
      </Modal>

      {/* 7. ADD PRODUCT MODAL (+ Yangi tovar) */}
      <Modal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        title="Yangi tovar qo‘shish"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddProductModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" onClick={handleAddProduct}>
              Tovarni saqlash
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              Mahsulot nomi *
            </label>
            <input
              type="text"
              value={newProd.title}
              onChange={(e) => setNewProd({ ...newProd, title: e.target.value })}
              placeholder="Masalan: Snickers 50 g yoki Nestle Sut 1L"
              className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-sm text-[#172C28] dark:text-[#E8F2EC]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Kategoriya</label>
              <input
                type="text"
                value={newProd.category}
                onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-sm text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Brend</label>
              <input
                type="text"
                value={newProd.brand}
                onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-sm text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Shtrix-kod (EAN-13)</label>
              <input
                type="text"
                value={newProd.barcode}
                onChange={(e) => setNewProd({ ...newProd, barcode: e.target.value })}
                placeholder="4780001234567"
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-sm text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">O‘lchov birligi</label>
              <select
                value={newProd.packUnit}
                onChange={(e) => setNewProd({ ...newProd, packUnit: e.target.value })}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-sm text-[#172C28] dark:text-[#E8F2EC]"
              >
                <option value="dona">Dona</option>
                <option value="kg">Kilogramm (kg)</option>
                <option value="litr">Litr (l)</option>
                <option value="qadoq">Qadoq / Blok</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Chakana narx (so‘m) *</label>
              <input
                type="number"
                value={newProd.retailPrice}
                onChange={(e) => setNewProd({ ...newProd, retailPrice: e.target.value })}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-sm text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Tannarx (so‘m)</label>
              <input
                type="number"
                value={newProd.costPrice}
                onChange={(e) => setNewProd({ ...newProd, costPrice: e.target.value })}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-sm text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Boshlang‘ich qoldiq</label>
              <input
                type="number"
                value={newProd.stockOnHand}
                onChange={(e) => setNewProd({ ...newProd, stockOnHand: e.target.value })}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-sm text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* 8. CSV IMPORT MODAL */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="CSV orqali tovar yuklash"
        footer={
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              showToast('CSV fayl tekshirildi va tovarlar muvaffaqiyatli import qilindi');
              setIsImportModalOpen(false);
            }}
          >
            Tekshirish va yuklash
          </Button>
        }
      >
        <div className="flex flex-col gap-3 text-xs text-[#566A63] dark:text-[#8B9E95]">
          <p>CSV fayl ustunlari: SHTRIX_KOD, NOMI, CHAKANA_NARX, QOLDIQ</p>
          <input
            type="file"
            accept=".csv"
            className="p-3 border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] text-xs"
          />
          <div className="bg-[#FFF2DC] dark:bg-[#382613] text-[#8A4B08] dark:text-[#FBBF24] p-3 rounded-xl">
            Diqqat: Formulalar xavfsizligi va qoldiq hisobi tekshiriladi.
          </div>
        </div>
      </Modal>

      {/* 9. ADD BRANCH MODAL (+ Yangi filial) */}
      <Modal
        isOpen={isAddBranchModalOpen}
        onClose={() => setIsAddBranchModalOpen(false)}
        title="Yangi do‘kon filiali qo‘shish"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddBranchModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" onClick={handleAddBranch}>
              Filialni saqlash
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              Filial nomi *
            </label>
            <input
              type="text"
              value={newBranch.name}
              onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
              placeholder="Masalan: Mirzo Ulug‘bek filiali"
              className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-sm text-[#172C28] dark:text-[#E8F2EC]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
              Aniq manzil *
            </label>
            <input
              type="text"
              value={newBranch.address}
              onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
              placeholder="Ko‘cha, uy raqami"
              className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-sm text-[#172C28] dark:text-[#E8F2EC]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Mo‘ljal (Landmark)</label>
              <input
                type="text"
                value={newBranch.landmark}
                onChange={(e) => setNewBranch({ ...newBranch, landmark: e.target.value })}
                placeholder="Masalan: Metro yoki bozor yonida"
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-sm text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">Filial telefoni</label>
                <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">(+998)</span>
              </div>
              <input
                type="text"
                maxLength={17}
                value={newBranch.phone}
                onChange={(e) => setNewBranch({ ...newBranch, phone: formatUzPhone(e.target.value) })}
                placeholder="+998 71 200 33 44"
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-mono text-[#172C28] dark:text-[#E8F2EC]"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* User Profile Modal */}
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

      {/* Login Modal */}
      <UnifiedLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        appTitle="Do‘kon Boshqaruvi"
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Xush kelibsiz, ${user.fullName}!`);
        }}
      />
    </div>
  );
}
