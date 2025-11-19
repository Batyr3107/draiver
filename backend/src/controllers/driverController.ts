import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest, DriverProfileDTO, UpdateDriverLocationDTO } from '../types';

export const createDriverProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Пользователь не авторизован', 401);
    }

    const {
      licenseNumber,
      vehicleBrand,
      vehicleModel,
      vehicleYear,
      vehicleColor,
      vehiclePlate,
      vehiclePhoto,
    }: DriverProfileDTO = req.body;

    // Проверяем, нет ли уже профиля
    const existingProfile = await prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new AppError('Профиль водителя уже существует', 400);
    }

    const driverProfile = await prisma.driverProfile.create({
      data: {
        userId,
        licenseNumber,
        vehicleBrand,
        vehicleModel,
        vehicleYear,
        vehicleColor,
        vehiclePlate,
        vehiclePhoto,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            rating: true,
          },
        },
      },
    });

    res.status(201).json(driverProfile);
  } catch (error) {
    next(error);
  }
};

export const getDriverProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
            rating: true,
            totalRides: true,
          },
        },
      },
    });

    if (!driverProfile) {
      throw new AppError('Профиль водителя не найден', 404);
    }

    res.json(driverProfile);
  } catch (error) {
    next(error);
  }
};

export const updateDriverProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const updateData = req.body;

    const driverProfile = await prisma.driverProfile.update({
      where: { userId },
      data: updateData,
    });

    res.json(driverProfile);
  } catch (error) {
    next(error);
  }
};

export const toggleAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!driverProfile) {
      throw new AppError('Профиль водителя не найден', 404);
    }

    const updatedProfile = await prisma.driverProfile.update({
      where: { userId },
      data: {
        isAvailable: !driverProfile.isAvailable,
      },
    });

    res.json(updatedProfile);
  } catch (error) {
    next(error);
  }
};

export const updateLocation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { latitude, longitude }: UpdateDriverLocationDTO = req.body;

    const driverProfile = await prisma.driverProfile.update({
      where: { userId },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
      },
    });

    // Отправить WebSocket обновление всем заинтересованным
    // io.emit('driverLocationUpdated', { driverId: driverProfile.id, latitude, longitude });

    res.json(driverProfile);
  } catch (error) {
    next(error);
  }
};

export const getNearbyDrivers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    if (!latitude || !longitude) {
      throw new AppError('Координаты обязательны', 400);
    }

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const rad = parseFloat(radius as string);

    // Простой расчет границ (можно улучшить)
    const latRange = rad / 111; // 1 градус широты ≈ 111 км
    const lngRange = rad / (111 * Math.cos(lat * Math.PI / 180));

    const drivers = await prisma.driverProfile.findMany({
      where: {
        isAvailable: true,
        isVerified: true,
        currentLatitude: {
          gte: lat - latRange,
          lte: lat + latRange,
        },
        currentLongitude: {
          gte: lng - lngRange,
          lte: lng + lngRange,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rating: true,
          },
        },
      },
    });

    res.json(drivers);
  } catch (error) {
    next(error);
  }
};
