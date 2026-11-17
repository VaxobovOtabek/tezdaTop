import { RegisterRequestSchema } from '@yaqintop/contracts';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@yaqintop/contracts';
import { hashOwnerPassword } from './owner-onboarding.service.js';

export async function registerCustomer(users: Map<string, User>, input: unknown, persist: (user: User & { passwordHash: string }) => Promise<void>) {
  const data = RegisterRequestSchema.parse(input);
  const email = data.login.toLowerCase();
  if (Array.from(users.values()).some(u => u.email.toLowerCase() === email || u.email.toLowerCase().split('@')[0] === email || u.phone?.replace(/\D/g, '') === data.phone.replace(/\D/g, ''))) {
    throw new Error('Bu login yoki telefon allaqachon ro‘yxatdan o‘tgan');
  }
  const now = new Date().toISOString();
  const user: User & { passwordHash: string } = { id: uuidv4(), email, fullName: data.fullName, phone: data.phone,
    role: 'CUSTOMER', status: 'ACTIVE', passwordHash: hashOwnerPassword(data.password), createdAt: now, updatedAt: now };
  // Reserve identifiers during the awaited database insert; remove only this new record on failure.
  users.set(user.id, user);
  try { await persist(user); } catch (error) { users.delete(user.id); throw error; }
  return user;
}
