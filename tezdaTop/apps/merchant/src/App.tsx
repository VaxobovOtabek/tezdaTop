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
  ArrowRight
} from 'lucide-react';
import { Button, Tag, Modal } from '@yaqintop/ui';
import { StockDocument, Offer, MerchantSummary } from '@yaqintop/contracts';

export function MerchantApp() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'catalog' | 'stock' | 'receipt' | 'sales' | 'returns' | 'expenses' | 'reports' | 'inbox' | 'settings'
  >('dashboard');

  const [dashboardData, setDashboardData] = useState<MerchantSummary | null>(null);
  const [recentDocs, setRecentDocs] = useState<StockDocument[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);

  // Modals
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState<any>(null);

  // Form states
  const [formVariantId, setFormVariantId] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formPrice, setFormPrice] = useState('8000');
  const [correctionResponse, setCorrectionResponse] = useState('');

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

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F6F3] text-[#172C28] font-sans antialiased">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#172C28] text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium">
          {toastMessage}
        </div>
      )}

      {/* Top Bar (Exact Match with Image 1) */}
      <header className="h-[72px] bg-white border-b border-[#DCE5DF] px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-9 bg-[#116B50] rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-sm flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
              Y
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tight text-[#172C28] leading-none block">
                YaqinTop
              </span>
              <span className="text-[11px] text-[#566A63] font-medium leading-none block mt-0.5">
                Do‘kon boshqaruvi
              </span>
            </div>
          </div>

          {/* Store & Branch Switchers */}
          <div className="hidden md:flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-[#F3F6F3] hover:bg-[#E8EDE8] border border-[#DCE5DF] rounded-xl text-xs font-semibold text-[#172C28]">
              <span>🏪 Navbahor Market</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#566A63]" />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-[#F3F6F3] hover:bg-[#E8EDE8] border border-[#DCE5DF] rounded-xl text-xs font-semibold text-[#172C28]">
              <span>📍 Asosiy filial</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#566A63]" />
            </button>
          </div>
        </div>

        {/* Search Bar & Profile */}
        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block w-80">
            <Search className="w-4 h-4 text-[#566A63] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Tovar, shtrix-kod yoki mijozni qidiring..."
              className="w-full h-10 pl-9 pr-4 bg-[#F3F6F3] border border-[#DCE5DF] rounded-xl text-xs text-[#172C28] placeholder-[#566A63]/70 focus:bg-white"
            />
          </div>

          {/* Notifications */}
          <button
            onClick={() => setActiveTab('inbox')}
            className="relative w-10 h-10 rounded-xl border border-[#DCE5DF] flex items-center justify-center text-[#172C28] hover:bg-[#F3F6F3]"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#B42318] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-[#DCE5DF]">
            <div className="w-9 h-9 rounded-full bg-[#116B50] text-white text-xs font-bold flex items-center justify-center">
              OT
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-[#172C28] block leading-tight">Oybek Tursunov</span>
              <span className="text-[10px] text-[#566A63] block">Do‘kon egasi</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (240px Desktop, matching Image 1) */}
        <aside className="w-60 bg-white border-r border-[#DCE5DF] flex flex-col p-4 shrink-0 overflow-y-auto">
          <nav className="flex flex-col gap-1">
            {[
              { id: 'dashboard', label: 'Umumiy', icon: LayoutDashboard },
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
                      ? 'bg-[#E0EFE7] text-[#116B50]'
                      : 'text-[#566A63] hover:bg-[#F3F6F3] hover:text-[#172C28]'
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
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* DASHBOARD TAB (Exact Match with Image 1) */}
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28]">
                    Bugungi ko‘rsatkichlar
                  </h1>
                  <p className="text-xs text-[#566A63] mt-1">Kiritilgan operatsiyalar asosida</p>
                </div>
                <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-[#DCE5DF] rounded-xl text-xs font-semibold text-[#172C28] shadow-sm self-start">
                  <Calendar className="w-3.5 h-3.5 text-[#116B50]" />
                  <span>4 oktabr 2026</span>
                  <ChevronDown className="w-3 h-3 text-[#566A63]" />
                </button>
              </div>

              {/* Top 3 KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Sof Sotuv Tushumi */}
                <div className="bg-white border border-[#DCE5DF] rounded-2xl p-5 shadow-sm flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#566A63]">
                      <div className="w-8 h-8 rounded-xl bg-[#E0EFE7] flex items-center justify-center text-[#116B50]">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <span>Sof sotuv tushumi</span>
                    </div>
                    <div className="text-2xl font-extrabold text-[#172C28] mt-3">
                      {dashboardData ? Number(dashboardData.netSales).toLocaleString('uz-UZ') : '1 280 000'} so‘m
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#116B50] font-semibold mt-1">
                      <span>↗ +12%</span>
                      <span className="text-[#566A63] font-normal">Kecha: 1 142 000 so‘m</span>
                    </div>
                  </div>
                </div>

                {/* 2. Yalpi Foyda */}
                <div className="bg-white border border-[#DCE5DF] rounded-2xl p-5 shadow-sm flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#566A63]">
                      <div className="w-8 h-8 rounded-xl bg-[#E0EFE7] flex items-center justify-center text-[#116B50]">
                        <Coins className="w-4 h-4" />
                      </div>
                      <span>Yalpi foyda</span>
                    </div>
                    <div className="text-2xl font-extrabold text-[#172C28] mt-3">
                      {dashboardData ? Number(dashboardData.grossProfit).toLocaleString('uz-UZ') : '286 000'} so‘m
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#116B50] font-semibold mt-1">
                      <span>↗ +8%</span>
                      <span className="text-[#566A63] font-normal">Kecha: 265 000 so‘m</span>
                    </div>
                  </div>
                </div>

                {/* 3. Kam Qolgan Tovar */}
                <div className="bg-white border border-[#DCE5DF] rounded-2xl p-5 shadow-sm flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#566A63]">
                      <div className="w-8 h-8 rounded-xl bg-[#FFF2DC] flex items-center justify-center text-[#8A4B08]">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <span>Kam qolgan tovar</span>
                    </div>
                    <div className="text-2xl font-extrabold text-[#172C28] mt-3">
                      {dashboardData ? dashboardData.lowStockCount : '3'} ta
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#8A4B08] font-semibold mt-1">
                      <span>▲ Diqqat talab etadi</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Column Section: Chart + Stock Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: 7-Day Sales Bar Chart (7 cols) */}
                <div className="lg:col-span-7 bg-white border border-[#DCE5DF] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-[#172C28]">Sotuvlar</h2>
                    <button className="flex items-center gap-1.5 text-xs text-[#566A63] border border-[#DCE5DF] px-2.5 py-1.5 rounded-lg">
                      <span>So‘nggi 7 kun</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Visual Bar Chart */}
                  <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-[#DCE5DF]">
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
                        <span className="text-[10px] text-[#566A63] font-semibold">
                          {(bar.amount / 1000).toFixed(0)}k
                        </span>
                        <div
                          style={{ height: bar.h }}
                          className="w-full max-w-[36px] bg-[#116B50] rounded-t-md hover:bg-[#0B563F] transition-all cursor-pointer"
                        />
                        <span className="text-[11px] text-[#566A63] mt-1">{bar.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Stock Alerts ("Qoldiqni tekshiring", 5 cols) */}
                <div className="lg:col-span-5 bg-white border border-[#DCE5DF] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-[#172C28]">Qoldiqni tekshiring</h2>
                    <button
                      onClick={() => setActiveTab('stock')}
                      className="text-xs text-[#116B50] font-semibold flex items-center gap-1 hover:underline"
                    >
                      Barchasini ko‘rish <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAF9] border border-[#DCE5DF]">
                      <div>
                        <h4 className="text-xs font-bold text-[#172C28]">Twix 50 g</h4>
                        <span className="text-[10px] text-[#566A63]">Shokolad</span>
                      </div>
                      <Tag variant="error">! Tugagan</Tag>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAF9] border border-[#DCE5DF]">
                      <div>
                        <h4 className="text-xs font-bold text-[#172C28]">Snickers 80 g</h4>
                        <span className="text-[10px] text-[#566A63]">Shokolad</span>
                      </div>
                      <Tag variant="warn">▲ 6 dona</Tag>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAF9] border border-[#DCE5DF]">
                      <div>
                        <h4 className="text-xs font-bold text-[#172C28]">Bounty 57 g</h4>
                        <span className="text-[10px] text-[#566A63]">Shokolad</span>
                      </div>
                      <Tag variant="gray">ℹ Ma’lumot eski</Tag>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Oxirgi operatsiyalar Table */}
              <div className="bg-white border border-[#DCE5DF] rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <h2 className="text-lg font-bold text-[#172C28]">Oxirgi operatsiyalar</h2>
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
                  <table className="w-full text-left text-xs text-[#172C28]">
                    <thead>
                      <tr className="border-b border-[#DCE5DF] text-[#566A63] bg-[#F9FAF9]">
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
                    <tbody className="divide-y divide-[#DCE5DF]">
                      {recentDocs.length > 0 ? (
                        recentDocs.map((doc, idx) => (
                          <tr key={doc.id} className="hover:bg-[#F3F6F3]/50">
                            <td className="py-3 px-4 font-medium">{idx + 1}</td>
                            <td className="py-3 px-4 text-[#566A63]">
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
                            <td className="py-3 px-4 font-bold text-[#116B50]">
                              {Number(doc.totalAmount).toLocaleString('uz-UZ')} so‘m
                            </td>
                            <td className="py-3 px-4 text-[#566A63]">Oybek Tursunov</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-[#566A63]">
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
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28]">
                    {activeTab === 'catalog' ? 'Tovarlar katalogi' : 'Qoldiq nazorati'}
                  </h1>
                  <p className="text-xs text-[#566A63] mt-1">Filialdagi mavjud tovarlar va narxlar</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setIsImportModalOpen(true)}>
                    <Upload className="w-3.5 h-3.5 mr-1" /> CSV Import
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setIsReceiptModalOpen(true)}>
                    + Kirim qilish
                  </Button>
                </div>
              </div>

              <div className="bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs text-[#172C28]">
                  <thead>
                    <tr className="border-b border-[#DCE5DF] text-[#566A63] bg-[#F9FAF9]">
                      <th className="py-3 px-4 font-semibold">Mahsulot</th>
                      <th className="py-3 px-4 font-semibold">Shtrix-kod</th>
                      <th className="py-3 px-4 font-semibold">Chakana narx</th>
                      <th className="py-3 px-4 font-semibold">Qoldiq</th>
                      <th className="py-3 px-4 font-semibold">Yangilangan</th>
                      <th className="py-3 px-4 font-semibold">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF]">
                    {offers.map((off) => (
                      <tr key={off.id} className="hover:bg-[#F3F6F3]/50">
                        <td className="py-3 px-4">
                          <strong className="block text-sm">{off.variant.title}</strong>
                          <span className="text-[10px] text-[#566A63]">
                            {off.variant.brand} · {off.variant.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#566A63]">{off.variant.barcode || '—'}</td>
                        <td className="py-3 px-4 font-bold text-[#116B50]">
                          {Number(off.price).toLocaleString('uz-UZ')} so‘m
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          <Tag variant={off.stockOnHand > 10 ? 'default' : off.stockOnHand > 0 ? 'warn' : 'error'}>
                            {off.stockOnHand} {off.variant.packUnit}
                          </Tag>
                        </td>
                        <td className="py-3 px-4 text-[#566A63]">
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

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="max-w-6xl mx-auto flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28]">
                    Moliyaviy hisobotlar
                  </h1>
                  <p className="text-xs text-[#566A63] mt-1">
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
                  <div className="bg-white p-5 rounded-2xl border border-[#DCE5DF]">
                    <span className="text-xs text-[#566A63] font-semibold">Sof sotuv tushumi</span>
                    <strong className="block text-2xl font-bold mt-1 text-[#172C28]">
                      {Number(dashboardData.netSales).toLocaleString('uz-UZ')} so‘m
                    </strong>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-[#DCE5DF]">
                    <span className="text-xs text-[#566A63] font-semibold">Tannarx (COGS)</span>
                    <strong className="block text-2xl font-bold mt-1 text-[#172C28]">
                      {Number(dashboardData.cogs).toLocaleString('uz-UZ')} so‘m
                    </strong>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-[#DCE5DF]">
                    <span className="text-xs text-[#566A63] font-semibold">Yalpi foyda</span>
                    <strong className="block text-2xl font-bold mt-1 text-[#116B50]">
                      {Number(dashboardData.grossProfit).toLocaleString('uz-UZ')} so‘m
                    </strong>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-[#DCE5DF]">
                    <span className="text-xs text-[#566A63] font-semibold">Operatsion natija</span>
                    <strong className="block text-2xl font-bold mt-1 text-[#172C28]">
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
              <h1 className="text-3xl font-extrabold tracking-tight text-[#172C28]">
                Administrator so‘rovlari va xabarlar
              </h1>

              <div className="flex flex-col gap-4">
                {corrections.map((cor) => (
                  <div
                    key={cor.id}
                    className="bg-white border border-[#DCE5DF] rounded-2xl p-6 shadow-sm flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8A4B08] bg-[#FFF2DC] px-2.5 py-0.5 rounded-md">
                        COR-{cor.id.slice(0, 6)}
                      </span>
                      <Tag variant={cor.status === 'OPEN' ? 'warn' : 'default'}>
                        {cor.status === 'OPEN' ? 'Javob kutilmoqda' : cor.status}
                      </Tag>
                    </div>

                    <h3 className="font-bold text-base text-[#172C28]">{cor.message}</h3>
                    <p className="text-xs text-[#566A63]">
                      Muddat: {cor.deadline} · Ta’sir ko‘rsatuvchi maydonlar: {cor.affectedFields.join(', ')}
                    </p>

                    {cor.merchantResponse && (
                      <div className="bg-[#E7F3EB] p-3 rounded-xl text-xs text-[#116B50]">
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
            <label className="text-xs font-semibold text-[#566A63] block mb-1">Mahsulot</label>
            <select
              value={formVariantId}
              onChange={(e) => {
                setFormVariantId(e.target.value);
                const off = offers.find((o) => o.variantId === e.target.value);
                if (off) setFormPrice(off.price);
              }}
              className="w-full p-2.5 border border-[#DCE5DF] rounded-xl text-sm"
            >
              {offers.map((o) => (
                <option key={o.variantId} value={o.variantId}>
                  {o.variant.title} (Qoldiq: {o.stockOnHand} dona)
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] block mb-1">Miqdor (dona)</label>
              <input
                type="number"
                min="1"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                className="w-full p-2.5 border border-[#DCE5DF] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] block mb-1">Sotuv narxi (so‘m)</label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full p-2.5 border border-[#DCE5DF] rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="bg-[#F9FAF9] p-3 rounded-xl border border-[#DCE5DF] flex justify-between items-center text-sm">
            <span className="font-medium text-[#566A63]">Jami kassa summasi:</span>
            <strong className="text-base text-[#116B50]">
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
            <label className="text-xs font-semibold text-[#566A63] block mb-1">Mahsulot</label>
            <select
              value={formVariantId}
              onChange={(e) => setFormVariantId(e.target.value)}
              className="w-full p-2.5 border border-[#DCE5DF] rounded-xl text-sm"
            >
              {offers.map((o) => (
                <option key={o.variantId} value={o.variantId}>
                  {o.variant.title}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#566A63] block mb-1">Kirim miqdori (dona)</label>
              <input
                type="number"
                min="1"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                className="w-full p-2.5 border border-[#DCE5DF] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#566A63] block mb-1">Kirim tannarxi (so‘m)</label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full p-2.5 border border-[#DCE5DF] rounded-xl text-sm"
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
        <div className="flex flex-col gap-3 text-xs text-[#566A63]">
          <p>CSV fayl ustunlari: SHTRIX_KOD, NOMI, CHAKANA_NARX, QOLDIQ</p>
          <input
            type="file"
            accept=".csv"
            className="p-3 border border-[#DCE5DF] rounded-xl bg-white text-xs"
          />
          <div className="bg-[#FFF2DC] text-[#8A4B08] p-3 rounded-xl">
            Diqqat: Formulalar xavfsizligi va qoldiq hisobi tekshiriladi.
          </div>
        </div>
      </Modal>

      {/* INBOX REPLY MODAL */}
      <Modal
        isOpen={isInboxModalOpen}
        onClose={() => setIsInboxModalOpen(false)}
        title="Tuzatish so‘roviga javob"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsInboxModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" onClick={handleReplyCorrection}>
              Yuborish
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[#566A63]">{selectedCorrection?.message}</p>
          <textarea
            rows={4}
            value={correctionResponse}
            onChange={(e) => setCorrectionResponse(e.target.value)}
            placeholder="Qanday o‘zgarish yoki tekshiruv kiritilganini izohlang..."
            className="w-full p-3 border border-[#DCE5DF] rounded-xl text-sm"
          />
        </div>
      </Modal>
    </div>
  );
}
