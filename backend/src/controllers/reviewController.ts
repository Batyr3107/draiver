import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export const createReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { rideId, reviewedId, rating, comment } = req.body;

    if (!userId) {
      throw new AppError('Пользователь не авторизован', 401);
    }

    // Проверяем, существует ли поездка
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        passenger: true,
        driver: true,
      },
    });

    if (!ride) {
      throw new AppError('Поездка не найдена', 404);
    }

    // Проверяем, что поездка завершена
    if (ride.status !== 'COMPLETED') {
      throw new AppError('Можно оставить отзыв только для завершенной поездки', 400);
    }

    // Проверяем, что пользователь участвовал в поездке
    const isPassenger = ride.passengerId === userId;
    const isDriver = ride.driver?.userId === userId;

    if (!isPassenger && !isDriver) {
      throw new AppError('Вы не участвовали в этой поездке', 403);
    }

    // Проверяем, не оставлен ли уже отзыв
    const existingReview = await prisma.review.findUnique({
      where: { rideId },
    });

    if (existingReview) {
      throw new AppError('Отзыв уже оставлен для этой поездки', 400);
    }

    // Создаем отзыв
    const review = await prisma.review.create({
      data: {
        rideId,
        reviewerId: userId,
        reviewedId,
        rating,
        comment,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        reviewed: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Обновляем средний рейтинг пользователя
    const reviews = await prisma.review.findMany({
      where: { reviewedId },
    });

    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

    await prisma.user.update({
      where: { id: reviewedId },
      data: { rating: avgRating },
    });

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

export const getReviewsForUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { reviewedId: userId },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        ride: {
          select: {
            id: true,
            pickupAddress: true,
            dropoffAddress: true,
            completedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};
