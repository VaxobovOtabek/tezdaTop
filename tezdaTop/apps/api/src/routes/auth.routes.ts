import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/in-memory-db.js';
import { SEED_IDS } from '../db/seed-ids.js';
import {
  LoginRequestSchema,
  RegisterRequestSchema
} from '@yaqintop/contracts';
import {
  SESSION_TTL_MS,
  isSessionExpired,
  sessionExpiresAt,
  createSignedSessionToken,
  verifySignedSessionToken,
  revokeToken,
  isTokenRevoked
} from '../services/session.service.js';
import { verifyOwnerPassword, hashOwnerPassword } from '../services/owner-onboarding.service.js';
import { registerCustomer } from '../services/customer-registration.service.js';
import {
  isSupabaseConfigured,
  insertRegisteredCustomer
} from '../db/supabase.js';
import { isProduction, isAllowedOrigin } from '../middleware/security.middleware.js';
import { authLoginLimiter, authRegisterLimiter } from '../middleware/rate-limiter.js';
import { getCurrentUser } from '../middleware/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/login', authLoginLimiter, async (req, res) => {
  const parsed = LoginRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Login va parol kiritilishi shart' });
    return;
  }

  const { email, login, username, phone, password } = req.body;
  const rawIdentifier = (login || email || username || phone || '').toString().trim();

  if (!rawIdentifier || !password) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Login va parol kiritilishi shart' });
    return;
  }

  const normalizedInput = rawIdentifier.toLowerCase();
  const digitsOnlyInput = rawIdentifier.replace(/\D/g, '');

  const findUser = () =>
    Array.from(db.users.values()).find((u) => {
      const userEmail = u.email.toLowerCase();
      const userEmailPrefix = userEmail.split('@')[0];
      const userPhoneDigits = (u.phone || '').replace(/\D/g, '');

      // Strict matching: exact email, exact login/username (email prefix), or exact normalized full phone
      if (
        userEmail === normalizedInput ||
        userEmailPrefix === normalizedInput ||
        (normalizedInput === 'adminka' && u.role === 'SUPERADMIN')
      )
        return true;
      if (
        digitsOnlyInput.length >= 9 &&
        userPhoneDigits &&
        (userPhoneDigits === digitsOnlyInput || userPhoneDigits.endsWith(digitsOnlyInput))
      )
        return true;
      return false;
    }) || null;

  const matchedUser = findUser();

  if (!matchedUser || !verifyOwnerPassword(password, matchedUser.passwordHash)) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Login yoki parol noto‘g‘ri' });
    return;
  }

  if (matchedUser.status !== 'ACTIVE') {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Foydalanuvchi hisobi to‘xtatilgan' });
    return;
  }

  const token = createSignedSessionToken(matchedUser.id);
  db.sessions.set(token, { userId: matchedUser.id, createdAt: new Date() });

  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie('session_token', token, {
    httpOnly: true,
    secure: Boolean(isHttps && isProduction),
    sameSite: isHttps && isProduction ? 'none' : 'lax',
    maxAge: SESSION_TTL_MS
  });

  const { passwordHash, ...userClean } = matchedUser;
  delete (userClean as any).plainPassword;
  delete (userClean as any).verificationCode;
  if (matchedUser.role === 'DEALER' || matchedUser.role === 'DEALER_AGENT') {
    const dealer = Array.from(db.dealers.values()).find((d) => d.userId === matchedUser.id);
    if (dealer) {
      (userClean as any).dealer = {
        id: dealer.id,
        companyName: dealer.companyName,
        allowExperimentalMap: Boolean(dealer.allowExperimentalMap)
      };
    }
  }

  res.json({ user: userClean, token, expiresAt: sessionExpiresAt(db.sessions.get(token)!) });
});

// Local Development ONLY: Instant passwordless dev login for Admin and Moderator
authRouter.post('/dev-login', (req: Request, res: Response) => {
  if (process.env.VERCEL) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Dev login production (deploy) muhitida o‘chirilgan' });
    return;
  }

  const clientIp = (req.ip || req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  const isLoopback = clientIp === '127.0.0.1' || clientIp === '::1';
  if (!isLoopback) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Dev login faqat localhost orqali ruxsat etilgan' });
    return;
  }

  const host = (req.headers.host || '').toLowerCase();
  const isLocalHost =
    host.startsWith('localhost:') ||
    host.startsWith('127.0.0.1:') ||
    host.startsWith('[::1]:') ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]';
  if (!isLocalHost) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Dev login faqat mahalliy host orqali ruxsat etilgan' });
    return;
  }

  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Dev login begona manbadan taqiqlangan' });
    return;
  }

  const requestedRole = (req.body?.role || 'SUPERADMIN').toString().toUpperCase();
  let targetUser =
    Array.from(db.users.values()).find((u) => (u.role as string) === requestedRole && u.status === 'ACTIVE');

  if (!targetUser && requestedRole === 'CUSTOMER') {
    targetUser = Array.from(db.users.values()).find((u) => (u.role as string) === 'CUSTOMER');
    if (targetUser) {
      targetUser.status = 'ACTIVE';
    } else {
      const custId = SEED_IDS.customerUserId || uuidv4();
      targetUser = {
        id: custId,
        email: 'customer@yaqintop.uz',
        fullName: 'Otabek Xaridor',
        phone: '+998901112233',
        role: 'CUSTOMER' as any,
        status: 'ACTIVE',
        passwordHash: hashOwnerPassword('DemoPass123!'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.users.set(custId, targetUser);
    }
  }

  if (!targetUser) {
    targetUser =
      Array.from(db.users.values()).find(
        (u) => ((u.role as any) === 'SUPERADMIN' || (u.role as any) === 'ADMIN') && u.status === 'ACTIVE'
      ) ||
      Array.from(db.users.values())[0];
  }

  if (!targetUser) {
    res.status(404).json({ code: 'USER_NOT_FOUND', message: 'Foydalanuvchi topilmadi' });
    return;
  }

  const token = createSignedSessionToken(targetUser.id);
  db.sessions.set(token, { userId: targetUser.id, createdAt: new Date() });

  res.cookie('session_token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS
  });

  const { passwordHash, ...userClean } = targetUser;
  delete (userClean as any).plainPassword;
  delete (userClean as any).verificationCode;

  res.json({
    user: userClean,
    token,
    expiresAt: sessionExpiresAt(db.sessions.get(token)!)
  });
});

authRouter.post('/register', authRegisterLimiter, async (req, res) => {
  const parsed = RegisterRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      code: 'INVALID_REQUEST',
      message: 'Ism, ko‘pi bilan 8 belgili login, +998 formatidagi telefon va kamida 8 belgili parol kiriting'
    });
    return;
  }
  let newUser;
  try {
    newUser = await registerCustomer(db.users, parsed.data, async (user) => {
      await insertRegisteredCustomer(user);
      if (!isSupabaseConfigured() && !db.saveToFile()) throw new Error('LOCAL_SAVE_FAILED');
    });
  } catch (error: any) {
    const conflict = error?.code === '23505' || error?.message?.includes('allaqachon');
    res.status(conflict ? 409 : 503).json({
      code: conflict ? 'CONFLICT' : 'PERSISTENCE_FAILED',
      message: conflict ? 'Bu login yoki telefon allaqachon ro‘yxatdan o‘tgan' : 'Hisob bazaga saqlanmadi. Keyinroq qayta urinib ko‘ring.'
    });
    return;
  }

  const token = createSignedSessionToken(newUser.id);
  db.sessions.set(token, { userId: newUser.id, createdAt: new Date() });

  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie('session_token', token, {
    httpOnly: true,
    secure: Boolean(isHttps && isProduction),
    sameSite: isHttps && isProduction ? 'none' : 'lax',
    maxAge: SESSION_TTL_MS
  });

  const { passwordHash, ...userClean } = newUser;
  delete (userClean as any).plainPassword;
  delete (userClean as any).verificationCode;
  res.status(201).json({ user: userClean, token, expiresAt: sessionExpiresAt(db.sessions.get(token)!) });
});

// Quick Token Login (for direct impersonation / instant login via token)
authRouter.post('/token-login', async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    res.status(400).json({ code: 'INVALID_TOKEN', message: 'Token kiritilmadi' });
    return;
  }

  const cleanToken = token.trim();
  if (isTokenRevoked(cleanToken))
    return res.status(401).json({ code: 'INVALID_TOKEN', message: 'Token bekor qilingan' });
  let user = null;

  // 1. In-memory session check
  const session = db.sessions.get(cleanToken);
  if (session) {
    if (isSessionExpired(session)) {
      db.sessions.delete(cleanToken);
      res.status(401).json({ code: 'TOKEN_EXPIRED', message: 'Ushbu tokenning amal qilish muddati tugagan' });
      return;
    }
    user = db.users.get(session.userId);
  }

  // 2. Stateless / serverless signed token verification
  if (!user) {
    const verified = verifySignedSessionToken(cleanToken);
    if (verified) {
      user = db.users.get(verified.userId);
      if (user) {
        db.sessions.set(cleanToken, { userId: verified.userId, createdAt: new Date(verified.createdAt) });
      }
    }
  }

  if (!user) {
    res.status(401).json({ code: 'INVALID_TOKEN', message: 'Bunday token mavjud emas yoki eskirgan' });
    return;
  }

  if (user.status !== 'ACTIVE') {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Foydalanuvchi hisobi faol emas' });
    return;
  }

  res.cookie('session_token', cleanToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: SESSION_TTL_MS
  });

  const { passwordHash, ...userClean } = user as any;
  delete (userClean as any).plainPassword;
  delete (userClean as any).verificationCode;
  const activeSession = db.sessions.get(cleanToken);
  const expiresAt = activeSession ? sessionExpiresAt(activeSession) : Date.now() + SESSION_TTL_MS;

  res.json({
    user: userClean,
    token: cleanToken,
    expiresAt,
    message: `"${user.fullName}" hisobiga muvaffaqiyatli kirildi!`
  });
});

authRouter.get('/me', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Avtorizatsiyadan o‘tilmagan' });
    return;
  }
  const { passwordHash, ...userClean } = user as any;
  delete (userClean as any).plainPassword;
  delete (userClean as any).verificationCode;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader?.trim();
  const token = bearerToken || req.cookies?.session_token?.trim();
  const session = token ? db.sessions.get(token) : null;
  const expiresAt = session ? sessionExpiresAt(session) : Date.now() + SESSION_TTL_MS;
  res.setHeader('Cache-Control', 'no-store');
  res.json({ user: userClean, token, expiresAt });
});

authRouter.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader?.trim();
  const cookieToken = req.cookies?.session_token?.trim();
  const token = bearerToken || cookieToken;
  if (token) {
    db.sessions.delete(token);
    revokeToken(token);
  }
  if (cookieToken) {
    db.sessions.delete(cookieToken);
    revokeToken(cookieToken);
  }
  res.clearCookie('session_token');
  res.json({ success: true });
});

// User Credential Change Request (Sends to Admin for Approval)
authRouter.post('/request-credential-change', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }

  const { requestedEmail, requestedPassword, requestedFullName, requestedPhone, reason } = req.body;
  if (!requestedEmail && !requestedPassword && !requestedFullName && !requestedPhone) {
    res.status(400).json({ code: 'INVALID_REQUEST', message: 'Kamida bitta o‘zgarish maydoni to‘ldirilishi kerak' });
    return;
  }

  // Find membership & organization info
  const membership = Array.from(db.memberships.values()).find((m) => m.userId === user.id);
  let orgName: string | undefined;
  if (membership) {
    const org = db.organizations.get(membership.organizationId);
    if (org) orgName = org.name;
  }

  const requestId = uuidv4();
  const changeReq = {
    id: requestId,
    userId: user.id,
    userName: user.fullName,
    userEmail: user.email,
    userPhone: user.phone,
    userRole: user.role,
    organizationId: membership?.organizationId,
    organizationName: orgName,
    requestedEmail: requestedEmail?.trim(),
    requestedPassword: requestedPassword?.trim() ? hashOwnerPassword(requestedPassword.trim()) : undefined,
    requestedFullName: requestedFullName?.trim(),
    requestedPhone: requestedPhone?.trim(),
    reason: reason?.trim() || 'Foydalanuvchi profilingiz orqali so‘rov yuborildi',
    status: 'PENDING' as const,
    createdAt: new Date().toISOString()
  };

  db.credentialRequests.set(requestId, changeReq);

  // Notify superadmin
  db.notifications.set(uuidv4(), {
    id: uuidv4(),
    userId: SEED_IDS.adminUserId,
    title: 'Yangi login/parol almashtirish so‘rovi',
    message: `${user.fullName} (${user.email}) login/parol ma‘lumotlarini o‘zgartirish uchun so‘rov yubordi.`,
    type: 'WARNING',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  db.auditLogs.push({
    id: uuidv4(),
    actorId: user.id,
    actorEmail: user.email,
    action: 'REQUEST_CREDENTIAL_CHANGE',
    entityType: 'CREDENTIAL_REQUEST',
    entityId: requestId,
    diff: { requestedEmail, requestedFullName, reason },
    timestamp: new Date().toISOString()
  });

  const { requestedPassword: _, ...safeReq } = changeReq;
  res.status(201).json({
    success: true,
    request: safeReq,
    message:
      'So‘rovingiz adminga tasdiqlash uchun yuborildi. Admin tasdiqlagach yangi login/parol kuchga kiradi va sizga xabar yuboriladi.'
  });
});

// Get user's own credential requests
authRouter.get('/my-requests', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }

  const myReqs = Array.from(db.credentialRequests.values())
    .filter((r) => r.userId === user.id)
    .map(({ requestedPassword, ...safe }) => safe)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ requests: myReqs });
});

// Notifications
authRouter.get('/notifications', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }
  const targetUserId =
    ['ADMIN', 'SUPERADMIN'].includes(user.role) && req.query.userId ? String(req.query.userId) : user.id;

  const notifs = Array.from(db.notifications.values())
    .filter((n) => n.userId === targetUserId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ notifications: notifs });
});

authRouter.patch('/notifications/:id/read', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tizimga kiring' });
    return;
  }
  const notif = db.notifications.get(req.params.id);
  if (!notif) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Bildirishnoma topilmadi' });
    return;
  }
  if (notif.userId !== user.id && !['ADMIN', 'SUPERADMIN'].includes(user.role)) {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Ruxsat berilmagan' });
    return;
  }
  notif.isRead = true;
  res.json({ success: true, notification: notif });
});
