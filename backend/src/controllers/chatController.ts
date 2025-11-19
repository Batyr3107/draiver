import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Получить все сообщения для поездки
export const getRideMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { rideId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    // Проверка что пользователь - участник поездки
    const ride = await prisma.ride.findFirst({
      where: {
        id: rideId,
        OR: [
          { passengerId: userId },
          { driver: { userId } }
        ]
      }
    });

    if (!ride) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const messages = await prisma.message.findMany({
      where: { rideId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Отметить сообщения как прочитанные
    await prisma.message.updateMany({
      where: {
        rideId,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// Отправить сообщение
export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { rideId, content } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    // Проверка что пользователь - участник поездки
    const ride = await prisma.ride.findFirst({
      where: {
        id: rideId,
        OR: [
          { passengerId: userId },
          { driver: { userId } }
        ]
      },
      include: {
        driver: true
      }
    });

    if (!ride) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    // Определить получателя
    let receiverId: string;
    if (ride.passengerId === userId) {
      // Пассажир пишет водителю
      if (!ride.driver) {
        return res.status(400).json({ message: 'Водитель еще не назначен' });
      }
      receiverId = ride.driver.userId;
    } else {
      // Водитель пишет пассажиру
      receiverId = ride.passengerId;
    }

    const message = await prisma.message.create({
      data: {
        rideId,
        senderId: userId,
        receiverId,
        content
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    // Создать уведомление для получателя
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'MESSAGE',
        title: 'Новое сообщение',
        message: `${message.sender.firstName} отправил сообщение`,
        data: { rideId, messageId: message.id }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

// Получить количество непрочитанных сообщений
export const getUnreadMessagesCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    res.json({ count });
  } catch (error) {
    next(error);
  }
};

// Отметить все сообщения поездки как прочитанные
export const markRideMessagesAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { rideId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    await prisma.message.updateMany({
      where: {
        rideId,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ message: 'Сообщения отмечены как прочитанные' });
  } catch (error) {
    next(error);
  }
};
