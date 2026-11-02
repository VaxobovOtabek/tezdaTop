import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, DBDealer } from '../db/in-memory-db.js';
import { hashOwnerPassword } from '../services/owner-onboarding.service.js';
import { User } from '@yaqintop/contracts';
import { DealerService } from '../services/dealer.service.js';

export const adminDealersRouter: Router = Router();

// Middleware: Require Superadmin, Admin or Moderator
function requireStaff(req: Request, res: Response, next: () => void) {
  const user = (req as any).user as User | undefined;
  if (!user || !['SUPERADMIN', 'ADMIN', 'MODERATOR'].includes(user.role)) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Faqat ma’muriyat uchun ruxsat berilgan' });
    return;
  }
  next();
}

adminDealersRouter.use(requireStaff);

// 1. List all dealers
adminDealersRouter.get('/', (req: Request, res: Response) => {
  const dealers = Array.from(db.dealers.values()).map(d => {
    const user = db.users.get(d.userId);
    const stores = DealerService.getDealerStores(d.id);
    const totalDebt = stores.reduce((sum, s) => sum + s.currentDebtBalance, 0);

    return {
      id: d.id,
      userId: d.userId,
      companyName: d.companyName,
      contactName: d.contactName,
      login: d.login,
      phone: d.phone,
      email: user?.email || '',
      status: d.status,
      userStatus: user?.status || 'ACTIVE',
      allowExperimentalMap: Boolean(d.allowExperimentalMap),
      region: d.region || 'Toshkent shahri',
      city: d.city || 'Yunusobod tumani',
      storeCount: stores.length,
      totalDebt,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    };
  });

  res.json({ dealers });
});

// 2. Create new dealer profile & user account
adminDealersRouter.post('/', (req: Request, res: Response) => {
  const actor = (req as any).user as User;
  const { companyName, contactName, phone, login, password, region, city, allowExperimentalMap } = req.body;

  if (!companyName || !contactName || !phone || !login || !password) {
    res.status(400).json({
      code: 'INVALID_REQUEST',
      message: 'Kompaniya nomi, mas’ul shaxs, telefon, login va parol to‘liq kiritilishi shart'
    });
    return;
  }

  const cleanLogin = login.trim().toLowerCase();
  const cleanPhone = phone.trim();

  // Check login conflict
  const existingUser = Array.from(db.users.values()).find(
    u => u.email.toLowerCase() === cleanLogin || u.email.toLowerCase() === `${cleanLogin}@yaqintop.uz` || (u.phone && u.phone === cleanPhone)
  );

  if (existingUser) {
    res.status(409).json({
      code: 'LOGIN_EXISTS',
      message: 'Bu login yoki telefon raqami bilan tizimda foydalanuvchi mavjud'
    });
    return;
  }

  const userId = uuidv4();
  const dealerId = uuidv4();
  const email = cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@yaqintop.uz`;

  const newUser: User & { passwordHash: string } = {
    id: userId,
    email,
    fullName: `${contactName.trim()} (${companyName.trim()})`,
    phone: cleanPhone,
    role: 'DEALER',
    status: 'ACTIVE',
    isVerified: true,
    passwordHash: hashOwnerPassword(password),
    plainPassword: password,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const newDealer: DBDealer = {
    id: dealerId,
    userId,
    companyName: companyName.trim(),
    contactName: contactName.trim(),
    login: cleanLogin,
    phone: cleanPhone,
    status: 'ACTIVE',
    allowExperimentalMap: Boolean(allowExperimentalMap),
    region: region || 'Toshkent shahri',
    city: city || 'Yunusobod tumani',
    createdByAdminId: actor.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.users.set(userId, newUser);
  db.dealers.set(dealerId, newDealer);
  db.scheduleSave();

  res.status(201).json({
    dealer: {
      ...newDealer,
      email,
      storeCount: 0,
      totalDebt: 0
    },
    message: 'Yangi diller profili va hisobi muvaffaqiyatli yaratildi'
  });
});

// 3. Update dealer status, permissions or profile
adminDealersRouter.patch('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const dealer = db.dealers.get(id);

  if (!dealer) {
    res.status(404).json({ code: 'DEALER_NOT_FOUND', message: 'Diller topilmadi' });
    return;
  }

  const { status, allowExperimentalMap, companyName, contactName, phone, newPassword, region, city } = req.body;

  if (status !== undefined) {
    dealer.status = status;
    const user = db.users.get(dealer.userId);
    if (user) {
      user.status = status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED';
      // Invalidate sessions if suspended
      if (user.status === 'SUSPENDED') {
        for (const [token, sess] of db.sessions.entries()) {
          if (sess.userId === user.id) db.sessions.delete(token);
        }
      }
    }
  }

  if (allowExperimentalMap !== undefined) {
    dealer.allowExperimentalMap = Boolean(allowExperimentalMap);
  }

  if (companyName) dealer.companyName = companyName.trim();
  if (contactName) dealer.contactName = contactName.trim();
  if (phone) dealer.phone = phone.trim();
  if (region) dealer.region = region;
  if (city) dealer.city = city;

  if (newPassword && newPassword.length >= 6) {
    const user = db.users.get(dealer.userId);
    if (user) {
      user.passwordHash = hashOwnerPassword(newPassword);
      user.plainPassword = newPassword;
    }
  }

  dealer.updatedAt = new Date().toISOString();
  db.scheduleSave();

  res.json({
    success: true,
    dealer,
    message: 'Diller ma’lumotlari muvaffaqiyatli yangilandi'
  });
});
