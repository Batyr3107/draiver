import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest, CreateBidDTO } from '../types';
import { RideStatus } from '@prisma/client';

export const createBid = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Пользователь не авторизован', 401);
    }

    const { rideId, price, message, estimatedArrival }: CreateBidDTO = req.body;

    // Проверяем, является ли пользователь водителем
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!driverProfile) {
      throw new AppError('Только водители могут делать предложения', 403);
    }

    if (!driverProfile.isVerified) {
      throw new AppError('Ваш профиль водителя не верифицирован', 403);
    }

    // Проверяем, существует ли поездка и можно ли делать предложения
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new AppError('Поездка не найдена', 404);
    }

    if (ride.status !== RideStatus.REQUESTED && ride.status !== RideStatus.BIDDING) {
      throw new AppError('Нельзя делать предложения для этой поездки', 400);
    }

    // Проверяем, не делал ли водитель уже предложение
    const existingBid = await prisma.bid.findUnique({
      where: {
        rideId_driverId: {
          rideId,
          driverId: userId,
        },
      },
    });

    if (existingBid) {
      // Обновляем существующее предложение
      const updatedBid = await prisma.bid.update({
        where: { id: existingBid.id },
        data: {
          price,
          message,
          estimatedArrival,
        },
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              rating: true,
              driverProfile: {
                select: {
                  vehicleBrand: true,
                  vehicleModel: true,
                  vehicleColor: true,
                  vehiclePlate: true,
                },
              },
            },
          },
        },
      });

      // Обновляем статус поездки на BIDDING
      await prisma.ride.update({
        where: { id: rideId },
        data: { status: RideStatus.BIDDING },
      });

      return res.json(updatedBid);
    }

    // Создаем новое предложение
    const bid = await prisma.bid.create({
      data: {
        rideId,
        driverId: userId,
        price,
        message,
        estimatedArrival,
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rating: true,
            driverProfile: {
              select: {
                vehicleBrand: true,
                vehicleModel: true,
                vehicleColor: true,
                vehiclePlate: true,
              },
            },
          },
        },
      },
    });

    // Обновляем статус поездки на BIDDING
    await prisma.ride.update({
      where: { id: rideId },
      data: { status: RideStatus.BIDDING },
    });

    // Отправить WebSocket уведомление пассажиру
    // io.to(ride.passengerId).emit('newBid', bid);

    res.status(201).json(bid);
  } catch (error) {
    next(error);
  }
};

export const acceptBid = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { bidId } = req.params;
    const userId = req.user?.id;

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        ride: true,
        driver: {
          select: {
            driverProfile: true,
          },
        },
      },
    });

    if (!bid) {
      throw new AppError('Предложение не найдено', 404);
    }

    // Проверяем, что пользователь - это пассажир этой поездки
    if (bid.ride.passengerId !== userId) {
      throw new AppError('Вы не можете принять это предложение', 403);
    }

    if (bid.ride.status === RideStatus.ACCEPTED || bid.ride.status === RideStatus.IN_PROGRESS) {
      throw new AppError('Поездка уже принята', 400);
    }

    // Принимаем предложение
    const updatedBid = await prisma.bid.update({
      where: { id: bidId },
      data: { isAccepted: true },
    });

    // Отклоняем все остальные предложения
    await prisma.bid.updateMany({
      where: {
        rideId: bid.rideId,
        id: { not: bidId },
      },
      data: { isRejected: true },
    });

    // Обновляем поездку
    const driverProfileId = bid.driver.driverProfile?.id;
    if (!driverProfileId) {
      throw new AppError('Профиль водителя не найден', 404);
    }

    const updatedRide = await prisma.ride.update({
      where: { id: bid.rideId },
      data: {
        driverId: driverProfileId,
        finalPrice: bid.price,
        status: RideStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
      include: {
        driver: {
          include: {
            user: true,
          },
        },
        passenger: true,
      },
    });

    // Отправить WebSocket уведомления
    // io.to(bid.driverId).emit('bidAccepted', updatedRide);

    res.json({
      bid: updatedBid,
      ride: updatedRide,
    });
  } catch (error) {
    next(error);
  }
};

export const getBidsForRide = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rideId } = req.params;

    const bids = await prisma.bid.findMany({
      where: { rideId },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rating: true,
            driverProfile: {
              select: {
                vehicleBrand: true,
                vehicleModel: true,
                vehicleColor: true,
                vehiclePlate: true,
                vehiclePhoto: true,
              },
            },
          },
        },
      },
      orderBy: {
        price: 'asc',
      },
    });

    res.json(bids);
  } catch (error) {
    next(error);
  }
};

export const deleteBid = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { bidId } = req.params;
    const userId = req.user?.id;

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
    });

    if (!bid) {
      throw new AppError('Предложение не найдено', 404);
    }

    if (bid.driverId !== userId) {
      throw new AppError('Вы не можете удалить это предложение', 403);
    }

    await prisma.bid.delete({
      where: { id: bidId },
    });

    res.json({ message: 'Предложение удалено' });
  } catch (error) {
    next(error);
  }
};
