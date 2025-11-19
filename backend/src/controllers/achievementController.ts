import { Response, NextFunction } from 'express';
import { PrismaClient, AchievementType } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Получить все достижения пользователя
export const getUserAchievements = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true
      },
      orderBy: { unlockedAt: 'desc' }
    });

    // Получить все доступные достижения
    const allAchievements = await prisma.achievement.findMany();

    // Определить какие достижения еще не разблокированы
    const unlockedIds = userAchievements.map(ua => ua.achievementId);
    const locked = allAchievements.filter(a => !unlockedIds.includes(a.id));

    res.json({
      unlocked: userAchievements,
      locked,
      totalPoints: userAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0)
    });
  } catch (error) {
    next(error);
  }
};

// Проверить и разблокировать достижения для пользователя
export const checkAndUnlockAchievements = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        passengerRides: {
          where: { status: 'COMPLETED' }
        },
        achievements: true
      }
    });

    if (!user) return;

    const unlockedTypes = user.achievements.map(ua => ua.achievement);
    const newAchievements: AchievementType[] = [];

    // Проверка достижений по количеству поездок
    const completedRidesCount = user.passengerRides.length;

    if (completedRidesCount === 1 && !unlockedTypes.some(a => a.type === 'FIRST_RIDE')) {
      newAchievements.push('FIRST_RIDE');
    }
    if (completedRidesCount >= 10 && !unlockedTypes.some(a => a.type === 'RIDES_10')) {
      newAchievements.push('RIDES_10');
    }
    if (completedRidesCount >= 50 && !unlockedTypes.some(a => a.type === 'RIDES_50')) {
      newAchievements.push('RIDES_50');
    }
    if (completedRidesCount >= 100 && !unlockedTypes.some(a => a.type === 'RIDES_100')) {
      newAchievements.push('RIDES_100');
    }
    if (completedRidesCount >= 500 && !unlockedTypes.some(a => a.type === 'RIDES_500')) {
      newAchievements.push('RIDES_500');
    }

    // Проверка рейтинга
    if (user.rating && user.rating === 5.0 && completedRidesCount >= 20) {
      if (user.role === 'DRIVER' && !unlockedTypes.some(a => a.type === 'FIVE_STAR_DRIVER')) {
        newAchievements.push('FIVE_STAR_DRIVER');
      }
      if (user.role === 'PASSENGER' && !unlockedTypes.some(a => a.type === 'FIVE_STAR_PASSENGER')) {
        newAchievements.push('FIVE_STAR_PASSENGER');
      }
    }

    // Проверка рефералов
    const referralsCount = await prisma.user.count({
      where: { referredById: userId }
    });

    if (referralsCount >= 10 && !unlockedTypes.some(a => a.type === 'REFERRAL_MASTER')) {
      newAchievements.push('REFERRAL_MASTER');
    }

    // Разблокировать новые достижения
    for (const type of newAchievements) {
      const achievement = await prisma.achievement.findUnique({
        where: { type }
      });

      if (achievement) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id
          }
        });

        // Добавить баллы лояльности
        await prisma.user.update({
          where: { id: userId },
          data: {
            loyaltyPoints: {
              increment: achievement.points
            }
          }
        });

        // Создать уведомление
        await prisma.notification.create({
          data: {
            userId,
            type: 'ACHIEVEMENT',
            title: 'Новое достижение!',
            message: `Вы разблокировали достижение "${achievement.name}"!`,
            data: { achievementId: achievement.id }
          }
        });
      }
    }

    // Обновить уровень лояльности
    await updateLoyaltyTier(userId);
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
};

// Обновить уровень лояльности пользователя
const updateLoyaltyTier = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) return;

  let newTier = user.loyaltyTier;

  if (user.loyaltyPoints >= 5000) {
    newTier = 'PLATINUM';
  } else if (user.loyaltyPoints >= 2000) {
    newTier = 'GOLD';
  } else if (user.loyaltyPoints >= 500) {
    newTier = 'SILVER';
  } else {
    newTier = 'BRONZE';
  }

  if (newTier !== user.loyaltyTier) {
    await prisma.user.update({
      where: { id: userId },
      data: { loyaltyTier: newTier }
    });

    await prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: 'Новый уровень!',
        message: `Поздравляем! Вы достигли уровня ${newTier}!`,
        data: { tier: newTier }
      }
    });
  }
};

// Получить информацию о программе лояльности
export const getLoyaltyInfo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        loyaltyTier: true,
        loyaltyPoints: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const tierBenefits = {
      BRONZE: {
        name: 'Бронза',
        minPoints: 0,
        benefits: ['Базовые функции', 'Стандартная поддержка']
      },
      SILVER: {
        name: 'Серебро',
        minPoints: 500,
        benefits: ['Приоритетная поддержка', 'Скидка 5% на поездки', 'Ранний доступ к промокодам']
      },
      GOLD: {
        name: 'Золото',
        minPoints: 2000,
        benefits: ['VIP поддержка', 'Скидка 10% на поездки', 'Бесплатная отмена поездки', 'Эксклюзивные промокоды']
      },
      PLATINUM: {
        name: 'Платина',
        minPoints: 5000,
        benefits: ['Персональный менеджер', 'Скидка 15% на поездки', 'Безлимитная отмена', 'Приоритет в очереди', 'VIP водители']
      }
    };

    const nextTiers = {
      BRONZE: { tier: 'SILVER', points: 500 },
      SILVER: { tier: 'GOLD', points: 2000 },
      GOLD: { tier: 'PLATINUM', points: 5000 },
      PLATINUM: null
    };

    const nextTier = nextTiers[user.loyaltyTier];
    const pointsToNext = nextTier ? nextTier.points - user.loyaltyPoints : 0;

    res.json({
      currentTier: {
        tier: user.loyaltyTier,
        ...tierBenefits[user.loyaltyTier]
      },
      points: user.loyaltyPoints,
      nextTier,
      pointsToNext: pointsToNext > 0 ? pointsToNext : 0,
      allTiers: tierBenefits
    });
  } catch (error) {
    next(error);
  }
};

// Получить статистику рефералов
export const getReferralStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true
      }
    });

    const referrals = await prisma.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        totalRides: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalEarned = referrals.length * 500; // 500 баллов за каждого реферала

    res.json({
      referralCode: user?.referralCode,
      totalReferrals: referrals.length,
      totalEarned,
      referrals
    });
  } catch (error) {
    next(error);
  }
};
