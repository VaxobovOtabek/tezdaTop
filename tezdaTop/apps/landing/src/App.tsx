import { TokenQuickLoginModal, LanguageSwitcher, useTranslation } from '@yaqintop/ui';
import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Store,
  Shield,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Zap,
  ChevronDown,
  Sparkles,
  Compass,
  FileSpreadsheet,
  Activity,
  Sun,
  Moon,
  Menu,
  X,
  Phone,
  Mail,
  Send,
  Star,
  Clock,
  Heart,
  Navigation,
  Check,
  ArrowRight,
  TrendingUp,
  Users,
  Package,
  Layers,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  QrCode,
  Tag,
  FileText
} from 'lucide-react';
import { MinimalCustomerMapWidget } from './components/MinimalCustomerMapWidget';

const UZBEKISTAN_REGIONS = [
  'Sirdaryo viloyati',
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
  'Jizzax viloyati',
  'Navoiy viloyati',
  'Qoraqalpog‘iston Resp.'
];

const CATEGORIES = [
  {
    id: 'food',
    name: 'Oziq-ovqat',
    count: '1 200+ do‘kon',
    countNumber: '1 200+',
    icon: '🛒',
    query: 'oziq-ovqat',
    img: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'pharmacy',
    name: 'Dorixonalar',
    count: '300+ do‘kon',
    countNumber: '300+',
    icon: '💊',
    query: 'dorixona',
    img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cafe',
    name: 'Kafe va restoran',
    count: '500+ do‘kon',
    countNumber: '500+',
    icon: '🍽️',
    query: 'kafe',
    img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'clothes',
    name: 'Kiyim-kechak',
    count: '400+ do‘kon',
    countNumber: '400+',
    icon: '👕',
    query: 'kiyim',
    img: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'tech',
    name: 'Maishiy texnika',
    count: '250+ do‘kon',
    countNumber: '250+',
    icon: '💻',
    query: 'texnika',
    img: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'auto',
    name: 'Avto va ehtiyot qismlar',
    count: '200+ do‘kon',
    countNumber: '200+',
    icon: '🚗',
    query: 'avto',
    img: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'build',
    name: 'Qurilish va ta’mirlash',
    count: '300+ do‘kon',
    countNumber: '300+',
    icon: '🔨',
    query: 'qurilish',
    img: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'other',
    name: 'Boshqa xizmatlar',
    count: '600+ do‘kon',
    countNumber: '600+',
    icon: '•••',
    query: '',
    img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&auto=format&fit=crop&q=80'
  }
];

const FEATURES = [
  {
    icon: Zap,
    title: 'Tez qidiruv',
    desc: 'Kerakli tovarni 1 soniyada toping. AI va geolokatsiya asosidagi aqlli izlash.',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  },
  {
    icon: MapPin,
    title: 'Interaktiv xarita',
    desc: 'Atrofdagi do‘konlar, narxlar va tovarlar to‘g‘ridan-to‘g‘ri xaritada ko‘rsatiladi.',
    color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
  },
  {
    icon: Tag,
    title: 'Narxlarni taqqoslash',
    desc: 'Bir nechta do‘konlardagi narxlarni solishtirib, eng maqbul va arzonini tanlang.',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  },
  {
    icon: Star,
    title: 'Reyting va sharhlar',
    desc: 'Haqiqiy mijozlar fikri va o‘zaro baholar asosida ishonchli do‘konlarni tanlang.',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
  },
  {
    icon: Navigation,
    title: 'Marshrut va navigatsiya',
    desc: 'Tanlangan do‘konga piyoda yoki avtomobilda eng tezkor va qulay yo‘lni ko‘rsatamiz.',
    color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
  },
  {
    icon: Heart,
    title: 'Sevimlilar',
    desc: 'Doimiy xarid qiladigan sevimli do‘konlar va tovarlarni bir zumda saqlab qo‘ying.',
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
  }
];

const TESTIMONIALS = [
  {
    name: 'Azizbek R.',
    role: 'Sirdaryo shahri',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    stars: 5,
    text: 'Juda qulay ilova! Endi kerakli tovarni qidirib vaqt yo‘qotmayman. Narxlarni taqqoslab, eng yaqin do‘kondan tezda topaman.'
  },
  {
    name: 'Madina K.',
    role: 'Guliston',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    stars: 5,
    text: 'Kafelarni va dorixonalarni topish juda osonlashdi. Sharhlar ham haqqoniy, borish uchun eng qulay marshrutni xaritada darhol ko‘rsatadi.'
  },
  {
    name: 'Dilshod T.',
    role: 'Tadbirkor / Do‘kon egasi',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    stars: 5,
    text: 'Biznesimiz uchun yangi mijozlar oqimi sezilarli oshdi. Do‘konimizni va tovarlarimizni qo‘shish jarayoni juda oddiy, tez va tushunarli.'
  }
];

const PORTALS = [
  {
    id: 'customer',
    url: '/customer',
    title: 'Xaridor Ilovasi',
    sub: 'Tovar qidirish, xarita va marshrut',
    icon: Search,
    color: 'bg-emerald-600 text-white hover:bg-emerald-700'
  },
  {
    id: 'merchant',
    url: '/owner',
    title: 'Do‘kon & Tadbirkor',
    sub: 'Tovarlar, kassa qoldiqlari, narxlar',
    icon: Store,
    color: 'bg-emerald-700 text-white hover:bg-emerald-800'
  },
  {
    id: 'moderator',
    url: '/moderator',
    title: 'Moderator Portali',
    sub: 'Do‘konlar arizasi, shikoyatlar, sharhlar',
    icon: ShieldCheck,
    color: 'bg-teal-700 text-white hover:bg-teal-800'
  },
  {
    id: 'admin',
    url: '/admin',
    title: 'Boshqaruv Admin',
    sub: 'Tizim nazorati, DB va qidiruv analitikasi',
    icon: Shield,
    color: 'bg-emerald-900 text-white hover:bg-black'
  }
];

export function LandingApp() {
  const { t, lang } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('yaqintop_theme') === 'dark';
  });
  const [selectedRegion, setSelectedRegion] = useState('Sirdaryo viloyati');
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hero Search Input
  const [heroSearch, setHeroSearch] = useState('');

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

  // Dynamic SEO meta tags and titles based on chosen language
  useEffect(() => {
    document.documentElement.lang = lang;
    const metaDesc = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogLocale = document.querySelector('meta[property="og:locale"]');

    if (lang === 'ru') {
      document.title = 'YaqinTop — Экосистема поиска местных товаров и магазинов | Узбекистан';
      const descRu = 'YaqinTop — Быстрый и точный поиск местных товаров, услуг и магазинов в Узбекистане. Сравнение цен на полках, остатки на складе и удобный маршрут.';
      if (metaDesc) metaDesc.setAttribute('content', descRu);
      if (ogTitle) ogTitle.setAttribute('content', 'YaqinTop — Поиск товаров и магазинов в Узбекистане');
      if (ogDesc) ogDesc.setAttribute('content', descRu);
      if (ogLocale) ogLocale.setAttribute('content', 'ru_RU');
    } else if (lang === 'en') {
      document.title = 'YaqinTop — Local Store & Product Search Ecosystem | Uzbekistan';
      const descEn = 'YaqinTop — Fast and accurate local product, service, and store discovery ecosystem in Uzbekistan. Shelf price comparison, live inventory, and directions.';
      if (metaDesc) metaDesc.setAttribute('content', descEn);
      if (ogTitle) ogTitle.setAttribute('content', 'YaqinTop — Local Product & Store Ecosystem');
      if (ogDesc) ogDesc.setAttribute('content', descEn);
      if (ogLocale) ogLocale.setAttribute('content', 'en_US');
    } else {
      document.title = 'YaqinTop — Mahalliy Tovar va Xizmatlar Qidiruv Ekotizimi | O‘zbekiston';
      const descUz = 'YaqinTop — O‘zbekistondagi eng tezkor va aniq mahalliy tovar, xizmat va do‘konlarni qidirish ekotizimi. Do‘konlar, narxlar va qulay marshrut.';
      if (metaDesc) metaDesc.setAttribute('content', descUz);
      if (ogTitle) ogTitle.setAttribute('content', 'YaqinTop — Mahalliy Tovar va Xizmatlar Qidiruv Ekotizimi');
      if (ogDesc) ogDesc.setAttribute('content', descUz);
      if (ogLocale) ogLocale.setAttribute('content', 'uz_UZ');
    }
  }, [lang]);

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = heroSearch.trim();
    if (query) {
      window.location.href = `/customer?q=${encodeURIComponent(query)}`;
    } else {
      window.location.href = '/customer';
    }
  };

  const handleQuickCategoryClick = (categoryName: string) => {
    window.location.href = `/customer?category=${encodeURIComponent(categoryName)}`;
  };

  const getShortRegionName = (regKey: string) => {
    const raw = t(regKey);
    let s = raw;
    s = s.replace(/город\s+/i, '');
    s = s.replace(/Республика\s+/i, '');
    s = s.replace('Сырдарьинская область', 'Сырдарья');
    s = s.replace('Ташкентская область', 'Ташкент обл.');
    s = s.replace('Самаркандская область', 'Самарканд');
    s = s.replace('Ферганская область', 'Фергана');
    s = s.replace('Андижанская область', 'Андижан');
    s = s.replace('Наманганская область', 'Наманган');
    s = s.replace('Бухарская область', 'Бухара');
    s = s.replace('Хорезмская область', 'Хорезм');
    s = s.replace('Кашкадарьинская область', 'Кашкадарья');
    s = s.replace('Сурхандарьинская область', 'Сурхандарья');
    s = s.replace('Джизакская область', 'Джизак');
    s = s.replace('Навоийская область', 'Навои');
    s = s.replace(/ская область/i, '');
    s = s.replace(/инская область/i, '');
    s = s.replace(/ viloyati/i, '');
    s = s.replace(/ shahri/i, '');
    s = s.replace(/ область/i, '');
    s = s.replace(/ region/i, '');
    s = s.replace(/ city/i, '');
    return s.trim();
  };

  const displayRegion = getShortRegionName(selectedRegion);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 overflow-x-hidden w-full max-w-full ${isDarkMode ? 'dark bg-[#0A120E] text-[#E8F2EC]' : 'bg-[#FAFCFA] text-[#172C28]'}`}>
      {/* Subtle Background Glow Elements */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[450px] bg-gradient-to-b from-[#116B50]/15 via-[#22C55E]/10 to-transparent blur-[140px] pointer-events-none -z-10" />

      {/* HEADER / NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0E1713]/95 backdrop-blur-md border-b border-[#DCE5DF] dark:border-[#22332C] px-2.5 sm:px-6 lg:px-12 py-2 sm:py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Logo & Brand */}
          <a href="#" className="flex items-center gap-1.5 sm:gap-3 shrink-0 group">
            <img
              src="/favicon.png"
              alt="YaqinTop"
              className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl shadow-md shadow-[#116B50]/20 group-hover:scale-105 transition object-contain"
            />
            <div>
              <div className="font-extrabold text-sm sm:text-xl tracking-tight text-[#172C28] dark:text-white flex items-center gap-1 leading-none">
                <span>YaqinTop</span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#116B50] dark:bg-[#4ADE80] animate-pulse" />
              </div>
              <p className="text-[10px] text-[#566A63] dark:text-[#8B9E95] font-medium tracking-tight mt-0.5 hidden min-[480px]:block">
                {t('Mahalliy tovar va xizmatlar ekotizimi')}
              </p>
            </div>
          </a>

          {/* Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-[#566A63] dark:text-[#9CB3A8]">
            <a href="#portals" className="text-[#116B50] dark:text-[#4ADE80] font-bold hover:underline transition">{t('Portallar')}</a>
            <a href="#features" className="hover:text-[#116B50] dark:hover:text-[#4ADE80] transition">{t('Platforma')}</a>
            <a href="#interactive-map" className="hover:text-[#116B50] dark:hover:text-[#4ADE80] transition">{t('map', 'Xarita')}</a>
            <a href="#categories" className="hover:text-[#116B50] dark:hover:text-[#4ADE80] transition">{t('stores', 'Do‘konlar')}</a>
            <a href="#for-business" className="hover:text-[#116B50] dark:hover:text-[#4ADE80] transition">{t('Bizneslar uchun')}</a>
            <a href="#how-it-works" className="hover:text-[#116B50] dark:hover:text-[#4ADE80] transition">{t('Foydali')}</a>
            <a href="#testimonials" className="hover:text-[#116B50] dark:hover:text-[#4ADE80] transition">{t('Biz haqimizda')}</a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Region Selector Button */}
            <button
              type="button"
              onClick={() => setIsRegionModalOpen(true)}
              className="flex items-center gap-1 px-1.5 py-1 sm:px-3 sm:py-2 h-8 sm:h-9 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#F3F6F3] dark:hover:bg-[#1C2E26] text-[11px] sm:text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
            >
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
              <span className="max-w-[46px] min-[360px]:max-w-[62px] min-[400px]:max-w-[85px] sm:max-w-[120px] truncate">{displayRegion}</span>
              <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#566A63] dark:text-[#8B9E95] shrink-0" />
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              title={isDarkMode ? t('light_theme', "Yorug' tema") : t('dark_theme', "Qorong'i tema")}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#F3F6F3] dark:hover:bg-[#1C2E26] transition flex items-center justify-center shadow-2xs shrink-0 cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#116B50]" />}
            </button>

            {/* Kirish / Portal Switcher Button */}
            <button
              onClick={() => setIsPortalModalOpen(true)}
              className="h-8 sm:h-9 px-2.5 sm:px-4 rounded-xl bg-[#116B50] hover:bg-[#0D533E] active:scale-95 text-white text-[11px] sm:text-xs font-bold transition shadow-sm flex items-center gap-1 sm:gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <span>{t('login')}</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 p-1 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-[#172C28] dark:text-white flex items-center justify-center shadow-2xs shrink-0 cursor-pointer"
              aria-label={t('Menyuni ochish', 'Menyuni ochish')}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 text-rose-500" /> : <Menu className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden max-w-7xl mx-auto mt-3 pt-3 border-t border-[#DCE5DF] dark:border-[#22332C] flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1 text-xs font-semibold text-[#172C28] dark:text-[#E8F2EC]">
              <a href="#portals" onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg bg-[#E0EFE7]/50 dark:bg-[#1B2F25] text-[#116B50] dark:text-[#4ADE80] font-bold">{t('Tizim Portallari (Kirish)')}</a>
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-[#E0EFE7] dark:hover:bg-[#1B2F25]">{t('Platforma haqida')}</a>
              <a href="#interactive-map" onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-[#E0EFE7] dark:hover:bg-[#1B2F25]">{t('map', 'Xarita')}</a>
              <a href="#categories" onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-[#E0EFE7] dark:hover:bg-[#1B2F25]">{t('stores', 'Do‘konlar')}</a>
              <a href="#for-business" onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-[#E0EFE7] dark:hover:bg-[#1B2F25]">{t('Bizneslar uchun')}</a>
              <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-[#E0EFE7] dark:hover:bg-[#1B2F25]">{t('Foydali')}</a>
              <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-[#E0EFE7] dark:hover:bg-[#1B2F25]">{t('Biz haqimizda')}</a>
            </div>

            <div className="pt-2 border-t border-[#DCE5DF]/60 dark:border-[#22332C]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#566A63] dark:text-[#8B9E95] mb-2">
                {t('Ilovalar & Portallar', 'Ilovalar & Portallar')}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PORTALS.map((p) => (
                  <a
                    key={p.id}
                    href={p.url}
                    className="p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] flex items-center gap-2 text-xs font-bold text-[#172C28] dark:text-white"
                  >
                    <p.icon className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                    <span className="truncate">{t(p.title)}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-10 md:pt-14 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Heading, Search & Category chips */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E0EFE7] dark:bg-[#162A20] border border-[#116B50]/30 dark:border-[#4ADE80]/30 text-[#116B50] dark:text-[#4ADE80] text-xs font-bold mb-4 sm:mb-6 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{t('landing_badge')}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold tracking-tight text-[#172C28] dark:text-white leading-[1.2] sm:leading-[1.15]">
              {t('landing_hero_title')}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-base md:text-lg text-[#566A63] dark:text-[#9CB3A8] mt-3 sm:mt-5 max-w-xl leading-relaxed font-medium">
              {t('landing_hero_subtitle')}
            </p>

            {/* Big Interactive Search Form */}
            <form onSubmit={handleHeroSearchSubmit} className="w-full mt-5 sm:mt-8 max-w-2xl">
              <div className="p-1.5 sm:p-2.5 bg-white dark:bg-[#14201A] border-2 border-[#116B50]/30 dark:border-[#4ADE80]/30 hover:border-[#116B50] dark:hover:border-[#4ADE80] focus-within:border-[#116B50] rounded-2xl sm:rounded-3xl shadow-lg shadow-[#116B50]/10 flex items-center gap-1.5 sm:gap-2 transition duration-200">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#566A63] dark:text-[#8B9E95] ml-2 shrink-0" />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder={t('Masalan: snikers, non, dorixona...')}
                  className="w-full min-w-0 bg-transparent text-xs sm:text-base text-[#172C28] dark:text-white placeholder-[#8B9E95] focus:outline-none px-1.5 sm:px-2 font-medium"
                />
                <button
                  type="submit"
                  className="px-4 sm:px-7 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#116B50] hover:bg-[#0D533E] active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-md"
                >
                  <Search className="w-3.5 h-3.5 hidden sm:inline" />
                  <span>{t('search')}</span>
                </button>
              </div>
            </form>

            {/* Quick Category Pills Row */}
            <div className="mt-3.5 sm:mt-5 flex flex-wrap items-center gap-1.5 sm:gap-2 max-w-full w-full">
              {[
                { icon: '🛒', label: 'Oziq-ovqat', query: 'Oziq-ovqat' },
                { icon: '💊', label: 'Dorixonalar', query: 'Dorixonalar' },
                { icon: '🍽️', label: 'Kafe va restoran', query: 'Kafe' },
                { icon: '👕', label: 'Kiyim-kechak', query: 'Kiyim' },
                { icon: '💻', label: 'Maishiy texnika', query: 'Texnika' },
                { icon: '•••', label: 'Boshqa', query: '' }
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickCategoryClick(item.query)}
                  className="px-2.5 py-1 sm:px-3.5 sm:py-2 rounded-xl bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#273B32] hover:border-[#116B50] dark:hover:border-[#4ADE80] hover:bg-[#E0EFE7]/50 text-[11px] sm:text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] flex items-center gap-1 sm:gap-1.5 transition shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{item.icon}</span>
                  <span>{t(item.label)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Realistic 3D App Smartphone Mockup with Annotations */}
          <div className="lg:col-span-5 relative flex items-center justify-center mt-6 lg:mt-0 px-2 sm:px-0">
            {/* Background Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#116B50]/20 to-[#22C55E]/20 rounded-full blur-3xl pointer-events-none" />

            {/* Isometric Store Decor behind Phone */}
            <div className="hidden sm:block absolute -right-4 -bottom-6 w-36 h-36 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-950/40 dark:to-[#1C2620] rounded-3xl border border-amber-300/50 dark:border-amber-800/40 p-3 shadow-xl transform rotate-6 z-0">
              <div className="w-full h-full bg-[#116B50] rounded-2xl flex flex-col items-center justify-center text-white text-center p-2 shadow-inner">
                <Store className="w-8 h-8 mb-1" />
                <span className="text-[11px] font-black uppercase tracking-wider">{t('DO‘KON')}</span>
                <span className="text-[9px] text-emerald-200">{t('280 m yaqin')}</span>
              </div>
            </div>

            {/* Hand-drawn Playful Annotation 1: Top Right */}
            <div className="hidden md:flex absolute -top-3 -right-6 items-center gap-2 text-xs font-extrabold text-[#116B50] dark:text-[#4ADE80] bg-white/90 dark:bg-[#14201A]/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[#116B50]/20 shadow-md z-30 animate-bounce duration-1000">
              <span>{t('Do‘konlarni xaritada ko‘ring 📍')}</span>
            </div>

            {/* Hand-drawn Playful Annotation 2: Middle Right */}
            <div className="hidden lg:flex absolute top-1/2 -right-8 items-center gap-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-white/90 dark:bg-[#14201A]/90 backdrop-blur-sm px-3 py-1 rounded-full border border-emerald-500/20 shadow-md z-30">
              <span>{t('Narxlarni taqqoslang 🏷️')}</span>
            </div>

            {/* Smartphone Frame */}
            <div className="relative w-full max-w-[280px] min-[360px]:max-w-[295px] sm:max-w-[325px] h-[520px] sm:h-[620px] rounded-[38px] sm:rounded-[48px] bg-slate-900 border-[7px] sm:border-[8px] border-slate-800 shadow-2xl overflow-hidden z-10 ring-1 ring-white/20 flex flex-col mx-auto">
              {/* Dynamic Island / Speaker Notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-40 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              </div>

              {/* In-Phone App Screen View */}
              <div className="w-full h-full bg-[#EDF2EE] dark:bg-[#0E1713] flex flex-col overflow-hidden relative text-xs">
                {/* Phone In-App Header */}
                <div className="pt-8 px-3.5 pb-2.5 bg-white dark:bg-[#16241E] border-b border-[#DCE5DF] dark:border-[#22332C] shadow-xs">
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div className="font-extrabold text-[#116B50] dark:text-[#4ADE80] flex items-center gap-1 text-sm">
                      <span className="w-2 h-2 rounded-full bg-[#116B50] dark:bg-[#4ADE80]" />
                      <span>YaqinTop</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[#566A63] dark:text-[#8B9E95] font-semibold">
                      <span>📍 {displayRegion}</span>
                    </div>
                  </div>

                  {/* Phone Search Bar */}
                  <div className="flex items-center gap-2 bg-[#F3F6F3] dark:bg-[#1E2E26] rounded-xl px-2.5 py-1.5 border border-[#DCE5DF] dark:border-[#2A3F36]">
                    <Search className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                    <span className="font-bold text-[#172C28] dark:text-white">Snikers (50g)</span>
                  </div>

                  {/* Filter chips inside mockup */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 pb-0.5 no-scrollbar text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-[#116B50] text-white font-bold">📍 {displayRegion}</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] font-bold">⚡ 1 km</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#566A63] font-semibold">⭐ {t('ratings_filter', 'Reyting')}</span>
                  </div>
                </div>

                {/* Simulated Map Background */}
                <div className="flex-1 relative bg-[#E6ECE8] dark:bg-[#121E18] overflow-hidden">
                  {/* Subtle Grid / Roads */}
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#116B50_1px,transparent_1px)] [background-size:16px_16px]" />

                  {/* Pulsing GPS Radar Ring (User location) */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 border-dashed border-[#116B50]/60 dark:border-[#4ADE80]/60 bg-[#116B50]/10 pointer-events-none" />

                  {/* User Pin */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-[9px] font-bold z-10 animate-pulse">
                    📍
                  </div>

                  {/* Floating Nearby Pin 1 */}
                  <div className="absolute top-12 left-8 bg-[#116B50] text-white px-2 py-0.5 rounded-full shadow-md text-[9px] font-bold flex items-center gap-1">
                    <span>🏪 150m</span>
                  </div>

                  {/* Floating Nearby Pin 2 */}
                  <div className="absolute top-20 right-8 bg-[#116B50] text-white px-2 py-0.5 rounded-full shadow-md text-[9px] font-bold flex items-center gap-1">
                    <span>🏪 420m</span>
                  </div>

                  {/* FLOATING HERO STORE CARD */}
                  <div className="absolute top-6 left-3 right-3 bg-white dark:bg-[#16241E] rounded-2xl p-2.5 border border-[#DCE5DF] dark:border-[#273B32] shadow-xl z-20 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&auto=format&fit=crop&q=80"
                        alt="Baraka Market"
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-xs text-[#172C28] dark:text-white truncate">Baraka Market</h4>
                          <span className="text-[10px] text-amber-500 font-bold flex items-center">
                            ⭐ 4.8
                          </span>
                        </div>
                        <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] block">
                          📍 {t('280 m yaqin')} · {t('Ochiq')}
                        </span>
                        <div className="text-xs font-extrabold text-[#116B50] dark:text-[#4ADE80] mt-0.5">
                          12 000 {t('currency', 'so‘m')} <span className="text-[9px] text-[#6E827B] font-normal">/ {t('dona')}</span>
                        </div>
                      </div>
                    </div>

                    <a
                      href="/customer"
                      className="w-full py-1.5 rounded-xl bg-[#116B50] text-white font-bold text-center text-[10px] hover:bg-[#0D533E] transition shadow-xs flex items-center justify-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>{t('Yo‘l-yo‘riq (Marshrut)')}</span>
                    </a>
                  </div>

                  {/* FLOATING PRICE COMPARISON DRAWER AT BOTTOM */}
                  <div className="absolute bottom-2 left-2 right-2 bg-white/95 dark:bg-[#16241E]/95 backdrop-blur-md rounded-2xl p-2.5 border border-[#DCE5DF] dark:border-[#273B32] shadow-lg flex flex-col gap-1.5 z-20">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#566A63] dark:text-[#8B9E95]">
                      <span>{t('Yaqin narxlar taqqosi:')}</span>
                      <span className="text-[#116B50] dark:text-[#4ADE80]">{t('3 ta do‘kon')}</span>
                    </div>

                    <div className="flex flex-col divide-y divide-[#DCE5DF]/60 dark:divide-[#273B32] text-[10px]">
                      <div className="py-1 flex items-center justify-between">
                        <span className="font-semibold text-[#172C28] dark:text-[#E8F2EC] truncate">1. Iftixor Savdo</span>
                        <span className="font-extrabold text-[#116B50] dark:text-[#4ADE80] shrink-0">11 500 {t('currency', 'so‘m')} · 150m</span>
                      </div>
                      <div className="py-1 flex items-center justify-between">
                        <span className="font-semibold text-[#172C28] dark:text-[#E8F2EC] truncate">2. Olmazor Market</span>
                        <span className="font-extrabold text-[#116B50] dark:text-[#4ADE80] shrink-0">12 500 {t('currency', 'so‘m')} · 420m</span>
                      </div>
                      <div className="py-1 flex items-center justify-between">
                        <span className="font-semibold text-[#172C28] dark:text-[#E8F2EC] truncate">3. Mini Market 24/7</span>
                        <span className="font-extrabold text-[#116B50] dark:text-[#4ADE80] shrink-0">12 500 {t('currency', 'so‘m')} · 680m</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS STRIP / KEY VALUE PROPS (4 Cards) */}
      <section className="px-3 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full my-4 sm:my-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
          <div className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex items-center gap-2.5 sm:gap-3.5 hover:border-[#116B50]/40 transition min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm sm:text-lg md:text-xl font-extrabold text-[#172C28] dark:text-white leading-tight truncate">50m – 3km</div>
              <div className="text-[10px] sm:text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5 font-medium truncate">{t('Qidiruv radiusi')}</div>
            </div>
          </div>

          <div className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex items-center gap-2.5 sm:gap-3.5 hover:border-[#116B50]/40 transition min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm sm:text-lg md:text-xl font-extrabold text-[#116B50] dark:text-[#4ADE80] leading-tight truncate">&lt; 30 ms</div>
              <div className="text-[10px] sm:text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5 font-medium truncate">{t('Tezkor javob')}</div>
            </div>
          </div>

          <div className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex items-center gap-2.5 sm:gap-3.5 hover:border-[#116B50]/40 transition min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm sm:text-lg md:text-xl font-extrabold text-[#172C28] dark:text-white leading-tight truncate">Real-time</div>
              <div className="text-[10px] sm:text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5 font-medium truncate">{t('Kassa qoldiqlari')}</div>
            </div>
          </div>

          <a
            href="#portals"
            className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex items-center gap-2.5 sm:gap-3.5 hover:border-[#116B50] dark:hover:border-[#4ADE80] transition group cursor-pointer min-w-0"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
              <Layers className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm sm:text-lg md:text-xl font-extrabold text-[#116B50] dark:text-[#4ADE80] leading-tight flex items-center gap-1">
                <span className="truncate">{t('4 Portal')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition shrink-0" />
              </div>
              <div className="text-[10px] sm:text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5 font-medium truncate">{t('Barchasi')}</div>
            </div>
          </a>
        </div>
      </section>

      {/* 2.5. TIZIM PORTALLARI (Xaridor, Do'kon egasi, Moderator, Admin) */}
      <section id="portals" className="py-10 sm:py-14 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0EFE7] dark:bg-[#162A20] text-[#116B50] dark:text-[#4ADE80] text-xs font-bold mb-3 shadow-2xs">
            <Layers className="w-3.5 h-3.5" />
            <span>{t('Tizim Portallari & Ilovalar')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#172C28] dark:text-white tracking-tight">
            {t('Qaysi rolda kirmoqchisiz?')}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#566A63] dark:text-[#8B9E95] mt-2.5 font-medium max-w-lg">
            {t('Xaridorlar, do‘kon egalari, moderatorlar va tizim ma’murlari uchun 4 ta alohida moslashtirilgan portal:')}
          </p>
        </div>

        {/* 4 Ta Katta Portal Kartochkasi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* 1. Xaridor Ilovasi */}
          <div className="group rounded-3xl bg-white dark:bg-[#14201A] border-2 border-[#DCE5DF] dark:border-[#22332C] hover:border-[#116B50] dark:hover:border-[#4ADE80] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition shadow-2xs">
                  <Search className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  {t('role_customer', 'Xaridor')}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-[#172C28] dark:text-white group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] transition">
                {t('Xaridor Ilovasi')}
              </h3>
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-2.5 leading-relaxed font-medium">
                {t('Kerakli tovar va xizmatlarni 1 soniyada qidirish, yaqin do‘konlar, kassa narxlarini taqqoslash va xaritada marshrut olish.')}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#DCE5DF]/60 dark:border-white/10">
              <a
                href="/customer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#116B50] hover:bg-[#0D533E] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>{t('Xaridor sifatida kirish')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </a>
            </div>
          </div>

          {/* 2. Do'kon & Tadbirkor Kabineti */}
          <div className="group rounded-3xl bg-white dark:bg-[#14201A] border-2 border-[#DCE5DF] dark:border-[#22332C] hover:border-[#116B50] dark:hover:border-[#4ADE80] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition shadow-2xs">
                  <Store className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                  {t('role_merchant', 'Tadbirkor')}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-[#172C28] dark:text-white group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] transition">
                {t('Do‘kon & Tadbirkor')}
              </h3>
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-2.5 leading-relaxed font-medium">
                {t('Do‘kon va filiallar ma’lumotlari, tovar va xizmatlar narxi, kassa qoldiqlari, Excel import va yangi mijozlar oqimi.')}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#DCE5DF]/60 dark:border-white/10">
              <a
                href="/owner"
                className="w-full py-2.5 px-4 rounded-xl bg-[#0F5A44] hover:bg-[#0B4534] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>{t('Do‘kon egasi sifatida kirish')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </a>
            </div>
          </div>

          {/* 3. Moderator Portali */}
          <div className="group rounded-3xl bg-white dark:bg-[#14201A] border-2 border-[#DCE5DF] dark:border-[#22332C] hover:border-[#116B50] dark:hover:border-[#4ADE80] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition shadow-2xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  {t('role_moderator', 'Moderator')}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-[#172C28] dark:text-white group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] transition">
                {t('Moderator Portali')}
              </h3>
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-2.5 leading-relaxed font-medium">
                {t('Yangi ochilgan do‘konlar arizalarini tekshirish, xaridorlar e’tirozlari, sharhlar nazorati va ma’lumotlar to‘g‘riligi.')}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#DCE5DF]/60 dark:border-white/10">
              <a
                href="/moderator"
                className="w-full py-2.5 px-4 rounded-xl bg-[#116B50] hover:bg-[#0D533E] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>{t('Moderator sifatida kirish')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </a>
            </div>
          </div>

          {/* 4. Admin Paneli */}
          <div className="group rounded-3xl bg-white dark:bg-[#14201A] border-2 border-[#DCE5DF] dark:border-[#22332C] hover:border-[#116B50] dark:hover:border-[#4ADE80] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition shadow-2xs">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                  {t('role_admin', 'Administrator')}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-[#172C28] dark:text-white group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] transition">
                {t('Boshqaruv Admin')}
              </h3>
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-2.5 leading-relaxed font-medium">
                {t('Tizim umumiy nazorati, butun shahar bo‘yicha qidiruv analitikasi, ma’lumotlar bazasi, rollar va xavfsizlik arxitekturasi.')}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#DCE5DF]/60 dark:border-white/10">
              <a
                href="/admin"
                className="w-full py-2.5 px-4 rounded-xl bg-[#0A3D2E] hover:bg-[#06291F] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>{t('Admin sifatida kirish')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "HAR KUNI KERAKLI NARSALAR ENDI YANADA YAQIN!" (Nima uchun YaqinTop?) */}
      <section id="features" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0EFE7] dark:bg-[#162A20] text-[#116B50] dark:text-[#4ADE80] text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('Nima uchun YaqinTop?')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#172C28] dark:text-white tracking-tight">
            {t('Har kuni kerakli narsalar endi yanada yaqin!')}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#566A63] dark:text-[#8B9E95] mt-3 font-medium">
            {t('Vaqtingizni tejang, eng yaxshi narxlarni toping va atrofingizdagi ishonchli do‘konlarni kashf eting.')}
          </p>
        </div>

        {/* 6 Feature Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {FEATURES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] hover:border-[#116B50]/40 dark:hover:border-[#4ADE80]/40 transition shadow-sm hover:shadow-md flex flex-col gap-3 group"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${item.color} group-hover:scale-110 transition shadow-2xs`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-[#172C28] dark:text-white">
                  {t(item.title)}
                </h3>
                <p className="text-xs sm:text-sm text-[#566A63] dark:text-[#8B9E95] leading-relaxed font-medium">
                  {t(item.desc)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. YAQINTOP RAQAMLARDA (Stats Banner) */}
      <section className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full my-4 sm:my-6">
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#0F3E2F] via-[#115E46] to-[#0A3326] p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-2xl shrink-0">
              🛡️
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">{t('YaqinTop raqamlarda')}</h3>
              <p className="text-xs text-emerald-200 mt-0.5">{t('O‘zbekiston bo‘ylab real ko‘rsatkichlar')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 w-full md:w-auto text-center md:text-left">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">10 000+</div>
              <div className="text-xs text-emerald-200 mt-0.5 font-medium">{t('Foydalanuvchilar')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">500+</div>
              <div className="text-xs text-emerald-200 mt-0.5 font-medium">{t('Do‘konlar')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">50 000+</div>
              <div className="text-xs text-emerald-200 mt-0.5 font-medium">{t('Tovarlar')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-300">4.8 / 5</div>
              <div className="text-xs text-emerald-200 mt-0.5 font-medium">{t('O‘rtacha reyting')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. "JUDA OSON — 3 QADAMDA" (Qanday ishlaydi?) */}
      <section id="how-it-works" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: 3 Steps (6 cols) */}
          <div className="lg:col-span-6 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0EFE7] dark:bg-[#162A20] text-[#116B50] dark:text-[#4ADE80] text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('Qanday ishlaydi?')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#172C28] dark:text-white tracking-tight">
              {t('Juda oson — 3 qadamda')}
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-[#566A63] dark:text-[#8B9E95] mt-2 font-medium">
              {t('Kerakli tovarni topish endi bir necha soniya masala.')}
            </p>

            <div className="flex flex-col gap-3.5 sm:gap-4 mt-6 sm:mt-8 w-full">
              {[
                {
                  step: '1',
                  icon: Search,
                  title: 'Qidiring',
                  desc: 'Kerakli tovar yoki xizmat nomini qidiruv maydoniga yozing.'
                },
                {
                  step: '2',
                  icon: Tag,
                  title: 'Tanlang',
                  desc: 'Eng yaqin do‘konlarni, kassa narxlarini va xaridorlar sharhlarini ko‘ring.'
                },
                {
                  step: '3',
                  icon: Navigation,
                  title: 'Yo‘l oling',
                  desc: 'Tanlangan do‘konga qulay marshrut oling va xaridni amalga oshiring.'
                }
              ].map((s) => (
                <div
                  key={s.step}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex items-start gap-4 hover:border-[#116B50]/40 transition"
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#116B50] to-[#22C55E] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#172C28] dark:text-white flex items-center gap-2">
                      <span>{t(s.title)}</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-[#566A63] dark:text-[#8B9E95] mt-1 font-medium leading-relaxed">
                      {t(s.desc)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Supermarket Visual & Benefits (6 cols) */}
          <div className="lg:col-span-6 relative flex flex-col items-center">
            <div className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-[#16241E]">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80"
                alt="YaqinTop do‘konlar va xarid jarayoni"
                className="w-full h-[280px] sm:h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

              {/* Floating Price Badge */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border border-emerald-500/30 shadow-lg flex items-center gap-2">
                <span className="p-1 rounded-lg bg-[#116B50] text-white text-[10px]">📍</span>
                <div>
                  <span className="text-[11px] font-bold text-[#172C28] dark:text-white block">Snikers (50g)</span>
                  <span className="text-xs font-black text-[#116B50] dark:text-[#4ADE80]">12 000 {t('currency', 'so‘m')} · 280 m</span>
                </div>
              </div>

              {/* Floating Benefits Card on Bottom */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/20 shadow-xl grid grid-cols-2 gap-2 sm:gap-2.5 text-[11px] sm:text-xs font-bold text-[#116B50] dark:text-[#4ADE80]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[#172C28] dark:text-white truncate">{t('Tezroq xarid')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[#172C28] dark:text-white truncate">{t('Kamroq vaqt')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[#172C28] dark:text-white truncate">{t('Yaqin do‘konlar')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[#172C28] dark:text-white truncate">{t('Eng yaxshi narx')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. "BARCHA KERAKLI TOVAR VA XIZMATLAR" (Asosiy kategoriyalar) */}
      <section id="categories" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0EFE7] dark:bg-[#162A20] text-[#116B50] dark:text-[#4ADE80] text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('Asosiy kategoriyalar')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#172C28] dark:text-white tracking-tight">
            {t('Barcha kerakli tovar va xizmatlar')}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#566A63] dark:text-[#8B9E95] mt-2 font-medium">
            {t('Oziq-ovqatdan tortib ta’mirlash va maishiy texnikagacha')}
          </p>
        </div>

        {/* Categories Grid (8 Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.id}
              href={`/customer?category=${encodeURIComponent(cat.query || cat.name)}`}
              className="group bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] hover:border-[#116B50] dark:hover:border-[#4ADE80] rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col justify-between shadow-2xs hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="w-full h-28 sm:h-36 rounded-xl sm:rounded-2xl overflow-hidden bg-[#F3F6F3] dark:bg-[#18261F] relative mb-3">
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 text-white backdrop-blur-sm text-xs font-bold">
                  {cat.icon}
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-xs sm:text-sm text-[#172C28] dark:text-white group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] transition truncate">
                  {t(cat.name)}
                </h4>
                <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] block mt-0.5">
                  {cat.countNumber} {t('dokon_count', 'do‘kon')}
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 7. "ATROFINGIZDAGI BARCHA DO'KONLAR BIR XARITADA" (Interaktiv xarita) */}
      <section id="interactive-map" className="py-10 sm:py-16 px-3 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 shadow-sm flex flex-col gap-5 sm:gap-8">
          {/* Header Row: Title, Description & CTA */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 pb-2 border-b border-[#DCE5DF]/60 dark:border-[#22332C]">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0EFE7] dark:bg-[#162A20] text-[#116B50] dark:text-[#4ADE80] text-xs font-bold mb-2 sm:mb-3">
                <Compass className="w-3.5 h-3.5" />
                <span>{t('Interaktiv xarita')}</span>
              </div>
              <h3 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-[#172C28] dark:text-white tracking-tight leading-tight">
                {t('Atrofingizdagi barcha do‘konlar bir xaritada')}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-[#566A63] dark:text-[#8B9E95] mt-1.5 sm:mt-2 leading-relaxed font-medium">
                {t('Real vaqt rejimida do‘konlar, narxlar, tovarlar va xizmatlar. Sizga eng yaqin va qulay variantlarni xaritada ko‘ring.')}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <a
                href="/customer"
                className="w-full sm:w-auto justify-center px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-[#116B50] hover:bg-[#0D533E] active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-md cursor-pointer"
              >
                <span>{t('Xaritani to‘liq ochish')}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Interactive Map Widget (Full Width) */}
          <MinimalCustomerMapWidget isDarkMode={isDarkMode} />

          {/* 4 Feature Badges Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 pt-2">
            <div className="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-[#F9FAF9] dark:bg-[#18261F] border border-[#DCE5DF]/60 dark:border-[#263D31] text-[11px] sm:text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]">
              <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">{t('Real vaqt ma’lumotlari')}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-[#F9FAF9] dark:bg-[#18261F] border border-[#DCE5DF]/60 dark:border-[#263D31] text-[11px] sm:text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]">
              <MapPin className="w-4 h-4 text-teal-500 shrink-0" />
              <span className="truncate">{t('Aniq geolokatsiya')}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-[#F9FAF9] dark:bg-[#18261F] border border-[#DCE5DF]/60 dark:border-[#263D31] text-[11px] sm:text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]">
              <Navigation className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">{t('Qulay marshrut')}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-[#F9FAF9] dark:bg-[#18261F] border border-[#DCE5DF]/60 dark:border-[#263D31] text-[11px] sm:text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]">
              <Store className="w-4 h-4 text-teal-500 shrink-0" />
              <span className="truncate">{t('Do‘kon tafsilotlari')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. BIZNESLAR UCHUN (Tadbirkorlar & Do'kon qo'shish) */}
      <section id="for-business" className="py-10 sm:py-16 px-3 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#116B50]/10 via-emerald-50/50 to-teal-50/30 dark:from-[#11241C] dark:via-[#0F1E17] dark:to-[#0A1611] border border-[#116B50]/30 p-5 sm:p-10 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="max-w-xl w-full text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#116B50]/15 text-[#116B50] dark:text-[#4ADE80] text-xs font-bold mb-2.5 sm:mb-3">
              <Store className="w-3.5 h-3.5" />
              <span>{t('Bizneslar & Do‘kon egalari uchun')}</span>
            </div>
            <h3 className="text-xl sm:text-3xl font-extrabold text-[#172C28] dark:text-white tracking-tight">
              {t('O‘z do‘koningizni YaqinTop tarmog‘iga bepul qo‘shing')}
            </h3>
            <p className="text-xs sm:text-sm text-[#566A63] dark:text-[#8B9E95] mt-2 font-medium leading-relaxed">
              {t('Kuniga minglab yaqin atrofdagi xaridorlar sizning mahsulotlaringizni xaritada ko‘rishadi. Excel orqali tovarlarni yuklang, narxlarni yangilang va savdoni oshiring.')}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 mt-5 sm:mt-6 w-full sm:w-auto">
              <a
                href="/owner"
                className="justify-center px-5 py-2.5 rounded-xl bg-[#116B50] hover:bg-[#0D533E] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-sm"
              >
                <Store className="w-4 h-4" />
                <span>{t('Do‘kon kabinetini ochish')}</span>
              </a>
              <a
                href="/moderator"
                className="justify-center px-4 py-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-xs font-bold text-[#172C28] dark:text-white hover:bg-[#F3F6F3] transition flex items-center gap-2"
              >
                <span>{t('Moderatsiya arizasi')}</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full lg:w-auto">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#273B32] shadow-2xs text-center">
              <span className="text-2xl mb-1 block">⚡</span>
              <span className="font-extrabold text-xs text-[#172C28] dark:text-white block">{t('3 daqiqada')}</span>
              <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">{t('Onboarding')}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#273B32] shadow-2xs text-center">
              <span className="text-2xl mb-1 block">📊</span>
              <span className="font-extrabold text-xs text-[#172C28] dark:text-white block">{t('Excel Import')}</span>
              <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">{t('Ommaviy yuklash')}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#273B32] shadow-2xs text-center">
              <span className="text-2xl mb-1 block">💬</span>
              <span className="font-extrabold text-xs text-[#172C28] dark:text-white block">{t('SMS Tasdiq')}</span>
              <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">{t('Telegram Bot')}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#273B32] shadow-2xs text-center">
              <span className="text-2xl mb-1 block">🎯</span>
              <span className="font-extrabold text-xs text-[#172C28] dark:text-white block">{t('100% Aniq')}</span>
              <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">{t('Lokal mijozlar')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. MIJOZLARIMIZ BIZ HAQIMIZDA (Reviews) */}
      <section id="testimonials" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0EFE7] dark:bg-[#162A20] text-[#116B50] dark:text-[#4ADE80] text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('Foydalanuvchilar fikri')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#172C28] dark:text-white tracking-tight">
            {t('Mijozlarimiz biz haqimizda')}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#566A63] dark:text-[#8B9E95] mt-2 font-medium">
            {t('Aholi va do‘kon egalarining samimiy baholari')}
          </p>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((tItem, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={tItem.avatar}
                    alt={tItem.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-[#116B50]/30 shrink-0"
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-[#172C28] dark:text-white">{tItem.name}</h4>
                    <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] block">{t(tItem.role)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-2.5">
                  {[...Array(tItem.stars)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-[#566A63] dark:text-[#8B9E95] leading-relaxed italic">
                  «{t(tItem.text)}»
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10. FOYDALANISH JARAYONI (4 Bosqichli Timeline Karta) */}
      <section className="px-3 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full my-6 sm:my-10">
        <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-2xl sm:rounded-[32px] p-5 sm:p-10 lg:p-12 shadow-sm">
          {/* 4 Process Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-6">
            {/* Step 1 */}
            <div className="flex flex-col items-start text-left">
              <div className="flex items-center gap-2.5 mb-3 sm:mb-3.5">
                <div className="relative shrink-0 w-9 sm:w-10 h-12 sm:h-13 flex items-start justify-center">
                  <svg viewBox="0 0 40 52" className="w-9 sm:w-10 h-12 sm:h-13 text-[#116B50] dark:text-[#22C55E]" fill="currentColor">
                    <path d="M20 0C8.95 0 0 8.95 0 20C0 32.5 17.8 49.6 18.9 50.8C19.5 51.4 20.5 51.4 21.1 50.8C22.2 49.6 40 32.5 40 20C40 8.95 31.05 0 20 0Z" />
                  </svg>
                  <div className="absolute top-[5px] sm:top-[6px] w-5 sm:w-5.5 h-5 sm:h-5.5 rounded-full bg-white flex items-center justify-center shadow-xs">
                    <span className="font-black text-xs text-[#116B50]">1</span>
                  </div>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-[#1A2E24] border border-emerald-500/20 text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <h4 className="text-sm sm:text-lg font-extrabold text-[#116B50] dark:text-[#4ADE80] leading-snug mb-1.5 sm:mb-2">
                {t('Tovarni qidirish va lokatsiya')}
              </h4>
              <p className="text-xs sm:text-[13px] text-[#566A63] dark:text-[#9CB3A8] leading-relaxed font-medium">
                {t('Qidiruv maydoniga kerakli tovar yoki xizmat nomini yozing. Tizim geolokatsiya asosida 50 metrdan 3 km gacha radiusdagi eng yaqin do‘konlarni bir zumda aniqlaydi.')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-start text-left">
              <div className="flex items-center gap-2.5 mb-3 sm:mb-3.5">
                <div className="relative shrink-0 w-9 sm:w-10 h-12 sm:h-13 flex items-start justify-center">
                  <svg viewBox="0 0 40 52" className="w-9 sm:w-10 h-12 sm:h-13 text-[#116B50] dark:text-[#22C55E]" fill="currentColor">
                    <path d="M20 0C8.95 0 0 8.95 0 20C0 32.5 17.8 49.6 18.9 50.8C19.5 51.4 20.5 51.4 21.1 50.8C22.2 49.6 40 32.5 40 20C40 8.95 31.05 0 20 0Z" />
                  </svg>
                  <div className="absolute top-[5px] sm:top-[6px] w-5 sm:w-5.5 h-5 sm:h-5.5 rounded-full bg-white flex items-center justify-center shadow-xs">
                    <span className="font-black text-xs text-[#116B50]">2</span>
                  </div>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-[#1A2E24] border border-emerald-500/20 text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <h4 className="text-sm sm:text-lg font-extrabold text-[#116B50] dark:text-[#4ADE80] leading-snug mb-1.5 sm:mb-2">
                {t('Narx va qoldiqni solishtirish')}
              </h4>
              <p className="text-xs sm:text-[13px] text-[#566A63] dark:text-[#9CB3A8] leading-relaxed font-medium">
                {t('Bir nechta do‘konlardagi kassa narxlarini, tovar mavjudligi (qoldiqlari) va xaridorlar sharhlarini taqqoslab, eng arzon va maqbul variantni tanlang.')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-start text-left">
              <div className="flex items-center gap-2.5 mb-3 sm:mb-3.5">
                <div className="relative shrink-0 w-9 sm:w-10 h-12 sm:h-13 flex items-start justify-center">
                  <svg viewBox="0 0 40 52" className="w-10 h-13 text-[#116B50] dark:text-[#22C55E]" fill="currentColor">
                    <path d="M20 0C8.95 0 0 8.95 0 20C0 32.5 17.8 49.6 18.9 50.8C19.5 51.4 20.5 51.4 21.1 50.8C22.2 49.6 40 32.5 40 20C40 8.95 31.05 0 20 0Z" />
                  </svg>
                  <div className="absolute top-[5px] sm:top-[6px] w-5 sm:w-5.5 h-5 sm:h-5.5 rounded-full bg-white flex items-center justify-center shadow-xs">
                    <span className="font-black text-xs text-[#116B50]">3</span>
                  </div>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-[#1A2E24] border border-emerald-500/20 text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center shrink-0">
                  <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <h4 className="text-sm sm:text-lg font-extrabold text-[#116B50] dark:text-[#4ADE80] leading-snug mb-1.5 sm:mb-2">
                {t('Xaritada qulay yo‘l olish')}
              </h4>
              <p className="text-xs sm:text-[13px] text-[#566A63] dark:text-[#9CB3A8] leading-relaxed font-medium">
                {t('Tanlangan do‘konga piyoda yoki avtomobilda eng qisqa marshrutni oling, do‘konning ochiq/yopiq holati va ish vaqtini bir qadamda tekshiring.')}
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-start text-left">
              <div className="flex items-center gap-2.5 mb-3 sm:mb-3.5">
                <div className="relative shrink-0 w-9 sm:w-10 h-12 sm:h-13 flex items-start justify-center">
                  <svg viewBox="0 0 40 52" className="w-10 h-13 text-[#116B50] dark:text-[#22C55E]" fill="currentColor">
                    <path d="M20 0C8.95 0 0 8.95 0 20C0 32.5 17.8 49.6 18.9 50.8C19.5 51.4 20.5 51.4 21.1 50.8C22.2 49.6 40 32.5 40 20C40 8.95 31.05 0 20 0Z" />
                  </svg>
                  <div className="absolute top-[5px] sm:top-[6px] w-5 sm:w-5.5 h-5 sm:h-5.5 rounded-full bg-white flex items-center justify-center shadow-xs">
                    <span className="font-black text-xs text-[#116B50]">4</span>
                  </div>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-[#1A2E24] border border-emerald-500/20 text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <h4 className="text-sm sm:text-lg font-extrabold text-[#116B50] dark:text-[#4ADE80] leading-snug mb-1.5 sm:mb-2">
                {t('Xaridni yakunlash va baholash')}
              </h4>
              <p className="text-xs sm:text-[13px] text-[#566A63] dark:text-[#9CB3A8] leading-relaxed font-medium">
                {t('Do‘konga tashrif buyurib to‘g‘ridan-to‘g‘ri kassa narxida xaridni amalga oshiring. Xarid yakunida xizmat sifatini baholab, sharh qoldiring.')}
              </p>
            </div>
          </div>

          {/* Dashed Timeline Track at Bottom */}
          <div className="hidden lg:flex items-center w-full mt-10 pt-4">
            <div className="w-3.5 h-3.5 rounded-full bg-[#116B50] dark:bg-[#22C55E] shrink-0 ring-4 ring-emerald-100 dark:ring-emerald-950/60" />
            <div className="flex-1 border-b-2 border-dashed border-[#116B50] dark:border-[#22332C]/60 mx-1" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#116B50] dark:bg-[#22C55E] shrink-0 ring-4 ring-emerald-100 dark:ring-emerald-950/60" />
          </div>

          {/* Bottom Interactive Pill */}
          <div className="flex justify-center sm:justify-end mt-5 sm:mt-4">
            <a
              href="/customer"
              className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E0EFE7] dark:bg-[#1A2E24] text-[#116B50] dark:text-[#4ADE80] text-xs font-bold hover:bg-[#116B50] hover:text-white dark:hover:bg-[#22C55E] dark:hover:text-[#0E1713] transition shadow-2xs group cursor-pointer text-center"
            >
              <span>{t('Sizga kerakli tovar yoki do‘kon')}</span>
              <span className="font-mono text-[#116B50] dark:text-[#4ADE80] group-hover:text-white animate-pulse font-bold">|</span>
            </a>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="mt-auto bg-white dark:bg-[#0E1713] border-t border-[#DCE5DF] dark:border-[#22332C] pt-10 sm:pt-12 pb-8 px-3 sm:px-6 lg:px-12 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col gap-8 sm:gap-10">
          {/* Quick Portal Access Ribbon in Footer */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-[#F4F8F5] dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <span className="text-xs sm:text-sm font-bold text-[#172C28] dark:text-white block">
                {t('Tizim Portallariga to‘g‘ridan-to‘g‘ri kirish:')}
              </span>
              <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-0.5 block">
                {t('O‘z rolingiz bo‘yicha kerakli portalni tanlang')}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 w-full md:w-auto">
              <a
                href="/customer"
                className="justify-center px-3 py-2 rounded-xl bg-white dark:bg-[#18261F] border border-[#DCE5DF] dark:border-[#2A3F36] hover:border-[#116B50] dark:hover:border-[#4ADE80] text-xs font-bold text-[#172C28] dark:text-white flex items-center gap-1.5 transition shadow-2xs hover:shadow cursor-pointer truncate"
              >
                <Search className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
                <span className="truncate">{t('role_customer', 'Xaridor')}</span>
              </a>
              <a
                href="/owner"
                className="justify-center px-3 py-2 rounded-xl bg-white dark:bg-[#18261F] border border-[#DCE5DF] dark:border-[#2A3F36] hover:border-[#116B50] dark:hover:border-[#4ADE80] text-xs font-bold text-[#172C28] dark:text-white flex items-center gap-1.5 transition shadow-2xs hover:shadow cursor-pointer truncate"
              >
                <Store className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
                <span className="truncate">{t('stores', 'Do‘kon')}</span>
              </a>
              <a
                href="/moderator"
                className="justify-center px-3 py-2 rounded-xl bg-white dark:bg-[#18261F] border border-[#DCE5DF] dark:border-[#2A3F36] hover:border-[#116B50] dark:hover:border-[#4ADE80] text-xs font-bold text-[#172C28] dark:text-white flex items-center gap-1.5 transition shadow-2xs hover:shadow cursor-pointer truncate"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
                <span className="truncate">{t('role_moderator', 'Moderator')}</span>
              </a>
              <a
                href="/admin"
                className="justify-center px-3 py-2 rounded-xl bg-white dark:bg-[#18261F] border border-[#DCE5DF] dark:border-[#2A3F36] hover:border-[#116B50] dark:hover:border-[#4ADE80] text-xs font-bold text-[#172C28] dark:text-white flex items-center gap-1.5 transition shadow-2xs hover:shadow cursor-pointer truncate"
              >
                <Shield className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
                <span className="truncate">{t('role_admin', 'Admin')}</span>
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Col 1: Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <img
                  src="/favicon.png"
                  alt="YaqinTop"
                  className="w-8 h-8 rounded-xl shadow-xs object-contain"
                />
                <span className="font-extrabold text-lg text-[#172C28] dark:text-white">YaqinTop</span>
              </div>
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-2 font-medium">
                {t('Mahalliy tovar va xizmatlar ekotizimi.')}
              </p>
              <div className="flex items-center gap-3 mt-4 text-[#566A63] dark:text-[#8B9E95]">
                <a href="https://t.me/yaqintop" target="_blank" rel="noreferrer" className="hover:text-[#116B50] dark:hover:text-white">
                  <Send className="w-4 h-4" />
                </a>
                <a href="#" className="hover:text-[#116B50] dark:hover:text-white">
                  <Mail className="w-4 h-4" />
                </a>
                <a href="#" className="hover:text-[#116B50] dark:hover:text-white">
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Col 2: Platforma */}
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#172C28] dark:text-white mb-3">
                {t('Platforma')}
              </h4>
              <ul className="flex flex-col gap-2 text-xs text-[#566A63] dark:text-[#8B9E95] font-medium">
                <li><a href="#" className="hover:text-[#116B50] dark:hover:text-white">{t('Bosh sahifa')}</a></li>
                <li><a href="/customer" className="hover:text-[#116B50] dark:hover:text-white">{t('map', 'Xarita')}</a></li>
                <li><a href="/customer" className="hover:text-[#116B50] dark:hover:text-white">{t('stores', 'Do‘konlar')}</a></li>
                <li><a href="/customer" className="hover:text-[#116B50] dark:hover:text-white">{t('Tovarlar')}</a></li>
                <li><a href="#features" className="hover:text-[#116B50] dark:hover:text-white">{t('Biz haqimizda')}</a></li>
              </ul>
            </div>

            {/* Col 3: Foydali */}
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#172C28] dark:text-white mb-3">
                {t('Foydali')}
              </h4>
              <ul className="flex flex-col gap-2 text-xs text-[#566A63] dark:text-[#8B9E95] font-medium">
                <li><a href="#how-it-works" className="hover:text-[#116B50] dark:hover:text-white">{t('Qanday ishlaydi?')}</a></li>
                <li><a href="/customer" className="hover:text-[#116B50] dark:hover:text-white">{t('Yo‘l-yo‘riq')}</a></li>
                <li><a href="#" className="hover:text-[#116B50] dark:hover:text-white">{t('Savol-Javoblar')}</a></li>
                <li><a href="#" className="hover:text-[#116B50] dark:hover:text-white">{t('Yangiliklar')}</a></li>
              </ul>
            </div>

            {/* Col 4: Bizneslar uchun */}
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#172C28] dark:text-white mb-3">
                {t('Bizneslar uchun')}
              </h4>
              <ul className="flex flex-col gap-2 text-xs text-[#566A63] dark:text-[#8B9E95] font-medium">
                <li><a href="/owner" className="hover:text-[#116B50] dark:hover:text-white">{t('Do‘kon qo‘shish')}</a></li>
                <li><a href="/moderator" className="hover:text-[#116B50] dark:hover:text-white">{t('Moderatsiya')}</a></li>
                <li><a href="/admin" className="hover:text-[#116B50] dark:hover:text-white">{t('Admin paneli')}</a></li>
                <li><a href="#" className="hover:text-[#116B50] dark:hover:text-white">{t('Hamkorlik')}</a></li>
              </ul>
            </div>

            {/* Col 5: Aloqa */}
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#172C28] dark:text-white mb-3">
                {t('contact', 'Aloqa')}
              </h4>
              <ul className="flex flex-col gap-2 text-xs text-[#566A63] dark:text-[#8B9E95] font-medium">
                <li className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
                  <span>{t('Sirdaryo, O‘zbekiston')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
                  <span>hello@yaqintop.uz</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
                  <span>+998 90 123 45 67</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#DCE5DF] dark:border-[#22332C] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#566A63] dark:text-[#8B9E95]">
            <p>{t('© 2026 YaqinTop. Barcha huquqlar himoyalangan.')}</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-[#116B50] dark:hover:text-white">{t('Maxfiylik siyosati')}</a>
              <span>·</span>
              <a href="#" className="hover:text-[#116B50] dark:hover:text-white">{t('Foydalanish shartlari')}</a>
            </div>
          </div>
        </div>
      </footer>

      {/* REGION SELECTION MODAL */}
      {isRegionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#116B50] dark:text-[#4ADE80]" />
                <h3 className="font-extrabold text-base text-[#172C28] dark:text-white">{t('Hududni tanlang')}</h3>
              </div>
              <button
                onClick={() => setIsRegionModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#566A63] hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1 no-scrollbar">
              {UZBEKISTAN_REGIONS.map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => {
                    setSelectedRegion(reg);
                    setIsRegionModalOpen(false);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold text-left transition border ${
                    selectedRegion === reg
                      ? 'bg-[#116B50] text-white border-[#116B50]'
                      : 'bg-[#F9FAF9] dark:bg-[#18261F] text-[#172C28] dark:text-[#E8F2EC] border-[#DCE5DF] dark:border-[#273B32] hover:bg-[#E0EFE7]'
                  }`}
                >
                  {t(reg)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PORTAL SELECTOR MODAL (Kirish) */}
      {isPortalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-extrabold text-lg text-[#172C28] dark:text-white">{t('Tizimga kirish')}</h3>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">{t('Kerakli portal yoki rolni tanlang')}</p>
              </div>
              <button
                onClick={() => setIsPortalModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#566A63] hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {PORTALS.map((p) => {
                const Icon = p.icon;
                return (
                  <a
                    key={p.id}
                    href={p.url}
                    className="p-3.5 rounded-2xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#18261F] hover:border-[#116B50] dark:hover:border-[#4ADE80] hover:bg-[#E0EFE7]/40 flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#116B50]/15 dark:bg-[#4ADE80]/15 text-[#116B50] dark:text-[#4ADE80] flex items-center justify-center group-hover:scale-110 transition">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#172C28] dark:text-white">{t(p.title)}</h4>
                        <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">{t(p.sub)}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#566A63] group-hover:text-[#116B50] group-hover:translate-x-1 transition" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Global Token Quick Login (Ctrl + Alt + T) */}
      <TokenQuickLoginModal />
    </div>
  );
}
