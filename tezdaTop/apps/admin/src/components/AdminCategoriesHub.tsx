import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { apiFetch } from '@yaqintop/ui';
import {
  Layers,
  Boxes,
  Tag,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  GitMerge,
  Package,
  Wrench,
  Camera,
  Upload,
  X,
  Store,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  FileEdit,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { Button, Modal, useTranslation } from '@yaqintop/ui';

export interface CategoryStat {
  name: string;
  productCount: number;
  serviceCount: number;
  totalCount: number;
  storesCount: number;
}

export interface AdminOfferItem {
  id: string;
  storeId: string;
  variantId: string;
  price: number;
  stockOnHand?: number;
  status: string;
  priceUpdatedAt?: string;
  stockVerifiedAt?: string;
  storeName?: string;
  storeAddress?: string;
  organizationName?: string;
  variant: {
    id: string;
    productId: string;
    title: string;
    packUnit: string;
    photoUrl?: string;
    brand?: string;
    category?: string;
    barcode?: string;
    description?: string;
    type?: 'PRODUCT' | 'SERVICE';
    aliases?: string[];
  };
}

export interface AdminCategoriesHubProps {
  isDarkMode: boolean;
  onShowToast: (msg: string) => void;
}

const COMMON_UNITS_PRODUCT = [
  'dona',
  'kg',
  'litr',
  'gramm',
  'metr',
  'pachka',
  'quti',
  'blok',
  'to‘plam',
  'komplekt'
];

const COMMON_UNITS_SERVICE = [
  'xizmat',
  'soat',
  'dona',
  'm2',
  'porsiya',
  'kishi',
  'kun'
];

export const AdminCategoriesHub: React.FC<AdminCategoriesHubProps> = ({
  isDarkMode,
  onShowToast
}) => {
  const { t } = useTranslation();

  // Active view tab: 'categories' or 'products'
  const [activeTab, setActiveTab] = useState<'categories' | 'products'>('categories');

  // Categories list state
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<'ALL' | 'PRODUCT' | 'SERVICE'>('ALL');

  // Products list state
  const [products, setProducts] = useState<AdminOfferItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [productTypeFilter, setProductTypeFilter] = useState<'ALL' | 'PRODUCT' | 'SERVICE'>('ALL');
  // Pending refresh notification after edit or delete (allows manual refresh on user request)
  const [pendingRefreshNotice, setPendingRefreshNotice] = useState<{ message: string } | null>(null);

  // Stable toast notifier to prevent cascading re-fetches
  const onShowToastRef = useRef(onShowToast);
  useEffect(() => {
    onShowToastRef.current = onShowToast;
  }, [onShowToast]);

  const notifyToast = useCallback((msg: string) => {
    if (onShowToastRef.current) {
      onShowToastRef.current(msg);
    }
  }, []);

  // Rename Category Modal state
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [categoryToRename, setCategoryToRename] = useState<CategoryStat | null>(null);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isSubmittingRename, setIsSubmittingRename] = useState<boolean>(false);

  // Merge Category Modal state
  const [isMergeModalOpen, setIsMergeModalOpen] = useState<boolean>(false);
  const [sourceCategory, setSourceCategory] = useState<CategoryStat | null>(null);
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [isCustomTargetCategory, setIsCustomTargetCategory] = useState<boolean>(false);
  const [isSubmittingMerge, setIsSubmittingMerge] = useState<boolean>(false);

  // Delete Category Modal state
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryStat | null>(null);
  const [deleteItemsMode, setDeleteItemsMode] = useState<boolean>(false);
  const [deleteTargetCategory, setDeleteTargetCategory] = useState<string>('Umumiy');
  const [isSubmittingDelete, setIsSubmittingDelete] = useState<boolean>(false);

  // New Category Creation Modal state
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState<boolean>(false);
  const [newCreatedCategoryName, setNewCreatedCategoryName] = useState<string>('');

  // Edit Product / Service Modal state
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<AdminOfferItem | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    title: '',
    price: '',
    category: '',
    isCustomCategory: false,
    customCategoryName: '',
    packUnit: 'dona',
    stockOnHand: '10',
    type: 'PRODUCT' as 'PRODUCT' | 'SERVICE',
    barcode: '',
    brand: '',
    description: '',
    photoUrl: '',
    photoInputMode: 'file' as 'file' | 'url'
  });
  const [isSubmittingProductEdit, setIsSubmittingProductEdit] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Categories from server
  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const res = await apiFetch('/api/v1/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.items || data.categoryStats || []);
      } else {
        notifyToast('Kategoriyalarni yuklab bo‘lmadi');
      }
    } catch {
      notifyToast('Server bilan aloqa xatosi');
    } finally {
      setIsLoadingCategories(false);
    }
  }, [notifyToast]);

  // Fetch Products from server
  const fetchProducts = useCallback(async (category?: string, query?: string) => {
    setIsLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (category && category !== 'ALL') params.set('category', category);
      if (query && query.trim()) params.set('q', query.trim());
      const url = `/api/v1/admin/categories/products?${params.toString()}`;
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.items || []);
      } else {
        notifyToast('Mahsulotlarni yuklab bo‘lmadi');
      }
    } catch {
      notifyToast('Server bilan aloqa xatosi');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [notifyToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Initial load when tab switched to products or category filter changed
  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts(selectedCategoryFilter, productSearchQuery);
    }
  }, [activeTab, selectedCategoryFilter, fetchProducts]);

  // Handle Debounced Search for Products (only when search query changes)
  const isInitialSearchRender = useRef(true);
  useEffect(() => {
    if (isInitialSearchRender.current) {
      isInitialSearchRender.current = false;
      return;
    }
    if (activeTab !== 'products') return;
    const timer = setTimeout(() => {
      fetchProducts(selectedCategoryFilter, productSearchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [productSearchQuery, selectedCategoryFilter, activeTab, fetchProducts]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    let result = categories;
    if (categorySearchQuery.trim()) {
      const q = categorySearchQuery.trim().toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q));
    }
    if (categoryTypeFilter === 'PRODUCT') {
      result = result.filter(c => c.productCount > 0);
    } else if (categoryTypeFilter === 'SERVICE') {
      result = result.filter(c => c.serviceCount > 0);
    }
    return result;
  }, [categories, categorySearchQuery, categoryTypeFilter]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    let result = products;
    if (productTypeFilter === 'PRODUCT') {
      result = result.filter(p => (p.variant?.type || 'PRODUCT') !== 'SERVICE');
    } else if (productTypeFilter === 'SERVICE') {
      result = result.filter(p => (p.variant?.type || 'PRODUCT') === 'SERVICE');
    }
    return result;
  }, [products, productTypeFilter]);

  // Overall Statistics
  const stats = useMemo(() => {
    let totalItems = 0;
    let totalProducts = 0;
    let totalServices = 0;
    const allStoreIds = new Set<string>();

    categories.forEach(c => {
      totalItems += c.totalCount;
      totalProducts += c.productCount;
      totalServices += c.serviceCount;
    });

    return {
      categoryCount: categories.length,
      totalItems,
      totalProducts,
      totalServices
    };
  }, [categories]);

  // Open Rename Category Modal
  const handleOpenRename = (category: CategoryStat) => {
    setCategoryToRename(category);
    setNewCategoryName(category.name);
    setIsRenameModalOpen(true);
  };

  // Submit Rename Category
  const handleSubmitRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryToRename || !newCategoryName.trim()) {
      notifyToast('Yangi kategoriya nomini kiriting');
      return;
    }
    if (newCategoryName.trim().toLowerCase() === categoryToRename.name.toLowerCase()) {
      setIsRenameModalOpen(false);
      return;
    }

    setIsSubmittingRename(true);
    try {
      const res = await apiFetch('/api/v1/admin/categories/rename', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldName: categoryToRename.name,
          newName: newCategoryName.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        notifyToast(data.message || 'Kategoriya muvaffaqiyatli o‘zgartirildi');
        setIsRenameModalOpen(false);
        fetchCategories();
        if (selectedCategoryFilter === categoryToRename.name) {
          setSelectedCategoryFilter(newCategoryName.trim());
        }
        fetchProducts(selectedCategoryFilter === categoryToRename.name ? newCategoryName.trim() : selectedCategoryFilter);
      } else {
        const err = await res.json();
        notifyToast(err.message || 'Xatolik yuz berdi');
      }
    } catch {
      notifyToast('Server bilan aloqa xatosi');
    } finally {
      setIsSubmittingRename(false);
    }
  };

  // Open Merge Category Modal
  const handleOpenMerge = (category: CategoryStat) => {
    setSourceCategory(category);
    // Suggest first other category as default target
    const other = categories.find(c => c.name.toLowerCase() !== category.name.toLowerCase());
    setTargetCategory(other ? other.name : '');
    setIsCustomTargetCategory(false);
    setIsMergeModalOpen(true);
  };

  // Submit Merge Category
  const handleSubmitMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceCategory) return;
    const finalTarget = isCustomTargetCategory ? targetCategory.trim() : targetCategory;

    if (!finalTarget) {
      notifyToast('Birlashtiriladigan maqsadli kategoriyani tanlang');
      return;
    }
    if (finalTarget.toLowerCase() === sourceCategory.name.toLowerCase()) {
      notifyToast('Manba va maqsadli kategoriya bir xil bo‘lishi mumkin emas');
      return;
    }

    setIsSubmittingMerge(true);
    try {
      const res = await apiFetch('/api/v1/admin/categories/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCategory: sourceCategory.name,
          targetCategory: finalTarget
        })
      });

      if (res.ok) {
        const data = await res.json();
        notifyToast(data.message || 'Kategoriyalar muvaffaqiyatli birlashtirildi');
        setIsMergeModalOpen(false);
        fetchCategories();
        fetchProducts(selectedCategoryFilter);
      } else {
        const err = await res.json();
        notifyToast(err.message || 'Xatolik yuz berdi');
      }
    } catch {
      notifyToast('Server bilan aloqa xatosi');
    } finally {
      setIsSubmittingMerge(false);
    }
  };

  // Open Delete Category Modal
  const handleOpenDelete = (category: CategoryStat) => {
    setCategoryToDelete(category);
    const other = categories.find(c => c.name.toLowerCase() !== category.name.toLowerCase() && c.name.toLowerCase() !== 'umumiy');
    setDeleteTargetCategory(other ? other.name : 'Umumiy');
    setDeleteItemsMode(false);
    setIsDeleteCategoryModalOpen(true);
  };

  // Submit Delete Category
  const handleSubmitDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryToDelete) return;

    setIsSubmittingDelete(true);
    try {
      const res = await apiFetch('/api/v1/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName: categoryToDelete.name,
          deleteItems: deleteItemsMode,
          targetCategory: deleteItemsMode ? undefined : deleteTargetCategory
        })
      });

      if (res.ok) {
        const data = await res.json();
        notifyToast(data.message || `"${categoryToDelete.name}" kategoriyasi muvaffaqiyatli o‘chirildi`);
        setIsDeleteCategoryModalOpen(false);
        setCategoryToDelete(null);
        fetchCategories();
        if (selectedCategoryFilter === categoryToDelete.name) {
          setSelectedCategoryFilter('ALL');
        }
        fetchProducts('ALL');
      } else {
        const err = await res.json();
        notifyToast(err.message || 'Xatolik yuz berdi');
      }
    } catch {
      notifyToast('Server bilan aloqa xatosi');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // Backward compatible wrapper
  const handleDeleteCategory = (cat: CategoryStat) => {
    handleOpenDelete(cat);
  };

  // Delete Individual Product
  const handleDeleteProduct = async (item: AdminOfferItem) => {
    const title = item.variant?.title || 'Ushbu tovar';
    if (!window.confirm(`Haqiqatan ham "${title}" tovarini bazadan butunlay o‘chirmoqchimisiz?`)) {
      return;
    }

    try {
      const res = await apiFetch(`/api/v1/admin/offers/${item.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        notifyToast('Tovar/xizmat muvaffaqiyatli o‘chirildi');
        // Update local state without automatic page reload/server re-fetch
        setProducts(prev => prev.filter(p => p.id !== item.id));
        setPendingRefreshNotice({
          message: `"${title}" tovari o‘chirildi. Serverdagi to‘liq ro‘yxat va statistikalarni yangilashni xohlaysizmi?`
        });
      } else {
        const err = await res.json();
        notifyToast(err.message || 'O‘chirishda xatolik yuz berdi');
      }
    } catch {
      notifyToast('Server bilan aloqa xatosi');
    }
  };

  // Handle Photo File Upload with Canvas Resize
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setEditProductForm(prev => ({
              ...prev,
              photoUrl: dataUrl
            }));
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      notifyToast('Rasm yuklashda xatolik yuz berdi');
    }
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (item: AdminOfferItem) => {
    const v = item.variant || ({} as any);
    const cat = v.category || 'Umumiy';
    const isSvc = v.type === 'SERVICE';

    setEditingProduct(item);
    setEditProductForm({
      title: v.title || '',
      price: item.price ? item.price.toString() : '',
      category: cat,
      isCustomCategory: false,
      customCategoryName: '',
      packUnit: v.packUnit || (isSvc ? 'xizmat' : 'dona'),
      stockOnHand: (item.stockOnHand ?? 10).toString(),
      type: isSvc ? 'SERVICE' : 'PRODUCT',
      barcode: v.barcode || '',
      brand: v.brand || '',
      description: v.description || '',
      photoUrl: v.photoUrl || '',
      photoInputMode: v.photoUrl && !v.photoUrl.startsWith('data:') ? 'url' : 'file'
    });
    setIsEditProductModalOpen(true);
  };

  // Submit Product Edit
  const handleSubmitProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editProductForm.title.trim()) {
      notifyToast('Mahsulot yoki xizmat nomini kiriting');
      return;
    }
    if (!editProductForm.price || isNaN(parseFloat(editProductForm.price))) {
      notifyToast('Yaroqli narx kiriting');
      return;
    }

    const finalCategory = editProductForm.isCustomCategory
      ? (editProductForm.customCategoryName.trim() || 'Umumiy')
      : editProductForm.category;

    setIsSubmittingProductEdit(true);
    try {
      const res = await apiFetch(`/api/v1/admin/offers/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editProductForm.title.trim(),
          price: parseFloat(editProductForm.price),
          category: finalCategory,
          packUnit: editProductForm.packUnit.trim(),
          stockOnHand: parseInt(editProductForm.stockOnHand || '10', 10),
          type: editProductForm.type,
          barcode: editProductForm.barcode.trim(),
          brand: editProductForm.brand.trim(),
          description: editProductForm.description.trim(),
          photoUrl: editProductForm.photoUrl
        })
      });

      if (res.ok) {
        notifyToast('Tovar/xizmat ma’lumotlari va rasmi muvaffaqiyatli yangilandi!');
        setIsEditProductModalOpen(false);

        // Update local products list immediately without reloading from server
        setProducts(prev => prev.map(p => {
          if (p.id === editingProduct.id) {
            return {
              ...p,
              price: parseFloat(editProductForm.price),
              stockOnHand: parseInt(editProductForm.stockOnHand || '10', 10),
              variant: {
                ...p.variant,
                title: editProductForm.title.trim(),
                category: finalCategory,
                packUnit: editProductForm.packUnit.trim(),
                barcode: editProductForm.barcode.trim(),
                brand: editProductForm.brand.trim(),
                description: editProductForm.description.trim(),
                photoUrl: editProductForm.photoUrl,
                type: editProductForm.type
              }
            };
          }
          return p;
        }));

        // Propose refresh to user instead of reloading by itself
        setPendingRefreshNotice({
          message: `"${editProductForm.title.trim()}" tovari ma’lumotlari saqlandi. Serverdagi to‘liq ro‘yxat va statistikalarni yangilashni xohlaysizmi?`
        });
      } else {
        const err = await res.json();
        notifyToast(err.message || 'Xatolik yuz berdi');
      }
    } catch {
      notifyToast('Server bilan aloqa xatosi');
    } finally {
      setIsSubmittingProductEdit(false);
    }
  };

  // Jump to Products tab for specific category
  const handleViewCategoryProducts = (catName: string) => {
    setSelectedCategoryFilter(catName);
    setActiveTab('products');
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 animate-fadeIn">
      {/* Top Header */}
      <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#116B50] to-[#25A17A] text-white flex items-center justify-center shadow-md shrink-0">
              <Boxes className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl md:text-2xl font-black text-[#172C28] dark:text-white tracking-tight leading-tight">
                  Kategoriyalar va Tovarlar Boshqaruvi
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-[#116B50] dark:bg-emerald-950/60 dark:text-[#4ADE80] border border-emerald-300 dark:border-emerald-800 shrink-0">
                  Faqat Admin
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#566A63] dark:text-[#8B9E95] mt-1 leading-relaxed">
                Bazadagi barcha mahsulot va xizmat kategoriyalarini tahrirlash, birlashtirish hamda tovar ma’lumotlari va rasmlarini to‘g‘ridan-to‘g‘ri boshqarish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={() => {
                fetchCategories();
                if (activeTab === 'products') fetchProducts(selectedCategoryFilter, productSearchQuery);
              }}
              className="px-3.5 py-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#F3F8F5] dark:hover:bg-[#1E3328] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCategories || isLoadingProducts ? 'animate-spin' : ''}`} />
              Yangilash
            </button>
          </div>
        </div>

        {/* Global Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-[#DCE5DF]/60 dark:border-[#22332C]">
          <div className="bg-[#F8FAF9] dark:bg-[#182620] border border-[#E3ECE7] dark:border-[#22362C] rounded-xl p-2.5 sm:p-3">
            <div className="text-[10px] sm:text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95] uppercase tracking-wider flex items-center gap-1.5 truncate">
              <Layers className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
              Kategoriyalar
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-black text-[#172C28] dark:text-white mt-1">
              {stats.categoryCount}
            </div>
          </div>

          <div className="bg-[#F8FAF9] dark:bg-[#182620] border border-[#E3ECE7] dark:border-[#22362C] rounded-xl p-2.5 sm:p-3">
            <div className="text-[10px] sm:text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95] uppercase tracking-wider flex items-center gap-1.5 truncate">
              <Package className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              Tovar Turlari
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-black text-[#172C28] dark:text-white mt-1">
              {stats.totalProducts}
            </div>
          </div>

          <div className="bg-[#F8FAF9] dark:bg-[#182620] border border-[#E3ECE7] dark:border-[#22362C] rounded-xl p-2.5 sm:p-3">
            <div className="text-[10px] sm:text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95] uppercase tracking-wider flex items-center gap-1.5 truncate">
              <Wrench className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              Xizmat Turlari
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-black text-[#172C28] dark:text-white mt-1">
              {stats.totalServices}
            </div>
          </div>

          <div className="bg-[#F8FAF9] dark:bg-[#182620] border border-[#E3ECE7] dark:border-[#22362C] rounded-xl p-2.5 sm:p-3">
            <div className="text-[10px] sm:text-[11px] font-bold text-[#566A63] dark:text-[#8B9E95] uppercase tracking-wider flex items-center gap-1.5 truncate">
              <Tag className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              Jami Takliflar
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-black text-[#172C28] dark:text-white mt-1">
              {stats.totalItems}
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#DCE5DF] dark:border-[#22332C] mt-4 sm:mt-6 -mb-4 sm:-mb-5 md:-mb-6 -mx-4 sm:-mx-5 md:-mx-6 px-4 sm:px-5 md:px-6 gap-2 overflow-x-auto no-scrollbar scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`pb-3 sm:pb-3.5 px-3 font-extrabold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-[#116B50] text-[#116B50] dark:border-[#4ADE80] dark:text-[#4ADE80]'
                : 'border-transparent text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Kategoriyalar Boshqaruvi
            <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-[#E2EEE4] dark:bg-[#1E3328] font-bold">
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`pb-3 sm:pb-3.5 px-3 font-extrabold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-[#116B50] text-[#116B50] dark:border-[#4ADE80] dark:text-[#4ADE80]'
                : 'border-transparent text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4" />
            Tovarlar va Xizmatlar Ro‘yxati
            {selectedCategoryFilter !== 'ALL' && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-600 text-white font-bold">
                {selectedCategoryFilter}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: CATEGORIES MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="space-y-3.5 sm:space-y-4">
          {/* Action and Filter Bar */}
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                placeholder="Kategoriya nomini qidirish..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-[#F8FAF9] dark:bg-[#182620] border border-[#DCE5DF] dark:border-[#22362C] text-[#172C28] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#116B50]"
              />
              {categorySearchQuery && (
                <button
                  type="button"
                  onClick={() => setCategorySearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type filters */}
            <div className="grid grid-cols-3 sm:flex items-center gap-1 sm:gap-1.5 bg-[#F8FAF9] dark:bg-[#182620] p-1 rounded-xl border border-[#DCE5DF] dark:border-[#22362C] shrink-0">
              <button
                type="button"
                onClick={() => setCategoryTypeFilter('ALL')}
                className={`py-1.5 px-2 sm:px-3 text-center justify-center rounded-lg text-xs font-bold transition cursor-pointer ${
                  categoryTypeFilter === 'ALL'
                    ? 'bg-white dark:bg-[#203229] text-[#116B50] dark:text-[#4ADE80] shadow-2xs'
                    : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28]'
                }`}
              >
                Barchasi
              </button>
              <button
                type="button"
                onClick={() => setCategoryTypeFilter('PRODUCT')}
                className={`py-1.5 px-2 sm:px-3 text-center justify-center rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                  categoryTypeFilter === 'PRODUCT'
                    ? 'bg-white dark:bg-[#203229] text-[#116B50] dark:text-[#4ADE80] shadow-2xs'
                    : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28]'
                }`}
              >
                <Package className="w-3 h-3 text-blue-500 shrink-0" />
                <span>Tovarlar</span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryTypeFilter('SERVICE')}
                className={`py-1.5 px-2 sm:px-3 text-center justify-center rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                  categoryTypeFilter === 'SERVICE'
                    ? 'bg-white dark:bg-[#203229] text-[#116B50] dark:text-[#4ADE80] shadow-2xs'
                    : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28]'
                }`}
              >
                <Wrench className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Xizmatlar</span>
              </button>
            </div>
          </div>

          {/* Categories Grid/Table */}
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
            {isLoadingCategories ? (
              <div className="p-10 sm:p-12 text-center text-xs text-[#566A63] dark:text-[#8B9E95] flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#116B50]" />
                <span>Kategoriyalar yuklanmoqda...</span>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-10 sm:p-12 text-center text-xs text-[#566A63] dark:text-[#8B9E95]">
                Kategoriyalar topilmadi
              </div>
            ) : (
              <div className="divide-y divide-[#DCE5DF]/60 dark:divide-[#22332C]">
                {filteredCategories.map((cat) => (
                  <div
                    key={cat.name}
                    className="p-3.5 sm:p-4 hover:bg-[#F8FAF9] dark:hover:bg-[#182620]/60 transition flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4"
                  >
                    {/* Left: Category Info */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#1E3328] text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center shrink-0 font-bold">
                        {cat.serviceCount > 0 && cat.productCount === 0 ? (
                          <Wrench className="w-5 h-5 text-amber-500" />
                        ) : (
                          <Tag className="w-5 h-5 text-[#116B50] dark:text-[#4ADE80]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="font-black text-sm sm:text-base text-[#172C28] dark:text-white truncate">
                            {cat.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E2EEE4] dark:bg-[#1E3328] text-[#116B50] dark:text-[#4ADE80] shrink-0">
                            {cat.totalCount} ta taklif
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#566A63] dark:text-[#8B9E95]">
                          {cat.productCount > 0 && (
                            <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                              📦 {cat.productCount} mahsulot
                            </span>
                          )}
                          {cat.serviceCount > 0 && (
                            <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                              🛠️ {cat.serviceCount} xizmat
                            </span>
                          )}
                          {cat.storesCount > 0 && (
                            <span className="flex items-center gap-1">
                              🏪 {cat.storesCount} do‘kon
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions (2x2 grid on mobile, flex on desktop) */}
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#DCE5DF]/60 dark:border-[#22332C]">
                      {/* View Products button */}
                      <button
                        type="button"
                        onClick={() => handleViewCategoryProducts(cat.name)}
                        className="py-2 px-2.5 sm:px-3 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#F3F8F5] dark:hover:bg-[#1E3328] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Ushbu kategoriyadagi tovarlarni ko‘rish"
                      >
                        <Boxes className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
                        <span className="truncate">Tovarlar ({cat.totalCount})</span>
                      </button>

                      {/* Rename Category button */}
                      <button
                        type="button"
                        onClick={() => handleOpenRename(cat)}
                        className="py-2 px-2.5 sm:px-3 rounded-xl bg-emerald-50 dark:bg-[#1E3328] text-[#116B50] dark:text-[#4ADE80] hover:bg-emerald-100 dark:hover:bg-[#254032] border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Kategoriya nomini o‘zgartirish"
                      >
                        <Edit2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Nomini o‘zgartirish</span>
                      </button>

                      {/* Merge Category button */}
                      <button
                        type="button"
                        onClick={() => handleOpenMerge(cat)}
                        className="py-2 px-2.5 sm:px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Boshqa kategoriya bilan birlashtirish"
                      >
                        <GitMerge className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Qo‘shib yuborish</span>
                      </button>

                      {/* Delete Category button */}
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(cat)}
                        className="py-2 px-2.5 sm:px-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Kategoriyani o‘chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">O‘chirish</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS & SERVICES LIST & EDITOR */}
      {activeTab === 'products' && (
        <div className="space-y-3.5 sm:space-y-4">
          {/* Refresh Suggestion Banner */}
          {pendingRefreshNotice && (
            <div className="bg-emerald-50 dark:bg-[#16291F] border border-emerald-300 dark:border-emerald-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-[#1E382A] flex items-center justify-center text-emerald-700 dark:text-[#4ADE80] shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-[#172C28] dark:text-[#E8F2EC]">
                    {pendingRefreshNotice.message}
                  </p>
                  <p className="text-[11px] sm:text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                    O‘zgarishlar lokal ro‘yxatda aks ettirildi. Sahifa o‘zidan-o‘zi yangilanmaydi.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setPendingRefreshNotice(null);
                    fetchProducts(selectedCategoryFilter, productSearchQuery);
                    fetchCategories();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#116B50] hover:bg-[#0d553f] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProducts ? 'animate-spin' : ''}`} />
                  <span>Yangilash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPendingRefreshNotice(null)}
                  className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-[#566A63] dark:text-[#8B9E95] hover:bg-gray-100 dark:hover:bg-[#1C2C23] text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                  title="Yangilamasdan davom etish"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Yopish</span>
                </button>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                placeholder="Tovar nomi, brend, shtrix-kod yoki do‘kon bo‘yicha..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-[#F8FAF9] dark:bg-[#182620] border border-[#DCE5DF] dark:border-[#22362C] text-[#172C28] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#116B50]"
              />
              {productSearchQuery && (
                <button
                  type="button"
                  onClick={() => setProductSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Select */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95] shrink-0">
                Kategoriya:
              </span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="flex-1 md:flex-initial px-3 py-2 rounded-xl text-xs font-bold bg-[#F8FAF9] dark:bg-[#182620] border border-[#DCE5DF] dark:border-[#22362C] text-[#172C28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#116B50] cursor-pointer"
              >
                <option value="ALL">Barcha kategoriyalar ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.totalCount})
                  </option>
                ))}
              </select>
            </div>

            {/* Product Type Filter */}
            <div className="grid grid-cols-3 md:flex items-center gap-1 md:gap-1.5 bg-[#F8FAF9] dark:bg-[#182620] p-1 rounded-xl border border-[#DCE5DF] dark:border-[#22362C] shrink-0">
              <button
                type="button"
                onClick={() => setProductTypeFilter('ALL')}
                className={`py-1.5 px-2 md:px-3 text-center justify-center rounded-lg text-xs font-bold transition cursor-pointer ${
                  productTypeFilter === 'ALL'
                    ? 'bg-white dark:bg-[#203229] text-[#116B50] dark:text-[#4ADE80] shadow-2xs'
                    : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28]'
                }`}
              >
                Barchasi
              </button>
              <button
                type="button"
                onClick={() => setProductTypeFilter('PRODUCT')}
                className={`py-1.5 px-2 md:px-3 text-center justify-center rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                  productTypeFilter === 'PRODUCT'
                    ? 'bg-white dark:bg-[#203229] text-[#116B50] dark:text-[#4ADE80] shadow-2xs'
                    : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28]'
                }`}
              >
                Tovarlar
              </button>
              <button
                type="button"
                onClick={() => setProductTypeFilter('SERVICE')}
                className={`py-1.5 px-2 md:px-3 text-center justify-center rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                  productTypeFilter === 'SERVICE'
                    ? 'bg-white dark:bg-[#203229] text-[#116B50] dark:text-[#4ADE80] shadow-2xs'
                    : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28]'
                }`}
              >
                Xizmatlar
              </button>
            </div>
          </div>

          {/* Products List / Grid */}
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl overflow-hidden shadow-sm">
            {isLoadingProducts ? (
              <div className="p-10 sm:p-12 text-center text-xs text-[#566A63] dark:text-[#8B9E95] flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#116B50]" />
                <span>Tovarlar yuklanmoqda...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-10 sm:p-12 text-center text-xs text-[#566A63] dark:text-[#8B9E95]">
                Tovarlar yoki xizmatlar topilmadi
              </div>
            ) : (
              <div className="divide-y divide-[#DCE5DF]/60 dark:divide-[#22332C]">
                {filteredProducts.map((item) => {
                  const v = item.variant || ({} as any);
                  const isSvc = v.type === 'SERVICE';
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-4 hover:bg-[#F8FAF9] dark:hover:bg-[#182620]/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                    >
                      {/* Left: Thumbnail & Info */}
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        {v.photoUrl ? (
                          <img
                            src={v.photoUrl}
                            alt={v.title}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-[#DCE5DF] dark:border-[#22332C] shrink-0 bg-white shadow-2xs"
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gray-100 dark:bg-[#1E3328] text-gray-400 dark:text-gray-500 flex items-center justify-center shrink-0 border border-dashed border-[#DCE5DF] dark:border-[#22332C]">
                            {isSvc ? <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500/70" /> : <Package className="w-5 h-5 sm:w-6 sm:h-6 text-[#116B50]/70 dark:text-[#4ADE80]/70" />}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-black text-sm sm:text-base text-[#172C28] dark:text-white truncate">
                              {v.title || 'Nomsiz mahsulot'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                              isSvc
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-emerald-100 text-[#116B50] dark:bg-emerald-950/60 dark:text-[#4ADE80]'
                            }`}>
                              {isSvc ? 'Xizmat' : 'Tovar'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E2EEE4] dark:bg-[#1E3328] text-[#116B50] dark:text-[#4ADE80] shrink-0">
                              {v.category || 'Umumiy'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs text-[#566A63] dark:text-[#8B9E95]">
                            <span className="font-extrabold text-[#116B50] dark:text-[#4ADE80] text-sm">
                              {Number(item.price).toLocaleString()} so‘m
                              <span className="text-[11px] font-normal text-gray-500"> / {v.packUnit || 'dona'}</span>
                            </span>
                            <span>·</span>
                            <span>Qoldiq: <strong className="text-[#172C28] dark:text-white">{item.stockOnHand ?? 10}</strong></span>
                            {item.storeName && (
                              <>
                                <span className="hidden xs:inline">·</span>
                                <span className="flex items-center gap-1 truncate text-gray-600 dark:text-gray-300">
                                  <Store className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span className="truncate max-w-[120px] sm:max-w-[200px]">{item.storeName}</span>
                                </span>
                              </>
                            )}
                            {v.barcode && (
                              <>
                                <span className="hidden sm:inline">·</span>
                                <span className="hidden sm:inline font-mono text-[10px] text-gray-500">
                                  #{v.barcode}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#DCE5DF]/60 dark:border-[#22332C]">
                        <button
                          type="button"
                          onClick={() => handleOpenEditProduct(item)}
                          className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#116B50] text-white hover:bg-[#0E5943] text-xs font-bold shadow-2xs hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Tahrirlash va Rasm</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(item)}
                          className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 text-xs font-bold transition flex items-center justify-center cursor-pointer shrink-0"
                          title="Tovarni o‘chirish"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: RENAME CATEGORY */}
      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        title="Kategoriya nomini o‘zgartirish"
      >
        <form onSubmit={handleSubmitRename} className="space-y-4">
          <div className="bg-[#F8FAF9] dark:bg-[#182620] border border-[#DCE5DF] dark:border-[#22362C] rounded-xl p-3 text-xs text-[#566A63] dark:text-[#8B9E95]">
            <p>
              Ushbu kategoriya nomi bazadagi barcha unga tegishli tovarlar, xizmatlar va variantlarda to‘g‘ridan-to‘g‘ri yangilanadi.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#566A63] dark:text-[#8B9E95] mb-1">
              Hozirgi nom
            </label>
            <div className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#203229] text-[#172C28] dark:text-white font-bold text-sm">
              {categoryToRename?.name}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#566A63] dark:text-[#8B9E95] mb-1">
              Yangi kategoriya nomi *
            </label>
            <input
              type="text"
              required
              value={newCategoryName || ''}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Masalan: Issiq taomlar yoki Ichimliklar"
              className="w-full px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#263D33] text-[#172C28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#116B50]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE5DF]/60 dark:border-[#22332C]">
            <button
              type="button"
              onClick={() => setIsRenameModalOpen(false)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] text-xs font-bold text-[#566A63] dark:text-[#8B9E95] hover:bg-gray-100 dark:hover:bg-[#1E3328] transition cursor-pointer text-center justify-center"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmittingRename}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#116B50] hover:bg-[#0E5943] text-white text-xs font-bold shadow transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmittingRename ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Nomni saqlash
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: MERGE CATEGORIES */}
      <Modal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        title="Kategoriyalarni birlashtirish (Qo‘shib yuborish)"
      >
        <form onSubmit={handleSubmitMerge} className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Diqqat:</strong> <u>{sourceCategory?.name}</u> kategoriyasidagi barcha tovar va xizmatlar tanlangan maqsadli kategoriyaga o‘tkaziladi. Eski kategoriya o‘chiriladi va tovarlar bitta umumiy toifada saqlanadi.
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#566A63] dark:text-[#8B9E95] mb-1">
              Manba (o‘chiriladigan) kategoriya
            </label>
            <div className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#203229] text-[#172C28] dark:text-white font-bold text-sm">
              {sourceCategory?.name} ({sourceCategory?.totalCount} ta tovar/xizmat)
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95]">
                Maqsadli (qo‘shiladigan) kategoriya *
              </label>
              <button
                type="button"
                onClick={() => setIsCustomTargetCategory(!isCustomTargetCategory)}
                className="text-[11px] font-bold text-[#116B50] dark:text-[#4ADE80] hover:underline cursor-pointer"
              >
                {isCustomTargetCategory ? 'Mavjud ro‘yxatdan tanlash' : '+ Yangi nom kiritish'}
              </button>
            </div>

            {isCustomTargetCategory ? (
              <input
                type="text"
                required
                value={targetCategory || ''}
                onChange={(e) => setTargetCategory(e.target.value)}
                placeholder="Yangi birlashtiruvchi kategoriya nomini yozing..."
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#263D33] text-[#172C28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#116B50]"
              />
            ) : (
              <select
                required
                value={targetCategory || ''}
                onChange={(e) => setTargetCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#263D33] text-[#172C28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#116B50] cursor-pointer"
              >
                <option value="">-- Maqsadli kategoriyani tanlang --</option>
                {categories
                  .filter((c) => c.name.toLowerCase() !== sourceCategory?.name.toLowerCase())
                  .map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.totalCount} ta mavjud)
                    </option>
                  ))}
              </select>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE5DF]/60 dark:border-[#22332C]">
            <button
              type="button"
              onClick={() => setIsMergeModalOpen(false)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] text-xs font-bold text-[#566A63] dark:text-[#8B9E95] hover:bg-gray-100 dark:hover:bg-[#1E3328] transition cursor-pointer text-center justify-center"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmittingMerge}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmittingMerge ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <GitMerge className="w-3.5 h-3.5" />
              )}
              Birlashtirishni tasdiqlash
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: DELETE CATEGORY CONFIRMATION */}
      <Modal
        isOpen={isDeleteCategoryModalOpen}
        onClose={() => setIsDeleteCategoryModalOpen(false)}
        title="Kategoriyani o‘chirish"
      >
        <form onSubmit={handleSubmitDelete} className="space-y-4">
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-800 dark:text-red-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <div>
              <strong>Diqqat:</strong> Siz <u>{categoryToDelete?.name}</u> kategoriyasini o‘chirmoqchisiz. Ushbu toifada hozirda <strong>{categoryToDelete?.totalCount || 0} ta</strong> tovar/xizmat mavjud.
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#566A63] dark:text-[#8B9E95] mb-2">
              Ushbu toifadagi tovarlar nima qilinsin?
            </label>
            <div className="space-y-2">
              <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                !deleteItemsMode
                  ? 'border-[#116B50] bg-emerald-50/50 dark:bg-[#1E3328]/40 dark:border-emerald-700'
                  : 'border-[#DCE5DF] dark:border-[#263D33] hover:bg-gray-50 dark:hover:bg-[#1A2A22]'
              }`}>
                <input
                  type="radio"
                  name="deleteMode"
                  checked={!deleteItemsMode}
                  onChange={() => setDeleteItemsMode(false)}
                  className="mt-0.5 text-[#116B50] focus:ring-[#116B50]"
                />
                <div className="text-xs">
                  <span className="font-bold text-[#172C28] dark:text-white block">
                    Tovarlarni saqlab qolish va boshqa toifaga ko‘chirish (Tavsiya etiladi)
                  </span>
                  <span className="text-[#566A63] dark:text-[#8B9E95] text-[11px]">
                    Tovarlar o‘chirilmaydi, faqat ularning kategoriyasi yangilanadi.
                  </span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                deleteItemsMode
                  ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30 dark:border-red-800'
                  : 'border-[#DCE5DF] dark:border-[#263D33] hover:bg-gray-50 dark:hover:bg-[#1A2A22]'
              }`}>
                <input
                  type="radio"
                  name="deleteMode"
                  checked={deleteItemsMode}
                  onChange={() => setDeleteItemsMode(true)}
                  className="mt-0.5 text-red-600 focus:ring-red-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-red-700 dark:text-red-400 block">
                    Barcha tovar va takliflarni ham butunlay o‘chirib tashlash
                  </span>
                  <span className="text-red-600/80 dark:text-red-400/80 text-[11px]">
                    Ushbu toifaga tegishli barcha {categoryToDelete?.totalCount || 0} ta tovar bazadan butunlay o‘chiriladi.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {!deleteItemsMode && (
            <div>
              <label className="block text-xs font-bold text-[#566A63] dark:text-[#8B9E95] mb-1">
                Tovarlar ko‘chiriladigan yangi kategoriya *
              </label>
              <select
                required
                value={deleteTargetCategory}
                onChange={(e) => setDeleteTargetCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#263D33] text-[#172C28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#116B50] cursor-pointer"
              >
                <option value="Umumiy">Umumiy (Standart kategoriya)</option>
                {categories
                  .filter((c) => c.name.toLowerCase() !== categoryToDelete?.name.toLowerCase() && c.name.toLowerCase() !== 'umumiy')
                  .map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.totalCount} ta mavjud)
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE5DF]/60 dark:border-[#22332C]">
            <button
              type="button"
              onClick={() => setIsDeleteCategoryModalOpen(false)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] text-xs font-bold text-[#566A63] dark:text-[#8B9E95] hover:bg-gray-100 dark:hover:bg-[#1E3328] transition cursor-pointer text-center justify-center"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmittingDelete}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmittingDelete ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              O‘chirishni tasdiqlash
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: EDIT PRODUCT / SERVICE & IMAGE */}
      <Modal
        isOpen={isEditProductModalOpen}
        onClose={() => setIsEditProductModalOpen(false)}
        title="Tovar / Xizmatni tahrirlash va rasmini yangilash"
      >
        <form onSubmit={handleSubmitProductEdit} className="space-y-4">
          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-bold text-[#566A63] dark:text-[#8B9E95] mb-1">
              Turi *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEditProductForm(prev => ({ ...prev, type: 'PRODUCT', packUnit: 'dona' }))}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  editProductForm.type === 'PRODUCT'
                    ? 'border-[#116B50] bg-emerald-50 text-[#116B50] dark:bg-[#1E3328] dark:text-[#4ADE80]'
                    : 'border-[#DCE5DF] dark:border-[#263D33] text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Tovar (Mahsulot)
              </button>
              <button
                type="button"
                onClick={() => setEditProductForm(prev => ({ ...prev, type: 'SERVICE', packUnit: 'xizmat' }))}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  editProductForm.type === 'SERVICE'
                    ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    : 'border-[#DCE5DF] dark:border-[#263D33] text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                Xizmat (Usluga)
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#566A63] dark:text-[#8B9E95] mb-1">
              Nomi *
            </label>
            <input
              type="text"
              required
              value={editProductForm.title || ''}
              onChange={(e) => setEditProductForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Masalan: Pepsi 1.5L yoki Sartaroshlik"
              className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#263D33] text-[#172C28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#116B50]"
            />
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95]">
                Kategoriya *
              </label>
              <button
                type="button"
                onClick={() => setEditProductForm(prev => ({ ...prev, isCustomCategory: !prev.isCustomCategory }))}
                className="text-[11px] font-bold text-[#116B50] dark:text-[#4ADE80] hover:underline cursor-pointer"
              >
                {editProductForm.isCustomCategory ? 'Mavjud ro‘yxatdan tanlash' : '+ Yangi kategoriya'}
              </button>
            </div>

            {editProductForm.isCustomCategory ? (
              <input
                type="text"
                required
                value={editProductForm.customCategoryName || ''}
                onChange={(e) => setEditProductForm(prev => ({ ...prev, customCategoryName: e.target.value }))}
                placeholder="Yangi kategoriya nomini yozing..."
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#263D33] text-[#172C28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#116B50]"
              />
            ) : (
              <select
                value={editProductForm.category}
                onChange={(e) => setEditProductForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#263D33] text-[#172C28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#116B50] cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
                {editProductForm.category && !categories.some(c => c.name === editProductForm.category) && (
                  <option value={editProductForm.category}>{editProductForm.category}</option>
                )}
              </select>
            )}
          </div>

          {/* Price & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#566A63] dark:text-[#8B9E95] mb-1">
                Narxi (so‘m) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="100"
                value={editProductForm.price || ''}
                onChange={(e) => setEditProductForm(prev => ({ ...prev, price: e.target.value }))}
                placeholder="Masalan: 12000"
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#263D33] text-[#172C28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#116B50]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#566A63] dark:text-[#8B9E95] mb-1">
                Birligi *
              </label>
              <select
                value={editProductForm.packUnit || ''}
                onChange={(e) => setEditProductForm(prev => ({ ...prev, packUnit: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#263D33] text-[#172C28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#116B50] cursor-pointer"
              >
                {(editProductForm.type === 'SERVICE' ? COMMON_UNITS_SERVICE : COMMON_UNITS_PRODUCT).map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#566A63] dark:text-[#8B9E95] mb-1">
                {editProductForm.type === 'SERVICE' ? 'Mavjudlik (1 yoki ko‘proq)' : 'Qoldiq (dona/kg)'}
              </label>
              <input
                type="number"
                min="0"
                value={editProductForm.stockOnHand || ''}
                onChange={(e) => setEditProductForm(prev => ({ ...prev, stockOnHand: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#263D33] text-[#172C28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#116B50]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#566A63] dark:text-[#8B9E95] mb-1">
                Brend (ixtiyoriy)
              </label>
              <input
                type="text"
                value={editProductForm.brand || ''}
                onChange={(e) => setEditProductForm(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="Masalan: Nestle, Artel"
                className="w-full px-3 py-2 rounded-xl text-sm bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#263D33] text-[#172C28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#116B50]"
              />
            </div>
          </div>

          {/* Barcode (For Products) */}
          {editProductForm.type === 'PRODUCT' && (
            <div>
              <label className="block text-xs font-bold text-[#566A63] dark:text-[#8B9E95] mb-1">
                Shtrix-kod (ixtiyoriy)
              </label>
              <input
                type="text"
                value={editProductForm.barcode || ''}
                onChange={(e) => setEditProductForm(prev => ({ ...prev, barcode: e.target.value }))}
                placeholder="47800..."
                className="w-full px-3 py-2 rounded-xl text-sm font-mono bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#263D33] text-[#172C28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#116B50]"
              />
            </div>
          )}

          {/* Photo Section */}
          <div className="bg-[#F8FAF9] dark:bg-[#182620] border border-[#DCE5DF] dark:border-[#22362C] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#172C28] dark:text-white flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                Mahsulot / Xizmat Rasmi
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setEditProductForm(prev => ({ ...prev, photoInputMode: 'file' }))}
                  className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                    editProductForm.photoInputMode === 'file'
                      ? 'bg-[#116B50] text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Fayldan
                </button>
                <button
                  type="button"
                  onClick={() => setEditProductForm(prev => ({ ...prev, photoInputMode: 'url' }))}
                  className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                    editProductForm.photoInputMode === 'url'
                      ? 'bg-[#116B50] text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  URL havola
                </button>
              </div>
            </div>

            {/* Current Photo Preview if present */}
            {editProductForm.photoUrl ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-[#DCE5DF] dark:border-[#22332C] bg-white group">
                <img
                  src={editProductForm.photoUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setEditProductForm(prev => ({ ...prev, photoUrl: '' }))}
                  className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-lg hover:bg-red-700 transition shadow cursor-pointer"
                  title="Rasmni o‘chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            {/* Photo Input (File or URL) */}
            {editProductForm.photoInputMode === 'file' ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 border-2 border-dashed border-[#116B50]/40 hover:border-[#116B50] rounded-xl text-xs font-bold text-[#116B50] dark:text-[#4ADE80] bg-emerald-50/50 dark:bg-[#1E3328]/40 hover:bg-emerald-50 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Qurilmadan rasm tanlash (kamera / galereya)
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-1">
                  Rasm avtomatik ravishda siqiladi va bazaga joylanadi
                </p>
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  value={editProductForm.photoUrl || ''}
                  onChange={(e) => setEditProductForm(prev => ({ ...prev, photoUrl: e.target.value }))}
                  placeholder="https://example.com/rasm.jpg"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#263D33] text-[#172C28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#116B50]"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#566A63] dark:text-[#8B9E95] mb-1">
              Tavsif yoki qo‘shimcha izoh (ixtiyoriy)
            </label>
            <textarea
              rows={2}
              value={editProductForm.description || ''}
              onChange={(e) => setEditProductForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mahsulot haqida qisqacha ma’lumot..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#263D33] text-[#172C28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#116B50]"
            />
          </div>

          {/* Modal Footer Buttons - Sticky so never cut off and always accessible */}
          <div className="sticky bottom-0 -mb-4 sm:-mb-6 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md border-t border-[#DCE5DF] dark:border-[#22332C] flex items-center justify-end gap-2.5 z-20 shadow-md mt-4">
            <button
              type="button"
              onClick={() => setIsEditProductModalOpen(false)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] text-xs font-bold text-[#566A63] dark:text-[#8B9E95] hover:bg-gray-100 dark:hover:bg-[#1E3328] transition cursor-pointer text-center justify-center"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmittingProductEdit}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#116B50] hover:bg-[#0E5943] text-white text-xs font-bold shadow transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmittingProductEdit ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              O‘zgarishlarni saqlash
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default AdminCategoriesHub;
