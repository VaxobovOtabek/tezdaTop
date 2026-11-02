import { z } from 'zod';
import Decimal from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';
import type { InMemoryDatabase } from '../db/in-memory-db.js';
import { isTradeOrganization, type StockDocument } from '@yaqintop/contracts';

function requireServiceStore(database: InMemoryDatabase, organizationId: string, storeId: string) {
  const store = database.stores.get(storeId);
  const organization = database.organizations.get(organizationId);
  if (!store || store.organizationId !== organizationId || !organization || isTradeOrganization(organization.type)) throw new Error('Xizmat tashkiloti topilmadi.');
}

export const NewServiceSchema = z.object({
  title: z.string().trim().min(1).max(160), category: z.string().trim().max(100).default('Xizmat'),
  description: z.string().trim().max(2000).default(''),
  price: z.coerce.number().min(0).max(1e12), durationMinutes: z.coerce.number().int().min(1).max(1440)
});
export const CompleteServiceSchema = z.object({
  id: z.string().uuid(), serviceId: z.string().uuid(), customerName: z.string().trim().min(1).max(160),
  customerPhone: z.string().trim().max(30).default(''), quantity: z.coerce.number().int().min(1).max(100),
  paidAmount: z.coerce.number().min(0).max(1e14), paymentMethod: z.enum(['CASH', 'CARD'])
});
export interface ServiceCompletion {
  id: string; organizationId: string; storeId: string; serviceId: string; variantId: string;
  serviceName: string; customerName: string; customerPhone: string; quantity: number;
  unitPrice: string; totalAmount: string; paidAmount: string; paymentMethod: 'CASH' | 'CARD';
  createdAt: string; createdBy: string;
}
export function serviceCompletionFromDocument(document: StockDocument): ServiceCompletion | null {
  if (!document.documentNumber?.startsWith('SRV-')) return null;
  try {
    const data = JSON.parse(document.notes || '{}');
    const completion = data.completion;
    return data.kind === 'SERVICE_COMPLETION' && completion?.id === document.id && completion.storeId === document.storeId && completion.organizationId === document.organizationId && typeof completion.createdAt === 'string' ? completion : null;
  } catch { return null; }
}

export function createService(database: InMemoryDatabase, organizationId: string, storeId: string, input: unknown) {
  requireServiceStore(database, organizationId, storeId);
  const data = NewServiceSchema.parse(input);
  const now = new Date().toISOString();
  const variant = { id: uuidv4(), productId: uuidv4(), title: data.title, category: data.category, packUnit: 'xizmat', kind: 'SERVICE' as const, durationMinutes: data.durationMinutes, description: data.description };
  database.variants.set(variant.id, { ...variant, organizationId } as typeof variant);
  const offer = { id: uuidv4(), storeId, variantId: variant.id, variant, price: new Decimal(data.price).toFixed(2), minOrderQuantity: 1, stockOnHand: 0, stockVerifiedAt: now, priceUpdatedAt: now, freshness: 'NEW' as const, status: 'ACTIVE' as const, wholesaleTiers: [], version: 1 };
  database.offers.set(offer.id, offer);
  return offer;
}

export function completeService(database: InMemoryDatabase, organizationId: string, storeId: string, userId: string, input: unknown) {
  requireServiceStore(database, organizationId, storeId);
  const data = CompleteServiceSchema.parse(input);
  const previous = database.stockDocuments.get(data.id);
  if (previous) {
    const completion = serviceCompletionFromDocument(previous);
    if (completion?.organizationId === organizationId && completion.storeId === storeId) return completion;
    throw new Error('Bu yozuvga kirish huquqingiz yo‘q.');
  }
  const offer = database.offers.get(data.serviceId);
  if (!offer || offer.storeId !== storeId || offer.variant.kind !== 'SERVICE' || offer.status !== 'ACTIVE') throw new Error('Faol xizmat topilmadi.');
  const total = new Decimal(offer.price).mul(data.quantity);
  if (new Decimal(data.paidAmount).greaterThan(total)) throw new Error('To‘lov xizmatning jami narxidan oshmasligi kerak.');
  const now = new Date().toISOString();
  const completion: ServiceCompletion = { id: data.id, organizationId, storeId, serviceId: offer.id, variantId: offer.variantId, serviceName: offer.variant.title, customerName: data.customerName, customerPhone: data.customerPhone, quantity: data.quantity, unitPrice: offer.price, totalAmount: total.toFixed(2), paidAmount: new Decimal(data.paidAmount).toFixed(2), paymentMethod: data.paymentMethod, createdAt: now, createdBy: userId };
  // A billing record only: never post an inventory document or update balances.
  database.stockDocuments.set(completion.id, {
    id: completion.id, organizationId, storeId, docType: 'SALE', status: 'POSTED', documentNumber: `SRV-${completion.id}`,
    date: now, supplierOrCustomer: completion.customerName, paymentMethod: completion.paymentMethod,
    totalAmount: completion.totalAmount, lines: [{ id: uuidv4(), variantId: offer.variantId, variantTitle: offer.variant.title, quantity: String(data.quantity), unitPriceOrCost: offer.price, subtotal: completion.totalAmount, isRestockable: false }],
    notes: JSON.stringify({ kind: 'SERVICE_COMPLETION', completion }), createdAt: now, createdBy: userId, postedAt: now
  });
  return completion;
}
