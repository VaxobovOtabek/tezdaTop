import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Store,
  Shield,
  ShieldCheck,
  Smartphone,
  Navigation,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Layers,
  Zap,
  Globe,
  Lock,
  Clock,
  ChevronDown,
  Sparkles,
  Users,
  Compass,
  FileSpreadsheet,
  Cpu,
  Eye,
  Activity,
  MessageSquare,
  Sun,
  Moon,
  ShoppingBag
} from 'lucide-react';
import { MinimalCustomerMapWidget } from './components/MinimalCustomerMapWidget';

export function LandingApp() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('yaqintop_theme') === 'dark';
  });

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

  const [activeRoleTab, setActiveRoleTab] = useState<'customer' | 'merchant' | 'moderator' | 'admin'>('customer');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Live search test simulator on landing page
  const [testQuery, setTestQuery] = useState('Snikers');
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const runLiveSearch = async (q = testQuery) => {
    setIsSearching(true);
    try {
      const res = await fetch('/api/v1/search/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: q || 'snikers',
          lat: 41.311081,
          lng: 69.240562,
          radiusM: 2000,
          limit: 3
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLiveResults(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    runLiveSearch('snikers');
  }, []);

  const apps = [
    {
      id: 'customer',
      url: 'http://localhost:3000',
      title: 'Xaridor Ilovasi',
      roleTitle: 'Aholi va Xaridorlar uchun',
      badge: 'Xaridor Portali',
      badgeColor: 'bg-[#116B50]/15 text-[#116B50] dark:text-[#4ADE80] border-[#116B50]/30',
      icon: Search,
      desc: 'Yaqin atrofdagi do‘konlarni xaritada ko‘rish, tovar qoldig‘i va eng arzon narxni 1 soniyada topish, piyoda va avtomobilda to‘g‘ri marshrut olish.',
      features: [
        '50 metrdan 3 km gacha interaktiv radiusli GPS qidiruv',
        'Qidiruvsiz ham atrofdagi barcha tashkilot va do‘konlar xaritasi',
        'Do‘kon ustiga bosib uning barcha tovar va xizmatlarini ko‘rish',
        'Real vaqtda narxlar, qoldiqlar va yangilik darajasi (freshness)',
        'Ochiq/yopiq holati va 1 qadamli marshrut hisoblagich'
      ],
      previewImg: '🛒',
      btnText: 'Xaridor Ilovasini ochish →',
      btnBg: 'bg-[#116B50] hover:bg-[#0D533E]'
    },
    {
      id: 'merchant',
      url: 'http://localhost:3001',
      title: 'Do‘kon & Tashkilot Kabineti',
      roleTitle: 'Tadbirkor va Savdo Nuqtalari uchun',
      badge: 'Biznes Portali',
      badgeColor: 'bg-[#155E46]/15 text-[#155E46] dark:text-[#52B788] border-[#155E46]/30',
      icon: Store,
      desc: 'Do‘kon, filiallar, tovar va xizmatlar narxlari hamda qoldiqlarini onlayn boshqarish. Excel import va Telegram orqali xavfsiz tasdiqlash.',
      features: [
        'Tashkilot, filial, ish vaqti va STIR/INN ma’lumotlarini tahrirlash',
        'Excel / CSV orqali minglab tovarlarni 3 soniyada ommaviy yuklash',
        'Kassa narxlari va tovar mavjudligini real vaqtda yangilash',
        'Xaridorlar murojaatlarini qabul qilish va xatolarni bartaraf etish',
        'Telegram SMS tasdiqlash va qat’iy xavfsizlik tekshiruvi'
      ],
      previewImg: '🏪',
      btnText: 'Do‘kon Kabinetini ochish →',
      btnBg: 'bg-[#155E46] hover:bg-[#116B50]'
    },
    {
      id: 'moderator',
      url: 'http://localhost:3004',
      title: 'Moderator Portali',
      roleTitle: 'Moderatorlar va Kontent Nazoratchilari uchun',
      badge: 'Moderatsiya Markazi',
      badgeColor: 'bg-[#116B50]/15 text-[#116B50] dark:text-[#4ADE80] border-[#116B50]/30',
      icon: ShieldCheck,
      desc: 'Xarita moderatsiyasi, yangi do‘kon arizalari, xaridorlar shikoyat navbati, sharhlar nazorati, do‘kon xodimlari va murojaatlarni tezkor hal qilish.',
      features: [
        'Xarita & Moderatsiya markazida do‘konlar lokatsiyasi va ochiq/yopiq holatini tekshirish',
        'Yangi ochilgan do‘konlar arizalarini ko‘rib chiqish va faollashtirish',
        'Narx va manzil xatolari bo‘yicha xaridorlar shikoyatlarini zudlik bilan bartaraf etish',
        'Tashkilotlarga xodimlarni qo‘shish va Telegram orqali tasdiqlash',
        'Murojaatlar va savollarga rasmiy moderatsiya xulosalarini taqdim etish'
      ],
      previewImg: '🔍',
      btnText: 'Moderator Portalini ochish →',
      btnBg: 'bg-[#116B50] hover:bg-[#0D533E]'
    },
    {
      id: 'admin',
      url: 'http://localhost:3002',
      title: 'Boshqaruv Admin Paneli',
      roleTitle: 'Tizim Administratorlari uchun',
      badge: 'Boshqaruv Markazi',
      badgeColor: 'bg-[#2D6A4F]/15 text-[#2D6A4F] dark:text-[#74C69D] border-[#2D6A4F]/30',
      icon: Shield,
      desc: 'Butun shahar va tizim miqyosidagi qidiruv analitikasi, tashkilotlar moderatsiyasi, foydalanuvchilar rollari va jonli API Explorer.',
      features: [
        'Qidiruv ko‘rsatkichlari: xaridorlar bugun nima izladi, talab dinamikasi',
        'Xaridorlar e’tirozlari va do‘konlar shikoyatlarini tahlil qilish',
        'Tashkilotlar va filiallar ma’lumotlarini to‘g‘ridan-to‘g‘ri boshqarish',
        'Interaktiv moderatsiya xaritasi (qizil signallar bilan nazorat)',
        'Postman uslubidagi vizual REST API Explorer'
      ],
      previewImg: '🛡️',
      btnText: 'Admin Panelni ochish →',
      btnBg: 'bg-[#2D6A4F] hover:bg-[#1B4332]'
    }
  ];

  const faqs = [
    {
      q: 'YaqinTop tizimi qanday ishlaydi?',
      a: 'YaqinTop spatial (geografik) algoritmlar asosida foydalanuvchi joylashuvidan 50 metrdan 3 km gacha radiusdagi barcha faol do‘konlar, ulardagi tovarlar, narxlar va qoldiqlarni real vaqtda qidirib topadi.'
    },
    {
      q: 'Tadbirkor o‘z do‘koni va tovarlarini qanday qo‘shadi?',
      a: 'Tadbirkor "Tashkilot va Do‘kon Boshqaruvi" orqali o‘z korxonasini ro‘yxatdan o‘tkazadi, lokatsiyasini kartada belgilaydi va Excel/CSV fayli orqali yoki qo‘lda tovarlarini bir zumda yuklaydi.'
    },
    {
      q: 'Moderator va Admin rollari orasida qanday farq bor?',
      a: 'Admin tizimning butun arxitekturasi, server DB xaritasi va API Explorer bilan ishlaydi. Moderator esa do‘konlar arizalari, xaridorlar shikoyatlari, sharhlar moderatsiyasi, xarita nuqtalari va xodimlar boshqaruvi bilan shug‘ullanadi.'
    },
    {
      q: 'Xaridor qidiruv maydonida hech narsa yozmasa nima bo‘ladi?',
      a: 'Xaridor hech narsa izlamagan holatda ham interaktiv xaritada atrofdagi barcha ochiq do‘konlar va tashkilotlar pinlari ko‘rinadi. Istalgan birini bosib, uning to‘liq tovar va xizmatlar katalogini ko‘rish mumkin.'
    },
    {
      q: 'Admin paneldagi Qidiruv Analitikasi nimalarni ko‘rsatadi?',
      a: 'Admin panelda foydalanuvchilar qaysi tovar va xizmatlarni eng ko‘p qidirgani, bugungi faollik, topilgan/topilmagan so‘rovlar va xaridorlar shikoyatlari bo‘yicha to‘liq jonli statistika beriladi.'
    },
    {
      q: 'Tizim mobil telefonlarda qanday ishlaydi?',
      a: 'Barcha platformalar to‘liq moslashuvchan (Responsive & PWA-ready) bo‘lib, smartfonlarda pastki tezkor navigatsiya paneli va qulay interfeys bilan ishlaydi.'
    }
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDarkMode ? 'dark bg-[#0A120E] text-[#E8F2EC]' : 'bg-[#F4F7F5] text-[#172C28]'}`}>
      {/* Top Floating Glow Backdrop */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#116B50]/15 dark:bg-[#116B50]/20 blur-[130px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-[#DCE5DF] dark:border-white/10 px-4 md:px-10 py-3.5 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-[#116B50] to-[#22C55E] rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-[#116B50]/30">
            Y
          </div>
          <div>
            <div className="font-extrabold text-xl tracking-tight text-[#172C28] dark:text-white flex items-center gap-2">
              <span>YaqinTop</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#116B50]/15 text-[#116B50] dark:text-[#4ADE80] font-bold border border-[#116B50]/30">
                v2.0 Platform
              </span>
            </div>
            <span className="text-[10px] text-[#566A63] dark:text-[#4ADE80]/80 font-medium">
              Mahalliy Tovar va Xizmatlar Ekotizimi
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-[#566A63] dark:text-[#8B9E95]">
          <a href="#roles" className="hover:text-[#116B50] dark:hover:text-white transition">Platforma Rollari</a>
          <a href="#interactive-map" className="hover:text-[#116B50] dark:hover:text-white transition">Karta Maketi</a>
          <a href="#live-search" className="hover:text-[#116B50] dark:hover:text-white transition">Jonli Test</a>
          <a href="#architecture" className="hover:text-[#116B50] dark:hover:text-white transition">Arxitektura</a>
          <a href="#faq" className="hover:text-[#116B50] dark:hover:text-white transition">Savol-Javoblar</a>
        </nav>

        {/* Action Buttons & Theme Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? "Yorug' tema" : "Qorong'i tema"}
            className="w-9 h-9 rounded-xl border border-[#DCE5DF] dark:border-white/10 bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#EDF5F0] dark:hover:bg-[#1E3328] transition flex items-center justify-center shadow-sm"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-emerald-400" /> : <Moon className="w-4 h-4 text-[#116B50]" />}
          </button>

          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-[#116B50] hover:bg-[#0D533E] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Xaridor</span>
          </a>
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-[#155E46] hover:bg-[#116B50] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Do‘kon</span>
          </a>
          <a
            href="http://localhost:3004"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-[#116B50] hover:bg-[#0D533E] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Moderator</span>
          </a>
          <a
            href="http://localhost:3002"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 pb-16 px-4 md:px-8 max-w-7xl mx-auto text-center flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E0EFE7] dark:bg-[#162720] border border-[#116B50]/30 dark:border-[#4ADE80]/30 text-[#116B50] dark:text-[#4ADE80] text-xs font-bold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>O‘zbekistondagi eng tezkor mahalliy giper-lokal qidiruv tarmog‘i</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#172C28] dark:text-white leading-tight max-w-4xl">
          Kerakli tovar va xizmatni <span className="text-gradient">1 soniyada</span> eng yaqin do‘kondan toping
        </h1>

        <p className="text-base md:text-xl text-[#566A63] dark:text-[#9CB3A8] mt-5 max-w-2xl leading-relaxed font-medium">
          YaqinTop — xaridorlar, savdo do‘konlari, moderatorlar va boshqaruvchilarni yagona aqlli xarita orqali birlashtiruvchi to‘liq mikroservisli ekotizim.
        </p>

        {/* 4 Main Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-10">
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <a
                key={app.id}
                href={app.url}
                target="_blank"
                rel="noreferrer"
                className="glass-card hover:border-[#116B50]/50 dark:hover:border-[#4ADE80]/50 p-6 rounded-3xl flex flex-col justify-between text-left transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden shadow-sm"
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-[#116B50]/5 rounded-full blur-2xl group-hover:bg-[#116B50]/10 transition" />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#E0EFE7] dark:bg-[#1B2F25] border border-[#116B50]/30 flex items-center justify-center text-[#116B50] dark:text-[#4ADE80] group-hover:scale-110 transition shadow-inner">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${app.badgeColor}`}>
                      {app.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#172C28] dark:text-white group-hover:text-[#116B50] dark:group-hover:text-[#4ADE80] transition">
                    {app.title}
                  </h3>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1.5 line-clamp-2">
                    {app.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#DCE5DF]/60 dark:border-white/5 flex items-center justify-between text-xs font-bold text-[#116B50] dark:text-[#4ADE80] group-hover:translate-x-1 transition">
                  <span>Ilovani ochish</span>
                  <ExternalLink className="w-4 h-4" />
                </div>
              </a>
            );
          })}
        </div>

        {/* KPI Strip */}
        <div className="mt-14 w-full glass-panel rounded-3xl p-5 md:p-7 grid grid-cols-2 md:grid-cols-4 gap-4 text-center shadow-sm">
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-[#172C28] dark:text-white">50m – 3km</div>
            <div className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 font-semibold">Dinamik qidiruv radiusi</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-[#116B50] dark:text-[#4ADE80]">&lt; 30 ms</div>
            <div className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 font-semibold">Spatial qidiruv tezligi</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-[#155E46] dark:text-[#52B788]">100% Real-time</div>
            <div className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 font-semibold">Kassa qoldiqlari sinxroni</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-[#2D6A4F] dark:text-[#74C69D]">4 Ta Portal</div>
            <div className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 font-semibold">Markaziy REST API</div>
          </div>
        </div>
      </section>

      {/* Interactive Role Deep Dive Section */}
      <section id="roles" className="py-16 px-4 md:px-8 max-w-6xl mx-auto w-full border-t border-[#DCE5DF] dark:border-white/5">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#116B50] dark:text-[#4ADE80]">Ekotizim Rollari</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#172C28] dark:text-white mt-2">
            Kimlar nimalar qila oladi?
          </h2>
          <p className="text-sm text-[#566A63] dark:text-[#8B9E95] mt-2 max-w-lg mx-auto">
            YaqinTop har bir foydalanuvchi toifasi uchun ixtisoslashgan va qulay interfeys taqdim etadi.
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="flex justify-center gap-2 p-1.5 bg-[#E8F0EB] dark:bg-[#14221B] rounded-2xl max-w-xl mx-auto mb-8 border border-[#DCE5DF] dark:border-white/10">
          <button
            onClick={() => setActiveRoleTab('customer')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeRoleTab === 'customer'
                ? 'bg-[#116B50] text-white shadow-md'
                : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Xaridor
          </button>
          <button
            onClick={() => setActiveRoleTab('merchant')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeRoleTab === 'merchant'
                ? 'bg-[#155E46] text-white shadow-md'
                : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" /> Do‘kon
          </button>
          <button
            onClick={() => setActiveRoleTab('moderator')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeRoleTab === 'moderator'
                ? 'bg-[#116B50] text-white shadow-md'
                : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Moderator
          </button>
          <button
            onClick={() => setActiveRoleTab('admin')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeRoleTab === 'admin'
                ? 'bg-[#2D6A4F] text-white shadow-md'
                : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Admin
          </button>
        </div>

        {/* Active Role Content Card */}
        {(() => {
          const role = apps.find(a => a.id === activeRoleTab)!;
          const RoleIcon = role.icon;
          return (
            <div className="glass-card rounded-3xl p-6 md:p-10 border border-[#DCE5DF] dark:border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-sm">
              <div className="lg:col-span-7 flex flex-col gap-5">
                <div className="flex items-center gap-2.5">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${role.badgeColor}`}>
                    {role.badge}
                  </span>
                  <span className="text-xs text-[#566A63] dark:text-[#8B9E95] font-semibold">{role.roleTitle}</span>
                </div>

                <h3 className="text-2xl md:text-3xl font-extrabold text-[#172C28] dark:text-white">
                  {role.title} Imkoniyatlari
                </h3>

                <p className="text-sm text-[#566A63] dark:text-[#9CB3A8] leading-relaxed">
                  {role.desc}
                </p>

                <div className="flex flex-col gap-3 my-2">
                  {role.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs text-[#172C28] dark:text-[#E8F2EC]">
                      <CheckCircle2 className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex flex-wrap items-center gap-3">
                  <a
                    href={role.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`px-6 py-3 rounded-xl text-white text-xs font-bold transition flex items-center gap-2 shadow-lg ${role.btnBg}`}
                  >
                    <span>{role.btnText}</span>
                  </a>
                </div>
              </div>

              {/* Visual Mockup Panel */}
              <div className="lg:col-span-5 bg-white dark:bg-[#121E18] border border-[#DCE5DF] dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between h-full min-h-[300px] shadow-inner">
                <div className="flex items-center justify-between pb-3 border-b border-[#DCE5DF]/60 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#116B50]/80" />
                    <div className="w-3 h-3 rounded-full bg-[#155E46]/80" />
                    <div className="w-3 h-3 rounded-full bg-[#2D6A4F]/80" />
                  </div>
                  <span className="text-[11px] font-mono text-[#566A63] dark:text-[#8B9E95] font-semibold">{role.title}</span>
                </div>

                <div className="my-auto py-8 text-center flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-[#E0EFE7] dark:bg-[#1B2D24] border border-[#116B50]/30 flex items-center justify-center text-4xl mb-4 shadow-xl">
                    {role.previewImg}
                  </div>
                  <h4 className="font-extrabold text-base text-[#172C28] dark:text-white">{role.title}</h4>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1 max-w-xs">
                    Interaktiv boshqaruv va barcha modullar to‘liq ishchi holatda
                  </p>
                </div>

                <div className="p-3 bg-[#F9FAF9] dark:bg-[#182820] rounded-xl text-[11px] text-[#566A63] dark:text-[#9CB3A8] flex items-center justify-between border border-[#DCE5DF] dark:border-white/5">
                  <span className="flex items-center gap-1.5 text-[#116B50] dark:text-[#4ADE80] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#116B50] dark:bg-[#4ADE80] animate-pulse" /> Faol va tayyor
                  </span>
                  <a href={role.url} target="_blank" rel="noreferrer" className="text-[#116B50] dark:text-white hover:underline font-bold">
                    Ochish ↗
                  </a>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* MINIMAL CUSTOMER LEAFLET MAP WIDGET SECTION */}
      <section id="interactive-map" className="py-16 px-4 md:px-8 max-w-6xl mx-auto w-full border-t border-[#DCE5DF] dark:border-white/5">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0EFE7] dark:bg-[#162720] border border-[#116B50]/30 dark:border-[#4ADE80]/30 text-[#116B50] dark:text-[#4ADE80] text-xs font-bold mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>Xaridor Ilovasi: Interaktiv Leaflet Karta Maketi</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#172C28] dark:text-white">
            Giper-lokal xaritaning ishlash prinsipi
          </h2>
          <p className="text-sm text-[#566A63] dark:text-[#8B9E95] mt-2 max-w-2xl mx-auto">
            Xaridor ilovasidagi haqiqiy Leaflet kartasi stili asosida 50m – 3km radiusdagi barcha ochiq do‘konlar, ulardagi tovarlar soni va narxlar real vaqtda ko‘rinadi.
          </p>
        </div>

        {/* Minimal Leaflet Map Component */}
        <MinimalCustomerMapWidget isDarkMode={isDarkMode} />
      </section>

      {/* Live Interactive Search Sandbox */}
      <section id="live-search" className="py-16 px-4 md:px-8 max-w-6xl mx-auto w-full border-t border-[#DCE5DF] dark:border-white/5">
        <div className="glass-card rounded-3xl p-6 md:p-10 border border-[#116B50]/20 dark:border-[#4ADE80]/20 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#116B50]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#116B50] dark:text-[#4ADE80]">Jonli Demo & Sandbox</span>
            <h2 className="text-3xl font-extrabold text-[#172C28] dark:text-white mt-1">
              Haqiqiy API orqali tovar qidirib ko‘ring
            </h2>
            <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-2">
              Ushbu qidiruv to‘g‘ridan-to‘g‘ri markaziy REST API orqali atrofdagi do‘konlarni qidiradi.
            </p>
          </div>

          {/* Search Box */}
          <div className="flex flex-col sm:flex-row gap-2 mt-6 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#566A63] dark:text-[#8B9E95]" />
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runLiveSearch(testQuery)}
                placeholder="Mahsulot nomi (masalan: Snikers, Non, Sut, Coca-cola)..."
                className="w-full h-11 pl-10 pr-4 bg-white dark:bg-[#14221B] border border-[#DCE5DF] dark:border-white/10 rounded-xl text-xs text-[#172C28] dark:text-white placeholder-[#566A63] dark:placeholder-[#8B9E95] focus:outline-none focus:border-[#116B50]"
              />
            </div>
            <button
              onClick={() => runLiveSearch(testQuery)}
              disabled={isSearching}
              className="h-11 px-6 bg-[#116B50] hover:bg-[#0D533E] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md shrink-0 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isSearching ? 'Qidirilmoqda...' : 'Sinab ko‘rish'}</span>
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95]">Masalan:</span>
            {['Snikers', 'Coca-cola', 'Non', 'Sut', 'Tuxum'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setTestQuery(tag);
                  runLiveSearch(tag);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-[#14221B] border border-[#DCE5DF] dark:border-white/10 text-[#116B50] dark:text-[#4ADE80] hover:bg-[#E0EFE7] dark:hover:bg-[#116B50]/20 transition font-medium"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Live Results Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {liveResults.length > 0 ? (
              liveResults.map((item, i) => (
                <div key={i} className="bg-white dark:bg-[#121E18] border border-[#DCE5DF] dark:border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[11px] text-[#566A63] dark:text-[#8B9E95] mb-2">
                      <span className="truncate font-semibold text-[#172C28] dark:text-white">{item.store.name}</span>
                      <span className="text-[#116B50] dark:text-[#4ADE80] shrink-0 font-bold">{item.distanceM} m</span>
                    </div>
                    <div className="font-bold text-sm text-[#172C28] dark:text-white mb-1">{item.bestOffer.variant.title}</div>
                    <div className="text-lg font-extrabold text-[#116B50] dark:text-[#4ADE80]">
                      {Number(item.bestOffer.price).toLocaleString('uz-UZ')}{' '}
                      <span className="text-xs font-normal text-[#566A63] dark:text-[#8B9E95]">so‘m / {item.bestOffer.variant.packUnit}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#DCE5DF]/60 dark:border-white/5 flex items-center justify-between text-[11px]">
                    <span className={item.isOpenNow ? 'text-[#116B50] dark:text-[#4ADE80] font-bold' : 'text-red-500 font-bold'}>
                      {item.isOpenNow ? '● Ochiq' : '○ Yopiq'}
                    </span>
                    <a
                      href="http://localhost:3000"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#116B50] dark:text-[#4ADE80] hover:underline font-bold"
                    >
                      Xaritada ko‘rish →
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 p-8 text-center bg-white dark:bg-[#121E18] rounded-2xl border border-dashed border-[#DCE5DF] dark:border-white/10 text-xs text-[#566A63] dark:text-[#8B9E95]">
                Tovar topilmadi yoki qidiruv so‘rovi kiritilmagan
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Ecosystem Architecture & Features */}
      <section id="architecture" className="py-16 px-4 md:px-8 max-w-6xl mx-auto w-full border-t border-[#DCE5DF] dark:border-white/5">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#116B50] dark:text-[#4ADE80]">Tizim Arxitekturasi</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#172C28] dark:text-white mt-2">
            Nega YaqinTop boshqalardan ustun?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-3xl border border-[#DCE5DF] dark:border-white/10 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#E0EFE7] dark:bg-[#116B50]/15 border border-[#116B50]/20 flex items-center justify-center text-[#116B50] dark:text-[#4ADE80] mb-4 shadow-sm">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#172C28] dark:text-white">Spatial Giper-Lokal Qidiruv</h3>
            <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-2 leading-relaxed">
              Oddiy matn qidiruvidan farqli ravishda, Haversine va geodezik koordinata algoritmlari orqali aniq radius ichidagi eng yaqin do‘konlarni saralaydi.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-[#DCE5DF] dark:border-white/10 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#E0EFE7] dark:bg-[#155E46]/15 border border-[#155E46]/20 flex items-center justify-center text-[#155E46] dark:text-[#52B788] mb-4 shadow-sm">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#172C28] dark:text-white">Oson Excel & API Integratsiyasi</h3>
            <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-2 leading-relaxed">
              Tadbirkorlar 1C, Excel yoki CSV orqali o‘z do‘konidagi barcha tovar va xizmatlarni soniyalar ichida yuklab, narx va qoldiqlarini boshqarishi mumkin.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-[#DCE5DF] dark:border-white/10 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F0EB] dark:bg-[#2D6A4F]/15 border border-[#2D6A4F]/20 flex items-center justify-center text-[#2D6A4F] dark:text-[#74C69D] mb-4 shadow-sm">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#172C28] dark:text-white">Qidiruv & Talab Analitikasi</h3>
            <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-2 leading-relaxed">
              Admin panelda butun shahar bo‘ylab aholi nima izlayotgani, qaysi tovarlarga talab yuqoriligi va savdo dinamikasi jonli tahlil qilinadi.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 px-4 md:px-8 max-w-4xl mx-auto w-full border-t border-[#DCE5DF] dark:border-white/5">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#116B50] dark:text-[#4ADE80]">Ko‘p beriladigan savollar</span>
          <h2 className="text-3xl font-extrabold text-[#172C28] dark:text-white mt-1">FAQ & Yo‘riqnoma</h2>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => {
            const isOpen = openFaqIndex === i;
            return (
              <div
                key={i}
                onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                className="glass-card rounded-2xl border border-[#DCE5DF] dark:border-white/10 p-5 cursor-pointer transition select-none hover:border-[#116B50]/30 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-bold text-sm text-[#172C28] dark:text-white">{faq.q}</h4>
                  <ChevronDown className={`w-4 h-4 text-[#116B50] dark:text-[#4ADE80] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
                {isOpen && (
                  <p className="text-xs text-[#566A63] dark:text-[#9CB3A8] mt-3 pt-3 border-t border-[#DCE5DF]/60 dark:border-white/5 leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner (Unified dark emerald forest gradient) */}
      <section className="py-14 px-4 md:px-8 max-w-6xl mx-auto w-full">
        <div className="glass-panel border border-[#116B50]/30 dark:border-[#4ADE80]/30 rounded-3xl p-8 md:p-12 text-center flex flex-col items-center relative overflow-hidden shadow-md">
          <div className="absolute inset-0 bg-gradient-to-r from-[#116B50]/15 via-transparent to-[#2D6A4F]/15 pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#172C28] dark:text-white max-w-2xl">
            YaqinTop ekotizimini hoziroq sinab ko‘ring
          </h2>
          <p className="text-sm text-[#566A63] dark:text-[#9CB3A8] mt-3 max-w-lg font-medium">
            Kerakli ilovani tanlang va barcha imkoniyatlardan foydalaning.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-2xl bg-[#116B50] hover:bg-[#0D533E] text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-[#116B50]/30"
            >
              <Search className="w-4 h-4" />
              <span>Xaridor Ilovasi</span>
            </a>
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-2xl bg-[#155E46] hover:bg-[#116B50] text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-[#155E46]/30"
            >
              <Store className="w-4 h-4" />
              <span>Do‘kon Kabineti</span>
            </a>
            <a
              href="http://localhost:3004"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-2xl bg-[#116B50] hover:bg-[#0D533E] text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-[#116B50]/30"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Moderator Portali</span>
            </a>
            <a
              href="http://localhost:3002"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-2xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-[#2D6A4F]/30"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Paneli</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto glass-panel border-t border-[#DCE5DF] dark:border-white/10 px-4 md:px-10 py-6 text-xs text-[#566A63] dark:text-[#8B9E95] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#116B50] rounded-lg flex items-center justify-center text-white font-bold text-xs">
            Y
          </div>
          <span className="font-bold text-[#172C28] dark:text-white">YaqinTop Platform</span>
          <span>© 2026 Barcha huquqlar himoyalangan</span>
        </div>

        <div className="flex items-center gap-4 font-semibold text-[11px] flex-wrap">
          <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="hover:text-[#116B50] dark:hover:text-white transition">Xaridor Ilovasi</a>
          <a href="http://localhost:3001" target="_blank" rel="noreferrer" className="hover:text-[#116B50] dark:hover:text-white transition">Do‘kon Kabineti</a>
          <a href="http://localhost:3004" target="_blank" rel="noreferrer" className="hover:text-[#116B50] dark:hover:text-white transition">Moderator Portali</a>
          <a href="http://localhost:3002" target="_blank" rel="noreferrer" className="hover:text-[#116B50] dark:hover:text-white transition">Admin Paneli</a>
          <a href="http://localhost:4000/api/v1/health" target="_blank" rel="noreferrer" className="text-[#116B50] dark:text-[#4ADE80] hover:underline">API Holati</a>
        </div>
      </footer>
    </div>
  );
}
