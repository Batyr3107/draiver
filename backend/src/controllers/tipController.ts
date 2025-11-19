import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Создать чаевые
export const createTip = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { rideId, amount, message } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    // Проверка что поездка завершена и пользователь был пассажиром
    const ride = await prisma.ride.findFirst({
      where: {
        id: rideId,
        passengerId: userId,
        status: 'COMPLETED'
      }
    });

    if (!ride) {
      return res.status(404).json({ message: 'Поездка не найдена или не завершена' });
    }

    if (!ride.driverId) {
      return res.status(400).json({ message: 'Водитель не найден' });
    }

    // Проверка что чаевые еще не оставлены
    const existingTip = await prisma.tip.findUnique({
      where: { rideId }
    });

    if (existingTip) {
      return res.status(400).json({ message: 'Чаевые уже оставлены для этой поездки' });
    }

    const tip = await prisma.tip.create({
      data: {
        rideId,
        userId,
        amount,
        message
      }
    });

    // Создать уведомление для водителя
    await prisma.notification.create({
      data: {
        userId: ride.driverId,
        type: 'PAYMENT_RECEIVED',
        title: 'Получены чаевые!',
        message: `Вы получили чаевые в размере ${amount} тенге${message ? `: "${message}"` : ''}`,
        data: { rideId, tipId: tip.id }
      }
    });

    res.status(201).json(tip);
  } catch (error) {
    next(error);
  }
};

// Получить чаевые для поездки
export const getTipForRide = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rideId } = req.params;

    const tip = await prisma.tip.findUnique({
      where: { rideId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    if (!tip) {
      return res.status(404).json({ message: 'Чаевые не найдены' });
    }

    res.json(tip);
  } catch (error) {
    next(error);
  }
};

// Получить статистику чаевых для водителя
export const getDriverTipsStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    // Получить профиль водителя
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId }
    });

    if (!driverProfile) {
      return res.status(403).json({ message: 'Только для водителей' });
    }

    // Получить все поездки водителя
    const rides = await prisma.ride.findMany({
      where: { driverId: driverProfile.id },
      select: { id: true }
    });

    const rideIds = rides.map(r => r.id);

    // Получить все чаевые
    const tips = await prisma.tip.findMany({
      where: { rideId: { in: rideIds } },
      include: {
        ride: {
          select: {
            passenger: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            completedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalTips = tips.reduce((sum, tip) => sum + tip.amount, 0);
    const averageTip = tips.length > 0 ? totalTips / tips.length : 0;

    res.json({
      total: totalTips,
      average: averageTip,
      count: tips.length,
      tips: tips.slice(0, 20) // Последние 20 чаевых
    });
  } catch (error) {
    next(error);
  }
};
