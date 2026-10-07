import { describe, expect, it } from 'vitest';
import type { InMemoryDatabase } from '../db/in-memory-db.js';
import { createOwnerOrganization, hashOwnerPassword, verifyOwnerPassword } from './owner-onboarding.service.js';

const input = { name: 'Test tashkilot', inn: '987654321', region: 'Sirdaryo viloyati', city: 'Guliston', type: 'Dorixona', address: 'Test ko‘chasi', phone: '+998901234567', lat: 40.49, lng: 68.78, openTime: '08:00', closeTime: '22:00', fullName: 'Test Owner', email: 'owner@example.test', password: 'test-password-123' };
const fixture = () => ({ organizations: new Map(), users: new Map(), stores: new Map(), memberships: new Map() }) as InMemoryDatabase;

describe('owner tashkilot yaratishi', () => {
  it('creates exactly one owner and links only their new organization and store', () => {
    const database = fixture();
    const result = createOwnerOrganization(database, { ...input, role: 'ADMIN', organizationId: 'existing-organization' });
    expect(database.users.size).toBe(1);
    expect(database.organizations.size).toBe(1);
    expect(database.stores.size).toBe(1);
    expect(result.user.role).toBe('OWNER');
    expect(result.organization.id).not.toBe('existing-organization');
    expect(result.organization.type).toBe('Dorixona');
    expect(result.store.organizationId).toBe(result.organization.id);
    expect(Array.from(database.memberships.values())[0]).toMatchObject({ userId: result.user.id, organizationId: result.organization.id, role: 'OWNER' });
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(verifyOwnerPassword(input.password, database.users.get(result.user.id)!.passwordHash)).toBe(true);
  });
  it('rejects duplicate login or organization without creating orphan records', () => {
    const database = fixture();
    createOwnerOrganization(database, input);
    expect(() => createOwnerOrganization(database, { ...input, inn: '987654322', email: input.email.toUpperCase() })).toThrow();
    expect(() => createOwnerOrganization(database, { ...input, email: 'second@example.test', phone: '+998901234568' })).toThrow();
    expect(database.organizations.size).toBe(1);
    expect(database.stores.size).toBe(1);
    expect(database.users.size).toBe(1);
  });
  it('rejects invalid coordinates and password before writing data', () => {
    const database = fixture();
    expect(() => createOwnerOrganization(database, { ...input, lat: 100, password: '123' })).toThrow();
    expect(database.users.size).toBe(0);
    expect(database.organizations.size).toBe(0);
  });
  it('keeps new passwords hashed and supports existing login credentials', () => {
    const hash = hashOwnerPassword(input.password);
    expect(hash).not.toContain(input.password);
    expect(verifyOwnerPassword('wrong-password', hash)).toBe(false);
    expect(verifyOwnerPassword('legacy-password', 'legacy-password')).toBe(true);
  });
});
