import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Ошибка валидации',
          details: error.errors,
        });
      }
      next(error);
    }
  };
};

// Схемы валидации
export const registerSchema = z.object({
  phoneNumber: z.string().regex(/^\+7\d{10}$/, 'Неверный формат номера телефона'),
  email: z.string().email('Неверный формат email').optional(),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  firstName: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  lastName: z.string().min(2, 'Фамилия должна содержать минимум 2 символа'),
  role: z.enum(['PASSENGER', 'DRIVER', 'ADMIN']),
});

export const loginSchema = z.object({
  phoneNumber: z.string().regex(/^\+7\d{10}$/),
  password: z.string(),
});

export const createRideSchema = z.object({
  pickupAddress: z.string().min(1),
  pickupLatitude: z.number().min(-90).max(90),
  pickupLongitude: z.number().min(-180).max(180),
  dropoffAddress: z.string().min(1),
  dropoffLatitude: z.number().min(-90).max(90),
  dropoffLongitude: z.number().min(-180).max(180),
  suggestedPrice: z.number().positive().optional(),
  passengerNotes: z.string().optional(),
});

export const createBidSchema = z.object({
  rideId: z.string().uuid(),
  price: z.number().positive(),
  message: z.string().optional(),
  estimatedArrival: z.number().int().positive().optional(),
});
