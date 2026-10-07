import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import {
  Store,
  Offer,
  Variant,
  User,
  StockDocument,
  DocumentLine,
  Review,
  Report,
  CorrectionRequest,
  MerchantSummary,
  FreshnessStatus,
  CredentialChangeRequest,
  AdminInquiry,
  UserNotification
} from '@yaqintop/contracts';
import { calculateWeightedAverageCost, sanitizeCsvField, calculateFinancialSummary } from '../services/ledger.service.js';
import { syncAllToSupabase } from './supabase.js';

export interface DBOrganization {
  id: string;
  name: string;
  inn?: string;
  type: string;
  status: 'ACTIVE' | 'SUSPENDED';
  region?: string;
  city?: string;
  district?: string;
  createdAt: string;
}

export interface DBMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: 'OWNER' | 'MANAGER' | 'OPERATOR';
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface DBInventoryBalance {
  offerId: string;
  onHand: Decimal;
  averageUnitCost: Decimal;
  lastVerifiedAt: Date | null;
  version: number;
}

export interface DBSaleSnapshot {
  saleLineId: string;
  variantId: string;
  quantity: Decimal;
  unitPrice: Decimal;
  unitCostSnapshot: Decimal;
  returnedQuantity: Decimal;
}

export interface DBExpense {
  id: string;
  organizationId: string;
  storeId: string;
  category: string;
  amount: Decimal;
  date: string;
  description: string;
  createdAt: string;
}

export interface DBBookmark {
  id: string;
  userId: string;
  storeId?: string;
  offerId?: string;
  createdAt: string;
}

export interface DBAuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  diff?: Record<string, any>;
  timestamp: string;
}

export interface DBIdempotencyRecord {
  scope: string;
  key: string;
  requestHash: string;
  statusCode: number;
  responseBody: any;
  createdAt: string;
}

export class InMemoryDatabase {
  public organizations: Map<string, DBOrganization> = new Map();
  public memberships: Map<string, DBMembership> = new Map();
  public users: Map<string, User & { passwordHash: string }> = new Map();
  public sessions: Map<string, { userId: string; createdAt: Date }> = new Map();
  public stores: Map<string, Store> = new Map();
  public variants: Map<string, Variant & { aliases?: string[] }> = new Map();
  public offers: Map<string, Offer> = new Map();
  public balances: Map<string, DBInventoryBalance> = new Map();
  public stockDocuments: Map<string, StockDocument> = new Map();
  public saleSnapshots: Map<string, DBSaleSnapshot> = new Map();
  public expenses: Map<string, DBExpense> = new Map();
  public reviews: Map<string, Review> = new Map();
  public reports: Map<string, Report> = new Map();
  public corrections: Map<string, CorrectionRequest> = new Map();
  public credentialRequests: Map<string, CredentialChangeRequest> = new Map();
  public inquiries: Map<string, AdminInquiry> = new Map();
  public notifications: Map<string, UserNotification> = new Map();
  public bookmarks: Map<string, DBBookmark> = new Map();
  public auditLogs: DBAuditLog[] = [];
  public idempotencyRecords: Map<string, DBIdempotencyRecord> = new Map();

  // Persistent file storage configuration (use /tmp on Serverless / Vercel)
  private dataDir = process.env.VERCEL ? path.resolve('/tmp', 'data') : path.resolve(process.cwd(), 'data');
  private dataFilePath = process.env.VERCEL ? path.resolve('/tmp', 'data', 'yaqintop_db.json') : path.resolve(process.cwd(), 'data', 'yaqintop_db.json');
  private saveTimeout: NodeJS.Timeout | null = null;

  public scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(async () => {
      this.saveToFile();
      try {
        syncAllToSupabase(this).catch(e => console.error('[Supabase Sync Error]', e));
      } catch (e) {
        // ignore if not configured
      }
    }, 150);
  }

  public saveToFile(): boolean {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      const serialized = {
        organizations: Array.from(this.organizations.entries()),
        memberships: Array.from(this.memberships.entries()),
        users: Array.from(this.users.entries()),
        sessions: Array.from(this.sessions.entries()).map(([k, v]) => [k, { userId: v.userId, createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : new Date().toISOString() }]),
        stores: Array.from(this.stores.entries()),
        variants: Array.from(this.variants.entries()),
        offers: Array.from(this.offers.entries()),
        balances: Array.from(this.balances.entries()).map(([k, v]) => [k, {
          ...v,
          onHand: v.onHand ? v.onHand.toString() : '0',
          averageUnitCost: v.averageUnitCost ? v.averageUnitCost.toString() : '0',
          lastVerifiedAt: v.lastVerifiedAt ? new Date(v.lastVerifiedAt).toISOString() : null
        }]),
        stockDocuments: Array.from(this.stockDocuments.entries()),
        saleSnapshots: Array.from(this.saleSnapshots.entries()).map(([k, v]) => [k, {
          ...v,
          quantity: v.quantity ? v.quantity.toString() : '0',
          unitPrice: v.unitPrice ? v.unitPrice.toString() : '0',
          unitCostSnapshot: v.unitCostSnapshot ? v.unitCostSnapshot.toString() : '0',
          returnedQuantity: v.returnedQuantity ? v.returnedQuantity.toString() : '0'
        }]),
        expenses: Array.from(this.expenses.entries()).map(([k, v]) => [k, {
          ...v,
          amount: v.amount ? v.amount.toString() : '0'
        }]),
        reviews: Array.from(this.reviews.entries()),
        reports: Array.from(this.reports.entries()),
        corrections: Array.from(this.corrections.entries()),
        credentialRequests: Array.from(this.credentialRequests.entries()),
        inquiries: Array.from(this.inquiries.entries()),
        notifications: Array.from(this.notifications.entries()),
        bookmarks: Array.from(this.bookmarks.entries()),
        auditLogs: this.auditLogs,
        idempotencyRecords: Array.from(this.idempotencyRecords.entries())
      };

      fs.writeFileSync(this.dataFilePath, JSON.stringify(serialized, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('[YaqinTop DB] Failed to save database to disk:', err);
      return false;
    }
  }

  public loadFromFile(): boolean {
    try {
      if (!fs.existsSync(this.dataFilePath)) {
        return false;
      }

      const content = fs.readFileSync(this.dataFilePath, 'utf-8');
      if (!content || !content.trim()) return false;

      const data = JSON.parse(content);
      if (!data || typeof data !== 'object') return false;

      if (Array.isArray(data.organizations)) this.organizations = new Map(data.organizations);
      if (Array.isArray(data.memberships)) this.memberships = new Map(data.memberships);
      if (Array.isArray(data.users)) this.users = new Map(data.users);
      if (Array.isArray(data.sessions)) {
        this.sessions = new Map(data.sessions.map(([k, v]: [string, any]) => [k, { userId: v.userId, createdAt: new Date(v.createdAt) }]));
      }
      if (Array.isArray(data.stores)) this.stores = new Map(data.stores);
      if (Array.isArray(data.variants)) this.variants = new Map(data.variants);
      if (Array.isArray(data.offers)) this.offers = new Map(data.offers);
      if (Array.isArray(data.balances)) {
        this.balances = new Map(data.balances.map(([k, v]: [string, any]) => [k, {
          ...v,
          onHand: new Decimal(v.onHand || 0),
          averageUnitCost: new Decimal(v.averageUnitCost || 0),
          lastVerifiedAt: v.lastVerifiedAt ? new Date(v.lastVerifiedAt) : null
        }]));
      }
      if (Array.isArray(data.stockDocuments)) this.stockDocuments = new Map(data.stockDocuments);
      if (Array.isArray(data.saleSnapshots)) {
        this.saleSnapshots = new Map(data.saleSnapshots.map(([k, v]: [string, any]) => [k, {
          ...v,
          quantity: new Decimal(v.quantity || 0),
          unitPrice: new Decimal(v.unitPrice || 0),
          unitCostSnapshot: new Decimal(v.unitCostSnapshot || 0),
          returnedQuantity: new Decimal(v.returnedQuantity || 0)
        }]));
      }
      if (Array.isArray(data.expenses)) {
        this.expenses = new Map(data.expenses.map(([k, v]: [string, any]) => [k, {
          ...v,
          amount: new Decimal(v.amount || 0)
        }]));
      }
      if (Array.isArray(data.reviews)) this.reviews = new Map(data.reviews);
      if (Array.isArray(data.reports)) this.reports = new Map(data.reports);
      if (Array.isArray(data.corrections)) this.corrections = new Map(data.corrections);
      if (Array.isArray(data.credentialRequests)) this.credentialRequests = new Map(data.credentialRequests);
      if (Array.isArray(data.inquiries)) this.inquiries = new Map(data.inquiries);
      if (Array.isArray(data.notifications)) this.notifications = new Map(data.notifications);
      if (Array.isArray(data.bookmarks)) this.bookmarks = new Map(data.bookmarks);
      if (Array.isArray(data.auditLogs)) this.auditLogs = data.auditLogs;
      if (Array.isArray(data.idempotencyRecords)) this.idempotencyRecords = new Map(data.idempotencyRecords);

      return true;
    } catch (err) {
      console.error('[YaqinTop DB] Failed to load database from disk:', err);
      return false;
    }
  }

  // Mutex locks for atomic operations
  private offerLocks: Map<string, Promise<void>> = new Map();

  private async acquireOfferLocks(offerIds: string[]): Promise<() => void> {
    const sortedIds = [...new Set(offerIds)].sort();
    const releaseFns: (() => void)[] = [];

    for (const id of sortedIds) {
      const currentLock = this.offerLocks.get(id) || Promise.resolve();
      let resolveLock!: () => void;
      const nextLock = new Promise<void>((resolve) => {
        resolveLock = resolve;
      });
      this.offerLocks.set(id, nextLock);
      await currentLock;
      releaseFns.push(() => {
        resolveLock();
      });
    }

    return () => {
      for (const fn of releaseFns.reverse()) {
        fn();
      }
    };
  }

  // Calculate freshness category
  public computeFreshness(verifiedAt: string | null | undefined): FreshnessStatus {
    if (!verifiedAt) return 'UNKNOWN';
    const ageMs = Date.now() - new Date(verifiedAt).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    if (ageHours <= 24) return 'NEW';
    if (ageHours <= 72) return 'STALE';
    return 'VERY_STALE';
  }

  // Idempotency check & save
  public checkIdempotency(scope: string, key: string, requestHash: string): DBIdempotencyRecord | 'CONFLICT' | null {
    const compositeKey = `${scope}::${key}`;
    const existing = this.idempotencyRecords.get(compositeKey);
    if (!existing) return null;
    if (existing.requestHash === requestHash) {
      return existing;
    }
    return 'CONFLICT';
  }

  public saveIdempotency(scope: string, key: string, requestHash: string, statusCode: number, responseBody: any) {
    const compositeKey = `${scope}::${key}`;
    this.idempotencyRecords.set(compositeKey, {
      scope,
      key,
      requestHash,
      statusCode,
      responseBody,
      createdAt: new Date().toISOString()
    });
  }

  // Atomic posting of stock documents (Receipt, Sale, Return, Adjustment)
  public async postStockDocument(
    doc: StockDocument,
    actorId: string,
    actorEmail: string
  ): Promise<{ success: boolean; error?: string; status?: number }> {
    const store = this.stores.get(doc.storeId);
    if (!store) return { success: false, error: 'Do‘kon topilmadi', status: 404 };

    const org = this.organizations.get(doc.organizationId);
    if (!org || org.status === 'SUSPENDED') {
      return { success: false, error: 'Tashkilot faoliyati to‘xtatilgan', status: 403 };
    }

    // Resolve offer IDs for document lines
    const offerMap = new Map<string, Offer>();
    for (const line of doc.lines) {
      // Find offer in this store for this variant
      let targetOffer: Offer | undefined;
      for (const off of this.offers.values()) {
        if (off.storeId === doc.storeId && off.variantId === line.variantId) {
          targetOffer = off;
          break;
        }
      }
      if (!targetOffer) {
        // Create an offer if receipt or adjustment
        if (doc.docType === 'RECEIPT' || doc.docType === 'ADJUSTMENT') {
          const variant = this.variants.get(line.variantId);
          if (!variant) return { success: false, error: 'Tovar varianti topilmadi', status: 404 };
          const newOfferId = uuidv4();
          targetOffer = {
            id: newOfferId,
            storeId: doc.storeId,
            variantId: line.variantId,
            variant,
            price: line.unitPriceOrCost,
            minOrderQuantity: 1,
            stockOnHand: 0,
            stockVerifiedAt: new Date().toISOString(),
            priceUpdatedAt: new Date().toISOString(),
            freshness: 'NEW',
            status: 'ACTIVE',
            wholesaleTiers: [],
            version: 1
          };
          this.offers.set(newOfferId, targetOffer);
          this.balances.set(newOfferId, {
            offerId: newOfferId,
            onHand: new Decimal(0),
            averageUnitCost: new Decimal(line.unitPriceOrCost),
            lastVerifiedAt: new Date(),
            version: 1
          });
        } else {
          return { success: false, error: 'Ushbu do‘konda tovar taklifi topilmadi', status: 404 };
        }
      }
      offerMap.set(line.variantId, targetOffer);
    }

    const offerIds = Array.from(offerMap.values()).map((o) => o.id);
    const release = await this.acquireOfferLocks(offerIds);

    try {
      if (doc.docType === 'SALE') {
        // Validate stock on hand for each line
        for (const line of doc.lines) {
          const offer = offerMap.get(line.variantId)!;
          const balance = this.balances.get(offer.id);
          const currentQty = balance ? balance.onHand : new Decimal(offer.stockOnHand);
          const reqQty = new Decimal(line.quantity);

          if (currentQty.lessThan(reqQty)) {
            return {
              success: false,
              error: `Tovar qoldig‘i yetarli emas (${offer.variant.title}). Qoldiq: ${currentQty.toString()}, Talab: ${reqQty.toString()}`,
              status: 409
            };
          }
        }

        // Deduct stock and snapshot COGS
        for (const line of doc.lines) {
          const offer = offerMap.get(line.variantId)!;
          const balance = this.balances.get(offer.id)!;
          const reqQty = new Decimal(line.quantity);

          balance.onHand = balance.onHand.minus(reqQty);
          balance.version++;
          offer.stockOnHand = balance.onHand.toNumber();
          if (offer.stockOnHand <= 0) {
            offer.status = 'OUT_OF_STOCK';
          }
          offer.version++;

          // Create sale line cost snapshot
          const lineId = line.id || uuidv4();
          line.id = lineId;
          this.saleSnapshots.set(lineId, {
            saleLineId: lineId,
            variantId: line.variantId,
            quantity: reqQty,
            unitPrice: new Decimal(line.unitPriceOrCost),
            unitCostSnapshot: balance.averageUnitCost,
            returnedQuantity: new Decimal(0)
          });
        }
      } else if (doc.docType === 'RECEIPT') {
        // Add stock and update weighted average cost
        for (const line of doc.lines) {
          const offer = offerMap.get(line.variantId)!;
          const balance = this.balances.get(offer.id)!;
          const recQty = new Decimal(line.quantity);
          const recCost = new Decimal(line.unitPriceOrCost);

          const newAvg = calculateWeightedAverageCost(balance.onHand, balance.averageUnitCost, recQty, recCost);
          balance.averageUnitCost = newAvg;
          balance.onHand = balance.onHand.plus(recQty);
          balance.lastVerifiedAt = new Date();
          balance.version++;

          offer.stockOnHand = balance.onHand.toNumber();
          offer.stockVerifiedAt = new Date().toISOString();
          offer.freshness = 'NEW';
          if (offer.stockOnHand > 0 && offer.status === 'OUT_OF_STOCK') {
            offer.status = 'ACTIVE';
          }
          offer.version++;
        }
      } else if (doc.docType === 'RETURN') {
        // Handle return against original sale line
        for (const line of doc.lines) {
          if (!line.originalSaleLineId) {
            return { success: false, error: 'Qaytarish uchun asl sotuv yozuvi ko‘rsatilishi shart', status: 422 };
          }
          const snapshot = this.saleSnapshots.get(line.originalSaleLineId);
          if (!snapshot) {
            return { success: false, error: 'Asl sotuv snapshot topilmadi', status: 404 };
          }

          const retQty = new Decimal(line.quantity);
          const remaining = snapshot.quantity.minus(snapshot.returnedQuantity);
          if (retQty.greaterThan(remaining)) {
            return {
              success: false,
              error: `Qaytarish miqdori sotilgan qoldiqdan oshib ketdi. Maksimal qaytarish: ${remaining.toString()}`,
              status: 409
            };
          }

          snapshot.returnedQuantity = snapshot.returnedQuantity.plus(retQty);

          const offer = offerMap.get(line.variantId)!;
          const balance = this.balances.get(offer.id)!;

          if (line.isRestockable) {
            // Restore merchandise to saleable stock at original snapshot cost
            balance.onHand = balance.onHand.plus(retQty);
            balance.version++;
            offer.stockOnHand = balance.onHand.toNumber();
            if (offer.stockOnHand > 0 && offer.status === 'OUT_OF_STOCK') {
              offer.status = 'ACTIVE';
            }
            offer.version++;
          }
        }
      } else if (doc.docType === 'ADJUSTMENT') {
        // Stock count adjustment: expected vs counted
        for (const line of doc.lines) {
          if (!line.reason) {
            return { success: false, error: 'Inventarizatsiya tuzatishida sabab ko‘rsatilishi shart', status: 422 };
          }
          const offer = offerMap.get(line.variantId)!;
          const balance = this.balances.get(offer.id)!;
          const countedQty = new Decimal(line.quantity);

          balance.onHand = countedQty;
          balance.lastVerifiedAt = new Date();
          balance.version++;

          offer.stockOnHand = countedQty.toNumber();
          offer.stockVerifiedAt = new Date().toISOString();
          offer.freshness = 'NEW';
          if (offer.stockOnHand > 0 && offer.status === 'OUT_OF_STOCK') {
            offer.status = 'ACTIVE';
          } else if (offer.stockOnHand <= 0) {
            offer.status = 'OUT_OF_STOCK';
          }
          offer.version++;
        }
      }

      doc.status = 'POSTED';
      doc.postedAt = new Date().toISOString();
      this.stockDocuments.set(doc.id, doc);

      // Audit Log
      this.auditLogs.push({
        id: uuidv4(),
        actorId,
        actorEmail,
        action: `POST_${doc.docType}`,
        entityType: 'STOCK_DOCUMENT',
        entityId: doc.id,
        diff: { docNumber: doc.documentNumber, totalAmount: doc.totalAmount },
        timestamp: new Date().toISOString()
      });

      return { success: true };
    } finally {
      release();
    }
  }

  // Get Merchant Financial Summary strictly from posted operations
  public getMerchantFinancialSummary(storeId: string, startDate?: string, endDate?: string): MerchantSummary {
    const store = this.stores.get(storeId);
    let postedSalesGross = new Decimal(0);
    let discounts = new Decimal(0);
    let postedRefunds = new Decimal(0);
    let cogsSnapshots = new Decimal(0);
    let reversedReturnCogs = new Decimal(0);
    let operatingExpenses = new Decimal(0);
    let stockLosses = new Decimal(0);

    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() : Date.now();

    for (const doc of this.stockDocuments.values()) {
      if (doc.storeId !== storeId || doc.status !== 'POSTED') continue;
      const docTime = new Date(doc.postedAt || doc.date).getTime();
      if (docTime < start || docTime > end) continue;

      if (doc.docType === 'SALE') {
        postedSalesGross = postedSalesGross.plus(new Decimal(doc.totalAmount));
        for (const line of doc.lines) {
          if (line.id) {
            const snap = this.saleSnapshots.get(line.id);
            if (snap) {
              cogsSnapshots = cogsSnapshots.plus(snap.quantity.times(snap.unitCostSnapshot));
            }
          }
        }
      } else if (doc.docType === 'RETURN') {
        postedRefunds = postedRefunds.plus(new Decimal(doc.totalAmount));
        for (const line of doc.lines) {
          if (line.originalSaleLineId) {
            const snap = this.saleSnapshots.get(line.originalSaleLineId);
            if (snap) {
              const retQty = new Decimal(line.quantity);
              const retCogs = retQty.times(snap.unitCostSnapshot);
              if (line.isRestockable) {
                reversedReturnCogs = reversedReturnCogs.plus(retCogs);
              } else {
                // Damaged goods: recognized as stock loss
                stockLosses = stockLosses.plus(retCogs);
              }
            }
          }
        }
      }
    }

    for (const exp of this.expenses.values()) {
      if (exp.storeId !== storeId) continue;
      const expTime = new Date(exp.date).getTime();
      if (expTime < start || expTime > end) continue;
      operatingExpenses = operatingExpenses.plus(exp.amount);
    }

    const fin = calculateFinancialSummary({
      postedSalesGross,
      discounts,
      postedRefunds,
      cogsSnapshots,
      reversedReturnCogs,
      operatingExpenses,
      stockLosses
    });

    // Counts
    let lowStockCount = 0;
    let staleCount = 0;
    let outOfStockCount = 0;

    for (const off of this.offers.values()) {
      if (off.storeId !== storeId) continue;
      if (off.stockOnHand <= 0) {
        outOfStockCount++;
      } else if (off.stockOnHand <= 10) {
        lowStockCount++;
      }
      const fresh = this.computeFreshness(off.stockVerifiedAt);
      if (fresh === 'STALE' || fresh === 'VERY_STALE') {
        staleCount++;
      }
    }

    // Daily chart (last 7 days)
    const days: { date: string; label: string; amount: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });

      let dayTotal = new Decimal(0);
      for (const doc of this.stockDocuments.values()) {
        if (doc.storeId === storeId && doc.status === 'POSTED' && doc.docType === 'SALE') {
          if (doc.date.startsWith(dateStr) || (doc.postedAt && doc.postedAt.startsWith(dateStr))) {
            dayTotal = dayTotal.plus(new Decimal(doc.totalAmount));
          }
        }
      }
      days.push({
        date: dateStr,
        label: dayName,
        amount: dayTotal.toFixed(0)
      });
    }

    return {
      date: new Date().toISOString().split('T')[0],
      netSales: fin.netSales,
      grossProfit: fin.grossProfit,
      cogs: fin.cogs,
      operatingExpenses: fin.operatingExpenses,
      operatingResult: fin.operatingResult,
      lowStockCount,
      staleCount,
      outOfStockCount,
      dailySalesChart: days
    };
  }
}

// Global database singleton
export const db = new InMemoryDatabase();
