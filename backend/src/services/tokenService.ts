import { User, RefreshToken } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import prisma from '../config/database';
import crypto from 'crypto';

/**
 * Auth Service с поддержкой Refresh Tokens
 * Access Token - 15 минут
 * Refresh Token - 7 дней
 */

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Генерация пары access + refresh токенов
 */
export async function generateTokenPair(
  user: User,
  ipAddress?: string,
  userAgent?: string
): Promise<TokenPair> {
  // Access token (короткоживущий - 15 минут)
  const accessToken = generateToken(
    {
      id: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    },
    '15m'
  );

  // Refresh token (долгоживущий - 7 дней)
  const refreshTokenString = crypto.randomBytes(64).toString('hex');

  // Сохраняем refresh token в БД
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 дней

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshTokenString,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenString,
  };
}

/**
 * Обновление access token по refresh token
 */
export async function refreshAccessToken(
  refreshTokenString: string,
  ipAddress?: string,
  userAgent?: string
): Promise<TokenPair | null> {
  // Находим refresh token
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenString },
    include: { user: true },
  });

  // Проверяем существование и валидность
  if (!refreshToken) {
    return null;
  }

  // Проверяем срок действия
  if (refreshToken.expiresAt < new Date()) {
    // Удаляем истекший токен
    await prisma.refreshToken.delete({
      where: { id: refreshToken.id },
    });
    return null;
  }

  // Проверяем, не заблокирован ли пользователь
  if (refreshToken.user.isBlocked || refreshToken.user.deletedAt) {
    return null;
  }

  // Удаляем старый refresh token (rotation)
  await prisma.refreshToken.delete({
    where: { id: refreshToken.id },
  });

  // Генерируем новую пару токенов
  return generateTokenPair(refreshToken.user, ipAddress, userAgent);
}

/**
 * Удаление всех refresh токенов пользователя (logout на всех устройствах)
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

/**
 * Удаление конкретного refresh token (logout на одном устройстве)
 */
export async function revokeRefreshToken(refreshTokenString: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshTokenString },
  });
}

/**
 * Очистка истекших токенов (запускать через cron)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}

/**
 * Получение всех активных сессий пользователя
 */
export async function getUserSessions(userId: string): Promise<RefreshToken[]> {
  return prisma.refreshToken.findMany({
    where: {
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
