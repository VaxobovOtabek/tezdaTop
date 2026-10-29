import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'uz' | 'ru' | 'en';

export interface Translations {
  [key: string]: {
    uz: string;
    ru: string;
    en: string;
  };
}

export const DICTIONARY: Translations = {
  // Common / Umumiy
  'search': { uz: 'Qidirish', ru: 'Поиск', en: 'Search' },
  'search_placeholder': { uz: 'Mahsulot, dori yoki xizmat qidirish...', ru: 'Поиск товара, лекарства или услуги...', en: 'Search product, medicine or service...' },
  'all': { uz: 'Barchasi', ru: 'Все', en: 'All' },
  'active': { uz: 'Faol', ru: 'Активный', en: 'Active' },
  'pending': { uz: 'Kutilmoqda', ru: 'В ожидании', en: 'Pending' },
  'closed': { uz: 'Yopiq', ru: 'Закрыто', en: 'Closed' },
  'open': { uz: 'Ochiq', ru: 'Открыто', en: 'Open' },
  'save': { uz: 'Saqlash', ru: 'Сохранить', en: 'Save' },
  'cancel': { uz: 'Bekor qilish', ru: 'Отмена', en: 'Cancel' },
  'delete': { uz: 'O‘chirish', ru: 'Удалить', en: 'Delete' },
  'edit': { uz: 'Tahrirlash', ru: 'Редактировать', en: 'Edit' },
  'add': { uz: 'Qo‘shish', ru: 'Добавить', en: 'Add' },
  'confirm': { uz: 'Tasdiqlash', ru: 'Подтвердить', en: 'Confirm' },
  'refresh': { uz: 'Yangilash', ru: 'Обновить', en: 'Refresh' },
  'details': { uz: 'Tafsilotlar', ru: 'Подробнее', en: 'Details' },
  'actions': { uz: 'Amallar', ru: 'Действия', en: 'Actions' },
  'status': { uz: 'Holat', ru: 'Статус', en: 'Status' },
  'date': { uz: 'Sana', ru: 'Дата', en: 'Date' },
  'name': { uz: 'Nomi', ru: 'Название', en: 'Name' },
  'phone': { uz: 'Telefon', ru: 'Телефон', en: 'Phone' },
  'address': { uz: 'Manzil', ru: 'Адрес', en: 'Address' },
  'login': { uz: 'Kirish', ru: 'Войти', en: 'Login' },
  'logout': { uz: 'Chiqish', ru: 'Выйти', en: 'Logout' },
  'register': { uz: 'Ro‘yxatdan o‘tish', ru: 'Регистрация', en: 'Register' },
  'close': { uz: 'Yopish', ru: 'Закрыть', en: 'Close' },
  'loading': { uz: 'Yuklanmoqda...', ru: 'Загрузка...', en: 'Loading...' },
  'success': { uz: 'Muvaffaqiyatli', ru: 'Успешно', en: 'Success' },
  'error': { uz: 'Xatolik', ru: 'Ошибка', en: 'Error' },
  'sum': { uz: 'so‘m', ru: 'сум', en: 'UZS' },

  // Navigation / Menyu
  'nav_home': { uz: 'Bosh sahifa', ru: 'Главная', en: 'Home' },
  'nav_customer': { uz: 'Xaridor ilovasi', ru: 'Покупателям', en: 'Customer App' },
  'nav_merchant': { uz: 'Do‘kon boshqaruvi', ru: 'Кабинет продавца', en: 'Merchant Hub' },
  'nav_admin': { uz: 'Administratsiya', ru: 'Администрация', en: 'Admin Panel' },
  'nav_map': { uz: 'Xarita & Moderatsiya', ru: 'Карта и Модерация', en: 'Map & Moderation' },
  'nav_overview': { uz: 'Umumiy holat', ru: 'Общий обзор', en: 'Overview' },
  'nav_growth_dynamics': { uz: 'Tizimga Qo‘shilish Dinamikasi', ru: 'Динамика подключений', en: 'Growth Dynamics' },
  'nav_supabase_limits': { uz: 'Supabase limitlari', ru: 'Лимиты Supabase', en: 'Supabase Limits' },
  'nav_map_hub': { uz: 'Xarita & Moderatsiya markazi', ru: 'Центр Карты и Модерации', en: 'Map & Moderation Hub' },
  'nav_inquiries': { uz: 'So‘rovlar & Murojaatlar', ru: 'Запросы и обращения', en: 'Requests & Inquiries' },
  'nav_analytics': { uz: 'Qidiruv & Faoliyat Analitikasi', ru: 'Аналитика поиска и активности', en: 'Search & Activity Analytics' },
  'nav_architecture_db': { uz: 'Arxitektura & DB Explorer', ru: 'Архитектура и БД Explorer', en: 'Architecture & DB Explorer' },
  'nav_roles_guide': { uz: 'Rollar & Yo‘riqnoma', ru: 'Роли и инструкции', en: 'Roles & Guide' },
  'nav_organizations': { uz: 'Tashkilotlar va Do‘konlar', ru: 'Организации и магазины', en: 'Organizations & Stores' },
  'nav_api_explorer': { uz: 'API Explorer (Postman)', ru: 'API Explorer (Postman)', en: 'API Explorer (Postman)' },
  'nav_applications': { uz: 'Do‘kon arizalari', ru: 'Заявки магазинов', en: 'Store Applications' },
  'nav_reports': { uz: 'Shikoyatlar navbati', ru: 'Очередь жалоб', en: 'Complaints Queue' },
  'nav_reviews': { uz: 'Sharhlar moderatsiyasi', ru: 'Модерация отзывов', en: 'Reviews Moderation' },
  'nav_audit': { uz: 'Tizim auditi', ru: 'Аудит системы', en: 'System Audit' },
  'nav_users': { uz: 'Foydalanuvchilar', ru: 'Пользователи', en: 'Users & Staff' },
  'nav_catalog': { uz: 'Tovarlar katalogi', ru: 'Каталог товаров', en: 'Product Catalog' },
  'nav_stock': { uz: 'Qoldiq nazorati', ru: 'Контроль остатков', en: 'Stock Control' },
  'nav_sales': { uz: 'Sotuvlar', ru: 'Продажи', en: 'Sales' },
  'nav_inbox': { uz: 'Xabarlar & Murojaatlar', ru: 'Сообщения и обращения', en: 'Inbox & Inquiries' },
  'nav_settings': { uz: 'Sozlamalar', ru: 'Настройки', en: 'Settings' },

  // Landing Page
  'landing_badge': {
    uz: 'O‘zbekistondagi №1 Mahalliy Qidiruv Ekotizimi',
    ru: '№1 Локальная поисковая экосистема в Узбекистане',
    en: '#1 Local Discovery Ecosystem in Uzbekistan'
  },
  'landing_hero_title': {
    uz: 'Yaqin atrofingizdagi tovar va xizmatlarni bir zumda toping',
    ru: 'Мгновенно находите товары и услуги рядом с вами',
    en: 'Find nearby products and services in an instant'
  },
  'landing_hero_subtitle': {
    uz: 'Do‘konlar rastasidagi aniq narxlar, mahsulot qoldiqlari va manzillar bitta qulay platformada.',
    ru: 'Точные цены на полках магазинов, остатки товаров и точные адреса на одной удобной платформе.',
    en: 'Exact shelf prices, real-time stock availability, and verified store locations in one smart platform.'
  },
  'landing_cta_search': {
    uz: 'Tovarlarni qidirish',
    ru: 'Искать товары',
    en: 'Search Products'
  },
  'landing_cta_business': {
    uz: 'Do‘koningizni ulang',
    ru: 'Подключить магазин',
    en: 'Connect Your Store'
  },
  'landing_stat_stores': {
    uz: 'Faol do‘kon va filiallar',
    ru: 'Активных магазинов и точек',
    en: 'Active stores and branches'
  },
  'landing_stat_products': {
    uz: 'Mavjud tovarlar',
    ru: 'Товаров в каталоге',
    en: 'Available products'
  },
  'landing_stat_users': {
    uz: 'Oylik faol xaridorlar',
    ru: 'Активных покупателей в месяц',
    en: 'Monthly active shoppers'
  },
  'landing_feature_geo_title': {
    uz: 'Geolokatsiya orqali aniq qidiruv',
    ru: 'Точный поиск по геолокации',
    en: 'Precise Geolocation Search'
  },
  'landing_feature_geo_desc': {
    uz: 'O‘zingizga eng yaqin masofadagi ochiq do‘konlarni xaritada ko‘ring.',
    ru: 'Находите открытые торговые точки рядом с вами на интерактивной карте.',
    en: 'Locate open stores nearest to your position on an interactive map.'
  },
  'landing_feature_price_title': {
    uz: 'Do‘konlardagi real narxlar',
    ru: 'Актуальные цены магазинов',
    en: 'Real-time Shelf Prices'
  },
  'landing_feature_price_desc': {
    uz: 'Chiqmasdan oldin mahsulot narxini va qoldig‘ini tekshiring.',
    ru: 'Сравнивайте цены и проверяйте наличие товара до выхода из дома.',
    en: 'Check inventory levels and price comparisons before heading out.'
  },
  'landing_feature_qr_title': {
    uz: 'Biznes uchun qulay boshqaruv',
    ru: 'Удобное управление для бизнеса',
    en: 'Smart Tools for Merchants'
  },
  'landing_feature_qr_desc': {
    uz: 'Kirim, chiqim, kassa va qoldiqlar nazoratini bitta ilovada yuriting.',
    ru: 'Ведите склад, кассу, продажи и остатки в едином простом приложении.',
    en: 'Manage inventory, sales, receipts, and store branches in one app.'
  },
  'landing_for_business_title': {
    uz: 'Savdo biznesingizni yangi bosqichga olib chiqing',
    ru: 'Выведите розничный бизнес на новый уровень',
    en: 'Elevate your retail business to the next level'
  },
  'landing_for_business_desc': {
    uz: 'YaqinTop orqali savdo nuqtangizni xaritaga joylashtiring, tovarlarni kiriting va yangi mijozlar oqimini jalb qiling.',
    ru: 'Разместите торговую точку на карте YaqinTop, загрузите каталог и привлекайте новых покупателей вокруг вас.',
    en: 'Place your store on YaqinTop map, upload product inventory, and welcome a steady stream of local shoppers.'
  },

  // Customer App
  'cust_search_input': {
    uz: 'Qaysi mahsulot yoki dorini qidiryapsiz?',
    ru: 'Какой товар или лекарство вы ищете?',
    en: 'What product or medicine are you looking for?'
  },
  'cust_radius': { uz: 'Masofa radiusi', ru: 'Радиус поиска', en: 'Search Radius' },
  'cust_open_now': { uz: 'Faqat ochiqlar', ru: 'Только открытые', en: 'Open Now Only' },
  'cust_nearby_stores': { uz: 'Atrofdagi do‘konlar', ru: 'Магазины поблизости', en: 'Nearby Stores' },
  'cust_propose_item': { uz: 'Tovar taklif qilish', ru: 'Предложить товар', en: 'Propose Product' },
  'cust_report_issue': { uz: 'Xatolik haqida xabar', ru: 'Сообщить об ошибке', en: 'Report an Issue' },
  'cust_empty': { uz: 'Hech narsa topilmadi', ru: 'Ничего не найдено', en: 'No results found' },

  // Merchant
  'merch_add_product': { uz: '+ Yangi tovar', ru: '+ Новый товар', en: '+ Add Product' },
  'merch_import_excel': { uz: 'Excel orqali yuklash', ru: 'Импорт из Excel', en: 'Import from Excel' },
  'merch_total_sales': { uz: 'Jami sotuvlar', ru: 'Общие продажи', en: 'Total Sales' },
  'merch_stock_value': { uz: 'Ombor qiymati', ru: 'Стоимость склада', en: 'Stock Value' },
  'merch_quick_sale': { uz: '+ Sotuv', ru: '+ Продажа', en: '+ Sale' },
  'merch_quick_income': { uz: '+ Kirim', ru: '+ Приход', en: '+ Stock In' },

  // Admin
  'admin_resolve_issue': { uz: 'Muammoni o‘chirish', ru: 'Снять проблему', en: 'Resolve Issue' },
  'admin_approve': { uz: 'Tasdiqlash', ru: 'Одобрить', en: 'Approve' },
  'admin_reject': { uz: 'Rad etish', ru: 'Отклонить', en: 'Reject' },
  'admin_system_online': { uz: 'Tizim onlayn', ru: 'Система онлайн', en: 'System Online' }
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'uz',
  setLang: () => {},
  t: (key, fallback) => fallback || key
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('yaqintop_lang');
      if (saved === 'ru' || saved === 'en' || saved === 'uz') return saved;
    } catch {
      // ignore
    }
    return 'uz';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('yaqintop_lang', newLang);
      document.documentElement.lang = newLang;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  }, [lang]);

  const t = (key: string, fallback?: string): string => {
    const item = DICTIONARY[key];
    if (item && item[lang]) {
      return item[lang];
    }
    return fallback || item?.uz || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}

export interface LanguageSwitcherProps {
  className?: string;
  variant?: 'buttons' | 'dropdown' | 'minimal';
}

export function LanguageSwitcher({ className = '', variant = 'dropdown' }: LanguageSwitcherProps) {
  const { lang, setLang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; label: string; flag: string; short: string }[] = [
    { code: 'uz', label: 'O‘zbekcha', flag: '🇺🇿', short: 'UZ' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺', short: 'RU' },
    { code: 'en', label: 'English', flag: '🇬🇧', short: 'EN' }
  ];

  const current = languages.find(l => l.code === lang) || languages[0];

  if (variant === 'buttons') {
    return (
      <div className={`inline-flex items-center bg-[#F3F6F3] dark:bg-[#1A2822] p-1 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] text-xs font-bold ${className}`}>
        {languages.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
              lang === l.code
                ? 'bg-[#116B50] text-white shadow-sm'
                : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.short}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 rounded-xl border border-[#DCE5DF] dark:border-[#273B32] bg-white dark:bg-[#16241E] text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#EDF5F0] dark:hover:bg-[#1E3328] transition flex items-center gap-1.5 text-xs font-bold shadow-sm"
      >
        <span>{current.flag}</span>
        <span>{current.short}</span>
        <svg className="w-3.5 h-3.5 opacity-60 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-[#16241E] rounded-xl shadow-xl border border-[#DCE5DF] dark:border-[#273B32] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLang(l.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition ${
                  lang === l.code
                    ? 'bg-[#116B50] text-white'
                    : 'text-[#172C28] dark:text-[#E8F2EC] hover:bg-[#F3F6F3] dark:hover:bg-[#1A2822]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </span>
                {lang === l.code && <span>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
