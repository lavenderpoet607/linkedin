import { config } from '../config.js';

const requestStore = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestStore.entries()) {
    if (now - data.startTime > config.rateLimit.windowMs) {
      requestStore.delete(key);
    }
  }
}, 30000).unref();

export function rateLimiter(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const key = req.user ? `user:${req.user.id}` : `ip:${ip}`;
  const now = Date.now();

  let record = requestStore.get(key);
  if (!record || now - record.startTime > config.rateLimit.windowMs) {
    record = { count: 1, startTime: now };
    requestStore.set(key, record);
    return next();
  }

  record.count += 1;
  if (record.count > config.rateLimit.maxRequests) {
    const retryAfter = Math.ceil((config.rateLimit.windowMs - (now - record.startTime)) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests, please retry shortly',
      retryAfterSeconds: retryAfter
    });
  }

  next();
}
