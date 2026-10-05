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
  X
} from 'lucide-react';
import { Button, Tag, Modal, StarRating } from '@yaqintop/ui';
import { StoreSearchResult, RouteResponse, Offer, Store } from '@yaqintop/contracts';
import { InteractiveMap } from './components/InteractiveMap';

export function CustomerApp() {
  const [userLocation, setUserLocation] = useState({ lat: 41.311081, lng: 69.240562 });
  const [view, setView] = useState<'search' | 'detail' | 'route' | 'saved' | 'profile'>('search');
  const [mobileTab, setMobileTab] = useState<'xarita' | 'royxat'>('xarita');
  const [searchQuery, setSearchQuery] = useState('snikers');
  const [radiusM, setRadiusM] = useState(1000);
  const [openNow, setOpenNow] = useState(false);
  const [inStock, setInStock] = useState(false);
  const [freshOnly, setFreshOnly] = useState(false);
  const [selectedSort, setSelectedSort] = useState<'relevance' | 'distance' | 'price'>('relevance');

  const [results, setResults] = useState<StoreSearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<StoreSearchResult | null>(null);
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [routeMode, setRouteMode] = useState<'walking' | 'driving'>('walking');

  // Modals
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
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

  // Fetch search results from API
  const doSearch = async (loc?: { lat: number; lng: number }) => {
    const targetLoc = loc || userLocation;
    try {
      const res = await fetch('/api/v1/search/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: searchQuery,
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
        if (data.items.length > 0 && !selectedResult) {
          setSelectedResult(data.items[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    doSearch();
  }, [userLocation, radiusM, openNow, inStock, freshOnly, selectedSort]);

  // Fetch route
  const fetchRoute = async (store: Store, mode: 'walking' | 'driving') => {
    try {
      const res = await fetch('/api/v1/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: userLocation,
          destination: store.entranceLocation || store.location,
          mode
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRouteData(data);
        setView('route');
      }
    } catch (err) {
      showToast('Marshrut hisoblashda xatolik yuz berdi');
    }
  };

  const handleSelectStore = (item: StoreSearchResult) => {
    setSelectedResult(item);
  };

  const handleOpenDetail = (item: StoreSearchResult) => {
    setSelectedResult(item);
    setView('detail');
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!selectedResult) return;
    try {
      const res = await fetch(`/api/v1/stores/${selectedResult.store.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
      });
      if (res.ok) {
        showToast('Sharhingiz qabul qilindi!');
        setIsReviewModalOpen(false);
        setReviewComment('');
        doSearch();
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
    if (!selectedResult) return;
    try {
      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedResult.store.id,
          offerId: selectedResult.bestOffer.id,
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
    <div className="min-h-screen flex flex-col bg-[#F3F6F3] text-[#172C28] font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#172C28] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Top Header */}
      <header className="h-[68px] bg-white border-b border-[#DCE5DF] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div
            onClick={() => setView('search')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-8 h-9 bg-[#116B50] rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-sm flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
              Y
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[#172C28]">YaqinTop</span>
          </div>
          <span className="text-xs text-[#566A63] hidden md:inline-block ml-2 border-l border-[#DCE5DF] pl-3">
            Toshkent · Pilot hudud
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="text-sm font-semibold px-4 py-2 rounded-lg border border-[#DCE5DF] bg-white hover:bg-[#EDF5F0] transition"
          >
            Profil
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Left Column / Mobile Results */}
        <section
          className={`w-full md:w-[420px] lg:w-[450px] bg-white border-r border-[#DCE5DF] flex flex-col overflow-y-auto ${
            mobileTab === 'xarita' && view === 'search' ? 'hidden md:flex' : 'flex'
          }`}
          style={{ maxHeight: 'calc(100vh - 68px)' }}
        >
          {view === 'search' && (
            <div className="p-5 flex flex-col gap-4">
              {/* Search Box */}
              <div>
                <span className="text-[11px] font-bold text-[#116B50] uppercase tracking-wider">
                  Yaqiningizdan toping
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-[#172C28] mt-1 mb-3">
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
                      className="w-full h-11 pl-3.5 pr-8 bg-[#F3F6F3] border border-[#DCE5DF] rounded-xl text-sm text-[#172C28] focus:bg-white"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          doSearch();
                        }}
                        className="absolute right-2.5 top-3 text-[#566A63] hover:text-[#172C28]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <Button variant="primary" onClick={() => doSearch()} aria-label="Qidirish">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Radius Control */}
              <div className="bg-[#F9FAF9] p-3.5 rounded-xl border border-[#DCE5DF]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#566A63] font-medium">Qidiruv radiusi:</span>
                  <strong className="text-sm text-[#116B50] font-bold">
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
                  className="w-full accent-[#116B50] cursor-pointer"
                />
                <div className="flex justify-between gap-1 mt-2">
                  {[100, 500, 1000, 3000].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadiusM(r)}
                      className={`text-[11px] px-2.5 py-1 rounded-md border ${
                        radiusM === r
                          ? 'bg-[#116B50] text-white border-[#116B50] font-semibold'
                          : 'bg-white text-[#566A63] border-[#DCE5DF] hover:bg-[#F3F6F3]'
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
                      ? 'bg-[#E0EFE7] text-[#116B50] border-[#116B50]'
                      : 'bg-white text-[#172C28] border-[#DCE5DF]'
                  }`}
                >
                  Hozir ochiq
                </button>
                <button
                  onClick={() => setInStock(!inStock)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition ${
                    inStock
                      ? 'bg-[#E0EFE7] text-[#116B50] border-[#116B50]'
                      : 'bg-white text-[#172C28] border-[#DCE5DF]'
                  }`}
                >
                  Mavjud
                </button>
                <button
                  onClick={() => setFreshOnly(!freshOnly)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition ${
                    freshOnly
                      ? 'bg-[#E0EFE7] text-[#116B50] border-[#116B50]'
                      : 'bg-white text-[#172C28] border-[#DCE5DF]'
                  }`}
                >
                  Faqat yangi
                </button>
                <button
                  onClick={() => setIsFilterModalOpen(true)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#DCE5DF] bg-white text-[#172C28] flex items-center gap-1 hover:bg-[#F3F6F3]"
                >
                  <Filter className="w-3 h-3" /> Filtrlar
                </button>
              </div>

              {/* Result Meta */}
              <div className="flex items-center justify-between text-xs text-[#566A63] border-b border-[#DCE5DF] pb-2">
                <span className="font-semibold text-[#172C28]">
                  {results.length} ta do‘kon topildi
                </span>
                <select
                  value={selectedSort}
                  onChange={(e: any) => setSelectedSort(e.target.value)}
                  className="bg-transparent text-[#116B50] font-semibold text-xs border-none outline-none cursor-pointer"
                >
                  <option value="relevance">Eng mos ▾</option>
                  <option value="distance">Eng yaqin ▾</option>
                  <option value="price">Eng arzon ▾</option>
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
                          ? 'border-2 border-[#116B50] bg-[#F6FBF7] shadow-sm'
                          : 'border-[#DCE5DF] bg-white hover:border-[#116B50]/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-base text-[#172C28]">{item.store.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-[#566A63] mt-0.5">
                            <span className={item.isOpenNow ? 'text-[#116B50] font-semibold' : 'text-[#B42318]'}>
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
                      <div className="my-3 p-3 bg-[#F9FAF9] rounded-xl flex items-center justify-between border border-[#DCE5DF]/60">
                        <div>
                          <span className="text-xs font-semibold text-[#172C28]">
                            {item.bestOffer.variant.title}
                          </span>
                          <div className="text-xl font-extrabold text-[#116B50] mt-0.5">
                            {Number(item.bestOffer.price).toLocaleString('uz-UZ')}{' '}
                            <span className="text-xs font-normal text-[#566A63]">so‘m / {item.bestOffer.variant.packUnit}</span>
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
                          <div className="text-[10px] text-[#566A63] mt-1">
                            {item.bestOffer.freshness === 'NEW'
                              ? '10 daqiqa oldin'
                              : item.bestOffer.freshness === 'STALE'
                              ? '2 kun oldin'
                              : 'Tekshiring'}
                          </div>
                        </div>
                      </div>

                      {item.otherMatchingOfferCount > 0 && (
                        <p className="text-xs text-[#566A63] mb-3">
                          Yana {item.otherMatchingOfferCount} ta mos variant
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-[#DCE5DF]/60">
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
            </div>
          )}

          {/* STORE DETAIL VIEW */}
          {view === 'detail' && selectedResult && (
            <div className="p-5 flex flex-col gap-4">
              <button
                onClick={() => setView('search')}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#116B50] hover:underline"
              >
                <ArrowLeft className="w-4 h-4" /> Natijalarga qaytish
              </button>

              {/* Store Photo Hero */}
              <div className="w-full h-44 rounded-2xl bg-[#E2EEE4] relative flex items-center justify-center overflow-hidden border border-[#DCE5DF]">
                <div className="text-center text-[#496154]">
                  <div className="w-12 h-12 mx-auto bg-white/70 rounded-full flex items-center justify-center text-[#116B50] mb-2 font-bold text-xl">
                    🏪
                  </div>
                  <span className="text-xs font-semibold">{selectedResult.store.name}</span>
                </div>
                <div className="absolute bottom-2.5 right-3 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-full font-medium">
                  1/5
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#172C28]">{selectedResult.store.name}</h2>
                  {selectedResult.store.isVerified && <Tag variant="default">Tasdiqlangan</Tag>}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#566A63] mt-1">
                  <StarRating rating={selectedResult.store.rating} count={selectedResult.store.reviewCount} />
                  <span>·</span>
                  <span>{selectedResult.distanceM} m</span>
                </div>
              </div>

              {/* Store Meta Details */}
              <div className="bg-[#F9FAF9] p-3.5 rounded-xl border border-[#DCE5DF] flex flex-col gap-2 text-xs text-[#172C28]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#116B50]" />
                  <span>
                    <strong className="text-[#116B50]">Ochiq</strong> · bugun 08:00–23:00
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#116B50]" />
                  <span>{selectedResult.store.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#116B50]" />
                  <a href={`tel:${selectedResult.store.phone}`} className="hover:underline font-medium">
                    {selectedResult.store.phone}
                  </a>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => fetchRoute(selectedResult.store, 'walking')}
                >
                  <Navigation className="w-4 h-4 mr-1.5" /> Marshrut
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => showToast('Do‘kon saqlandi')}
                >
                  <Heart className="w-4 h-4 text-[#116B50]" />
                </Button>
              </div>

              {/* Matching Offer in this Store */}
              <div className="border-t border-[#DCE5DF] pt-4">
                <h3 className="text-sm font-bold text-[#172C28] mb-2">Siz izlagan mahsulot</h3>
                <div className="p-3.5 bg-white border border-[#116B50] rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm">{selectedResult.bestOffer.variant.title}</h4>
                    <div className="text-lg font-extrabold text-[#116B50] mt-0.5">
                      {Number(selectedResult.bestOffer.price).toLocaleString('uz-UZ')}{' '}
                      <small className="text-xs font-normal text-[#566A63]">so‘m</small>
                    </div>
                  </div>
                  <Tag variant="default">{selectedResult.bestOffer.stockOnHand} dona</Tag>
                </div>
              </div>

              {/* Similar Products in Same Store */}
              {selectedResult.similarProducts.length > 0 && (
                <div className="border-t border-[#DCE5DF] pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-[#172C28]">Shu do‘kondagi muqobillar</h3>
                    <span className="text-xs text-[#116B50] font-semibold">Barchasi →</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {selectedResult.similarProducts.map((sim) => (
                      <div
                        key={sim.id}
                        className="p-3 bg-white border border-[#DCE5DF] rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-semibold">{sim.variant.title}</span>
                          <div className="text-sm font-bold text-[#116B50]">
                            {Number(sim.price).toLocaleString('uz-UZ')} so‘m
                          </div>
                        </div>
                        <span className="text-xs text-[#566A63]">{sim.stockOnHand} dona</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions: Review & Report */}
              <div className="border-t border-[#DCE5DF] pt-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => setIsReviewModalOpen(true)}
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Sharh yozish
                </Button>
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={() => setIsReportModalOpen(true)}
                >
                  <AlertOctagon className="w-3.5 h-3.5 mr-1" /> Xato haqida xabar
                </Button>
              </div>
            </div>
          )}

          {/* ROUTE VIEW */}
          {view === 'route' && selectedResult && routeData && (
            <div className="p-5 flex flex-col gap-4">
              <button
                onClick={() => setView('detail')}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#116B50] hover:underline"
              >
                <ArrowLeft className="w-4 h-4" /> Do‘konga qaytish
              </button>

              <h1 className="text-2xl font-bold tracking-tight text-[#172C28]">Do‘konga yo‘l</h1>

              {/* Walking / Driving Selector */}
              <div className="flex gap-2 p-1 bg-[#F3F6F3] rounded-xl border border-[#DCE5DF]">
                <button
                  onClick={() => {
                    setRouteMode('walking');
                    fetchRoute(selectedResult.store, 'walking');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    routeMode === 'walking'
                      ? 'bg-[#116B50] text-white shadow-sm'
                      : 'text-[#566A63] hover:text-[#172C28]'
                  }`}
                >
                  🚶 Piyoda
                </button>
                <button
                  onClick={() => {
                    setRouteMode('driving');
                    fetchRoute(selectedResult.store, 'driving');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    routeMode === 'driving'
                      ? 'bg-[#116B50] text-white shadow-sm'
                      : 'text-[#566A63] hover:text-[#172C28]'
                  }`}
                >
                  🚗 Avtomobil
                </button>
              </div>

              {/* Route Summary */}
              <div className="bg-[#E7F2EB] p-4 rounded-2xl border border-[#116B50]/20">
                <span className="text-[11px] font-bold text-[#116B50] uppercase tracking-wider">
                  Marshrut hisobi
                </span>
                <div className="text-3xl font-extrabold text-[#172C28] mt-1">
                  {Math.round(routeData.durationSec / 60)} daqiqa{' '}
                  <span className="text-base font-normal text-[#566A63]">
                    · {routeData.distanceM} m
                  </span>
                </div>
                <div className="text-xs text-[#566A63] mt-1">
                  To‘g‘ri chiziq bo‘yicha {selectedResult.distanceM} m · Taxminiy vaqt
                </div>
              </div>

              {/* Turn-by-Turn Steps */}
              <div className="flex flex-col border border-[#DCE5DF] rounded-2xl bg-white divide-y divide-[#DCE5DF]/60">
                {routeData.steps.map((st, i) => (
                  <div key={i} className="p-3.5 flex items-start gap-3 text-xs text-[#172C28]">
                    <span className="w-5 h-5 rounded-full bg-[#E0EFE7] text-[#116B50] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <span className="font-semibold">{st.instruction}</span>
                      <div className="text-[11px] text-[#566A63] mt-0.5">
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
                  <Button variant="primary" fullWidth>
                    <ExternalLink className="w-4 h-4 mr-2" /> Tashqi xaritada ochish
                  </Button>
                </a>
              )}
            </div>
          )}
        </section>

        {/* Map Section (Desktop right side & Mobile Map view) */}
        <section
          className={`flex-1 relative bg-[#EDF0E6] overflow-hidden min-h-[500px] flex flex-col ${
            mobileTab === 'royxat' && view === 'search' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <InteractiveMap
            userLocation={userLocation}
            radiusM={radiusM}
            results={results}
            selectedResult={selectedResult}
            onSelectStore={handleSelectStore}
            onOpenDetail={handleOpenDetail}
            onNavigate={(item) => fetchRoute(item.store, routeMode)}
            routeData={routeData}
            view={view}
            onLocationChange={(lat, lng) => {
              setUserLocation({ lat, lng });
            }}
            onToast={showToast}
          />

          {/* Mobile Bottom Floating Card */}
          {selectedResult && view === 'search' && (
            <div className="md:hidden absolute bottom-20 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-[#DCE5DF] z-20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#172C28]">{selectedResult.store.name}</h3>
                  <span className="text-xs text-[#566A63]">{selectedResult.bestOffer.variant.title}</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-[#116B50]">
                    {Number(selectedResult.bestOffer.price).toLocaleString('uz-UZ')} so‘m
                  </span>
                  <div className="text-[11px] text-[#566A63]">
                    {selectedResult.bestOffer.stockOnHand} dona · {selectedResult.distanceM} m
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => handleOpenDetail(selectedResult)}
                >
                  Do‘konni ko‘rish
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fetchRoute(selectedResult.store, routeMode)}
                >
                  <Navigation className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Mobile Bottom Navigation (Matching Screenshot) */}
      <nav className="md:hidden h-16 bg-white border-t border-[#DCE5DF] flex items-center justify-around fixed bottom-0 left-0 right-0 z-40">
        <button
          onClick={() => {
            setView('search');
            setMobileTab('xarita');
          }}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold ${
            view === 'search' ? 'text-[#116B50]' : 'text-[#566A63]'
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Qidiruv</span>
        </button>
        <button
          onClick={() => {
            setMobileTab(mobileTab === 'xarita' ? 'royxat' : 'xarita');
          }}
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-[#566A63]"
        >
          <Layers className="w-5 h-5" />
          <span>{mobileTab === 'xarita' ? 'Ro‘yxat' : 'Xarita'}</span>
        </button>
        <button
          onClick={() => showToast('Saqlangan do‘konlar')}
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-[#566A63]"
        >
          <Bookmark className="w-5 h-5" />
          <span>Saqlangan</span>
        </button>
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-[#566A63]"
        >
          <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
            ○
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

      {/* 3. Login Modal */}
      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="Tizimga kirish"
        footer={
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              showToast('Demo xaridor sifatida tizimga kirildi');
              setIsLoginModalOpen(false);
            }}
          >
            Kirish
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-[#566A63] block mb-1">Email</label>
            <input
              type="email"
              defaultValue="customer@yaqintop.uz"
              className="w-full p-2.5 border border-[#DCE5DF] rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#566A63] block mb-1">Parol</label>
            <input
              type="password"
              defaultValue="DemoPass123!"
              className="w-full p-2.5 border border-[#DCE5DF] rounded-xl text-sm"
            />
          </div>
          <p className="text-xs text-[#566A63] mt-2">
            Demo hisob: <code>customer@yaqintop.uz</code> / <code>DemoPass123!</code>
          </p>
        </div>
      </Modal>

      {/* 4. Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Qidiruv filtrlari"
        footer={
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
        }
      >
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={openNow}
              onChange={(e) => setOpenNow(e.target.checked)}
              className="w-4 h-4 accent-[#116B50]"
            />
            Faqat hozir ochiq do‘konlar
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="w-4 h-4 accent-[#116B50]"
            />
            Faqat tovar qoldig‘i mavjud do‘konlar
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={freshOnly}
              onChange={(e) => setFreshOnly(e.target.checked)}
              className="w-4 h-4 accent-[#116B50]"
            />
            Faqat yangi ma’lumot (24 soat ichida tekshirilgan)
          </label>
        </div>
      </Modal>
    </div>
  );
}
