import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Проверить промокод
export const validatePromoCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { code } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        usages: {
          where: { userId }
        }
      }
    });

    if (!promoCode) {
      return res.status(404).json({ message: 'Промокод не найден' });
    }

    if (!promoCode.isActive) {
      return res.status(400).json({ message: 'Промокод неактивен' });
    }

    const now = new Date();
    if (now < promoCode.validFrom || now > promoCode.validUntil) {
      return res.status(400).json({ message: 'Промокод недействителен в данный момент' });
    }

    // Проверка максимального использования пользователем
    if (promoCode.usages.length >= promoCode.maxUsesPerUser) {
      return res.status(400).json({ message: 'Вы уже использовали этот промокод максимальное количество раз' });
    }

    // Проверка общего максимального использования
    if (promoCode.maxUses) {
      const totalUsages = await prisma.promoCodeUsage.count({
        where: { promoCodeId: promoCode.id }
      });

      if (totalUsages >= promoCode.maxUses) {
        return res.status(400).json({ message: 'Промокод исчерпан' });
      }
    }

    res.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        description: promoCode.description,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue
      }
    });
  } catch (error) {
    next(error);
  }
};

// Применить промокод (вызывается при создании поездки)
export const applyPromoCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { promoCodeId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    // Создать запись об использовании
    await prisma.promoCodeUsage.create({
      data: {
        userId,
        promoCodeId
      }
    });

    res.json({ message: 'Промокод применен' });
  } catch (error) {
    next(error);
  }
};

// Получить все промокоды (только для админов)
export const getAllPromoCodes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const promoCodes = await prisma.promoCode.findMany({
      include: {
        _count: {
          select: { usages: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(promoCodes);
  } catch (error) {
    next(error);
  }
};

// Создать промокод (только для админов)
export const createPromoCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const {
      code,
      description,
      discountType,
      discountValue,
      maxUses,
      maxUsesPerUser,
      validFrom,
      validUntil
    } = req.body;

    const promoCode = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue,
        maxUses,
        maxUsesPerUser,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil)
      }
    });

    res.status(201).json(promoCode);
  } catch (error) {
    next(error);
  }
};

// Деактивировать промокод (только для админов)
export const deactivatePromoCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const { id } = req.params;

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: { isActive: false }
    });

    res.json(promoCode);
  } catch (error) {
    next(error);
  }
};
