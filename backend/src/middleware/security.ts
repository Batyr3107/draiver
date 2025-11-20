import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Helmet конфигурация для безопасности HTTP заголовков
 * Используем как функцию для совместимости
 */
export const helmetConfig = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=()');

  next();
};

/**
 * CORS конфигурация
 */
export const corsConfig = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
};

/**
 * Rate Limiting для защиты от DDoS
 */
export const rateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 минут
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 запросов
  message: {
    success: false,
    message: 'Слишком много запросов с вашего IP, попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip успешных запросов от authenticated пользователей
  skip: (req) => {
    return req.headers.authorization !== undefined;
  }
});

/**
 * Strict Rate Limiting для auth endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // только 5 попыток
  message: {
    success: false,
    message: 'Слишком много попыток входа, попробуйте через 15 минут'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Compression middleware
 */
export const compressionConfig = (req: Request, res: Response, next: NextFunction) => {
  // Простая проверка Accept-Encoding
  const acceptEncoding = req.headers['accept-encoding'] || '';

  if (acceptEncoding.includes('gzip')) {
    res.setHeader('Content-Encoding', 'gzip');
  }

  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Удаляем X-Powered-By
  res.removeHeader('X-Powered-By');

  // Strict-Transport-Security (HSTS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };

    if (res.statusCode >= 400) {
      console.error('❌', JSON.stringify(log));
    } else {
      console.log('✅', JSON.stringify(log));
    }
  });

  next();
};

/**
 * JSON размер лимит
 */
export const jsonSizeLimit = '10mb';

/**
 * URL encoded размер лимит
 */
export const urlEncodedSizeLimit = '10mb';
