import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Store as StoreIcon, 
  Package, 
  ChevronRight, 
  X, 
  ExternalLink, 
  Navigation, 
  Tag, 
  Filter, 
  Layers,
  Sparkles,
  ShoppingBag,
  TrendingDown
} from 'lucide-react';
import { apiUrl } from '../config/api';

export interface ProductCatalogStore {
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

export interface CatalogProduct {
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
  stores: ProductCatalogStore[];
}

interface ProductsCatalogViewProps {
  userLocation: { lat: number; lng: number };
  onShowProductOnMap: (product: CatalogProduct, targetStoreId?: string) => void;
  onNavigateToStore?: (storeLocation: { lat: number; lng: number }, storeName: string) => void;
  onOpenProductPage?: (product: CatalogProduct) => void;
  isDarkMode?: boolean;
}

export const ProductsCatalogView: React.FC<ProductsCatalogViewProps> = ({
  userLocation,
  onShowProductOnMap,
  onNavigateToStore,
  onOpenProductPage,
  isDarkMode = false
}) => {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');
  const [sortBy, setSortBy] = useState<'stores' | 'priceAsc' | 'priceDesc' | 'alpha'>('stores');
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);

  // Load products from API
  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(apiUrl(`/api/v1/products?lat=${userLocation.lat}&lng=${userLocation.lng}`));
        if (!res.ok) throw new Error('Tovarlar ro‘yxatini yuklashda xatolik');
        const data = await res.json();
        if (isMounted) {
          setProducts(data.items || []);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Xatolik yuz berdi');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => { isMounted = false; };
  }, [userLocation.lat, userLocation.lng]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['Barchasi', ...Array.from(set)];
  }, [products]);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      if (selectedCategory !== 'Barchasi' && p.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchBrand = p.brand?.toLowerCase().includes(q);
        const matchCategory = p.category?.toLowerCase().includes(q);
        const matchBarcode = p.barcode?.includes(q);
        if (!matchTitle && !matchBrand && !matchCategory && !matchBarcode) return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      if (sortBy === 'stores') {
        return (b.availableStoresCount - a.availableStoresCount) || (a.minPrice - b.minPrice);
      }
      if (sortBy === 'priceAsc') {
        return (a.minPrice || 0) - (b.minPrice || 0);
      }
      if (sortBy === 'priceDesc') {
        return (b.minPrice || 0) - (a.minPrice || 0);
      }
      return a.title.localeCompare(b.title);
    });
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="w-full flex-1 flex flex-col bg-[#F8FAF9] dark:bg-[#0E1713] min-h-[calc(100vh-64px)] pb-20">
      {/* Top Banner / Header */}
      <div className="bg-white dark:bg-[#14201A] border-b border-[#DCE5DF] dark:border-[#22332C] px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] text-xs font-extrabold mb-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Tovarlar & Do‘konlar Narxlari</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#172C28] dark:text-[#E8F2EC]">
                Mahsulotlar ro‘yxati
              </h1>
              <p className="text-xs sm:text-sm text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                Qayerda borligini tekshiring, eng arzon narxni toping va to‘g‘ridan-to‘g‘ri kartada ko‘ring
              </p>
            </div>

            {/* Live stats summary */}
            <div className="flex items-center gap-3 bg-[#F3F6F3] dark:bg-[#1A2822] p-2.5 rounded-2xl border border-[#DCE5DF] dark:border-[#273B32]">
              <div className="px-3 py-1 text-center border-r border-[#DCE5DF] dark:border-[#273B32]">
                <div className="text-base sm:text-lg font-black text-[#116B50] dark:text-[#4ADE80]">
                  {products.length}
                </div>
                <div className="text-[10px] font-semibold text-[#566A63] dark:text-[#8B9E95] uppercase tracking-wider">
                  Tovar turi
                </div>
              </div>
              <div className="px-3 py-1 text-center">
                <div className="text-base sm:text-lg font-black text-[#172C28] dark:text-[#E8F2EC]">
                  {products.reduce((acc, p) => acc + p.availableStoresCount, 0)}
                </div>
                <div className="text-[10px] font-semibold text-[#566A63] dark:text-[#8B9E95] uppercase tracking-wider">
                  Do‘kon taklifi
                </div>
              </div>
            </div>
          </div>

          {/* Search bar & filter controls */}
          <div className="mt-5 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566A63] dark:text-[#8B9E95]" />
              <input
                type="text"
                placeholder="Tovarlarni nomi, brendi yoki shtrix kodi bo‘yicha izlash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-xs sm:text-sm text-[#172C28] dark:text-[#E8F2EC] placeholder-[#8B9E95] focus:outline-none focus:ring-2 focus:ring-[#116B50] shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B9E95] hover:text-[#172C28] dark:hover:text-[#E8F2EC]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort selector */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-[#566A63] dark:text-[#8B9E95] hidden sm:inline">Saralash:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-xs font-semibold text-[#172C28] dark:text-[#E8F2EC] focus:outline-none focus:ring-2 focus:ring-[#116B50] shadow-2xs cursor-pointer"
              >
                <option value="stores">Do‘konlar soni bo‘yicha</option>
                <option value="priceAsc">Arzondan qimmatga</option>
                <option value="priceDesc">Qimmatdan arzonga</option>
                <option value="alpha">A dan Z gacha</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#116B50] text-white shadow-xs'
                    : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7] dark:hover:bg-[#23382F] hover:text-[#116B50] dark:hover:text-[#4ADE80]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-10 h-10 border-3 border-[#116B50] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs sm:text-sm font-semibold text-[#566A63] dark:text-[#8B9E95]">
              Mahsulotlar yuklanmoqda...
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-6 text-center my-8">
            <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-12 text-center my-8">
            <div className="w-16 h-16 rounded-full bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center mx-auto mb-3 text-2xl">
              📦
            </div>
            <h3 className="text-base font-bold text-[#172C28] dark:text-[#E8F2EC] mb-1">
              Mahsulot topilmadi
            </h3>
            <p className="text-xs text-[#566A63] dark:text-[#8B9E95] max-w-sm mx-auto">
              Qidiruv so‘zini o‘zgartiring yoki boshqa toifani tanlab ko‘ring
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
            {filteredProducts.map((product) => {
              const hasStores = product.availableStoresCount > 0;
              const formattedPrice = product.minPrice > 0 
                ? `${product.minPrice.toLocaleString('uz-UZ')} so‘m`
                : 'Narx belgilanmagan';

              const formattedOldPrice = product.originalPrice > product.minPrice
                ? `${product.originalPrice.toLocaleString('uz-UZ')} so‘m`
                : null;

              return (
                <div
                  key={product.id}
                  onClick={() => onOpenProductPage ? onOpenProductPage(product) : setSelectedProduct(product)}
                  className="group bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] hover:border-[#116B50]/50 dark:hover:border-[#4ADE80]/50 rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col cursor-pointer relative"
                >
                  {/* Image container */}
                  <div className="relative aspect-square w-full bg-[#F3F6F3] dark:bg-[#1A2822] overflow-hidden flex items-center justify-center">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback placeholder
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80';
                      }}
                    />

                    {/* Discount / Vau badge (Uzum style as in image 3) */}
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                      <div className="bg-[#E11D48] text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                        <span>⚡</span>
                        <span>Vau-narx</span>
                      </div>
                    </div>

                    {/* Stock badge overlay on image bottom */}
                    {hasStores ? (
                      <div className="absolute bottom-2 left-2 right-2 z-10">
                        <div className="bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center justify-between">
                          <span className="truncate">🏪 {product.availableStoresCount} ta do‘konda</span>
                          <span className="text-emerald-400">Mavjud</span>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute bottom-2 left-2 right-2 z-10">
                        <div className="bg-amber-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-1 rounded-lg text-center">
                          Hozircha qolmagan
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Body content */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Price Section (Pink / Bold styled as image 3) */}
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-sm sm:text-base font-black text-[#E11D48] dark:text-[#FB7185]">
                          {formattedPrice}
                        </span>
                        {formattedOldPrice && (
                          <span className="text-[10px] sm:text-[11px] line-through text-[#8B9E95]">
                            {formattedOldPrice}
                          </span>
                        )}
                        {product.discountPercent > 0 && (
                          <span className="text-[9px] font-extrabold text-[#E11D48] dark:text-[#FB7185]">
                            -{product.discountPercent}%
                          </span>
                        )}
                      </div>

                      {/* Stock on hand subtitle */}
                      <div className="text-[10px] font-bold text-[#E11D48] dark:text-[#FB7185] mt-0.5">
                        {product.totalStock > 0 ? `${product.totalStock} dona qoldi` : 'Qoldiq yo‘q'}
                      </div>

                      {/* Title */}
                      <h3 className="text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] line-clamp-2 mt-1 leading-snug group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] transition-colors">
                        {product.title}
                      </h3>

                      {/* Brand and category info */}
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                        <span className="truncate max-w-[90px]">{product.brand}</span>
                        <span>•</span>
                        <span className="truncate">{product.category}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-3 pt-2.5 border-t border-[#DCE5DF]/60 dark:border-[#22332C] flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowProductOnMap(product);
                        }}
                        disabled={!hasStores}
                        className="flex-1 py-1.5 px-2 bg-[#116B50] hover:bg-[#0D523D] active:scale-98 disabled:bg-gray-300 dark:disabled:bg-gray-800 disabled:cursor-not-allowed text-white text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>Kartadan</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                        title="Batafsil ma‘lumot va do‘konlar"
                        className="p-1.5 bg-[#F3F6F3] dark:bg-[#1A2822] hover:bg-[#E0EFE7] dark:hover:bg-[#23382F] text-[#172C28] dark:text-[#E8F2EC] rounded-xl transition shrink-0"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Detail & Available Stores Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#273B32] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#DCE5DF] dark:border-[#22332C]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]">
                  <Package className="w-4 h-4" />
                </span>
                <span className="text-sm font-black text-[#172C28] dark:text-[#E8F2EC]">
                  Tovar haqida to‘liq ma‘lumot
                </span>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] hover:text-[#172C28] dark:hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Product overview card */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-[#F8FAF9] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#273B32]">
                <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-white dark:bg-[#14201A] shrink-0 border border-[#DCE5DF] dark:border-[#273B32]">
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] text-[10px] font-extrabold uppercase tracking-wider">
                        {selectedProduct.category}
                      </span>
                      <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">
                        Brend: {selectedProduct.brand}
                      </span>
                    </div>

                    <h2 className="text-lg font-black text-[#172C28] dark:text-[#E8F2EC]">
                      {selectedProduct.title}
                    </h2>

                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="text-xl font-black text-[#E11D48] dark:text-[#FB7185]">
                        {selectedProduct.minPrice > 0 ? `${selectedProduct.minPrice.toLocaleString('uz-UZ')} so‘m` : '—'}
                      </span>
                      {selectedProduct.maxPrice > selectedProduct.minPrice && (
                        <span className="text-xs text-[#8B9E95]">
                          dan {selectedProduct.maxPrice.toLocaleString('uz-UZ')} so‘mgacha
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Specifications grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-[#DCE5DF] dark:border-[#273B32] text-xs">
                    <div>
                      <span className="text-[10px] text-[#8B9E95] block">Qadoq o‘lchami</span>
                      <span className="font-bold text-[#172C28] dark:text-[#E8F2EC]">
                        {selectedProduct.packSize || selectedProduct.packUnit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8B9E95] block">Do‘konlar soni</span>
                      <span className="font-bold text-[#116B50] dark:text-[#4ADE80]">
                        {selectedProduct.availableStoresCount} ta do‘kon
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8B9E95] block">Jami qoldiq</span>
                      <span className="font-bold text-[#172C28] dark:text-[#E8F2EC]">
                        {selectedProduct.totalStock} dona
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8B9E95] block">Shtrix kod</span>
                      <span className="font-mono font-bold text-[#172C28] dark:text-[#E8F2EC] truncate block">
                        {selectedProduct.barcode || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stores section header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <StoreIcon className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                    <h3 className="text-sm font-black text-[#172C28] dark:text-[#E8F2EC]">
                      Ushbu tovar mavjud bo‘lgan do‘konlar ({selectedProduct.stores.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">
                    Eng arzon narxdan tartiblangan
                  </span>
                </div>

                {/* Stores list */}
                {selectedProduct.stores.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-[#F3F6F3] dark:bg-[#1A2822] text-[#8B9E95] text-xs font-semibold">
                    Hozirda hech bir do‘konda bu tovar mavjud emas
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedProduct.stores.map((store, idx) => (
                      <div
                        key={store.storeId + idx}
                        className="p-3.5 rounded-2xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] hover:border-[#116B50] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-[#172C28] dark:text-[#E8F2EC]">
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
                                🏆 Eng arzon narx
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
                          </div>

                          {store.wholesaleTiers && store.wholesaleTiers.length > 0 && (
                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-[#8B9E95]">Ulgurji narxlar:</span>
                              {store.wholesaleTiers.map((t: any, i: number) => (
                                <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F3F6F3] dark:bg-[#1A2822] text-[#172C28] dark:text-[#E8F2EC]">
                                  {t.minQuantity}+ dona: {Number(t.unitPrice).toLocaleString('uz-UZ')} so‘m
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Price & actions */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#DCE5DF]/60 dark:border-[#22332C]">
                          <div className="text-left sm:text-right">
                            <div className="text-base font-black text-[#116B50] dark:text-[#4ADE80]">
                              {store.price.toLocaleString('uz-UZ')} so‘m
                            </div>
                            <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                              Qoldiq: <strong className="text-[#172C28] dark:text-[#E8F2EC]">{store.stockOnHand} {selectedProduct.packUnit}</strong>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onShowProductOnMap(selectedProduct, store.storeId);
                              setSelectedProduct(null);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] hover:bg-[#116B50] hover:text-white dark:hover:bg-[#4ADE80] dark:hover:text-black text-[#116B50] dark:text-[#4ADE80] text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Kartada ko‘rish</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer (Prominent Show All on Map CTA) */}
            <div className="p-4 border-t border-[#DCE5DF] dark:border-[#22332C] bg-[#F8FAF9] dark:bg-[#14201A] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[#566A63] dark:text-[#8B9E95] text-center sm:text-left">
                Kartada har bir do‘kon joylashuvi va narxi aks ettiriladi
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#EDF5F0] transition flex-1 sm:flex-initial"
                >
                  Yopish
                </button>

                <button
                  onClick={() => {
                    onShowProductOnMap(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  disabled={selectedProduct.stores.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-[#116B50] hover:bg-[#0D523D] disabled:bg-gray-400 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-md flex-1 sm:flex-initial"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Xaritada barcha do‘konlarni ko‘rish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
