import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { InMemoryDatabase } from '../db/in-memory-db.js';

const text = z.string().trim().min(1).max(160);
export const OwnerOnboardingSchema = z.object({
  name: text, inn: z.string().regex(/^\d{9}$/), region: text, city: text,
  district: z.string().trim().max(160).default(''), type: text.max(80),
  storeName: z.string().trim().max(160).default(''), address: text,
  phone: z.string().regex(/^\+998\d{9}$/),
  lat: z.coerce.number().min(-90).max(90), lng: z.coerce.number().min(-180).max(180),
  photoUrl: z.union([z.literal(''), z.string().url().max(2000)]).default(''),
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  fullName: text, email: z.string().trim().email().max(160), password: z.string().min(8).max(128)
});

export function hashOwnerPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyOwnerPassword(password: string, stored: string) {
  if (!stored.startsWith('scrypt:')) return stored === password;
  const [, salt, digest] = stored.split(':');
  if (!salt || !digest) return false;
  const expected = Buffer.from(digest, 'hex');
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createOwnerOrganization(database: InMemoryDatabase, input: unknown) {
  const data = OwnerOnboardingSchema.parse(input);
  const email = data.email.toLowerCase();
  if (Array.from(database.users.values()).some(user => user.email.toLowerCase() === email || user.phone?.replace(/\D/g, '') === data.phone.replace(/\D/g, ''))) {
    throw new Error('Bu email yoki telefon bilan hisob mavjud. Boshqa login kiriting yoki tizimga kiring.');
  }
  if (Array.from(database.organizations.values()).some(org => org.inn === data.inn)) {
    throw new Error('Bu STIR bilan tashkilot allaqachon mavjud.');
  }
  const now = new Date().toISOString();
  const organization = { id: uuidv4(), name: data.name, inn: data.inn, region: data.region, city: data.city, district: data.district, type: data.type, status: 'ACTIVE' as const, createdAt: now };
  const store = {
    id: uuidv4(), organizationId: organization.id, name: data.storeName || data.name,
    inn: data.inn, region: data.region, city: data.city, district: data.district,
    address: data.address, phone: data.phone, location: { lat: data.lat, lng: data.lng },
    type: data.type, status: 'ACTIVE' as const, isVerified: false, rating: 0, reviewCount: 0,
    photoUrl: data.photoUrl, hours: [0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => ({ dayOfWeek, openTime: data.openTime, closeTime: data.closeTime, isClosed: false })), createdAt: now, updatedAt: now
  };
  const user = { id: uuidv4(), email, fullName: data.fullName, phone: data.phone, role: 'OWNER' as const, status: 'ACTIVE' as const, passwordHash: hashOwnerPassword(data.password), createdAt: now, updatedAt: now };
  const membership = { id: uuidv4(), organizationId: organization.id, userId: user.id, role: 'OWNER' as const, status: 'ACTIVE' as const };
  // All validation and password hashing finish before changing any records.
  database.organizations.set(organization.id, organization);
  database.stores.set(store.id, store);
  database.users.set(user.id, user);
  database.memberships.set(membership.id, membership);
  const { passwordHash, ...publicUser } = user;
  return { organization, store, user: publicUser };
}
