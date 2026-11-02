import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Store as StoreIcon,
  Package,
  Navigation,
  Sparkles,
  Share2,
  Heart,
  CheckCircle,
  Clock,
  Phone,
  ShieldCheck,
  ChevronRight,
  ShoppingBag,
  ExternalLink,
  Layers,
  AlertCircle
} from 'lucide-react';
import { apiUrl } from '../config/api';

export interface AlternativeProduct {
  id: string;
  productId: string;
  title: string;
  brand: string;
  category: string;
  packSize?: string;
  packUnit: string;
  barcode?: string;
  sku?: string;
  imageUrl: string;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  availableStoresCount: number;
  stores?: any[];
}

export interface ProductDetailStore {
  offerId: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  storeDistrict: string;
  storePhone?: string;
  storeType: string;
  storeRating: number;
  location: { lat: number; lng: number };
  price: number;
  stockOnHand: number;
  wholesaleTiers?: any[];
  distanceM: number;
  isOpenNow: boolean;
  stockVerifiedAt?: string | null;
}

export interface DetailedProduct {
  id: string;
  productId: string;
  title: string;
  brand: string;
  category: string;
  packSize?: string;
  packUnit: string;
  barcode?: string;
  sku?: string;
  imageUrl: string;
  minPrice: number;
  maxPrice: number;
  originalPrice: number;
  discountPercent: number;
  totalStock: number;
  availableStoresCount: number;
  stores: ProductDetailStore[];
  similarProducts?: AlternativeProduct[];
}

interface ProductDetailPageViewProps {
  productParam: string; // id, slug, or barcode
  userLocation: { lat: number; lng: number };
  onBack: () => void;
  onShowStoresOnMap: (product: DetailedProduct, targetStoreId?: string) => void;
  onNavigateToStore?: (storeLocation: { lat: number; lng: number }, storeName: string) => void;
  onOpenStorePage?: (storeId: string, storeLocation?: { lat: number; lng: number }, storeName?: string) => void;
  onSelectAlternativeProduct?: (altProduct: AlternativeProduct) => void;
  isDarkMode?: boolean;
}

export const ProductDetailPageView: React.FC<ProductDetailPageViewProps> = ({
  productParam,
  userLocation,
  onBack,
  onShowStoresOnMap,
  onNavigateToStore,
  onOpenStorePage,
  onSelectAlternativeProduct,
  isDarkMode = false
}) => {
  const [product, setProduct] = useState<DetailedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          apiUrl(`/api/v1/products/${encodeURIComponent(productParam)}?lat=${userLocation.lat}&lng=${userLocation.lng}`)
        );
        if (!res.ok) throw new Error('Mahsulot ma‘lumotlari topilmadi');
        const data = await res.json();
        if (isMounted) {
          setProduct(data.product);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Xatolik yuz berdi');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProduct();
    return () => { isMounted = false; };
  }, [productParam, userLocation.lat, userLocation.lng]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[70vh] bg-[#F8FAF9] dark:bg-[#0E1713]">
        <div className="w-10 h-10 border-3 border-[#116B50] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-semibold text-[#566A63] dark:text-[#8B9E95]">
          Mahsulot ma‘lumotlari yuklanmoqda...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[70vh] bg-[#F8FAF9] dark:bg-[#0E1713] p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 text-2xl">
          ⚠️
        </div>
        <h2 className="text-lg font-black text-[#172C28] dark:text-[#E8F2EC] mb-2">
          {error || 'Mahsulot topilmadi'}
        </h2>
        <p className="text-xs sm:text-sm text-[#566A63] dark:text-[#8B9E95] max-w-md mb-6">
          Qidirilayotgan tovar ma’lumotlar bazasida mavjud emas yoki nomi o‘zgargan bo‘lishi mumkin
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-[#116B50] text-white text-xs font-bold hover:bg-[#0D523D] transition flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Orqaga qaytish</span>
        </button>
      </div>
    );
  }

  const formattedMinPrice = product.minPrice > 0 ? `${product.minPrice.toLocaleString('uz-UZ')} so‘m` : 'Mavjud emas';
  const formattedOriginalPrice = product.originalPrice > product.minPrice
    ? `${product.originalPrice.toLocaleString('uz-UZ')} so‘m`
    : null;

  return (
    <div className="w-full flex-1 flex flex-col bg-[#F8FAF9] dark:bg-[#0E1713] min-h-[calc(100vh-64px)] pb-24">
      {/* Top Bar with Back and Share */}
      <div className="bg-white dark:bg-[#14201A] border-b border-[#DCE5DF] dark:border-[#22332C] sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#172C28] dark:text-[#E8F2EC] hover:text-[#116B50] dark:hover:text-[#4ADE80] transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Xaritaga qaytish</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F3F6F3] dark:bg-[#1A2822] text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#E0EFE7] dark:hover:bg-[#23382F] transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isCopied ? 'Havola nusxalandi!' : 'Ulashish'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* SECTION 1: Product Hero Card */}
        <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-5 sm:p-7 shadow-xs">
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
            {/* Image on Left */}
            <div className="w-full md:w-80 h-72 sm:h-84 rounded-2xl bg-[#F3F6F3] dark:bg-[#1A2822] overflow-hidden shrink-0 border border-[#DCE5DF] dark:border-[#273B32] relative flex items-center justify-center">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80';
                }}
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                <span className="px-2.5 py-1 rounded-lg bg-[#E11D48] text-white text-[11px] font-black shadow-xs flex items-center gap-1">
                  <span>⚡</span>
                  <span>Vau-narx</span>
                </span>
                {product.discountPercent > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold">
                    -{product.discountPercent}% chegirma
                  </span>
                )}
              </div>
            </div>

            {/* Product Details on Right */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] text-xs font-black uppercase tracking-wider">
                    {product.category}
                  </span>
                  <span className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95]">
                    Brend: <strong className="text-[#172C28] dark:text-[#E8F2EC]">{product.brand}</strong>
                  </span>
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95]">•</span>
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-mono">
                    SKU: {product.sku || 'ORIGINAL'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-[#172C28] dark:text-[#E8F2EC] tracking-tight">
                  {product.title}
                </h1>

                {/* Price block */}
                <div className="mt-4 p-4 rounded-2xl bg-[#F8FAF9] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#273B32]">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#566A63] dark:text-[#8B9E95]">
                    Eng hamyonbop narx:
                  </div>
                  <div className="flex items-baseline gap-3 mt-1 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-black text-[#E11D48] dark:text-[#FB7185]">
                      {formattedMinPrice}
                    </span>
                    {formattedOriginalPrice && (
                      <span className="text-sm sm:text-base line-through text-[#8B9E95]">
                        {formattedOriginalPrice}
                      </span>
                    )}
                    {product.maxPrice > product.minPrice && (
                      <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">
                        (do‘konlar bo‘yicha {product.maxPrice.toLocaleString('uz-UZ')} so‘mgacha)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#DCE5DF]/60 dark:border-[#273B32] text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#116B50] dark:text-[#4ADE80]">
                      <StoreIcon className="w-4 h-4" />
                      <span>{product.availableStoresCount} ta do‘konda bor</span>
                    </div>
                    <span>•</span>
                    <div className="text-[#566A63] dark:text-[#8B9E95]">
                      Jami qoldiq: <strong className="text-[#172C28] dark:text-[#E8F2EC]">{product.totalStock} {product.packUnit}</strong>
                    </div>
                  </div>
                </div>

                {/* Characteristics */}
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#273B32]">
                    <span className="text-[10px] text-[#8B9E95] block">Qadoq hajmi</span>
                    <span className="font-bold text-[#172C28] dark:text-[#E8F2EC]">
                      {product.packSize || product.packUnit}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#273B32]">
                    <span className="text-[10px] text-[#8B9E95] block">Birlik</span>
                    <span className="font-bold text-[#172C28] dark:text-[#E8F2EC]">
                      1 {product.packUnit}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#273B32]">
                    <span className="text-[10px] text-[#8B9E95] block">Shtrix kodi</span>
                    <span className="font-mono font-bold text-[#172C28] dark:text-[#E8F2EC] truncate block">
                      {product.barcode || '—'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#273B32]">
                    <span className="text-[10px] text-[#8B9E95] block">Sifat kafolati</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Original</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Main CTA: Show stores on map */}
              <div className="mt-6 pt-4 border-t border-[#DCE5DF] dark:border-[#22332C] flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => onShowStoresOnMap(product)}
                  disabled={product.availableStoresCount === 0}
                  className="flex-1 py-3 px-5 rounded-2xl bg-[#116B50] hover:bg-[#0D523D] active:scale-98 disabled:bg-gray-400 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Xaritada barcha do‘konlarni ko‘rish ({product.availableStoresCount})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Stores where product is available */}
        <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-5 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <StoreIcon className="w-5 h-5 text-[#116B50] dark:text-[#4ADE80]" />
                <h2 className="text-lg sm:text-xl font-black text-[#172C28] dark:text-[#E8F2EC]">
                  Ushbu tovar sotilayotgan do‘konlar
                </h2>
              </div>
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                Har bir do‘kondagi aniq narx, qoldiq va ish vaqti
              </p>
            </div>

            <button
              onClick={() => onShowStoresOnMap(product)}
              className="text-xs font-bold text-[#116B50] dark:text-[#4ADE80] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Xaritada ko‘rsatish</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {product.stores.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#F8FAF9] dark:bg-[#1A2822] text-[#8B9E95] text-xs font-semibold">
              Hozirda bu tovar hech qaysi faol do‘konda qolmagan
            </div>
          ) : (
            <div className="space-y-3">
              {product.stores.map((store, idx) => (
                <div
                  key={store.storeId + idx}
                  className="p-4 rounded-2xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F8FAF9] dark:bg-[#16241E] hover:border-[#116B50] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm sm:text-base text-[#172C28] dark:text-[#E8F2EC]">
                        {store.storeName}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        store.isOpenNow
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {store.isOpenNow ? '● Ochiq' : '○ Yopiq'}
                      </span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 text-[9px] font-black">
                          🏆 Eng arzon
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 flex items-center gap-2 flex-wrap">
                      <span>📍 {store.storeAddress}</span>
                      {store.distanceM > 0 && (
                        <span className="font-bold text-[#116B50] dark:text-[#4ADE80]">
                          ({store.distanceM >= 1000 ? `${(store.distanceM / 1000).toFixed(1)} km` : `${store.distanceM} m`})
                        </span>
                      )}
                      {store.storePhone && (
                        <span className="text-[#8B9E95]">· {store.storePhone}</span>
                      )}
                    </div>

                    {store.wholesaleTiers && store.wholesaleTiers.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-[#8B9E95]">Optom narx:</span>
                        {store.wholesaleTiers.map((t: any, i: number) => (
                          <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#273B32] text-[#172C28] dark:text-[#E8F2EC]">
                            {t.minQuantity}+ dona: {Number(t.unitPrice).toLocaleString('uz-UZ')} so‘m
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-[#DCE5DF]/60 dark:border-[#273B32]">
                    <div className="text-left sm:text-right">
                      <div className="text-lg font-black text-[#116B50] dark:text-[#4ADE80]">
                        {store.price.toLocaleString('uz-UZ')} so‘m
                      </div>
                      <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                        Qoldiq: <strong className="text-[#172C28] dark:text-[#E8F2EC]">{store.stockOnHand} {product.packUnit}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onShowStoresOnMap(product, store.storeId)}
                        className="px-3 py-1.5 rounded-xl bg-[#116B50] text-white hover:bg-[#0D523D] text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Xaritada</span>
                      </button>

                      {onOpenStorePage && (
                        <button
                          onClick={() => onOpenStorePage(store.storeId, store.location, store.storeName)}
                          title="Do‘kon to‘liq sahifasi"
                          className="px-2.5 py-1.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#14201A] text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#EDF5F0] transition flex items-center gap-1"
                        >
                          <StoreIcon className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Do‘kon</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: Similar & Alternative Products (Huddi shunday alternativ mahsulotlar) */}
        {product.similarProducts && product.similarProducts.length > 0 && (
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-5 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg sm:text-xl font-black text-[#172C28] dark:text-[#E8F2EC]">
                    Huddi shunday alternativ mahsulotlar
                  </h2>
                </div>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                  Siz tanlagan tovar bilan bir xil toifadagi boshqa o‘xshash tovarlar
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3.5 sm:gap-4.5">
              {product.similarProducts.map((alt) => (
                <div
                  key={alt.id}
                  onClick={() => onSelectAlternativeProduct?.(alt)}
                  className="group bg-[#F8FAF9] dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#273B32] hover:border-[#116B50] rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer"
                >
                  <div className="aspect-square w-full bg-white dark:bg-[#14201A] overflow-hidden relative flex items-center justify-center">
                    <img
                      src={alt.imageUrl}
                      alt={alt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-0.5 rounded-md bg-[#116B50] text-white text-[9px] font-black shadow-xs">
                        {alt.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs sm:text-sm font-black text-[#E11D48] dark:text-[#FB7185]">
                        {alt.minPrice > 0 ? `${alt.minPrice.toLocaleString('uz-UZ')} so‘m` : 'Mavjud emas'}
                      </div>
                      <h4 className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] line-clamp-2 mt-1 leading-snug group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] transition-colors">
                        {alt.title}
                      </h4>
                      <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                        🏪 {alt.availableStoresCount} ta do‘konda bor
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAlternativeProduct?.(alt);
                      }}
                      className="mt-3 w-full py-1.5 rounded-xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#273B32] group-hover:bg-[#116B50] group-hover:text-white dark:group-hover:bg-[#4ADE80] dark:group-hover:text-black text-[11px] font-bold transition flex items-center justify-center gap-1"
                    >
                      <span>Tanlash</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
