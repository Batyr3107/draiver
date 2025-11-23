import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { RegisterDTO, LoginDTO, AuthRequest } from '../types';
import {
  generateTokenPair,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  getUserSessions,
} from '../services/tokenService';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phoneNumber, email, password, firstName, lastName, role }: RegisterDTO = req.body;

    // Проверка существования пользователя
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber },
          ...(email ? [{ email }] : []),
        ],
        deletedAt: null, // Только активные пользователи
      },
    });

    if (existingUser) {
      throw new AppError('Пользователь с таким номером или email уже существует', 400);
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        phoneNumber,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
      },
      select: {
        id: true,
        phoneNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        rating: true,
        createdAt: true,
      },
    });

    // Генерация пары токенов
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const tokens = await generateTokenPair(
      { ...user, password: hashedPassword, isBlocked: false, loyaltyTier: 'BRONZE', loyaltyPoints: 0, referralCode: '', referredById: null, deletedAt: null, totalRides: 0, updatedAt: new Date(), createdAt: new Date() },
      ipAddress,
      userAgent
    );

    res.status(201).json({
      success: true,
      message: 'Регистрация успешна',
      user,
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phoneNumber, password }: LoginDTO = req.body;

    // Поиск пользователя
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user || user.deletedAt) {
      throw new AppError('Неверный номер телефона или пароль', 401);
    }

    // Проверка блокировки
    if (user.isBlocked) {
      throw new AppError('Аккаунт заблокирован. Обратитесь в поддержку.', 403);
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Неверный номер телефона или пароль', 401);
    }

    // Генерация пары токенов
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const tokens = await generateTokenPair(user, ipAddress, userAgent);

    // Удаляем пароль из ответа
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      user: userWithoutPassword,
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token не предоставлен', 400);
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Обновляем токены
    const tokens = await refreshAccessToken(refreshToken, ipAddress, userAgent);

    if (!tokens) {
      throw new AppError('Невалидный или истекший refresh token', 401);
    }

    res.json({
      success: true,
      message: 'Токен обновлен',
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Удаляем конкретный refresh token (logout на одном устройстве)
      await revokeRefreshToken(refreshToken);
    }

    res.json({
      success: true,
      message: 'Выход выполнен успешно',
    });
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Пользователь не авторизован', 401);
    }

    // Удаляем все refresh tokens пользователя
    await revokeAllUserTokens(userId);

    res.json({
      success: true,
      message: 'Выход выполнен на всех устройствах',
    });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Пользователь не авторизован', 401);
    }

    const sessions = await getUserSessions(userId);

    res.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s.id,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Пользователь не авторизован', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phoneNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        rating: true,
        totalRides: true,
        loyaltyTier: true,
        loyaltyPoints: true,
        createdAt: true,
        driverProfile: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new AppError('Пользователь не найден', 404);
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};
