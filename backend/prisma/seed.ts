import { PrismaClient, AchievementType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // Создаем достижения
  const achievements = [
    {
      type: AchievementType.FIRST_RIDE,
      name: 'Первая поездка',
      description: 'Совершите свою первую поездку',
      icon: '🚗',
      points: 50
    },
    {
      type: AchievementType.RIDES_10,
      name: '10 поездок',
      description: 'Совершите 10 поездок',
      icon: '🎯',
      points: 100
    },
    {
      type: AchievementType.RIDES_50,
      name: '50 поездок',
      description: 'Совершите 50 поездок',
      icon: '⭐',
      points: 250
    },
    {
      type: AchievementType.RIDES_100,
      name: '100 поездок',
      description: 'Совершите 100 поездок',
      icon: '💎',
      points: 500
    },
    {
      type: AchievementType.RIDES_500,
      name: '500 поездок',
      description: 'Совершите 500 поездок',
      icon: '👑',
      points: 1000
    },
    {
      type: AchievementType.FIVE_STAR_DRIVER,
      name: 'Водитель 5 звезд',
      description: 'Поддерживайте рейтинг 5.0 на протяжении 20 поездок',
      icon: '🌟',
      points: 300
    },
    {
      type: AchievementType.FIVE_STAR_PASSENGER,
      name: 'Пассажир 5 звезд',
      description: 'Поддерживайте рейтинг 5.0 на протяжении 20 поездок',
      icon: '🌟',
      points: 300
    },
    {
      type: AchievementType.EARLY_BIRD,
      name: 'Ранняя птичка',
      description: 'Совершите 10 поездок до 7 утра',
      icon: '🌅',
      points: 150
    },
    {
      type: AchievementType.NIGHT_OWL,
      name: 'Ночная сова',
      description: 'Совершите 10 поездок после 11 вечера',
      icon: '🌙',
      points: 150
    },
    {
      type: AchievementType.WEEKEND_WARRIOR,
      name: 'Выходной воин',
      description: 'Совершите 20 поездок в выходные',
      icon: '🎉',
      points: 200
    },
    {
      type: AchievementType.REFERRAL_MASTER,
      name: 'Мастер рефералов',
      description: 'Пригласите 10 друзей',
      icon: '🤝',
      points: 500
    },
    {
      type: AchievementType.LOYALTY_MEMBER,
      name: 'Член программы лояльности',
      description: 'Достигните уровня Gold',
      icon: '🏆',
      points: 250
    }
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { type: achievement.type },
      update: achievement,
      create: achievement
    });
  }

  console.log('✅ Создано', achievements.length, 'достижений');

  // Создаем промокоды для примера
  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const promoCodes = [
    {
      code: 'WELCOME2025',
      description: 'Приветственная скидка для новых пользователей',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      maxUses: 1000,
      maxUsesPerUser: 1,
      validFrom: now,
      validUntil: nextMonth,
      isActive: true
    },
    {
      code: 'DRAIVER100',
      description: 'Скидка 100 тенге на первую поездку',
      discountType: 'FIXED',
      discountValue: 100,
      maxUses: 500,
      maxUsesPerUser: 1,
      validFrom: now,
      validUntil: nextMonth,
      isActive: true
    },
    {
      code: 'WEEKEND50',
      description: 'Скидка 50% на выходные',
      discountType: 'PERCENTAGE',
      discountValue: 50,
      maxUses: null,
      maxUsesPerUser: 2,
      validFrom: now,
      validUntil: nextMonth,
      isActive: true
    }
  ];

  for (const promoCode of promoCodes) {
    await prisma.promoCode.upsert({
      where: { code: promoCode.code },
      update: promoCode,
      create: promoCode
    });
  }

  console.log('✅ Создано', promoCodes.length, 'промокодов');

  console.log('🎉 База данных успешно заполнена!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
