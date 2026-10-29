import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

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
  'search_btn': { uz: 'Izlash', ru: 'Поиск', en: 'Search' },
  'search_placeholder': { uz: 'Mahsulot, dori yoki xizmat qidirish...', ru: 'Поиск товара, лекарства или услуги...', en: 'Search product, medicine or service...' },
  'all': { uz: 'Barchasi', ru: 'Все', en: 'All' },
  'active': { uz: 'Faol', ru: 'Активный', en: 'Active' },
  'pending': { uz: 'Kutilmoqda', ru: 'В ожидании', en: 'Pending' },
  'pending_wait': { uz: 'Kutilayotgan', ru: 'Ожидают', en: 'Pending' },
  'closed': { uz: 'Yopiq', ru: 'Закрыто', en: 'Closed' },
  'open': { uz: 'Ochiq', ru: 'Открыто', en: 'Open' },
  'open_dot': { uz: '● Ochiq', ru: '● Открыто', en: '● Open' },
  'closed_dot': { uz: '○ Yopiq', ru: '○ Закрыто', en: '○ Closed' },
  'open_now': { uz: 'Hozir ochiq', ru: 'Сейчас открыто', en: 'Open now' },
  'in_stock': { uz: 'Mavjud', ru: 'В наличии', en: 'In stock' },
  'fresh_only': { uz: 'Faqat yangi', ru: 'Только новые', en: 'Fresh only' },
  'new': { uz: 'Yangi', ru: 'Новый', en: 'New' },
  'save': { uz: 'Saqlash', ru: 'Сохранить', en: 'Save' },
  'cancel': { uz: 'Bekor qilish', ru: 'Отмена', en: 'Cancel' },
  'delete': { uz: 'O‘chirish', ru: 'Удалить', en: 'Delete' },
  'edit': { uz: 'Tahrirlash', ru: 'Редактировать', en: 'Edit' },
  'add': { uz: 'Qo‘shish', ru: 'Добавить', en: 'Add' },
  'confirm': { uz: 'Tasdiqlash', ru: 'Подтвердить', en: 'Confirm' },
  'reject': { uz: 'Rad etish', ru: 'Отклонить', en: 'Reject' },
  'approved': { uz: 'Tasdiqlangan', ru: 'Одобрено', en: 'Approved' },
  'rejected': { uz: 'Rad etilgan', ru: 'Отклонено', en: 'Rejected' },
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
  'so‘m': { uz: 'so‘m', ru: 'сум', en: 'UZS' },
  'currency': { uz: 'so‘m', ru: 'сум', en: 'UZS' },
  'price': { uz: 'Narx', ru: 'Цена', en: 'Price' },
  'quantity': { uz: 'Miqdor', ru: 'Количество', en: 'Quantity' },
  'category': { uz: 'Toifa', ru: 'Категория', en: 'Category' },
  'unit': { uz: 'Birlik', ru: 'Ед. изм.', en: 'Unit' },
  'piece': { uz: 'dona', ru: 'шт.', en: 'pcs' },
  'install': { uz: 'O‘rnatish', ru: 'Установить', en: 'Install' },
  'map': { uz: 'Xarita', ru: 'Карта', en: 'Map' },
  'list': { uz: 'Ro‘yxat', ru: 'Список', en: 'List' },
  'filters': { uz: 'Filtrlar', ru: 'Фильтры', en: 'Filters' },
  'radius': { uz: 'Qidiruv radiusi', ru: 'Радиус поиска', en: 'Search radius' },
  'sort_relevance': { uz: 'Eng mos', ru: 'По соответствию', en: 'Best match' },
  'sort_distance': { uz: 'Eng yaqin', ru: 'Ближайшие', en: 'Nearest' },
  'sort_price': { uz: 'Eng arzon', ru: 'Самые дешевые', en: 'Cheapest' },
  'wholesale': { uz: 'Ulgurji', ru: 'Оптовый', en: 'Wholesale' },
  'store': { uz: 'Do‘kon', ru: 'Магазин', en: 'Store' },
  'stores': { uz: 'Do‘konlar', ru: 'Магазины', en: 'Stores' },
  'complaints': { uz: 'Shikoyatlar', ru: 'Жалобы', en: 'Complaints' },
  'users': { uz: 'Foydalanuvchilar', ru: 'Пользователи', en: 'Users' },
  'favorites': { uz: 'Sevimlilar', ru: 'Избранное', en: 'Favorites' },
  'reviews': { uz: 'Sharhlarim', ru: 'Мои отзывы', en: 'My reviews' },
  'proposals': { uz: 'Takliflarim', ru: 'Мои предложения', en: 'My proposals' },
  'inquiries_nav': { uz: 'Arizalar & Murojaatlar', ru: 'Заявки и обращения', en: 'Applications & Inquiries' },
  'history': { uz: 'Tarix', ru: 'История', en: 'History' },
  'open_map': { uz: 'Xaritani ochish', ru: 'Открыть карту', en: 'Open map' },
  'light_theme': { uz: 'Yorug‘ tema', ru: 'Светлая тема', en: 'Light theme' },
  'dark_theme': { uz: 'Qorong‘i tema', ru: 'Тёмная тема', en: 'Dark theme' },
  'results_count': { uz: 'ta natija', ru: 'результатов', en: 'results' },
  'nearby_count': { uz: 'ta yaqin do‘kon', ru: 'магазинов рядом', en: 'nearby stores' },
  'ta': { uz: 'ta', ru: 'шт.', en: 'items' },
  'nafar': { uz: 'nafar', ru: 'чел.', en: 'people' },

  // Landing Categories & Nav Links
  'Portallar': { uz: 'Portallar', ru: 'Порталы', en: 'Portals' },
  'Platforma': { uz: 'Platforma', ru: 'Платформа', en: 'Platform' },
  'Bizneslar uchun': { uz: 'Bizneslar uchun', ru: 'Для бизнеса', en: 'For Business' },
  'Foydali': { uz: 'Foydali', ru: 'Как это работает', en: 'How it works' },
  'Biz haqimizda': { uz: 'Biz haqimizda', ru: 'О нас', en: 'About us' },
  'Mahalliy tovar va xizmatlar ekotizimi': {
    uz: 'Mahalliy tovar va xizmatlar ekotizimi',
    ru: 'Экосистема локальных товаров и услуг',
    en: 'Local goods and services ecosystem'
  },
  'Tizim Portallari (Kirish)': {
    uz: 'Tizim Portallari (Kirish)',
    ru: 'Порталы системы (Вход)',
    en: 'System Portals (Login)'
  },
  'Platforma haqida': {
    uz: 'Platforma haqida',
    ru: 'О платформе',
    en: 'About platform'
  },
  'Oziq-ovqat': { uz: 'Oziq-ovqat', ru: 'Продукты питания', en: 'Food & Groceries' },
  'Dorixonalar': { uz: 'Dorixonalar', ru: 'Аптеки', en: 'Pharmacies' },
  'Kafe va restoran': { uz: 'Kafe va restoran', ru: 'Кафе и рестораны', en: 'Cafes & Restaurants' },
  'Kiyim-kechak': { uz: 'Kiyim-kechak', ru: 'Одежда и обувь', en: 'Clothing & Apparel' },
  'Maishiy texnika': { uz: 'Maishiy texnika', ru: 'Бытовая техника', en: 'Electronics & Appliances' },
  'Avto va ehtiyot qismlar': { uz: 'Avto va ehtiyot qismlar', ru: 'Автозапчасти', en: 'Auto & Spare Parts' },
  'Qurilish va ta’mirlash': { uz: 'Qurilish va ta’mirlash', ru: 'Стройматериалы и ремонт', en: 'Construction & Repair' },
  'Boshqa xizmatlar': { uz: 'Boshqa xizmatlar', ru: 'Другие услуги', en: 'Other Services' },

  // User Hub & Store View
  'Xaritaga qaytish': { uz: 'Xaritaga qaytish', ru: 'Вернуться к карте', en: 'Back to map' },
  'Foydalanuvchi': { uz: 'Foydalanuvchi', ru: 'Пользователь', en: 'User' },
  'Sevimlilar & Saqlangan do‘konlar': {
    uz: 'Sevimlilar & Saqlangan do‘konlar',
    ru: 'Избранное и сохраненные магазины',
    en: 'Favorites & Saved Stores'
  },
  'Tovar va Xizmat Takliflarim': {
    uz: 'Tovar va Xizmat Takliflarim',
    ru: 'Мои предложения товаров и услуг',
    en: 'My Product & Service Proposals'
  },
  'Marshrut olish': { uz: 'Marshrut olish', ru: 'Построить маршрут', en: 'Get directions' },
  'Do‘konga o‘tish': { uz: 'Do‘konga o‘tish', ru: 'Перейти в магазин', en: 'View Store' },
  'Xatolik haqida xabar': { uz: 'Xatolik haqida xabar', ru: 'Сообщить об ошибке', en: 'Report Error' },
  'Yo‘nalish': { uz: 'Yo‘nalish', ru: 'Маршрут', en: 'Directions' },

  // Store Page Details
  '📦 Tovar va xizmatlar': { uz: '📦 Tovar va xizmatlar', ru: '📦 Товары и услуги', en: '📦 Products & Services' },
  '⭐ Izohlar & Baholar': { uz: '⭐ Izohlar & Baholar', ru: '⭐ Отзывы и оценки', en: '⭐ Reviews & Ratings' },
  'ℹ️ Do‘kon & Ish vaqti': { uz: 'ℹ️ Do‘kon & Ish vaqti', ru: 'ℹ️ О магазине и график', en: 'ℹ️ Store & Hours' },
  '📍 Xaritadagi o‘rni': { uz: '📍 Xaritadagi o‘rni', ru: '📍 На карте', en: '📍 Map Location' },
  'Tovar va xizmatlar assortimenti': {
    uz: 'Tovar va xizmatlar assortimenti',
    ru: 'Ассортимент товаров и услуг',
    en: 'Products & Services Catalog'
  },
  'Do‘konda mavjud barcha mahsulotlar, joriy narxlar va qoldiqlar': {
    uz: 'Do‘konda mavjud barcha mahsulotlar, joriy narxlar va qoldiqlar',
    ru: 'Все доступные товары, актуальные цены и остатки',
    en: 'All available products in store, live prices and stock'
  },

  // Admin Inquiries & Proposals
  'Login & Parol O‘zgartirish So‘rovlari': {
    uz: 'Login & Parol O‘zgartirish So‘rovlari',
    ru: 'Запросы на смену логина и пароля',
    en: 'Login & Password Change Requests'
  },
  'Do‘konlar bilan Rasmiy Murojaatlar': {
    uz: 'Do‘konlar bilan Rasmiy Murojaatlar',
    ru: 'Официальные обращения к магазинам',
    en: 'Official Store Inquiries'
  },
  'Tovar, Xizmat & Rasm Takliflari': {
    uz: 'Tovar, Xizmat & Rasm Takliflari',
    ru: 'Предложения товаров, услуг и фото',
    en: 'Product, Service & Photo Proposals'
  },
  'Tovar & Xizmat Takliflari': {
    uz: 'Tovar & Xizmat Takliflari',
    ru: 'Предложения товаров и услуг',
    en: 'Product & Service Proposals'
  },
  'Rasm O‘zgartirish So‘rovlari': {
    uz: 'Rasm O‘zgartirish So‘rovlari',
    ru: 'Запросы на смену фото',
    en: 'Photo Change Requests'
  },
  'Kutilayotgan': { uz: 'Kutilayotgan', ru: 'Ожидают', en: 'Pending' },
  'Tasdiqlangan': { uz: 'Tasdiqlangan', ru: 'Одобрено', en: 'Approved' },
  'Rad etilgan': { uz: 'Rad etilgan', ru: 'Отклонено', en: 'Rejected' },
  'Tasdiqlash': { uz: 'Tasdiqlash', ru: 'Подтвердить', en: 'Approve' },
  'Rad etish': { uz: 'Rad etish', ru: 'Отклонить', en: 'Reject' },

  // Admin Map Hub
  'Tashkilotlar va Do‘konlar Geo-Moderatsiya Haritasi': {
    uz: 'Tashkilotlar va Do‘konlar Geo-Moderatsiya Haritasi',
    ru: 'Гео-модерационная карта организаций и магазинов',
    en: 'Organizations & Stores Geo-Moderation Map'
  },
  '🔴 Muammoli': { uz: '🔴 Muammoli', ru: '🔴 С проблемами', en: '🔴 Issues' },
  'Muammoni o‘chirish (Bartaraf etish)': {
    uz: 'Muammoni o‘chirish (Bartaraf etish)',
    ru: 'Снять проблему (Устранить)',
    en: 'Resolve Issue (Dismiss)'
  },
  'Xodimlar': { uz: 'Xodimlar', ru: 'Сотрудники', en: 'Staff' },
  'Xaridor ilovasida ko‘rish': {
    uz: 'Xaridor ilovasida ko‘rish',
    ru: 'Посмотреть в приложении покупателя',
    en: 'View in Customer App'
  },
  'Do‘konlar ro‘yxati': { uz: 'Do‘konlar ro‘yxati', ru: 'Список магазинов', en: 'Stores List' },
  'Shikoyatni ko‘rish va tuzatish': {
    uz: 'Shikoyatni ko‘rish va tuzatish',
    ru: 'Просмотреть и исправить жалобу',
    en: 'View & Resolve Complaint'
  },

  // Reviews Moderation Hub
  'Sharhlar va Baholar Moderatsiyasi': {
    uz: 'Sharhlar va Baholar Moderatsiyasi',
    ru: 'Модерация отзывов и оценок',
    en: 'Reviews & Ratings Moderation'
  },
  'Jami sharhlar': { uz: 'Jami sharhlar', ru: 'Всего отзывов', en: 'Total reviews' },
  'Sharhlar yuklanmoqda...': { uz: 'Sharhlar yuklanmoqda...', ru: 'Загрузка отзывов...', en: 'Loading reviews...' },

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

  // Customer App & Search
  'cust_search_products': { uz: 'Mahsulot izlash', ru: 'Поиск товаров', en: 'Search products' },
  'cust_search_organizations': { uz: 'Tashkilot izlash', ru: 'Поиск организаций', en: 'Search organizations' },
  'cust_find_near': { uz: 'Yaqiningizdan toping', ru: 'Найдите рядом с вами', en: 'Find near you' },
  'cust_hero_prod': { uz: 'Kerakli tovar. Yaqin do‘kon.', ru: 'Нужный товар. Ближайший магазин.', en: 'Wanted item. Nearest store.' },
  'cust_hero_org': { uz: 'Tashkilot va xizmatlar qidiruvi.', ru: 'Поиск организаций и услуг.', en: 'Organizations & services search.' },
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
  'cust_send_report': { uz: 'Xabar yuborish', ru: 'Отправить сообщение', en: 'Send message' },
  'cust_error_report_title': { uz: 'Xato haqida xabar', ru: 'Сообщить об ошибке', en: 'Report Error' },

  // Admin Dashboard & Overview
  'admin_platform_status': { uz: 'Platforma Holati & Monitoring', ru: 'Статус платформы и мониторинг', en: 'Platform Status & Monitoring' },
  'admin_platform_subtitle': {
    uz: 'Barcha xizmatlar, do‘kon arizalari, xaridor fikrlari va mahsulot takliflarining real-vaqtdagi tahlili.',
    ru: 'Анализ всех сервисов, заявок магазинов, отзывов покупателей и предложений товаров в реальном времени.',
    en: 'Real-time analysis of all services, store applications, customer reviews, and product proposals.'
  },
  'admin_active_branches': { uz: 'faol filial', ru: 'активных филиалов', en: 'active branches' },
  'admin_pending_check': { uz: 'Tekshirish kutilmoqda', ru: 'Ожидает проверки', en: 'Pending review' },
  'admin_all_reviewed': { uz: 'Hammasi ko‘rilgan', ru: 'Все просмотрено', en: 'All reviewed' },
  'admin_total_complaints': { uz: 'jami shikoyat', ru: 'всего жалоб', en: 'total complaints' },
  'admin_items_photos': { uz: 'Tovar, rasm & login', ru: 'Товары, фото и логины', en: 'Items, photos & logins' },
  'admin_store_owners': { uz: 'do‘kon egasi', ru: 'владельцев магазинов', en: 'store owners' },
  'admin_resolve_issue': { uz: 'Muammoni o‘chirish', ru: 'Снять проблему', en: 'Resolve Issue' },
  'admin_approve': { uz: 'Tasdiqlash', ru: 'Одобрить', en: 'Approve' },
  'admin_reject': { uz: 'Rad etish', ru: 'Отклонить', en: 'Reject' },
  'admin_system_online': { uz: 'Tizim onlayn', ru: 'Система онлайн', en: 'System Online' },
  'admin_requests_proposals': { uz: 'So‘rov & Takliflar', ru: 'Запросы и предложения', en: 'Requests & Proposals' },

  // Merchant Dashboard
  'merch_add_product': { uz: '+ Yangi tovar', ru: '+ Новый товар', en: '+ Add Product' },
  'merch_import_excel': { uz: 'Excel orqali yuklash', ru: 'Импорт из Excel', en: 'Import from Excel' },
  'merch_total_sales': { uz: 'Jami sotuvlar', ru: 'Общие продажи', en: 'Total Sales' },
  'merch_stock_value': { uz: 'Ombor qiymati', ru: 'Стоимость склада', en: 'Stock Value' },
  'merch_quick_sale': { uz: '+ Sotuv', ru: '+ Продажа', en: '+ Sale' },
  'merch_quick_income': { uz: '+ Kirim', ru: '+ Приход', en: '+ Stock In' },

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

  // Owner Onboarding & Business Registration
  'Yangi tashkilotingizni qo‘shing': {
    uz: 'Yangi tashkilotingizni qo‘shing',
    ru: 'Добавьте вашу организацию',
    en: 'Add your organization'
  },
  'Tashkilot faoliyati turi va ma’lumotlarini kiriting hamda boshqaruv hisobini oching.': {
    uz: 'Tashkilot faoliyati turi va ma’lumotlarini kiriting hamda boshqaruv hisobini oching.',
    ru: 'Укажите направление деятельности, данные организации и откройте аккаунт управления.',
    en: 'Enter your business category, organization details and open your management account.'
  },
  'Tashkilot nomi': { uz: 'Tashkilot nomi', ru: 'Название организации', en: 'Organization name' },
  'STIR (INN) — 9 ta raqam (ixtiyoriy)': {
    uz: 'STIR (INN) — 9 ta raqam (ixtiyoriy)',
    ru: 'ИНН — 9 цифр (необязательно)',
    en: 'TIN (INN) — 9 digits (optional)'
  },
  'Viloyat / Hudud': { uz: 'Viloyat / Hudud', ru: 'Область / Регион', en: 'Region / Province' },
  'Tuman / shahar': { uz: 'Tuman / shahar', ru: 'Район / город', en: 'District / City' },
  'Mahalla (ixtiyoriy)': { uz: 'Mahalla (ixtiyoriy)', ru: 'Махалля (необязательно)', en: 'Neighborhood (optional)' },
  'To‘liq manzil (ko‘cha, uy raqami)': {
    uz: 'To‘liq manzil (ko‘cha, uy raqami)',
    ru: 'Полный адрес (улица, номер дома)',
    en: 'Full address (street, building)'
  },
  'Tashkilot faoliyati yo‘nalishi (Turi)': {
    uz: 'Tashkilot faoliyati yo‘nalishi (Turi)',
    ru: 'Направление деятельности (Тип)',
    en: 'Business activity direction (Type)'
  },
  'Yangi yo‘nalish qo‘shish': {
    uz: 'Yangi yo‘nalish qo‘shish',
    ru: 'Добавить направление',
    en: 'Add new category'
  },
  'Savdo kabineti: tovarlar, ombor va sotuvlar': {
    uz: 'Savdo kabineti: tovarlar, ombor va sotuvlar',
    ru: 'Кабинет торговли: товары, склад и продажи',
    en: 'Retail cabinet: products, inventory and sales'
  },
  'Xizmat kabineti: xizmatlar, tariflar va buyurtmalar': {
    uz: 'Xizmat kabineti: xizmatlar, tariflar va buyurtmalar',
    ru: 'Кабинет услуг: услуги, тарифы и заказы',
    en: 'Service cabinet: services, rates and orders'
  },
  'Filial nomini alohida belgilash (ixtiyoriy)': {
    uz: 'Filial nomini alohida belgilash (ixtiyoriy)',
    ru: 'Указать отдельное название филиала (необязательно)',
    en: 'Specify custom branch name (optional)'
  },
  'Filial nomi': { uz: 'Filial nomi', ru: 'Название филиала', en: 'Branch name' },
  'Agar bo‘sh qoldirilsa, tashkilot nomi bosh filial sifatida ishlatiladi.': {
    uz: 'Agar bo‘sh qoldirilsa, tashkilot nomi bosh filial sifatida ishlatiladi.',
    ru: 'Если оставить пустым, название организации будет использовано как главный филиал.',
    en: 'If left blank, the organization name will be used as the main branch.'
  },
  'Tashkilotning xaritadagi aniq joylashuvi': {
    uz: 'Tashkilotning xaritadagi aniq joylashuvi',
    ru: 'Точное расположение на карте',
    en: 'Exact location on the map'
  },
  'Majburiy': { uz: 'Majburiy', ru: 'Обязательно', en: 'Required' },
  'GPS lokatsiyam': { uz: 'GPS lokatsiyam', ru: 'Моя GPS-локация', en: 'My GPS location' },
  'Aniqlanmoqda…': { uz: 'Aniqlanmoqda…', ru: 'Определение…', en: 'Detecting…' },
  'Xaridorlar ilovasida tashkilotingiz ko‘rinishi uchun kartadan obyektingiz ustiga bosing yoki belgini kerakli joyga suring.': {
    uz: 'Xaridorlar ilovasida tashkilotingiz ko‘rinishi uchun kartadan obyektingiz ustiga bosing yoki belgini kerakli joyga suring.',
    ru: 'Чтобы ваша точка отображалась покупателям, нажмите на карте на ваш объект или перетащите маркер.',
    en: 'To make your store visible to customers, tap your location on the map or drag the marker.'
  },
  'Tanlangan koordinatalar:': {
    uz: 'Tanlangan koordinatalar:',
    ru: 'Выбранные координаты:',
    en: 'Selected coordinates:'
  },
  'Aloqa telefoni (+998...)': {
    uz: 'Aloqa telefoni (+998...)',
    ru: 'Контактный телефон (+998...)',
    en: 'Contact phone (+998...)'
  },
  'Obyekt fotosurati (URL havola)': {
    uz: 'Obyekt fotosurati (URL havola)',
    ru: 'Фотография объекта (URL ссылка)',
    en: 'Object photo (URL link)'
  },
  'Ish boshlanish vaqti': { uz: 'Ish boshlanish vaqti', ru: 'Время открытия', en: 'Opening time' },
  'Ish tugash vaqti': { uz: 'Ish tugash vaqti', ru: 'Время закрытия', en: 'Closing time' },
  'Tashkilot egasi uchun login va parol yarating': {
    uz: 'Tashkilot egasi uchun login va parol yarating',
    ru: 'Создайте логин и пароль для владельца',
    en: 'Create login and password for store owner'
  },
  'Ushbu login va parol orqali egasi kabinetiga kirib tizimni boshqarasiz.': {
    uz: 'Ushbu login va parol orqali egasi kabinetiga kirib tizimni boshqarasiz.',
    ru: 'С этим логином и паролем вы сможете входить в кабинет владельца и управлять бизнесом.',
    en: 'Use this login and password to access the merchant portal and manage your business.'
  },
  'Ism va familiyangiz': { uz: 'Ism va familiyangiz', ru: 'Имя и фамилия', en: 'Full name' },
  'Login': { uz: 'Login', ru: 'Логин', en: 'Login' },
  'Parol — kamida 8 ta belgi': {
    uz: 'Parol — kamida 8 ta belgi',
    ru: 'Пароль — минимум 8 символов',
    en: 'Password — at least 8 characters'
  },
  'Tashkilot va hisobimni yaratish': {
    uz: 'Tashkilot va hisobimni yaratish',
    ru: 'Создать организацию и аккаунт',
    en: 'Create organization and account'
  },
  'Yaratilmoqda…': { uz: 'Yaratilmoqda…', ru: 'Создание…', en: 'Creating…' },
  'Hisobingiz bormi? Tizimga kirish': {
    uz: 'Hisobingiz bormi? Tizimga kirish',
    ru: 'Уже есть аккаунт? Войти',
    en: 'Already have an account? Sign in'
  },
  'Yangi tashkilotingizni yarating yoki mavjud owner hisobingiz bilan tizimga kiring.': {
    uz: 'Yangi tashkilotingizni yarating yoki mavjud owner hisobingiz bilan tizimga kiring.',
    ru: 'Создайте новую организацию или войдите с существующим аккаунтом владельца.',
    en: 'Create a new organization or log in with your existing owner account.'
  },
  'Do‘kon kabinetiga kirish': {
    uz: 'Do‘kon kabinetiga kirish',
    ru: 'Войти в кабинет магазина',
    en: 'Log in to Merchant Hub'
  },
  'Xaridor tizimiga o‘tish →': {
    uz: 'Xaridor tizimiga o‘tish →',
    ru: 'Перейти в приложение покупателя →',
    en: 'Go to Customer App →'
  },
  'Xizmatlar boshqaruvi': {
    uz: 'Xizmatlar boshqaruvi',
    ru: 'Управление услугами',
    en: 'Service Management'
  },
  'Do‘kon boshqaruvi': {
    uz: 'Do‘kon boshqaruvi',
    ru: 'Кабинет продавца',
    en: 'Merchant Hub'
  },
  'Shaxsiy profilni ochish': {
    uz: 'Shaxsiy profilni ochish',
    ru: 'Открыть личный профиль',
    en: 'Open user profile'
  },
  'Do‘kon egasi': { uz: 'Do‘kon egasi', ru: 'Владелец магазина', en: 'Store Owner' },
  'Tashkilotingiz kabineti yuklanmoqda…': {
    uz: 'Tashkilotingiz kabineti yuklanmoqda…',
    ru: 'Загрузка кабинета организации…',
    en: 'Loading your business hub…'
  },

  // Organization Types
  'Chakana savdo (Do‘kon / Supermarket / Minimarket)': {
    uz: 'Chakana savdo (Do‘kon / Supermarket / Minimarket)',
    ru: 'Розничная торговля (Магазин / Супермаркет / Минимаркет)',
    en: 'Retail trade (Shop / Supermarket / Minimarket)'
  },
  'Apteka (Dorixona)': {
    uz: 'Apteka (Dorixona)',
    ru: 'Аптека',
    en: 'Pharmacy'
  },
  'Game Club (Kompyuter klubi / PlayStation)': {
    uz: 'Game Club (Kompyuter klubi / PlayStation)',
    ru: 'Компьютерный клуб / PlayStation',
    en: 'Game Club (PC / PlayStation)'
  },
  'Zapravka (Yoqilg‘i quyish / Zaryadlash stansiyasi)': {
    uz: 'Zapravka (Yoqilg‘i quyish / Zaryadlash stansiyasi)',
    ru: 'Заправка (АЗС / Электрозарядная станция)',
    en: 'Gas Station / EV Charging'
  },
  'Sartaroshxona / Go‘zallik saloni / Barbershop': {
    uz: 'Sartaroshxona / Go‘zallik saloni / Barbershop',
    ru: 'Парикмахерская / Салон красоты / Барбершоп',
    en: 'Barbershop / Beauty salon'
  },
  'O‘quv markaz / Kurslar / Maktab': {
    uz: 'O‘quv markaz / Kurslar / Maktab',
    ru: 'Учебный центр / Курсы / Школа',
    en: 'Education Center / Courses / School'
  },
  'Kafe / Restoran / Fast food / Oshxona': {
    uz: 'Kafe / Restoran / Fast food / Oshxona',
    ru: 'Кафе / Ресторан / Фастфуд / Столовая',
    en: 'Cafe / Restaurant / Fast food'
  },
  'Avtoservis / Ustaxona / Avtoyuvish': {
    uz: 'Avtoservis / Ustaxona / Avtoyuvish',
    ru: 'Автосервис / Мастерская / Автомойка',
    en: 'Auto service / Workshop / Car wash'
  },
  'Ulgurji savdo (Baza / Optom)': {
    uz: 'Ulgurji savdo (Baza / Optom)',
    ru: 'Оптовая торговля (База / Оптом)',
    en: 'Wholesale (Depot / Bulk)'
  },
  'Boshqa xizmat ko‘rsatish sohasi': {
    uz: 'Boshqa xizmat ko‘rsatish sohasi',
    ru: 'Другие услуги',
    en: 'Other services'
  },
  'Aralash faoliyat (Savdo va xizmatlar)': {
    uz: 'Aralash faoliyat (Savdo va xizmatlar)',
    ru: 'Смешанная деятельность (Торговля и услуги)',
    en: 'Mixed activity (Trade & services)'
  },

  // Regions
  'Toshkent shahri': { uz: 'Toshkent shahri', ru: 'г. Ташкент', en: 'Tashkent city' },
  'Toshkent viloyati': { uz: 'Toshkent viloyati', ru: 'Ташкентская область', en: 'Tashkent region' },
  'Samarqand viloyati': { uz: 'Samarqand viloyati', ru: 'Самаркандская область', en: 'Samarkand region' },
  'Farg‘ona viloyati': { uz: 'Farg‘ona viloyati', ru: 'Ферганская область', en: 'Fergana region' },
  'Andijon viloyati': { uz: 'Andijon viloyati', ru: 'Андижанская область', en: 'Andijan region' },
  'Namangan viloyati': { uz: 'Namangan viloyati', ru: 'Наманганская область', en: 'Namangan region' },
  'Buxoro viloyati': { uz: 'Buxoro viloyati', ru: 'Бухарская область', en: 'Bukhara region' },
  'Xorazm viloyati': { uz: 'Xorazm viloyati', ru: 'Хорезмская область', en: 'Khorezm region' },
  'Qashqadaryo viloyati': { uz: 'Qashqadaryo viloyati', ru: 'Кашкадарьинская область', en: 'Kashkadarya region' },
  'Surxondaryo viloyati': { uz: 'Surxondaryo viloyati', ru: 'Сурхандарьинская область', en: 'Surkhandarya region' },
  'Navoiy viloyati': { uz: 'Navoiy viloyati', ru: 'Навоийская область', en: 'Navoi region' },
  'Jizzax viloyati': { uz: 'Jizzax viloyati', ru: 'Джизакская область', en: 'Jizzakh region' },
  'Sirdaryo viloyati': { uz: 'Sirdaryo viloyati', ru: 'Сырдарьинская область', en: 'Syrdarya region' },
  'Qoraqalpog‘iston Respublikasi': { uz: 'Qoraqalpog‘iston Respublikasi', ru: 'Республика Каракалпакстан', en: 'Republic of Karakalpakstan' },

  // Merchant Sidebar Nav
  'Umumiy ko‘rsatkichlar': { uz: 'Umumiy ko‘rsatkichlar', ru: 'Общие показатели', en: 'Overview Dashboard' },
  'Tashkilot va Filiallar': { uz: 'Tashkilot va Filiallar', ru: 'Организация и филиалы', en: 'Organization & Branches' },
  'Qoldiq nazorati & Zaxira': { uz: 'Qoldiq nazorati & Zaxira', ru: 'Контроль остатков и склад', en: 'Stock Control & Storage' },
  'Kirim qilish': { uz: 'Kirim qilish', ru: 'Приход товаров', en: 'Stock In' },
  'Qaytarishlar (Vozvrat)': { uz: 'Qaytarishlar (Vozvrat)', ru: 'Возвраты', en: 'Returns' },
  'Xarajatlar': { uz: 'Xarajatlar', ru: 'Расходы', en: 'Expenses' },
  'Moliyaviy hisobotlar': { uz: 'Moliyaviy hisobotlar', ru: 'Финансовые отчеты', en: 'Financial Reports' },
  'Xizmatlar katalogi': { uz: 'Xizmatlar katalogi', ru: 'Каталог услуг', en: 'Services Catalog' },
  'Ko‘rsatilgan xizmatlar': { uz: 'Ko‘rsatilgan xizmatlar', ru: 'Оказанные услуги', en: 'Rendered Services' },
  'Ombor holati:': { uz: 'Ombor holati:', ru: 'Состояние склада:', en: 'Warehouse status:' },
  'Kam qolgan:': { uz: 'Kam qolgan:', ru: 'Заканчивается:', en: 'Low stock:' },
  'Tugagan:': { uz: 'Tugagan:', ru: 'Закончилось:', en: 'Out of stock:' },
  'Asosiy filial': { uz: 'Asosiy filial', ru: 'Главный филиал', en: 'Main branch' },

  // Additional Owner Onboarding & Merchant Controls
  'Kenglik:': { uz: 'Kenglik:', ru: 'Широта:', en: 'Latitude:' },
  'Uzunlik:': { uz: 'Uzunlik:', ru: 'Долгота:', en: 'Longitude:' },
  'Masalan: Sport zal, Avtomoyka, Qandolatchilik...': {
    uz: 'Masalan: Sport zal, Avtomoyka, Qandolatchilik...',
    ru: 'Например: Спортзал, Автомойка, Кондитерская...',
    en: 'E.g.: Gym, Car wash, Confectionery...'
  },
  'Masalan: Bosh filial, Chilonzor filiali...': {
    uz: 'Masalan: Bosh filial, Chilonzor filiali...',
    ru: 'Например: Главный филиал, Чиланзарский филиал...',
    en: 'E.g.: Main branch, Chilanzar branch...'
  },
  'Masalan: login123 yoki admin_user': {
    uz: 'Masalan: login123 yoki admin_user',
    ru: 'Например: login123 или admin_user',
    en: 'E.g.: login123 or admin_user'
  },
  'Qo‘shish': { uz: 'Qo‘shish', ru: 'Добавить', en: 'Add' },
  'Qurilma geolokatsiyani qo‘llab-quvvatlamaydi.': {
    uz: 'Qurilma geolokatsiyani qo‘llab-quvvatlamaydi.',
    ru: 'Устройство не поддерживает геолокацию.',
    en: 'Device does not support geolocation.'
  },
  'Geolokatsiyani aniqlab bo‘lmadi. Kartadan kerakli nuqtani bosing.': {
    uz: 'Geolokatsiyani aniqlab bo‘lmadi. Kartadan kerakli nuqtani bosing.',
    ru: 'Не удалось определить геолокацию. Выберите точку на карте.',
    en: 'Could not detect geolocation. Please select a point on the map.'
  },
  'Yangi tur nomini kiriting.': {
    uz: 'Yangi tur nomini kiriting.',
    ru: 'Введите название нового направления.',
    en: 'Enter new category name.'
  },
  'Yangi turni avval qo‘shing yoki bekor qiling.': {
    uz: 'Yangi turni avval qo‘shing yoki bekor qiling.',
    ru: 'Сначала добавьте новое направление или отмените.',
    en: 'Please add the new category or cancel first.'
  },
  'Iltimos, tashkilot lokatsiyasini kartadan to‘g‘ri belgilang.': {
    uz: 'Iltimos, tashkilot lokatsiyasini kartadan to‘g‘ri belgilang.',
    ru: 'Пожалуйста, точно укажите локацию организации на карте.',
    en: 'Please specify the exact organization location on the map.'
  },
  'Aloqa telefon raqamini to‘liq kiriting (+998 9X XXX XX XX).': {
    uz: 'Aloqa telefon raqamini to‘liq kiriting (+998 9X XXX XX XX).',
    ru: 'Введите полный номер телефона (+998 9X XXX XX XX).',
    en: 'Enter full phone number (+998 9X XXX XX XX).'
  },
  'Login kamida 2 ta belgidan iborat bo‘lishi kerak.': {
    uz: 'Login kamida 2 ta belgidan iborat bo‘lishi kerak.',
    ru: 'Логин должен содержать не менее 2 символов.',
    en: 'Login must be at least 2 characters.'
  },
  'Tashkilotni yaratib bo‘lmadi.': {
    uz: 'Tashkilotni yaratib bo‘lmadi.',
    ru: 'Не удалось создать организацию.',
    en: 'Could not create organization.'
  },
  'Server bilan aloqa xatosi.': {
    uz: 'Server bilan aloqa xatosi.',
    ru: 'Ошибка связи с сервером.',
    en: 'Server connection error.'
  },
  'Yangi tashkilot turi': {
    uz: 'Yangi tashkilot turi',
    ru: 'Новый вид деятельности',
    en: 'New organization type'
  },
  'Qoldiq nazorati sahifasiga o‘tish': {
    uz: 'Qoldiq nazorati sahifasiga o‘tish',
    ru: 'Перейти к контролю остатков',
    en: 'Go to Stock Control'
  },

  // Admin Header & Navigation
  'Platforma administratsiyasi': {
    uz: 'Platforma administratsiyasi',
    ru: 'Администрация платформы',
    en: 'Platform Administration'
  },
  'Yorug\' tema': { uz: 'Yorug\' tema', ru: 'Светлая тема', en: 'Light theme' },
  'Qorong\'i tema': { uz: 'Qorong\'i tema', ru: 'Темная тема', en: 'Dark theme' },

  // Admin Store Applications
  'YANGI HAMKORLAR & DO‘KONLAR MODERATSIYASI': {
    uz: 'YANGI HAMKORLAR & DO‘KONLAR MODERATSIYASI',
    ru: 'МОДЕРАЦИЯ НОВЫХ ПАРТНЕРОВ И МАГАЗИНОВ',
    en: 'NEW PARTNERS & STORES MODERATION'
  },
  'Yangi Hamkorlar & Do‘konlar Moderatsiyasi': {
    uz: 'Yangi Hamkorlar & Do‘konlar Moderatsiyasi',
    ru: 'Модерация новых партнеров и магазинов',
    en: 'New Partners & Stores Moderation'
  },
  'Do‘kon Arizalari Navbati': {
    uz: 'Do‘kon Arizalari Navbati',
    ru: 'Очередь заявок магазинов',
    en: 'Store Applications Queue'
  },
  'Yangi ro‘yxatdan o‘tgan do‘konlarning STIR/INN, manzili, geolokatsiyasi va fotosuratlarini tekshirib faollashtiring.': {
    uz: 'Yangi ro‘yxatdan o‘tgan do‘konlarning STIR/INN, manzili, geolokatsiyasi va fotosuratlarini tekshirib faollashtiring.',
    ru: 'Проверяйте ИНН, адрес, геолокацию и фотографии новых зарегистрированных магазинов для активации.',
    en: 'Verify TIN, address, geolocation and photos of newly registered stores to activate them.'
  },
  'Do‘kon nomi, manzil, telefon yoki tashkilot...': {
    uz: 'Do‘kon nomi, manzil, telefon yoki tashkilot...',
    ru: 'Название магазина, адрес, телефон или организация...',
    en: 'Store name, address, phone or organization...'
  },
  'KUTILMOQDA': { uz: 'KUTILMOQDA', ru: 'ОЖИДАЕТ', en: 'PENDING' },
  'TUZATISHDA': { uz: 'TUZATISHDA', ru: 'НА ИСПРАВЛЕНИИ', en: 'NEEDS CHANGES' },
  'OCHIQ': { uz: 'OCHIQ', ru: 'ОТКРЫТО', en: 'OPEN' },
  'HAL QILINGAN': { uz: 'HAL QILINGAN', ru: 'РЕШЕНО', en: 'RESOLVED' },
  'Tashkilot:': { uz: 'Tashkilot:', ru: 'Организация:', en: 'Organization:' },
  'Mustaqil tashkilot': { uz: 'Mustaqil tashkilot', ru: 'Независимая организация', en: 'Independent organization' },
  'Kartada tekshirish': { uz: 'Kartada tekshirish', ru: 'Проверить на карте', en: 'Check on map' },
  'Tafsilot': { uz: 'Tafsilot', ru: 'Подробнее', en: 'Details' },
  'Hozirda kutilayotgan do‘kon arizalari mavjud emas': {
    uz: 'Hozirda kutilayotgan do‘kon arizalari mavjud emas',
    ru: 'В настоящее время нет ожидающих заявок магазинов',
    en: 'There are currently no pending store applications'
  },
  'Barcha yangi do‘konlar ko‘rib chiqilgan va platformada faollashtirilgan.': {
    uz: 'Barcha yangi do‘konlar ko‘rib chiqilgan va platformada faollashtirilgan.',
    ru: 'Все новые магазины проверены и активированы на платформе.',
    en: 'All new stores have been reviewed and activated on the platform.'
  },

  // Admin Reports & Complaints
  'Xaridor E’tirozlari & Sifat Nazorati': {
    uz: 'Xaridor E’tirozlari & Sifat Nazorati',
    ru: 'Претензии покупателей и контроль качества',
    en: 'Customer Complaints & Quality Control'
  },
  'Foydalanuvchilar Shikoyatlari': {
    uz: 'Foydalanuvchilar Shikoyatlari',
    ru: 'Жалобы пользователей',
    en: 'User Complaints'
  },
  'Noto‘g‘ri narx, rastada yo‘q mahsulot yoki yopiq do‘konlar bo‘yicha tushgan shikoyatlarni tekshiring va do‘kon egasiga talab yuboring.': {
    uz: 'Noto‘g‘ri narx, rastada yo‘q mahsulot yoki yopiq do‘konlar bo‘yicha tushgan shikoyatlarni tekshiring va do‘kon egasiga talab yuboring.',
    ru: 'Проверяйте жалобы на неверные цены, отсутствие товаров или закрытые магазины и направляйте требования владельцам.',
    en: 'Review complaints regarding wrong prices, missing stock or closed stores and send demands to owners.'
  },
  'Do‘kon nomi, shikoyat tafsiloti yoki sabab...': {
    uz: 'Do‘kon nomi, shikoyat tafsiloti yoki sabab...',
    ru: 'Название магазина, подробности жалобы или причина...',
    en: 'Store name, complaint details or reason...'
  },
  'Barcha sabablar': { uz: 'Barcha sabablar', ru: 'Все причины', en: 'All reasons' },
  'Noto‘g‘ri narx': { uz: 'Noto‘g‘ri narx', ru: 'Неверная цена', en: 'Wrong price' },
  'Yo‘q mahsulot': { uz: 'Yo‘q mahsulot', ru: 'Нет товара', en: 'Unavailable product' },
  'Yo‘q tovar': { uz: 'Yo‘q tovar', ru: 'Нет товара', en: 'Unavailable item' },
  'Noto‘g‘ri manzil': { uz: 'Noto‘g‘ri manzil', ru: 'Неверный адрес', en: 'Wrong location' },
  'Yopiq do‘kon': { uz: 'Yopiq do‘kon', ru: 'Магазин закрыт', en: 'Closed store' },
  'Boshqa': { uz: 'Boshqa', ru: 'Другое', en: 'Other' },
  'Do‘kon & Filial': { uz: 'Do‘kon & Filial', ru: 'Магазин и филиал', en: 'Store & Branch' },
  'Shikoyat turi': { uz: 'Shikoyat turi', ru: 'Тип жалобы', en: 'Complaint type' },
  'Holat': { uz: 'Holat', ru: 'Статус', en: 'Status' },
  'Sana': { uz: 'Sana', ru: 'Дата', en: 'Date' },
  'Amallar': { uz: 'Amallar', ru: 'Действия', en: 'Actions' },
  'Ochiq': { uz: 'Ochiq', ru: 'Открытые', en: 'Open' },
  'Hal qilingan': { uz: 'Hal qilingan', ru: 'Решенные', en: 'Resolved' },
  'Ko‘rib chiqish': { uz: 'Ko‘rib chiqish', ru: 'Рассмотреть', en: 'Review' },
  'Shikoyatni o‘chirish': { uz: 'Shikoyatni o‘chirish', ru: 'Удалить жалобу', en: 'Delete complaint' },
  'Mos keladigan shikoyatlar mavjud emas': {
    uz: 'Mos keladigan shikoyatlar mavjud emas',
    ru: 'Подходящих жалоб не найдено',
    en: 'No matching complaints found'
  },

  // Admin Users & Staff
  'Foydalanuvchilar va Xodimlar': {
    uz: 'Foydalanuvchilar va Xodimlar',
    ru: 'Пользователи и сотрудники',
    en: 'Users and Staff'
  },
  'Barcha tashkilot xodimlari, login/parollar va Telegram / SMS orqali tasdiqlash holati': {
    uz: 'Barcha tashkilot xodimlari, login/parollar va Telegram / SMS orqali tasdiqlash holati',
    ru: 'Все сотрудники организаций, логины/пароли и статус верификации через Telegram / SMS',
    en: 'All organization staff, logins/passwords and verification status via Telegram / SMS'
  },
  '+ Yangi foydalanuvchi qo‘shish': {
    uz: '+ Yangi foydalanuvchi qo‘shish',
    ru: '+ Добавить нового пользователя',
    en: '+ Add new user'
  },
  'Ism, login, telefon yoki tashkilot...': {
    uz: 'Ism, login, telefon yoki tashkilot...',
    ru: 'Имя, логин, телефон или организация...',
    en: 'Name, login, phone or organization...'
  },
  'Rol bo‘yicha:': { uz: 'Rol bo‘yicha:', ru: 'По роли:', en: 'By role:' },
  'Barcha rollar': { uz: 'Barcha rollar', ru: 'Все роли', en: 'All roles' },
  'Foydalanuvchi & Telefon': { uz: 'Foydalanuvchi & Telefon', ru: 'Пользователь и телефон', en: 'User & Phone' },
  'Tashkilot': { uz: 'Tashkilot', ru: 'Организация', en: 'Organization' },
  'Parol': { uz: 'Parol', ru: 'Пароль', en: 'Password' },
  'Roli': { uz: 'Roli', ru: 'Роль', en: 'Role' },
  'Tasdiqlash & Holat': { uz: 'Tasdiqlash & Holat', ru: 'Верификация и статус', en: 'Verification & Status' },
  'Faol & Tasdiqlangan': { uz: 'Faol & Tasdiqlangan', ru: 'Активен и подтвержден', en: 'Active & Verified' },
  'Telegram tasdiqlash': { uz: 'Telegram tasdiqlash', ru: 'Подтверждение Telegram', en: 'Telegram verification' },
  'SMS tasdiqlash': { uz: 'SMS tasdiqlash', ru: 'Подтверждение SMS', en: 'SMS verification' },
  'Bloklash': { uz: 'Bloklash', ru: 'Заблокировать', en: 'Block' },
  'Faol qilish': { uz: 'Faol qilish', ru: 'Активировать', en: 'Activate' },
  'O‘chirish': { uz: 'O‘chirish', ru: 'Удалить', en: 'Delete' },
  'Telefon yo‘q': { uz: 'Telefon yo‘q', ru: 'Нет телефона', en: 'No phone' },
  'Tizim foydalanuvchisi': { uz: 'Tizim foydalanuvchisi', ru: 'Пользователь системы', en: 'System user' },

  // Admin Audit
  'Xavfsizlik & Boshqaruv Jurnali': {
    uz: 'Xavfsizlik & Boshqaruv Jurnali',
    ru: 'Журнал безопасности и управления',
    en: 'Security & Management Log'
  },
  'Tizim Amallari Auditi': {
    uz: 'Tizim Amallari Auditi',
    ru: 'Аудит системных действий',
    en: 'System Actions Audit'
  },
  'Kim, qachon va qaysi operatsiyani bajargan: do‘konlar faollashuvi, login/parol o‘zgarishlari va narxlar tekshiruvi.': {
    uz: 'Kim, qachon va qaysi operatsiyani bajargan: do‘konlar faollashuvi, login/parol o‘zgarishlari va narxlar tekshiruvi.',
    ru: 'Кто, когда и какую операцию выполнил: активация магазинов, смена логинов/паролей и проверка цен.',
    en: 'Who, when, and what operation was performed: store activations, credential changes, and price checks.'
  },
  'Foydalanuvchi, amal yoki obyekt bo‘yicha izlash...': {
    uz: 'Foydalanuvchi, amal yoki obyekt bo‘yicha izlash...',
    ru: 'Поиск по пользователю, действию или объекту...',
    en: 'Search by user, action or object...'
  },
  'Do‘konlar': { uz: 'Do‘konlar', ru: 'Магазины', en: 'Stores' },
  'Foydalanuvchilar': { uz: 'Foydalanuvchilar', ru: 'Пользователи', en: 'Users' },
  'Tashkilotlar': { uz: 'Tashkilotlar', ru: 'Организации', en: 'Organizations' },
  'Takliflar': { uz: 'Takliflar', ru: 'Предложения', en: 'Proposals' },
  'Sana va vaqt': { uz: 'Sana va vaqt', ru: 'Дата и время', en: 'Date and time' },
  'Amal (Operatsiya)': { uz: 'Amal (Operatsiya)', ru: 'Действие (Операция)', en: 'Action (Operation)' },
  'Obyekt': { uz: 'Obyekt', ru: 'Объект', en: 'Object' },
  'O‘zgarish tafsiloti': { uz: 'O‘zgarish tafsiloti', ru: 'Детали изменения', en: 'Change details' },
  'Audit qaydnomalari topilmadi': { uz: 'Audit qaydnomalari topilmadi', ru: 'Записи аудита не найдены', en: 'No audit records found' },

  // Admin Modals
  'Do‘kon arizasini ko‘rib chiqish': {
    uz: 'Do‘kon arizasini ko‘rib chiqish',
    ru: 'Рассмотрение заявки магазина',
    en: 'Review Store Application'
  },
  'Tuzatish so‘rash': {
    uz: 'Tuzatish so‘rash',
    ru: 'Запросить исправления',
    en: 'Request Changes'
  },
  'Shikoyatni ko‘rib chiqish': {
    uz: 'Shikoyatni ko‘rib chiqish',
    ru: 'Рассмотрение жалобы',
    en: 'Review Complaint'
  },
  'Hal qilindi deb tasdiqlash': {
    uz: 'Hal qilindi deb tasdiqlash',
    ru: 'Подтвердить решение',
    en: 'Confirm Resolution'
  },
  'Xulosa / Tuzatish izohi': {
    uz: 'Xulosa / Tuzatish izohi',
    ru: 'Заключение / Примечание решения',
    en: 'Resolution / Notes'
  },
  'Nomi:': { uz: 'Nomi:', ru: 'Название:', en: 'Name:' },
  'Manzil:': { uz: 'Manzil:', ru: 'Адрес:', en: 'Address:' },
  'Telefon:': { uz: 'Telefon:', ru: 'Телефон:', en: 'Phone:' },
  'Lokatsiya:': { uz: 'Lokatsiya:', ru: 'Локация:', en: 'Location:' },

  // Overview Executive Hubs & Banners
  'YaqinTop Platforma Boshqaruv Markazi': {
    uz: 'YaqinTop Platforma Boshqaruv Markazi',
    ru: 'Центр управления платформой YaqinTop',
    en: 'YaqinTop Platform Control Center'
  },
  'Ulangan': { uz: 'Ulangan', ru: 'Подключено', en: 'Connected' },
  'Himoyalangan': { uz: 'Himoyalangan', ru: 'Защищено', en: 'Protected' },
  'Xavfsizlik & SSL': { uz: 'Xavfsizlik & SSL', ru: 'Безопасность и SSL', en: 'Security & SSL' },
  'Diqqat! Moderatsiya navbatida ko‘rib chiqilishi kerak bo‘lgan amallar mavjud:': {
    uz: 'Diqqat! Moderatsiya navbatida ko‘rib chiqilishi kerak bo‘lgan amallar mavjud:',
    ru: 'Внимание! В очереди модерации есть действия, требующие рассмотрения:',
    en: 'Attention! There are pending actions in the moderation queue:'
  },
  'do‘kon arizasi': { uz: 'do‘kon arizasi', ru: 'заявок магазинов', en: 'store applications' },
  'xaridor shikoyati': { uz: 'xaridor shikoyati', ru: 'жалоб покупателей', en: 'customer complaints' },
  'tovar/rasm taklifi': { uz: 'tovar/rasm taklifi', ru: 'предложений товаров/фото', en: 'item/photo proposals' },
  'Arizalarni ochish →': { uz: 'Arizalarni ochish →', ru: 'Открыть заявки →', en: 'Open applications →' },
  'Shikoyatlarni ko‘rish →': { uz: 'Shikoyatlarni ko‘rish →', ru: 'Смотреть жалобы →', en: 'View complaints →' },
  'Barcha navbatlar toza!': { uz: 'Barcha navbatlar toza!', ru: 'Все очереди чисты!', en: 'All queues clear!' },
  'Hozirda ko‘rib chiqilmagan arizalar yoki ochiq shikoyatlar mavjud emas.': {
    uz: 'Hozirda ko‘rib chiqilmagan arizalar yoki ochiq shikoyatlar mavjud emas.',
    ru: 'В настоящее время нет нерассмотренных заявок или открытых жалоб.',
    en: 'Currently there are no unreviewed applications or open complaints.'
  },
  'Tezkor Boshqaruv Markazlari': {
    uz: 'Tezkor Boshqaruv Markazlari',
    ru: 'Центры оперативного управления',
    en: 'Quick Management Hubs'
  },
  'Do‘konlarning xaritasini visual nazorat qilish, filiallar koordinatalari va shikoyat tushgan obyektlar monitoringi.': {
    uz: 'Do‘konlarning xaritasini visual nazorat qilish, filiallar koordinatalari va shikoyat tushgan obyektlar monitoringi.',
    ru: 'Визуальный контроль карты магазинов, координат филиалов и мониторинг проблемных объектов.',
    en: 'Visual map monitoring of stores, branch coordinates and reported locations.'
  },
  'Xaritaga o‘tish': { uz: 'Xaritaga o‘tish', ru: 'Перейти к карте', en: 'Go to map' },
  'Barcha korxonalar, savdo nuqtalari, yangi filial qo‘shish, login/parollarni boshqarish va tahrirlash.': {
    uz: 'Barcha korxonalar, savdo nuqtalari, yangi filial qo‘shish, login/parollarni boshqarish va tahrirlash.',
    ru: 'Все предприятия, торговые точки, добавление филиалов, управление учетными записями и редактирование.',
    en: 'All enterprises, retail outlets, branch creation, credentials management and editing.'
  },
  'Do‘konlarni boshqarish': { uz: 'Do‘konlarni boshqarish', ru: 'Управление магазинами', en: 'Manage stores' },
  'Xaridorlar kiritgan tovar va rasm takliflari, do‘konlar bilan rasmiy aloqalar hamda login almashtirish so‘rovlari.': {
    uz: 'Xaridorlar kiritgan tovar va rasm takliflari, do‘konlar bilan rasmiy aloqalar hamda login almashtirish so‘rovlari.',
    ru: 'Предложения товаров и фотографий от покупателей, официальные связи с магазинами и запросы на смену логинов.',
    en: 'Customer proposals for products and photos, official store communications and login change requests.'
  },
  'So‘rovlar markazi': { uz: 'So‘rovlar markazi', ru: 'Центр запросов', en: 'Inquiries hub' },
  'Mijozlarning do‘konlar va xizmatlar haqidagi baholari, nomaqbul izohlarni yashirish va tasdiqlash.': {
    uz: 'Mijozlarning do‘konlar va xizmatlar haqidagi baholari, nomaqbul izohlarni yashirish va tasdiqlash.',
    ru: 'Оценки покупателей о магазинах и сервисах, скрытие неприемлемых комментариев и одобрение.',
    en: 'Customer reviews on stores and services, moderating inappropriate comments and approving ratings.'
  },
  'Sharhlarni moderatsiya qilish': { uz: 'Sharhlarni moderatsiya qilish', ru: 'Модерировать отзывы', en: 'Moderate reviews' },
  'Kunlik, haftalik va oylik foydalanuvchilar o‘sishi, yangi do‘konlar kirib kelishi statistikasi.': {
    uz: 'Kunlik, haftalik va oylik foydalanuvchilar o‘sishi, yangi do‘konlar kirib kelishi statistikasi.',
    ru: 'Ежедневный, еженедельный и ежемесячный прирост пользователей и статистика подключения магазинов.',
    en: 'Daily, weekly and monthly user growth and incoming store registration dynamics.'
  },
  'Grafiklarni ko‘rish': { uz: 'Grafiklarni ko‘rish', ru: 'Посмотреть графики', en: 'View charts' },
  'Foydalanuvchilar & Xodimlar': { uz: 'Foydalanuvchilar & Xodimlar', ru: 'Пользователи и персонал', en: 'Users & Staff' },
  'Tizim xodimlari, do‘kon egalari, operatorlar va mijozlar rollari, seanslar va bloklash amallari.': {
    uz: 'Tizim xodimlari, do‘kon egalari, operatorlar va mijozlar rollari, seanslar va bloklash amallari.',
    ru: 'Сотрудники системы, владельцы магазинов, операторы и клиенты: роли, сессии и блокировка.',
    en: 'System staff, store owners, operators and customer roles, active sessions and blocking.'
  },
  'Foydalanuvchilarni ochish': { uz: 'Foydalanuvchilarni ochish', ru: 'Открыть пользователей', en: 'Open users' },

  // General Filter status
  'Barchasi': { uz: 'Barchasi', ru: 'Все', en: 'All' },
  'Faol': { uz: 'Faol', ru: 'Активные', en: 'Active' },
  'To‘xtatilgan': { uz: 'To‘xtatilgan', ru: 'Приостановленные', en: 'Suspended' },
  'O‘chirilgan': { uz: 'O‘chirilgan', ru: 'Удаленные', en: 'Deleted' },
  'Tuzatishda': { uz: 'Tuzatishda', ru: 'На исправлении', en: 'Needs changes' },

  // Landing Page Comprehensive Content
  'Qoraqalpog‘iston Resp.': { uz: 'Qoraqalpog‘iston Resp.', ru: 'Респ. Каракалпакстан', en: 'Rep. Karakalpakstan' },
  'Masalan: snikers, non, dorixona...': {
    uz: 'Masalan: snikers, non, dorixona...',
    ru: 'Например: сникерс, хлеб, аптека...',
    en: 'e.g. snickers, bread, pharmacy...'
  },
  'Do‘konlarni xaritada ko‘ring 📍': {
    uz: 'Do‘konlarni xaritada ko‘ring 📍',
    ru: 'Смотрите магазины на карте 📍',
    en: 'View stores on the map 📍'
  },
  'Narxlarni taqqoslang 🏷️': {
    uz: 'Narxlarni taqqoslang 🏷️',
    ru: 'Сравнивайте цены 🏷️',
    en: 'Compare shelf prices 🏷️'
  },
  'DO‘KON': { uz: 'DO‘KON', ru: 'МАГАЗИН', en: 'STORE' },
  '280 m yaqin': { uz: '280 m yaqin', ru: '280 м рядом', en: '280m nearby' },
  'dona': { uz: 'dona', ru: 'шт', en: 'pcs' },
  'Yo‘l-yo‘riq (Marshrut)': { uz: 'Yo‘l-yo‘riq (Marshrut)', ru: 'Построить маршрут', en: 'Get directions' },
  'Yaqin narxlar taqqosi:': { uz: 'Yaqin narxlar taqqosi:', ru: 'Сравнение цен рядом:', en: 'Nearby price comparison:' },
  '3 ta do‘kon': { uz: '3 ta do‘kon', ru: '3 магазина', en: '3 stores' },
  'Qidiruv radiusi': { uz: 'Qidiruv radiusi', ru: 'Радиус поиска', en: 'Search radius' },
  'Tezkor javob': { uz: 'Tezkor javob', ru: 'Быстрый ответ', en: 'Instant response' },
  'Kassa qoldiqlari': { uz: 'Kassa qoldiqlari', ru: 'Остатки на кассе', en: 'Shelf inventory' },
  '4 Portal': { uz: '4 Portal', ru: '4 Портала', en: '4 Portals' },

  // Portals
  'Tizim Portallari & Ilovalar': {
    uz: 'Tizim Portallari & Ilovalar',
    ru: 'Порталы и сервисы системы',
    en: 'System Portals & Apps'
  },
  'Qaysi rolda kirmoqchisiz?': {
    uz: 'Qaysi rolda kirmoqchisiz?',
    ru: 'В какой роли вы хотите войти?',
    en: 'Which role would you like to access?'
  },
  'Xaridorlar, do‘kon egalari, moderatorlar va tizim ma’murlari uchun 4 ta alohida moslashtirilgan portal:': {
    uz: 'Xaridorlar, do‘kon egalari, moderatorlar va tizim ma’murlari uchun 4 ta alohida moslashtirilgan portal:',
    ru: '4 адаптированных портала для покупателей, предпринимателей, модераторов и администраторов:',
    en: '4 dedicated portals tailored for customers, store owners, moderators, and system admins:'
  },
  'Xaridor Ilovasi': { uz: 'Xaridor Ilovasi', ru: 'Приложение для покупателей', en: 'Customer App' },
  'Tovar qidirish, xarita va marshrut': {
    uz: 'Tovar qidirish, xarita va marshrut',
    ru: 'Поиск товаров, карта и маршруты',
    en: 'Product search, map, and directions'
  },
  'Kerakli tovar va xizmatlarni 1 soniyada qidirish, yaqin do‘konlar, kassa narxlarini taqqoslash va xaritada marshrut olish.': {
    uz: 'Kerakli tovar va xizmatlarni 1 soniyada qidirish, yaqin do‘konlar, kassa narxlarini taqqoslash va xaritada marshrut olish.',
    ru: 'Поиск нужных товаров за 1 секунду, магазины рядом, сравнение кассовых цен и удобный маршрут.',
    en: 'Search needed goods in 1 second, locate nearby shops, compare store shelf prices, and get routes.'
  },
  'Xaridor sifatida kirish': { uz: 'Xaridor sifatida kirish', ru: 'Войти как покупатель', en: 'Enter as Customer' },
  'Do‘kon & Tadbirkor': { uz: 'Do‘kon & Tadbirkor', ru: 'Магазин и Предприниматель', en: 'Store & Business Owner' },
  'Tovarlar, kassa qoldiqlari, narxlar': {
    uz: 'Tovarlar, kassa qoldiqlari, narxlar',
    ru: 'Товары, остатки на кассе, цены',
    en: 'Goods, cash register stock, prices'
  },
  'Do‘kon va filiallar ma’lumotlari, tovar va xizmatlar narxi, kassa qoldiqlari, Excel import va yangi mijozlar oqimi.': {
    uz: 'Do‘kon va filiallar ma’lumotlari, tovar va xizmatlar narxi, kassa qoldiqlari, Excel import va yangi mijozlar oqimi.',
    ru: 'Управление точками и филиалами, ценами, остатками на складе, импорт Excel и поток покупателей.',
    en: 'Store & branch profiles, product pricing, stock availability, Excel bulk import, and new shoppers.'
  },
  'Do‘kon egasi sifatida kirish': { uz: 'Do‘kon egasi sifatida kirish', ru: 'Войти как владелец магазина', en: 'Enter as Store Owner' },
  'Moderator Portali': { uz: 'Moderator Portali', ru: 'Портал модератора', en: 'Moderator Portal' },
  'Do‘konlar arizasi, shikoyatlar, sharhlar': {
    uz: 'Do‘konlar arizasi, shikoyatlar, sharhlar',
    ru: 'Заявки магазинов, жалобы, отзывы',
    en: 'Store applications, complaints, reviews'
  },
  'Yangi ochilgan do‘konlar arizalarini tekshirish, xaridorlar e’tirozlari, sharhlar nazorati va ma’lumotlar to‘g‘riligi.': {
    uz: 'Yangi ochilgan do‘konlar arizalarini tekshirish, xaridorlar e’tirozlari, sharhlar nazorati va ma’lumotlar to‘g‘riligi.',
    ru: 'Проверка заявок новых магазинов, рассмотрение претензий покупателей, модерация отзывов.',
    en: 'Reviewing new store applications, customer complaint resolutions, review moderation, and verification.'
  },
  'Moderator sifatida kirish': { uz: 'Moderator sifatida kirish', ru: 'Войти как модератор', en: 'Enter as Moderator' },
  'Boshqaruv Admin': { uz: 'Boshqaruv Admin', ru: 'Панель Администратора', en: 'Executive Admin' },
  'Tizim nazorati, DB va qidiruv analitikasi': {
    uz: 'Tizim nazorati, DB va qidiruv analitikasi',
    ru: 'Контроль системы, БД и аналитика поиска',
    en: 'System control, DB, and search analytics'
  },
  'Tizim umumiy nazorati, butun shahar bo‘yicha qidiruv analitikasi, ma’lumotlar bazasi, rollar va xavfsizlik arxitekturasi.': {
    uz: 'Tizim umumiy nazorati, butun shahar bo‘yicha qidiruv analitikasi, ma’lumotlar bazasi, rollar va xavfsizlik arxitekturasi.',
    ru: 'Общий контроль системы, аналитика запросов по городу, база данных, роли и безопасность.',
    en: 'Overall system supervision, citywide search intelligence, database management, and roles architecture.'
  },
  'Admin sifatida kirish': { uz: 'Admin sifatida kirish', ru: 'Войти как администратор', en: 'Enter as Admin' },

  // Features
  'Nima uchun YaqinTop?': { uz: 'Nima uchun YaqinTop?', ru: 'Почему YaqinTop?', en: 'Why YaqinTop?' },
  'Har kuni kerakli narsalar endi yanada yaqin!': {
    uz: 'Har kuni kerakli narsalar endi yanada yaqin!',
    ru: 'Всё необходимое на каждый день теперь ещё ближе!',
    en: 'Daily essentials are now closer than ever!'
  },
  'Vaqtingizni tejang, eng yaxshi narxlarni toping va atrofingizdagi ishonchli do‘konlarni kashf eting.': {
    uz: 'Vaqtingizni tejang, eng yaxshi narxlarni toping va atrofingizdagi ishonchli do‘konlarni kashf eting.',
    ru: 'Экономьте время, находите лучшие цены и открывайте надежные магазины вокруг себя.',
    en: 'Save valuable time, compare best prices, and discover trusted neighborhood stores.'
  },
  'Tez qidiruv': { uz: 'Tez qidiruv', ru: 'Быстрый поиск', en: 'Instant Search' },
  'Kerakli tovarni 1 soniyada toping. AI va geolokatsiya asosidagi aqlli izlash.': {
    uz: 'Kerakli tovarni 1 soniyada toping. AI va geolokatsiya asosidagi aqlli izlash.',
    ru: 'Находите нужный товар за 1 секунду благодаря умному поиску на базе AI и геолокации.',
    en: 'Find what you need in 1 second with smart AI and geolocation-driven local search.'
  },
  'Interaktiv xarita': { uz: 'Interaktiv xarita', ru: 'Интерактивная карта', en: 'Interactive Map' },
  'Atrofdagi do‘konlar, narxlar va tovarlar to‘g‘ridan-to‘g‘ri xaritada ko‘rsatiladi.': {
    uz: 'Atrofdagi do‘konlar, narxlar va tovarlar to‘g‘ridan-to‘g‘ri xaritada ko‘rsatiladi.',
    ru: 'Ближайшие магазины, цены и товары отображаются прямо на карте.',
    en: 'Nearby shops, shelf prices, and available products rendered directly on the map.'
  },
  'Narxlarni taqqoslash': { uz: 'Narxlarni taqqoslash', ru: 'Сравнение цен', en: 'Price Comparison' },
  'Bir nechta do‘konlardagi narxlarni solishtirib, eng maqbul va arzonini tanlang.': {
    uz: 'Bir nechta do‘konlardagi narxlarni solishtirib, eng maqbul va arzonini tanlang.',
    ru: 'Сравнивайте цены в разных торговых точках и выбирайте самое выгодное предложение.',
    en: 'Compare prices across multiple stores to select the most affordable option.'
  },
  'Reyting va sharhlar': { uz: 'Reyting va sharhlar', ru: 'Рейтинг и отзывы', en: 'Ratings & Reviews' },
  'Haqiqiy mijozlar fikri va o‘zaro baholar asosida ishonchli do‘konlarni tanlang.': {
    uz: 'Haqiqiy mijozlar fikri va o‘zaro baholar asosida ishonchli do‘konlarni tanlang.',
    ru: 'Выбирайте проверенные магазины на основе реальных отзывов и оценок покупателей.',
    en: 'Pick verified stores based on genuine customer feedback and transparent ratings.'
  },
  'Marshrut va navigatsiya': { uz: 'Marshrut va navigatsiya', ru: 'Маршрут и навигация', en: 'Route & Navigation' },
  'Tanlangan do‘konga piyoda yoki avtomobilda eng tezkor va qulay yo‘lni ko‘rsatamiz.': {
    uz: 'Tanlangan do‘konga piyoda yoki avtomobilda eng tezkor va qulay yo‘lni ko‘rsatamiz.',
    ru: 'Показываем самый быстрый и удобный маршрут до выбранного магазина пешком или на авто.',
    en: 'Get the fastest and most convenient route by foot or car to any chosen store.'
  },
  'Sevimlilar': { uz: 'Sevimlilar', ru: 'Избранное', en: 'Favorites' },
  'Doimiy xarid qiladigan sevimli do‘konlar va tovarlarni bir zumda saqlab qo‘ying.': {
    uz: 'Doimiy xarid qiladigan sevimli do‘konlar va tovarlarni bir zumda saqlab qo‘ying.',
    ru: 'Сохраняйте любимые магазины и постоянные товары для мгновенного доступа.',
    en: 'Save favorite shops and regular purchase items for instant access anytime.'
  },

  // Stats
  'YaqinTop raqamlarda': { uz: 'YaqinTop raqamlarda', ru: 'YaqinTop в цифрах', en: 'YaqinTop in Numbers' },
  'O‘zbekiston bo‘ylab real ko‘rsatkichlar': {
    uz: 'O‘zbekiston bo‘ylab real ko‘rsatkichlar',
    ru: 'Реальные показатели по Узбекистану',
    en: 'Real performance across Uzbekistan'
  },
  'Tovarlar': { uz: 'Tovarlar', ru: 'Товары', en: 'Products' },
  'O‘rtacha reyting': { uz: 'O‘rtacha reyting', ru: 'Средний рейтинг', en: 'Average Rating' },

  // 3 Steps
  'Qanday ishlaydi?': { uz: 'Qanday ishlaydi?', ru: 'Как это работает?', en: 'How it works?' },
  'Juda oson — 3 qadamda': { uz: 'Juda oson — 3 qadamda', ru: 'Очень просто — в 3 шага', en: 'Very simple — in 3 steps' },
  'Kerakli tovarni topish endi bir necha soniya masala.': {
    uz: 'Kerakli tovarni topish endi bir necha soniya masala.',
    ru: 'Найти нужный товар теперь вопрос нескольких секунд.',
    en: 'Finding what you need is now a matter of seconds.'
  },
  'Qidiring': { uz: 'Qidiring', ru: 'Ищите', en: 'Search' },
  'Kerakli tovar yoki xizmat nomini qidiruv maydoniga yozing.': {
    uz: 'Kerakli tovar yoki xizmat nomini qidiruv maydoniga yozing.',
    ru: 'Введите название товара или услуги в строку поиска.',
    en: 'Type the product or service name into the search field.'
  },
  'Tanlang': { uz: 'Tanlang', ru: 'Выбирайте', en: 'Select' },
  'Eng yaqin do‘konlarni, kassa narxlarini va xaridorlar sharhlarini ko‘ring.': {
    uz: 'Eng yaqin do‘konlarni, kassa narxlarini va xaridorlar sharhlarini ko‘ring.',
    ru: 'Посмотрите ближайшие магазины, кассовые цены и отзывы клиентов.',
    en: 'See closest stores, shelf prices, and shopper reviews.'
  },
  'Yo‘l oling': { uz: 'Yo‘l oling', ru: 'Отправляйтесь', en: 'Head over' },
  'Tanlangan do‘konga qulay marshrut oling va xaridni amalga oshiring.': {
    uz: 'Tanlangan do‘konga qulay marshrut oling va xaridni amalga oshiring.',
    ru: 'Постройте удобный маршрут и совершите выгодную покупку.',
    en: 'Follow the convenient route and complete your purchase.'
  },
  'Tezroq xarid': { uz: 'Tezroq xarid', ru: 'Быстрые покупки', en: 'Faster shopping' },
  'Kamroq vaqt': { uz: 'Kamroq vaqt', ru: 'Меньше времени', en: 'Save time' },
  'Yaqin do‘konlar': { uz: 'Yaqin do‘konlar', ru: 'Магазины рядом', en: 'Nearby stores' },
  'Eng yaxshi narx': { uz: 'Eng yaxshi narx', ru: 'Лучшие цены', en: 'Best prices' },

  // Categories Header
  'Asosiy kategoriyalar': { uz: 'Asosiy kategoriyalar', ru: 'Основные категории', en: 'Main Categories' },
  'Barcha kerakli tovar va xizmatlar': {
    uz: 'Barcha kerakli tovar va xizmatlar',
    ru: 'Все необходимые товары и услуги',
    en: 'All essential goods and services'
  },
  'Oziq-ovqatdan tortib ta’mirlash va maishiy texnikagacha': {
    uz: 'Oziq-ovqatdan tortib ta’mirlash va maishiy texnikagacha',
    ru: 'От продуктов питания до стройматериалов и бытовой техники',
    en: 'From groceries to repair supplies and electronics'
  },

  // Interactive Map Section
  'Atrofingizdagi barcha do‘konlar bir xaritada': {
    uz: 'Atrofingizdagi barcha do‘konlar bir xaritada',
    ru: 'Все магазины вокруг вас на одной карте',
    en: 'All neighborhood stores on one map'
  },
  'Real vaqt rejimida do‘konlar, narxlar, tovarlar va xizmatlar. Sizga eng yaqin va qulay variantlarni xaritada ko‘ring.': {
    uz: 'Real vaqt rejimida do‘konlar, narxlar, tovarlar va xizmatlar. Sizga eng yaqin va qulay variantlarni xaritada ko‘ring.',
    ru: 'Магазины, цены, товары и услуги в реальном времени. Находите самые близкие и удобные варианты на карте.',
    en: 'Real-time store locations, shelf prices, and inventory. Discover the nearest and best options on the map.'
  },
  'Xaritani to‘liq ochish': { uz: 'Xaritani to‘liq ochish', ru: 'Открыть карту полностью', en: 'Open full map' },
  'Real vaqt ma’lumotlari': { uz: 'Real vaqt ma’lumotlari', ru: 'Данные в реальном времени', en: 'Real-time data' },
  'Aniq geolokatsiya': { uz: 'Aniq geolokatsiya', ru: 'Точная геолокация', en: 'Precise GPS' },
  'Qulay marshrut': { uz: 'Qulay marshrut', ru: 'Удобный маршрут', en: 'Direct routes' },
  'Do‘kon tafsilotlari': { uz: 'Do‘kon tafsilotlari', ru: 'Детали магазина', en: 'Store details' },

  // For Business
  'Bizneslar & Do‘kon egalari uchun': {
    uz: 'Bizneslar & Do‘kon egalari uchun',
    ru: 'Для бизнеса и владельцев магазинов',
    en: 'For Businesses & Store Owners'
  },
  'O‘z do‘koningizni YaqinTop tarmog‘iga bepul qo‘shing': {
    uz: 'O‘z do‘koningizni YaqinTop tarmog‘iga bepul qo‘shing',
    ru: 'Добавьте свой магазин в сеть YaqinTop бесплатно',
    en: 'Add your store to the YaqinTop network for free'
  },
  'Kuniga minglab yaqin atrofdagi xaridorlar sizning mahsulotlaringizni xaritada ko‘rishadi. Excel orqali tovarlarni yuklang, narxlarni yangilang va savdoni oshiring.': {
    uz: 'Kuniga minglab yaqin atrofdagi xaridorlar sizning mahsulotlaringizni xaritada ko‘rishadi. Excel orqali tovarlarni yuklang, narxlarni yangilang va savdoni oshiring.',
    ru: 'Тысячи покупателей поблизости ежедневно увидят ваши товары на карте. Загружайте каталог через Excel, обновляйте цены и увеличивайте продажи.',
    en: 'Thousands of local shoppers will discover your products on the map daily. Import inventory via Excel, update prices, and boost sales.'
  },
  'Do‘kon kabinetini ochish': { uz: 'Do‘kon kabinetini ochish', ru: 'Открыть кабинет магазина', en: 'Open Store Dashboard' },
  'Moderatsiya arizasi': { uz: 'Moderatsiya arizasi', ru: 'Заявка на модерацию', en: 'Submit for Moderation' },
  '3 daqiqada': { uz: '3 daqiqada', ru: 'За 3 минуты', en: 'In 3 minutes' },
  'Onboarding': { uz: 'Onboarding', ru: 'Онбординг', en: 'Onboarding' },
  'Excel Import': { uz: 'Excel Import', ru: 'Импорт Excel', en: 'Excel Import' },
  'Ommaviy yuklash': { uz: 'Ommaviy yuklash', ru: 'Массовая загрузка', en: 'Bulk upload' },
  'SMS Tasdiq': { uz: 'SMS Tasdiq', ru: 'SMS Подтверждение', en: 'SMS Verification' },
  'Telegram Bot': { uz: 'Telegram Bot', ru: 'Телеграм-бот', en: 'Telegram Bot' },
  '100% Aniq': { uz: '100% Aniq', ru: '100% Точно', en: '100% Accurate' },
  'Lokal mijozlar': { uz: 'Lokal mijozlar', ru: 'Локальные клиенты', en: 'Local customers' },

  // Testimonials
  'Foydalanuvchilar fikri': { uz: 'Foydalanuvchilar fikri', ru: 'Отзывы пользователей', en: 'User Feedback' },
  'Mijozlarimiz biz haqimizda': { uz: 'Mijozlarimiz biz haqimizda', ru: 'Что говорят наши клиенты', en: 'What our clients say' },
  'Aholi va do‘kon egalarining samimiy baholari': {
    uz: 'Aholi va do‘kon egalarining samimiy baholari',
    ru: 'Искренние отзывы жителей и владельцев магазинов',
    en: 'Genuine reviews from residents and store owners'
  },
  'Sirdaryo shahri': { uz: 'Sirdaryo shahri', ru: 'г. Сырдарья', en: 'Sirdaryo city' },
  'Guliston': { uz: 'Guliston', ru: 'г. Гулистан', en: 'Gulistan' },
  'Tadbirkor / Do‘kon egasi': { uz: 'Tadbirkor / Do‘kon egasi', ru: 'Предприниматель / Владелец магазина', en: 'Entrepreneur / Store Owner' },
  'Juda qulay ilova! Endi kerakli tovarni qidirib vaqt yo‘qotmayman. Narxlarni taqqoslab, eng yaqin do‘kondan tezda topaman.': {
    uz: 'Juda qulay ilova! Endi kerakli tovarni qidirib vaqt yo‘qotmayman. Narxlarni taqqoslab, eng yaqin do‘kondan tezda topaman.',
    ru: 'Очень удобное приложение! Больше не трачу время на поиски нужного товара. Сравниваю цены и сразу нахожу ближайший магазин.',
    en: 'Very convenient app! No more wasting time searching for products. I compare prices and find the nearest shop in seconds.'
  },
  'Kafelarni va dorixonalarni topish juda osonlashdi. Sharhlar ham haqqoniy, borish uchun eng qulay marshrutni xaritada darhol ko‘rsatadi.': {
    uz: 'Kafelarni va dorixonalarni topish juda osonlashdi. Sharhlar ham haqqoniy, borish uchun eng qulay marshrutni xaritada darhol ko‘rsatadi.',
    ru: 'Находить кафе и аптеки стало невероятно просто. Отзывы честные, а маршрут до места строится моментально.',
    en: 'Finding cafes and pharmacies has become so simple. Reviews are authentic, and the map provides instant directions.'
  },
  'Biznesimiz uchun yangi mijozlar oqimi sezilarli oshdi. Do‘konimizni va tovarlarimizni qo‘shish jarayoni juda oddiy, tez va tushunarli.': {
    uz: 'Biznesimiz uchun yangi mijozlar oqimi sezilarli oshdi. Do‘konimizni va tovarlarimizni qo‘shish jarayoni juda oddiy, tez va tushunarli.',
    ru: 'Поток новых клиентов в наш бизнес заметно вырос. Добавить магазин и каталог товаров оказалось быстро и понятно.',
    en: 'The inflow of new customers to our store has grown significantly. Adding our shop and items was fast and straightforward.'
  },

  // 4-Step Process Timeline
  'Tovarni qidirish va lokatsiya': {
    uz: 'Tovarni qidirish va lokatsiya',
    ru: 'Поиск товара и геолокация',
    en: 'Product Search & Location'
  },
  'Qidiruv maydoniga kerakli tovar yoki xizmat nomini yozing. Tizim geolokatsiya asosida 50 metrdan 3 km gacha radiusdagi eng yaqin do‘konlarni bir zumda aniqlaydi.': {
    uz: 'Qidiruv maydoniga kerakli tovar yoki xizmat nomini yozing. Tizim geolokatsiya asosida 50 metrdan 3 km gacha radiusdagi eng yaqin do‘konlarni bir zumda aniqlaydi.',
    ru: 'Введите название товара или услуги в строку поиска. Система по геолокации моментально найдет магазины в радиусе от 50 м до 3 км.',
    en: 'Type the item or service name. Using geolocation, the system instantly identifies nearest stores within a 50m to 3km radius.'
  },
  'Narx va qoldiqni solishtirish': {
    uz: 'Narx va qoldiqni solishtirish',
    ru: 'Сравнение цен и остатков',
    en: 'Compare Prices & Stock'
  },
  'Bir nechta do‘konlardagi kassa narxlarini, tovar mavjudligi (qoldiqlari) va xaridorlar sharhlarini taqqoslab, eng arzon va maqbul variantni tanlang.': {
    uz: 'Bir nechta do‘konlardagi kassa narxlarini, tovar mavjudligi (qoldiqlari) va xaridorlar sharhlarini taqqoslab, eng arzon va maqbul variantni tanlang.',
    ru: 'Сравнивайте кассовые цены нескольких магазинов, наличие товара на полках и отзывы, чтобы выбрать лучший вариант.',
    en: 'Compare shelf prices, live in-store stock, and customer reviews across stores to select the most affordable option.'
  },
  'Xaritada qulay yo‘l olish': {
    uz: 'Xaritada qulay yo‘l olish',
    ru: 'Удобный маршрут на карте',
    en: 'Get Map Directions'
  },
  'Tanlangan do‘konga piyoda yoki avtomobilda eng qisqa marshrutni oling, do‘konning ochiq/yopiq holati va ish vaqtini bir qadamda tekshiring.': {
    uz: 'Tanlangan do‘konga piyoda yoki avtomobilda eng qisqa marshrutni oling, do‘konning ochiq/yopiq holati va ish vaqtini bir qadamda tekshiring.',
    ru: 'Постройте кратчайший маршрут пешком или на машине, проверьте статус открытости и график работы магазина.',
    en: 'Get the shortest walking or driving directions, verify open/closed status, and check working hours instantly.'
  },
  'Xaridni yakunlash va baholash': {
    uz: 'Xaridni yakunlash va baholash',
    ru: 'Покупка и оценка качества',
    en: 'Complete Purchase & Review'
  },
  'Do‘konga tashrif buyurib to‘g‘ridan-to‘g‘ri kassa narxida xaridni amalga oshiring. Xarid yakunida xizmat sifatini baholab, sharh qoldiring.': {
    uz: 'Do‘konga tashrif buyurib to‘g‘ridan-to‘g‘ri kassa narxida xaridni amalga oshiring. Xarid yakunida xizmat sifatini baholab, sharh qoldiring.',
    ru: 'Посетите магазин и совершите покупку по прямой кассовой цене. Оцените уровень обслуживания и оставьте честный отзыв.',
    en: 'Visit the store to buy at direct shelf prices. After purchase, rate service quality and leave your feedback.'
  },
  'Sizga kerakli tovar yoki do‘kon': {
    uz: 'Sizga kerakli tovar yoki do‘kon',
    ru: 'Нужный вам товар или магазин',
    en: 'Your needed product or store'
  },

  // Footer & Modals
  'Tizim Portallariga to‘g‘ridan-to‘g‘ri kirish:': {
    uz: 'Tizim Portallariga to‘g‘ridan-to‘g‘ri kirish:',
    ru: 'Прямой вход в порталы системы:',
    en: 'Direct access to system portals:'
  },
  'O‘z rolingiz bo‘yicha kerakli portalni tanlang': {
    uz: 'O‘z rolingiz bo‘yicha kerakli portalni tanlang',
    ru: 'Выберите нужный портал в соответствии со своей ролью',
    en: 'Select the appropriate portal for your role'
  },
  'Bosh sahifa': { uz: 'Bosh sahifa', ru: 'Главная', en: 'Home' },
  'Yo‘l-yo‘riq': { uz: 'Yo‘l-yo‘riq', ru: 'Инструкции', en: 'Guide' },
  'Savol-Javoblar': { uz: 'Savol-Javoblar', ru: 'Частые вопросы (FAQ)', en: 'FAQ' },
  'Yangiliklar': { uz: 'Yangiliklar', ru: 'Новости', en: 'News' },
  'Do‘kon qo‘shish': { uz: 'Do‘kon qo‘shish', ru: 'Добавить магазин', en: 'Add Store' },
  'Moderatsiya': { uz: 'Moderatsiya', ru: 'Модерация', en: 'Moderation' },
  'Admin paneli': { uz: 'Admin paneli', ru: 'Панель администратора', en: 'Admin Panel' },
  'Hamkorlik': { uz: 'Hamkorlik', ru: 'Сотрудничество', en: 'Partnership' },
  'Sirdaryo, O‘zbekiston': { uz: 'Sirdaryo, O‘zbekiston', ru: 'Сырдарья, Узбекистан', en: 'Sirdaryo, Uzbekistan' },
  '© 2026 YaqinTop. Barcha huquqlar himoyalangan.': {
    uz: '© 2026 YaqinTop. Barcha huquqlar himoyalangan.',
    ru: '© 2026 YaqinTop. Все права защищены.',
    en: '© 2026 YaqinTop. All rights reserved.'
  },
  'Maxfiylik siyosati': { uz: 'Maxfiylik siyosati', ru: 'Политика конфиденциальности', en: 'Privacy Policy' },
  'Foydalanish shartlari': { uz: 'Foydalanish shartlari', ru: 'Условия использования', en: 'Terms of Service' },
  'Hududni tanlang': { uz: 'Hududni tanlang', ru: 'Выберите регион', en: 'Select Region' },
  'Tizimga kirish': { uz: 'Tizimga kirish', ru: 'Вход в систему', en: 'System Login' },
  'Kerakli portal yoki rolni tanlang': {
    uz: 'Kerakli portal yoki rolni tanlang',
    ru: 'Выберите нужный портал или роль',
    en: 'Choose portal or role'
  },

  // Additional Landing Page Map & Footer Localization
  'contact': { uz: 'Aloqa', ru: 'Контакты', en: 'Contact' },
  'Aloqa': { uz: 'Aloqa', ru: 'Контакты', en: 'Contact' },
  'role_customer': { uz: 'Xaridor', ru: 'Покупатель', en: 'Customer' },
  'role_merchant': { uz: 'Tadbirkor', ru: 'Предприниматель', en: 'Merchant' },
  'role_moderator': { uz: 'Moderator', ru: 'Модератор', en: 'Moderator' },
  'role_admin': { uz: 'Admin', ru: 'Администратор', en: 'Admin' },
  'Xaridor': { uz: 'Xaridor', ru: 'Покупатель', en: 'Customer' },
  'Tadbirkor': { uz: 'Tadbirkor', ru: 'Предприниматель', en: 'Merchant' },
  'Do‘kon': { uz: 'Do‘kon', ru: 'Магазин', en: 'Store' },
  'Stores': { uz: 'Do‘konlar', ru: 'Магазины', en: 'Stores' },
  'Mahalliy tovar va xizmatlar ekotizimi.': {
    uz: 'Mahalliy tovar va xizmatlar ekotizimi.',
    ru: 'Экосистема локальных товаров и услуг.',
    en: 'Local goods and services ecosystem.'
  },
  'dokon_count': { uz: 'do‘kon', ru: 'магазинов', en: 'stores' },
  '1 200+ do‘kon': { uz: '1 200+ do‘kon', ru: '1 200+ магазинов', en: '1,200+ stores' },
  '300+ do‘kon': { uz: '300+ do‘kon', ru: '300+ магазинов', en: '300+ stores' },
  '500+ do‘kon': { uz: '500+ do‘kon', ru: '500+ магазинов', en: '500+ stores' },
  '400+ do‘kon': { uz: '400+ do‘kon', ru: '400+ магазинов', en: '400+ stores' },
  '250+ do‘kon': { uz: '250+ do‘kon', ru: '250+ магазинов', en: '250+ stores' },
  '200+ do‘kon': { uz: '200+ do‘kon', ru: '200+ магазинов', en: '200+ stores' },
  '600+ do‘kon': { uz: '600+ do‘kon', ru: '600+ магазинов', en: '600+ stores' },
  'Radius:': { uz: 'Radius:', ru: 'Радиус:', en: 'Radius:' },
  'Qidiruv:': { uz: 'Qidiruv:', ru: 'Поиск:', en: 'Search:' },
  'Hammasi': { uz: 'Hammasi', ru: 'Все', en: 'All' },
  'Barcha do‘konlar': { uz: 'Barcha do‘konlar', ru: 'Все магазины', en: 'All stores' },
  'Yaqinlashtirish': { uz: 'Yaqinlashtirish', ru: 'Приблизить', en: 'Zoom in' },
  'Uzoqlashtirish': { uz: 'Uzoqlashtirish', ru: 'Отдалить', en: 'Zoom out' },
  'Markazga qaytish': { uz: 'Markazga qaytish', ru: 'Вернуться в центр', en: 'Center map' },
  'Ulgurji savdo': { uz: 'Ulgurji savdo', ru: 'Оптовая торговля', en: 'Wholesale' },
  'Chakana do‘kon': { uz: 'Chakana do‘kon', ru: 'Розничный магазин', en: 'Retail store' },
  'Masofa:': { uz: 'Masofa:', ru: 'Расстояние:', en: 'Distance:' },
  'metr uzoqlikda': { uz: 'metr uzoqlikda', ru: 'метров от вас', en: 'meters away' },
  'Ish vaqti:': { uz: 'Ish vaqti:', ru: 'Режим работы:', en: 'Hours:' },
  'Ochiq (08:00–23:00)': { uz: 'Ochiq (08:00–23:00)', ru: 'Открыто (08:00–23:00)', en: 'Open (08:00–23:00)' },
  'Assortiment:': { uz: 'Assortiment:', ru: 'Ассортимент:', en: 'Assortment:' },
  'ta tovar va xizmat': { uz: 'ta tovar va xizmat', ru: 'товаров и услуг', en: 'products & services' },
  'Misol tovar narxi:': { uz: 'Misol tovar narxi:', ru: 'Пример цены товара:', en: 'Sample item price:' },
  'Xaritadagi istalgan do‘kon piniga bosing': {
    uz: 'Xaritadagi istalgan do‘kon piniga bosing',
    ru: 'Нажмите на любую метку магазина на карте',
    en: 'Click any store pin on the map'
  },
  'Non': { uz: 'Non', ru: 'Хлеб', en: 'Bread' },
  'Sut': { uz: 'Sut', ru: 'Молоко', en: 'Milk' },
  'Sizning joylashuvingiz': { uz: 'Sizning joylashuvingiz', ru: 'Ваше местоположение', en: 'Your location' }
};

// Global Phrase Lookup Index (built once for high-performance auto-translation)
function normalizePhrase(text: string): string {
  return text.trim().toLowerCase().replace(/[‘’ʻ`´]/g, "'");
}

const PHRASE_INDEX = new Map<string, { uz: string; ru: string; en: string }>();
for (const entry of Object.values(DICTIONARY)) {
  if (entry.uz) {
    PHRASE_INDEX.set(entry.uz.trim().toLowerCase(), entry);
    PHRASE_INDEX.set(normalizePhrase(entry.uz), entry);
  }
  if (entry.ru) {
    PHRASE_INDEX.set(entry.ru.trim().toLowerCase(), entry);
    PHRASE_INDEX.set(normalizePhrase(entry.ru), entry);
  }
  if (entry.en) {
    PHRASE_INDEX.set(entry.en.trim().toLowerCase(), entry);
    PHRASE_INDEX.set(normalizePhrase(entry.en), entry);
  }
}

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (keyOrPhrase: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'uz',
  setLang: () => {},
  t: (keyOrPhrase, fallback) => fallback || keyOrPhrase
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
      // Dispatch storage event so cross-tabs or listeners can sync
      window.dispatchEvent(new Event('languagechange'));
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

  const t = (keyOrPhrase: string, fallback?: string): string => {
    if (!keyOrPhrase) return fallback || '';

    // 1. Direct dictionary key lookup
    const direct = DICTIONARY[keyOrPhrase];
    if (direct && direct[lang]) {
      return direct[lang];
    }

    // 2. Phrase lookup (normalized case-insensitive and quote-insensitive)
    const normalized = normalizePhrase(keyOrPhrase);
    const foundPhrase = PHRASE_INDEX.get(normalized) || PHRASE_INDEX.get(keyOrPhrase.trim().toLowerCase());
    if (foundPhrase && foundPhrase[lang]) {
      return foundPhrase[lang];
    }

    // 3. Fallback phrase lookup if provided
    if (fallback) {
      const normFallback = normalizePhrase(fallback);
      const foundFallback = PHRASE_INDEX.get(normFallback) || PHRASE_INDEX.get(fallback.trim().toLowerCase());
      if (foundFallback && foundFallback[lang]) {
        return foundFallback[lang];
      }
    }

    return fallback || direct?.uz || keyOrPhrase;
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
