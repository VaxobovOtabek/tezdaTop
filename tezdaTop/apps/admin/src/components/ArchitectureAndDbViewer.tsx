import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Database,
  Layers,
  Search,
  ArrowRight,
  Shield,
  Smartphone,
  Store,
  Compass,
  FileSpreadsheet,
  Activity,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Code2,
  Table as TableIcon,
  Eye,
  Copy,
  Check,
  Server,
  Network,
  Zap,
  Lock,
  GitFork,
  Boxes,
  HelpCircle,
  FileCode,
  Link,
  Key,
  ArrowLeftRight,
  Share2,
  Columns,
  ListFilter,
  Terminal,
  Info,
  Sparkles,
  Workflow
} from 'lucide-react';
import { Button, Tag, Modal } from '@yaqintop/ui';

export interface TableSchemaInfo {
  key: string;
  name: string;
  title: string;
  category: 'core' | 'catalog' | 'customer' | 'finance';
  categoryTitle: string;
  color: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  badgeBg: string;
  description: string;
  pk: string;
  columns: {
    name: string;
    type: string;
    isPk?: boolean;
    isFk?: boolean;
    fkTarget?: string;
    desc: string;
  }[];
  outgoingRelations: {
    to: string;
    targetName: string;
    fkField: string;
    cardinality: 'N:1' | '1:1';
    desc: string;
  }[];
  incomingRelations: {
    from: string;
    sourceName: string;
    fkField: string;
    cardinality: '1:N' | 'N:M';
    desc: string;
  }[];
  sampleJoinQuery: string;
}

const DB_SCHEMA_TABLES: Record<string, TableSchemaInfo> = {
  organizations: {
    key: 'organizations',
    name: 'organizations',
    title: 'Tashkilotlar (Organizations)',
    category: 'core',
    categoryTitle: 'Asosiy Baza',
    color: '#10B981',
    borderClass: 'border-emerald-500',
    bgClass: 'bg-emerald-50 dark:bg-[#122A1E]',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
    description: 'Yuridik shaxslar, brendlar, korxonalar, soliq INN va POS kassa tizimlari sozlamalari',
    pk: 'id (UUID)',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, desc: 'Tashkilot birlamchi unikal kaliti (PK)' },
      { name: 'name', type: 'VARCHAR(255)', desc: 'Tashkilot yoki brend rasmiy nomi' },
      { name: 'inn', type: 'VARCHAR(20)', desc: 'Soliq to‘lovchining identifikatsiya raqami (STIR / INN)' },
      { name: 'posType', type: 'VARCHAR(50)', desc: 'Kassa integratsiya turi (CUSTOM, JOWI, IIKO, POSTER)' },
      { name: 'status', type: 'VARCHAR(20)', desc: 'Tashkilot holati: ACTIVE, PENDING, BLOCKED' },
      { name: 'createdAt', type: 'TIMESTAMP', desc: 'Tizimda ro‘yxatdan o‘tgan vaqt' }
    ],
    outgoingRelations: [],
    incomingRelations: [
      { from: 'stores', sourceName: 'stores', fkField: 'orgId ➔ organizations.id', cardinality: '1:N', desc: 'Tashkilotga tegishli savdo filiallari va do‘konlar' },
      { from: 'users', sourceName: 'users', fkField: 'orgId ➔ organizations.id', cardinality: '1:N', desc: 'Tashkilot xodimlari, sotuvchilari va adminlari' },
      { from: 'inquiries', sourceName: 'inquiries', fkField: 'targetOrgId ➔ organizations.id', cardinality: '1:N', desc: 'Xaridor yoki admin tomonidan tashkilotga yuborilgan murojaatlar' }
    ],
    sampleJoinQuery: `SELECT o.name AS org_name, s.name AS store_name, COUNT(off.id) AS total_offers
FROM organizations o
JOIN stores s ON s.orgId = o.id
LEFT JOIN offers off ON off.storeId = s.id
GROUP BY o.id, s.id;`
  },
  stores: {
    key: 'stores',
    name: 'stores',
    title: 'Filiallar & Do‘konlar (Stores)',
    category: 'core',
    categoryTitle: 'Asosiy Baza',
    color: '#3B82F6',
    borderClass: 'border-blue-500',
    bgClass: 'bg-blue-50 dark:bg-[#132238]',
    textClass: 'text-blue-700 dark:text-blue-400',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300',
    description: 'Jismoniy savdo nuqtalari, geo-lokatsiya (lat/lng), ish vaqtlari, reyting va telefonlar',
    pk: 'id (UUID)',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, desc: 'Do‘kon birlamchi unikal kaliti (PK)' },
      { name: 'orgId', type: 'UUID', isFk: true, fkTarget: 'organizations.id', desc: 'Tashkilotga tashqi havola (FK ➔ organizations.id)' },
      { name: 'name', type: 'VARCHAR(255)', desc: 'Filial yoki savdo do‘koni nomi' },
      { name: 'address', type: 'VARCHAR(500)', desc: 'Do‘kon joylashgan to‘liq manzil' },
      { name: 'latitude', type: 'FLOAT', desc: 'Geo-koordinata: Kenglik (xaritada ko‘rsatish uchun)' },
      { name: 'longitude', type: 'FLOAT', desc: 'Geo-koordinata: Uzunlik (masofani hisoblash uchun)' },
      { name: 'phone', type: 'VARCHAR(50)', desc: 'Do‘kon aloqa raqami' },
      { name: 'rating', type: 'FLOAT', desc: 'O‘rtacha xaridorlar reytingi (0.0 - 5.0)' },
      { name: 'isOpen', type: 'BOOLEAN', desc: 'Joriy ish holati: Ochiq yoki Yopiq' }
    ],
    outgoingRelations: [
      { to: 'organizations', targetName: 'organizations', fkField: 'orgId ➔ organizations.id', cardinality: 'N:1', desc: 'Do‘kon qaysi bosh tashkilotga qarashliligi' }
    ],
    incomingRelations: [
      { from: 'offers', sourceName: 'offers', fkField: 'storeId ➔ stores.id', cardinality: '1:N', desc: 'Do‘kondagi tovarlar narxlari va mavjud qoldig‘i' },
      { from: 'reviews', sourceName: 'reviews', fkField: 'storeId ➔ stores.id', cardinality: '1:N', desc: 'Do‘konga xaridorlar qoldirgan baho va sharhlar' },
      { from: 'reports', sourceName: 'reports', fkField: 'storeId ➔ stores.id', cardinality: '1:N', desc: 'Xaridorlar yuborgan xato xabarlari (noto‘g‘ri narx, yo‘q tovar)' },
      { from: 'sales_receipts', sourceName: 'sales_receipts', fkField: 'storeId ➔ stores.id', cardinality: '1:N', desc: 'Do‘konda amalga oshirilgan barcha kassa savdo cheklari' },
      { from: 'expenses', sourceName: 'expenses', fkField: 'storeId ➔ stores.id', cardinality: '1:N', desc: 'Do‘kon operatsion xarajatlari (ijara, kommunal, maosh)' }
    ],
    sampleJoinQuery: `SELECT s.name AS store_name, o.name AS organization_name,
       COUNT(DISTINCT off.id) AS total_goods,
       AVG(r.rating) AS avg_review_rating
FROM stores s
JOIN organizations o ON o.id = s.orgId
LEFT JOIN offers off ON off.storeId = s.id
LEFT JOIN reviews r ON r.storeId = s.id
GROUP BY s.id, o.id;`
  },
  variants: {
    key: 'variants',
    name: 'variants',
    title: 'Tovarlar Katalogi (Variants)',
    category: 'catalog',
    categoryTitle: 'Tovar Katalogi',
    color: '#8B5CF6',
    borderClass: 'border-purple-500',
    bgClass: 'bg-purple-50 dark:bg-[#201533]',
    textClass: 'text-purple-700 dark:text-purple-400',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300',
    description: 'Global tovarlar katalogi, barkod (shtrix-kod), toifalar, brendlar va o‘lchov birliklari',
    pk: 'id (UUID)',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, desc: 'Mahsulot unikal kaliti (PK)' },
      { name: 'title', type: 'VARCHAR(255)', desc: 'Tovar to‘liq nomi (masalan: Coca-Cola 1.5L)' },
      { name: 'barcode', type: 'VARCHAR(50)', desc: 'EAN-13 / UPC shtrix-kodi (unikal indekslangan)' },
      { name: 'category', type: 'VARCHAR(100)', desc: 'Kategoriya (Ichimliklar, Oziq-ovqat, Kimyo va h.k.)' },
      { name: 'brand', type: 'VARCHAR(100)', desc: 'Ishlab chiqaruvchi brend' },
      { name: 'unit', type: 'VARCHAR(20)', desc: 'O‘lchov birligi (dona, kg, litr, qadoq)' },
      { name: 'imageUrl', type: 'TEXT', desc: 'Tovar rasmi havolasi' }
    ],
    outgoingRelations: [],
    incomingRelations: [
      { from: 'offers', sourceName: 'offers', fkField: 'variantId ➔ variants.id', cardinality: '1:N', desc: 'Ushbu tovarning turli do‘konlardagi sotuv takliflari' }
    ],
    sampleJoinQuery: `SELECT v.title AS product_name, v.barcode, v.category,
       MIN(off.price) AS min_price,
       MAX(off.price) AS max_price,
       COUNT(DISTINCT off.storeId) AS available_in_stores
FROM variants v
JOIN offers off ON off.variantId = v.id
WHERE off.isAvailable = true
GROUP BY v.id;`
  },
  offers: {
    key: 'offers',
    name: 'offers',
    title: 'Do‘kon Takliflari & Narxlar (Offers)',
    category: 'catalog',
    categoryTitle: 'Tovar Katalogi',
    color: '#F59E0B',
    borderClass: 'border-amber-500',
    bgClass: 'bg-amber-50 dark:bg-[#2B1E11]',
    textClass: 'text-amber-700 dark:text-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
    description: 'Do‘konlardagi tovar narxi, ombor qoldig‘i va mavjudligi (Stores va Variants orasidagi N:M bog‘lovchi jadval)',
    pk: 'id (UUID)',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, desc: 'Taklif unikal kaliti (PK)' },
      { name: 'storeId', type: 'UUID', isFk: true, fkTarget: 'stores.id', desc: 'Qaysi do‘konga tegishli (FK ➔ stores.id)' },
      { name: 'variantId', type: 'UUID', isFk: true, fkTarget: 'variants.id', desc: 'Qaysi tovar varianti (FK ➔ variants.id)' },
      { name: 'price', type: 'DECIMAL(12,2)', desc: 'Joriy sotuv narxi (so‘mda)' },
      { name: 'stock', type: 'INT', desc: 'Do‘kondagi qoldiq miqdori' },
      { name: 'isAvailable', type: 'BOOLEAN', desc: 'Sotuvda mavjudlik holati' },
      { name: 'updatedAt', type: 'TIMESTAMP', desc: 'Narx yoki qoldiq oxirgi yangilangan vaqt' }
    ],
    outgoingRelations: [
      { to: 'stores', targetName: 'stores', fkField: 'storeId ➔ stores.id', cardinality: 'N:1', desc: 'Taklif sotilayotgan filial' },
      { to: 'variants', targetName: 'variants', fkField: 'variantId ➔ variants.id', cardinality: 'N:1', desc: 'Taklif tegishli bo‘lgan mahsulot varianti' }
    ],
    incomingRelations: [],
    sampleJoinQuery: `SELECT s.name AS store_name, v.title AS product_name,
       off.price, off.stock, off.isAvailable
FROM offers off
JOIN stores s ON s.id = off.storeId
JOIN variants v ON v.id = off.variantId
WHERE off.isAvailable = true AND off.stock > 0
ORDER BY off.price ASC;`
  },
  users: {
    key: 'users',
    name: 'users',
    title: 'Foydalanuvchilar & Xodimlar (Users)',
    category: 'customer',
    categoryTitle: 'Foydalanuvchilar',
    color: '#6366F1',
    borderClass: 'border-indigo-500',
    bgClass: 'bg-indigo-50 dark:bg-[#181838]',
    textClass: 'text-indigo-700 dark:text-indigo-400',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300',
    description: 'Barcha platforma rollari (SUPERADMIN, ADMIN, MERCHANT_ADMIN, STORE_MANAGER, CASHIER, CUSTOMER)',
    pk: 'id (UUID)',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, desc: 'Foydalanuvchi unikal kaliti (PK)' },
      { name: 'orgId', type: 'UUID', isFk: true, fkTarget: 'organizations.id', desc: 'Tashkilotga bog‘lanish (xodimlar uchun FK ➔ organizations.id)' },
      { name: 'phone', type: 'VARCHAR(20)', desc: 'Telefon raqami (Login uchun unikal indeks)' },
      { name: 'fullName', type: 'VARCHAR(150)', desc: 'Foydalanuvchi to‘liq ismi sharifi' },
      { name: 'role', type: 'VARCHAR(50)', desc: 'Tizimdagi huquq va roli: RBAC boshqaruvi' },
      { name: 'status', type: 'VARCHAR(20)', desc: 'Hisob holati: ACTIVE, BLOCKED, SUSPENDED' },
      { name: 'createdAt', type: 'TIMESTAMP', desc: 'Tizimga qo‘shilgan sana' }
    ],
    outgoingRelations: [
      { to: 'organizations', targetName: 'organizations', fkField: 'orgId ➔ organizations.id', cardinality: 'N:1', desc: 'Sotuvchi/xodim tegishli bo‘lgan korxona' }
    ],
    incomingRelations: [
      { from: 'reviews', sourceName: 'reviews', fkField: 'userId ➔ users.id', cardinality: '1:N', desc: 'Foydalanuvchi qoldirgan sharhlar' },
      { from: 'inquiries', sourceName: 'inquiries', fkField: 'userId ➔ users.id', cardinality: '1:N', desc: 'Foydalanuvchi ochgan murojaatlar' },
      { from: 'reports', sourceName: 'reports', fkField: 'userId ➔ users.id', cardinality: '1:N', desc: 'Foydalanuvchi yuborgan moderatsiya shikoyatlari' }
    ],
    sampleJoinQuery: `SELECT u.fullName, u.phone, u.role, o.name AS company_name
FROM users u
LEFT JOIN organizations o ON o.id = u.orgId
ORDER BY u.role;`
  },
  inquiries: {
    key: 'inquiries',
    name: 'inquiries',
    title: 'Murojaatlar & Xabarlar (Inquiries)',
    category: 'customer',
    categoryTitle: 'Foydalanuvchilar',
    color: '#0EA5E9',
    borderClass: 'border-sky-500',
    bgClass: 'bg-sky-50 dark:bg-[#102436]',
    textClass: 'text-sky-700 dark:text-sky-400',
    badgeBg: 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300',
    description: 'Xaridor, do‘kon va admin o‘rtasidagi markazlashtirilgan xabarlar va javoblar tizimi',
    pk: 'id (UUID)',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, desc: 'Murojaat unikal kaliti (PK)' },
      { name: 'userId', type: 'UUID', isFk: true, fkTarget: 'users.id', desc: 'Yuboruvchi muallif (FK ➔ users.id)' },
      { name: 'targetOrgId', type: 'UUID', isFk: true, fkTarget: 'organizations.id', desc: 'Qabul qiluvchi tashkilot (FK ➔ organizations.id)' },
      { name: 'subject', type: 'VARCHAR(255)', desc: 'Murojaat mavzusi va qisqacha tavsifi' },
      { name: 'status', type: 'VARCHAR(20)', desc: 'Murojaat holati: PENDING, RESOLVED, REJECTED' },
      { name: 'recipientType', type: 'VARCHAR(20)', desc: 'Qabul qiluvchi turi: ADMIN yoki MERCHANT' },
      { name: 'replies', type: 'JSONB', desc: 'Suhbat tarixi va javoblar zanjiri' }
    ],
    outgoingRelations: [
      { to: 'users', targetName: 'users', fkField: 'userId ➔ users.id', cardinality: 'N:1', desc: 'Murojaatni yuborgan mijoz yoki xodim' },
      { to: 'organizations', targetName: 'organizations', fkField: 'targetOrgId ➔ organizations.id', cardinality: 'N:1', desc: 'Murojaat yuborilgan korxona' }
    ],
    incomingRelations: [],
    sampleJoinQuery: `SELECT inq.id, inq.subject, inq.status,
       u.fullName AS sender_name, u.phone AS sender_phone,
       o.name AS recipient_org
FROM inquiries inq
JOIN users u ON u.id = inq.userId
LEFT JOIN organizations o ON o.id = inq.targetOrgId;`
  },
  reviews: {
    key: 'reviews',
    name: 'reviews',
    title: 'Sharhlar & Reyting (Reviews)',
    category: 'customer',
    categoryTitle: 'Foydalanuvchilar',
    color: '#F43F5E',
    borderClass: 'border-rose-500',
    bgClass: 'bg-rose-50 dark:bg-[#2B141C]',
    textClass: 'text-rose-700 dark:text-rose-400',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300',
    description: 'Do‘konlarga berilgan 1-5 yulduzli baholar, xaridor sharhlari va taassurotlari',
    pk: 'id (UUID)',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, desc: 'Sharh unikal kaliti (PK)' },
      { name: 'storeId', type: 'UUID', isFk: true, fkTarget: 'stores.id', desc: 'Baholangan do‘kon (FK ➔ stores.id)' },
      { name: 'userId', type: 'UUID', isFk: true, fkTarget: 'users.id', desc: 'Sharh yozgan xaridor (FK ➔ users.id)' },
      { name: 'rating', type: 'INT', desc: 'Baho (1 dan 5 gacha butun son)' },
      { name: 'comment', type: 'TEXT', desc: 'Foydalanuvchi yozgan izoh va sharh matni' },
      { name: 'createdAt', type: 'TIMESTAMP', desc: 'Sharh qoldirilgan sana va vaqt' }
    ],
    outgoingRelations: [
      { to: 'stores', targetName: 'stores', fkField: 'storeId ➔ stores.id', cardinality: 'N:1', desc: 'Sharh qaysi do‘konga tegishliligi' },
      { to: 'users', targetName: 'users', fkField: 'userId ➔ users.id', cardinality: 'N:1', desc: 'Sharh qaysi foydalanuvchiga tegishliligi' }
    ],
    incomingRelations: [],
    sampleJoinQuery: `SELECT s.name AS store_name, u.fullName AS reviewer, r.rating, r.comment
FROM reviews r
JOIN stores s ON s.id = r.storeId
JOIN users u ON u.id = r.userId
ORDER BY r.createdAt DESC;`
  },
  reports: {
    key: 'reports',
    name: 'reports',
    title: 'Moderatsiya Shikoyatlari (Reports)',
    category: 'customer',
    categoryTitle: 'Foydalanuvchilar',
    color: '#EF4444',
    borderClass: 'border-red-500',
    bgClass: 'bg-red-50 dark:bg-[#2A1313]',
    textClass: 'text-red-700 dark:text-red-400',
    badgeBg: 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300',
    description: 'Xaridorlar tomonidan do‘kondagi xato narx, yo‘q tovar yoki yopiqlik haqidagi moderatsiya signallari',
    pk: 'id (UUID)',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, desc: 'Shikoyat unikal kaliti (PK)' },
      { name: 'storeId', type: 'UUID', isFk: true, fkTarget: 'stores.id', desc: 'Shikoyat qilingan do‘kon (FK ➔ stores.id)' },
      { name: 'userId', type: 'UUID', isFk: true, fkTarget: 'users.id', desc: 'Xabar bergan mijoz (FK ➔ users.id)' },
      { name: 'type', type: 'VARCHAR(50)', desc: 'Xato turi: WRONG_PRICE, OUT_OF_STOCK, STORE_CLOSED' },
      { name: 'status', type: 'VARCHAR(20)', desc: 'Moderatsiya holati: OPEN, IN_REVIEW, RESOLVED' },
      { name: 'details', type: 'TEXT', desc: 'Xatolik haqida batafsil ma’lumot' }
    ],
    outgoingRelations: [
      { to: 'stores', targetName: 'stores', fkField: 'storeId ➔ stores.id', cardinality: 'N:1', desc: 'Xatolik aniqlangan savdo nuqtasi' },
      { to: 'users', targetName: 'users', fkField: 'userId ➔ users.id', cardinality: 'N:1', desc: 'Xabar bergan foydalanuvchi' }
    ],
    incomingRelations: [],
    sampleJoinQuery: `SELECT rep.id, rep.type, rep.status,
       s.name AS store_name, s.address,
       u.phone AS reporter_phone
FROM reports rep
JOIN stores s ON s.id = rep.storeId
LEFT JOIN users u ON u.id = rep.userId
WHERE rep.status = 'OPEN';`
  },
  sales_receipts: {
    key: 'sales_receipts',
    name: 'sales_receipts',
    title: 'Savdo Cheklari (Sales Receipts)',
    category: 'finance',
    categoryTitle: 'Savdo & Moliya',
    color: '#14B8A6',
    borderClass: 'border-teal-500',
    bgClass: 'bg-teal-50 dark:bg-[#112926]',
    textClass: 'text-teal-700 dark:text-teal-400',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300',
    description: 'Do‘kon kassa operatsiyalari, tovar sotuvlari, jami tushumlar va cheklar tarixi',
    pk: 'id (UUID)',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, desc: 'Chek unikal kaliti (PK)' },
      { name: 'storeId', type: 'UUID', isFk: true, fkTarget: 'stores.id', desc: 'Savdo bo‘lgan filial (FK ➔ stores.id)' },
      { name: 'totalAmount', type: 'DECIMAL(12,2)', desc: 'Jami to‘lov summasi (so‘mda)' },
      { name: 'paymentMethod', type: 'VARCHAR(50)', desc: 'To‘lov usuli: CASH, CARD, PAYME, CLICK' },
      { name: 'status', type: 'VARCHAR(20)', desc: 'Chek holati: COMPLETED, REFUNDED' },
      { name: 'items', type: 'JSONB', desc: 'Sotilgan tovarlar, miqdori va narxlari ro‘yxati' },
      { name: 'createdAt', type: 'TIMESTAMP', desc: 'Savdo amalga oshirilgan aniq vaqt' }
    ],
    outgoingRelations: [
      { to: 'stores', targetName: 'stores', fkField: 'storeId ➔ stores.id', cardinality: 'N:1', desc: 'Savdo qilingan savdo do‘koni' }
    ],
    incomingRelations: [],
    sampleJoinQuery: `SELECT s.name AS store_name,
       COUNT(sr.id) AS total_receipts,
       SUM(sr.totalAmount) AS total_revenue
FROM sales_receipts sr
JOIN stores s ON s.id = sr.storeId
GROUP BY s.id;`
  },
  expenses: {
    key: 'expenses',
    name: 'expenses',
    title: 'Filial Xarajatlari (Expenses)',
    category: 'finance',
    categoryTitle: 'Savdo & Moliya',
    color: '#F97316',
    borderClass: 'border-orange-500',
    bgClass: 'bg-orange-50 dark:bg-[#2C1910]',
    textClass: 'text-orange-700 dark:text-orange-400',
    badgeBg: 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300',
    description: 'Filial ijara haqi, kommunal to‘lovlar, oylik maosh va xo‘jalik xarajatlari',
    pk: 'id (UUID)',
    columns: [
      { name: 'id', type: 'UUID', isPk: true, desc: 'Xarajat unikal kaliti (PK)' },
      { name: 'storeId', type: 'UUID', isFk: true, fkTarget: 'stores.id', desc: 'Qaysi filial xarajati (FK ➔ stores.id)' },
      { name: 'category', type: 'VARCHAR(100)', desc: 'Xarajat toifasi: RENT, SALARY, UTILITIES, LOGISTICS' },
      { name: 'amount', type: 'DECIMAL(12,2)', desc: 'Xarajat summasi (so‘mda)' },
      { name: 'description', type: 'TEXT', desc: 'Xarajat maqsadi va izoh' },
      { name: 'createdAt', type: 'TIMESTAMP', desc: 'Xarajat qilingan sana' }
    ],
    outgoingRelations: [
      { to: 'stores', targetName: 'stores', fkField: 'storeId ➔ stores.id', cardinality: 'N:1', desc: 'Xarajat tegishli bo‘lgan filial' }
    ],
    incomingRelations: [],
    sampleJoinQuery: `SELECT s.name AS store_name, e.category, SUM(e.amount) AS total_spent
FROM expenses e
JOIN stores s ON s.id = e.storeId
GROUP BY s.id, e.category;`
  }
};

export function ArchitectureAndDbViewer() {
  const [subTab, setSubTab] = useState<'database' | 'architecture'>('database');
  const [activeProcessFlow, setActiveProcessFlow] = useState<'search' | 'merchant-sync' | 'moderation' | 'security'>('search');

  // Database Explorer state
  const [dbData, setDbData] = useState<any>(null);
  const [loadingDb, setLoadingDb] = useState(false);
  const [selectedTableKey, setSelectedTableKey] = useState<string>('stores');
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [selectedRowData, setSelectedRowData] = useState<any | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // ERD Visualizer view controls
  const [erdViewMode, setErdViewMode] = useState<'visual' | 'flow' | 'matrix' | 'sql'>('visual');
  const [selectedErdCategory, setSelectedErdCategory] = useState<'all' | 'core' | 'catalog' | 'customer' | 'finance'>('all');

  const fetchDatabaseState = async () => {
    setLoadingDb(true);
    try {
      const res = await fetch('/api/v1/admin/database/schema-and-tables');
      if (res.ok) {
        const data = await res.json();
        setDbData(data);
      }
    } catch (err) {
      console.error('Error fetching database state:', err);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchDatabaseState();
  }, []);

  const handleCopyJson = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopySql = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // Get records of currently selected table
  const currentTable = dbData?.tables ? dbData.tables[selectedTableKey] : null;
  const currentRecords: any[] = currentTable?.records || [];

  const filteredRecords = currentRecords.filter((rec: any) => {
    if (!tableSearchQuery.trim()) return true;
    const str = JSON.stringify(rec).toLowerCase();
    return str.includes(tableSearchQuery.toLowerCase().trim());
  });

  const selectedErdSchema: TableSchemaInfo = DB_SCHEMA_TABLES[selectedTableKey] || DB_SCHEMA_TABLES.stores;

  // Filtered tables for ERD view
  const visibleTableKeys = Object.keys(DB_SCHEMA_TABLES).filter((key) => {
    if (selectedErdCategory === 'all') return true;
    return DB_SCHEMA_TABLES[key].category === selectedErdCategory;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#14201A] p-5 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#116B50] to-[#22C55E] flex items-center justify-center text-white font-bold">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-[#172C28] dark:text-white">
              Tizim Arxitekturasi & DB Vizualizatori
            </h2>
          </div>
          <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
            YaqinTop platformasining mikro-ilovalar arxitekturasi, jarayonlar xaritasi va jonli ma’lumotlar bazasi
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#F3F6F3] dark:bg-[#1A2822] p-1 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36]">
          <button
            onClick={() => setSubTab('architecture')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              subTab === 'architecture'
                ? 'bg-[#116B50] text-white shadow-sm'
                : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tizim Arxitekturasi & Jarayonlar</span>
          </button>
          <button
            onClick={() => setSubTab('database')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              subTab === 'database'
                ? 'bg-[#116B50] text-white shadow-sm'
                : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Ma’lumotlar Bazasi (Live DB)</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: SYSTEM ARCHITECTURE & PROCESS FLOWS */}
      {subTab === 'architecture' && (
        <div className="flex flex-col gap-6">
          {/* Micro-App Topology Grid */}
          <div className="bg-white dark:bg-[#14201A] p-6 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#172C28] dark:text-white flex items-center gap-2">
                  <Network className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                  Mikro-Ilovalar va Servislar Topologiyasi
                </h3>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
                  YaqinTop 5 ta mustaqil mikro-servis va portlardan tashkil topgan
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80] border border-[#116B50]/30">
                🟢 Barcha Servislar Faol (Live)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* API */}
              <div className="p-4 rounded-xl border-2 border-[#116B50] bg-[#F6FBF7] dark:bg-[#1A2E23] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#116B50] dark:text-[#4ADE80]">Markaziy API</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#116B50] text-white">:4000</span>
                  </div>
                  <h4 className="font-bold text-sm text-[#172C28] dark:text-white mt-1.5">Express & PostGIS</h4>
                  <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Spatial qidiruv, hisob-kitoblar, kassa balansi va audit
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#116B50]/20 text-[10px] text-[#116B50] dark:text-[#4ADE80] font-semibold">
                  REST / JSON API · Sub-30ms
                </div>
              </div>

              {/* Customer */}
              <div className="p-4 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Xaridor Ilovasi</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-600 text-white">:3000</span>
                  </div>
                  <h4 className="font-bold text-sm text-[#172C28] dark:text-white mt-1.5">Customer Web & Map</h4>
                  <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Leaflet radar xarita, radiusli qidiruv, marshrut va katalog
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#DCE5DF] dark:border-[#2A3F36] text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                  React 19 + Leaflet + PWA
                </div>
              </div>

              {/* Merchant */}
              <div className="p-4 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Do‘kon Kabineti</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-600 text-white">:3001</span>
                  </div>
                  <h4 className="font-bold text-sm text-[#172C28] dark:text-white mt-1.5">Merchant Portal</h4>
                  <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Excel yuklash, tovar qoldiqlari, ish vaqti va xabarlar
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#DCE5DF] dark:border-[#2A3F36] text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                  Multi-branch + Excel Sync
                </div>
              </div>

              {/* Admin */}
              <div className="p-4 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Admin Paneli</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-600 text-white">:3002</span>
                  </div>
                  <h4 className="font-bold text-sm text-[#172C28] dark:text-white mt-1.5">Control Center</h4>
                  <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Qidiruv analitikasi, Map Hub, foydalanuvchilar va DB Explorer
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#DCE5DF] dark:border-[#2A3F36] text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                  RBAC + Audit & Activity
                </div>
              </div>

              {/* Landing */}
              <div className="p-4 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Lending Sahifa</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-600 text-white">:3003</span>
                  </div>
                  <h4 className="font-bold text-sm text-[#172C28] dark:text-white mt-1.5">Landing Showcase</h4>
                  <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Ekotizim rollari taqdimoti, jonli API sandbox va FAQ
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#DCE5DF] dark:border-[#2A3F36] text-[10px] text-[#566A63] dark:text-[#8B9E95]">
                  Public Gateway & Presentation
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Process Flow Simulator */}
          <div className="bg-white dark:bg-[#14201A] p-6 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#DCE5DF] dark:border-[#2A3F36]">
              <div>
                <h3 className="text-base font-bold text-[#172C28] dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                  Asosiy Biznes Protseslari va Ma’lumotlar Oqimi
                </h3>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
                  Istalgan jarayonni tanlab, uning bosqichma-bosqich ishlash algoritmini ko‘ring
                </p>
              </div>

              {/* Process Selectors */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'search', label: '1. Spatial Qidiruv Oqimi', icon: Search },
                  { id: 'merchant-sync', label: '2. Excel & Qoldiq Sinxroni', icon: FileSpreadsheet },
                  { id: 'moderation', label: '3. Shikoyat & Moderatsiya', icon: Shield },
                  { id: 'security', label: '4. Xavfsizlik & Rollar', icon: Lock }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeProcessFlow === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveProcessFlow(item.id as any)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#116B50] text-white shadow-sm'
                          : 'bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Render Selected Process Flow Diagram */}
            {activeProcessFlow === 'search' && (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-[#F6FBF7] dark:bg-[#1A2E23] rounded-xl border border-[#116B50]/30">
                  <span className="text-xs font-bold text-[#116B50] dark:text-[#4ADE80] uppercase tracking-wider">
                    Jarayon tavsifi
                  </span>
                  <h4 className="font-extrabold text-base text-[#172C28] dark:text-white mt-0.5">
                    Xaridorning Giper-Lokal Qidiruv va Marshrut Olish Zanjiri
                  </h4>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Foydalanuvchi qidiruv maydoniga so‘rov kiritganda, tizim 50 metrdan 3 km gacha radiusdagi faol do‘konlarni topib, eng yaxshi narxlarni 30 millisoniyadan kam vaqtda qaytaradi.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                  {[
                    {
                      step: '1-Qadam',
                      title: 'Koordinata & Radius',
                      desc: 'Foydalanuvchi GPS joylashuvi (lat, lng) va radiusi (50–3000m) olinadi',
                      tech: 'HTML5 Geolocation / PostGIS',
                      badge: 'Origin Point'
                    },
                    {
                      step: '2-Qadam',
                      title: 'Spatial Doira Filtri',
                      desc: 'Haversine formulasi orqali radius ichidagi faol do‘konlar saralanadi',
                      tech: 'Spatial Haversine 4326',
                      badge: 'Bounding Box'
                    },
                    {
                      step: '3-Qadam',
                      title: 'Fuzzy Matn & Barkod',
                      desc: 'Mahsulot nomi, sinonimlari, toifasi va barkod bo‘yicha moslik aniqlanadi',
                      tech: 'Trigram / Levenshtein Match',
                      badge: 'Score >= 0.3'
                    },
                    {
                      step: '4-Qadam',
                      title: 'Qoldiq & Narx Bahosi',
                      desc: 'Ombor kassa balansi tekshiriladi, eng arzon narx va qoldiq saralanadi',
                      tech: 'Decimal.js Precision',
                      badge: 'stockOnHand > 0'
                    },
                    {
                      step: '5-Qadam',
                      title: 'Xaritada Pin & Marshrut',
                      desc: 'Do‘konlar xaritaga pin qilinadi va 1 bosishda piyoda/mashina marshruti chiziladi',
                      tech: 'Leaflet Layer / Polyline',
                      badge: 'Render < 15ms'
                    }
                  ].map((s, i) => (
                    <div key={i} className="p-4 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#116B50] text-white">
                            {s.step}
                          </span>
                          <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] font-mono">{s.badge}</span>
                        </div>
                        <h5 className="font-bold text-xs text-[#172C28] dark:text-white">{s.title}</h5>
                        <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">{s.desc}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#DCE5DF] dark:border-[#2A3F36] text-[10px] text-[#116B50] dark:text-[#4ADE80] font-mono">
                        {s.tech}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeProcessFlow === 'merchant-sync' && (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-blue-50 dark:bg-[#152332] rounded-xl border border-blue-500/30">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Jarayon tavsifi
                  </span>
                  <h4 className="font-extrabold text-base text-[#172C28] dark:text-white mt-0.5">
                    Do‘kon Tovar Qoldiqlari va Excel Import Sinxronizatsiyasi
                  </h4>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Tadbirkor o‘z do‘koni tovarlarini qo‘lda yoki Excel/1C fayli orqali yuklaganda, ikki yoqlama audit jurnali (double-entry ledger) orqali kassa qoldiqlari xatosiz yangilanadi.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    {
                      step: '1-Bosqich',
                      title: 'Excel / CSV Parsing',
                      desc: 'Shtrix-kod, tovar nomi, narxi, birligi va soni qatorlar bo‘yicha o‘qiladi',
                      tech: 'Sanitization & Zod Validation'
                    },
                    {
                      step: '2-Bosqich',
                      title: 'Variant & Katalog Mosligi',
                      desc: 'Mavjud katalogdan tovar tekshiriladi, yangi tovar bo‘lsa avtomatik yaratiladi',
                      tech: 'Upsert Variant Entity'
                    },
                    {
                      step: '3-Bosqich',
                      title: 'Ledger Audit Akti',
                      desc: 'Qoldiq o‘zgarishi uchun inventarizatsiya hujjati va jurnal yozuvi saqlanadi',
                      tech: 'Stock Document + Ledger Delta'
                    },
                    {
                      step: '4-Bosqich',
                      title: 'Jonli Qidiruv Yangilanishi',
                      desc: 'Xaridorlar qidiruvida yangilangan narx va "10 daqiqa oldin tasdiqlangan" belgisi chiqadi',
                      tech: 'Instant Search Invalidation'
                    }
                  ].map((s, i) => (
                    <div key={i} className="p-4 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white mb-2 inline-block">
                          {s.step}
                        </span>
                        <h5 className="font-bold text-xs text-[#172C28] dark:text-white">{s.title}</h5>
                        <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">{s.desc}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#DCE5DF] dark:border-[#2A3F36] text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                        {s.tech}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeProcessFlow === 'moderation' && (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-amber-50 dark:bg-[#2A2215] rounded-xl border border-amber-500/30">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Jarayon tavsifi
                  </span>
                  <h4 className="font-extrabold text-base text-[#172C28] dark:text-white mt-0.5">
                    Shikoyat, Xato Xabari va Moderatsiya Oqimi
                  </h4>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Xaridor do‘konda noto‘g‘ri narx yoki qoldiq topsa, xabar beradi. Admin xaritada qizil signalni ko‘rib, do‘konga ogohlantirish yuboradi.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    {
                      step: '1-Bosqich: Shikoyat',
                      title: 'Xaridor Xabar Beradi',
                      desc: 'Xaridor ilovasida "Xato haqida xabar" tugmasi bosiladi (noto‘g‘ri narx, yo‘q tovar)',
                      tech: 'POST /api/v1/reports'
                    },
                    {
                      step: '2-Bosqich: Signal',
                      title: 'Admin Xaritasida Qizil Ping',
                      desc: 'Admin xaritasida ushbu do‘kon ustida qizil raqamli indikator yonadi',
                      tech: 'Admin Map Hub Ping'
                    },
                    {
                      step: '3-Bosqich: Murojaat',
                      title: 'Do‘konga Xabar Yuboriladi',
                      desc: 'Admin do‘konga xabar yuboradi, tadbirkor 3001 portalida xatoni to‘g‘rilaydi',
                      tech: 'Inquiry / Notification Flow'
                    },
                    {
                      step: '4-Bosqich: Tasdiq',
                      title: 'Masala Yopiladi',
                      desc: 'Do‘kon narxni to‘g‘rilagach, shikoyat statusi RESOLVED ga o‘tkaziladi',
                      tech: 'PATCH /api/v1/admin/reports/:id'
                    }
                  ].map((s, i) => (
                    <div key={i} className="p-4 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-600 text-white mb-2 inline-block">
                          {s.step}
                        </span>
                        <h5 className="font-bold text-xs text-[#172C28] dark:text-white">{s.title}</h5>
                        <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">{s.desc}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#DCE5DF] dark:border-[#2A3F36] text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                        {s.tech}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeProcessFlow === 'security' && (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-emerald-50 dark:bg-[#172E22] rounded-xl border border-emerald-500/30">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Jarayon tavsifi
                  </span>
                  <h4 className="font-extrabold text-base text-[#172C28] dark:text-white mt-0.5">
                    Xavfsizlik, Sessiyalar va Rollar Ierarxiyasi
                  </h4>
                  <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-1">
                    Platformada 5 pog‘onali RBAC xavfsizlik modeli amal qiladi. Parollar xeshlangan, sessiyalar HttpOnly cookie orqali himoyalangan.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    {
                      role: 'SUPERADMIN',
                      title: 'Tizim Boshqaruvchisi',
                      desc: 'Barcha tashkilotlar, ma’lumotlar bazasi, moderatsiya va APIga to‘liq cheksiz ruxsat',
                      access: 'Barcha portlar & DB'
                    },
                    {
                      role: 'ADMIN',
                      title: 'Moderator Admin',
                      desc: 'Do‘konlar arizalari, xaridorlar shikoyatlari va qidiruv ko‘rsatkichlarini nazorat qiladi',
                      access: 'Admin Panel :3002'
                    },
                    {
                      role: 'MERCHANT_ADMIN',
                      title: 'Tashkilot Rahbari',
                      desc: 'O‘z tashkiloti, barcha filiallari, tovarlar narxlari va xodimlarini boshqaradi',
                      access: 'Merchant Portal :3001'
                    },
                    {
                      role: 'CUSTOMER',
                      title: 'Xaridor / Foydalanuvchi',
                      desc: 'Do‘konlarni qidiradi, tovarlarni ko‘radi, sharh va baho qoldiradi, marshrut oladi',
                      access: 'Customer App :3000'
                    }
                  ].map((s, i) => (
                    <div key={i} className="p-4 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#116B50] text-white mb-2 inline-block">
                          {s.role}
                        </span>
                        <h5 className="font-bold text-xs text-[#172C28] dark:text-white">{s.title}</h5>
                        <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-1">{s.desc}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#DCE5DF] dark:border-[#2A3F36] text-[10px] text-[#116B50] dark:text-[#4ADE80] font-semibold">
                        Ruxsat: {s.access}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LIVE DATABASE EXPLORER & ERD */}
      {subTab === 'database' && (
        <div className="flex flex-col gap-6">
          {/* Main Relational ERD Visualizer Card */}
          <div className="bg-white dark:bg-[#14201A] p-6 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex flex-col gap-5">
            {/* Header & Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#DCE5DF] dark:border-[#2A3F36]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-[#E0EFE7] dark:bg-[#1E362A] text-[#116B50] dark:text-[#4ADE80]">
                    <GitFork className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-[#172C28] dark:text-white">
                      Ma’lumotlar Bazasi Relyatsion Modeli (Entity-Relationship Diagram)
                    </h3>
                    <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                      10 ta asosiy jadval, 12 ta Foreign Key (FK) bog‘lanish va ularning relyatsion strukturasi
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* View Mode Switcher */}
                <div className="flex items-center gap-1 bg-[#F3F6F3] dark:bg-[#1A2822] p-1 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36]">
                  <button
                    onClick={() => setErdViewMode('visual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      erdViewMode === 'visual'
                        ? 'bg-[#116B50] text-white shadow-sm'
                        : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                    }`}
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Vizual ERD Kartalar</span>
                  </button>
                  <button
                    onClick={() => setErdViewMode('flow')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      erdViewMode === 'flow'
                        ? 'bg-[#116B50] text-white shadow-sm'
                        : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Aloqalar Xaritasi (Flow)</span>
                  </button>
                  <button
                    onClick={() => setErdViewMode('matrix')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      erdViewMode === 'matrix'
                        ? 'bg-[#116B50] text-white shadow-sm'
                        : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Relyatsiyalar Matritsasi</span>
                  </button>
                  <button
                    onClick={() => setErdViewMode('sql')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      erdViewMode === 'sql'
                        ? 'bg-[#116B50] text-white shadow-sm'
                        : 'text-[#566A63] dark:text-[#8B9E95] hover:text-[#172C28] dark:hover:text-white'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>SQL DDL Schema</span>
                  </button>
                </div>

                {/* Refresh DB state */}
                <button
                  onClick={fetchDatabaseState}
                  disabled={loadingDb}
                  className="px-3 py-1.5 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] bg-[#F9FAF9] dark:bg-[#1A2822] text-xs font-bold text-[#116B50] dark:text-[#4ADE80] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? 'animate-spin' : ''}`} />
                  <span>Yangilash</span>
                </button>
              </div>
            </div>

            {/* Domain / Cluster Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <span className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95] mr-1 flex items-center gap-1">
                <ListFilter className="w-3.5 h-3.5" /> Klaster:
              </span>
              {[
                { id: 'all', label: 'Barcha Jadvallar (10 ta)' },
                { id: 'core', label: '🏢 Tashkilot & Filiallar' },
                { id: 'catalog', label: '📦 Tovar Katalogi & Narxlar' },
                { id: 'customer', label: '💬 Foydalanuvchilar & Xabarlar' },
                { id: 'finance', label: '💰 Savdo & Kassa' }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedErdCategory(c.id as any)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer ${
                    selectedErdCategory === c.id
                      ? 'bg-[#172C28] text-white dark:bg-[#E8F2EC] dark:text-[#172C28] shadow-sm'
                      : 'bg-[#F9FAF9] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border border-[#DCE5DF] dark:border-[#2A3F36] hover:text-[#172C28] dark:hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* VIEW MODE 1: VISUAL ERD CARDS */}
            {erdViewMode === 'visual' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleTableKeys.map((tableKey) => {
                  const t = DB_SCHEMA_TABLES[tableKey];
                  const isSelected = selectedTableKey === tableKey;
                  const isRelatedToSelected =
                    selectedErdSchema.outgoingRelations.some((r) => r.to === tableKey) ||
                    selectedErdSchema.incomingRelations.some((r) => r.from === tableKey);

                  return (
                    <div
                      key={tableKey}
                      onClick={() => {
                        setSelectedTableKey(tableKey);
                        setTableSearchQuery('');
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? `${t.borderClass} ${t.bgClass} shadow-md ring-2 ring-emerald-500/20 scale-[1.01]`
                          : isRelatedToSelected
                          ? 'border-emerald-400/60 bg-white dark:bg-[#15231D] shadow-sm'
                          : 'border-[#DCE5DF] dark:border-[#2A3F36] bg-white dark:bg-[#16241E] hover:border-[#116B50]/40'
                      }`}
                    >
                      <div>
                        {/* Table Header Strip */}
                        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#DCE5DF]/60 dark:border-[#2A3F36]">
                          <div className="truncate">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${t.badgeBg}`}>
                              {t.categoryTitle}
                            </span>
                            <h4 className="font-extrabold text-sm text-[#172C28] dark:text-white mt-1 truncate">
                              {t.name}
                            </h4>
                            <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] truncate">
                              {t.title}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-bold text-[#116B50] dark:text-[#4ADE80] font-mono px-2 py-0.5 bg-[#E0EFE7] dark:bg-[#1E362A] rounded-lg">
                              PK: {t.pk.split(' ')[0]}
                            </span>
                            {dbData?.tables && dbData.tables[tableKey] && (
                              <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] mt-1 font-semibold">
                                {dbData.tables[tableKey].count} ta yozuv
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Columns List Preview */}
                        <div className="py-2.5 flex flex-col gap-1 text-[11px]">
                          {t.columns.slice(0, 5).map((col, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-[#172C28] dark:text-[#E8F2EC] px-1.5 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5"
                            >
                              <div className="flex items-center gap-1.5 font-mono">
                                {col.isPk && <span className="text-amber-500 font-bold" title="Primary Key">🔑</span>}
                                {col.isFk && <span className="text-blue-500 font-bold" title="Foreign Key">🔗</span>}
                                <span className={col.isPk ? 'font-bold text-amber-700 dark:text-amber-400' : col.isFk ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}>
                                  {col.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] font-mono">
                                {col.type}
                              </span>
                            </div>
                          ))}
                          {t.columns.length > 5 && (
                            <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] italic px-1">
                              + yana {t.columns.length - 5} ta ustun...
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Relations Summary */}
                      <div className="mt-3 pt-2.5 border-t border-[#DCE5DF]/60 dark:border-[#2A3F36] flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-2">
                          {t.outgoingRelations.length > 0 && (
                            <span className="text-blue-600 dark:text-blue-400 font-semibold" title="Tashqi kalitlar">
                              ➔ {t.outgoingRelations.length} FK
                            </span>
                          )}
                          {t.incomingRelations.length > 0 && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold" title="Ushbu jadvalga bog‘langan">
                              ⬅ {t.incomingRelations.length} Relyatsiya
                            </span>
                          )}
                        </div>

                        <span className="text-[#116B50] dark:text-[#4ADE80] font-bold">
                          {isSelected ? '● Tanlangan' : 'Batafsil ko‘rish ➔'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW MODE 2: VISUAL RELATIONSHIP FLOW / MAP */}
            {erdViewMode === 'flow' && (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-[#F9FAF9] dark:bg-[#101A15] rounded-2xl border border-[#DCE5DF] dark:border-[#2A3F36] overflow-x-auto">
                  <div className="min-w-[850px] flex flex-col gap-6 p-2">
                    {/* Row 1: Core Organizations & Stores Flow */}
                    <div className="flex items-center justify-between gap-3">
                      {/* Organizations */}
                      <div
                        onClick={() => setSelectedTableKey('organizations')}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition flex-1 ${
                          selectedTableKey === 'organizations' ? 'border-emerald-500 bg-emerald-50 dark:bg-[#132A1E] shadow-md' : 'border-emerald-400 bg-white dark:bg-[#16241E]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">🏢 Asosiy Baza</span>
                          <span className="text-xs font-mono font-bold text-emerald-600">PK: id</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-[#172C28] dark:text-white mt-1">organizations</h4>
                        <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">name, inn, posType, status</div>
                      </div>

                      <div className="flex flex-col items-center px-2">
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">1 ➔ N</span>
                        <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] font-mono">orgId</span>
                        <ArrowRight className="w-4 h-4 text-emerald-500" />
                      </div>

                      {/* Stores */}
                      <div
                        onClick={() => setSelectedTableKey('stores')}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition flex-1 ${
                          selectedTableKey === 'stores' ? 'border-blue-500 bg-blue-50 dark:bg-[#132238] shadow-md' : 'border-blue-400 bg-white dark:bg-[#16241E]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">🏪 Filiallar</span>
                          <span className="text-xs font-mono font-bold text-blue-600">PK: id | FK: orgId</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-[#172C28] dark:text-white mt-1">stores</h4>
                        <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">name, lat, lng, address, rating</div>
                      </div>

                      <div className="flex flex-col items-center px-2">
                        <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">1 ➔ N</span>
                        <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] font-mono">storeId</span>
                        <ArrowRight className="w-4 h-4 text-amber-500" />
                      </div>

                      {/* Offers */}
                      <div
                        onClick={() => setSelectedTableKey('offers')}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition flex-1 ${
                          selectedTableKey === 'offers' ? 'border-amber-500 bg-amber-50 dark:bg-[#2B1E11] shadow-md' : 'border-amber-400 bg-white dark:bg-[#16241E]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">📦 Narx & Qoldiq</span>
                          <span className="text-xs font-mono font-bold text-amber-600">Bridge (N:M)</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-[#172C28] dark:text-white mt-1">offers</h4>
                        <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">price, stock, isAvailable</div>
                      </div>

                      <div className="flex flex-col items-center px-2">
                        <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">N ➔ 1</span>
                        <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] font-mono">variantId</span>
                        <ArrowRight className="w-4 h-4 text-purple-500" />
                      </div>

                      {/* Variants */}
                      <div
                        onClick={() => setSelectedTableKey('variants')}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition flex-1 ${
                          selectedTableKey === 'variants' ? 'border-purple-500 bg-purple-50 dark:bg-[#201533] shadow-md' : 'border-purple-400 bg-white dark:bg-[#16241E]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">🏷️ Tovar Katalogi</span>
                          <span className="text-xs font-mono font-bold text-purple-600">PK: id</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-[#172C28] dark:text-white mt-1">variants</h4>
                        <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">title, barcode, category, brand</div>
                      </div>
                    </div>

                    {/* Row 2: Users & Interaction Flow */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#DCE5DF] dark:border-[#2A3F36]">
                      {/* Users */}
                      <div
                        onClick={() => setSelectedTableKey('users')}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition flex-1 ${
                          selectedTableKey === 'users' ? 'border-indigo-500 bg-indigo-50 dark:bg-[#181838] shadow-md' : 'border-indigo-400 bg-white dark:bg-[#16241E]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">👤 Foydalanuvchilar</span>
                          <span className="text-xs font-mono font-bold text-indigo-600">PK: id</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-[#172C28] dark:text-white mt-1">users</h4>
                        <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">phone, fullName, role, orgId</div>
                      </div>

                      <div className="flex flex-col items-center px-2">
                        <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">1 ➔ N</span>
                        <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] font-mono">userId</span>
                        <ArrowRight className="w-4 h-4 text-rose-500" />
                      </div>

                      {/* Reviews */}
                      <div
                        onClick={() => setSelectedTableKey('reviews')}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition flex-1 ${
                          selectedTableKey === 'reviews' ? 'border-rose-500 bg-rose-50 dark:bg-[#2B141C] shadow-md' : 'border-rose-400 bg-white dark:bg-[#16241E]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">⭐ Sharh & Baho</span>
                          <span className="text-xs font-mono font-bold text-rose-600">FK: storeId, userId</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-[#172C28] dark:text-white mt-1">reviews</h4>
                        <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">rating (1..5), comment</div>
                      </div>

                      <div className="flex flex-col items-center px-2">
                        <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400">1 ➔ N</span>
                        <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] font-mono">userId</span>
                        <ArrowRight className="w-4 h-4 text-sky-500" />
                      </div>

                      {/* Inquiries */}
                      <div
                        onClick={() => setSelectedTableKey('inquiries')}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition flex-1 ${
                          selectedTableKey === 'inquiries' ? 'border-sky-500 bg-sky-50 dark:bg-[#102436] shadow-md' : 'border-sky-400 bg-white dark:bg-[#16241E]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">💬 Murojaatlar</span>
                          <span className="text-xs font-mono font-bold text-sky-600">FK: userId, targetOrgId</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-[#172C28] dark:text-white mt-1">inquiries</h4>
                        <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">subject, status, replies</div>
                      </div>

                      <div className="flex flex-col items-center px-2">
                        <span className="text-xs font-extrabold text-red-600 dark:text-red-400">1 ➔ N</span>
                        <span className="text-[10px] text-[#566A63] dark:text-[#8B9E95] font-mono">storeId</span>
                        <ArrowRight className="w-4 h-4 text-red-500" />
                      </div>

                      {/* Reports */}
                      <div
                        onClick={() => setSelectedTableKey('reports')}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition flex-1 ${
                          selectedTableKey === 'reports' ? 'border-red-500 bg-red-50 dark:bg-[#2A1313] shadow-md' : 'border-red-400 bg-white dark:bg-[#16241E]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">🚨 Moderatsiya</span>
                          <span className="text-xs font-mono font-bold text-red-600">FK: storeId, userId</span>
                        </div>
                        <h4 className="font-extrabold text-sm text-[#172C28] dark:text-white mt-1">reports</h4>
                        <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">type, status, details</div>
                      </div>
                    </div>

                    {/* Row 3: Finance and Operations */}
                    <div className="flex items-center justify-start gap-4 pt-3 border-t border-[#DCE5DF] dark:border-[#2A3F36]">
                      <span className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95] shrink-0">
                        💰 Moliya & Kassa Filial Aloqalari:
                      </span>

                      <div
                        onClick={() => setSelectedTableKey('sales_receipts')}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          selectedTableKey === 'sales_receipts' ? 'border-teal-500 bg-teal-50 dark:bg-[#112926]' : 'border-teal-300 bg-white dark:bg-[#16241E]'
                        }`}
                      >
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                          sales_receipts ➔ (FK: storeId ➔ stores.id)
                        </span>
                      </div>

                      <div
                        onClick={() => setSelectedTableKey('expenses')}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          selectedTableKey === 'expenses' ? 'border-orange-500 bg-orange-50 dark:bg-[#2C1910]' : 'border-orange-300 bg-white dark:bg-[#16241E]'
                        }`}
                      >
                        <span className="text-xs font-bold text-orange-700 dark:text-orange-400">
                          expenses ➔ (FK: storeId ➔ stores.id)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW MODE 3: RELATIONSHIPS MATRIX */}
            {erdViewMode === 'matrix' && (
              <div className="overflow-x-auto border border-[#DCE5DF] dark:border-[#2A3F36] rounded-2xl">
                <table className="w-full text-left text-xs text-[#172C28] dark:text-[#E8F2EC]">
                  <thead className="bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Asosiy Jadval (Source)</th>
                      <th className="p-3.5">Bog‘lanish (Relation)</th>
                      <th className="p-3.5">Maqsad Jadval (Target)</th>
                      <th className="p-3.5">Tashqi Kalit (Foreign Key)</th>
                      <th className="p-3.5">Kaskad Holati</th>
                      <th className="p-3.5">Biznes Maqsadi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE5DF]/60 dark:divide-[#2A3F36]">
                    {[
                      { src: 'stores', rel: 'N ➔ 1', tgt: 'organizations', fk: 'stores.orgId ➔ organizations.id', cascade: 'ON DELETE CASCADE', purpose: 'Filiallarning bosh korxonaga tegishliligi' },
                      { src: 'offers', rel: 'N ➔ 1', tgt: 'stores', fk: 'offers.storeId ➔ stores.id', cascade: 'ON DELETE CASCADE', purpose: 'Tovarlar narxi va qoldig‘i aynan qaysi do‘konda mavjudligi' },
                      { src: 'offers', rel: 'N ➔ 1', tgt: 'variants', fk: 'offers.variantId ➔ variants.id', cascade: 'ON DELETE RESTRICT', purpose: 'Katalogdagi standart mahsulot identifikatsiyasi' },
                      { src: 'users', rel: 'N ➔ 1', tgt: 'organizations', fk: 'users.orgId ➔ organizations.id', cascade: 'ON DELETE SET NULL', purpose: 'Sotuvchi va boshqaruvchilarning korxonaga birikishi' },
                      { src: 'inquiries', rel: 'N ➔ 1', tgt: 'users', fk: 'inquiries.userId ➔ users.id', cascade: 'ON DELETE CASCADE', purpose: 'Murojaat yuborgan foydalanuvchi ma’lumotlari' },
                      { src: 'inquiries', rel: 'N ➔ 1', tgt: 'organizations', fk: 'inquiries.targetOrgId ➔ organizations.id', cascade: 'ON DELETE SET NULL', purpose: 'Murojaat qabul qiluvchi tashkilot' },
                      { src: 'reviews', rel: 'N ➔ 1', tgt: 'stores', fk: 'reviews.storeId ➔ stores.id', cascade: 'ON DELETE CASCADE', purpose: 'Do‘konga qoldirilgan baholar va reyting' },
                      { src: 'reviews', rel: 'N ➔ 1', tgt: 'users', fk: 'reviews.userId ➔ users.id', cascade: 'ON DELETE CASCADE', purpose: 'Sharh yozgan muallif profili' },
                      { src: 'reports', rel: 'N ➔ 1', tgt: 'stores', fk: 'reports.storeId ➔ stores.id', cascade: 'ON DELETE CASCADE', purpose: 'Do‘kon ustidan yuborilgan moderatsiya shikoyati' },
                      { src: 'reports', rel: 'N ➔ 1', tgt: 'users', fk: 'reports.userId ➔ users.id', cascade: 'ON DELETE SET NULL', purpose: 'Shikoyat qilgan xaridor kontaktlari' },
                      { src: 'sales_receipts', rel: 'N ➔ 1', tgt: 'stores', fk: 'sales_receipts.storeId ➔ stores.id', cascade: 'ON DELETE CASCADE', purpose: 'Filial kassa savdosi va tushumlar hisoboti' },
                      { src: 'expenses', rel: 'N ➔ 1', tgt: 'stores', fk: 'expenses.storeId ➔ stores.id', cascade: 'ON DELETE CASCADE', purpose: 'Filial operatsion va kommunal xarajatlari' }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-[#F9FAF9] dark:hover:bg-[#1A2822]/60">
                        <td className="p-3.5 font-bold font-mono text-[#116B50] dark:text-[#4ADE80]">{row.src}</td>
                        <td className="p-3.5 font-extrabold text-xs">{row.rel}</td>
                        <td className="p-3.5 font-bold font-mono text-blue-600 dark:text-blue-400">{row.tgt}</td>
                        <td className="p-3.5 font-mono text-[11px] text-[#566A63] dark:text-[#8B9E95]">{row.fk}</td>
                        <td className="p-3.5 font-mono text-[10px] text-amber-600 dark:text-amber-400 font-semibold">{row.cascade}</td>
                        <td className="p-3.5 text-xs text-[#566A63] dark:text-[#8B9E95]">{row.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIEW MODE 4: SQL DDL SCHEMA */}
            {erdViewMode === 'sql' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#566A63] dark:text-[#8B9E95] flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                    PostgreSQL DDL & Foreign Key Relyatsiyalar Skripti
                  </span>
                  <button
                    onClick={() => handleCopySql(`-- YaqinTop Relational Database Schema (PostgreSQL)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    inn VARCHAR(20) UNIQUE NOT NULL,
    pos_type VARCHAR(50) DEFAULT 'CUSTOM',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    phone VARCHAR(50),
    rating FLOAT DEFAULT 5.0,
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stores_location ON stores(latitude, longitude);

CREATE TABLE variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100),
    brand VARCHAR(100),
    unit VARCHAR(20) DEFAULT 'dona',
    image_url TEXT
);

CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
    price DECIMAL(12, 2) NOT NULL,
    stock INT DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_store_variant UNIQUE(store_id, variant_id)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(150),
    role VARCHAR(50) DEFAULT 'CUSTOMER',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    recipient_type VARCHAR(20) DEFAULT 'ADMIN',
    replies JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN',
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`)}
                    className="px-3 py-1.5 rounded-lg border border-[#DCE5DF] dark:border-[#2A3F36] bg-[#F9FAF9] dark:bg-[#1A2822] text-xs font-bold text-[#116B50] dark:text-[#4ADE80] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Nusxalandi!' : 'SQL Schema Nusxalash'}</span>
                  </button>
                </div>

                <div className="bg-[#0B1310] text-[#A7F3D0] p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-[380px] scrollbar-thin border border-[#116B50]/30">
                  <pre className="leading-relaxed">
{`-- YaqinTop Relational Database Schema (PostgreSQL)

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    inn VARCHAR(20) UNIQUE NOT NULL,
    pos_type VARCHAR(50) DEFAULT 'CUSTOM',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    phone VARCHAR(50),
    rating FLOAT DEFAULT 5.0,
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_stores_location ON stores(latitude, longitude);

CREATE TABLE variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100),
    brand VARCHAR(100),
    unit VARCHAR(20) DEFAULT 'dona'
);

CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE RESTRICT,
    price DECIMAL(12, 2) NOT NULL,
    stock INT DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_store_variant UNIQUE(store_id, variant_id)
);`}
                  </pre>
                </div>
              </div>
            )}

            {/* Selected Table Deep-Dive Inspector Panel */}
            <div className="mt-2 p-5 bg-[#F9FAF9] dark:bg-[#101A15] rounded-2xl border-2 border-[#116B50]/30 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#DCE5DF] dark:border-[#2A3F36]">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3.5 h-3.5 rounded-full`} style={{ backgroundColor: selectedErdSchema.color }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-[#172C28] dark:text-white font-mono">
                        {selectedErdSchema.name}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedErdSchema.badgeBg}`}>
                        {selectedErdSchema.categoryTitle}
                      </span>
                    </div>
                    <p className="text-xs text-[#566A63] dark:text-[#8B9E95] mt-0.5">
                      {selectedErdSchema.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const el = document.getElementById('live-table-explorer-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#116B50] hover:bg-[#0d533e] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Jonli Jadval Yozuvlarini Ko‘rish</span>
                  </button>
                </div>
              </div>

              {/* Columns & Relations Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Columns & Data Types */}
                <div className="bg-white dark:bg-[#16241E] p-4 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col gap-2">
                  <h5 className="text-xs font-bold text-[#172C28] dark:text-white flex items-center gap-1.5 pb-2 border-b border-[#DCE5DF]/60 dark:border-[#2A3F36]">
                    <Columns className="w-3.5 h-3.5 text-[#116B50] dark:text-[#4ADE80]" />
                    Jadval Ustunlari & Ma’lumot Turlari ({selectedErdSchema.columns.length} ta)
                  </h5>

                  <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                    {selectedErdSchema.columns.map((c, i) => (
                      <div key={i} className="p-2 rounded-lg bg-[#F9FAF9] dark:bg-[#1A2822] flex items-start justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            {c.isPk && <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">PK</span>}
                            {c.isFk && <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">FK</span>}
                            <span className="font-bold font-mono text-[#172C28] dark:text-white">{c.name}</span>
                          </div>
                          <p className="text-[11px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">{c.desc}</p>
                        </div>
                        <span className="text-[11px] font-mono text-[#116B50] dark:text-[#4ADE80] shrink-0 font-semibold">
                          {c.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Relational Links & SQL Join Preview */}
                <div className="flex flex-col gap-4">
                  {/* Outgoing & Incoming FKs */}
                  <div className="bg-white dark:bg-[#16241E] p-4 rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] flex flex-col gap-2">
                    <h5 className="text-xs font-bold text-[#172C28] dark:text-white flex items-center gap-1.5 pb-2 border-b border-[#DCE5DF]/60 dark:border-[#2A3F36]">
                      <Link className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Bog‘langan Relyatsiyalar (Foreign Key Links)
                    </h5>

                    {/* Outgoing */}
                    {selectedErdSchema.outgoingRelations.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                          ➔ Ushbu jadval havola qiluvchi jadvallar (Outgoing FK):
                        </span>
                        {selectedErdSchema.outgoingRelations.map((out, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedTableKey(out.to)}
                            className="p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between text-xs cursor-pointer hover:bg-blue-100/70 transition"
                          >
                            <div>
                              <span className="font-bold font-mono text-blue-700 dark:text-blue-400">{out.targetName}</span>
                              <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] ml-2 font-mono">({out.fkField})</span>
                              <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">{out.desc}</div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white shrink-0">
                              {out.cardinality}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Incoming */}
                    {selectedErdSchema.incomingRelations.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                          ⬅ Ushbu jadvalga bog‘langan boshqa jadvallar (Incoming):
                        </span>
                        {selectedErdSchema.incomingRelations.map((inc, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedTableKey(inc.from)}
                            className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs cursor-pointer hover:bg-emerald-100/70 transition"
                          >
                            <div>
                              <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400">{inc.sourceName}</span>
                              <span className="text-[11px] text-[#566A63] dark:text-[#8B9E95] ml-2 font-mono">({inc.fkField})</span>
                              <div className="text-[10px] text-[#566A63] dark:text-[#8B9E95] mt-0.5">{inc.desc}</div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                              {inc.cardinality}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dynamic SQL Join Sample */}
                  <div className="bg-[#0B1310] text-[#A7F3D0] p-3.5 rounded-xl border border-[#116B50]/30 font-mono text-xs flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between text-[11px] text-[#34D399]">
                      <span className="flex items-center gap-1">
                        <Code2 className="w-3 h-3" /> SQL JOIN So‘rovi namunasi:
                      </span>
                      <button
                        onClick={() => handleCopySql(selectedErdSchema.sampleJoinQuery)}
                        className="text-[10px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedSql ? 'Nusxalandi!' : 'Nusxalash'}
                      </button>
                    </div>
                    <pre className="text-[11px] overflow-x-auto leading-relaxed scrollbar-thin">
                      {selectedErdSchema.sampleJoinQuery}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Database Tables Explorer & Live Data Grid */}
          <div
            id="live-table-explorer-section"
            className="bg-white dark:bg-[#14201A] p-6 rounded-2xl border border-[#DCE5DF] dark:border-[#22332C] shadow-sm flex flex-col gap-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCE5DF] dark:border-[#2A3F36]">
              <div>
                <h3 className="text-base font-bold text-[#172C28] dark:text-white flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-[#116B50] dark:text-[#4ADE80]" />
                  Jonli Jadvallar Ko‘ruvchisi (Live Table Explorer)
                </h3>
                <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
                  Xotiradagi faol ma’lumotlar bazasining barcha jadvallari va yozuvlari
                </p>
              </div>

              {/* Search Inside Selected Table */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#566A63] dark:text-[#8B9E95]" />
                <input
                  type="text"
                  value={tableSearchQuery}
                  onChange={(e) => setTableSearchQuery(e.target.value)}
                  placeholder="Jadval ichidan izlash..."
                  className="w-full h-9 pl-8 pr-3 bg-[#F3F6F3] dark:bg-[#1A2822] border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl text-xs text-[#172C28] dark:text-[#E8F2EC]"
                />
              </div>
            </div>

            {/* Table Selector Pills */}
            {dbData?.tables && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {Object.keys(dbData.tables).map((key) => {
                  const t = dbData.tables[key];
                  const isSelected = selectedTableKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedTableKey(key);
                        setTableSearchQuery('');
                      }}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#116B50] text-white shadow-sm'
                          : 'bg-[#F9FAF9] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] border border-[#DCE5DF] dark:border-[#2A3F36] hover:bg-[#E0EFE7] dark:hover:bg-[#1E362A]'
                      }`}
                    >
                      <span>{t.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#DCE5DF] dark:bg-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC]'
                      }`}>
                        {t.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected Table Metadata Card */}
            {currentTable && (
              <div className="p-3 bg-[#F9FAF9] dark:bg-[#1A2822] rounded-xl border border-[#DCE5DF] dark:border-[#2A3F36] flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-[#172C28] dark:text-white">{currentTable.displayName}</span>
                  <span className="text-[#566A63] dark:text-[#8B9E95] ml-2">— {currentTable.description}</span>
                </div>
                <span className="font-bold text-[#116B50] dark:text-[#4ADE80]">
                  {filteredRecords.length} / {currentTable.count} ta qator
                </span>
              </div>
            )}

            {/* Live Data Records Table */}
            <div className="border border-[#DCE5DF] dark:border-[#2A3F36] rounded-xl overflow-hidden bg-white dark:bg-[#16241E]">
              <div className="overflow-x-auto max-h-[480px]">
                {filteredRecords.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#566A63] dark:text-[#8B9E95]">
                    Ma’lumot topilmadi
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F3F6F3] dark:bg-[#1A2822] text-[#566A63] dark:text-[#8B9E95] uppercase text-[10px] font-bold sticky top-0 z-10 border-b border-[#DCE5DF] dark:border-[#2A3F36]">
                      <tr>
                        <th className="p-3">#</th>
                        {Object.keys(filteredRecords[0] || {})
                          .slice(0, 6)
                          .map((col) => (
                            <th key={col} className="p-3">
                              {col}
                            </th>
                          ))}
                        <th className="p-3 text-right">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE5DF]/60 dark:divide-[#2A3F36] text-[#172C28] dark:text-[#E8F2EC]">
                      {filteredRecords.map((row: any, i: number) => (
                        <tr
                          key={i}
                          onClick={() => setSelectedRowData(row)}
                          className="hover:bg-[#F9FAF9] dark:hover:bg-[#1C2C24] transition cursor-pointer"
                        >
                          <td className="p-3 text-[11px] text-[#566A63] dark:text-[#8B9E95] font-mono">{i + 1}</td>
                          {Object.keys(row)
                            .slice(0, 6)
                            .map((col) => {
                              const val = row[col];
                              let displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
                              if (displayVal.length > 40) displayVal = displayVal.slice(0, 40) + '...';
                              return (
                                <td key={col} className="p-3 text-xs font-mono">
                                  {col === 'status' ? (
                                    <Tag variant={val === 'ACTIVE' || val === 'RESOLVED' || val === 'PUBLISHED' ? 'default' : 'warn'}>
                                      {String(val)}
                                    </Tag>
                                  ) : (
                                    <span>{displayVal}</span>
                                  )}
                                </td>
                              );
                            })}
                          <td className="p-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRowData(row);
                              }}
                              className="px-2.5 py-1 rounded-md bg-[#116B50] text-white text-[11px] font-bold hover:bg-[#0d533e] transition"
                            >
                              JSON 🔍
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JSON Row Inspector Modal */}
      {selectedRowData && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRowData(null)}
          title={`Qator Tafsilotlari (${selectedTableKey})`}
          footer={
            <div className="flex justify-between items-center w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCopyJson(selectedRowData)}
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-500 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                <span>{copiedJson ? 'Nusxalandi!' : 'JSON Nusxalash'}</span>
              </Button>
              <Button variant="primary" size="sm" onClick={() => setSelectedRowData(null)}>
                Yopish
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            <p className="text-xs text-[#566A63] dark:text-[#8B9E95]">
              Ushbu yozuvning to‘liq JSON ko‘rinishi va rekvizitlari:
            </p>
            <pre className="p-4 bg-[#0E1713] text-[#4ADE80] font-mono text-xs rounded-xl overflow-x-auto max-h-[380px] border border-[#2A3F36] scrollbar-thin">
              {JSON.stringify(selectedRowData, null, 2)}
            </pre>
          </div>
        </Modal>
      )}
    </div>
  );
}
