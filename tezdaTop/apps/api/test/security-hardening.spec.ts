import { beforeEach, describe, expect, it, vi } from 'vitest';
import Decimal from 'decimal.js';
import { db } from '../src/db/in-memory-db.js';
import { seedDatabase, SEED_IDS } from '../src/db/seed.js';
import { DealerService } from '../src/services/dealer.service.js';
import { projectDatabase, hydrateDatabase } from '../src/db/supabase.js';
import { hashOwnerPassword, verifyOwnerPassword } from '../src/services/owner-onboarding.service.js';
import { createSignedSessionToken, verifySignedSessionToken, revokeToken, revokedTokens, revokeUserSessions } from '../src/services/session.service.js';

beforeEach(async () => {
  const empty = Object.fromEntries(Object.keys(db.exportSnapshot()).map(key => [key, []]));
  db.restoreSnapshot(empty); revokedTokens.clear(); await seedDatabase();
});

describe('audited security and inventory regressions', () => {
  const supply = (items: any[], paidAmount = 0) => DealerService.createSupplyOrder(SEED_IDS.dealerId, {storeId:SEED_IDS.navbahorStoreId,items,paidAmount,paymentType:'DEBT'});
  const product = () => [...db.dealerProducts.values()][0];
  it.each([-1, 0, NaN, Infinity])('rejects invalid quantity %s without changing inventory', quantity => {
    const p=product(); const before=JSON.stringify(db.exportSnapshot());
    expect(()=>supply([{productId:p.id,quantity,unitPrice:100}])).toThrow();
    expect(JSON.stringify(db.exportSnapshot())).toBe(before);
  });
  it('rejects overselling and repeated product lines', () => {
    const p=product();
    expect(()=>supply([{productId:p.id,quantity:999999,unitPrice:100}])).toThrow();
    expect(()=>supply([{productId:p.id,quantity:1,unitPrice:100},{productId:p.id,quantity:1,unitPrice:100}])).toThrow();
  });
  it('rolls back a failed multi-line order completely', () => {
    const p=product(); const before=JSON.stringify(db.exportSnapshot());
    expect(()=>supply([{productId:p.id,quantity:1,unitPrice:100},{productId:'missing',quantity:1,unitPrice:100}])).toThrow();
    expect(JSON.stringify(db.exportSnapshot())).toBe(before);
  });
  it('rejects negative payments', () => {
    expect(()=>supply([{productId:product().id,quantity:1,unitPrice:100}],-1)).toThrow();
  });
  it('bounds returns by delivered quantities and rolls back excessive returns', () => {
    const p=product(); const before=JSON.stringify(db.exportSnapshot());
    expect(()=>DealerService.recordReturn(SEED_IDS.dealerId,{storeId:SEED_IDS.navbahorStoreId,items:[{productId:p.id,quantity:999999}]})).toThrow();
    expect(JSON.stringify(db.exportSnapshot())).toBe(before);
  });
  it('does not accept legacy plaintext passwords', () => {
    expect(verifyOwnerPassword('DemoPass123!','DemoPass123!')).toBe(false);
    expect(verifyOwnerPassword('secret-password',hashOwnerPassword('secret-password'))).toBe(true);
  });
  it('keeps revocation after serialization and process-local cache loss', () => {
    const token=createSignedSessionToken(SEED_IDS.adminUserId); revokeToken(token);
    const snapshot=JSON.parse(JSON.stringify(db.exportSnapshot())); revokedTokens.clear(); db.revocations.clear(); db.restoreSnapshot(snapshot);
    expect(verifySignedSessionToken(token)).toBeNull();
  });
  it('invalidates tokens on all workers through persisted user token versions', () => {
    const token=createSignedSessionToken(SEED_IDS.adminUserId); revokeUserSessions(SEED_IDS.adminUserId); revokedTokens.clear(); db.revocations.clear();
    expect(verifySignedSessionToken(token)).toBeNull();
  });
  it('does not sign production tokens with a fallback secret', () => {
    vi.stubEnv('NODE_ENV','production'); vi.stubEnv('SESSION_SECRET','');
    try { expect(()=>createSignedSessionToken(SEED_IDS.adminUserId)).toThrow('SESSION_SECRET'); } finally { vi.unstubAllEnvs(); }
  });
  it('derives a separate production signing key from an existing backend service secret', () => {
    vi.stubEnv('NODE_ENV','production'); vi.stubEnv('SESSION_SECRET',''); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test-only-service-secret-with-more-than-32-characters');
    try { const token=createSignedSessionToken(SEED_IDS.adminUserId); expect(verifySignedSessionToken(token)?.userId).toBe(SEED_IDS.adminUserId); } finally { vi.unstubAllEnvs(); }
  });
  it('round-trips financial, dealer, proposal and idempotency records', () => {
    const token=createSignedSessionToken(SEED_IDS.adminUserId); revokeToken(token);
    db.saveIdempotency('audit','key','request',201,{ok:true});
    const balance=[...db.balances.values()][0]; balance.averageUnitCost=new Decimal('12345.678901');
    const rows=projectDatabase(db); const expected=JSON.parse(JSON.stringify(db.exportSnapshot()));
    db.restoreSnapshot(Object.fromEntries(Object.keys(expected).map(k=>[k,[]]))); hydrateDatabase(db,rows);
    expect(db.balances.get(balance.offerId)?.averageUnitCost.toString()).toBe('12345.678901');
    for(const collection of ['dealers','dealerStores','dealerProducts','supplyOrders','debtTransactions','saleSnapshots','idempotencyRecords','revocations','stockDocuments']) expect((db as any)[collection].size).toBe(expected[collection].length);
    expect(db.dealerProducts.values().next().value?.stockQuantity).toBeInstanceOf(Decimal);
    expect(db.checkIdempotency('audit','key','request')).toMatchObject({statusCode:201});
  });
});
