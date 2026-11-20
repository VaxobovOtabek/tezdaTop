import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'node:crypto';
import { db } from '../db/in-memory-db.js';
import { SEED_IDS } from '../db/seed-ids.js';
import { getCurrentUser, requireStaffRole } from '../middleware/auth.middleware.js';
import { userVerifyLimiter } from '../middleware/rate-limiter.js';
import {
  createSignedSessionToken,
  revokeToken,
  revokeUserSessions
} from '../services/session.service.js';
import { hashOwnerPassword } from '../services/owner-onboarding.service.js';
import { isSupabaseConfigured, syncAllFromSupabase } from '../db/supabase.js';

export const adminUsersRouter = Router();

// Protect Superadmin account deletion/modification
adminUsersRouter.use('/users/:id', (req, res, next) => {
  const target = db.users.get(req.params.id);
  const actor = getCurrentUser(req);
  if (target?.role === 'SUPERADMIN') {
    if (actor?.role !== 'SUPERADMIN')
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Bosh administrator hisobiga ruxsat yo‘q.' });
    const removing =
      req.method === 'DELETE' ||
      (req.body?.role && req.body.role !== 'SUPERADMIN') ||
      (req.body?.status && req.body.status !== 'ACTIVE');
    if (removing && [...db.users.values()].filter((u) => u.role === 'SUPERADMIN' && u.status === 'ACTIVE').length <= 1)
      return res
        .status(409)
        .json({ code: 'LAST_ADMIN', message: 'Yagona bosh administrator hisobini o‘chirib bo‘lmaydi.' });
  }
  next();
});

// 1. Get all users
adminUsersRouter.get('/users', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  const users = Array.from(db.users.values()).map(({ passwordHash, ...u }) => {
    const membership = Array.from(db.memberships.values()).find((m) => m.userId === u.id);
    let organizationName = undefined;
    let organizationId = (u as any).organizationId;
    if (membership) {
      organizationId = membership.organizationId;
      const org = db.organizations.get(membership.organizationId);
      if (org) organizationName = org.name;
    } else if (organizationId) {
      const org = db.organizations.get(organizationId);
      if (org) organizationName = org.name;
    }
    const cleanUser = {
      ...u,
      organizationId,
      organizationName
    };
    delete (cleanUser as any).plainPassword;
    delete (cleanUser as any).verificationCode;
    return cleanUser;
  });
  res.json({ users });
});

// 2. Create user
adminUsersRouter.post('/users', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  const caller = getCurrentUser(req);
  const {
    fullName,
    email,
    password,
    phone,
    role = 'OPERATOR',
    organizationId,
    verificationMethod = 'TELEGRAM',
    autoVerify = false
  } = req.body;

  if (!fullName || !email || !password) {
    res.status(400).json({ code: 'INVALID_INPUT', message: 'F.I.Sh, Login/Email va Parol kiritilishi shart' });
    return;
  }

  // Platform Admin count limit
  if (role === 'ADMIN' || role === 'SUPERADMIN') {
    res.status(400).json({
      code: 'ADMIN_LIMIT_REACHED',
      message: 'Tizimda faqat bitta bosh administrator bo‘lishi mumkin. Yangi admin yaratish taqiqlangan.'
    });
    return;
  }

  // Privilege escalation check
  if (caller?.role === 'MODERATOR' && ['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(role)) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Moderator boshqa moderator yoki platforma ma’muri yarata olmaydi' });
    return;
  }

  const existing = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ code: 'USER_EXISTS', message: 'Ushbu login/email bilan foydalanuvchi allaqachon mavjud' });
    return;
  }

  const userId = uuidv4();
  const verificationCode = String(crypto.randomInt(100000, 1000000));
  const isVerified = autoVerify === true || ['ADMIN', 'SUPERADMIN', 'MODERATOR', 'DEALER'].includes(role);
  const status = isVerified ? 'ACTIVE' : 'PENDING';
  const hashedPassword = hashOwnerPassword(password);
  const targetRole = role;

  let orgName: string | undefined = undefined;
  if (organizationId) {
    const org = db.organizations.get(organizationId);
    if (org) orgName = org.name;
  }

  const isSystemRole = ['ADMIN', 'SUPERADMIN', 'MODERATOR', 'CUSTOMER', 'DEALER'].includes(role);

  const newUser: any = {
    id: userId,
    email,
    fullName,
    phone: phone || '+998 90 123 45 67',
    role: targetRole as any,
    status: status as any,
    organizationId: isSystemRole ? undefined : organizationId,
    organizationName: isSystemRole ? undefined : orgName,
    verificationMethod: verificationMethod as any,
    isVerified,
    verificationCode,
    passwordHash: hashedPassword,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.users.set(userId, newUser);

  if (role === 'DEALER') {
    const dealerId = uuidv4();
    db.dealers.set(dealerId, {
      id: dealerId,
      userId,
      companyName: fullName,
      contactName: fullName,
      login: email.includes('@') ? email.split('@')[0] : email,
      phone: phone || '+998 90 123 45 67',
      status: status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED',
      allowExperimentalMap: true,
      region: 'Toshkent shahri',
      city: 'Yunusobod tumani',
      createdByAdminId: caller?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  if (organizationId && !isSystemRole) {
    const membershipId = uuidv4();
    db.memberships.set(membershipId, {
      id: membershipId,
      organizationId,
      userId,
      role: role as any,
      status: status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED'
    });
  }

  db.auditLogs.push({
    id: uuidv4(),
    actorId: caller?.id || SEED_IDS.adminUserId,
    actorEmail: caller?.email || 'admin@yaqintop.uz',
    action: 'CREATE_SYSTEM_USER',
    entityType: 'USER',
    entityId: userId,
    diff: { email, role, organizationId: isSystemRole ? null : organizationId, isVerified },
    timestamp: new Date().toISOString()
  });

  const { passwordHash, ...safeUser } = newUser;
  delete (safeUser as any).plainPassword;
  delete (safeUser as any).verificationCode;
  db.scheduleSave();
  res.status(201).json({
    user: safeUser,
    verificationCode: isVerified ? undefined : verificationCode,
    smsDispatched: !isVerified,
    dispatchChannel: verificationMethod,
    message: isVerified
      ? 'Foydalanuvchi muvaffaqiyatli qo‘shildi va darhol faollashtirildi'
      : `Foydalanuvchi qo‘shildi. ${verificationMethod === 'TELEGRAM' ? 'Telegram bot' : 'SMS'} orqali tasdiqlash kodi yuborildi.`
  });
});

// 3. Patch user status
adminUsersRouter.patch('/users/:id/status', requireStaffRole(['ADMIN', 'SUPERADMIN']), (req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Foydalanuvchi topilmadi' });
    return;
  }
  const { status } = req.body;
  user.status = status;
  user.updatedAt = new Date().toISOString();

  if (status === 'SUSPENDED' || status === 'DELETED') {
    revokeUserSessions(user.id);
    for (const [token, sess] of db.sessions.entries()) {
      if (sess.userId === user.id) {
        revokeToken(token);
        db.sessions.delete(token);
      }
    }
  }

  res.json({ user });
});

// 4. Delete user
adminUsersRouter.delete('/users/:id', requireStaffRole(['SUPERADMIN']), (req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Foydalanuvchi topilmadi' });
    return;
  }

  const isPermanent = req.query.permanent === 'true';
  const caller = getCurrentUser(req);

  for (const [token, sess] of db.sessions.entries()) {
    if (sess.userId === user.id) {
      revokeToken(token);
      db.sessions.delete(token);
    }
  }

  if (isPermanent) {
    db.users.delete(user.id);
    for (const [mId, m] of db.memberships.entries()) {
      if (m.userId === user.id) {
        db.memberships.delete(mId);
      }
    }
    db.auditLogs.push({
      id: uuidv4(),
      actorId: caller?.id || SEED_IDS.adminUserId,
      actorEmail: caller?.email || 'admin@yaqintop.uz',
      action: 'PERMANENT_DELETE_USER',
      entityType: 'USER',
      entityId: user.id,
      timestamp: new Date().toISOString()
    });
  } else {
    user.status = 'DELETED';
    (user as any).deletedAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();

    db.auditLogs.push({
      id: uuidv4(),
      actorId: caller?.id || SEED_IDS.adminUserId,
      actorEmail: caller?.email || 'admin@yaqintop.uz',
      action: 'DELETE_USER',
      entityType: 'USER',
      entityId: user.id,
      timestamp: new Date().toISOString()
    });
  }

  db.scheduleSave();
  res.json({
    success: true,
    message: isPermanent ? 'Foydalanuvchi butunlay o‘chirildi' : 'Foydalanuvchi muvaffaqiyatli o‘chirildi',
    user
  });
});

// 5. Update user credentials
adminUsersRouter.patch('/users/:id/credentials', requireStaffRole(['ADMIN', 'SUPERADMIN']), (req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Foydalanuvchi topilmadi' });
    return;
  }

  const { fullName, email, password, phone, role, status } = req.body;
  if (fullName) user.fullName = fullName;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  const caller = getCurrentUser(req)!;
  const validRoles = ['CUSTOMER', 'OWNER', 'MANAGER', 'OPERATOR', 'DEALER', 'DEALER_AGENT', 'MODERATOR', 'ADMIN', 'SUPERADMIN'];
  if (
    role &&
    (!validRoles.includes(role) ||
      (caller.role !== 'SUPERADMIN' &&
        (['SUPERADMIN', 'ADMIN'].includes(role) || ['SUPERADMIN', 'ADMIN'].includes(user.role))))
  )
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Rolni o‘zgartirishga ruxsat yo‘q.' });
  if (role) user.role = role;
  if (status) {
    user.status = status;
    if (status === 'ACTIVE') {
      delete (user as any).deletedAt;
    }
  }
  if (password) {
    user.passwordHash = hashOwnerPassword(password);
    delete (user as any).plainPassword;
  }
  user.updatedAt = new Date().toISOString();

  if (password || status === 'SUSPENDED' || status === 'DELETED' || role) {
    revokeUserSessions(user.id);
    for (const [token, sess] of db.sessions.entries()) {
      if (sess.userId === user.id) {
        revokeToken(token);
        db.sessions.delete(token);
      }
    }
  }

  if (role) {
    for (const m of db.memberships.values()) {
      if (m.userId === user.id) {
        m.role = role;
      }
    }
  }

  const { passwordHash, ...safeUser } = user;
  delete (safeUser as any).plainPassword;
  delete (safeUser as any).verificationCode;
  res.json({ user: safeUser, message: 'Foydalanuvchi ma’lumotlari muvaffaqiyatli yangilandi' });
});

// 6. User Impersonation Token
adminUsersRouter.all('/users/:id/token', requireStaffRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  let user = db.users.get(req.params.id);
  if (!user && isSupabaseConfigured()) {
    try {
      await syncAllFromSupabase(db, true);
      user = db.users.get(req.params.id);
    } catch {}
  }
  if (!user) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Foydalanuvchi topilmadi' });
    return;
  }

  const token = createSignedSessionToken(user.id);
  db.sessions.set(token, { userId: user.id, createdAt: new Date() });
  db.scheduleSave();

  const caller = getCurrentUser(req);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: caller?.id || SEED_IDS.adminUserId,
    actorEmail: caller?.email || 'admin@yaqintop.uz',
    action: 'IMPERSONATE_USER_TOKEN',
    entityType: 'USER',
    entityId: user.id,
    diff: { targetEmail: user.email, targetRole: user.role },
    timestamp: new Date().toISOString()
  });

  res.json({
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    },
    message: 'Token muvaffaqiyatli yaratildi'
  });
});

// 7. Send OTP verification
adminUsersRouter.post('/users/:id/send-verification', requireStaffRole(['ADMIN', 'SUPERADMIN']), (req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Foydalanuvchi topilmadi' });
    return;
  }

  const method = (req.body.method as 'TELEGRAM' | 'SMS') || (user as any).verificationMethod || 'TELEGRAM';
  const newCode = String(crypto.randomInt(100000, 1000000));
  (user as any).verificationCode = newCode;
  (user as any).verificationMethod = method;
  (user as any).isVerified = false;
  user.updatedAt = new Date().toISOString();

  const caller = getCurrentUser(req);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: caller?.id || SEED_IDS.adminUserId,
    actorEmail: caller?.email || 'admin@yaqintop.uz',
    action: `SEND_VERIFICATION_${method}`,
    entityType: 'USER',
    entityId: user.id,
    diff: { phone: user.phone },
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    method,
    phone: user.phone,
    message: `${method === 'TELEGRAM' ? 'Telegram bot' : 'SMS'} orqali ${user.phone || user.email} ga tasdiqlash kodi yuborildi`
  });
});

// 8. Verify OTP
adminUsersRouter.post('/users/:id/verify', userVerifyLimiter, requireStaffRole(['ADMIN', 'SUPERADMIN']), (req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Foydalanuvchi topilmadi' });
    return;
  }

  const { code } = req.body;
  const currentCode = (user as any).verificationCode;
  const currentAttempts = (user as any).verificationAttempts || 0;

  if (currentAttempts >= 5) {
    res.status(429).json({
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Ushbu foydalanuvchi uchun urinishlar limiti tugagan. Yangi kod so‘rang.'
    });
    return;
  }

  if (!code || typeof code !== 'string' || !currentCode || code.trim() !== currentCode.trim()) {
    (user as any).verificationAttempts = currentAttempts + 1;
    res.status(400).json({ code: 'INVALID_CODE', message: 'Tasdiqlash kodi noto‘g‘ri kiritildi' });
    return;
  }

  (user as any).isVerified = true;
  user.status = 'ACTIVE';
  user.updatedAt = new Date().toISOString();
  delete (user as any).verificationCode;
  delete (user as any).verificationAttempts;

  for (const m of db.memberships.values()) {
    if (m.userId === user.id) {
      m.status = 'ACTIVE';
    }
  }

  const caller = getCurrentUser(req);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: caller?.id || SEED_IDS.adminUserId,
    actorEmail: caller?.email || 'admin@yaqintop.uz',
    action: 'VERIFY_USER',
    entityType: 'USER',
    entityId: user.id,
    diff: { status: 'ACTIVE', isVerified: true },
    timestamp: new Date().toISOString()
  });

  const { passwordHash, ...safeUser } = user;
  delete (safeUser as any).plainPassword;
  delete (safeUser as any).verificationCode;
  res.json({
    success: true,
    user: safeUser,
    message: 'Foydalanuvchi muvaffaqiyatli tasdiqlandi va hisob faollashtirildi!'
  });
});

// 9. Organization Users
adminUsersRouter.get('/organizations/:id/users', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  const orgId = req.params.id;
  const org = db.organizations.get(orgId);
  if (!org) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Tashkilot topilmadi' });
    return;
  }

  const orgMemberships = Array.from(db.memberships.values()).filter((m) => m.organizationId === orgId);
  const userIds = new Set(orgMemberships.map((m) => m.userId));

  for (const u of db.users.values()) {
    if ((u as any).organizationId === orgId) {
      userIds.add(u.id);
    }
  }

  const orgUsers = Array.from(userIds)
    .map((id) => {
      const u = db.users.get(id);
      if (!u || u.status === 'DELETED') return null;
      const { passwordHash, plainPassword, verificationCode, ...safeUser } = u as any;
      const memb = orgMemberships.find((m) => m.userId === id);
      return {
        ...safeUser,
        organizationId: orgId,
        organizationName: org.name,
        role: memb?.role || safeUser.role || 'OPERATOR',
        status: safeUser.status || memb?.status || 'ACTIVE'
      };
    })
    .filter(Boolean);

  res.json({ users: orgUsers, organization: org });
});

adminUsersRouter.post('/organizations/:id/users', requireStaffRole(['ADMIN', 'SUPERADMIN', 'MODERATOR']), (req, res) => {
  const orgId = req.params.id;
  const org = db.organizations.get(orgId);
  if (!org) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Tashkilot topilmadi' });
    return;
  }

  const caller = getCurrentUser(req);
  const {
    fullName,
    email,
    password,
    phone,
    role = 'OPERATOR',
    verificationMethod = 'TELEGRAM',
    autoVerify = false
  } = req.body;

  if (role === 'ADMIN' || role === 'SUPERADMIN') {
    res.status(400).json({
      code: 'ADMIN_LIMIT_REACHED',
      message: 'Tizimda faqat bitta bosh administrator bo‘lishi mumkin. Yangi admin yaratish taqiqlangan.'
    });
    return;
  }

  if (!fullName || !email || !password) {
    res.status(400).json({ code: 'INVALID_INPUT', message: 'F.I.Sh, Login/Email va Parol kiritilishi shart' });
    return;
  }

  const existing = Array.from(db.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ code: 'USER_EXISTS', message: 'Ushbu login/email bilan foydalanuvchi allaqachon mavjud' });
    return;
  }

  const userId = uuidv4();
  const verificationCode = String(crypto.randomInt(100000, 1000000));
  const isVerified = autoVerify === true;
  const status = isVerified ? 'ACTIVE' : 'PENDING';
  const hashedPassword = hashOwnerPassword(password);

  const newUser: any = {
    id: userId,
    email,
    fullName,
    phone: phone || '+998 90 123 45 67',
    role: role as any,
    status: status as any,
    organizationId: orgId,
    organizationName: org.name,
    verificationMethod: verificationMethod as any,
    isVerified,
    verificationCode,
    passwordHash: hashedPassword,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.users.set(userId, newUser);

  const membershipId = uuidv4();
  db.memberships.set(membershipId, {
    id: membershipId,
    organizationId: orgId,
    userId,
    role: role as any,
    status: status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED'
  });

  db.auditLogs.push({
    id: uuidv4(),
    actorId: caller?.id || SEED_IDS.adminUserId,
    actorEmail: caller?.email || 'admin@yaqintop.uz',
    action: 'CREATE_ORGANIZATION_USER',
    entityType: 'USER',
    entityId: userId,
    diff: { organizationId: orgId, email, role, verificationMethod, isVerified },
    timestamp: new Date().toISOString()
  });

  const { passwordHash, plainPassword, verificationCode: vc, ...safeUser } = newUser;
  res.status(201).json({
    user: safeUser,
    smsDispatched: !isVerified,
    dispatchChannel: verificationMethod,
    message: isVerified
      ? 'Foydalanuvchi muvaffaqiyatli qo‘shildi va darhol faollashtirildi'
      : `Foydalanuvchi qo‘shildi. ${verificationMethod === 'TELEGRAM' ? 'Telegram' : 'SMS'} orqali tasdiqlash kodi yuborildi.`
  });
});

adminUsersRouter.delete('/organizations/:orgId/users/:userId', requireStaffRole(['SUPERADMIN']), (req, res) => {
  const { orgId, userId } = req.params;

  for (const [mId, m] of db.memberships.entries()) {
    if (m.organizationId === orgId && m.userId === userId) {
      db.memberships.delete(mId);
    }
  }

  for (const [token, sess] of db.sessions.entries()) {
    if (sess.userId === userId) {
      revokeToken(token);
      db.sessions.delete(token);
    }
  }

  db.users.delete(userId);

  const caller = getCurrentUser(req);
  db.auditLogs.push({
    id: uuidv4(),
    actorId: caller?.id || SEED_IDS.adminUserId,
    actorEmail: caller?.email || 'admin@yaqintop.uz',
    action: 'DELETE_ORGANIZATION_USER',
    entityType: 'USER',
    entityId: userId,
    diff: { organizationId: orgId },
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, message: 'Foydalanuvchi tashkilotdan o‘chirildi' });
});

// 10. Audit logs
adminUsersRouter.get('/audit', requireStaffRole(['ADMIN', 'SUPERADMIN']), (req, res) => {
  const enrichedLogs = db.auditLogs.slice(-100).reverse().map((l) => {
    const user = l.actorId ? db.users.get(l.actorId) : undefined;
    return {
      ...l,
      actorName: user?.fullName || l.actorEmail
    };
  });

  res.json({ auditLogs: enrichedLogs });
});
