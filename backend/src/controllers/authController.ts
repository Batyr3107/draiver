import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { RegisterDTO, LoginDTO } from '../types';

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

    // Генерация токена
    const token = generateToken({
      id: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    });

    res.status(201).json({
      message: 'Регистрация успешна',
      user,
      token,
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

    if (!user) {
      throw new AppError('Неверный номер телефона или пароль', 401);
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Неверный номер телефона или пароль', 401);
    }

    // Генерация токена
    const token = generateToken({
      id: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    });

    // Удаляем пароль из ответа
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Вход выполнен успешно',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;

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
        createdAt: true,
        driverProfile: true,
      },
    });

    if (!user) {
      throw new AppError('Пользователь не найден', 404);
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};
