import { Response, NextFunction } from 'express';
import { PrismaClient, LocationType } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Получить все избранные адреса пользователя
export const getSavedLocations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const locations = await prisma.savedLocation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(locations);
  } catch (error) {
    next(error);
  }
};

// Создать избранный адрес
export const createSavedLocation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { type, name, address, latitude, longitude } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    // Проверка на существование такого типа адреса
    const existing = await prisma.savedLocation.findUnique({
      where: {
        userId_type: {
          userId,
          type
        }
      }
    });

    if (existing) {
      // Обновить существующий адрес
      const updated = await prisma.savedLocation.update({
        where: { id: existing.id },
        data: { name, address, latitude, longitude }
      });
      return res.json(updated);
    }

    // Создать новый адрес
    const location = await prisma.savedLocation.create({
      data: {
        userId,
        type,
        name,
        address,
        latitude,
        longitude
      }
    });

    res.status(201).json(location);
  } catch (error) {
    next(error);
  }
};

// Обновить избранный адрес
export const updateSavedLocation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name, address, latitude, longitude } = req.body;

    // Проверка прав доступа
    const location = await prisma.savedLocation.findFirst({
      where: { id, userId }
    });

    if (!location) {
      return res.status(404).json({ message: 'Адрес не найден' });
    }

    const updated = await prisma.savedLocation.update({
      where: { id },
      data: { name, address, latitude, longitude }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// Удалить избранный адрес
export const deleteSavedLocation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Проверка прав доступа
    const location = await prisma.savedLocation.findFirst({
      where: { id, userId }
    });

    if (!location) {
      return res.status(404).json({ message: 'Адрес не найден' });
    }

    await prisma.savedLocation.delete({
      where: { id }
    });

    res.json({ message: 'Адрес удален' });
  } catch (error) {
    next(error);
  }
};
