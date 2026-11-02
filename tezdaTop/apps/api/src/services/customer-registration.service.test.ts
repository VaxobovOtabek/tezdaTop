import { describe, it, expect, vi } from 'vitest';
import { registerCustomer } from './customer-registration.service.js';
import { verifyOwnerPassword } from './owner-onboarding.service.js';
import type { User } from '@yaqintop/contracts';

const input = { fullName: ' Test Mijoz ', login: 'Test123', phone: '+998901234567', password: 'StrongPass123!' };
describe('customer registration', () => {
  it('persists a customer with a hashed password and ignores supplied privileged role', async () => {
    const users = new Map<string, User>();
    const persist = vi.fn(async () => {});
    const user = await registerCustomer(users, { ...input, role: 'SUPERADMIN' }, persist);
    expect(user.role).toBe('CUSTOMER');
    expect(user.email).toBe('test123');
    expect(user.fullName).toBe('Test Mijoz');
    expect(user.passwordHash).not.toBe(input.password);
    expect(verifyOwnerPassword(input.password, user.passwordHash)).toBe(true);
    expect(persist).toHaveBeenCalledWith(user);
    expect(Array.from(users.values())).toContain(user);
  });
  it('rejects duplicate email and phone without another write', async () => {
    const users = new Map<string, User>();
    const persist = vi.fn(async () => {});
    await registerCustomer(users, input, persist);
    await expect(registerCustomer(users, { ...input, phone: '+998901234568' }, persist)).rejects.toThrow('allaqachon');
    await expect(registerCustomer(users, { ...input, login: 'other' }, persist)).rejects.toThrow('allaqachon');
    expect(persist).toHaveBeenCalledTimes(1);
  });
  it('does not retain a failed database insert', async () => {
    const users = new Map<string, User>();
    await expect(registerCustomer(users, input, async () => { throw new Error('offline'); })).rejects.toThrow('offline');
    expect(users.size).toBe(0);
  });
  it('rejects invalid personal information before persistence', async () => {
    const users = new Map<string, User>();
    const persist = vi.fn(async () => {});
    for (const invalid of [{ password: '1234' }, { login: 'toolonglogin' }, { phone: '1234' }, { fullName: ' ' }]) {
      await expect(registerCustomer(users, { ...input, ...invalid }, persist)).rejects.toThrow();
    }
    expect(persist).not.toHaveBeenCalled();
  });
});
