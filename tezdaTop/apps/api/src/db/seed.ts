import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { db } from './in-memory-db.js';
import { Store, Variant, Offer, User } from '@yaqintop/contracts';

export const SEED_IDS = {
  navbahorOrgId: '11111111-1111-4111-a111-111111111111',
  navbahorStoreId: '22222222-2222-4222-a222-222222222222',
  mahallaStoreId: '33333333-3333-4333-a333-333333333333',
  barakaStoreId: '44444444-4444-4444-a444-444444444444',
  chorsuWholesaleStoreId: '55555555-5555-4555-a555-555555555555',
  pendingStoreId: '66666666-6666-4666-a666-666666666666',
  suspendedStoreId: '77777777-7777-4777-a777-777777777777',
  overnightStoreId: '88888888-8888-4888-a888-888888888888',

  snickers50gVariantId: 'aaaa1111-1111-4aaa-aaaa-111111111111',
  snickers80gVariantId: 'aaaa2222-2222-4aaa-aaaa-222222222222',
  mars50gVariantId: 'aaaa3333-3333-4aaa-aaaa-333333333333',
  twix50gVariantId: 'aaaa4444-4444-4aaa-aaaa-444444444444',
  bounty57gVariantId: 'aaaa5555-5555-4aaa-aaaa-555555555555',
  cola15lVariantId: 'aaaa6666-6666-4aaa-aaaa-666666666666',
  nesquik200gVariantId: 'aaaa7777-7777-4aaa-aaaa-777777777777',

  customerUserId: 'cccc1111-1111-4ccc-cccc-111111111111',
  ownerUserId: 'cccc2222-2222-4ccc-cccc-222222222222',
  operatorUserId: 'cccc3333-3333-4ccc-cccc-333333333333',
  moderatorUserId: 'cccc4444-4444-4ccc-cccc-444444444444',
  adminUserId: 'cccc5555-5555-4ccc-cccc-555555555555'
};

export async function seedDatabase() {
  console.log('Seeding YaqinTop database with synthetic Pilot Centre data...');

  // 1. Users
  const users: (User & { passwordHash: string })[] = [
    {
      id: SEED_IDS.customerUserId,
      email: 'customer@yaqintop.uz',
      fullName: 'Otabek Xaridor',
      phone: '+998901112233',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      passwordHash: 'DemoPass123!',
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
      passwordHash: 'DemoPass123!',
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
      passwordHash: 'DemoPass123!',
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
      passwordHash: 'DemoPass123!',
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
      passwordHash: 'DemoPass123!',
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
      aliases: ['nesquik', 'neskvik', 'kakao', 'несквик']
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
    }
  ];

  for (const od of offersData) {
    const variant = db.variants.get(od.variantId)!;
    const off: Offer = {
      id: od.id,
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
    requestedPassword: 'NewOperatorPass2026!',
    requestedPhone: '+998903334455',
    reason: 'Rasmiy korporativ elektron pochtaga o‘tkazish',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  });

  // 13. Seed Sample Notifications
  const notif1 = uuidv4();
  db.notifications.set(notif1, {
    id: notif1,
    userId: SEED_IDS.ownerUserId,
    title: 'Administrator xabari',
    message: 'Do‘koningizga administrator tomonidan yangi rasmiy so‘rov yuborildi. Iltimos, xabarlar bo‘limida ko‘rib chiqing.',
    type: 'INFO',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  const notif2 = uuidv4();
  db.notifications.set(notif2, {
    id: notif2,
    userId: SEED_IDS.customerUserId,
    title: 'Xush kelibsiz!',
    message: 'YaqinTop tizimiga muvaffaqiyatli ulandingiz. Yaqin atrofdagi tovarlarni izlashingiz mumkin.',
    type: 'SUCCESS',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  console.log('Database seeded successfully!');
}
