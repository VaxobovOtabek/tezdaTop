import { describe, expect, it } from 'vitest';
import { isTradeOrganization } from '@yaqintop/contracts';
import type { InMemoryDatabase } from '../db/in-memory-db.js';
import { createService, completeService, serviceCompletionFromDocument } from './service-business.service.js';

const orgId = '11111111-1111-4111-a111-111111111111';
const storeId = '22222222-2222-4222-a222-222222222222';
const jobId = '33333333-3333-4333-a333-333333333333';
const fixture = () => ({
  organizations: new Map([[orgId, { id: orgId, type: 'Sartaroshxona' }]]),
  stores: new Map([[storeId, { id: storeId, organizationId: orgId }]]),
  variants: new Map(), offers: new Map(), stockDocuments: new Map(), balances: new Map()
}) as unknown as InMemoryDatabase;
const serviceInput = { title: 'Soch olish', price: 50000, durationMinutes: 30 };
const completionInput = { id: jobId, customerName: 'Test mijoz', quantity: 2, paidAmount: 75000, paymentMethod: 'CASH' };

describe('service organizations', () => {
  it('keeps existing trade types and Uzbek shop names in trade mode', () => {
    for (const type of ['RETAIL', 'WHOLESALE', 'MIXED', 'Magazin', 'Savdo', 'Chakana savdo', 'Do‘kon']) expect(isTradeOrganization(type)).toBe(true);
    for (const type of ['SERVICE', 'Xizmat ko‘rsatish', 'Sartaroshxona', 'Avtoservis']) expect(isTradeOrganization(type)).toBe(false);
  });
  it('creates a service with zero inventory and records partial payment without moving stock', () => {
    const database = fixture();
    const service = createService(database, orgId, storeId, serviceInput);
    const completion = completeService(database, orgId, storeId, 'owner-id', { ...completionInput, serviceId: service.id });
    expect(completion.totalAmount).toBe('100000.00');
    expect(completion.paidAmount).toBe('75000.00');
    expect(service.variant.kind).toBe('SERVICE');
    expect(service.stockOnHand).toBe(0);
    expect(database.balances.size).toBe(0);
    expect(serviceCompletionFromDocument(database.stockDocuments.get(jobId)!)).toEqual(completion);
  });
  it('does not double count a retried completion', () => {
    const database = fixture();
    const service = createService(database, orgId, storeId, serviceInput);
    completeService(database, orgId, storeId, 'owner-id', { ...completionInput, serviceId: service.id });
    completeService(database, orgId, storeId, 'owner-id', { ...completionInput, serviceId: service.id });
    expect(database.stockDocuments.size).toBe(1);
  });
  it('rejects another organization’s store or service', () => {
    const database = fixture();
    expect(() => createService(database, 'other-org', storeId, serviceInput)).toThrow();
    const service = createService(database, orgId, storeId, serviceInput);
    database.offers.get(service.id)!.storeId = 'other-store';
    expect(() => completeService(database, orgId, storeId, 'owner-id', { ...completionInput, serviceId: service.id })).toThrow();
    expect(database.stockDocuments.size).toBe(0);
  });
  it('rejects overpayment and invalid service prices without saving a completion', () => {
    const database = fixture();
    expect(() => createService(database, orgId, storeId, { ...serviceInput, price: -1 })).toThrow();
    const service = createService(database, orgId, storeId, serviceInput);
    expect(() => completeService(database, orgId, storeId, 'owner-id', { ...completionInput, serviceId: service.id, paidAmount: 100001 })).toThrow();
    expect(database.stockDocuments.size).toBe(0);
  });
  it('prevents trade organizations from using service operations', () => {
    const database = fixture();
    database.organizations.get(orgId)!.type = 'RETAIL';
    expect(() => createService(database, orgId, storeId, serviceInput)).toThrow();
  });
});
