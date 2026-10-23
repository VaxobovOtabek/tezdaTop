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
  Tag
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
    icon: '🛒',
    query: 'oziq-ovqat',
    img: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'pharmacy',
    name: 'Dorixonalar',
    count: '300+ do‘kon',
    icon: '💊',
    query: 'dorixona',
    img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'cafe',
    name: 'Kafe va restoran',
    count: '500+ do‘kon',
    icon: '🍽️',
    query: 'kafe',
    img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'clothes',
    name: 'Kiyim-kechak',
    count: '400+ do‘kon',
    icon: '👕',
    query: 'kiyim',
    img: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'tech',
    name: 'Maishiy texnika',
    count: '250+ do‘kon',
    icon: '💻',
    query: 'texnika',
    img: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'auto',
    name: 'Avto va ehtiyot qismlar',
    count: '200+ do‘kon',
    icon: '🚗',
    query: 'avto',
    img: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'build',
    name: 'Qurilish va ta’mirlash',
    count: '300+ do‘kon',
    icon: '🔨',
    query: 'qurilish',
    img: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'other',
    name: 'Boshqa xizmatlar',
    count: '600+ do‘kon',
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

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 overflow-x-hidden w-full max-w-full ${isDarkMode ? 'dark bg-[#0A120E] text-[#E8F2EC]' : 'bg-[#FAFCFA] text-[#172C28]'}`}>
      {/* Subtle Background Glow Elements */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[450px] bg-gradient-to-b from-[#116B50]/15 via-[#22C55E]/10 to-transparent blur-[140px] pointer-events-none -z-10" />

      {/* HEADER / NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0E1713]/90 backdrop-blur-md border-b border-[#DCE5DF] dark:border-[#22332C] px-4 sm:px-6 lg:px-12 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <a href="#" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#116B50] to-[#22C55E] flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-[#116B50]/25 group-hover:scale-105 transition">
              Y
            </div>
            <div>
              <div className="font-extrabold text-lg sm:text-xl tracking-tight text-[#172C28] dark:text-white flex items-center gap-1.5 leading-none">
                <span>YaqinTop</span>
                <span className="w-2 h-2 rounded-full bg-[#116B50] dark:bg-[#4ADE80] animate-pulse" />
              </div>
              <p className="text-[10px] text-[#566A63] dark:text-[#8B9E95] font-medium tracking-tight mt-0.5 hidden xs:block">
                Mahalliy tovar va xizmatlar ekotizimi
              </p>
            </div>
          </a>

          {/* Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-[#566A63] dark:text-[#9CB3A8]">
            <a href="#portals" className="text-[#116B50] dark:text-[#4ADE80] font-bold hover:underline transition">Portallar</a>
            <a href="#features" className="hover:text-[#116B50] dark:hover:text-[#4ADE80] transition">Platforma</a>
            <a href="#interactive-map" className="hover:text-[#116B50] dark:hover:text-[#4ADE80] transition">Xarita</a>
            <a href="#categories" className="hover:text-[#116B50] dark:hover:text-[#4ADE80] transition">Do‘konlar</a>
            <a href="#for-business" className="hover:text-[#116B50] dark:hover:text-[#4ADE80] transition">Bizneslar uchun</a>
            <a href="#how-it-works" className="hover:text-[#116B50] dark:hover:text-[#4ADE80] transition">Foydali</a>
            <a href="#testimonials" className="hover:text-[#116B50] dark:hover:text-[#4ADE80] transition">Biz haqimizda</a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Region Selector Button */}
            <button
              type="button"
              onClick={() => setIsRegionModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#F3F6F3] dark:hover:bg-[#1C2E26] text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
              <span className="max-w-[85px] sm:max-w-[120px] truncate">{selectedRegion.replace(' viloyati', '').replace(' shahri', '')}</span>
              <ChevronDown className="w-3 h-3 text-[#566A63] dark:text-[#8B9E95] shrink-0" />
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              title={isDarkMode ? "Yorug' tema" : "Qorong'i tema"}
              className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#F3F6F3] dark:hover:bg-[#1C2E26] transition flex items-center justify-center shadow-2xs shrink-0 cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#116B50]" />}
            </button>

            {/* Kirish / Portal Switcher Button */}
            <button
              onClick={() => setIsPortalModalOpen(true)}
              className="px-4 py-1.5 sm:py-2 rounded-xl bg-[#116B50] hover:bg-[#0D533E] active:scale-95 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Kirish</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-8.5 h-8.5 p-1.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-[#172C28] dark:text-white flex items-center justify-center shadow-2xs shrink-0"
              aria-label="Menyuni ochish"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 text-rose-500" /> : <Menu className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden max-w-7xl mx-auto mt-3 pt-3 border-t border-[#DCE5DF] dark:border-[#22332C] flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1 text-xs font-semibold text-[#172C28] dark:text-[#E8F2EC]">
              <a href="#portals" onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg bg-[#E0EFE7]/50 dark:bg-[#1B2F25] text-[#116B50] dark:text-[#4ADE80] font-bold">Tizim Portallari (Kirish)</a>
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-[#E0EFE7] dark:hover:bg-[#1B2F25]">Platforma haqida</a>
              <a href="#interactive-map" onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-[#E0EFE7] dark:hover:bg-[#1B2F25]">Xarita ko‘rinishi</a>
              <a href="#categories" onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-[#E0EFE7] dark:hover:bg-[#1B2F25]">Asosiy toifalar</a>
              <a href="#for-business" onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-[#E0EFE7] dark:hover:bg-[#1B2F25]">Biznes va do‘konlar</a>
              <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-[#E0EFE7] dark:hover:bg-[#1B2F25]">Qanday ishlaydi?</a>
              <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-[#E0EFE7] dark:hover:bg-[#1B2F25]">Foydalanuvchilar fikri</a>
            </div>

            <div className="pt-2 border-t border-[#DCE5DF]/60 dark:border-[#22332C]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#566A63] dark:text-[#8B9E95] mb-2">
                Ilovalar & Portallar
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PORTALS.map((p) => (
                  <a
                    key={p.id}
                    href={p.url}
                    className="p-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-[#F9FAF9] dark:bg-[#16241E] flex items-center gap-2 text-xs font-bold text-[#172C28] dark:text-white"
                  >
                    <p.icon className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                    <span className="truncate">{p.title}</span>
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
              <span>O‘zbekistondagi eng tezkor lokal qidiruv</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold tracking-tight text-[#172C28] dark:text-white leading-[1.18] sm:leading-[1.15]">
              Kerakli tovar va xizmatni{' '}
              <span className="text-[#116B50] dark:text-[#4ADE80]">
                1 soniyada
              </span>{' '}
              eng yaqin do‘kondan toping
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-[#566A63] dark:text-[#9CB3A8] mt-4 sm:mt-5 max-w-xl leading-relaxed font-medium">
              YaqinTop — atrofingizdagi do‘konlar, narxlar va xizmatlarni bir xaritada. Tez, qulay va ishonchli.
            </p>

            {/* Big Interactive Search Form */}
            <form onSubmit={handleHeroSearchSubmit} className="w-full mt-6 sm:mt-8 max-w-2xl">
              <div className="p-2 sm:p-2.5 bg-white dark:bg-[#14201A] border-2 border-[#116B50]/30 dark:border-[#4ADE80]/30 hover:border-[#116B50] dark:hover:border-[#4ADE80] focus-within:border-[#116B50] rounded-2xl sm:rounded-3xl shadow-lg shadow-[#116B50]/10 flex items-center gap-2 transition duration-200">
                <Search className="w-5 h-5 text-[#566A63] dark:text-[#8B9E95] ml-2.5 shrink-0" />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Masalan: snikers, non, dorixona..."
                  className="w-full bg-transparent text-sm sm:text-base text-[#172C28] dark:text-white placeholder-[#8B9E95] focus:outline-none px-2 font-medium"
                />
                <button
                  type="submit"
                  className="px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#116B50] hover:bg-[#0D533E] active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition shrink-0 cursor-pointer shadow-md"
                >
                  <Search className="w-4 h-4 hidden sm:inline" />
                  <span>Qidirish</span>
                </button>
              </div>
            </form>

            {/* Quick Category Pills Row */}
            <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-2 max-w-full w-full">
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
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#273B32] hover:border-[#116B50] dark:hover:border-[#4ADE80] hover:bg-[#E0EFE7]/50 text-xs font-bold text-[#172C28] dark:text-[#E8F2EC] flex items-center gap-1.5 transition shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Realistic 3D App Smartphone Mockup with Annotations */}
          <div className="lg:col-span-5 relative flex items-center justify-center mt-4 lg:mt-0">
            {/* Background Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#116B50]/20 to-[#22C55E]/20 rounded-full blur-3xl pointer-events-none" />

            {/* Isometric Store Decor behind Phone */}
            <div className="hidden sm:block absolute -right-4 -bottom-6 w-36 h-36 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-950/40 dark:to-[#1C2620] rounded-3xl border border-amber-300/50 dark:border-amber-800/40 p-3 shadow-xl transform rotate-6 z-0">
              <div className="w-full h-full bg-[#116B50] rounded-2xl flex flex-col items-center justify-center text-white text-center p-2 shadow-inner">
                <Store className="w-8 h-8 mb-1" />
                <span className="text-[11px] font-black uppercase tracking-wider">DO‘KON</span>
                <span className="text-[9px] text-emerald-200">280 m yaqin</span>
              </div>
            </div>

            {/* Hand-drawn Playful Annotation 1: Top Right */}
            <div className="hidden md:flex absolute -top-3 -right-6 items-center gap-2 text-xs font-extrabold text-[#116B50] dark:text-[#4ADE80] bg-white/90 dark:bg-[#14201A]/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[#116B50]/20 shadow-md z-30 animate-bounce duration-1000">
              <span>Do‘konlarni xaritada ko‘ring 📍</span>
            </div>

            {/* Hand-drawn Playful Annotation 2: Middle Right */}
            <div className="hidden lg:flex absolute top-1/2 -right-8 items-center gap-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-white/90 dark:bg-[#14201A]/90 backdrop-blur-sm px-3 py-1 rounded-full border border-emerald-500/20 shadow-md z-30">
              <span>Narxlarni taqqoslang 🏷️</span>
            </div>

            {/* Smartphone Frame */}
            <div className="relative w-[295px] sm:w-[325px] h-[580px] sm:h-[620px] rounded-[48px] bg-slate-900 border-[8px] border-slate-800 shadow-2xl overflow-hidden z-10 ring-1 ring-white/20 flex flex-col">
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
                      <span>📍 Sirdaryo</span>
                    </div>
                  </div>

                  {/* Phone Search Bar */}
                  <div className="flex items-center gap-2 bg-[#F3F6F3] dark:bg-[#1E2E26] rounded-xl px-2.5 py-1.5 border border-[#DCE5DF] dark:border-[#2A3F36]">
                    <Search className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                    <span className="font-bold text-[#172C28] dark:text-white">Snikers (50g)</span>
                  </div>

                  {/* Filter chips inside mockup */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 pb-0.5 no-scrollbar text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-[#116B50] text-white font-bold">📍 Sirdaryo v</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] font-bold">⚡ 1 km v</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#2A3F36] text-[#566A63] font-semibold">⭐ Reyting</span>
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
                          📍 280 m · Ochiq
                        </span>
                        <div className="text-xs font-extrabold text-[#116B50] dark:text-[#4ADE80] mt-0.5">
                          12 000 so‘m <span className="text-[9px] text-[#6E827B] font-normal">/ dona</span>
                        </div>
                      </div>
                    </div>

                    <a
                      href="/customer"
                      className="w-full py-1.5 rounded-xl bg-[#116B50] text-white font-bold text-center text-[10px] hover:bg-[#0D533E] transition shadow-xs flex items-center justify-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Yo‘l-yo‘riq (Marshrut)</span>
                    </a>
                  </div>

                  {/* FLOATING PRICE COMPARISON DRAWER AT BOTTOM */}
                  <div className="absolute bottom-2 left-2 right-2 bg-white/95 dark:bg-[#16241E]/95 backdrop-blur-md rounded-2xl p-2.5 border border-[#DCE5DF] dark:border-[#273B32] shadow-lg flex flex-col gap-1.5 z-20">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#566A63] dark:text-[#8B9E95]">
                      <span>Yaqin narxlar taqqosi:</span>
                      <span className="text-[#116B50] dark:text-[#4ADE80]">3 ta do‘kon</span>
                    </div>

                    <div className="flex flex-col divide-y divide-[#DCE5DF]/60 dark:divide-[#273B32] text-[10px]">
                      <div className="py-1 flex items-center justify-between">
                        <span className="font-semibold text-[#172C28] dark:text-[#E8F2EC] truncate">1. Iftixor Savdo</span>
                        <span className="font-extrabold text-[#116B50] dark:text-[#4ADE80] shrink-0">11 500 so‘m · 150m</span>
                      </div>
                      <div className="py-1 flex items-center justify-between">
                        <span className="font-semibold text-[#172C28] dark:text-[#E8F2EC] truncate">2. Olmazor Market</span>
                        <span className="font-extrabold text-[#116B50] dark:text-[#4ADE80] shrink-0">12 500 so‘m · 420m</span>
                      </div>
                      <div className="py-1 flex items-center justify-between">
                        <span className="font-semibold text-[#172C28] dark:text-[#E8F2EC] truncate">3. Mini Market 24/7</span>
                        <span className="font-extrabold text-[#116B50] dark:text-[#4ADE80] shrink-0">12 500 so‘m · 680m</span>
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
      <section className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full my-6 sm:my-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex items-center gap-3.5 hover:border-[#116B50]/40 transition">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold text-[#172C28] dark:text-white leading-tight">50m – 3km</div>
              <div className="text-[11px] sm:text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5 font-medium">Qidiruv radiusi</div>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex items-center gap-3.5 hover:border-[#116B50]/40 transition">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold text-[#116B50] dark:text-[#4ADE80] leading-tight">&lt; 30 ms</div>
              <div className="text-[11px] sm:text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5 font-medium">Tezkor javob</div>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex items-center gap-3.5 hover:border-[#116B50]/40 transition">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold text-[#172C28] dark:text-white leading-tight">100% Real-time</div>
              <div className="text-[11px] sm:text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5 font-medium">Kassa qoldiqlari</div>
            </div>
          </div>

          <a
            href="#portals"
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex items-center gap-3.5 hover:border-[#116B50] dark:hover:border-[#4ADE80] transition group cursor-pointer"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold text-[#116B50] dark:text-[#4ADE80] leading-tight flex items-center gap-1.5">
                <span>4 Ta Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
              <div className="text-[11px] sm:text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5 font-medium">Barchasini ko‘rish</div>
            </div>
          </a>
        </div>
      </section>

      {/* 2.5. TIZIM PORTALLARI (Xaridor, Do'kon egasi, Moderator, Admin) */}
      <section id="portals" className="py-10 sm:py-14 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0EFE7] dark:bg-[#162A20] text-[#116B50] dark:text-[#4ADE80] text-xs font-bold mb-3 shadow-2xs">
            <Layers className="w-3.5 h-3.5" />
            <span>Tizim Portallari & Ilovalar</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#172C28] dark:text-white tracking-tight">
            Qaysi rolda <span className="text-[#116B50] dark:text-[#4ADE80]">kirmoqchisiz?</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#566A63] dark:text-[#8B9E95] mt-2.5 font-medium max-w-lg">
            Xaridorlar, do‘kon egalari, moderatorlar va tizim ma’murlari uchun 4 ta alohida moslashtirilgan portal:
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
                  Xaridor
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-[#172C28] dark:text-white group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] transition">
                Xaridor Ilovasi
              </h3>
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-2.5 leading-relaxed font-medium">
                Kerakli tovar va xizmatlarni 1 soniyada qidirish, yaqin do‘konlar, kassa narxlarini taqqoslash va xaritada marshrut olish.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#DCE5DF]/60 dark:border-white/10">
              <a
                href="/customer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#116B50] hover:bg-[#0D533E] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Xaridor sifatida kirish</span>
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
                  Tadbirkor
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-[#172C28] dark:text-white group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] transition">
                Do‘kon & Tadbirkor
              </h3>
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-2.5 leading-relaxed font-medium">
                Do‘kon va filiallar ma’lumotlari, tovar va xizmatlar narxi, kassa qoldiqlari, Excel import va yangi mijozlar oqimi.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#DCE5DF]/60 dark:border-white/10">
              <a
                href="/owner"
                className="w-full py-2.5 px-4 rounded-xl bg-[#0F5A44] hover:bg-[#0B4534] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Do‘kon egasi sifatida kirish</span>
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
                  Moderator
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-[#172C28] dark:text-white group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] transition">
                Moderator Portali
              </h3>
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-2.5 leading-relaxed font-medium">
                Yangi ochilgan do‘konlar arizalarini tekshirish, xaridorlar e’tirozlari, sharhlar nazorati va ma’lumotlar to‘g‘riligi.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#DCE5DF]/60 dark:border-white/10">
              <a
                href="/moderator"
                className="w-full py-2.5 px-4 rounded-xl bg-[#116B50] hover:bg-[#0D533E] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Moderator sifatida kirish</span>
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
                  Administrator
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-[#172C28] dark:text-white group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] transition">
                Boshqaruv Admin
              </h3>
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-2.5 leading-relaxed font-medium">
                Tizim umumiy nazorati, butun shahar bo‘yicha qidiruv analitikasi, ma’lumotlar bazasi, rollar va xavfsizlik arxitekturasi.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#DCE5DF]/60 dark:border-white/10">
              <a
                href="/admin"
                className="w-full py-2.5 px-4 rounded-xl bg-[#0A3D2E] hover:bg-[#06291F] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Admin sifatida kirish</span>
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
            <span>Nima uchun YaqinTop?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#172C28] dark:text-white tracking-tight">
            Har kuni kerakli narsalar endi <span className="text-[#116B50] dark:text-[#4ADE80]">yanada yaqin!</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#566A63] dark:text-[#8B9E95] mt-3 font-medium">
            Vaqtingizni tejang, eng yaxshi narxlarni toping va atrofingizdagi ishonchli do‘konlarni kashf eting.
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
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#566A63] dark:text-[#8B9E95] leading-relaxed font-medium">
                  {item.desc}
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
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">YaqinTop raqamlarda</h3>
              <p className="text-xs text-emerald-200 mt-0.5">O‘zbekiston bo‘ylab real ko‘rsatkichlar</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 w-full md:w-auto text-center md:text-left">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">10 000+</div>
              <div className="text-xs text-emerald-200 mt-0.5 font-medium">Foydalanuvchilar</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">500+</div>
              <div className="text-xs text-emerald-200 mt-0.5 font-medium">Do‘konlar</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">50 000+</div>
              <div className="text-xs text-emerald-200 mt-0.5 font-medium">Tovarlar</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-300">4.8 / 5</div>
              <div className="text-xs text-emerald-200 mt-0.5 font-medium">O‘rtacha reyting</div>
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
              <span>Qanday ishlaydi?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#172C28] dark:text-white tracking-tight">
              Juda oson — <span className="text-[#116B50] dark:text-[#4ADE80]">3 qadamda</span>
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-[#566A63] dark:text-[#8B9E95] mt-2 font-medium">
              Kerakli tovarni topish endi bir necha soniya masala.
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
                      <span>{s.title}</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-[#566A63] dark:text-[#8B9E95] mt-1 font-medium leading-relaxed">
                      {s.desc}
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
                className="w-full h-[360px] sm:h-[440px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

              {/* Floating Price Badge */}
              <div className="absolute top-4 left-4 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-emerald-500/30 shadow-lg flex items-center gap-2">
                <span className="p-1 rounded-lg bg-[#116B50] text-white text-[10px]">📍</span>
                <div>
                  <span className="text-[11px] font-bold text-[#172C28] dark:text-white block">Snikers (50g)</span>
                  <span className="text-xs font-black text-[#116B50] dark:text-[#4ADE80]">12 000 so‘m · 280 m</span>
                </div>
              </div>

              {/* Floating Benefits Card on Bottom */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-[#14201A]/95 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shadow-xl grid grid-cols-2 gap-2.5 text-xs font-bold text-[#116B50] dark:text-[#4ADE80]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[#172C28] dark:text-white">Tezroq xarid</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[#172C28] dark:text-white">Kamroq vaqt</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[#172C28] dark:text-white">Yaqin do‘konlar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[#172C28] dark:text-white">Eng yaxshi narx</span>
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
            <span>Asosiy kategoriyalar</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#172C28] dark:text-white tracking-tight">
            Barcha kerakli tovar va xizmatlar
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#566A63] dark:text-[#8B9E95] mt-2 font-medium">
            Oziq-ovqatdan tortib ta’mirlash va maishiy texnikagacha
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
                  {cat.name}
                </h4>
                <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] block mt-0.5">
                  {cat.count}
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 7. "ATROFINGIZDAGI BARCHA DO'KONLAR BIR XARITADA" (Interaktiv xarita) */}
      <section id="interactive-map" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] rounded-3xl p-5 sm:p-8 shadow-sm flex flex-col gap-6 sm:gap-8">
          {/* Header Row: Title, Description & CTA */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-[#DCE5DF]/60 dark:border-[#22332C]">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0EFE7] dark:bg-[#162A20] text-[#116B50] dark:text-[#4ADE80] text-xs font-bold mb-3">
                <Compass className="w-3.5 h-3.5" />
                <span>Interaktiv xarita</span>
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#172C28] dark:text-white tracking-tight leading-tight">
                Atrofingizdagi barcha do‘konlar <span className="text-[#116B50] dark:text-[#4ADE80]">bir xaritada</span>
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-[#566A63] dark:text-[#8B9E95] mt-2 leading-relaxed font-medium">
                Real vaqt rejimida do‘konlar, narxlar, tovarlar va xizmatlar. Sizga eng yaqin va qulay variantlarni xaritada ko‘ring.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href="/customer"
                className="px-6 py-3 rounded-xl bg-[#116B50] hover:bg-[#0D533E] active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-md cursor-pointer"
              >
                <span>Xaritani to‘liq ochish</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Interactive Map Widget (Full Width) */}
          <MinimalCustomerMapWidget isDarkMode={isDarkMode} />

          {/* 4 Feature Badges Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#F9FAF9] dark:bg-[#18261F] border border-[#DCE5DF]/60 dark:border-[#263D31] text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]">
              <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Real vaqt ma’lumotlari</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#F9FAF9] dark:bg-[#18261F] border border-[#DCE5DF]/60 dark:border-[#263D31] text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]">
              <MapPin className="w-4 h-4 text-teal-500 shrink-0" />
              <span>Aniq geolokatsiya</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#F9FAF9] dark:bg-[#18261F] border border-[#DCE5DF]/60 dark:border-[#263D31] text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]">
              <Navigation className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Qulay marshrut</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#F9FAF9] dark:bg-[#18261F] border border-[#DCE5DF]/60 dark:border-[#263D31] text-xs font-bold text-[#172C28] dark:text-[#E8F2EC]">
              <Store className="w-4 h-4 text-teal-500 shrink-0" />
              <span>Do‘kon tafsilotlari</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. BIZNESLAR UCHUN (Tadbirkorlar & Do'kon qo'shish) */}
      <section id="for-business" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-br from-[#116B50]/10 via-emerald-50/50 to-teal-50/30 dark:from-[#11241C] dark:via-[#0F1E17] dark:to-[#0A1611] border border-[#116B50]/30 p-6 sm:p-10 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#116B50]/15 text-[#116B50] dark:text-[#4ADE80] text-xs font-bold mb-3">
              <Store className="w-3.5 h-3.5" />
              <span>Bizneslar & Do‘kon egalari uchun</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#172C28] dark:text-white tracking-tight">
              O‘z do‘koningizni YaqinTop tarmog‘iga bepul qo‘shing
            </h3>
            <p className="text-xs sm:text-sm text-[#566A63] dark:text-[#8B9E95] mt-2 font-medium leading-relaxed">
              Kuniga minglab yaqin atrofdagi xaridorlar sizning mahsulotlaringizni xaritada ko‘rishadi. Excel orqali tovarlarni yuklang, narxlarni yangilang va savdoni oshiring.
            </p>

            <div className="flex items-center gap-3 mt-6">
              <a
                href="/owner"
                className="px-5 py-2.5 rounded-xl bg-[#116B50] hover:bg-[#0D533E] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-sm"
              >
                <Store className="w-4 h-4" />
                <span>Do‘kon kabinetini ochish</span>
              </a>
              <a
                href="/moderator"
                className="px-4 py-2.5 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-xs font-bold text-[#172C28] dark:text-white hover:bg-[#F3F6F3] transition"
              >
                <span>Moderatsiya arizasi</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#273B32] shadow-2xs text-center">
              <span className="text-2xl mb-1 block">⚡</span>
              <span className="font-extrabold text-xs text-[#172C28] dark:text-white block">3 daqiqada</span>
              <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">Onboarding</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#273B32] shadow-2xs text-center">
              <span className="text-2xl mb-1 block">📊</span>
              <span className="font-extrabold text-xs text-[#172C28] dark:text-white block">Excel Import</span>
              <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">Ommaviy yuklash</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#273B32] shadow-2xs text-center">
              <span className="text-2xl mb-1 block">💬</span>
              <span className="font-extrabold text-xs text-[#172C28] dark:text-white block">SMS Tasdiq</span>
              <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">Telegram Bot</span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#16241E] border border-[#DCE5DF] dark:border-[#273B32] shadow-2xs text-center">
              <span className="text-2xl mb-1 block">🎯</span>
              <span className="font-extrabold text-xs text-[#172C28] dark:text-white block">100% Aniq</span>
              <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95]">Lokal mijozlar</span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. MIJOZLARIMIZ BIZ HAQIMIZDA (Reviews) */}
      <section id="testimonials" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0EFE7] dark:bg-[#162A20] text-[#116B50] dark:text-[#4ADE80] text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Foydalanuvchilar fikri</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#172C28] dark:text-white tracking-tight">
            Mijozlarimiz biz haqimizda
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#566A63] dark:text-[#8B9E95] mt-2 font-medium">
            Aholi va do‘kon egalarining samimiy baholari
          </p>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-[#116B50]/30 shrink-0"
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-[#172C28] dark:text-white">{t.name}</h4>
                    <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] block">{t.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-2.5">
                  {[...Array(t.stars)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-[#566A63] dark:text-[#8B9E95] leading-relaxed italic">
                  «{t.text}»
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10. APP DOWNLOAD & CTA BANNER */}
      <section className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full my-6 sm:my-10">
        <div className="rounded-3xl bg-gradient-to-r from-[#0C3426] via-[#116B50] to-[#0A2E22] p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl z-10 text-center lg:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2 block">
              Mobil Ilova
            </span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Atrofingizdagi imkoniyatlarni{' '}
              <span className="text-white underline decoration-emerald-400 decoration-2">YaqinTop</span> bilan kashf eting!
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-3 font-medium leading-relaxed">
              Ilovani smartfoningizga o‘rnating va istalgan vaqtda yaqin do‘konlar, aksiyalar va tovar narxlaridan xabardor bo‘ling.
            </p>

            <div className="flex items-center justify-center lg:justify-start gap-3 mt-6">
              <a
                href="/customer"
                className="px-5 py-3 rounded-2xl bg-black hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-2 transition shadow-md"
              >
                <span className="text-base">▶️</span>
                <div className="text-left">
                  <span className="text-[9px] text-gray-400 block leading-none">Yuklab oling</span>
                  <span className="text-xs font-bold leading-tight">Google Play</span>
                </div>
              </a>

              <a
                href="/customer"
                className="px-5 py-3 rounded-2xl bg-black hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-2 transition shadow-md"
              >
                <span className="text-base">🍏</span>
                <div className="text-left">
                  <span className="text-[9px] text-gray-400 block leading-none">Yuklab oling</span>
                  <span className="text-xs font-bold leading-tight">App Store</span>
                </div>
              </a>
            </div>
          </div>

          {/* QR Code & Phone Card */}
          <div className="z-10 flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-xl p-2 flex items-center justify-center shrink-0 shadow">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://yaqintop.uz/customer"
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-left text-xs">
              <span className="font-extrabold text-white block">QR kodni skanerlang</span>
              <p className="text-[11px] text-emerald-200 mt-1">
                Kamerani yo‘naltiring yoki brauzeringizda «YaqinTop» deb qidiring.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="mt-auto bg-white dark:bg-[#0E1713] border-t border-[#DCE5DF] dark:border-[#22332C] pt-12 pb-8 px-4 sm:px-6 lg:px-12 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          {/* Quick Portal Access Ribbon in Footer */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F4F8F5] dark:bg-[#14201A] border border-[#DCE5DF] dark:border-[#22332C] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <span className="text-xs sm:text-sm font-bold text-[#172C28] dark:text-white block">
                Tizim Portallariga to‘g‘ridan-to‘g‘ri kirish:
              </span>
              <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-0.5 block">
                O‘z rolingiz bo‘yicha kerakli portalni tanlang
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
              <a
                href="/customer"
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#18261F] border border-[#DCE5DF] dark:border-[#2A3F36] hover:border-[#116B50] dark:hover:border-[#4ADE80] text-xs font-bold text-[#172C28] dark:text-white flex items-center gap-1.5 transition shadow-2xs hover:shadow cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                <span>Xaridor Ilovasi</span>
              </a>
              <a
                href="/owner"
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#18261F] border border-[#DCE5DF] dark:border-[#2A3F36] hover:border-[#116B50] dark:hover:border-[#4ADE80] text-xs font-bold text-[#172C28] dark:text-white flex items-center gap-1.5 transition shadow-2xs hover:shadow cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                <span>Do‘kon Kabineti</span>
              </a>
              <a
                href="/moderator"
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#18261F] border border-[#DCE5DF] dark:border-[#2A3F36] hover:border-[#116B50] dark:hover:border-[#4ADE80] text-xs font-bold text-[#172C28] dark:text-white flex items-center gap-1.5 transition shadow-2xs hover:shadow cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                <span>Moderator Portali</span>
              </a>
              <a
                href="/admin"
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#18261F] border border-[#DCE5DF] dark:border-[#2A3F36] hover:border-[#116B50] dark:hover:border-[#4ADE80] text-xs font-bold text-[#172C28] dark:text-white flex items-center gap-1.5 transition shadow-2xs hover:shadow cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                <span>Admin Paneli</span>
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Col 1: Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#116B50] to-[#22C55E] flex items-center justify-center text-white font-extrabold text-base">
                  Y
                </div>
                <span className="font-extrabold text-lg text-[#172C28] dark:text-white">YaqinTop</span>
              </div>
              <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-2 font-medium">
                Mahalliy tovar va xizmatlar ekotizimi.
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
                Platforma
              </h4>
              <ul className="flex flex-col gap-2 text-xs text-[#566A63] dark:text-[#8B9E95] font-medium">
                <li><a href="#" className="hover:text-[#116B50] dark:hover:text-white">Bosh sahifa</a></li>
                <li><a href="/customer" className="hover:text-[#116B50] dark:hover:text-white">Xarita</a></li>
                <li><a href="/customer" className="hover:text-[#116B50] dark:hover:text-white">Do‘konlar</a></li>
                <li><a href="/customer" className="hover:text-[#116B50] dark:hover:text-white">Tovarlar</a></li>
                <li><a href="#features" className="hover:text-[#116B50] dark:hover:text-white">Biz haqimizda</a></li>
              </ul>
            </div>

            {/* Col 3: Foydali */}
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#172C28] dark:text-white mb-3">
                Foydali
              </h4>
              <ul className="flex flex-col gap-2 text-xs text-[#566A63] dark:text-[#8B9E95] font-medium">
                <li><a href="#how-it-works" className="hover:text-[#116B50] dark:hover:text-white">Qanday ishlaydi?</a></li>
                <li><a href="/customer" className="hover:text-[#116B50] dark:hover:text-white">Yo‘l-yo‘riq</a></li>
                <li><a href="#" className="hover:text-[#116B50] dark:hover:text-white">Savol-Javoblar</a></li>
                <li><a href="#" className="hover:text-[#116B50] dark:hover:text-white">Yangiliklar</a></li>
              </ul>
            </div>

            {/* Col 4: Bizneslar uchun */}
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#172C28] dark:text-white mb-3">
                Bizneslar uchun
              </h4>
              <ul className="flex flex-col gap-2 text-xs text-[#566A63] dark:text-[#8B9E95] font-medium">
                <li><a href="/owner" className="hover:text-[#116B50] dark:hover:text-white">Do‘kon qo‘shish</a></li>
                <li><a href="/moderator" className="hover:text-[#116B50] dark:hover:text-white">Moderatsiya</a></li>
                <li><a href="/admin" className="hover:text-[#116B50] dark:hover:text-white">Admin paneli</a></li>
                <li><a href="#" className="hover:text-[#116B50] dark:hover:text-white">Hamkorlik</a></li>
              </ul>
            </div>

            {/* Col 5: Aloqa */}
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#172C28] dark:text-white mb-3">
                Aloqa
              </h4>
              <ul className="flex flex-col gap-2 text-xs text-[#566A63] dark:text-[#8B9E95] font-medium">
                <li className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80] shrink-0" />
                  <span>Sirdaryo, O‘zbekiston</span>
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
            <p>© 2026 YaqinTop. Barcha huquqlar himoyalangan.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-[#116B50] dark:hover:text-white">Maxfiylik siyosati</a>
              <span>·</span>
              <a href="#" className="hover:text-[#116B50] dark:hover:text-white">Foydalanish shartlari</a>
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
                <h3 className="font-extrabold text-base text-[#172C28] dark:text-white">Hududni tanlang</h3>
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
                  {reg}
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
                <h3 className="font-extrabold text-lg text-[#172C28] dark:text-white">Tizimga kirish</h3>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">Kerakli portal yoki rolni tanlang</p>
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
                        <h4 className="font-bold text-sm text-[#172C28] dark:text-white">{p.title}</h4>
                        <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">{p.sub}</span>
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
    </div>
  );
}
