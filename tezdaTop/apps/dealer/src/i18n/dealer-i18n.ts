import { useTranslation, Language } from '@yaqintop/ui';

export const DEALER_DICTIONARY: Record<string, { uz: string; ru: string; en: string }> = {
  // Brand & Header
  'app_title': {
    uz: 'YaqinTop Diller',
    ru: 'YaqinTop Дилер',
    en: 'YaqinTop Dealer'
  },
  'app_tag': {
    uz: 'B2B CRM',
    ru: 'B2B CRM',
    en: 'B2B CRM'
  },
  'clients_label': {
    uz: 'MIJOZLAR',
    ru: 'КЛИЕНТЫ',
    en: 'CLIENTS'
  },
  'total_debt_label': {
    uz: 'JAMI DEBITORLIK',
    ru: 'ВСЕГО ДЕБИТОРКА',
    en: 'TOTAL DEBT'
  },
  'theme_toggle': {
    uz: 'Mavzuni almashtirish',
    ru: 'Сменить тему оформления',
    en: 'Switch color theme'
  },
  'sign_in': {
    uz: 'Tizimga Kirish',
    ru: 'Войти в систему',
    en: 'Sign In'
  },
  'sign_out': {
    uz: 'Tizimdan chiqish',
    ru: 'Выйти из системы',
    en: 'Sign Out'
  },
  'quick_login_token': {
    uz: 'Token orqali tezkor kirish',
    ru: 'Быстрый вход по токену',
    en: 'Quick login via token'
  },
  'currency': {
    uz: 'so‘m',
    ru: 'сум',
    en: 'UZS'
  },
  'items_count': {
    uz: 'ta',
    ru: 'шт.',
    en: 'items'
  },
  'stores_count': {
    uz: 'ta do‘kon',
    ru: 'магазина',
    en: 'stores'
  },
  'debt_short': {
    uz: 'Qarz:',
    ru: 'Долг:',
    en: 'Debt:'
  },

  // Tabs
  'tab_dashboard': {
    uz: 'Boshqaruv',
    ru: 'Панель управления',
    en: 'Dashboard'
  },
  'tab_stores': {
    uz: 'Do‘konlarim',
    ru: 'Мои магазины',
    en: 'My Stores'
  },
  'tab_invoices': {
    uz: 'Yuk xatlari (Savdo)',
    ru: 'Накладные (Продажи)',
    en: 'Supply Invoices'
  },
  'tab_cash': {
    uz: 'Kassa & Inkassatsiya',
    ru: 'Касса и инкассация',
    en: 'Cash & Collection'
  },
  'tab_products': {
    uz: 'Tovarlar',
    ru: 'Товары',
    en: 'Products'
  },
  'tab_reports': {
    uz: 'Hisobotlar',
    ru: 'Отчёты',
    en: 'Reports'
  },
  'tab_map': {
    uz: 'GIS Xarita',
    ru: 'ГИС Карта',
    en: 'GIS Map'
  },

  // Common buttons & states
  'btn_save': { uz: 'Saqlash', ru: 'Сохранить', en: 'Save' },
  'btn_cancel': { uz: 'Bekor qilish', ru: 'Отмена', en: 'Cancel' },
  'btn_close': { uz: 'Yopish', ru: 'Закрыть', en: 'Close' },
  'btn_refresh': { uz: 'Yangilash', ru: 'Обновить', en: 'Refresh' },
  'btn_download_excel': { uz: 'Excel yuklab olish', ru: 'Скачать Excel', en: 'Export Excel' },
  'btn_download_pdf': { uz: 'PDF hisobot', ru: 'PDF отчёт', en: 'Export PDF' },
  'btn_filter': { uz: 'Filtrlash', ru: 'Фильтровать', en: 'Filter' },
  'status_active': { uz: 'Faol', ru: 'Активный', en: 'Active' },
  'status_pending': { uz: 'Kutilmoqda', ru: 'В ожидании', en: 'Pending' },
  'status_blocked': { uz: 'Bloklangan', ru: 'Заблокирован', en: 'Blocked' },
  'status_delivered': { uz: 'Yetkazildi', ru: 'Доставлено', en: 'Delivered' },
  'status_paid': { uz: 'To‘liq to‘landi', ru: 'Оплачено', en: 'Fully Paid' },
  'status_partial': { uz: 'Qisman to‘landi', ru: 'Частично оплачено', en: 'Partially Paid' },
  'status_debt': { uz: 'To‘liq nasiya', ru: 'В кредит', en: 'On Credit' },
  'status_returned': { uz: 'Qaytarildi', ru: 'Возвращено', en: 'Returned' },

  // Dashboard Tab
  'dash_welcome': {
    uz: 'Boshqaruv Paneli va B2B Ko‘rsatkichlar',
    ru: 'Панель управления и B2B показатели',
    en: 'Dashboard & B2B Metrics'
  },
  'dash_turnover': {
    uz: 'Umumiy Aylanma',
    ru: 'Общий оборот',
    en: 'Total Turnover'
  },
  'dash_turnover_desc': {
    uz: 'Yetkazib berilgan tovarlar umumiy qiymati',
    ru: 'Общая стоимость отгруженных товаров',
    en: 'Total value of delivered goods'
  },
  'dash_cash': {
    uz: 'Tushum (Kassa)',
    ru: 'Поступления (Касса)',
    en: 'Cash Collection'
  },
  'dash_cash_desc': {
    uz: 'Yig‘ib olingan real pul mablag‘lari',
    ru: 'Фактически собранные денежные средства',
    en: 'Actual collected cash payments'
  },
  'dash_debt': {
    uz: 'Jami Debitorlik',
    ru: 'Дебиторская задолженность',
    en: 'Accounts Receivable'
  },
  'dash_debt_desc': {
    uz: 'Do‘konlardagi osilib turgan qarzlar',
    ru: 'Сумма непогашенных долгов магазинов',
    en: 'Outstanding store debts'
  },
  'dash_stores': {
    uz: 'Faol Hamkor Do‘konlar',
    ru: 'Активные магазины-партнёры',
    en: 'Active Partner Stores'
  },
  'dash_stores_desc': {
    uz: 'Doimiy ta’minotdagi savdo nuqtalari',
    ru: 'Торговые точки на постоянном снабжении',
    en: 'Retail points under active supply'
  },
  'dash_quick_actions': {
    uz: 'Tezkor Amallar',
    ru: 'Быстрые действия',
    en: 'Quick Actions'
  },
  'action_new_supply': {
    uz: 'Tovar topshirish (Nakladnoy)',
    ru: 'Поставка товаров (Накладная)',
    en: 'Supply Goods (Invoice)'
  },
  'action_new_payment': {
    uz: 'Qarz qabul qilish (Inkassatsiya)',
    ru: 'Приём оплаты (Инкассация)',
    en: 'Receive Payment (Collection)'
  },
  'action_link_store': {
    uz: 'Yangi Do‘kon Biriktirish',
    ru: 'Прикрепить магазин',
    en: 'Link Partner Store'
  },
  'action_new_product': {
    uz: 'Yangi Tovar Qo‘shish',
    ru: 'Добавить товар',
    en: 'Add New Product'
  },
  'dash_top_debt': {
    uz: 'Eng Ko‘p Qarzi Bor Do‘konlar (Debitorlar)',
    ru: 'Магазины с наибольшим долгом (Дебиторы)',
    en: 'Top Indebted Stores (Debtors)'
  },
  'dash_top_products': {
    uz: 'Eng Ko‘p Tarqatilgan Tovarlar',
    ru: 'Самые востребованные товары',
    en: 'Top Distributed Products'
  },
  'dash_no_debtors': {
    uz: 'Barcha do‘konlar hisob-kitobi toza, qarzdorlik mavjud emas',
    ru: 'У всех магазинов чистый баланс, долгов нет',
    en: 'All stores are settled, no outstanding debts'
  },
  'dash_no_products': {
    uz: 'Hozircha tarqatilgan tovarlar tarixi yo‘q',
    ru: 'История поставок товаров пока пуста',
    en: 'No product distribution history yet'
  },

  // Stores Tab
  'stores_title': {
    uz: 'Do‘konlar va Kontragentlar Bazasi',
    ru: 'База магазинов и контрагентов',
    en: 'Stores & Counterparties Database'
  },
  'stores_subtitle': {
    uz: 'Siz hamkorlik qilayotgan savdo nuqtalari, ularning qarzdorlik balansi va akt-sverkalari',
    ru: 'Торговые точки, баланс задолженности и акты сверки взаимных расчётов',
    en: 'Partner retail stores, outstanding balances, and reconciliation statements'
  },
  'search_stores_ph': {
    uz: 'Do‘kon nomi, STIR (INN), telefon yoki manzil bo‘yicha izlash...',
    ru: 'Поиск по названию магазина, ИНН, телефону или адресу...',
    en: 'Search by store name, TIN, phone or address...'
  },
  'btn_link_existing': {
    uz: 'Mavjud do‘konni biriktirish',
    ru: 'Прикрепить существующий магазин',
    en: 'Link Existing Store'
  },
  'btn_create_new_point': {
    uz: 'Yangi nuqta qo‘shish',
    ru: 'Добавить новую точку',
    en: 'Add New Point'
  },
  'th_store_name': { uz: 'Do‘kon nomi & STIR', ru: 'Магазин и ИНН', en: 'Store Name & TIN' },
  'th_contact': { uz: 'Mas’ul shaxs & Tel', ru: 'Контактное лицо и тел.', en: 'Contact & Phone' },
  'th_address': { uz: 'Manzil', ru: 'Адрес', en: 'Address' },
  'th_debt_balance': { uz: 'Joriy Balans (Qarz)', ru: 'Текущий баланс (Долг)', en: 'Current Balance (Debt)' },
  'th_credit_limit': { uz: 'Kredit Limiti', ru: 'Кредитный лимит', en: 'Credit Limit' },
  'th_last_supply': { uz: 'Oxirgi ta’minot', ru: 'Последняя поставка', en: 'Last Supply' },
  'th_status': { uz: 'Holat', ru: 'Статус', en: 'Status' },
  'th_actions': { uz: 'Amallar', ru: 'Действия', en: 'Actions' },
  'btn_supply': { uz: 'Nakladnoy', ru: 'Накладная', en: 'Invoice' },
  'btn_collection': { uz: 'Inkassatsiya', ru: 'Инкассация', en: 'Collection' },
  'btn_akt_sverka': { uz: 'Akt-sverka', ru: 'Акт сверки', en: 'Statement' },
  'btn_return': { uz: 'Vozvrat', ru: 'Возврат', en: 'Return' },

  // Supply Invoices Tab
  'invoices_title': {
    uz: 'Yuk Xatlari va Tovar Tarqatish (Nakladnoylar)',
    ru: 'Накладные и распределение товаров (Продажи)',
    en: 'Supply Invoices & Goods Distribution'
  },
  'invoices_subtitle': {
    uz: 'Barcha do‘konlarga yetkazib berilgan tovarlar, qisman to‘lovlar va qarzdorlik qaydlari',
    ru: 'Поставленные товары, частичные оплаты и журнал задолженности',
    en: 'Delivered products, partial payments, and debtor ledger'
  },
  'btn_new_invoice': {
    uz: '+ Yangi Nakladnoy yaratish',
    ru: '+ Создать накладную',
    en: '+ Create New Invoice'
  },
  'th_inv_number': { uz: '№ & Sana', ru: '№ и Дата', en: '№ & Date' },
  'th_inv_store': { uz: 'Qabul qiluvchi do‘kon', ru: 'Магазин-получатель', en: 'Receiving Store' },
  'th_inv_total': { uz: 'Jami summa', ru: 'Общая сумма', en: 'Total Amount' },
  'th_inv_paid': { uz: 'To‘langan', ru: 'Оплачено', en: 'Paid' },
  'th_inv_debt': { uz: 'Qarzga yozildi', ru: 'Записано в долг', en: 'Recorded to Debt' },
  'th_inv_payment_type': { uz: 'To‘lov turi', ru: 'Способ оплаты', en: 'Payment Method' },
  'th_inv_items': { uz: 'Tovarlar soni', ru: 'Позиций товара', en: 'Items Count' },
  'pay_cash': { uz: 'Naqd pul', ru: 'Наличные', en: 'Cash' },
  'pay_card': { uz: 'Plastik karta', ru: 'Банковская карта', en: 'Card' },
  'pay_bank': { uz: 'Pul o‘tkazish (Hisob raqam)', ru: 'Безналичный расчёт', en: 'Bank Transfer' },
  'pay_credit': { uz: 'To‘liq nasiya (Qarz)', ru: 'В кредит (Долг)', en: 'Full Credit' },

  // Cash & Collection Tab
  'cash_title': {
    uz: 'Kassa, To‘lovlar va Qarz So‘ndirish (Ledger)',
    ru: 'Касса, платежи и погашение долга (Леджер)',
    en: 'Cash, Payments & Debt Collection'
  },
  'cash_subtitle': {
    uz: 'Do‘konlardan yig‘ib olingan inkassatsiya pullari va tovar qaytarish (vozvrat) tarixi',
    ru: 'Инкассированные деньги с магазинов и история возвратов товаров',
    en: 'Collected cash from stores and product return ledger'
  },
  'btn_receive_payment': {
    uz: '+ Qarz qabul qilish (Inkassatsiya)',
    ru: '+ Принять оплату (Инкассация)',
    en: '+ Receive Payment (Collection)'
  },
  'btn_record_return': {
    uz: '↩️ Tovar qaytarish (Vozvrat)',
    ru: '↩️ Возврат товара',
    en: '↩️ Return of Goods'
  },
  'th_tx_date': { uz: 'Sana & Vaqt', ru: 'Дата и время', en: 'Date & Time' },
  'th_tx_store': { uz: 'Do‘kon', ru: 'Магазин', en: 'Store' },
  'th_tx_type': { uz: 'Amal turi', ru: 'Тип операции', en: 'Operation Type' },
  'th_tx_amount': { uz: 'Summa', ru: 'Сумма', en: 'Amount' },
  'th_tx_balance': { uz: 'Qoldiq balans', ru: 'Остаток долга', en: 'Balance After' },
  'th_tx_comment': { uz: 'Izoh / Asos', ru: 'Примечание / Основание', en: 'Comment' },
  'tx_supply_badge': { uz: 'Tovar topshirildi', ru: 'Поставка товара', en: 'Goods Supplied' },
  'tx_payment_badge': { uz: 'Qarz to‘lovi', ru: 'Оплата долга', en: 'Debt Payment' },
  'tx_return_badge': { uz: 'Vozvrat (Qaytarish)', ru: 'Возврат товара', en: 'Goods Returned' },

  // Products Tab
  'products_title': {
    uz: 'Diller Tovar Katalogi va Ombor Qoldig‘i',
    ru: 'Каталог товаров дилера и остатки на складе',
    en: 'Dealer Product Catalog & Stock'
  },
  'products_subtitle': {
    uz: 'Ulgurji savdoga chiqarilgan mahsulotlar, narxlar va ombor qoldig‘i',
    ru: 'Товары для оптовой реализации, оптовые цены и остатки на складе',
    en: 'Wholesale products, distribution pricing, and warehouse inventory'
  },
  'btn_add_product': {
    uz: '+ Yangi tovar qo‘shish',
    ru: '+ Добавить товар',
    en: '+ Add New Product'
  },
  'b2c_sync_banner': {
    uz: 'YaqinTop B2C Sinxronizatsiyasi: Do‘konga tovar topshirilganda, YaqinTop asosiy qidiruv tizimida shu do‘konda tovar avtomatik ravishda "Mavjud" (In Stock) bo‘lib ko‘rinadi.',
    ru: 'Синхронизация YaqinTop B2C: При отгрузке товара в магазин, в главном поиске YaqinTop он автоматически отображается со статусом "В наличии".',
    en: 'YaqinTop B2C Synchronization: When goods are delivered to a store, they automatically show as "In Stock" in YaqinTop consumer search.'
  },
  'th_prod_name': { uz: 'Mahsulot nomi', ru: 'Название товара', en: 'Product Name' },
  'th_prod_sku': { uz: 'SKU / Shtrix-kod', ru: 'SKU / Штрих-код', en: 'SKU / Barcode' },
  'th_prod_category': { uz: 'Toifa', ru: 'Категория', en: 'Category' },
  'th_prod_price': { uz: 'Ulgurji narx', ru: 'Оптовая цена', en: 'Wholesale Price' },
  'th_prod_stock': { uz: 'Ombor qoldig‘i', ru: 'Остаток на складе', en: 'Warehouse Stock' },
  'th_prod_unit': { uz: 'Birlik', ru: 'Ед. изм.', en: 'Unit' },

  // Reports Tab
  'reports_title': {
    uz: 'Haftalik va Oylik Moliyaviy Tahlil',
    ru: 'Еженедельный и ежемесячный финансовый анализ',
    en: 'Weekly & Monthly Financial Analytics'
  },
  'reports_subtitle': {
    uz: 'Tanlangan davr bo‘yicha tovar tarqatish hajmi, tushum (kassa) va umumiy debitorlik dinamikasi',
    ru: 'Динамика отгрузки товаров, поступления выручки и дебиторской задолженности за период',
    en: 'Goods distribution volume, cash collection, and accounts receivable dynamics'
  },
  'period_today': { uz: 'Bugun', ru: 'Сегодня', en: 'Today' },
  'period_week': { uz: 'Shu hafta', ru: 'Эта неделя', en: 'This Week' },
  'period_month': { uz: 'Shu oy', ru: 'Этот месяц', en: 'This Month' },
  'period_year': { uz: 'Shu yil', ru: 'Этот год', en: 'This Year' },
  'period_all': { uz: 'Barcha vaqt', ru: 'За всё время', en: 'All Time' },
  'rep_turnover_stat': { uz: 'Umumiy Savdo Aylanmasi', ru: 'Общий торговый оборот', en: 'Total Sales Turnover' },
  'rep_cash_stat': { uz: 'Yig‘ib Olingan Real Pul', ru: 'Собранные денежные средства', en: 'Collected Cash' },
  'rep_debt_stat': { uz: 'Jami Qoldiq Qarzlar', ru: 'Остаток долгов магазинов', en: 'Total Outstanding Debts' },
  'rep_top_stores': { uz: 'Do‘konlar Kesimidagi Reyting', ru: 'Рейтинг по магазинам', en: 'Store Rating Analysis' },
  'rep_top_goods': { uz: 'Tovarlar Kesimidagi Hisobot', ru: 'Отчёт в разрезе товаров', en: 'Product Sales Breakdown' },

  // GIS Map & DealerMapHub
  'map_header_title': {
    uz: 'Tashkilotlar va Do‘konlar Geo-Distribyutsiya Haritasi',
    ru: 'Гео-карта дистрибуции организаций и магазинов',
    en: 'Organizations & Stores Geo-Distribution Map'
  },
  'map_header_desc': {
    uz: 'Barcha savdo nuqtalari, qarzdorlik holatlari va yetkazib berish marshruti real vaqt rejimida rangli ko‘rsatkichlar bilan ko‘rsatiladi',
    ru: 'Все торговые точки, состояние долгов и маршруты доставки в реальном времени с цветными индикаторами',
    en: 'All retail outlets, debt statuses, and delivery routes displayed in real time with color-coded markers'
  },
  'map_mode_crm': {
    uz: '1-Rejim: Do‘konlarim',
    ru: '1-Режим: Мои магазины',
    en: 'Mode 1: My Stores'
  },
  'map_mode_global': {
    uz: '2-Rejim: Global',
    ru: '2-Режим: Global Market',
    en: 'Mode 2: Global Market'
  },
  'map_btn_add_store': {
    uz: '+ Kartaga bosib do‘kon qo‘shish',
    ru: '+ Добавить магазин кликом на карте',
    en: '+ Click map to add store'
  },
  'map_btn_add_store_active': {
    uz: 'Xaritada joyni tanlang...',
    ru: 'Выберите точку на карте...',
    en: 'Select point on map...'
  },
  'map_search_placeholder': {
    uz: 'Do‘kon, Tashkilot, INN yoki telefon...',
    ru: 'Магазин, организация, ИНН или телефон...',
    en: 'Store, organization, TIN or phone...'
  },
  'filter_all_regions': { uz: 'Barcha viloyatlar', ru: 'Все регионы', en: 'All regions' },
  'filter_all_districts': { uz: 'Barcha tumanlar', ru: 'Все районы', en: 'All districts' },
  'filter_all_stores': { uz: 'Barcha do‘konlar', ru: 'Все магазины', en: 'All stores' },
  'filter_debt_green': { uz: 'Qarzi yo‘q', ru: 'Без долга', en: 'Debt free' },
  'filter_debt_yellow': { uz: 'Joriy qarz', ru: 'Текущий долг', en: 'Current debt' },
  'filter_debt_red': { uz: 'Katta qarz / Muddat o‘tgan', ru: 'Большой долг / Просрочен', en: 'High debt / Overdue' },
  'route_selected_label': { uz: 'Marshrut:', ru: 'Маршрут:', en: 'Route:' },
  'route_selected_suffix': { uz: 'ta tanlandi', ru: 'выбрано', en: 'selected' },
  'btn_build_route': { uz: 'Optimal Marshrut Tuzish', ru: 'Построить оптимальный маршрут', en: 'Build Optimal Route' },
  'btn_building_route': { uz: 'Hisoblanmoqda...', ru: 'Расчёт маршрута...', en: 'Calculating...' },
  'btn_clear_route': { uz: 'Marshrutni tozalash', ru: 'Очистить маршрут', en: 'Clear route' },
  'route_banner_title': {
    uz: 'Yetkazib berish bo‘yicha OSRM marshruti chizildi:',
    ru: 'Построен маршрут доставки OSRM:',
    en: 'OSRM delivery route plotted:'
  },
  'route_distance': { uz: 'Jami masofa:', ru: 'Расстояние:', en: 'Distance:' },
  'route_time': { uz: 'Taxminiy vaqt:', ru: 'Примерное время:', en: 'Estimated time:' },
  'route_minutes': { uz: 'daqiqa', ru: 'минут', en: 'minutes' },
  'route_stops': { uz: 'ta savdo nuqtasi', ru: 'торговых точек', en: 'trade stops' },
  'map_tab_map': { uz: 'Xarita', ru: 'Карта', en: 'Map' },
  'map_tab_stores': { uz: 'Do‘konlar', ru: 'Магазины', en: 'Stores' },
  'map_tab_actions': { uz: 'Amallar', ru: 'Действия', en: 'Actions' },
  'map_sidebar_title': { uz: 'Mijoz Do‘konlar', ru: 'Магазины клиентов', en: 'Client Stores' },
  'map_sidebar_hint': {
    uz: 'Tafsilotlar va amallar uchun ro‘yxatdagi do‘konga yoki xaritadagi belgiga bosing.',
    ru: 'Нажмите на магазин в списке или маркер на карте для просмотра деталей и действий.',
    en: 'Click a store in the list or a map marker for details and actions.'
  },
  'map_sidebar_back': { uz: 'Do‘konlar ro‘yxati', ru: 'Список магазинов', en: 'Stores list' },
  'map_sidebar_call': { uz: 'Qo‘ng‘iroq', ru: 'Позвонить', en: 'Call' },
  'map_sidebar_tin': { uz: 'STIR (INN):', ru: 'ИНН:', en: 'TIN:' },
  'map_sidebar_last_supply': { uz: 'Oxirgi ta’minot:', ru: 'Последняя поставка:', en: 'Last supply:' },
  'map_sidebar_current_debt': { uz: 'Joriy Qarz', ru: 'Текущий долг', en: 'Current Debt' },
  'map_sidebar_credit_limit': { uz: 'Kredit Limiti', ru: 'Кредитный лимит', en: 'Credit Limit' },
  'map_sidebar_add_to_route': { uz: 'Marshrutga qo‘shish', ru: 'Добавить в маршрут', en: 'Add to route' },
  'map_sidebar_center': { uz: 'Xaritada', ru: 'На карте', en: 'Center map' },
  'map_sidebar_actions_title': { uz: 'Savdo va Moliyaviy Amallar', ru: 'Торговые и финансовые операции', en: 'Sales & Financial Operations' },
  'map_sidebar_supply_btn': { uz: 'Tovar topshirish (Nakladnoy)', ru: 'Поставка товара (Накладная)', en: 'Supply Goods (Invoice)' },
  'map_sidebar_payment_btn': { uz: 'Qarz qabul qilish (Inkassatsiya)', ru: 'Приём оплаты (Инкассация)', en: 'Receive Payment (Collection)' },
  'map_sidebar_akt_sverka_btn': { uz: 'Akt-sverka', ru: 'Акт сверки', en: 'Statement' },
  'map_sidebar_return_btn': { uz: 'Vozvrat', ru: 'Возврат', en: 'Return' },
  'map_in_route': { uz: 'Marshrutda', ru: 'В маршруте', en: 'On route' },
  'map_legend_title': { uz: 'Xarita belgilari', ru: 'Обозначения на карте', en: 'Map Legend' },
  'map_legend_green': { uz: 'Qarzi yo‘q (Faol)', ru: 'Без долга (Активен)', en: 'Debt free (Active)' },
  'map_legend_yellow': { uz: 'Joriy qarzi bor', ru: 'Есть текущий долг', en: 'Current debt' },
  'map_legend_red': { uz: 'Katta qarz / Overdue', ru: 'Большой долг / Просрочен', en: 'High debt / Overdue' },
  'map_legend_high': { uz: 'Yuqori hajm (HIGH)', ru: 'Высокий объём (HIGH)', en: 'High volume (HIGH)' },
  'map_legend_medium': { uz: 'O‘rta hajm (MEDIUM)', ru: 'Средний объём (MEDIUM)', en: 'Medium volume (MEDIUM)' },
  'map_legend_low': { uz: 'Boshlang‘ich (LOW)', ru: 'Низкий объём (LOW)', en: 'Low volume (LOW)' },
  'map_marker_selected': { uz: 'TANLANGAN', ru: 'ВЫБРАНО', en: 'SELECTED' },
  'map_no_stores': { uz: 'Mos keluvchi do‘konlar topilmadi', ru: 'Подходящих магазинов не найдено', en: 'No matching stores found' },
  'map_global_title': { uz: 'Global Taqsimot Nuqtalari', ru: 'Точки глобального распределения', en: 'Global Distribution Points' },
  'map_global_desc': {
    uz: 'Barcha dillerlar taqsimoti bo‘yicha umumiy agregatlangan savdo nuqtalari',
    ru: 'Агрегированные торговые точки по распределению всех дилеров',
    en: 'Aggregated trade points across all distributors'
  },

  // Modals: New Supply Order (Nakladnoy)
  'modal_supply_title': { uz: 'Yangi Nakladnoy (Tovar topshirish)', ru: 'Новая накладная (Поставка товара)', en: 'New Invoice (Supply Goods)' },
  'modal_supply_select_store': { uz: 'Do‘konni tanlang *', ru: 'Выберите магазин *', en: 'Select Store *' },
  'modal_supply_goods_list': { uz: 'Tovarlar ro‘yxati *', ru: 'Список товаров *', en: 'Products List *' },
  'modal_supply_add_line': { uz: '+ Tovar qo‘shish', ru: '+ Добавить товар', en: '+ Add Product' },
  'modal_supply_product': { uz: 'Tovar', ru: 'Товар', en: 'Product' },
  'modal_supply_qty': { uz: 'Miqdor', ru: 'Кол-во', en: 'Quantity' },
  'modal_supply_price': { uz: 'Narx', ru: 'Цена', en: 'Price' },
  'modal_supply_subtotal': { uz: 'Jami', ru: 'Итого', en: 'Subtotal' },
  'modal_supply_total_amount': { uz: 'Jami buyurtma summasi:', ru: 'Общая сумма заказа:', en: 'Total Order Amount:' },
  'modal_supply_paid_amount': { uz: 'To‘langan summa (Naqd/Karta/Bank):', ru: 'Оплаченная сумма (Нал/Карта/Банк):', en: 'Paid Amount (Cash/Card/Bank):' },
  'modal_supply_debt_amount': { uz: 'Qarzga (Nasiyaga) yoziladi:', ru: 'Записывается в долг (Кредит):', en: 'Recorded to Debt:' },
  'modal_supply_pay_method': { uz: 'To‘lov usuli:', ru: 'Способ оплаты:', en: 'Payment Method:' },
  'modal_supply_submit': { uz: 'Nakladnoyni Tasdiqlash va Tovar Topshirish', ru: 'Подтвердить накладную и отгрузить товар', en: 'Confirm Invoice & Deliver Goods' },

  // Modals: Payment (Inkassatsiya)
  'modal_pay_title': { uz: 'Qarz Qabul Qilish (Inkassatsiya)', ru: 'Приём оплаты долга (Инкассация)', en: 'Receive Debt Payment (Collection)' },
  'modal_pay_store': { uz: 'Do‘kon:', ru: 'Магазин:', en: 'Store:' },
  'modal_pay_current_debt': { uz: 'Joriy qarzdorlik balansi:', ru: 'Текущий остаток долга:', en: 'Current Debt Balance:' },
  'modal_pay_amount': { uz: 'Qabul qilingan summa (so‘m) *', ru: 'Принятая сумма (сум) *', en: 'Accepted Amount (UZS) *' },
  'modal_pay_comment': { uz: 'Izoh / Kvitansiya raqami', ru: 'Примечание / Номер квитанции', en: 'Comment / Receipt Number' },
  'modal_pay_submit': { uz: 'To‘lovni Qabul Qilish va Balansni Yangilash', ru: 'Принять платёж и обновить баланс', en: 'Accept Payment & Update Balance' },

  // Modals: Return (Vozvrat)
  'modal_return_title': { uz: 'Tovarni Qaytarib Olish (Vozvrat)', ru: 'Возврат товара от магазина (Возврат)', en: 'Accept Product Return' },
  'modal_return_desc': {
    uz: 'Yaroqsiz yoki sotilmagan tovarni do‘kondan qaytarib olish. Do‘kon qarzi avtomatik kamayadi va diller ombori tiklanadi.',
    ru: 'Возврат нереализованного товара. Долг магазина автоматически уменьшится, а остаток на складе восстановится.',
    en: 'Return unsold goods from store. Store debt is automatically reduced and dealer warehouse stock is restored.'
  },
  'modal_return_qty': { uz: 'Qaytarilayotgan miqdor *', ru: 'Возвращаемое количество *', en: 'Returned Quantity *' },
  'modal_return_reason': { uz: 'Qaytarish sababi (Brak, muddati o‘tgan va h.k.)', ru: 'Причина возврата (Брак, срок годности и т.д.)', en: 'Return Reason (Defect, expired, etc.)' },
  'modal_return_submit': { uz: 'Vozvratni Tasdiqlash va Qarzni Kamaytirish', ru: 'Подтвердить возврат и уменьшить долг', en: 'Confirm Return & Reduce Debt' },

  // Modals: Akt-sverka
  'modal_akt_title': { uz: 'Akt-Sverka (O‘zaro Hisob-kitob Dalolatnomasi)', ru: 'Акт сверки взаиморасчётов', en: 'Statement of Account & Reconciliation' },
  'modal_akt_period': { uz: 'Barcha davr uchun tranzaksiyalar tarixi', ru: 'История всех операций за период', en: 'Transaction history for all periods' },
  'modal_akt_starting_balance': { uz: 'Boshlang‘ich qarz balansi:', ru: 'Начальный остаток долга:', en: 'Opening Balance:' },
  'modal_akt_total_supplied': { uz: 'Jami tovar yetkazildi:', ru: 'Всего поставлено товара:', en: 'Total Goods Supplied:' },
  'modal_akt_total_paid': { uz: 'Jami to‘lov qilindi:', ru: 'Всего оплачено:', en: 'Total Payments Received:' },
  'modal_akt_final_debt': { uz: 'Oxirgi qoldiq qarz:', ru: 'Итоговый остаток долга:', en: 'Final Outstanding Debt:' },
  'modal_akt_print': { uz: 'Chop etish (Print)', ru: 'Печать', en: 'Print' },

  // Modals: Link Existing Store & Add New Store
  'modal_link_title': { uz: 'Mavjud YaqinTop Do‘konini Biriktirish', ru: 'Прикрепить существующий магазин YaqinTop', en: 'Link Existing YaqinTop Store' },
  'modal_link_desc': {
    uz: 'YaqinTop bazasida mavjud bo‘lgan do‘konni STIR (INN), ID yoki nomi bo‘yicha topib, o‘z mijozlar ro‘yxatingizga qo‘shing.',
    ru: 'Найдите магазин по ИНН, ID или названию в базе YaqinTop и добавьте в список клиентов.',
    en: 'Find an existing store by TIN, ID or name in YaqinTop database and link to your clients list.'
  },
  'modal_new_store_title': { uz: 'Yangi Savdo Nuqtasi Qo‘shish (GPS Pin)', ru: 'Создать новую торговую точку (GPS)', en: 'Add New Retail Point (GPS Pin)' },
  'modal_new_store_desc': {
    uz: 'Hali YaqinTop tizimida bo‘lmagan do‘konni koordinatalari va ma’lumotlari bilan bazangizga kiriting. Moderator tasdiqlagach, umumiy xaritada ham ochiladi.',
    ru: 'Внесите новый магазин с координатами и контактами. После модерации он появится и на общей карте.',
    en: 'Register a new store with coordinates and contacts. After moderation it will also appear on the public map.'
  },
  'form_store_name': { uz: 'Do‘kon nomi *', ru: 'Название магазина *', en: 'Store Name *' },
  'form_store_inn': { uz: 'STIR (INN / Soliq to‘lovchi raqami)', ru: 'ИНН организации / магазина', en: 'TIN (Taxpayer Identification Number)' },
  'form_store_phone': { uz: 'Mas’ul shaxs telefoni *', ru: 'Телефон ответственного лица *', en: 'Contact Phone *' },
  'form_store_address': { uz: 'Aniq manzili *', ru: 'Точный адрес *', en: 'Exact Address *' },
  'form_store_credit_limit': { uz: 'Kredit Limiti (so‘m)', ru: 'Кредитный лимит (сум)', en: 'Credit Limit (UZS)' },
  'form_initial_debt': { uz: 'Boshlang‘ich qarz (agar avvaldan bo‘lsa)', ru: 'Начальный долг (если есть)', en: 'Initial Debt (if any)' },
  'btn_submit_link': { uz: 'Do‘konni Mijozlarimga Qo‘shish', ru: 'Добавить магазин в Мои клиенты', en: 'Link Store to My Clients' },
  'btn_submit_new_store': { uz: 'Yangi Nuqtani Saqlash', ru: 'Сохранить новую точку', en: 'Save New Store' },

  // Additional App UI keys
  'header_subtitle': { uz: 'Ulgurji Taqsimot & Debitorlik', ru: 'Оптовая дистрибуция и задолженность', en: 'Wholesale Distribution & Receivables' },
  'tab_supplies_short': { uz: 'Savdo', ru: 'Продажи', en: 'Sales' },
  'tab_cash_short': { uz: 'Kassa', ru: 'Касса', en: 'Cash' },
  'dash_quick_actions_sub': {
    uz: 'Do‘konga tovar topshirish yoki kassaga qarz yig‘ishni bir zumda amalga oshiring',
    ru: 'Мгновенная отгрузка товаров или инкассация задолженности в 1 клик',
    en: 'Instant goods delivery or cash collection in 1 click'
  },
  'dash_recent_invoices': { uz: 'So‘nggi Yuk Xatlari (Nakladnoylar)', ru: 'Последние накладные (Поставки)', en: 'Recent Supply Invoices' },
  'dash_view_all': { uz: 'Hammasini ko‘rish', ru: 'Смотреть все', en: 'View All' },
  'dash_no_orders': { uz: 'Hali yuk xatlari rasmiylashtirilmagan', ru: 'Накладные пока не оформлены', en: 'No invoices created yet' },
  'dash_debt_status': { uz: 'Do‘konlar Qarzdorlik Holati', ru: 'Состояние задолженности магазинов', en: 'Store Debt Status Breakdown' },
  'dash_view_map': { uz: 'Xaritada nuqtalarni ko‘rish', ru: 'Посмотреть точки на карте', en: 'View Points on Map' },
  'no_address': { uz: 'Manzil kiritilmagan', ru: 'Адрес не указан', en: 'No address specified' },
  'no_phone': { uz: 'Telefon yo‘q', ru: 'Телефон отсутствует', en: 'No phone' },
  'days_ago': { uz: 'kun oldin', ru: 'дней назад', en: 'days ago' },
  'invoices_empty': { uz: 'Hech qanday yuk xati topilmadi', ru: 'Накладные не найдены', en: 'No invoices found' },
  'cash_pay_desc': {
    uz: 'Do‘kondan naqd, o‘tkazma yoki karta orqali avvalgi qarz hisobidan pul qabul qilish',
    ru: 'Приём денежных средств (нал, карта, банк) в счёт погашения задолженности',
    en: 'Receive funds (cash, card, bank) toward store debt settlement'
  },
  'pay_shortcut_full': { uz: 'To‘liq', ru: 'Полностью', en: 'Full' },
  'rep_top_products': { uz: 'Eng ko‘p sotilgan tovarlar', ru: 'Самые продаваемые товары', en: 'Top Selling Products' },
  'mobile_quick_actions_sub': {
    uz: 'Savdo agentlari va dillerlar uchun 1-bosishda tezkor operatsiyalar:',
    ru: 'Быстрые операции для торговых агентов и дилеров в 1 касание:',
    en: 'One-touch quick actions for sales reps and dealers:'
  },
  'form_comment': { uz: 'Qo‘shimcha izoh', ru: 'Дополнительное примечание', en: 'Additional Notes' },
  'form_store_search': { uz: 'Do‘kon nomi, STIR yoki ID raqami *', ru: 'Название, ИНН или ID магазина *', en: 'Store Name, TIN or ID *' },
  'form_store_lat': { uz: 'Kenglik (Latitude)', ru: 'Широта (Latitude)', en: 'Latitude' },
  'form_store_lng': { uz: 'Uzunlik (Longitude)', ru: 'Долгота (Longitude)', en: 'Longitude' },
  'login_modal_title': { uz: 'YaqinTop Diller - B2B Tizimiga Kirish', ru: 'YaqinTop Дилер - Вход в B2B систему', en: 'YaqinTop Dealer - B2B Sign In' },
  'login_credentials_tab': { uz: 'Login & Parol', ru: 'Логин и пароль', en: 'Login & Password' },
  'login_notice': {
    uz: 'Tizim yopiq B2B hisoblanadi. Kirish ma’lumotlari ma’muriyat tomonidan taqdim etiladi.',
    ru: 'Система является закрытой B2B платформой. Учётные данные выдаются администрацией.',
    en: 'Closed B2B system. Access credentials are provided by management.'
  },
  'login_username_label': { uz: 'Login yoki Telefon raqami', ru: 'Логин или номер телефона', en: 'Login or Phone Number' },
  'login_password_label': { uz: 'Parol', ru: 'Пароль', en: 'Password' },
  'verifying': { uz: 'Tekshirilmoqda...', ru: 'Проверка данных...', en: 'Verifying...' },
  'login_token_switch': { uz: 'Yoki admin bergan Token orqali parolsiz kiring →', ru: 'Или войдите без пароля по токену администратора →', en: 'Or sign in without password via Admin Token →' },
  'login_token_info': {
    uz: 'Admin paneldan nusxalangan dillerlik sessiya tokeni orqali parolsiz darhol kiring.',
    ru: 'Быстрый вход без пароля по токену сессии, скопированному из панели администратора.',
    en: 'Instant passwordless login using dealer session token from admin panel.'
  },
  'login_token_label': { uz: 'Dillerlik Sessiya Tokeni', ru: 'Токен дилерской сессии', en: 'Dealer Session Token' },
  'login_paste_clipboard': { uz: 'Xotiradan qo‘yish', ru: 'Вставить из буфера', en: 'Paste from clipboard' },
  'login_token_submit': { uz: 'Token orqali tizimga kirish', ru: 'Войти в систему по токену', en: 'Sign in with Token' },
  'login_back_credentials': { uz: '← Login va parol orqali kirishga qaytish', ru: '← Вернуться ко входу по логину и паролю', en: '← Back to username & password login' },
  'login_shortcut_hint': {
    uz: 'Istalgan vaqtda klaviaturada Ctrl + Alt + T tugmalarini bosib tokenni kiritishingiz mumkin.',
    ru: 'Вы можете в любой момент нажать Ctrl + Alt + T на клавиатуре для быстрого ввода токена.',
    en: 'You can press Ctrl + Alt + T at any time to open quick token login.'
  },
  'login_demo_hint': { uz: 'Kirish ma’lumotlarini administratordan oling.', ru: 'Получите данные для входа у администратора.', en: 'Ask your administrator for sign-in details.' }
};

export function useDealerI18n() {
  const { lang, setLang } = useTranslation();

  const tDealer = (key: string, fallback?: string): string => {
    const entry = DEALER_DICTIONARY[key];
    if (entry) {
      return entry[lang] || entry.uz;
    }
    return fallback || key;
  };

  return {
    lang: lang as Language,
    setLang,
    t: tDealer
  };
}
