import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { asyncHandler, UnauthorizedError, NotFoundError } from '../utils/errorHandler';
import { sanitizeString } from '../utils/validation';

// Получить все избранные адреса пользователя
export const getSavedLocations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError();

  const locations = await prisma.savedLocation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: locations
  });
});

// Создать избранный адрес
export const createSavedLocation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError();

  const { type, name, address, latitude, longitude } = req.validatedData;

  // Sanitize строковые поля для защиты от XSS
  const sanitizedName = sanitizeString(name);
  const sanitizedAddress = sanitizeString(address);

  // Проверка на существование такого типа адреса
  const existing = await prisma.savedLocation.findUnique({
    where: {
      userId_type: {
        userId,
        type
      }
    }
  });

  let location;

  if (existing) {
    // Обновить существующий адрес
    location = await prisma.savedLocation.update({
      where: { id: existing.id },
      data: {
        name: sanitizedName,
        address: sanitizedAddress,
        latitude,
        longitude
      }
    });
  } else {
    // Создать новый адрес
    location = await prisma.savedLocation.create({
      data: {
        userId,
        type,
        name: sanitizedName,
        address: sanitizedAddress,
        latitude,
        longitude
      }
    });
  }

  res.status(201).json({
    success: true,
    data: location
  });
});

// Обновить избранный адрес
export const updateSavedLocation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError();

  const { id } = req.params;
  const updateData = req.validatedData;

  // Проверка прав доступа
  const location = await prisma.savedLocation.findFirst({
    where: { id, userId }
  });

  if (!location) {
    throw new NotFoundError('Адрес не найден');
  }

  // Sanitize строковые поля для защиты от XSS
  const sanitizedData: any = {};
  if (updateData.name) sanitizedData.name = sanitizeString(updateData.name);
  if (updateData.address) sanitizedData.address = sanitizeString(updateData.address);
  if (updateData.latitude) sanitizedData.latitude = updateData.latitude;
  if (updateData.longitude) sanitizedData.longitude = updateData.longitude;

  const updated = await prisma.savedLocation.update({
    where: { id },
    data: sanitizedData
  });

  res.json({
    success: true,
    data: updated
  });
});

// Удалить избранный адрес
export const deleteSavedLocation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError();

  const { id } = req.params;

  // Проверка прав доступа
  const location = await prisma.savedLocation.findFirst({
    where: { id, userId }
  });

  if (!location) {
    throw new NotFoundError('Адрес не найден');
  }

  await prisma.savedLocation.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Адрес удален'
  });
});
