import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { db, DBDealer, DBDealerStore, DBDealerProduct, DBSupplyOrder, DBDebtTransaction } from '../db/in-memory-db.js';
import { Coordinates, Store, Offer, Variant, User } from '@yaqintop/contracts';
import { OSRMRoutingProvider } from './routing.service.js';
import { calculateDistanceMetres } from '../db/spatial.js';

const routingProvider = new OSRMRoutingProvider();

export class DealerService {
  private static atomically<T>(operation: () => T): T {
    const before = JSON.parse(JSON.stringify(db.exportSnapshot()));
    try { return operation(); } catch (error) { db.restoreSnapshot(before); throw error; }
  }
  public static createSupplyOrder(dealerId: string, data: Parameters<typeof DealerService.createSupplyOrderInternal>[1]) {
    return this.atomically(() => this.createSupplyOrderInternal(dealerId, data));
  }
  public static recordReturn(dealerId: string, data: Parameters<typeof DealerService.recordReturnInternal>[1]) {
    return this.atomically(() => this.recordReturnInternal(dealerId, data));
  }
  /**
   * Resolve dealer by user ID
   */
  public static getDealerByUserId(userId: string): DBDealer | null {
    return Array.from(db.dealers.values()).find(d => d.userId === userId) || null;
  }

  /**
   * Get all client stores for a dealer with enriched store metadata
   */
  public static getDealerStores(dealerId: string) {
    const dealerStores = Array.from(db.dealerStores.values()).filter(ds => ds.dealerId === dealerId);
    return dealerStores.map(ds => {
      const store = db.stores.get(ds.storeId);
      const debt = Number(ds.currentDebtBalance.toString());
      const limit = Number(ds.creditLimit.toString());

      // Evaluate debt color status:
      // GREEN: 0 debt
      // YELLOW: debt > 0 && debt <= creditLimit && not overdue
      // RED: debt > creditLimit OR overdue (> 7 days)
      let debtStatus: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
      const daysSinceSupply = ds.lastSupplyDate
        ? Math.floor((Date.now() - new Date(ds.lastSupplyDate).getTime()) / 86400000)
        : 0;

      if (debt > 0) {
        if (debt > limit || daysSinceSupply > 7) {
          debtStatus = 'RED';
        } else {
          debtStatus = 'YELLOW';
        }
      }

      const lat = store?.location?.lat || 41.311081;
      const lng = store?.location?.lng || 69.240562;

      return {
        id: ds.id,
        dealerId: ds.dealerId,
        storeId: ds.storeId,
        storeName: store?.name || 'Noma‘lum do‘kon',
        storeAddress: store?.address || '',
        storePhone: store?.phone || '',
        storeInn: store?.inn || '',
        category: store?.type || 'RETAIL',
        lat,
        lng,
        currentDebtBalance: debt,
        creditLimit: limit,
        lastSupplyDate: ds.lastSupplyDate,
        status: ds.status,
        debtStatus,
        daysSinceSupply,
        notes: ds.notes || '',
        createdAt: ds.createdAt
      };
    });
  }

  /**
   * Attach existing YaqinTop store to dealer's clients
   */
  public static attachStore(dealerId: string, identifier: string, creditLimit = 5000000, notes = '') {
    const cleanId = identifier.trim().toLowerCase();

    // Find store by exact id, or by INN, or by partial name
    let store = db.stores.get(cleanId);
    if (!store) {
      store = Array.from(db.stores.values()).find(s => {
        if (s.id.toLowerCase() === cleanId) return true;
        if (s.inn && s.inn.trim().toLowerCase() === cleanId) return true;
        if (s.name.toLowerCase().includes(cleanId)) return true;
        return false;
      });
    }

    if (!store) {
      throw new Error('Belgilangan do‘kon topilmadi (ID, STIR yoki nomi bo‘yicha qidiring)');
    }

    // Check if already attached
    const existing = Array.from(db.dealerStores.values()).find(
      ds => ds.dealerId === dealerId && ds.storeId === store!.id
    );

    if (existing) {
      return {
        dealerStore: existing,
        store,
        message: 'Ushbu do‘kon allaqachon mijozlaringiz ro‘yxatiga qo‘shilgan'
      };
    }

    const newDealerStoreId = uuidv4();
    const newDealerStore: DBDealerStore = {
      id: newDealerStoreId,
      dealerId,
      storeId: store.id,
      currentDebtBalance: new Decimal(0),
      creditLimit: new Decimal(creditLimit),
      lastSupplyDate: null,
      status: 'ACTIVE',
      notes,
      createdAt: new Date().toISOString()
    };

    db.dealerStores.set(newDealerStoreId, newDealerStore);
    db.scheduleSave();

    return {
      dealerStore: newDealerStore,
      store,
      message: 'Do‘kon mijozlaringiz ro‘yxatiga muvaffaqiyatli biriktirildi'
    };
  }

  /**
   * Create new Store pin on map and attach to dealer
   */
  public static createAndAttachStore(
    dealerId: string,
    data: {
      name: string;
      phone: string;
      address: string;
      lat: number;
      lng: number;
      inn?: string;
      creditLimit?: number;
      notes?: string;
      type?: string;
    }
  ) {
    if (!data.name || !data.address || !Number.isFinite(data.lat) || !Number.isFinite(data.lng) || Math.abs(data.lat) > 90 || Math.abs(data.lng) > 180) {
      throw new Error('Do‘kon nomi, manzili va xaritadagi koordinatalari kiritilishi shart');
    }

    const storeId = uuidv4();
    const newStore: Store = {
      id: storeId,
      organizationId: uuidv4(),
      name: data.name.trim(),
      inn: data.inn?.trim() || undefined,
      type: data.type || 'RETAIL',
      phone: data.phone?.trim() || '+998900000000',
      address: data.address.trim(),
      location: {
        lat: Number(data.lat),
        lng: Number(data.lng)
      },
      status: 'ACTIVE',
      rating: 5,
      reviewCount: 0,
      isVerified: true,
      hours: [
        { dayOfWeek: 1, openTime: '08:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 2, openTime: '08:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 3, openTime: '08:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 4, openTime: '08:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 5, openTime: '08:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 6, openTime: '08:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 0, openTime: '08:00', closeTime: '23:00', isClosed: false }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.organizations.set(newStore.organizationId, { id:newStore.organizationId,name:newStore.name,inn:data.inn,type:newStore.type || 'RETAIL',status:'ACTIVE',createdAt:newStore.createdAt });
    db.stores.set(storeId, newStore);

    const dsId = uuidv4();
    const newDealerStore: DBDealerStore = {
      id: dsId,
      dealerId,
      storeId,
      currentDebtBalance: new Decimal(0),
      creditLimit: new Decimal(data.creditLimit || 5000000),
      lastSupplyDate: null,
      status: 'ACTIVE',
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };

    db.dealerStores.set(dsId, newDealerStore);
    db.scheduleSave();

    return {
      store: newStore,
      dealerStore: newDealerStore
    };
  }

  /**
   * Statement of Account (Akt Sverka) for a specific store
   */
  public static getAktSverka(dealerId: string, storeId: string) {
    const dealerStore = Array.from(db.dealerStores.values()).find(
      ds => ds.dealerId === dealerId && ds.storeId === storeId
    );
    const store = db.stores.get(storeId);

    if (!dealerStore) {
      throw new Error('Mijoz do‘koni topilmadi');
    }

    const txs = Array.from(db.debtTransactions.values())
      .filter(tx => tx.dealerId === dealerId && tx.storeId === storeId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let totalSupplied = 0;
    let totalPaid = 0;
    let totalReturned = 0;

    const formattedTxs = txs.map(tx => {
      const amount = Number(tx.amount.toString());
      if (tx.type === 'SUPPLY') totalSupplied += amount;
      if (tx.type === 'PAYMENT') totalPaid += amount;
      if (tx.type === 'RETURN') totalReturned += amount;

      const order = tx.supplyOrderId ? db.supplyOrders.get(tx.supplyOrderId) : null;

      return {
        id: tx.id,
        date: tx.createdAt,
        type: tx.type,
        orderNumber: order?.orderNumber || null,
        supplyOrderId: tx.supplyOrderId || null,
        amount,
        balanceAfter: Number(tx.balanceAfter.toString()),
        comment: tx.comment,
        paymentMethod: tx.paymentMethod || null
      };
    });

    return {
      store: {
        id: storeId,
        name: store?.name || '',
        address: store?.address || '',
        phone: store?.phone || '',
        inn: store?.inn || '',
        creditLimit: Number(dealerStore.creditLimit.toString()),
        currentDebtBalance: Number(dealerStore.currentDebtBalance.toString()),
        lastSupplyDate: dealerStore.lastSupplyDate
      },
      summary: {
        totalSupplied,
        totalPaid,
        totalReturned,
        currentDebtBalance: Number(dealerStore.currentDebtBalance.toString())
      },
      transactions: formattedTxs
    };
  }

  /**
   * Create Supply Order (Nakladnoy) & synchronize B2C inventory
   */
  private static createSupplyOrderInternal(
    dealerId: string,
    data: {
      storeId: string;
      items: { productId: string; quantity: number; unitPrice: number }[];
      paidAmount: number;
      paymentType: 'CASH' | 'TRANSFER' | 'CARD' | 'DEBT' | 'PARTIAL';
      notes?: string;
    }
  ) {
    if (!data.storeId || !data.items || data.items.length === 0) {
      throw new Error('Do‘kon va kamida 1 ta tovar tanlanishi shart');
    }

    const dealerStore = Array.from(db.dealerStores.values()).find(
      ds => ds.dealerId === dealerId && ds.storeId === data.storeId
    );

    if (!dealerStore) {
      throw new Error('Ushbu do‘kon mijozlar bazangizda topilmadi. Avval uni biriktiring.');
    }

    if (dealerStore.status !== 'ACTIVE' || !db.stores.has(data.storeId)) throw new Error('Faol mijoz do‘koni topilmadi');
    if (!['CASH','TRANSFER','CARD','DEBT','PARTIAL'].includes(data.paymentType)) throw new Error('To‘lov turi noto‘g‘ri');
    const seenProducts = new Set<string>();
    let validatedTotal = new Decimal(0);
    for (const item of data.items) {
      const product = db.dealerProducts.get(item.productId);
      if (!product || product.dealerId !== dealerId || seenProducts.has(item.productId)) throw new Error('Mahsulot noto‘g‘ri yoki takrorlangan');
      seenProducts.add(item.productId);
      const quantity = new Decimal(item.quantity); const price = new Decimal(item.unitPrice ?? product.wholesalePrice);
      if (!quantity.isFinite() || quantity.lte(0) || !price.isFinite() || price.lt(0) || product.stockQuantity.lt(quantity)) throw new Error('Miqdor, narx yoki ombor qoldig‘i noto‘g‘ri');
      validatedTotal = validatedTotal.plus(quantity.times(price));
    }
    const payment = new Decimal(data.paidAmount ?? 0);
    if (!payment.isFinite() || payment.lt(0) || payment.gt(validatedTotal)) throw new Error('To‘lov summasi noto‘g‘ri');
    const store = db.stores.get(data.storeId);
    let totalAmountDec = new Decimal(0);
    const orderItems: DBSupplyOrder['items'] = [];
    const supplyOrderId = uuidv4();

    // Process items and adjust dealer product inventory
    for (const item of data.items) {
      const prod = db.dealerProducts.get(item.productId);
      if (!prod || prod.dealerId !== dealerId) {
        throw new Error(`Mahsulot topilmadi: ${item.productId}`);
      }

      const qtyDec = new Decimal(item.quantity);
      const priceDec = new Decimal(item.unitPrice ?? prod.wholesalePrice);
      const subtotalDec = qtyDec.times(priceDec);
      totalAmountDec = totalAmountDec.plus(subtotalDec);

      // Decrement dealer warehouse stock (floor at 0)
      prod.stockQuantity = prod.stockQuantity.minus(qtyDec);

      orderItems.push({
        id: uuidv4(),
        supplyOrderId,
        productId: prod.id,
        productName: prod.name,
        unit: prod.unit,
        quantity: qtyDec,
        unitPrice: priceDec,
        subtotal: subtotalDec
      });

      // ================= REQUIREMENT 6.2: YAQTINTOP B2C SYNC =================
      try {
        let matchedVariant = prod.globalProductId ? db.variants.get(prod.globalProductId) : null;
        if (!matchedVariant) {
          matchedVariant = Array.from(db.variants.values()).find(
            v => v.title.toLowerCase() === prod.name.toLowerCase()
          ) || null;
        }

        if (!matchedVariant) {
          const newVarId = uuidv4();
          matchedVariant = {
            id: newVarId,
            productId: uuidv4(),
            title: prod.name,
            brand: 'Mahalliy / Hamkor',
            category: prod.categoryName || 'Oziq-ovqat va ichimliklar',
            packUnit: prod.unit,
            barcode: prod.sku || undefined,
            description: 'Diller tomonidan yetkazib berilgan mahsulot'
          } as Variant;
          db.variants.set(newVarId, matchedVariant);
        }

        prod.globalProductId = matchedVariant.id;
        // Find or create Offer for store
        let offer = Array.from(db.offers.values()).find(
          o => o.storeId === data.storeId && o.variantId === matchedVariant!.id
        );

        const retailPriceEstimate = priceDec.times(1.2).round().toString(); // 20% estimated retail margin

        if (offer) {
          offer.status = 'ACTIVE';
          offer.stockOnHand = Number(offer.stockOnHand || 0) + Number(qtyDec.toString());
          offer.stockVerifiedAt = new Date().toISOString();
          const bal = db.balances.get(offer.id);
          if (bal) {
            bal.averageUnitCost = bal.onHand.times(bal.averageUnitCost).plus(qtyDec.times(priceDec)).div(bal.onHand.plus(qtyDec));
            bal.onHand = bal.onHand.plus(qtyDec);
            bal.version += 1;
            bal.lastVerifiedAt = new Date();
          }
        } else {
          const newOfferId = uuidv4();
          const createdOffer: Offer = {
            id: newOfferId,
            storeId: data.storeId,
            variantId: matchedVariant.id,
            variant: matchedVariant,
            price: retailPriceEstimate,
            minOrderQuantity: 1,
            stockOnHand: Number(qtyDec.toString()),
            stockVerifiedAt: new Date().toISOString(),
            priceUpdatedAt: new Date().toISOString(),
            freshness: 'NEW',
            status: 'ACTIVE',
            wholesaleTiers: [],
            version: 1
          };
          db.offers.set(newOfferId, createdOffer);
          db.balances.set(newOfferId, {
            offerId: newOfferId,
            onHand: qtyDec,
            averageUnitCost: priceDec,
            lastVerifiedAt: new Date(),
            version: 1
          });
        }
      } catch (syncErr) { throw syncErr; }
    }

    const paidDec = new Decimal(Math.min(data.paidAmount || 0, totalAmountDec.toNumber()));
    const debtDec = totalAmountDec.minus(paidDec);

    // Update dealer store debt and last supply date
    dealerStore.currentDebtBalance = dealerStore.currentDebtBalance.plus(debtDec);
    dealerStore.lastSupplyDate = new Date().toISOString();

    const orderNumber = `NAK-${1000 + db.supplyOrders.size + 1}`;
    const newOrder: DBSupplyOrder = {
      id: supplyOrderId,
      orderNumber,
      dealerId,
      storeId: data.storeId,
      totalAmount: totalAmountDec,
      paidAmount: paidDec,
      debtAmount: debtDec,
      paymentType: data.paymentType,
      status: 'DELIVERED',
      items: orderItems,
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };

    db.supplyOrders.set(supplyOrderId, newOrder);

    // Record debt transaction
    const txId = uuidv4();
    db.debtTransactions.set(txId, {
      id: txId,
      dealerId,
      storeId: data.storeId,
      supplyOrderId,
      type: 'SUPPLY',
      amount: debtDec.toNumber() > 0 ? debtDec : totalAmountDec,
      balanceAfter: dealerStore.currentDebtBalance,
      comment: `Yuk xati ${orderNumber}: Tovar topshirildi (Jami: ${totalAmountDec.toNumber().toLocaleString()} so‘m, To‘landi: ${paidDec.toNumber().toLocaleString()} so‘m)`,
      createdAt: new Date().toISOString()
    });

    db.scheduleSave();

    return {
      order: {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        dealerId: newOrder.dealerId,
        storeId: newOrder.storeId,
        storeName: store?.name || '',
        totalAmount: Number(newOrder.totalAmount.toString()),
        paidAmount: Number(newOrder.paidAmount.toString()),
        debtAmount: Number(newOrder.debtAmount.toString()),
        paymentType: newOrder.paymentType,
        status: newOrder.status,
        items: newOrder.items.map(it => ({
          id: it.id,
          productId: it.productId,
          productName: it.productName,
          unit: it.unit,
          quantity: Number(it.quantity.toString()),
          unitPrice: Number(it.unitPrice.toString()),
          subtotal: Number(it.subtotal.toString())
        })),
        notes: newOrder.notes,
        createdAt: newOrder.createdAt
      },
      currentDebtBalance: Number(dealerStore.currentDebtBalance.toString())
    };
  }

  /**
   * Cash collection / Inkassatsiya (debt payment)
   */
  public static recordPayment(
    dealerId: string,
    data: {
      storeId: string;
      amount: number;
      paymentMethod: 'CASH' | 'TRANSFER' | 'CARD';
      comment?: string;
    }
  ) {
    if (!data.storeId || !Number.isFinite(data.amount) || data.amount <= 0) {
      throw new Error('Do‘kon va to‘lov summasi to‘g‘ri kiritilishi shart');
    }

    const dealerStore = Array.from(db.dealerStores.values()).find(
      ds => ds.dealerId === dealerId && ds.storeId === data.storeId
    );

    if (!dealerStore) {
      throw new Error('Mijoz do‘koni topilmadi');
    }

    const amountDec = new Decimal(data.amount);
    if (amountDec.gt(dealerStore.currentDebtBalance)) throw new Error('To‘lov mavjud qarzdan katta');
    dealerStore.currentDebtBalance = Decimal.max(0, dealerStore.currentDebtBalance.minus(amountDec));

    const txId = uuidv4();
    db.debtTransactions.set(txId, {
      id: txId,
      dealerId,
      storeId: data.storeId,
      type: 'PAYMENT',
      amount: amountDec,
      balanceAfter: dealerStore.currentDebtBalance,
      comment: data.comment || `Inkassatsiya: Qarz qisman/to‘liq so‘ndirildi (${data.paymentMethod})`,
      paymentMethod: data.paymentMethod,
      createdAt: new Date().toISOString()
    });

    db.scheduleSave();

    return {
      success: true,
      paidAmount: data.amount,
      currentDebtBalance: Number(dealerStore.currentDebtBalance.toString()),
      message: 'To‘lov muvaffaqiyatli qabul qilindi va qarz balansidan ayirildi'
    };
  }

  /**
   * Return of unsold or damaged goods (Vozvrat)
   */
  private static recordReturnInternal(
    dealerId: string,
    data: {
      storeId: string;
      items: { productId: string; quantity: number; unitPrice?: number }[];
      comment?: string;
    }
  ) {
    if (!data.storeId || !data.items || data.items.length === 0) {
      throw new Error('Do‘kon va qaytariladigan tovarlar ko‘rsatilishi shart');
    }

    const dealerStore = Array.from(db.dealerStores.values()).find(
      ds => ds.dealerId === dealerId && ds.storeId === data.storeId
    );

    if (!dealerStore) {
      throw new Error('Mijoz do‘koni topilmadi');
    }

    let returnTotalDec = new Decimal(0);
    const seen = new Set<string>();
    const returnedItems: { productId: string; quantity: string; amount: string }[] = [];
    for (const item of data.items) {
      const prod = db.dealerProducts.get(item.productId);
      const quantity = new Decimal(item.quantity);
      if (!prod || prod.dealerId !== dealerId || seen.has(item.productId) || !quantity.isFinite() || quantity.lte(0)) throw new Error('Qaytarish miqdori yoki mahsulot noto‘g‘ri');
      seen.add(item.productId);
      const supplied = [...db.supplyOrders.values()].filter(o => o.dealerId === dealerId && o.storeId === data.storeId && o.status === 'DELIVERED').flatMap(o => o.items).filter(line => line.productId === item.productId);
      let remaining = quantity; let amount = new Decimal(0);
      const allocations: { line: any; quantity: Decimal }[] = [];
      for (const line of supplied) {
        const available = line.quantity.minus((line as any).returnedQuantity || 0);
        const take = Decimal.min(available, remaining);
        if (take.gt(0)) { allocations.push({line,quantity:take}); amount = amount.plus(take.times(line.unitPrice)); remaining = remaining.minus(take); }
        if (remaining.isZero()) break;
      }
      if (remaining.gt(0)) throw new Error('Qaytarish yetkazib berilgan qoldiqdan oshdi');
      const offer = [...db.offers.values()].find(o => o.storeId === data.storeId && o.variantId === prod.globalProductId);
      const balance = offer && db.balances.get(offer.id);
      if (balance && balance.onHand.lt(quantity)) throw new Error('Do‘konda qaytarish uchun qoldiq yetarli emas');
      for (const allocation of allocations) allocation.line.returnedQuantity = new Decimal(allocation.line.returnedQuantity || 0).plus(allocation.quantity);
      prod.stockQuantity = prod.stockQuantity.plus(quantity);
      if (balance && offer) { balance.onHand = balance.onHand.minus(quantity); balance.version++; offer.stockOnHand = balance.onHand.toNumber(); if (balance.onHand.isZero()) offer.status = 'OUT_OF_STOCK'; }
      returnTotalDec = returnTotalDec.plus(amount);
      returnedItems.push({productId:prod.id,quantity:quantity.toString(),amount:amount.toString()});
    }

    dealerStore.currentDebtBalance = Decimal.max(0, dealerStore.currentDebtBalance.minus(returnTotalDec));

    const txId = uuidv4();
    db.debtTransactions.set(txId, {
      id: txId,
      dealerId,
      storeId: data.storeId,
      type: 'RETURN',
      items: returnedItems,
      amount: returnTotalDec,
      balanceAfter: dealerStore.currentDebtBalance,
      comment: data.comment || `Vozvrat: Yaroqsiz yoki sotilmagan tovarlar qaytarib olindi`,
      createdAt: new Date().toISOString()
    });

    db.scheduleSave();

    return {
      success: true,
      returnTotal: Number(returnTotalDec.toString()),
      currentDebtBalance: Number(dealerStore.currentDebtBalance.toString()),
      message: 'Tovar muvaffaqiyatli qaytarildi va do‘kon qarzi kamaytirildi'
    };
  }

  /**
   * Analytics & Reports for Dashboard
   */
  public static getAnalytics(dealerId: string, period = 'month') {
    const now = Date.now();
    let startTime = 0;

    if (period === 'today') startTime = now - 86400000;
    else if (period === 'week') startTime = now - 7 * 86400000;
    else if (period === 'month') startTime = now - 30 * 86400000;
    else if (period === 'year') startTime = now - 365 * 86400000;

    const orders = Array.from(db.supplyOrders.values()).filter(
      o => o.dealerId === dealerId && (startTime === 0 || new Date(o.createdAt).getTime() >= startTime)
    );

    const payments = Array.from(db.debtTransactions.values()).filter(
      tx => tx.dealerId === dealerId && tx.type === 'PAYMENT' && (startTime === 0 || new Date(tx.createdAt).getTime() >= startTime)
    );

    const dealerStores = Array.from(db.dealerStores.values()).filter(ds => ds.dealerId === dealerId);

    let totalTurnover = 0;
    let totalCollected = 0;
    let totalDebtOutstanding = 0;

    orders.forEach(o => {
      totalTurnover += Number(o.totalAmount.toString());
      totalCollected += Number(o.paidAmount.toString());
    });

    payments.forEach(p => {
      totalCollected += Number(p.amount.toString());
    });

    dealerStores.forEach(ds => {
      totalDebtOutstanding += Number(ds.currentDebtBalance.toString());
    });

    // TOP Stores by volume
    const storeVolumeMap = new Map<string, number>();
    orders.forEach(o => {
      const cur = storeVolumeMap.get(o.storeId) || 0;
      storeVolumeMap.set(o.storeId, cur + Number(o.totalAmount.toString()));
    });

    const topStoresByVolume = Array.from(storeVolumeMap.entries())
      .map(([storeId, volume]) => {
        const store = db.stores.get(storeId);
        return {
          storeId,
          storeName: store?.name || 'Do‘kon',
          address: store?.address || '',
          volume
        };
      })
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);

    // TOP Debt Stores
    const topDebtStores = dealerStores
      .filter(ds => Number(ds.currentDebtBalance.toString()) > 0)
      .map(ds => {
        const store = db.stores.get(ds.storeId);
        return {
          storeId: ds.storeId,
          storeName: store?.name || 'Do‘kon',
          address: store?.address || '',
          phone: store?.phone || '',
          debt: Number(ds.currentDebtBalance.toString()),
          creditLimit: Number(ds.creditLimit.toString()),
          lastSupplyDate: ds.lastSupplyDate
        };
      })
      .sort((a, b) => b.debt - a.debt)
      .slice(0, 5);

    // TOP Products distributed
    const productStatsMap = new Map<string, { name: string; quantity: number; subtotal: number }>();
    orders.forEach(o => {
      o.items.forEach(it => {
        const prev = productStatsMap.get(it.productId) || { name: it.productName, quantity: 0, subtotal: 0 };
        productStatsMap.set(it.productId, {
          name: it.productName,
          quantity: prev.quantity + Number(it.quantity.toString()),
          subtotal: prev.subtotal + Number(it.subtotal.toString())
        });
      });
    });

    const topProducts = Array.from(productStatsMap.entries())
      .map(([productId, stat]) => ({
        productId,
        name: stat.name,
        quantity: stat.quantity,
        subtotal: stat.subtotal
      }))
      .sort((a, b) => b.subtotal - a.subtotal)
      .slice(0, 5);

    return {
      period,
      totalTurnover,
      totalCollected,
      totalDebtOutstanding,
      activeStoresCount: dealerStores.length,
      ordersCount: orders.length,
      topStoresByVolume,
      topDebtStores,
      topProducts
    };
  }

  /**
   * Multi-stop Route Optimization for Dealer deliveries
   */
  public static async calculateRoute(dealerId: string, storeIds: string[], origin?: Coordinates) {
    if (!storeIds || storeIds.length === 0) {
      throw new Error('Kamida 1 ta do‘kon tanlanishi kerak');
    }

    const stores = storeIds.map(id => db.stores.get(id)).filter(Boolean) as Store[];
    if (stores.length === 0) {
      throw new Error('Tanlangan do‘konlar koordinatalari topilmadi');
    }

    // Default start point: Yunusobod hub or dealer origin
    const startPoint: Coordinates = origin || { lat: 41.311081, lng: 69.240562 };

    // Nearest-Neighbor TSP heuristic to find optimal visitation sequence for multi-stop deliveries
    const remaining = [...stores];
    const orderedStores: Store[] = [];
    let curr = startPoint;
    while (remaining.length > 0) {
      let nearestIdx = 0;
      let minD = calculateDistanceMetres(curr.lat, curr.lng, remaining[0].location.lat, remaining[0].location.lng);
      for (let j = 1; j < remaining.length; j++) {
        const d = calculateDistanceMetres(curr.lat, curr.lng, remaining[j].location.lat, remaining[j].location.lng);
        if (d < minD) {
          minD = d;
          nearestIdx = j;
        }
      }
      const [nextStore] = remaining.splice(nearestIdx, 1);
      orderedStores.push(nextStore);
      curr = nextStore.location;
    }

    // Compute route segments sequentially along optimized stops
    let currentPoint = startPoint;
    const allGeometry: [number, number][] = [[currentPoint.lng, currentPoint.lat]];
    let totalDistanceM = 0;
    let totalDurationSec = 0;
    const allSteps: any[] = [];

    for (let i = 0; i < orderedStores.length; i++) {
      const destStore = orderedStores[i];
      const destCoords = destStore.location;

      try {
        const segment = await routingProvider.calculateRoute({
          origin: currentPoint,
          destination: destCoords,
          mode: 'driving'
        });

        totalDistanceM += segment.distanceM;
        totalDurationSec += segment.durationSec;
        allGeometry.push(...segment.geometry);
        allSteps.push({
          stepNumber: i + 1,
          storeName: destStore.name,
          address: destStore.address,
          distanceM: segment.distanceM,
          durationSec: segment.durationSec,
          instruction: `${destStore.name} tomon yo‘l oling`
        });
      } catch (err) {
        // Fallback straight-line
        const dist = calculateDistanceMetres(currentPoint.lat, currentPoint.lng, destCoords.lat, destCoords.lng);
        totalDistanceM += dist;
        totalDurationSec += Math.round(dist / 10);
        allGeometry.push([destCoords.lng, destCoords.lat]);
        allSteps.push({
          stepNumber: i + 1,
          storeName: destStore.name,
          address: destStore.address,
          distanceM: dist,
          durationSec: Math.round(dist / 10),
          instruction: `${destStore.name} ga borish`
        });
      }

      currentPoint = destCoords;
    }

    return {
      totalDistanceKm: (totalDistanceM / 1000).toFixed(1),
      totalDurationMin: Math.round(totalDurationSec / 60),
      stopsCount: stores.length,
      geometry: allGeometry,
      steps: allSteps
    };
  }

  /**
   * Mode 2: Experimental Global Goods Distribution Map
   * (Anonymized & Aggregated market saturation)
   */
  public static getGlobalGoodsDistribution(filters?: { category?: string; query?: string }) {
    const catFilter = filters?.category?.toLowerCase();
    const queryFilter = filters?.query?.toLowerCase();

    const results: any[] = [];

    for (const order of db.supplyOrders.values()) {
      if (order.status !== 'DELIVERED') continue;
      const store = db.stores.get(order.storeId);
      if (!store || !store.location) continue;

      for (const item of order.items) {
        if (catFilter && !item.productName.toLowerCase().includes(catFilter)) {
          const prod = db.dealerProducts.get(item.productId);
          if (prod && !prod.categoryId.toLowerCase().includes(catFilter)) continue;
        }

        if (queryFilter && !item.productName.toLowerCase().includes(queryFilter)) {
          continue;
        }

        const qty = Number(item.quantity.toString());
        const volumeLevel = qty > 30 ? 'HIGH' : qty > 10 ? 'MEDIUM' : 'LOW';

        results.push({
          storeId: store.id,
          storeName: store.name,
          storeAddress: store.address,
          lat: store.location.lat,
          lng: store.location.lng,
          category: store.type || 'Oziq-ovqat',
          productName: item.productName,
          unit: item.unit,
          supplyVolume: volumeLevel,
          lastDistributedAt: order.createdAt
          // NOTE: Competitor name, sale price, and debt are strictly excluded for privacy!
        });
      }
    }

    return results;
  }
}
