import { v4 as uuidv4 } from 'uuid';
import crypto from 'node:crypto';

export function stableOfferId(storeId: string, variantId: string): string {
  const hash = crypto.createHash('sha256').update('offer:' + storeId + ':' + variantId).digest('hex');
  return hash.slice(0, 8) + '-' + hash.slice(8, 12) + '-4' + hash.slice(13, 16) + '-a' + hash.slice(17, 20) + '-' + hash.slice(20, 32);
}
import Decimal from 'decimal.js';
import { db } from './in-memory-db.js';
import { Store, Variant, Offer, User } from '@yaqintop/contracts';
import { hashOwnerPassword } from '../services/owner-onboarding.service.js';

import { SEED_IDS } from './seed-ids.js';
export { SEED_IDS };

export async function seedDatabase() {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo data is disabled in production');
  console.log('Seeding YaqinTop database with synthetic Pilot Centre data...');

  const defaultHashedPassword = hashOwnerPassword('DemoPass123!');

  // 1. Users
  const users: (User & { passwordHash: string })[] = [
    {
      id: SEED_IDS.customerUserId,
      email: 'customer@yaqintop.uz',
      fullName: 'Otabek Xaridor',
      phone: '+998901112233',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      passwordHash: defaultHashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.ownerUserId,
      email: 'owner@navbahor.uz',
      fullName: 'Oybek Tursunov',
      phone: '+998902223344',
      role: 'OWNER',
      status: 'ACTIVE',
      passwordHash: defaultHashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.operatorUserId,
      email: 'operator@navbahor.uz',
      fullName: 'Sardor Qosim',
      phone: '+998903334455',
      role: 'OPERATOR',
      status: 'ACTIVE',
      passwordHash: defaultHashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.moderatorUserId,
      email: 'moderator@yaqintop.uz',
      fullName: 'Nilufar Moderator',
      phone: '+998904445566',
      role: 'MODERATOR',
      status: 'ACTIVE',
      passwordHash: defaultHashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.dealerUserId,
      email: 'diller@yaqintop.uz',
      fullName: 'Akmal Rustamov (Distribyutor)',
      phone: '+998901234567',
      role: 'DEALER',
      status: 'ACTIVE',
      passwordHash: defaultHashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.adminUserId,
      email: 'admin@yaqintop.uz',
      fullName: 'Boshqaruvchi Admin',
      phone: '+998905556677',
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      passwordHash: defaultHashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  for (const u of users) {
    db.users.set(u.id, u);
  }

  // 2. Organizations
  db.organizations.set(SEED_IDS.navbahorOrgId, {
    id: SEED_IDS.navbahorOrgId,
    name: 'Navbahor Savdo MCHJ',
    inn: '308123456',
    region: 'Toshkent shahri',
    city: 'Yunusobod',
    district: 'Navbahor MFY',
    type: 'MIXED',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  const mahallaOrgId = uuidv4();
  db.organizations.set(mahallaOrgId, {
    id: mahallaOrgId,
    name: 'Mahalla Savdo XK',
    inn: '307654321',
    region: 'Toshkent shahri',
    city: 'Mirobod',
    district: 'Oqtepa MFY',
    type: 'RETAIL',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  const barakaOrgId = uuidv4();
  db.organizations.set(barakaOrgId, {
    id: barakaOrgId,
    name: 'Baraka Minimarket XK',
    inn: '306987654',
    region: 'Toshkent shahri',
    city: 'Chilonzor',
    district: 'Do‘stlik MFY',
    type: 'RETAIL',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  const chorsuOrgId = uuidv4();
  db.organizations.set(chorsuOrgId, {
    id: chorsuOrgId,
    name: 'Chorsu Ulgurji Baza MCHJ',
    inn: '305112233',
    region: 'Toshkent shahri',
    city: 'Shayxontohur',
    district: 'Chorsu MFY',
    type: 'WHOLESALE',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  const suspendedOrgId = uuidv4();
  db.organizations.set(suspendedOrgId, {
    id: suspendedOrgId,
    name: 'To‘xtatilgan Savdo MCHJ',
    inn: '304998877',
    region: 'Samarqand viloyati',
    city: 'Samarqand shahri',
    district: 'Guliston MFY',
    type: 'RETAIL',
    status: 'SUSPENDED',
    createdAt: new Date().toISOString()
  });

  // Sirdaryo / Guliston Organizations
  db.organizations.set(SEED_IDS.sirdaryoPharmOrgId, {
    id: SEED_IDS.sirdaryoPharmOrgId,
    name: '999 Shifo Farm MCHJ',
    inn: '309999111',
    region: 'Sirdaryo viloyati',
    city: 'Guliston shahri',
    district: 'Sayhun MFY',
    type: 'PHARMACY',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  db.organizations.set(SEED_IDS.grandPharmOrgId, {
    id: SEED_IDS.grandPharmOrgId,
    name: 'Grand Shifo Apteka XK',
    inn: '309999222',
    region: 'Sirdaryo viloyati',
    city: 'Guliston shahri',
    district: 'Bog‘ishamol MFY',
    type: 'PHARMACY',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  db.organizations.set(SEED_IDS.arzonPharmOrgId, {
    id: SEED_IDS.arzonPharmOrgId,
    name: 'Arzon Dori Savdo MCHJ',
    inn: '309999333',
    region: 'Sirdaryo viloyati',
    city: 'Guliston shahri',
    district: 'Temiryo‘l MFY',
    type: 'PHARMACY',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  db.organizations.set(SEED_IDS.gulistonMarketOrgId, {
    id: SEED_IDS.gulistonMarketOrgId,
    name: 'Guliston Savdo MCHJ',
    inn: '309999444',
    region: 'Sirdaryo viloyati',
    city: 'Guliston shahri',
    district: 'Taraqqiyot MFY',
    type: 'RETAIL',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  });

  // Memberships
  db.memberships.set(uuidv4(), {
    id: uuidv4(),
    organizationId: SEED_IDS.navbahorOrgId,
    userId: SEED_IDS.ownerUserId,
    role: 'OWNER',
    status: 'ACTIVE'
  });
  db.memberships.set(uuidv4(), {
    id: uuidv4(),
    organizationId: SEED_IDS.navbahorOrgId,
    userId: SEED_IDS.operatorUserId,
    role: 'OPERATOR',
    status: 'ACTIVE'
  });

  // 3. Variants
  const variants: (Variant & { aliases?: string[] })[] = [
    {
      id: SEED_IDS.snickers50gVariantId,
      productId: uuidv4(),
      title: 'Snickers 50 g',
      brand: 'Snickers',
      category: 'Shokolad',
      packSize: '50 g',
      packUnit: 'dona',
      barcode: '40111001',
      sku: 'SNK-050',
      photoUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=120&auto=format&fit=crop&q=80',
      aliases: ['snikers', 'snickers', 'сникерс', 'snikers 50g', 'shokolad bar']
    },
    {
      id: SEED_IDS.snickers80gVariantId,
      productId: uuidv4(),
      title: 'Snickers 80 g Super',
      brand: 'Snickers',
      category: 'Shokolad',
      packSize: '80 g',
      packUnit: 'dona',
      barcode: '40111002',
      sku: 'SNK-080',
      photoUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=120&auto=format&fit=crop&q=80',
      aliases: ['snikers super', 'snickers 80', 'сникерс супер', 'snikers 80g']
    },
    {
      id: SEED_IDS.mars50gVariantId,
      productId: uuidv4(),
      title: 'Mars 50 g',
      brand: 'Mars',
      category: 'Shokolad',
      packSize: '50 g',
      packUnit: 'dona',
      barcode: '40111003',
      sku: 'MRS-050',
      photoUrl: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=120&auto=format&fit=crop&q=80',
      aliases: ['mars', 'марс', 'mars 50g']
    },
    {
      id: SEED_IDS.twix50gVariantId,
      productId: uuidv4(),
      title: 'Twix 50 g',
      brand: 'Twix',
      category: 'Shokolad',
      packSize: '50 g',
      packUnit: 'dona',
      barcode: '40111004',
      sku: 'TWX-050',
      photoUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=120&auto=format&fit=crop&q=80',
      aliases: ['twix', 'tviks', 'твикс', 'twix 50g']
    },
    {
      id: SEED_IDS.bounty57gVariantId,
      productId: uuidv4(),
      title: 'Bounty 57 g',
      brand: 'Bounty',
      category: 'Shokolad',
      packSize: '57 g',
      packUnit: 'dona',
      barcode: '40111005',
      sku: 'BNT-057',
      photoUrl: 'https://images.unsplash.com/photo-1548848221-0c2e497ed557?w=120&auto=format&fit=crop&q=80',
      aliases: ['bounty', 'baunti', 'баунти', 'kokos shokolad']
    },
    {
      id: SEED_IDS.cola15lVariantId,
      productId: uuidv4(),
      title: 'Coca-Cola 1.5 l',
      brand: 'Coca-Cola',
      category: 'Ichimliklar',
      packSize: '1.5 l',
      packUnit: 'dona',
      barcode: '54490001',
      sku: 'COLA-150',
      photoUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=120&auto=format&fit=crop&q=80',
      aliases: ['cola', 'kola', 'coca cola', 'кока кола']
    },
    {
      id: SEED_IDS.nesquik200gVariantId,
      productId: uuidv4(),
      title: 'Nesquik 200 g (quti)',
      brand: 'Nestle',
      category: 'Shokolad',
      packSize: '200 g',
      packUnit: 'quti',
      barcode: '7613035',
      sku: 'NSQ-200',
      photoUrl: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=120&auto=format&fit=crop&q=80',
      aliases: ['nesquik', 'neskvik', 'kakao', 'несквик']
    },
    {
      id: SEED_IDS.nonVariantId,
      productId: uuidv4(),
      title: 'Tandir non (Issiq patir)',
      brand: 'Nonvoyxona',
      category: 'Non mahsulotlari',
      packSize: '1 dona',
      packUnit: 'dona',
      barcode: '47800011',
      sku: 'NON-001',
      photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=80',
      aliases: ['non', 'tandir non', 'patir', 'nonvoy', 'хлеб', 'лепешка']
    },
    {
      id: SEED_IDS.sutVariantId,
      productId: uuidv4(),
      title: 'Musaffo Sut 3.2% 1 L',
      brand: 'Musaffo',
      category: 'Sut mahsulotlari',
      packSize: '1 l',
      packUnit: 'dona',
      barcode: '47800012',
      sku: 'SUT-001',
      photoUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=120&auto=format&fit=crop&q=80',
      aliases: ['sut', 'musaffo', 'молоко', 'sut 3.2']
    },
    {
      id: SEED_IDS.yogVariantId,
      productId: uuidv4(),
      title: 'Oila Tanlovi Pista yog‘i 1 L',
      brand: 'Oila Tanlovi',
      category: 'Oziq-ovqat',
      packSize: '1 l',
      packUnit: 'dona',
      barcode: '47800013',
      sku: 'YOG-001',
      photoUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=120&auto=format&fit=crop&q=80',
      aliases: ['yog', 'yog‘', 'pista yogi', 'oila tanlovi', 'масло']
    },
    {
      id: SEED_IDS.shakarVariantId,
      productId: uuidv4(),
      title: 'Shakar 1 kg',
      brand: 'Xorazm Shakar',
      category: 'Oziq-ovqat',
      packSize: '1 kg',
      packUnit: 'kg',
      barcode: '47800014',
      sku: 'SHK-001',
      photoUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=120&auto=format&fit=crop&q=80',
      aliases: ['shakar', 'shakar 1kg', 'saxar', 'сахар']
    },
    {
      id: SEED_IDS.choyVariantId,
      productId: uuidv4(),
      title: 'Ahmad Tea Qora choy 100 g',
      brand: 'Ahmad Tea',
      category: 'Choy va Kofe',
      packSize: '100 g',
      packUnit: 'quti',
      barcode: '47800015',
      sku: 'CHY-001',
      photoUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=120&auto=format&fit=crop&q=80',
      aliases: ['choy', 'qora choy', 'ahmad tea', 'чай']
    },
    {
      id: SEED_IDS.tuxumVariantId,
      productId: uuidv4(),
      title: 'Tuxum S1 10 dona',
      brand: 'Parranda Fayz',
      category: 'Oziq-ovqat',
      packSize: '10 dona',
      packUnit: 'qadoq',
      barcode: '47800016',
      sku: 'TXM-010',
      photoUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=120&auto=format&fit=crop&q=80',
      aliases: ['tuxum', 'tuxum 10 dona', 'яйца', 'parranda']
    },
    {
      id: SEED_IDS.unVariantId,
      productId: uuidv4(),
      title: "Oliy navli bug'doy uni (Oltin Don, 1 kg)",
      brand: 'Oltin Don',
      category: 'Oziq-ovqat',
      packSize: '1 kg',
      packUnit: 'kg',
      barcode: '47800017',
      sku: 'UN-001',
      photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=80',
      aliases: ['un', "bug'doy uni", 'un 1kg', 'oliy nav un', 'мука']
    },
    {
      id: SEED_IDS.unMakfaVariantId,
      productId: uuidv4(),
      title: "Makfa oliy navli bug'doy uni (2 kg)",
      brand: 'Makfa',
      category: 'Oziq-ovqat',
      packSize: '2 kg',
      packUnit: 'qadoq',
      barcode: '47800018',
      sku: 'UN-MAK-002',
      photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=80',
      aliases: ['un', 'makfa', 'makfa un', 'мука макфа']
    },
    {
      id: SEED_IDS.unQozoqVariantId,
      productId: uuidv4(),
      title: "Qozog'iston 1-nav bug'doy uni (50 kg qop)",
      brand: 'Qozoq Un',
      category: 'Oziq-ovqat',
      packSize: '50 kg',
      packUnit: 'qop',
      barcode: '47800019',
      sku: 'UN-QOZ-050',
      photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=80',
      aliases: ['un', 'qop un', 'qozoq un', '50 kg un', 'мука 50кг']
    },
    // Dori-darmon (Dorixona & Apteka tovarlari)
    {
      id: SEED_IDS.tsitramonVariantId,
      productId: uuidv4(),
      title: 'Tsitramon P №10',
      brand: 'Borimed',
      category: 'Dori-darmon',
      packSize: '10 tabletka',
      packUnit: 'qadoq',
      barcode: '4810133001',
      sku: 'MED-TSI-010',
      photoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&auto=format&fit=crop&q=80',
      aliases: ['tsitramon', 'citramon', 'цитрамон', 'dori', 'bosh ogriq', 'apteka', 'dorixona']
    },
    {
      id: SEED_IDS.paratsetamolVariantId,
      productId: uuidv4(),
      title: 'Paratsetamol 500 mg №10',
      brand: 'Farmak',
      category: 'Dori-darmon',
      packSize: '10 tabletka',
      packUnit: 'qadoq',
      barcode: '4820000002',
      sku: 'MED-PAR-010',
      photoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&auto=format&fit=crop&q=80',
      aliases: ['paracetamol', 'paratsetamol', 'парацетамол', 'isitma tushiruvchi', 'dori', 'apteka', 'dorixona']
    },
    {
      id: SEED_IDS.aspirinVariantId,
      productId: uuidv4(),
      title: 'Aspirin Kardio 100 mg №28',
      brand: 'Bayer',
      category: 'Dori-darmon',
      packSize: '28 tabletka',
      packUnit: 'quti',
      barcode: '4000000003',
      sku: 'MED-ASP-028',
      photoUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=120&auto=format&fit=crop&q=80',
      aliases: ['aspirin', 'aspirin cardio', 'аспирин', 'yurak', 'dori', 'apteka', 'dorixona']
    },
    {
      id: SEED_IDS.spasmalgonVariantId,
      productId: uuidv4(),
      title: 'Spasmalgon №20',
      brand: 'Sopharma',
      category: 'Dori-darmon',
      packSize: '20 tabletka',
      packUnit: 'quti',
      barcode: '3800000004',
      sku: 'MED-SPA-020',
      photoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&auto=format&fit=crop&q=80',
      aliases: ['spasmalgon', 'spazmalgon', 'спазмалгон', 'ogriq qoldiruvchi', 'dori', 'apteka', 'dorixona']
    },
    {
      id: SEED_IDS.amoksitsillinVariantId,
      productId: uuidv4(),
      title: 'Amoksitsillin 500 mg №16',
      brand: 'Hemofarm',
      category: 'Dori-darmon',
      packSize: '16 kapsula',
      packUnit: 'quti',
      barcode: '8600000005',
      sku: 'MED-AMX-016',
      photoUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=120&auto=format&fit=crop&q=80',
      aliases: ['amoxicillin', 'amoksitsillin', 'амоксициллин', 'antibiotik', 'dori', 'apteka', 'dorixona']
    },
    {
      id: SEED_IDS.nimesilVariantId,
      productId: uuidv4(),
      title: 'Nimesil 100 mg №30 paket',
      brand: 'Berlin-Chemie',
      category: 'Dori-darmon',
      packSize: '30 paket',
      packUnit: 'quti',
      barcode: '4013000006',
      sku: 'MED-NIM-030',
      photoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&auto=format&fit=crop&q=80',
      aliases: ['nimesil', 'нимесил', 'ogriq', 'dori', 'apteka', 'dorixona']
    }
  ];

  for (const v of variants) {
    db.variants.set(v.id, v);
  }

  // 4. Stores in Tashkent Pilot Centre (Reference point ~ 41.311081, 69.240562)
  const defaultHours = [
    { dayOfWeek: 0, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 1, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 2, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 3, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 4, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 5, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 6, openTime: '08:00', closeTime: '23:00', isClosed: false }
  ];

  const stores: Store[] = [
    {
      id: SEED_IDS.navbahorStoreId,
      organizationId: SEED_IDS.navbahorOrgId,
      name: 'Navbahor Market',
      inn: '308123456',
      region: 'Toshkent shahri',
      city: 'Yunusobod',
      district: 'Navbahor MFY',
      address: 'Namuna ko‘chasi, 12-uy, Yunusobod tumani',
      phone: '+998 71 200 11 22',
      location: { lat: 41.311081, lng: 69.240562 },
      entranceLocation: { lat: 41.31112, lng: 69.2406 },
      rating: 4.8,
      reviewCount: 36,
      isVerified: true,
      status: 'ACTIVE',
      type: 'MIXED',
      hours: defaultHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.mahallaStoreId,
      organizationId: mahallaOrgId,
      name: 'Mahalla Savdo',
      inn: '307654321',
      region: 'Toshkent shahri',
      city: 'Mirobod',
      district: 'Oqtepa MFY',
      address: 'Amir Temur shoh ko‘chasi, 45-uy',
      phone: '+998 71 200 33 44',
      location: { lat: 41.3135, lng: 69.2435 },
      entranceLocation: { lat: 41.31355, lng: 69.24352 },
      rating: 4.6,
      reviewCount: 19,
      isVerified: true,
      status: 'ACTIVE',
      type: 'RETAIL',
      hours: defaultHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.barakaStoreId,
      organizationId: barakaOrgId,
      name: 'Baraka Minimarket',
      inn: '306987654',
      region: 'Toshkent shahri',
      city: 'Chilonzor',
      district: 'Do‘stlik MFY',
      address: 'Mustaqillik shoh ko‘chasi, 8-uy',
      phone: '+998 71 200 55 66',
      location: { lat: 41.306, lng: 69.237 },
      rating: 4.5,
      reviewCount: 14,
      isVerified: false,
      status: 'ACTIVE',
      type: 'RETAIL',
      hours: defaultHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.chorsuWholesaleStoreId,
      organizationId: chorsuOrgId,
      name: 'Chorsu Ulgurji Baza',
      inn: '305112233',
      region: 'Toshkent shahri',
      city: 'Shayxontohur',
      district: 'Chorsu MFY',
      address: 'Zarqaynar ko‘chasi, 100-baza',
      phone: '+998 71 200 77 88',
      location: { lat: 41.325, lng: 69.235 },
      rating: 4.9,
      reviewCount: 42,
      isVerified: true,
      status: 'ACTIVE',
      type: 'WHOLESALE',
      hours: defaultHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.overnightStoreId,
      organizationId: SEED_IDS.navbahorOrgId,
      name: 'Tungi Market 24/7',
      inn: '308123456',
      region: 'Toshkent shahri',
      city: 'Mirobod',
      district: 'Bog‘iston MFY',
      address: 'Shahrisabz ko‘chasi, 3-uy',
      phone: '+998 71 200 99 00',
      location: { lat: 41.309, lng: 69.241 },
      rating: 4.4,
      reviewCount: 8,
      isVerified: true,
      status: 'ACTIVE',
      type: 'RETAIL',
      hours: [
        { dayOfWeek: 0, openTime: '22:00', closeTime: '02:00', isClosed: false },
        { dayOfWeek: 1, openTime: '22:00', closeTime: '02:00', isClosed: false },
        { dayOfWeek: 2, openTime: '22:00', closeTime: '02:00', isClosed: false },
        { dayOfWeek: 3, openTime: '22:00', closeTime: '02:00', isClosed: false },
        { dayOfWeek: 4, openTime: '22:00', closeTime: '02:00', isClosed: false },
        { dayOfWeek: 5, openTime: '22:00', closeTime: '02:00', isClosed: false },
        { dayOfWeek: 6, openTime: '22:00', closeTime: '02:00', isClosed: false }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.pendingStoreId,
      organizationId: mahallaOrgId,
      name: 'Yangi Savdo (Ariza)',
      inn: '307654321',
      region: 'Toshkent shahri',
      city: 'Yunusobod',
      district: 'Mustaqillik MFY',
      address: 'Namuna manzil, 8-uy',
      phone: '+998 90 999 88 77',
      location: { lat: 41.315, lng: 69.246 },
      rating: 0,
      reviewCount: 0,
      isVerified: false,
      status: 'PENDING',
      type: 'RETAIL',
      hours: defaultHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.suspendedStoreId,
      organizationId: suspendedOrgId,
      name: 'To‘xtatilgan Do‘kon',
      inn: '304998877',
      region: 'Samarqand viloyati',
      city: 'Samarqand shahri',
      district: 'Guliston MFY',
      address: 'Yopiq ko‘cha, 1-uy',
      phone: '+998 71 111 00 00',
      location: { lat: 41.3115, lng: 69.241 },
      rating: 3.2,
      reviewCount: 2,
      isVerified: false,
      status: 'SUSPENDED',
      type: 'RETAIL',
      hours: defaultHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // Sirdaryo viloyati / Guliston shahri Do‘kon va Aptekalari
    {
      id: SEED_IDS.sirdaryoPharmStoreId,
      organizationId: SEED_IDS.sirdaryoPharmOrgId,
      name: '999 Dorixona (Guliston Markaz)',
      inn: '309999111',
      region: 'Sirdaryo viloyati',
      city: 'Guliston shahri',
      district: 'Sayhun MFY',
      address: 'Islom Karimov shoh ko‘chasi, 45-uy, Guliston shahri',
      phone: '+998 67 225 10 20',
      location: { lat: 40.4905, lng: 68.7835 },
      entranceLocation: { lat: 40.4906, lng: 68.7836 },
      rating: 4.9,
      reviewCount: 54,
      isVerified: true,
      status: 'ACTIVE',
      type: 'PHARMACY',
      hours: defaultHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.grandPharmStoreId,
      organizationId: SEED_IDS.grandPharmOrgId,
      name: 'Grand Shifo Apteka (24/7)',
      inn: '309999222',
      region: 'Sirdaryo viloyati',
      city: 'Guliston shahri',
      district: 'Bog‘ishamol MFY',
      address: 'Mustaqillik ko‘chasi, 12-uy, Guliston shahri',
      phone: '+998 67 225 33 44',
      location: { lat: 40.4882, lng: 68.7860 },
      rating: 4.8,
      reviewCount: 38,
      isVerified: true,
      status: 'ACTIVE',
      type: 'PHARMACY',
      hours: [
        { dayOfWeek: 0, openTime: '00:00', closeTime: '23:59', isClosed: false },
        { dayOfWeek: 1, openTime: '00:00', closeTime: '23:59', isClosed: false },
        { dayOfWeek: 2, openTime: '00:00', closeTime: '23:59', isClosed: false },
        { dayOfWeek: 3, openTime: '00:00', closeTime: '23:59', isClosed: false },
        { dayOfWeek: 4, openTime: '00:00', closeTime: '23:59', isClosed: false },
        { dayOfWeek: 5, openTime: '00:00', closeTime: '23:59', isClosed: false },
        { dayOfWeek: 6, openTime: '00:00', closeTime: '23:59', isClosed: false }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.arzonPharmStoreId,
      organizationId: SEED_IDS.arzonPharmOrgId,
      name: 'Arzon Dorixona (Vokzal)',
      inn: '309999333',
      region: 'Sirdaryo viloyati',
      city: 'Guliston shahri',
      district: 'Temiryo‘l MFY',
      address: 'Temiryo‘lchilar ko‘chasi, 3-uy, Guliston vokzal yaqinida',
      phone: '+998 67 225 77 88',
      location: { lat: 40.4920, lng: 68.7810 },
      rating: 4.7,
      reviewCount: 29,
      isVerified: true,
      status: 'ACTIVE',
      type: 'PHARMACY',
      hours: defaultHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.gulistonMarketStoreId,
      organizationId: SEED_IDS.gulistonMarketOrgId,
      name: 'Guliston Supermarket',
      inn: '309999444',
      region: 'Sirdaryo viloyati',
      city: 'Guliston shahri',
      district: 'Taraqqiyot MFY',
      address: 'Navoiy shoh ko‘chasi, 18-uy, Guliston',
      phone: '+998 67 225 99 00',
      location: { lat: 40.4890, lng: 68.7850 },
      rating: 4.6,
      reviewCount: 19,
      isVerified: true,
      status: 'ACTIVE',
      type: 'RETAIL',
      hours: defaultHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  for (const s of stores) {
    db.stores.set(s.id, s);
  }

  // 5. Seed Offers with freshness & wholesale tiers
  const now = Date.now();
  const tenMinutesAgo = new Date(now - 10 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(now - 48 * 60 * 60 * 1000).toISOString();
  const fourDaysAgo = new Date(now - 96 * 60 * 60 * 1000).toISOString();

  interface OfferSeedData {
    id: string;
    storeId: string;
    variantId: string;
    price: string;
    minQty?: number;
    stockOnHand: number;
    stockVerifiedAt: string | null;
    status: 'ACTIVE' | 'OUT_OF_STOCK';
    wholesaleTiers?: { minQuantity: number; unitPrice: string }[];
  }

  const offersData: OfferSeedData[] = [
    // Navbahor Market offers
    {
      id: uuidv4(),
      storeId: SEED_IDS.navbahorStoreId,
      variantId: SEED_IDS.snickers50gVariantId,
      price: '8000.00',
      stockOnHand: 24,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE',
      wholesaleTiers: [
        { minQuantity: 1, unitPrice: '8000.00' },
        { minQuantity: 12, unitPrice: '7400.00' },
        { minQuantity: 48, unitPrice: '7000.00' }
      ]
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.navbahorStoreId,
      variantId: SEED_IDS.snickers80gVariantId,
      price: '12000.00',
      stockOnHand: 6,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.navbahorStoreId,
      variantId: SEED_IDS.mars50gVariantId,
      price: '7500.00',
      stockOnHand: 18,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.navbahorStoreId,
      variantId: SEED_IDS.twix50gVariantId,
      price: '8000.00',
      stockOnHand: 0,
      stockVerifiedAt: tenMinutesAgo,
      status: 'OUT_OF_STOCK'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.navbahorStoreId,
      variantId: SEED_IDS.bounty57gVariantId,
      price: '8000.00',
      stockOnHand: 12,
      stockVerifiedAt: twoDaysAgo, // STALE (>24h)
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.navbahorStoreId,
      variantId: SEED_IDS.cola15lVariantId,
      price: '16000.00',
      stockOnHand: 30,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.navbahorStoreId,
      variantId: SEED_IDS.nesquik200gVariantId,
      price: '12000.00',
      stockOnHand: 10,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },

    // Mahalla Savdo offers
    {
      id: uuidv4(),
      storeId: SEED_IDS.mahallaStoreId,
      variantId: SEED_IDS.snickers50gVariantId,
      price: '7500.00',
      stockOnHand: 8,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.mahallaStoreId,
      variantId: SEED_IDS.mars50gVariantId,
      price: '7200.00',
      stockOnHand: 14,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },

    // Baraka Minimarket offers
    {
      id: uuidv4(),
      storeId: SEED_IDS.barakaStoreId,
      variantId: SEED_IDS.snickers50gVariantId,
      price: '8500.00',
      stockOnHand: 12,
      stockVerifiedAt: fourDaysAgo, // VERY_STALE (>72h)
      status: 'ACTIVE'
    },

    // Chorsu Wholesale offers
    {
      id: uuidv4(),
      storeId: SEED_IDS.chorsuWholesaleStoreId,
      variantId: SEED_IDS.snickers50gVariantId,
      price: '7000.00',
      minQty: 12,
      stockOnHand: 500,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE',
      wholesaleTiers: [
        { minQuantity: 12, unitPrice: '7000.00' },
        { minQuantity: 48, unitPrice: '6700.00' },
        { minQuantity: 120, unitPrice: '6500.00' }
      ]
    },

    // 999 Dorixona (Guliston) offers
    {
      id: uuidv4(),
      storeId: SEED_IDS.sirdaryoPharmStoreId,
      variantId: SEED_IDS.tsitramonVariantId,
      price: '3000.00',
      stockOnHand: 50,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.sirdaryoPharmStoreId,
      variantId: SEED_IDS.paratsetamolVariantId,
      price: '2500.00',
      stockOnHand: 60,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.sirdaryoPharmStoreId,
      variantId: SEED_IDS.aspirinVariantId,
      price: '18000.00',
      stockOnHand: 35,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.sirdaryoPharmStoreId,
      variantId: SEED_IDS.spasmalgonVariantId,
      price: '24000.00',
      stockOnHand: 40,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.sirdaryoPharmStoreId,
      variantId: SEED_IDS.amoksitsillinVariantId,
      price: '15000.00',
      stockOnHand: 25,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.sirdaryoPharmStoreId,
      variantId: SEED_IDS.nimesilVariantId,
      price: '85000.00',
      stockOnHand: 20,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },

    // Grand Shifo Apteka (Guliston 24/7) offers
    {
      id: uuidv4(),
      storeId: SEED_IDS.grandPharmStoreId,
      variantId: SEED_IDS.tsitramonVariantId,
      price: '2800.00',
      stockOnHand: 40,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.grandPharmStoreId,
      variantId: SEED_IDS.paratsetamolVariantId,
      price: '2200.00',
      stockOnHand: 80,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.grandPharmStoreId,
      variantId: SEED_IDS.spasmalgonVariantId,
      price: '23000.00',
      stockOnHand: 30,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.grandPharmStoreId,
      variantId: SEED_IDS.nimesilVariantId,
      price: '82000.00',
      stockOnHand: 15,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },

    // Arzon Dorixona (Guliston Vokzal) offers
    {
      id: uuidv4(),
      storeId: SEED_IDS.arzonPharmStoreId,
      variantId: SEED_IDS.tsitramonVariantId,
      price: '2500.00',
      stockOnHand: 100,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.arzonPharmStoreId,
      variantId: SEED_IDS.paratsetamolVariantId,
      price: '2000.00',
      stockOnHand: 120,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.arzonPharmStoreId,
      variantId: SEED_IDS.aspirinVariantId,
      price: '17500.00',
      stockOnHand: 45,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.arzonPharmStoreId,
      variantId: SEED_IDS.amoksitsillinVariantId,
      price: '14000.00',
      stockOnHand: 30,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },

    // Guliston Supermarket offers
    {
      id: uuidv4(),
      storeId: SEED_IDS.gulistonMarketStoreId,
      variantId: SEED_IDS.snickers50gVariantId,
      price: '8500.00',
      stockOnHand: 50,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.gulistonMarketStoreId,
      variantId: SEED_IDS.cola15lVariantId,
      price: '14000.00',
      stockOnHand: 40,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.gulistonMarketStoreId,
      variantId: SEED_IDS.nonVariantId,
      price: '3500.00',
      stockOnHand: 100,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.gulistonMarketStoreId,
      variantId: SEED_IDS.sutVariantId,
      price: '11500.00',
      stockOnHand: 60,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.gulistonMarketStoreId,
      variantId: SEED_IDS.yogVariantId,
      price: '16000.00',
      stockOnHand: 45,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.gulistonMarketStoreId,
      variantId: SEED_IDS.shakarVariantId,
      price: '12000.00',
      stockOnHand: 80,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.gulistonMarketStoreId,
      variantId: SEED_IDS.choyVariantId,
      price: '18000.00',
      stockOnHand: 35,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.gulistonMarketStoreId,
      variantId: SEED_IDS.tuxumVariantId,
      price: '14000.00',
      stockOnHand: 50,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.gulistonMarketStoreId,
      variantId: SEED_IDS.unVariantId,
      price: '7500.00',
      stockOnHand: 150,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.gulistonMarketStoreId,
      variantId: SEED_IDS.unMakfaVariantId,
      price: '19000.00',
      stockOnHand: 60,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.gulistonMarketStoreId,
      variantId: SEED_IDS.unQozoqVariantId,
      price: '340000.00',
      stockOnHand: 25,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.navbahorStoreId,
      variantId: SEED_IDS.nonVariantId,
      price: '3000.00',
      stockOnHand: 120,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.navbahorStoreId,
      variantId: SEED_IDS.sutVariantId,
      price: '11000.00',
      stockOnHand: 70,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.navbahorStoreId,
      variantId: SEED_IDS.yogVariantId,
      price: '15500.00',
      stockOnHand: 50,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.navbahorStoreId,
      variantId: SEED_IDS.shakarVariantId,
      price: '11800.00',
      stockOnHand: 90,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.navbahorStoreId,
      variantId: SEED_IDS.choyVariantId,
      price: '17500.00',
      stockOnHand: 40,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.navbahorStoreId,
      variantId: SEED_IDS.tuxumVariantId,
      price: '13500.00',
      stockOnHand: 60,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.navbahorStoreId,
      variantId: SEED_IDS.unVariantId,
      price: '7000.00',
      stockOnHand: 180,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.navbahorStoreId,
      variantId: SEED_IDS.unMakfaVariantId,
      price: '18500.00',
      stockOnHand: 75,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    },
    {
      id: uuidv4(),
      storeId: SEED_IDS.navbahorStoreId,
      variantId: SEED_IDS.unQozoqVariantId,
      price: '335000.00',
      stockOnHand: 30,
      stockVerifiedAt: tenMinutesAgo,
      status: 'ACTIVE'
    }
  ];

  for (const od of offersData) {
    const variant = db.variants.get(od.variantId)!;
    const offerId = stableOfferId(od.storeId, od.variantId);
    const off: Offer = {
      id: offerId,
      storeId: od.storeId,
      variantId: od.variantId,
      variant,
      price: od.price,
      minOrderQuantity: od.minQty || 1,
      stockOnHand: od.stockOnHand,
      stockVerifiedAt: od.stockVerifiedAt,
      priceUpdatedAt: tenMinutesAgo,
      freshness: db.computeFreshness(od.stockVerifiedAt),
      status: od.status,
      wholesaleTiers: od.wholesaleTiers || [],
      version: 1
    };
    db.offers.set(off.id, off);
    db.balances.set(off.id, {
      offerId: off.id,
      onHand: new Decimal(od.stockOnHand),
      averageUnitCost: new Decimal(od.price).times(0.75).toDecimalPlaces(2), // Estimated 75% cost
      lastVerifiedAt: od.stockVerifiedAt ? new Date(od.stockVerifiedAt) : null,
      version: 1
    });
  }

  // 6. Seed Initial Stock Documents (Kirim va Sotuv) for Navbahor Market
  // Document 1: Initial Receipt
  const receiptDocId = uuidv4();
  await db.postStockDocument(
    {
      id: receiptDocId,
      organizationId: SEED_IDS.navbahorOrgId,
      storeId: SEED_IDS.navbahorStoreId,
      docType: 'RECEIPT',
      status: 'DRAFT',
      documentNumber: 'KRM-001',
      date: new Date().toISOString(),
      supplierOrCustomer: 'Mars / Wrigley Distribyutsiya',
      paymentMethod: 'CARD',
      totalAmount: '120000.00',
      lines: [
        {
          id: uuidv4(),
          variantId: SEED_IDS.nesquik200gVariantId,
          variantTitle: 'Nesquik 200 g (quti)',
          quantity: '10.000',
          unitPriceOrCost: '12000.00',
          subtotal: '120000.00',
          isRestockable: true
        }
      ],
      notes: 'Haftalik tovar kirimi',
      createdAt: new Date().toISOString()
    },
    SEED_IDS.ownerUserId,
    'owner@navbahor.uz'
  );

  // Document 2: Sale
  const saleDocId = uuidv4();
  await db.postStockDocument(
    {
      id: saleDocId,
      organizationId: SEED_IDS.navbahorOrgId,
      storeId: SEED_IDS.navbahorStoreId,
      docType: 'SALE',
      status: 'DRAFT',
      documentNumber: 'STV-001',
      date: new Date().toISOString(),
      supplierOrCustomer: 'Chakana mijoz',
      paymentMethod: 'CASH',
      totalAmount: '16000.00',
      lines: [
        {
          id: uuidv4(),
          variantId: SEED_IDS.cola15lVariantId,
          variantTitle: 'Coca-Cola 1.5 l',
          quantity: '1.000',
          unitPriceOrCost: '16000.00',
          subtotal: '16000.00',
          isRestockable: true
        }
      ],
      notes: 'Kassa sotuvi',
      createdAt: new Date().toISOString()
    },
    SEED_IDS.operatorUserId,
    'operator@navbahor.uz'
  );

  // 7. Seed Operating Expenses
  db.expenses.set(uuidv4(), {
    id: uuidv4(),
    organizationId: SEED_IDS.navbahorOrgId,
    storeId: SEED_IDS.navbahorStoreId,
    category: 'IJARA',
    amount: new Decimal('60000.00'),
    date: new Date().toISOString().split('T')[0],
    description: 'Filial kunlik hisoblangan ijara xarajati',
    createdAt: new Date().toISOString()
  });

  // 8. Seed Reviews
  db.reviews.set(uuidv4(), {
    id: uuidv4(),
    storeId: SEED_IDS.navbahorStoreId,
    userId: SEED_IDS.customerUserId,
    userName: 'Otabek Xaridor',
    rating: 5,
    comment: 'Do‘konda barcha shirinliklar bor ekan, narxlari ham qulay va toza joy.',
    status: 'PUBLISHED',
    merchantReply: 'Tashrifingiz uchun rahmat! Har doim xizmatingizdamiz.',
    merchantRepliedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // 9. Seed Reports / Complaints
  const repId = uuidv4();
  db.reports.set(repId, {
    id: repId,
    reporterUserId: SEED_IDS.customerUserId,
    storeId: SEED_IDS.navbahorStoreId,
    reason: 'WRONG_PRICE',
    details: 'Ilovada 8 000 so‘m, kassada esa 9 000 so‘m deyishdi.',
    status: 'OPEN',
    createdAt: new Date().toISOString()
  });

  const repId2 = uuidv4();
  db.reports.set(repId2, {
    id: repId2,
    reporterUserId: SEED_IDS.customerUserId,
    storeId: SEED_IDS.barakaStoreId,
    reason: 'UNAVAILABLE_PRODUCT',
    details: 'Coca-Cola 1.5l tugagan deb aytishdi, lekin dasturda bor deb ko‘rsatilgan.',
    status: 'OPEN',
    createdAt: new Date().toISOString()
  });

  const repId3 = uuidv4();
  db.reports.set(repId3, {
    id: repId3,
    reporterUserId: SEED_IDS.customerUserId,
    storeId: SEED_IDS.barakaStoreId,
    reason: 'WRONG_LOCATION',
    details: 'Do‘kon kirish eshigi boshqa ko‘chada joylashgan.',
    status: 'OPEN',
    createdAt: new Date().toISOString()
  });

  // 10. Seed Admin Correction Request
  const corId = uuidv4();
  db.corrections.set(corId, {
    id: corId,
    storeId: SEED_IDS.navbahorStoreId,
    reportId: repId,
    affectedFields: ['price', 'stockOnHand'],
    message: 'Snickers 50 g narxini tekshirib, amaldagi narxni kiriting va javob yuboring.',
    deadline: '2026-10-05',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // 11. Seed Admin Inquiries (Murojaatlar va Rasmiy xabarlar)
  const inq1 = uuidv4();
  db.inquiries.set(inq1, {
    id: inq1,
    storeId: SEED_IDS.navbahorStoreId,
    storeName: 'Navbahor Market',
    organizationId: SEED_IDS.navbahorOrgId,
    organizationName: 'Navbahor Savdo MCHJ',
    subject: 'Do‘kon ish vaqtlari va kirish joyi fotosuratlari talabi',
    message: 'Hurmatli do‘kon egasi! Mijozlar qulayligi uchun yangi kirish eshigi fotosuratlarini yuklashingiz va yakshanba kungi ish tartibingizni tasdiqlashingizni so‘raymiz.',
    priority: 'HIGH',
    status: 'PENDING_MERCHANT_REPLY',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  });

  const inq2 = uuidv4();
  db.inquiries.set(inq2, {
    id: inq2,
    storeId: SEED_IDS.navbahorStoreId,
    storeName: 'Navbahor Market',
    organizationId: SEED_IDS.navbahorOrgId,
    organizationName: 'Navbahor Savdo MCHJ',
    subject: 'Kassada to‘lov tizimlari (HUMO/Uzcard) integratsiyasi',
    message: 'Assalomu alaykum. Do‘koningizda barcha turdagi plastik kartalar qabul qilinishini tekshirish yuzasidan so‘rov.',
    priority: 'NORMAL',
    status: 'MERCHANT_SUBMITTED',
    merchantReply: 'Barcha terminallarimiz va QR-to‘lov tizimlarimiz to‘liq ishlamoqda. Har qanday karta orqali qabul qilinadi.',
    merchantRepliedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  });

  // 12. Seed Sample Credential Request
  const credReq1 = uuidv4();
  db.credentialRequests.set(credReq1, {
    id: credReq1,
    userId: SEED_IDS.operatorUserId,
    userName: 'Sardor Qosim',
    userEmail: 'operator@navbahor.uz',
    userPhone: '+998903334455',
    userRole: 'OPERATOR',
    organizationId: SEED_IDS.navbahorOrgId,
    organizationName: 'Navbahor Savdo MCHJ',
    requestedEmail: 'sardor.operator@navbahor.uz',
    requestedPassword: hashOwnerPassword('NewOperatorPass2026!'),
    requestedPhone: '+998903334455',
    reason: 'Rasmiy korporativ elektron pochtaga o‘tkazish',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  });

  
  // 13. Seed Dealer & B2B Distribution CRM
  db.dealers.set(SEED_IDS.dealerId, {
    id: SEED_IDS.dealerId,
    userId: SEED_IDS.dealerUserId,
    companyName: 'Toshkent Distribyutsiya MCHJ',
    contactName: 'Akmal Rustamov',
    login: 'diller1',
    phone: '+998901234567',
    status: 'ACTIVE',
    allowExperimentalMap: true,
    region: 'Toshkent shahri',
    city: 'Yunusobod tumani',
    createdByAdminId: SEED_IDS.adminUserId,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Dealer Products
  const prod1 = 'dddd2222-2222-4ddd-dddd-111111111111';
  const prod2 = 'dddd2222-2222-4ddd-dddd-222222222222';
  const prod3 = 'dddd2222-2222-4ddd-dddd-333333333333';
  const prod4 = 'dddd2222-2222-4ddd-dddd-444444444444';
  const prod5 = 'dddd2222-2222-4ddd-dddd-555555555555';

  db.dealerProducts.set(prod1, {
    id: prod1,
    dealerId: SEED_IDS.dealerId,
    globalProductId: SEED_IDS.snickers50gVariantId,
    name: 'Snickers 50g Shokolad (Blok 24 dona)',
    categoryId: 'sweets',
    categoryName: 'Shirinliklar va shokolad',
    sku: 'SNK-50G-B24',
    unit: 'blok',
    wholesalePrice: new Decimal(204000),
    stockQuantity: new Decimal(150),
    createdAt: new Date().toISOString()
  });

  db.dealerProducts.set(prod2, {
    id: prod2,
    dealerId: SEED_IDS.dealerId,
    globalProductId: SEED_IDS.cola15lVariantId,
    name: 'Coca-Cola Classic 1.5L (Qadoq 6 dona)',
    categoryId: 'drinks',
    categoryName: 'Ichimliklar',
    sku: 'COLA-15L-P6',
    unit: 'qadoq',
    wholesalePrice: new Decimal(69000),
    stockQuantity: new Decimal(220),
    createdAt: new Date().toISOString()
  });

  db.dealerProducts.set(prod3, {
    id: prod3,
    dealerId: SEED_IDS.dealerId,
    globalProductId: SEED_IDS.twix50gVariantId,
    name: 'Twix 50g Pechenye (Blok 24 dona)',
    categoryId: 'sweets',
    categoryName: 'Shirinliklar va shokolad',
    sku: 'TWX-50G-B24',
    unit: 'blok',
    wholesalePrice: new Decimal(196800),
    stockQuantity: new Decimal(95),
    createdAt: new Date().toISOString()
  });

  db.dealerProducts.set(prod4, {
    id: prod4,
    dealerId: SEED_IDS.dealerId,
    globalProductId: SEED_IDS.bounty57gVariantId,
    name: 'Bounty 57g Kokosli Batonchik (Blok 24 dona)',
    categoryId: 'sweets',
    categoryName: 'Shirinliklar va shokolad',
    sku: 'BNT-57G-B24',
    unit: 'blok',
    wholesalePrice: new Decimal(204000),
    stockQuantity: new Decimal(80),
    createdAt: new Date().toISOString()
  });

  db.dealerProducts.set(prod5, {
    id: prod5,
    dealerId: SEED_IDS.dealerId,
    name: 'Dena Olma Sharbati 1L (Qadoq 12 dona)',
    categoryId: 'drinks',
    categoryName: 'Sharbatlar',
    sku: 'DENA-APP-12',
    unit: 'qadoq',
    wholesalePrice: new Decimal(168000),
    stockQuantity: new Decimal(110),
    createdAt: new Date().toISOString()
  });

  // Dealer Attached Stores
  const ds1 = 'dddd3333-3333-4ddd-dddd-111111111111';
  const ds2 = 'dddd3333-3333-4ddd-dddd-222222222222';
  const ds3 = 'dddd3333-3333-4ddd-dddd-333333333333';

  // 1) Navbahor Savdo: Active debt within credit limit (Yellow marker)
  db.dealerStores.set(ds1, {
    id: ds1,
    dealerId: SEED_IDS.dealerId,
    storeId: SEED_IDS.navbahorStoreId,
    currentDebtBalance: new Decimal(4500000),
    creditLimit: new Decimal(10000000),
    lastSupplyDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: 'ACTIVE',
    notes: 'Doimiy hamkor, haftada 2 marta yuk oladi',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString()
  });

  // 2) Mahalla Savdo: Zero debt (Green marker)
  db.dealerStores.set(ds2, {
    id: ds2,
    dealerId: SEED_IDS.dealerId,
    storeId: SEED_IDS.mahallaStoreId,
    currentDebtBalance: new Decimal(0),
    creditLimit: new Decimal(8000000),
    lastSupplyDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: 'ACTIVE',
    notes: 'Qarzlarni o‘z vaqtida so‘ndiradi',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
  });

  // 3) Baraka Minimarket: Large overdue debt exceeding limit (Red marker)
  db.dealerStores.set(ds3, {
    id: ds3,
    dealerId: SEED_IDS.dealerId,
    storeId: SEED_IDS.barakaStoreId,
    currentDebtBalance: new Decimal(12800000),
    creditLimit: new Decimal(8000000),
    lastSupplyDate: new Date(Date.now() - 14 * 86400000).toISOString(),
    status: 'ACTIVE',
    notes: 'To‘lov muddati 10 kunga o‘tib ketgan, ogohlantirish berilgan',
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString()
  });

  // Sample Supply Order
  const order1Id = 'dddd4444-4444-4ddd-dddd-111111111111';
  db.supplyOrders.set(order1Id, {
    id: order1Id,
    orderNumber: 'NAK-1001',
    dealerId: SEED_IDS.dealerId,
    storeId: SEED_IDS.navbahorStoreId,
    totalAmount: new Decimal(6500000),
    paidAmount: new Decimal(2000000),
    debtAmount: new Decimal(4500000),
    paymentType: 'PARTIAL',
    status: 'DELIVERED',
    items: [
      {
        id: uuidv4(),
        supplyOrderId: order1Id,
        productId: prod1,
        productName: 'Snickers 50g Shokolad (Blok 24 dona)',
        unit: 'blok',
        quantity: new Decimal(20),
        unitPrice: new Decimal(204000),
        subtotal: new Decimal(4080000)
      },
      {
        id: uuidv4(),
        supplyOrderId: order1Id,
        productId: prod2,
        productName: 'Coca-Cola Classic 1.5L (Qadoq 6 dona)',
        unit: 'qadoq',
        quantity: new Decimal(35),
        unitPrice: new Decimal(69000),
        subtotal: new Decimal(2415000)
      }
    ],
    notes: 'Navbahor filialiga yetkazildi. 2 000 000 so‘m naqd berildi, qoldig‘i 4 500 000 so‘m qarzga yozildi',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  });

  // Sample Debt Transactions for Akt Sverka
  const dt1 = uuidv4();
  db.debtTransactions.set(dt1, {
    id: dt1,
    dealerId: SEED_IDS.dealerId,
    storeId: SEED_IDS.navbahorStoreId,
    supplyOrderId: order1Id,
    type: 'SUPPLY',
    amount: new Decimal(4500000),
    balanceAfter: new Decimal(4500000),
    comment: 'Yuk xati NAK-1001 bo‘yicha tovar topshirildi (Jami: 6 500 000, To‘landi: 2 000 000)',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  });

  const dt2 = uuidv4();
  db.debtTransactions.set(dt2, {
    id: dt2,
    dealerId: SEED_IDS.dealerId,
    storeId: SEED_IDS.mahallaStoreId,
    type: 'PAYMENT',
    amount: new Decimal(3200000),
    balanceAfter: new Decimal(0),
    comment: 'Inkassatsiya: Qarzdorlik to‘liq so‘ndirildi (Naqd pul)',
    paymentMethod: 'CASH',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  });

  console.log('Database seeded successfully!');
}

export async function bootstrapSirdaryoPilotData(database = db): Promise<boolean> {
  console.log('[Pilot Bootstrap] Sirdaryo / Guliston do‘kon va mahsulotlari yuklanmoqda...');

  // 1. Organizations
  const orgs = [
    {
      id: SEED_IDS.sirdaryoPharmOrgId,
      name: '999 Shifo Farm MCHJ',
      inn: '309999111',
      region: 'Sirdaryo viloyati',
      city: 'Guliston shahri',
      district: 'Sayhun MFY',
      type: 'PHARMACY' as const,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.grandPharmOrgId,
      name: 'Grand Shifo Apteka XK',
      inn: '309999222',
      region: 'Sirdaryo viloyati',
      city: 'Guliston shahri',
      district: 'Bog‘ishamol MFY',
      type: 'PHARMACY' as const,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.arzonPharmOrgId,
      name: 'Arzon Dori Savdo MCHJ',
      inn: '309999333',
      region: 'Sirdaryo viloyati',
      city: 'Guliston shahri',
      district: 'Temiryo‘l MFY',
      type: 'PHARMACY' as const,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.gulistonMarketOrgId,
      name: 'Guliston Savdo MCHJ',
      inn: '309999444',
      region: 'Sirdaryo viloyati',
      city: 'Guliston shahri',
      district: 'Taraqqiyot MFY',
      type: 'RETAIL' as const,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString()
    }
  ];
  for (const org of orgs) {
    database.organizations.set(org.id, org);
  }

  // 2. Variants (Medicines & essentials)
  const variants: (Variant & { aliases?: string[]; organizationId?: string })[] = [
    {
      id: SEED_IDS.tsitramonVariantId,
      productId: '4afe2f50-fbea-4d16-8288-c0ebdb016502',
      organizationId: SEED_IDS.sirdaryoPharmOrgId,
      title: 'Tsitramon P №10',
      brand: 'Borimed',
      category: 'Dori-darmon',
      packSize: '10 tabletka',
      packUnit: 'qadoq',
      barcode: '4810133001',
      sku: 'MED-TSI-010',
      photoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&auto=format&fit=crop&q=80',
      aliases: ['tsitramon', 'citramon', 'цитрамон', 'dori', 'bosh ogriq', 'apteka', 'dorixona']
    },
    {
      id: SEED_IDS.paratsetamolVariantId,
      productId: '1b4fed6b-7d64-46e6-81c5-afa269f6ec5f',
      organizationId: SEED_IDS.sirdaryoPharmOrgId,
      title: 'Paratsetamol 500 mg №10',
      brand: 'Farmak',
      category: 'Dori-darmon',
      packSize: '10 tabletka',
      packUnit: 'qadoq',
      barcode: '4820000002',
      sku: 'MED-PAR-010',
      photoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&auto=format&fit=crop&q=80',
      aliases: ['paracetamol', 'paratsetamol', 'парацетамол', 'isitma tushiruvchi', 'dori', 'apteka', 'dorixona']
    },
    {
      id: SEED_IDS.aspirinVariantId,
      productId: 'b4fe2f50-fbea-4d16-8288-c0ebdb016503',
      organizationId: SEED_IDS.sirdaryoPharmOrgId,
      title: 'Aspirin Kardio 100 mg №28',
      brand: 'Bayer',
      category: 'Dori-darmon',
      packSize: '28 tabletka',
      packUnit: 'quti',
      barcode: '4000000003',
      sku: 'MED-ASP-028',
      photoUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=120&auto=format&fit=crop&q=80',
      aliases: ['aspirin', 'aspirin cardio', 'аспирин', 'yurak', 'dori', 'apteka', 'dorixona']
    },
    {
      id: SEED_IDS.spasmalgonVariantId,
      productId: 'c4fe2f50-fbea-4d16-8288-c0ebdb016504',
      organizationId: SEED_IDS.sirdaryoPharmOrgId,
      title: 'Spasmalgon №20',
      brand: 'Sopharma',
      category: 'Dori-darmon',
      packSize: '20 tabletka',
      packUnit: 'quti',
      barcode: '3800000004',
      sku: 'MED-SPA-020',
      photoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&auto=format&fit=crop&q=80',
      aliases: ['spasmalgon', 'spazmalgon', 'спазмалгон', 'ogriq qoldiruvchi', 'dori', 'apteka', 'dorixona']
    },
    {
      id: SEED_IDS.amoksitsillinVariantId,
      productId: 'd4fe2f50-fbea-4d16-8288-c0ebdb016505',
      organizationId: SEED_IDS.sirdaryoPharmOrgId,
      title: 'Amoksitsillin 500 mg №16',
      brand: 'Hemofarm',
      category: 'Dori-darmon',
      packSize: '16 kapsula',
      packUnit: 'quti',
      barcode: '8600000005',
      sku: 'MED-AMX-016',
      photoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&auto=format&fit=crop&q=80',
      aliases: ['amoksitsillin', 'amoxicillin', 'амоксициллин', 'antibiotik', 'dori', 'apteka', 'dorixona']
    },
    {
      id: SEED_IDS.nimesilVariantId,
      productId: 'e4fe2f50-fbea-4d16-8288-c0ebdb016506',
      organizationId: SEED_IDS.sirdaryoPharmOrgId,
      title: 'Nimesil 100 mg №30',
      brand: 'Berlin-Chemie',
      category: 'Dori-darmon',
      packSize: '30 paket',
      packUnit: 'quti',
      barcode: '4013054006',
      sku: 'MED-NIM-030',
      photoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&auto=format&fit=crop&q=80',
      aliases: ['nimesil', 'nimesulid', 'нимесил', 'ogriq qoldiruvchi', 'dori', 'apteka', 'dorixona']
    },
    {
      id: SEED_IDS.snickers50gVariantId,
      productId: 'f11a244c-d297-45b1-8375-ae33ab91c191',
      organizationId: SEED_IDS.gulistonMarketOrgId,
      title: 'Snickers 50 g',
      brand: 'Snickers',
      category: 'Shokolad',
      packSize: '50 g',
      packUnit: 'dona',
      barcode: '40111001',
      sku: 'SNK-050',
      photoUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=120&auto=format&fit=crop&q=80',
      aliases: ['snikers', 'snickers', 'сникерс', 'snikers 50g', 'shokolad bar']
    },
    {
      id: SEED_IDS.cola15lVariantId,
      productId: '4ce54a7c-e49f-4799-bd6d-ab29f95f2f3d',
      organizationId: SEED_IDS.gulistonMarketOrgId,
      title: 'Coca-Cola 1.5 l',
      brand: 'Coca-Cola',
      category: 'Ichimliklar',
      packSize: '1.5 l',
      packUnit: 'dona',
      barcode: '54490001',
      sku: 'COLA-150',
      photoUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=120&auto=format&fit=crop&q=80',
      aliases: ['cola', 'kola', 'coca cola', 'кока кола']
    },
    {
      id: SEED_IDS.nonVariantId,
      productId: '5ce54a7c-e49f-4799-bd6d-ab29f95f2f3e',
      organizationId: SEED_IDS.gulistonMarketOrgId,
      title: 'Tandir non (Issiq patir)',
      brand: 'Nonvoyxona',
      category: 'Non mahsulotlari',
      packSize: '1 dona',
      packUnit: 'dona',
      barcode: '47800011',
      sku: 'NON-001',
      photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=80',
      aliases: ['non', 'tandir non', 'patir', 'nonvoy', 'хлеб', 'лепешка']
    },
    {
      id: SEED_IDS.sutVariantId,
      productId: '6ce54a7c-e49f-4799-bd6d-ab29f95f2f3f',
      organizationId: SEED_IDS.gulistonMarketOrgId,
      title: 'Musaffo Sut 3.2% 1 L',
      brand: 'Musaffo',
      category: 'Sut mahsulotlari',
      packSize: '1 l',
      packUnit: 'dona',
      barcode: '47800012',
      sku: 'SUT-001',
      photoUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=120&auto=format&fit=crop&q=80',
      aliases: ['sut', 'musaffo', 'молоко', 'sut 3.2']
    },
    {
      id: SEED_IDS.yogVariantId,
      productId: '7ce54a7c-e49f-4799-bd6d-ab29f95f2f40',
      organizationId: SEED_IDS.gulistonMarketOrgId,
      title: 'Oila Tanlovi Pista yog‘i 1 L',
      brand: 'Oila Tanlovi',
      category: 'Oziq-ovqat',
      packSize: '1 l',
      packUnit: 'dona',
      barcode: '47800013',
      sku: 'YOG-001',
      photoUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=120&auto=format&fit=crop&q=80',
      aliases: ['yog', 'yog‘', 'pista yogi', 'oila tanlovi', 'масло']
    },
    {
      id: SEED_IDS.shakarVariantId,
      productId: '8ce54a7c-e49f-4799-bd6d-ab29f95f2f41',
      organizationId: SEED_IDS.gulistonMarketOrgId,
      title: 'Shakar 1 kg',
      brand: 'Xorazm Shakar',
      category: 'Oziq-ovqat',
      packSize: '1 kg',
      packUnit: 'kg',
      barcode: '47800014',
      sku: 'SHK-001',
      photoUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=120&auto=format&fit=crop&q=80',
      aliases: ['shakar', 'shakar 1kg', 'saxar', 'сахар']
    },
    {
      id: SEED_IDS.choyVariantId,
      productId: '9ce54a7c-e49f-4799-bd6d-ab29f95f2f42',
      organizationId: SEED_IDS.gulistonMarketOrgId,
      title: 'Ahmad Tea Qora choy 100 g',
      brand: 'Ahmad Tea',
      category: 'Choy va Kofe',
      packSize: '100 g',
      packUnit: 'quti',
      barcode: '47800015',
      sku: 'CHY-001',
      photoUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=120&auto=format&fit=crop&q=80',
      aliases: ['choy', 'qora choy', 'ahmad tea', 'чай']
    },
    {
      id: SEED_IDS.tuxumVariantId,
      productId: 'ace54a7c-e49f-4799-bd6d-ab29f95f2f43',
      organizationId: SEED_IDS.gulistonMarketOrgId,
      title: 'Tuxum S1 10 dona',
      brand: 'Parranda Fayz',
      category: 'Oziq-ovqat',
      packSize: '10 dona',
      packUnit: 'qadoq',
      barcode: '47800016',
      sku: 'TXM-010',
      photoUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=120&auto=format&fit=crop&q=80',
      aliases: ['tuxum', 'tuxum 10 dona', 'яйца', 'parranda']
    },
    {
      id: SEED_IDS.unVariantId,
      productId: 'bce54a7c-e49f-4799-bd6d-ab29f95f2f44',
      organizationId: SEED_IDS.gulistonMarketOrgId,
      title: "Oliy navli bug'doy uni (Oltin Don, 1 kg)",
      brand: 'Oltin Don',
      category: 'Oziq-ovqat',
      packSize: '1 kg',
      packUnit: 'kg',
      barcode: '47800017',
      sku: 'UN-001',
      photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=80',
      aliases: ['un', "bug'doy uni", 'un 1kg', 'oliy nav un', 'мука']
    },
    {
      id: SEED_IDS.unMakfaVariantId,
      productId: 'cce54a7c-e49f-4799-bd6d-ab29f95f2f45',
      organizationId: SEED_IDS.gulistonMarketOrgId,
      title: "Makfa oliy navli bug'doy uni (2 kg)",
      brand: 'Makfa',
      category: 'Oziq-ovqat',
      packSize: '2 kg',
      packUnit: 'qadoq',
      barcode: '47800018',
      sku: 'UN-MAK-002',
      photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=80',
      aliases: ['un', 'makfa', 'makfa un', 'мука макфа']
    },
    {
      id: SEED_IDS.unQozoqVariantId,
      productId: 'dce54a7c-e49f-4799-bd6d-ab29f95f2f46',
      organizationId: SEED_IDS.gulistonMarketOrgId,
      title: "Qozog'iston 1-nav bug'doy uni (50 kg qop)",
      brand: 'Qozoq Un',
      category: 'Oziq-ovqat',
      packSize: '50 kg',
      packUnit: 'qop',
      barcode: '47800019',
      sku: 'UN-QOZ-050',
      photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=80',
      aliases: ['un', 'qop un', 'qozoq un', '50 kg un', 'мука 50кг']
    }
  ];
  for (const v of variants) {
    database.variants.set(v.id, v);
  }

  // 3. Stores
  const defaultHours = [
    { dayOfWeek: 0, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 1, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 2, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 3, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 4, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 5, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 6, openTime: '08:00', closeTime: '23:00', isClosed: false }
  ];
  const roundTheClockHours = [
    { dayOfWeek: 0, openTime: '00:00', closeTime: '23:59', isClosed: false },
    { dayOfWeek: 1, openTime: '00:00', closeTime: '23:59', isClosed: false },
    { dayOfWeek: 2, openTime: '00:00', closeTime: '23:59', isClosed: false },
    { dayOfWeek: 3, openTime: '00:00', closeTime: '23:59', isClosed: false },
    { dayOfWeek: 4, openTime: '00:00', closeTime: '23:59', isClosed: false },
    { dayOfWeek: 5, openTime: '00:00', closeTime: '23:59', isClosed: false },
    { dayOfWeek: 6, openTime: '00:00', closeTime: '23:59', isClosed: false }
  ];

  const stores: Store[] = [
    {
      id: SEED_IDS.sirdaryoPharmStoreId,
      organizationId: SEED_IDS.sirdaryoPharmOrgId,
      name: '999 Dorixona (Guliston Markaz)',
      inn: '309999111',
      region: 'Sirdaryo viloyati',
      city: 'Guliston shahri',
      district: 'Sayhun MFY',
      address: 'Islom Karimov shoh ko‘chasi, 45-uy, Guliston shahri',
      phone: '+998 67 225 10 20',
      location: { lat: 40.4905, lng: 68.7835 },
      entranceLocation: { lat: 40.4906, lng: 68.7836 },
      rating: 4.9,
      reviewCount: 54,
      isVerified: true,
      status: 'ACTIVE',
      type: 'PHARMACY',
      hours: defaultHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.grandPharmStoreId,
      organizationId: SEED_IDS.grandPharmOrgId,
      name: 'Grand Shifo Apteka (24/7)',
      inn: '309999222',
      region: 'Sirdaryo viloyati',
      city: 'Guliston shahri',
      district: 'Bog‘ishamol MFY',
      address: 'Mustaqillik ko‘chasi, 12-uy, Guliston shahri',
      phone: '+998 67 225 33 44',
      location: { lat: 40.4882, lng: 68.7860 },
      rating: 4.8,
      reviewCount: 38,
      isVerified: true,
      status: 'ACTIVE',
      type: 'PHARMACY',
      hours: roundTheClockHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.arzonPharmStoreId,
      organizationId: SEED_IDS.arzonPharmOrgId,
      name: 'Arzon Dorixona (Vokzal)',
      inn: '309999333',
      region: 'Sirdaryo viloyati',
      city: 'Guliston shahri',
      district: 'Temiryo‘l MFY',
      address: 'Temiryo‘lchilar ko‘chasi, 3-uy, Guliston vokzal yaqinida',
      phone: '+998 67 225 77 88',
      location: { lat: 40.4920, lng: 68.7810 },
      rating: 4.7,
      reviewCount: 29,
      isVerified: true,
      status: 'ACTIVE',
      type: 'PHARMACY',
      hours: defaultHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: SEED_IDS.gulistonMarketStoreId,
      organizationId: SEED_IDS.gulistonMarketOrgId,
      name: 'Guliston Supermarket',
      inn: '309999444',
      region: 'Sirdaryo viloyati',
      city: 'Guliston shahri',
      district: 'Taraqqiyot MFY',
      address: 'Navoiy shoh ko‘chasi, 18-uy, Guliston',
      phone: '+998 67 225 99 00',
      location: { lat: 40.4890, lng: 68.7850 },
      rating: 4.6,
      reviewCount: 19,
      isVerified: true,
      status: 'ACTIVE',
      type: 'RETAIL',
      hours: defaultHours,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  for (const s of stores) {
    database.stores.set(s.id, s);
  }

  // 4. Offers
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const offersList = [
    // 999 Dorixona
    { storeId: SEED_IDS.sirdaryoPharmStoreId, variantId: SEED_IDS.tsitramonVariantId, price: '3000.00', stockOnHand: 50 },
    { storeId: SEED_IDS.sirdaryoPharmStoreId, variantId: SEED_IDS.paratsetamolVariantId, price: '2500.00', stockOnHand: 60 },
    { storeId: SEED_IDS.sirdaryoPharmStoreId, variantId: SEED_IDS.aspirinVariantId, price: '18000.00', stockOnHand: 35 },
    { storeId: SEED_IDS.sirdaryoPharmStoreId, variantId: SEED_IDS.spasmalgonVariantId, price: '24000.00', stockOnHand: 40 },
    { storeId: SEED_IDS.sirdaryoPharmStoreId, variantId: SEED_IDS.amoksitsillinVariantId, price: '15000.00', stockOnHand: 25 },
    { storeId: SEED_IDS.sirdaryoPharmStoreId, variantId: SEED_IDS.nimesilVariantId, price: '85000.00', stockOnHand: 20 },

    // Grand Shifo Apteka (24/7)
    { storeId: SEED_IDS.grandPharmStoreId, variantId: SEED_IDS.tsitramonVariantId, price: '2800.00', stockOnHand: 40 },
    { storeId: SEED_IDS.grandPharmStoreId, variantId: SEED_IDS.paratsetamolVariantId, price: '2200.00', stockOnHand: 80 },
    { storeId: SEED_IDS.grandPharmStoreId, variantId: SEED_IDS.spasmalgonVariantId, price: '23000.00', stockOnHand: 30 },
    { storeId: SEED_IDS.grandPharmStoreId, variantId: SEED_IDS.nimesilVariantId, price: '82000.00', stockOnHand: 15 },

    // Arzon Dorixona
    { storeId: SEED_IDS.arzonPharmStoreId, variantId: SEED_IDS.tsitramonVariantId, price: '2500.00', stockOnHand: 100 },
    { storeId: SEED_IDS.arzonPharmStoreId, variantId: SEED_IDS.paratsetamolVariantId, price: '2000.00', stockOnHand: 120 },
    { storeId: SEED_IDS.arzonPharmStoreId, variantId: SEED_IDS.aspirinVariantId, price: '17500.00', stockOnHand: 45 },
    { storeId: SEED_IDS.arzonPharmStoreId, variantId: SEED_IDS.amoksitsillinVariantId, price: '14000.00', stockOnHand: 30 },

    // Guliston Supermarket
    { storeId: SEED_IDS.gulistonMarketStoreId, variantId: SEED_IDS.snickers50gVariantId, price: '8500.00', stockOnHand: 50 },
    { storeId: SEED_IDS.gulistonMarketStoreId, variantId: SEED_IDS.cola15lVariantId, price: '14000.00', stockOnHand: 40 },
    { storeId: SEED_IDS.gulistonMarketStoreId, variantId: SEED_IDS.nonVariantId, price: '3500.00', stockOnHand: 100 },
    { storeId: SEED_IDS.gulistonMarketStoreId, variantId: SEED_IDS.sutVariantId, price: '11500.00', stockOnHand: 60 },
    { storeId: SEED_IDS.gulistonMarketStoreId, variantId: SEED_IDS.yogVariantId, price: '16000.00', stockOnHand: 45 },
    { storeId: SEED_IDS.gulistonMarketStoreId, variantId: SEED_IDS.shakarVariantId, price: '12000.00', stockOnHand: 80 },
    { storeId: SEED_IDS.gulistonMarketStoreId, variantId: SEED_IDS.choyVariantId, price: '18000.00', stockOnHand: 35 },
    { storeId: SEED_IDS.gulistonMarketStoreId, variantId: SEED_IDS.tuxumVariantId, price: '14000.00', stockOnHand: 50 },
    { storeId: SEED_IDS.gulistonMarketStoreId, variantId: SEED_IDS.unVariantId, price: '7500.00', stockOnHand: 150 },
    { storeId: SEED_IDS.gulistonMarketStoreId, variantId: SEED_IDS.unMakfaVariantId, price: '19000.00', stockOnHand: 60 },
    { storeId: SEED_IDS.gulistonMarketStoreId, variantId: SEED_IDS.unQozoqVariantId, price: '340000.00', stockOnHand: 25 }
  ];

  for (const item of offersList) {
    const variant = database.variants.get(item.variantId)!;
    const offerId = stableOfferId(item.storeId, item.variantId);
    const off: Offer = {
      id: offerId,
      storeId: item.storeId,
      variantId: item.variantId,
      variant,
      price: item.price,
      minOrderQuantity: 1,
      stockOnHand: item.stockOnHand,
      stockVerifiedAt: tenMinutesAgo,
      priceUpdatedAt: tenMinutesAgo,
      freshness: database.computeFreshness(tenMinutesAgo),
      status: 'ACTIVE',
      wholesaleTiers: [],
      version: 1
    };
    database.offers.set(off.id, off);
    database.balances.set(off.id, {
      offerId: off.id,
      onHand: new Decimal(item.stockOnHand),
      averageUnitCost: new Decimal(item.price).times(0.75).toDecimalPlaces(2),
      lastVerifiedAt: new Date(tenMinutesAgo),
      version: 1
    });
  }

  console.log(`[Pilot Bootstrap] ✅ 4 ta Sirdaryo do‘koni va ${offersList.length} ta dori-darmon taklifi yuklandi.`);

  // If Supabase write is permitted, commit to Supabase cloud
  const { isSupabaseWriteAllowed, syncAllToSupabase } = await import('./supabase.js');
  if (isSupabaseWriteAllowed()) {
    try {
      await syncAllToSupabase(database);
      console.log('[Pilot Bootstrap] ✅ Supabase Cloud bazasiga muvaffaqiyatli sinxronlandi.');
    } catch (err: any) {
      console.warn('[Pilot Bootstrap] Supabase Cloudga yozishda ogohlantirish:', err.message);
    }
  }

  return true;
}


export async function bootstrapSurxondaryoStores(database = db): Promise<boolean> {
  if (database.stores.has('surx-store-angor-pharm-1')) {
    return false;
  }

  console.log('[Surxondaryo Bootstrap] Angor, Termiz, Denov va tumanlar do‘konlari yuklanmoqda...');

  const defaultHours = [
    { dayOfWeek: 0, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 1, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 2, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 3, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 4, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 5, openTime: '08:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 6, openTime: '08:00', closeTime: '23:00', isClosed: false }
  ];

  const roundTheClockHours = [
    { dayOfWeek: 0, openTime: '00:00', closeTime: '23:59', isClosed: false },
    { dayOfWeek: 1, openTime: '00:00', closeTime: '23:59', isClosed: false },
    { dayOfWeek: 2, openTime: '00:00', closeTime: '23:59', isClosed: false },
    { dayOfWeek: 3, openTime: '00:00', closeTime: '23:59', isClosed: false },
    { dayOfWeek: 4, openTime: '00:00', closeTime: '23:59', isClosed: false },
    { dayOfWeek: 5, openTime: '00:00', closeTime: '23:59', isClosed: false },
    { dayOfWeek: 6, openTime: '00:00', closeTime: '23:59', isClosed: false }
  ];

  const surxStoresConfig = [
    // --- ANGOR TUMANI ---
    {
      orgId: 'surx-org-angor-pharm-1',
      orgName: '999 Shifo Farm Angor MCHJ',
      orgInn: '307111001',
      storeId: 'surx-store-angor-pharm-1',
      storeName: '999 Shifo Dorixona (Angor Markaz)',
      type: 'PHARMACY' as const,
      region: 'Surxondaryo viloyati',
      city: 'Angor',
      district: 'Angor tumani',
      address: "At-Termiziy ko'chasi, 14-uy, Angor markazi",
      phone: '+998 76 312 11 22',
      lat: 37.4528,
      lng: 67.1512,
      rating: 4.9,
      reviewCount: 48,
      hours: roundTheClockHours
    },
    {
      orgId: 'surx-org-angor-retail-1',
      orgName: 'Baraka Savdo XK',
      orgInn: '307111002',
      storeId: 'surx-store-angor-retail-1',
      storeName: 'Baraka Supermarket (Angor)',
      type: 'RETAIL' as const,
      region: 'Surxondaryo viloyati',
      city: 'Angor',
      district: 'Angor tumani',
      address: "Mustaqillik shoh ko'chasi, 25-uy, Angor",
      phone: '+998 76 312 33 44',
      lat: 37.4540,
      lng: 67.1545,
      rating: 4.8,
      reviewCount: 37,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-angor-bozor-1',
      orgName: 'Angor Markaziy Dehqon Bozori DUK',
      orgInn: '307111003',
      storeId: 'surx-store-angor-bozor-1',
      storeName: 'Angor Dehqon Bozori Savdo Majmuasi',
      type: 'RETAIL' as const,
      region: 'Surxondaryo viloyati',
      city: 'Angor',
      district: 'Angor tumani',
      address: "Bozor ko'chasi, 1-uy, Angor",
      phone: '+998 76 312 55 66',
      lat: 37.4495,
      lng: 67.1485,
      rating: 4.7,
      reviewCount: 65,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-angor-cafe-1',
      orgName: 'Shodlik Milliy Taomlar MCHJ',
      orgInn: '307111004',
      storeId: 'surx-store-angor-cafe-1',
      storeName: 'Shodlik Milliy Taomlar & Choyxona',
      type: 'RESTAURANT' as const,
      region: 'Surxondaryo viloyati',
      city: 'Angor',
      district: 'Angor tumani',
      address: "At-Termiziy ko'chasi, 40-uy, Angor",
      phone: '+998 97 530 12 34',
      lat: 37.4515,
      lng: 67.1520,
      rating: 4.9,
      reviewCount: 31,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-angor-game-1',
      orgName: 'CyberArena Angor XK',
      orgInn: '307111005',
      storeId: 'surx-store-angor-game-1',
      storeName: 'CyberArena Angor PS5 & Cybersport',
      type: 'GAME_CLUB' as const,
      region: 'Surxondaryo viloyati',
      city: 'Angor',
      district: 'Angor tumani',
      address: "Navro'z ko'chasi, 8-uy, Angor markazi",
      phone: '+998 90 645 88 99',
      lat: 37.4535,
      lng: 67.1505,
      rating: 4.8,
      reviewCount: 24,
      hours: roundTheClockHours
    },
    {
      orgId: 'surx-org-angor-auto-1',
      orgName: 'Angor Grand Avto MCHJ',
      orgInn: '307111006',
      storeId: 'surx-store-angor-auto-1',
      storeName: 'Angor Grand Avtoservis va Moylash',
      type: 'AUTO_SERVICE' as const,
      region: 'Surxondaryo viloyati',
      city: 'Angor',
      district: 'Angor tumani',
      address: "M39 magistral yo'li yoqasi, Angor tumani",
      phone: '+998 91 582 77 00',
      lat: 37.4470,
      lng: 67.1560,
      rating: 4.6,
      reviewCount: 19,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-angor-salon-1',
      orgName: 'Guzal Go‘zallik Saloni XK',
      orgInn: '307111007',
      storeId: 'surx-store-angor-salon-1',
      storeName: "Guzal Go'zallik Saloni & Sartaroshxona",
      type: 'BEAUTY_SALON' as const,
      region: 'Surxondaryo viloyati',
      city: 'Angor',
      district: 'Angor tumani',
      address: "Taraqqiyot ko'chasi, 6-uy, Angor",
      phone: '+998 93 790 44 55',
      lat: 37.4520,
      lng: 67.1535,
      rating: 4.8,
      reviewCount: 28,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-angor-texno-1',
      orgName: 'Texnomart Savdo MCHJ',
      orgInn: '307111008',
      storeId: 'surx-store-angor-texno-1',
      storeName: 'Texnomart Maishiy Texnika (Angor)',
      type: 'RETAIL' as const,
      region: 'Surxondaryo viloyati',
      city: 'Angor',
      district: 'Angor tumani',
      address: "At-Termiziy ko'chasi, 19-uy, Angor",
      phone: '+998 71 209 99 44',
      lat: 37.4550,
      lng: 67.1518,
      rating: 4.7,
      reviewCount: 40,
      hours: defaultHours
    },

    // --- TERMIZ SHAHRI (MARKAZ) ---
    {
      orgId: 'surx-org-termiz-pharm-1',
      orgName: 'Orom Farm Termiz MCHJ',
      orgInn: '307222001',
      storeId: 'surx-store-termiz-pharm-1',
      storeName: '999 Orom Dorixona (Termiz Markaz)',
      type: 'PHARMACY' as const,
      region: 'Surxondaryo viloyati',
      city: 'Termiz shahri',
      district: 'Termiz shahri (Markaz)',
      address: "At-Termiziy shoh ko'chasi, 10-uy, Termiz",
      phone: '+998 76 221 44 55',
      lat: 37.2290,
      lng: 67.2760,
      rating: 4.9,
      reviewCount: 88,
      hours: roundTheClockHours
    },
    {
      orgId: 'surx-org-termiz-retail-1',
      orgName: 'Surxon Savdo Majmuasi MCHJ',
      orgInn: '307222002',
      storeId: 'surx-store-termiz-retail-1',
      storeName: 'Surxon Grand Supermarket',
      type: 'RETAIL' as const,
      region: 'Surxondaryo viloyati',
      city: 'Termiz shahri',
      district: 'Termiz shahri (Markaz)',
      address: "Al-Hakim At-Termiziy ko'chasi, 45-uy, Termiz",
      phone: '+998 76 223 10 20',
      lat: 37.2260,
      lng: 67.2740,
      rating: 4.8,
      reviewCount: 112,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-termiz-cafe-1',
      orgName: 'Termiz Milliy Oshxona XK',
      orgInn: '307222003',
      storeId: 'surx-store-termiz-cafe-1',
      storeName: 'Al-Hakim Milliy Taomlar & Choyxona',
      type: 'RESTAURANT' as const,
      region: 'Surxondaryo viloyati',
      city: 'Termiz shahri',
      district: 'Termiz shahri (Markaz)',
      address: "Mustaqillik ko'chasi, 18-uy, Termiz",
      phone: '+998 90 520 33 44',
      lat: 37.2310,
      lng: 67.2780,
      rating: 4.9,
      reviewCount: 76,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-termiz-game-1',
      orgName: 'Termiz Cybersport Arena XK',
      orgInn: '307222004',
      storeId: 'surx-store-termiz-game-1',
      storeName: 'Termiz Cybersport & PS5 Arena',
      type: 'GAME_CLUB' as const,
      region: 'Surxondaryo viloyati',
      city: 'Termiz shahri',
      district: 'Termiz shahri (Markaz)',
      address: "Taraqqiyot ko'chasi, 3-uy, Termiz",
      phone: '+998 91 580 99 11',
      lat: 37.2250,
      lng: 67.2720,
      rating: 4.8,
      reviewCount: 54,
      hours: roundTheClockHours
    },

    // --- DENOV SHAHRI / TUMANI ---
    {
      orgId: 'surx-org-denov-pharm-1',
      orgName: 'Denov Shifo Farm MCHJ',
      orgInn: '307333001',
      storeId: 'surx-store-denov-pharm-1',
      storeName: 'Denov 999 Shifo Dorixona',
      type: 'PHARMACY' as const,
      region: 'Surxondaryo viloyati',
      city: 'Denov shahri',
      district: 'Denov shahri / tumani',
      address: "Sharaf Rashidov ko'chasi, 22-uy, Denov",
      phone: '+998 76 414 12 34',
      lat: 38.2770,
      lng: 67.8990,
      rating: 4.9,
      reviewCount: 65,
      hours: roundTheClockHours
    },
    {
      orgId: 'surx-org-denov-retail-1',
      orgName: 'Denov Savdo Majmuasi MCHJ',
      orgInn: '307333002',
      storeId: 'surx-store-denov-retail-1',
      storeName: 'Denov Markaziy Dehqon Bozori va Savdo',
      type: 'RETAIL' as const,
      region: 'Surxondaryo viloyati',
      city: 'Denov shahri',
      district: 'Denov shahri / tumani',
      address: "Mustaqillik ko'chasi, 1-uy, Denov",
      phone: '+998 76 414 55 66',
      lat: 38.2750,
      lng: 67.8970,
      rating: 4.8,
      reviewCount: 98,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-denov-cafe-1',
      orgName: 'Denov Milliy Oshxona MCHJ',
      orgInn: '307333003',
      storeId: 'surx-store-denov-cafe-1',
      storeName: 'Denov Milliy Taomlar & Kabob',
      type: 'RESTAURANT' as const,
      region: 'Surxondaryo viloyati',
      city: 'Denov shahri',
      district: 'Denov shahri / tumani',
      address: "Bobur shoh ko'chasi, 15-uy, Denov",
      phone: '+998 91 585 33 22',
      lat: 38.2790,
      lng: 67.9010,
      rating: 4.9,
      reviewCount: 47,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-denov-game-1',
      orgName: 'Denov Game Club XK',
      orgInn: '307333004',
      storeId: 'surx-store-denov-game-1',
      storeName: 'Denov Game Zone PlayStation 5',
      type: 'GAME_CLUB' as const,
      region: 'Surxondaryo viloyati',
      city: 'Denov shahri',
      district: 'Denov shahri / tumani',
      address: "Samarqand ko'chasi, 8-uy, Denov",
      phone: '+998 90 710 44 55',
      lat: 38.2740,
      lng: 67.8960,
      rating: 4.8,
      reviewCount: 42,
      hours: roundTheClockHours
    },

    // --- OTHER DISTRICTS ---
    {
      orgId: 'surx-org-sherobod-pharm-1',
      orgName: 'Sherobod Shifo Farm MCHJ',
      orgInn: '307444001',
      storeId: 'surx-store-sherobod-pharm-1',
      storeName: 'Sherobod 999 Shifo Dorixona',
      type: 'PHARMACY' as const,
      region: 'Surxondaryo viloyati',
      city: 'Sherobod',
      district: 'Sherobod tumani',
      address: "Mustaqillik ko'chasi, 12-uy, Sherobod",
      phone: '+998 76 322 10 20',
      lat: 37.6670,
      lng: 67.0010,
      rating: 4.8,
      reviewCount: 39,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-sherobod-retail-1',
      orgName: 'Sherobod Savdo XK',
      orgInn: '307444002',
      storeId: 'surx-store-sherobod-retail-1',
      storeName: 'Sherobod Baraka Supermarket',
      type: 'RETAIL' as const,
      region: 'Surxondaryo viloyati',
      city: 'Sherobod',
      district: 'Sherobod tumani',
      address: "Termiz shoh ko'chasi, 5-uy, Sherobod",
      phone: '+998 76 322 30 40',
      lat: 37.6655,
      lng: 66.9990,
      rating: 4.7,
      reviewCount: 31,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-boysun-pharm-1',
      orgName: 'Boysun Shifo Apteka XK',
      orgInn: '307555001',
      storeId: 'surx-store-boysun-pharm-1',
      storeName: 'Boysun Shifo Apteka',
      type: 'PHARMACY' as const,
      region: 'Surxondaryo viloyati',
      city: 'Boysun',
      district: 'Boysun tumani',
      address: "Alpomish ko'chasi, 7-uy, Boysun",
      phone: '+998 76 332 15 25',
      lat: 38.2010,
      lng: 67.2020,
      rating: 4.8,
      reviewCount: 33,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-boysun-retail-1',
      orgName: 'Boysun Savdo MCHJ',
      orgInn: '307555002',
      storeId: 'surx-store-boysun-retail-1',
      storeName: "Boysun Tog' Gavhari Supermarket",
      type: 'RETAIL' as const,
      region: 'Surxondaryo viloyati',
      city: 'Boysun',
      district: 'Boysun tumani',
      address: "Mustaqillik ko'chasi, 19-uy, Boysun",
      phone: '+998 76 332 40 50',
      lat: 38.1990,
      lng: 67.1980,
      rating: 4.7,
      reviewCount: 27,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-jarqorgon-pharm-1',
      orgName: 'Jarqo‘rg‘on Dorixona XK',
      orgInn: '307666001',
      storeId: 'surx-store-jarqorgon-pharm-1',
      storeName: "Jarqo'rg'on Markaziy Dorixona",
      type: 'PHARMACY' as const,
      region: 'Surxondaryo viloyati',
      city: "Jarqo'rg'on",
      district: "Jarqo'rg'on tumani",
      address: "Surxon ko'chasi, 11-uy, Jarqo'rg'on",
      phone: '+998 76 342 12 34',
      lat: 37.5010,
      lng: 67.4170,
      rating: 4.8,
      reviewCount: 36,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-jarqorgon-retail-1',
      orgName: 'Jarqo‘rg‘on Savdo XK',
      orgInn: '307666002',
      storeId: 'surx-store-jarqorgon-retail-1',
      storeName: "Jarqo'rg'on Savdo Markazi",
      type: 'RETAIL' as const,
      region: 'Surxondaryo viloyati',
      city: "Jarqo'rg'on",
      district: "Jarqo'rg'on tumani",
      address: "Markaz ko'chasi, 2-uy, Jarqo'rg'on",
      phone: '+998 76 342 55 66',
      lat: 37.4990,
      lng: 67.4150,
      rating: 4.6,
      reviewCount: 29,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-qumqorgon-pharm-1',
      orgName: 'Qumqo‘rg‘on Shifo MCHJ',
      orgInn: '307777001',
      storeId: 'surx-store-qumqorgon-pharm-1',
      storeName: "Qumqo'rg'on 999 Dorixona",
      type: 'PHARMACY' as const,
      region: 'Surxondaryo viloyati',
      city: "Qumqo'rg'on",
      district: "Qumqo'rg'on tumani",
      address: "Navoiy ko'chasi, 16-uy, Qumqo'rg'on",
      phone: '+998 76 352 11 00',
      lat: 37.8170,
      lng: 67.5840,
      rating: 4.8,
      reviewCount: 34,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-qumqorgon-retail-1',
      orgName: 'Qumqo‘rg‘on Dehqon Bozori DUK',
      orgInn: '307777002',
      storeId: 'surx-store-qumqorgon-retail-1',
      storeName: "Qumqo'rg'on Dehqon Bozori",
      type: 'RETAIL' as const,
      region: 'Surxondaryo viloyati',
      city: "Qumqo'rg'on",
      district: "Qumqo'rg'on tumani",
      address: "Bozor maydoni, 1-uy, Qumqo'rg'on",
      phone: '+998 76 352 33 44',
      lat: 37.8150,
      lng: 67.5820,
      rating: 4.7,
      reviewCount: 45,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-shorchi-pharm-1',
      orgName: 'Sho‘rchi Dori Savdo MCHJ',
      orgInn: '307888001',
      storeId: 'surx-store-shorchi-pharm-1',
      storeName: "Sho'rchi Shifo Dorixona",
      type: 'PHARMACY' as const,
      region: 'Surxondaryo viloyati',
      city: "Sho'rchi",
      district: "Sho‘rchi tumani",
      address: "Mustaqillik ko'chasi, 21-uy, Sho'rchi",
      phone: '+998 76 362 14 55',
      lat: 38.0010,
      lng: 67.7840,
      rating: 4.8,
      reviewCount: 30,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-shorchi-retail-1',
      orgName: 'Sho‘rchi Savdo XK',
      orgInn: '307888002',
      storeId: 'surx-store-shorchi-retail-1',
      storeName: "Sho'rchi Baraka Market",
      type: 'RETAIL' as const,
      region: 'Surxondaryo viloyati',
      city: "Sho'rchi",
      district: "Sho‘rchi tumani",
      address: "Markaz ko'chasi, 9-uy, Sho'rchi",
      phone: '+998 76 362 66 77',
      lat: 37.9990,
      lng: 67.7820,
      rating: 4.7,
      reviewCount: 26,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-sariosiyo-pharm-1',
      orgName: 'Sariosiyo Shifo MCHJ',
      orgInn: '307999001',
      storeId: 'surx-store-sariosiyo-pharm-1',
      storeName: 'Sariosiyo Markaziy Dorixona',
      type: 'PHARMACY' as const,
      region: 'Surxondaryo viloyati',
      city: 'Sariosiyo',
      district: 'Sariosiyo tumani',
      address: "Bobur ko'chasi, 14-uy, Sariosiyo",
      phone: '+998 76 372 18 99',
      lat: 38.4510,
      lng: 67.9510,
      rating: 4.8,
      reviewCount: 35,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-sariosiyo-retail-1',
      orgName: 'Sariosiyo Savdo Majmuasi XK',
      orgInn: '307999002',
      storeId: 'surx-store-sariosiyo-retail-1',
      storeName: 'Sariosiyo Savdo Markazi',
      type: 'RETAIL' as const,
      region: 'Surxondaryo viloyati',
      city: 'Sariosiyo',
      district: 'Sariosiyo tumani',
      address: "Mustaqillik shoh ko'chasi, 8-uy, Sariosiyo",
      phone: '+998 76 372 33 22',
      lat: 38.4490,
      lng: 67.9490,
      rating: 4.7,
      reviewCount: 32,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-muzrabot-pharm-1',
      orgName: 'Muzrabot Dori XK',
      orgInn: '307123001',
      storeId: 'surx-store-muzrabot-pharm-1',
      storeName: 'Muzrabot Shifo Apteka',
      type: 'PHARMACY' as const,
      region: 'Surxondaryo viloyati',
      city: 'Muzrabot',
      district: 'Muzrabot tumani',
      address: "Xalqlar Do'stligi ko'chasi, 5-uy, Muzrabot",
      phone: '+998 76 382 12 11',
      lat: 37.3340,
      lng: 66.9010,
      rating: 4.8,
      reviewCount: 28,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-muzrabot-retail-1',
      orgName: 'Muzrabot Savdo MCHJ',
      orgInn: '307123002',
      storeId: 'surx-store-muzrabot-retail-1',
      storeName: 'Muzrabot Markaziy Supermarket',
      type: 'RETAIL' as const,
      region: 'Surxondaryo viloyati',
      city: 'Muzrabot',
      district: 'Muzrabot tumani',
      address: "Markaz ko'chasi, 12-uy, Muzrabot",
      phone: '+998 76 382 44 55',
      lat: 37.3320,
      lng: 66.8990,
      rating: 4.6,
      reviewCount: 22,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-uzun-pharm-1',
      orgName: 'Uzun Farm XK',
      orgInn: '307234001',
      storeId: 'surx-store-uzun-pharm-1',
      storeName: 'Uzun Shifo Dorixona',
      type: 'PHARMACY' as const,
      region: 'Surxondaryo viloyati',
      city: 'Uzun',
      district: 'Uzun tumani',
      address: "Mustaqillik ko'chasi, 20-uy, Uzun",
      phone: '+998 76 392 10 90',
      lat: 38.3840,
      lng: 68.0840,
      rating: 4.8,
      reviewCount: 29,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-uzun-retail-1',
      orgName: 'Uzun Savdo MCHJ',
      orgInn: '307234002',
      storeId: 'surx-store-uzun-retail-1',
      storeName: 'Uzun Dehqon Bozori va Market',
      type: 'RETAIL' as const,
      region: 'Surxondaryo viloyati',
      city: 'Uzun',
      district: 'Uzun tumani',
      address: "Bozor ko'chasi, 4-uy, Uzun",
      phone: '+998 76 392 33 77',
      lat: 38.3820,
      lng: 68.0820,
      rating: 4.7,
      reviewCount: 31,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-oltinsoy-pharm-1',
      orgName: 'Oltinsoy Shifo XK',
      orgInn: '307345001',
      storeId: 'surx-store-oltinsoy-pharm-1',
      storeName: 'Oltinsoy Dorixona',
      type: 'PHARMACY' as const,
      region: 'Surxondaryo viloyati',
      city: 'Oltinsoy',
      district: 'Oltinsoy tumani',
      address: "Bo'ston ko'chasi, 6-uy, Oltinsoy",
      phone: '+998 76 402 11 22',
      lat: 38.2170,
      lng: 67.8170,
      rating: 4.8,
      reviewCount: 25,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-oltinsoy-retail-1',
      orgName: 'Oltinsoy Baraka MCHJ',
      orgInn: '307345002',
      storeId: 'surx-store-oltinsoy-retail-1',
      storeName: 'Oltinsoy Baraka Market',
      type: 'RETAIL' as const,
      region: 'Surxondaryo viloyati',
      city: 'Oltinsoy',
      district: 'Oltinsoy tumani',
      address: "Markaziy ko'cha, 15-uy, Oltinsoy",
      phone: '+998 76 402 44 33',
      lat: 38.2150,
      lng: 67.8150,
      rating: 4.7,
      reviewCount: 23,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-qiziriq-pharm-1',
      orgName: 'Qiziriq Dori Savdo MCHJ',
      orgInn: '307456001',
      storeId: 'surx-store-qiziriq-pharm-1',
      storeName: 'Qiziriq Shifo Apteka',
      type: 'PHARMACY' as const,
      region: 'Surxondaryo viloyati',
      city: 'Qiziriq',
      district: 'Qiziriq tumani',
      address: "Tinchlik ko'chasi, 8-uy, Qiziriq",
      phone: '+998 76 412 15 16',
      lat: 37.6170,
      lng: 67.3340,
      rating: 4.8,
      reviewCount: 26,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-qiziriq-retail-1',
      orgName: 'Qiziriq Savdo XK',
      orgInn: '307456002',
      storeId: 'surx-store-qiziriq-retail-1',
      storeName: 'Qiziriq Markaziy Savdo',
      type: 'RETAIL' as const,
      region: 'Surxondaryo viloyati',
      city: 'Qiziriq',
      district: 'Qiziriq tumani',
      address: "Surxon shoh ko'chasi, 11-uy, Qiziriq",
      phone: '+998 76 412 55 66',
      lat: 37.6150,
      lng: 67.3320,
      rating: 4.7,
      reviewCount: 21,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-bandixon-pharm-1',
      orgName: 'Bandixon Shifo Farm MCHJ',
      orgInn: '307567001',
      storeId: 'surx-store-bandixon-pharm-1',
      storeName: 'Bandixon 999 Dorixona',
      type: 'PHARMACY' as const,
      region: 'Surxondaryo viloyati',
      city: 'Bandixon',
      district: 'Bandixon tumani',
      address: "Mustaqillik ko'chasi, 3-uy, Bandixon",
      phone: '+998 76 422 10 10',
      lat: 37.8840,
      lng: 67.3840,
      rating: 4.8,
      reviewCount: 27,
      hours: defaultHours
    },
    {
      orgId: 'surx-org-bandixon-retail-1',
      orgName: 'Bandixon Savdo Majmuasi XK',
      orgInn: '307567002',
      storeId: 'surx-store-bandixon-retail-1',
      storeName: 'Bandixon Baraka Supermarket',
      type: 'RETAIL' as const,
      region: 'Surxondaryo viloyati',
      city: 'Bandixon',
      district: 'Bandixon tumani',
      address: "Markaz ko'chasi, 7-uy, Bandixon",
      phone: '+998 76 422 30 30',
      lat: 37.8820,
      lng: 67.3820,
      rating: 4.6,
      reviewCount: 20,
      hours: defaultHours
    }
  ];

  for (const c of surxStoresConfig) {
    if (!database.organizations.has(c.orgId)) {
      database.organizations.set(c.orgId, {
        id: c.orgId,
        name: c.orgName,
        inn: c.orgInn,
        region: c.region,
        city: c.city,
        district: c.district,
        type: c.type,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      });
    }

    if (!database.stores.has(c.storeId)) {
      database.stores.set(c.storeId, {
        id: c.storeId,
        organizationId: c.orgId,
        name: c.storeName,
        inn: c.orgInn,
        region: c.region,
        city: c.city,
        district: c.district,
        address: c.address,
        phone: c.phone,
        location: { lat: c.lat, lng: c.lng },
        entranceLocation: { lat: c.lat + 0.0001, lng: c.lng + 0.0001 },
        rating: c.rating,
        reviewCount: c.reviewCount,
        isVerified: true,
        status: 'ACTIVE',
        type: c.type,
        hours: c.hours,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  console.log('[Surxondaryo Bootstrap] ' + surxStoresConfig.length + ' ta Surxondaryo do\u2018kon va tashkilotlari yuklandi.');
  return true;
}
