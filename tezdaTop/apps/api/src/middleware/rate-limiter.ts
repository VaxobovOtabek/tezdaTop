import { Request, Response, NextFunction } from 'express';

// In-Memory Sliding Window Rate Limiter
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
export const rateLimitMap = new Map<string, RateLimitRecord>();

// Periodic memory cleanup for expired rate limit keys
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000).unref();

export function createRateLimiter(options: { windowMs: number; max: number; message: string; keyPrefix?: string }) {
  const { windowMs, max, message, keyPrefix = 'rl' } = options;
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'test') return next();
    const clientIp = (req.ip || req.socket.remoteAddress || 'unknown').replace(/^::ffff:/, '');
    const key = `${keyPrefix}:${clientIp}`;
    const now = Date.now();
    let record = rateLimitMap.get(key);
    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      rateLimitMap.set(key, record);
      return next();
    }
    record.count++;
    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.status(429).json({ code: 'TOO_MANY_REQUESTS', message, retryAfter });
      return;
    }
    next();
  };
}

export const authLoginLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Kirish urinishlari ko‘payib ketdi. Iltimos, 1 daqiqadan so‘ng qayta urinib ko‘ring.',
  keyPrefix: 'login'
});

export const authRegisterLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Ro‘yxatdan o‘tish urinishlari ko‘payib ketdi. Iltimos, keyinroq urinib ko‘ring.',
  keyPrefix: 'register'
});

export const userVerifyLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Tasdiqlash kodi kiritish urinishlari ko‘payib ketdi.',
  keyPrefix: 'verify'
});

export const reportLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Shikoyat yuborish urinishlari ko‘payib ketdi. Iltimos, birozdan so‘ng urinib ko‘ring.',
  keyPrefix: 'report'
});

export const reviewLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Sharh qoldirish urinishlari ko‘payib ketdi. Iltimos, birozdan so‘ng urinib ko‘ring.',
  keyPrefix: 'review'
});
