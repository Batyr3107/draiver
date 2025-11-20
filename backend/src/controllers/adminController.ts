import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { loggers } from '../utils/logger';

/**
 * Админ контроллер
 * Управление платформой, пользователями, водителями, поездками
 */

/**
 * Получение статистики платформы
 * GET /api/admin/stats
 */
export const getPlatformStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { timeRange = 'day' } = req.query;

    // Определяем временной диапазон
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Параллельные запросы для оптимизации
    const [
      totalUsers,
      totalDrivers,
      totalRides,
      activeRides,
      completedRides,
      newUsersInRange,
      newRidesInRange,
      revenueData,
      averageRatingData,
    ] = await Promise.all([
      // Всего пользователей
      prisma.user.count(),

      // Всего водителей
      prisma.driverProfile.count(),

      // Всего поездок
      prisma.ride.count(),

      // Активные поездки
      prisma.ride.count({
        where: {
          status: {
            in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'],
          },
        },
      }),

      // Завершенные поездки
      prisma.ride.count({
        where: { status: 'COMPLETED' },
      }),

      // Новые пользователи за период
      prisma.user.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),

      // Новые поездки за период
      prisma.ride.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),

      // Общая выручка
      prisma.ride.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { finalPrice: true },
      }),

      // Средний рейтинг
      prisma.user.aggregate({
        _avg: { rating: true },
      }),
    ]);

    const totalRevenue = revenueData._sum.finalPrice || 0;
    const averageRating = averageRatingData._avg.rating || 0;

    loggers.apiRequest('GET', '/api/admin/stats', req.user?.id, 200);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDrivers,
        totalRides,
        activeRides,
        completedRides,
        totalRevenue,
        averageRating: Number(averageRating.toFixed(2)),
        newUsersToday: newUsersInRange,
        newRidesToday: newRidesInRange,
        timeRange,
      },
    });
  } catch (error) {
    loggers.error('Error fetching platform stats', error as Error, { userId: req.user?.id });
    next(error);
  }
};

/**
 * Получение последней активности
 * GET /api/admin/activity
 */
export const getRecentActivity = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { limit = '20' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    // Последние поездки с информацией о пассажирах и водителях
    const recentRides = await prisma.ride.findMany({
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        passenger: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        driver: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Формируем список активностей
    const activities = recentRides.map((ride) => ({
      id: ride.id,
      type: 'ride',
      status: ride.status,
      passengerName: `${ride.passenger.firstName} ${ride.passenger.lastName}`,
      driverName: ride.driver
        ? `${ride.driver.user.firstName} ${ride.driver.user.lastName}`
        : 'Не назначен',
      from: ride.pickupAddress,
      to: ride.dropoffAddress,
      price: ride.finalPrice || ride.estimatedPrice,
      createdAt: ride.createdAt,
    }));

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    loggers.error('Error fetching recent activity', error as Error, { userId: req.user?.id });
    next(error);
  }
};

/**
 * Получение списка пользователей с фильтрами
 * GET /api/admin/users
 */
export const getUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '20', role, search } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Фильтры
    const where: any = {};

    if (role && role !== 'ALL') {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phoneNumber: { contains: search as string } },
      ];
    }

    // Параллельные запросы
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          role: true,
          isBlocked: true,
          totalRides: true,
          rating: true,
          loyaltyTier: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    loggers.error('Error fetching users', error as Error, { userId: req.user?.id });
    next(error);
  }
};

/**
 * Блокировка/разблокировка пользователя
 * PUT /api/admin/users/:id/block
 */
export const blockUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    // Проверка, что не блокируем самого себя
    if (id === req.user?.id) {
      throw new AppError('Нельзя заблокировать самого себя', 400);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isBlocked },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isBlocked: true,
      },
    });

    loggers.success(
      `User ${isBlocked ? 'blocked' : 'unblocked'}: ${user.firstName} ${user.lastName}`,
      { adminId: req.user?.id, userId: id }
    );

    res.json({
      success: true,
      message: `Пользователь ${isBlocked ? 'заблокирован' : 'разблокирован'}`,
      data: user,
    });
  } catch (error) {
    loggers.error('Error blocking/unblocking user', error as Error, {
      adminId: req.user?.id,
      userId: req.params.id,
    });
    next(error);
  }
};

/**
 * Изменение роли пользователя
 * PUT /api/admin/users/:id/role
 */
export const changeUserRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Валидация роли
    const validRoles = ['PASSENGER', 'DRIVER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      throw new AppError('Неверная роль', 400);
    }

    // Проверка, что не меняем роль самому себе
    if (id === req.user?.id) {
      throw new AppError('Нельзя изменить роль самому себе', 400);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // Если меняем на DRIVER, создаем профиль водителя
    if (role === 'DRIVER') {
      const existingDriverProfile = await prisma.driverProfile.findUnique({
        where: { userId: id },
      });

      if (!existingDriverProfile) {
        await prisma.driverProfile.create({
          data: {
            userId: id,
            vehicleType: 'ECONOMY',
            vehicleMake: '',
            vehicleModel: '',
            vehicleYear: new Date().getFullYear(),
            vehicleColor: '',
            vehicleNumber: '',
            licenseNumber: '',
            isVerified: false,
            isAvailable: false,
          },
        });
      }
    }

    loggers.success(
      `User role changed: ${user.firstName} ${user.lastName} -> ${role}`,
      { adminId: req.user?.id, userId: id }
    );

    res.json({
      success: true,
      message: `Роль изменена на ${role}`,
      data: user,
    });
  } catch (error) {
    loggers.error('Error changing user role', error as Error, {
      adminId: req.user?.id,
      userId: req.params.id,
    });
    next(error);
  }
};

/**
 * Получение списка водителей с фильтрами
 * GET /api/admin/drivers
 */
export const getDrivers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, search } = req.query;

    // Фильтры
    const where: any = {};

    if (status === 'VERIFIED') {
      where.isVerified = true;
    } else if (status === 'PENDING') {
      where.isVerified = false;
    } else if (status === 'AVAILABLE') {
      where.isAvailable = true;
    }

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { phoneNumber: { contains: search as string } },
        ],
      };
    }

    const drivers = await prisma.driverProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            rating: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: drivers,
    });
  } catch (error) {
    loggers.error('Error fetching drivers', error as Error, { userId: req.user?.id });
    next(error);
  }
};

/**
 * Верификация водителя
 * PUT /api/admin/drivers/:id/verify
 */
export const verifyDriver = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const driver = await prisma.driverProfile.update({
      where: { id },
      data: { isVerified },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    loggers.success(
      `Driver ${isVerified ? 'verified' : 'unverified'}: ${driver.user.firstName} ${driver.user.lastName}`,
      { adminId: req.user?.id, driverId: id }
    );

    res.json({
      success: true,
      message: `Водитель ${isVerified ? 'верифицирован' : 'отклонен'}`,
      data: driver,
    });
  } catch (error) {
    loggers.error('Error verifying driver', error as Error, {
      adminId: req.user?.id,
      driverId: req.params.id,
    });
    next(error);
  }
};

/**
 * Получение списка поездок с фильтрами
 * GET /api/admin/rides
 */
export const getRides = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Фильтры
    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [rides, totalCount] = await Promise.all([
      prisma.ride.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          passenger: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          },
          driver: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phoneNumber: true,
                },
              },
              vehicleNumber: true,
            },
          },
        },
      }),
      prisma.ride.count({ where }),
    ]);

    res.json({
      success: true,
      data: rides,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
      },
    });
  } catch (error) {
    loggers.error('Error fetching rides', error as Error, { userId: req.user?.id });
    next(error);
  }
};

/**
 * Получение статистики по поездкам
 * GET /api/admin/rides/stats
 */
export const getRideStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      total,
      active,
      completed,
      cancelled,
      revenueData,
    ] = await Promise.all([
      prisma.ride.count(),
      prisma.ride.count({
        where: {
          status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] },
        },
      }),
      prisma.ride.count({ where: { status: 'COMPLETED' } }),
      prisma.ride.count({ where: { status: 'CANCELLED' } }),
      prisma.ride.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { finalPrice: true },
      }),
    ]);

    const revenue = revenueData._sum.finalPrice || 0;

    res.json({
      success: true,
      data: {
        total,
        active,
        completed,
        cancelled,
        revenue,
      },
    });
  } catch (error) {
    loggers.error('Error fetching ride stats', error as Error, { userId: req.user?.id });
    next(error);
  }
};
