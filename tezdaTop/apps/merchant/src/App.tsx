import React, { useState, useEffect } from 'react';
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
  PhoneCall,
  Save,
  Globe,
  ShieldCheck,
  Trash2,
  Edit3
} from 'lucide-react';
import { Button, Tag, Modal } from '@yaqintop/ui';
import { StockDocument, Offer, MerchantSummary } from '@yaqintop/contracts';

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

export function MerchantApp() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'catalog' | 'stock' | 'receipt' | 'sales' | 'returns' | 'expenses' | 'reports' | 'inbox' | 'organization' | 'settings'
  >('dashboard');

  const [dashboardData, setDashboardData] = useState<MerchantSummary | null>(null);
  const [recentDocs, setRecentDocs] = useState<StockDocument[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);

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

  // Modals
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState<any>(null);

  // Form states
  const [formVariantId, setFormVariantId] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formPrice, setFormPrice] = useState('8000');
  const [correctionResponse, setCorrectionResponse] = useState('');

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
      const [dashRes, offersRes, inboxRes] = await Promise.all([
        fetch('/api/v1/merchant/dashboard'),
        fetch('/api/v1/merchant/offers'),
        fetch('/api/v1/merchant/inbox')
      ]);

      if (dashRes.ok) {
        const d = await dashRes.json();
        setDashboardData(d.summary);
        setRecentDocs(d.recentDocs || []);
      }
      if (offersRes.ok) {
        const o = await offersRes.json();
        setOffers(o.offers || []);
        if (o.offers.length > 0 && !formVariantId) {
          setFormVariantId(o.offers[0].variantId);
          setFormPrice(o.offers[0].price);
        }
      }
      if (inboxRes.ok) {
        const c = await inboxRes.json();
        setCorrections(c.corrections || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Post Sale
  const handlePostSale = async () => {
    try {
      const selectedOffer = offers.find((o) => o.variantId === formVariantId);
      const total = (parseFloat(formQuantity) * parseFloat(formPrice)).toFixed(2);

      const res = await fetch('/api/v1/merchant/stock-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `sale_${Date.now()}`
        },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          organizationId: '11111111-1111-4111-a111-111111111111',
          storeId: '22222222-2222-4222-a222-222222222222',
          docType: 'SALE',
          status: 'DRAFT',
          documentNumber: `STV-${Math.floor(100 + Math.random() * 900)}`,
          date: new Date().toISOString(),
          paymentMethod: 'CASH',
          totalAmount: total,
          lines: [
            {
              id: crypto.randomUUID(),
              variantId: formVariantId,
              variantTitle: selectedOffer?.variant.title || 'Snickers 50 g',
              quantity: parseFloat(formQuantity).toFixed(3),
              unitPriceOrCost: formPrice,
              subtotal: total,
              isRestockable: true
            }
          ]
        })
      });

      if (res.ok) {
        showToast('Sotuv muvaffaqiyatli tasdiqlandi va qoldiqdan ayirildi!');
        setIsSaleModalOpen(false);
        loadData();
      } else {
        const err = await res.json();
        showToast(err.message || 'Xatolik yuz berdi');
      }
    } catch {
      showToast('Serverga ulanishda xatolik');
    }
  };

  // Post Receipt
  const handlePostReceipt = async () => {
    try {
      const selectedOffer = offers.find((o) => o.variantId === formVariantId);
      const total = (parseFloat(formQuantity) * parseFloat(formPrice)).toFixed(2);

      const res = await fetch('/api/v1/merchant/stock-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `receipt_${Date.now()}`
        },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          organizationId: '11111111-1111-4111-a111-111111111111',
          storeId: '22222222-2222-4222-a222-222222222222',
          docType: 'RECEIPT',
          status: 'DRAFT',
          documentNumber: `KRM-${Math.floor(100 + Math.random() * 900)}`,
          date: new Date().toISOString(),
          paymentMethod: 'CARD',
          totalAmount: total,
          lines: [
            {
              id: crypto.randomUUID(),
              variantId: formVariantId,
              variantTitle: selectedOffer?.variant.title || 'Snickers 50 g',
              quantity: parseFloat(formQuantity).toFixed(3),
              unitPriceOrCost: formPrice,
              subtotal: total,
              isRestockable: true
            }
          ]
        })
      });

      if (res.ok) {
        showToast('Kirim tasdiqlandi va qoldiq yangilandi!');
        setIsReceiptModalOpen(false);
        loadData();
      } else {
        const err = await res.json();
        showToast(err.message || 'Xatolik yuz berdi');
      }
    } catch {
      showToast('Serverga ulanishda xatolik');
    }
  };

  // Submit Correction response
  const handleReplyCorrection = async () => {
    if (!selectedCorrection) return;
    try {
      const res = await fetch(`/api/v1/merchant/inbox/${selectedCorrection.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: correctionResponse })
      });
      if (res.ok) {
        showToast('Javob yuborildi. Administratorga tekshirish uchun taqdim etildi.');
        setIsInboxModalOpen(false);
        setCorrectionResponse('');
        loadData();
      }
    } catch {
      showToast('Serverga ulanishda xatolik');
    }
  };

  // Save organization info
  const handleSaveOrgInfo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    showToast('Tashkilot ma‘lumotlari muvaffaqiyatli saqlandi!');
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

  // Add new product
  const handleAddProduct = () => {
    if (!newProd.title || !newProd.retailPrice) {
      showToast('Iltimos, mahsulot nomi va narxini kiriting');
      return;
    }
    const newOffer: Offer = {
      id: crypto.randomUUID(),
      storeId: branches[0]?.id || '22222222-2222-4222-a222-222222222222',
      variantId: crypto.randomUUID(),
      price: newProd.retailPrice,
      minOrderQuantity: 1,
      stockOnHand: parseInt(newProd.stockOnHand) || 0,
      stockVerifiedAt: new Date().toISOString(),
      priceUpdatedAt: new Date().toISOString(),
      freshness: 'NEW',
      status: 'ACTIVE',
      wholesaleTiers: [],
      version: 1,
      variant: {
        id: crypto.randomUUID(),
        productId: crypto.randomUUID(),
        title: newProd.title,
        brand: newProd.brand || 'Boshqa',
        category: newProd.category || 'Boshqa',
        barcode: newProd.barcode || '',
        packUnit: newProd.packUnit || 'dona',
        photoUrl: newProd.imageUrl || ''
      }
    };
    setOffers([newOffer, ...offers]);
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
    showToast('Yangi mahsulot katalogga qo‘shildi va saqlandi!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F6F3] dark:bg-[#0E1713] text-[#172C28] dark:text-[#E8F2EC] font-sans antialiased transition-colors">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#172C28] dark:bg-[#1E3328] text-white dark:text-[#E8F2EC] px-5 py-3 rounded-xl shadow-2xl text-sm font-medium border border-transparent dark:border-[#2A3F36]">
          {toastMessage}
        </div>
      )}

      {/* Top Bar (Exact Match with Image 1) */}
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
              <span>🏪 Navbahor Market</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#566A63] dark:text-[#8B9E95]" />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-[#F3F6F3] dark:bg-[#1A2822] hover:bg-[#E8EDE8] dark:hover:bg-[#22362E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-semibold text-[#172C28] dark:text-[#E8F2EC]">
              <span>📍 Asosiy filial</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#566A63] dark:text-[#8B9E95]" />
            </button>
          </div>
        </div>

        {/* Search Bar & Profile */}
        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block w-80">
            <Search className="w-4 h-4 text-[#566A63] dark:text-[#8B9E95] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Tovar, shtrix-kod yoki mijozni qidiring..."
              className="w-full h-10 pl-9 pr-4 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC] placeholder-[#566A63]/70 dark:placeholder-[#8B9E95] focus:bg-white dark:focus:bg-[#14201A]"
            />
          </div>

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
          <div className="flex items-center gap-2.5 pl-2 border-l border-[#DCE5DF] dark:border-[#22332C]">
            <div className="w-9 h-9 rounded-full bg-[#116B50] text-white text-xs font-bold flex items-center justify-center">
              OT
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] block leading-tight">Oybek Tursunov</span>
              <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] block">Do‘kon egasi</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (240px Desktop, matching Image 1) */}
        <aside className="w-60 bg-white dark:bg-[#14201A] border-r border-[#DCE5DF] dark:border-[#22332C] flex flex-col p-4 shrink-0 overflow-y-auto transition-colors">
          <nav className="flex flex-col gap-1">
            {[
              { id: 'dashboard', label: 'Umumiy', icon: LayoutDashboard },
              { id: 'organization', label: 'Tashkilot va Filiallar', icon: Building2 },
              { id: 'catalog', label: 'Tovarlar', icon: Package },
              { id: 'stock', label: 'Qoldiq', icon: Boxes },
              { id: 'receipt', label: 'Kirim', icon: PlusCircle },
              { id: 'sales', label: 'Sotuvlar', icon: ShoppingCart },
              { id: 'returns', label: 'Qaytarishlar', icon: RotateCcw },
              { id: 'expenses', label: 'Xarajatlar', icon: Receipt },
              { id: 'reports', label: 'Hisobotlar', icon: FileSpreadsheet },
              { id: 'inbox', label: 'Xabarlar', icon: Mail, badge: 3 },
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
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#F3F6F3] dark:bg-[#0E1713] transition-colors">
          {/* DASHBOARD TAB (Exact Match with Image 1) */}
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-[#E8F2EC]">
                    Bugungi ko‘rsatkichlar
                  </h1>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">Kiritilgan operatsiyalar asosida</p>
                </div>
                <button className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-semibold text-[#172C28] dark:text-[#E8F2EC] shadow-sm self-start">
                  <Calendar className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                  <span>4 oktabr 2026</span>
                  <ChevronDown className="w-3 h-3 text-[#566A63] dark:text-[#8B9E95]" />
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
                      {dashboardData ? Number(dashboardData.netSales).toLocaleString('uz-UZ') : '1 280 000'} so‘m
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#116B50] dark:text-[#4ADE80] font-semibold mt-1">
                      <span>↗ +12%</span>
                      <span className="text-[#566A63] dark:text-[#8B9E95] font-normal">Kecha: 1 142 000 so‘m</span>
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
                      {dashboardData ? Number(dashboardData.grossProfit).toLocaleString('uz-UZ') : '286 000'} so‘m
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#116B50] dark:text-[#4ADE80] font-semibold mt-1">
                      <span>↗ +8%</span>
                      <span className="text-[#566A63] dark:text-[#8B9E95] font-normal">Kecha: 265 000 so‘m</span>
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
                      <span>Kam qolgan tovar</span>
                    </div>
                    <div className="text-2xl font-extrabold text-[#172C28] dark:text-[#E8F2EC] mt-3">
                      {dashboardData ? dashboardData.lowStockCount : '3'} ta
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#8A4B08] dark:text-[#FBBF24] font-semibold mt-1">
                      <span>▲ Diqqat talab etadi</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Column Section: Chart + Stock Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: 7-Day Sales Bar Chart (7 cols) */}
                <div className="lg:col-span-7 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-[#172C28] dark:text-[#E8F2EC]">Sotuvlar</h2>
                    <button className="flex items-center gap-1.5 text-xs text-[#566A63] dark:text-[#8B9E95] border border-[#DCE5DF] dark:border-[#2A3F36] px-2.5 py-1.5 rounded-lg">
                      <span>So‘nggi 7 kun</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Visual Bar Chart */}
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

                {/* Right: Stock Alerts ("Qoldiqni tekshiring", 5 cols) */}
                <div className="lg:col-span-5 bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-[#172C28] dark:text-[#E8F2EC]">Qoldiqni tekshiring</h2>
                    <button
                      onClick={() => setActiveTab('stock')}
                      className="text-xs text-[#116B50] dark:text-[#4ADE80] font-semibold flex items-center gap-1 hover:underline"
                    >
                      Barchasini ko‘rish <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAF9] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36]">
                      <div>
                        <h4 className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]">Twix 50 g</h4>
                        <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">Shokolad</span>
                      </div>
                      <Tag variant="error">! Tugagan</Tag>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAF9] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36]">
                      <div>
                        <h4 className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]">Snickers 80 g</h4>
                        <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">Shokolad</span>
                      </div>
                      <Tag variant="warn">▲ 6 dona</Tag>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAF9] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36]">
                      <div>
                        <h4 className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]">Bounty 57 g</h4>
                        <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">Shokolad</span>
                      </div>
                      <Tag variant="gray">ℹ Ma’lumot eski</Tag>
                    </div>
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
                        <th className="py-3 px-4 font-semibold">Tur</th>
                        <th className="py-3 px-4 font-semibold">Tovar / Tavsif</th>
                        <th className="py-3 px-4 font-semibold">Miqdor</th>
                        <th className="py-3 px-4 font-semibold">Narx</th>
                        <th className="py-3 px-4 font-semibold">Jami</th>
                        <th className="py-3 px-4 font-semibold">Mas’ul</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                      {recentDocs.length > 0 ? (
                        recentDocs.map((doc, idx) => (
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
                              <Tag variant={doc.docType === 'SALE' ? 'default' : 'warn'}>
                                {doc.docType === 'SALE' ? 'Sotuv' : doc.docType === 'RECEIPT' ? 'Kirim' : doc.docType}
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
                            <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95]">Oybek Tursunov</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-[#566A63] dark:text-[#8B9E95]">
                            Hozircha operatsiyalar mavjud emas
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CATALOG / OFFERS TAB */}
          {(activeTab === 'catalog' || activeTab === 'stock') && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-[#E8F2EC]">
                    {activeTab === 'catalog' ? 'Tovarlar katalogi' : 'Qoldiq nazorati'}
                  </h1>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">Filialdagi mavjud tovarlar va narxlar</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsAddProductModalOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Yangi tovar
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setIsImportModalOpen(true)}>
                    <Upload className="w-3.5 h-3.5 mr-1" /> CSV Import
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setIsReceiptModalOpen(true)}>
                    + Kirim qilish
                  </Button>
                </div>
              </div>

              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                  <thead>
                    <tr className="border-b border-[#DCE5DF] dark:border-[#22332C] text-[#566A63] dark:text-[#8B9E95] bg-[#F9FAF9] dark:bg-[#1A2822]">
                      <th className="py-3 px-4 font-semibold">Mahsulot</th>
                      <th className="py-3 px-4 font-semibold">Shtrix-kod</th>
                      <th className="py-3 px-4 font-semibold">Chakana narx</th>
                      <th className="py-3 px-4 font-semibold">Qoldiq</th>
                      <th className="py-3 px-4 font-semibold">Yangilangan</th>
                      <th className="py-3 px-4 font-semibold">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF] dark:divide-[#22332C]">
                    {offers.map((off) => (
                      <tr key={off.id} className="hover:bg-[#F3F6F3]/50 dark:hover:bg-[#1A2822]/50">
                        <td className="py-3 px-4">
                          <strong className="block text-sm text-[#172C28] dark:text-[#E8F2EC]">{off.variant.title}</strong>
                          <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                            {off.variant.brand} · {off.variant.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95]">{off.variant.barcode || '—'}</td>
                        <td className="py-3 px-4 font-bold text-[#116B50] dark:text-[#4ADE80]">
                          {Number(off.price).toLocaleString('uz-UZ')} so‘m
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          <Tag variant={off.stockOnHand > 10 ? 'default' : off.stockOnHand > 0 ? 'warn' : 'error'}>
                            {off.stockOnHand} {off.variant.packUnit}
                          </Tag>
                        </td>
                        <td className="py-3 px-4 text-[#566A63] dark:text-[#8B9E95]">
                          {off.freshness === 'NEW' ? '10 daqiqa oldin' : '2 kun oldin'}
                        </td>
                        <td className="py-3 px-4">
                          <Tag variant={off.status === 'ACTIVE' ? 'default' : 'error'}>
                            {off.status === 'ACTIVE' ? 'Sotuvda' : 'Tugagan'}
                          </Tag>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ORGANIZATION & SETTINGS TAB */}
          {(activeTab === 'organization' || activeTab === 'settings') && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              {/* Header */}
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

              {/* 1. Organization Details Form */}
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
                      <img
                        src={orgInfo.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
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
                            if (file.size > 5 * 1024 * 1024) {
                              showToast('Rasm hajmi 5MB dan oshmasligi kerak');
                              return;
                            }
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
                        Kompyuterdan rasm tanlash
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

                  {/* Form Fields (2 cols) */}
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Do‘kon / Savdo nomi *</label>
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
                        placeholder="304892110"
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
                        placeholder="+998 71 200 11 22"
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
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Do‘kon tavsifi</label>
                      <textarea
                        rows={2}
                        value={orgInfo.description}
                        onChange={(e) => setOrgInfo({ ...orgInfo, description: e.target.value })}
                        className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Branches & Addresses Section */}
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

              {/* 3. Weekly Working Hours Schedule */}
              <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#DCE5DF] dark:border-[#22332C] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#172C28] dark:text-[#E8F2EC]">Haftalik ish tartibi</h3>
                      <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">Har bir kun bo‘yicha ochilish va yopilish vaqtlari</p>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => showToast('Ish tartibi saqlandi!')}>
                    <Save className="w-3.5 h-3.5 mr-1" /> Saqlash
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {weeklySchedule.map((s, idx) => (
                    <div
                      key={s.day}
                      className="p-3 rounded-xl bg-[#F9FAF9] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col gap-2 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-[#172C28] dark:text-[#E8F2EC]">
                        <span>{s.day}</span>
                        <label className="flex items-center gap-1 text-[11px] font-normal text-[#566A63] dark:text-[#8B9E95] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={s.isDayOff}
                            onChange={(e) => {
                              const updated = [...weeklySchedule];
                              updated[idx].isDayOff = e.target.checked;
                              setWeeklySchedule(updated);
                            }}
                            className="accent-[#116B50]"
                          />
                          Dam olish
                        </label>
                      </div>

                      {!s.isDayOff ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={s.open}
                            onChange={(e) => {
                              const updated = [...weeklySchedule];
                              updated[idx].open = e.target.value;
                              setWeeklySchedule(updated);
                            }}
                            className="flex-1 p-1 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded text-xs text-[#172C28] dark:text-[#E8F2EC]"
                          />
                          <span className="text-[#566A63] dark:text-[#8B9E95]">-</span>
                          <input
                            type="time"
                            value={s.close}
                            onChange={(e) => {
                              const updated = [...weeklySchedule];
                              updated[idx].close = e.target.value;
                              setWeeklySchedule(updated);
                            }}
                            className="flex-1 p-1 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded text-xs text-[#172C28] dark:text-[#E8F2EC]"
                          />
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-[#8A4B08] dark:text-[#FBBF24] py-1 text-center">
                          Dam olish kuni
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-[#E8F2EC]">
                    Moliyaviy hisobotlar
                  </h1>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Kiritilgan operatsiyalar asosidagi yalpi foyda va sof natija
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

          {/* INBOX TAB */}
          {activeTab === 'inbox' && (
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28] dark:text-[#E8F2EC]">
                Administrator so‘rovlari va xabarlar
              </h1>

              <div className="flex flex-col gap-4">
                {corrections.map((cor) => (
                  <div
                    key={cor.id}
                    className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-6 shadow-sm flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8A4B08] dark:text-[#FBBF24] bg-[#FFF2DC] dark:bg-[#382613] px-2.5 py-0.5 rounded-md">
                        COR-{cor.id.slice(0, 6)}
                      </span>
                      <Tag variant={cor.status === 'OPEN' ? 'warn' : 'default'}>
                        {cor.status === 'OPEN' ? 'Javob kutilmoqda' : cor.status}
                      </Tag>
                    </div>

                    <h3 className="font-bold text-base text-[#172C28] dark:text-[#E8F2EC]">{cor.message}</h3>
                    <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
                      Muddat: {cor.deadline} · Ta’sir ko‘rsatuvchi maydonlar: {cor.affectedFields.join(', ')}
                    </p>

                    {cor.merchantResponse && (
                      <div className="bg-[#E7F3EB] dark:bg-[#1C362A] p-3 rounded-xl text-xs text-[#116B50] dark:text-[#4ADE80]">
                        <strong>Sizning javobingiz:</strong> {cor.merchantResponse}
                      </div>
                    )}

                    {cor.status === 'OPEN' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedCorrection(cor);
                          setIsInboxModalOpen(true);
                        }}
                      >
                        Javob berish va tuzatish
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* SALE MODAL (+ Sotuv) */}
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
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Mahsulot</label>
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
                  {o.variant.title} (Qoldiq: {o.stockOnHand} dona)
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
          <div className="bg-[#F9FAF9] dark:bg-[#1A2822] p-3 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] flex justify-between items-center text-sm">
            <span className="font-medium text-[#566A63] dark:text-[#8B9E95]">Jami kassa summasi:</span>
            <strong className="text-base text-[#116B50] dark:text-[#4ADE80]">
              {(parseFloat(formQuantity || '0') * parseFloat(formPrice || '0')).toLocaleString('uz-UZ')} so‘m
            </strong>
          </div>
        </div>
      </Modal>

      {/* RECEIPT MODAL (+ Kirim) */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Yangi tovar kirimi"
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
            <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Mahsulot</label>
            <select
              value={formVariantId}
              onChange={(e) => setFormVariantId(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
            >
              {offers.map((o) => (
                <option key={o.variantId} value={o.variantId} className="dark:bg-[#16241E]">
                  {o.variant.title}
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
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Kirim tannarxi (so‘m)</label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC] rounded-xl text-sm"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* CSV IMPORT MODAL */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="CSV orqali tovar yuklash"
        footer={
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              showToast('CSV fayl tekshirildi va 5 ta mahsulot muvaffaqiyatli import qilindi');
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

      {/* ADD PRODUCT MODAL (+ Yangi tovar) */}
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
          {/* Product Image Preview & Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36]">
            <img
              src={newProd.imageUrl}
              alt="Preview"
              className="w-20 h-20 rounded-xl object-cover border border-[#DCE5DF] dark:border-[#2A3F36] shrink-0 bg-white dark:bg-[#16241E]"
            />
            <div className="flex-1 w-full flex flex-col gap-2">
              <input
                id="product-file-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      showToast('Rasm hajmi 5MB dan oshmasligi kerak');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') {
                        setNewProd({ ...newProd, imageUrl: reader.result });
                        showToast('Mahsulot rasmi fayldan yuklandi!');
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="product-file-input"
                className="py-1.5 px-3 bg-white dark:bg-[#16241E] hover:bg-[#EDF5F0] dark:hover:bg-[#1E362A] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs font-semibold text-[#116B50] dark:text-[#4ADE80] cursor-pointer flex items-center justify-center gap-1.5 transition text-center"
              >
                <Upload className="w-3.5 h-3.5" />
                Kompyuterdan rasm yuklash
              </label>

              <div>
                <label className="text-[11px] font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">
                  yoki Rasm URL manzili
                </label>
                <input
                  type="text"
                  value={newProd.imageUrl}
                  onChange={(e) => setNewProd({ ...newProd, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
                />
              </div>
            </div>
          </div>

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
              <label className="text-xs font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-1">Brend / Ishlab chiqaruvchi</label>
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

      {/* ADD BRANCH MODAL (+ Yangi filial) */}
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

          <div className="p-3 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36]">
            <span className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] block mb-2">
              📍 Karta koordinatalari (Xaritada ko‘rsatish uchun)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-0.5">Kenglik (Latitude)</label>
                <input
                  type="text"
                  value={newBranch.lat}
                  onChange={(e) => setNewBranch({ ...newBranch, lat: e.target.value })}
                  placeholder="41.311081"
                  className="w-full p-2 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-lg text-xs font-mono text-[#172C28] dark:text-[#E8F2EC]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#566A63] dark:text-[#8B9E95] block mb-0.5">Uzunlik (Longitude)</label>
                <input
                  type="text"
                  value={newBranch.lng}
                  onChange={(e) => setNewBranch({ ...newBranch, lng: e.target.value })}
                  placeholder="69.240562"
                  className="w-full p-2 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-lg text-xs font-mono text-[#172C28] dark:text-[#E8F2EC]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#172C28] dark:text-[#E8F2EC] cursor-pointer">
              <input
                type="checkbox"
                checked={newBranch.is24_7}
                onChange={(e) => setNewBranch({ ...newBranch, is24_7: e.target.checked })}
                className="accent-[#116B50]"
              />
              24/7 Kechayu-kunduz ishlaydi
            </label>
            {!newBranch.is24_7 && (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="time"
                  value={newBranch.openTime}
                  onChange={(e) => setNewBranch({ ...newBranch, openTime: e.target.value })}
                  className="p-1.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded text-xs text-[#172C28] dark:text-[#E8F2EC]"
                />
                <span className="text-[#566A63]">-</span>
                <input
                  type="time"
                  value={newBranch.closeTime}
                  onChange={(e) => setNewBranch({ ...newBranch, closeTime: e.target.value })}
                  className="p-1.5 bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] rounded text-xs text-[#172C28] dark:text-[#E8F2EC]"
                />
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
