import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

// Кастомные ошибки
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Не авторизован') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Доступ запрещен') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ресурс не найден') {
    super(404, message);
  }
}

// Обработчик Prisma ошибок
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      return new ValidationError(`Запись с таким значением уже существует: ${error.meta?.target}`);
    case 'P2014':
      return new ValidationError('Нарушение связи между записями');
    case 'P2003':
      return new ValidationError('Нарушение внешнего ключа');
    case 'P2025':
      return new NotFoundError('Запись не найдена');
    default:
      return new AppError(500, 'Ошибка базы данных');
  }
};

// Обработчик Zod ошибок
const handleZodError = (error: ZodError): ValidationError => {
  const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
  return new ValidationError(`Ошибка валидации: ${messages.join(', ')}`);
};

// Главный обработчик ошибок
export const errorHandler = (error: Error, res: Response) => {
  // Логирование ошибки
  console.error('❌ Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    const appError = handleZodError(error);
    return res.status(appError.statusCode).json({
      success: false,
      message: appError.message
    });
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = handlePrismaError(error);
    return res.status(appError.statusCode).json({
      success: false,
      message: appError.message
    });
  }

  // Кастомные ошибки
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  // Неизвестные ошибки
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Внутренняя ошибка сервера'
      : error.message
  });
};

// Async wrapper для контроллеров
export const asyncHandler = (fn: Function) => {
  return (req: any, res: Response, next: Function) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      errorHandler(error, res);
    });
  };
};
