import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest, CreateRideDTO } from '../types';
import { calculateDistance, estimateDuration, calculatePrice } from '../utils/distance';
import { RideStatus } from '@prisma/client';

export const createRide = async (
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
      pickupAddress,
      pickupLatitude,
      pickupLongitude,
      dropoffAddress,
      dropoffLatitude,
      dropoffLongitude,
      suggestedPrice,
      passengerNotes,
    }: CreateRideDTO = req.body;

    // Вычисляем расстояние и время
    const distance = calculateDistance(
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude
    );
    const duration = estimateDuration(distance);

    // Если цена не указана, вычисляем примерную
    const price = suggestedPrice || calculatePrice(distance);

    const ride = await prisma.ride.create({
      data: {
        passengerId: userId,
        pickupAddress,
        pickupLatitude,
        pickupLongitude,
        dropoffAddress,
        dropoffLatitude,
        dropoffLongitude,
        suggestedPrice: price,
        distance,
        duration,
        passengerNotes,
        status: RideStatus.REQUESTED,
      },
      include: {
        passenger: {
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

    // Здесь можно отправить WebSocket уведомление доступным водителям
    // io.emit('newRide', ride);

    res.status(201).json(ride);
  } catch (error) {
    next(error);
  }
};

export const getActiveRides = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const rides = await prisma.ride.findMany({
      where: {
        status: {
          in: [RideStatus.REQUESTED, RideStatus.BIDDING],
        },
      },
      include: {
        passenger: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rating: true,
          },
        },
        bids: {
          include: {
            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                rating: true,
              },
            },
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });

    res.json(rides);
  } catch (error) {
    next(error);
  }
};

export const getRideById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        passenger: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            rating: true,
          },
        },
        driver: {
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
        },
        bids: {
          include: {
            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                rating: true,
                driverProfile: true,
              },
            },
          },
          orderBy: {
            price: 'asc',
          },
        },
        payment: true,
        review: true,
      },
    });

    if (!ride) {
      throw new AppError('Поездка не найдена', 404);
    }

    res.json(ride);
  } catch (error) {
    next(error);
  }
};

export const getMyRides = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    let rides;

    if (role === 'PASSENGER') {
      rides = await prisma.ride.findMany({
        where: { passengerId: userId },
        include: {
          driver: {
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
          },
          bids: true,
        },
        orderBy: {
          requestedAt: 'desc',
        },
      });
    } else if (role === 'DRIVER') {
      // Находим профиль водителя
      const driverProfile = await prisma.driverProfile.findUnique({
        where: { userId },
      });

      if (!driverProfile) {
        throw new AppError('Профиль водителя не найден', 404);
      }

      rides = await prisma.ride.findMany({
        where: { driverId: driverProfile.id },
        include: {
          passenger: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              rating: true,
            },
          },
        },
        orderBy: {
          requestedAt: 'desc',
        },
      });
    }

    res.json(rides);
  } catch (error) {
    next(error);
  }
};

export const updateRideStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ride = await prisma.ride.update({
      where: { id },
      data: {
        status,
        ...(status === RideStatus.ACCEPTED && { acceptedAt: new Date() }),
        ...(status === RideStatus.IN_PROGRESS && { startedAt: new Date() }),
        ...(status === RideStatus.COMPLETED && { completedAt: new Date() }),
        ...(status === RideStatus.CANCELLED && { cancelledAt: new Date() }),
      },
      include: {
        passenger: true,
        driver: true,
      },
    });

    // Отправить WebSocket уведомление
    // io.to(ride.passengerId).emit('rideStatusUpdated', ride);

    res.json(ride);
  } catch (error) {
    next(error);
  }
};

export const cancelRide = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const ride = await prisma.ride.findUnique({
      where: { id },
    });

    if (!ride) {
      throw new AppError('Поездка не найдена', 404);
    }

    if (ride.passengerId !== userId) {
      throw new AppError('Вы не можете отменить эту поездку', 403);
    }

    if (ride.status === RideStatus.COMPLETED || ride.status === RideStatus.CANCELLED) {
      throw new AppError('Поездка уже завершена или отменена', 400);
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        status: RideStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    res.json(updatedRide);
  } catch (error) {
    next(error);
  }
};
