import { z } from 'zod';
import { LocationType } from '@prisma/client';

// Общие схемы
export const idSchema = z.object({
  id: z.string().uuid('Неверный формат ID')
});

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

// Телефон (Казахстан)
const phoneRegex = /^\+7\d{10}$/;
export const phoneSchema = z.string().regex(phoneRegex, 'Неверный формат телефона (+7XXXXXXXXXX)');

// Email
export const emailSchema = z.string().email('Неверный формат email');

// Пароль (минимум 8 символов)
export const passwordSchema = z.string().min(8, 'Пароль должен содержать минимум 8 символов');

// Схемы для SavedLocation
export const createLocationSchema = z.object({
  type: z.nativeEnum(LocationType),
  name: z.string().min(1, 'Название обязательно').max(100),
  address: z.string().min(1, 'Адрес обязателен').max(255),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export const updateLocationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().min(1).max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
});

// Схемы для PromoCode
export const validatePromoCodeSchema = z.object({
  code: z.string().min(1, 'Промокод обязателен').max(50).toUpperCase()
});

export const createPromoCodeSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  description: z.string().max(255).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  maxUses: z.number().int().positive().optional(),
  maxUsesPerUser: z.number().int().positive().default(1),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime()
}).refine(data => {
  if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
    return false;
  }
  return true;
}, {
  message: 'Процентная скидка не может быть больше 100'
}).refine(data => {
  const from = new Date(data.validFrom);
  const until = new Date(data.validUntil);
  return from < until;
}, {
  message: 'validUntil должен быть позже validFrom'
});

// Схемы для Tip
export const createTipSchema = z.object({
  rideId: z.string().uuid(),
  amount: z.number().positive('Сумма чаевых должна быть положительной').max(100000),
  message: z.string().max(500).optional()
});

// Схемы для Message
export const sendMessageSchema = z.object({
  rideId: z.string().uuid(),
  content: z.string().min(1, 'Сообщение не может быть пустым').max(1000)
});

// Схемы для Notification
export const notificationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

// Защита от XSS
export const sanitizeString = (str: string): string => {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Валидация middleware
export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validated = schema.parse({
        ...req.body,
        ...req.params,
        ...req.query
      });

      // Заменяем оригинальные данные валидированными
      req.validatedData = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Ошибка валидации',
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};
