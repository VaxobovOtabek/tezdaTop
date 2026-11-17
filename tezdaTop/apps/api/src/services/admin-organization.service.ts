import { z } from 'zod';
import type { InMemoryDatabase } from '../db/in-memory-db.js';
import { hashOwnerPassword } from './owner-onboarding.service.js';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const hours = z.array(z.object({ dayOfWeek: z.number().int().min(0).max(6), openTime: time, closeTime: time, isClosed: z.boolean() })).min(1).max(7)
  .refine(days => new Set(days.map(day => day.dayOfWeek)).size === days.length && days.some(day => !day.isClosed));
const photo = z.string().max(1_000_000).refine(value => {
  if (!value) return true;
  if (value.startsWith('data:')) {
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return false;
    const bytes = Buffer.from(value.slice(value.indexOf(',') + 1), 'base64');
    if (value.startsWith('data:image/jpeg')) return bytes.subarray(0,3).equals(Buffer.from([255,216,255]));
    if (value.startsWith('data:image/png')) return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    return bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP';
  }
  try { return value.length <= 2000 && ['http:','https:'].includes(new URL(value).protocol); } catch { return false; }
});
const ownerSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  email: z.string().trim().min(2).max(160).regex(/^[a-zA-Z0-9][a-zA-Z0-9_.@+\-]*$/).transform(value => value.toLowerCase()),
  phone: z.string().transform(value => value.replace(/\s/g,'')).pipe(z.string().regex(/^\+998\d{9}$/)),
  password: z.string().min(8).max(128)
});
const extrasSchema = z.object({ photoUrl: photo.optional().default(''), hours: hours.optional(), owner: ownerSchema.optional() });

/** Validate every optional field before creating the organization or any related record. */
export function prepareAdminOrganizationExtras(database: InMemoryDatabase, input: unknown) {
  const parsed = extrasSchema.safeParse(input);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const message = field === 'owner' ? 'Egasining ismi, login, +998 formatidagi telefoni va kamida 8 belgili parolini tekshiring.' : field === 'hours' ? 'Ish kunlari va vaqtini tekshiring. Kamida bitta ochiq kun bo‘lishi kerak.' : 'Rasm URL yoki JPG, PNG, WebP fayli noto‘g‘ri yoki juda katta.';
    throw Object.assign(new Error(message), { status: 400 });
  }
  const { owner, ...extras } = parsed.data;
  if (!owner) return { ...extras, owner: undefined };
  const prefix = owner.email.split('@')[0];
  const duplicate = [...database.users.values()].some(user => user.email.toLowerCase() === owner.email || user.email.toLowerCase().split('@')[0] === prefix || user.phone?.replace(/\D/g,'') === owner.phone.replace(/\D/g,''));
  if (duplicate) throw Object.assign(new Error('Bu login yoki telefon bilan foydalanuvchi mavjud. Boshqa login va telefon kiriting.'), { status: 409 });
  return { ...extras, owner: { fullName: owner.fullName, email: owner.email, phone: owner.phone, passwordHash: hashOwnerPassword(owner.password) } };
}
