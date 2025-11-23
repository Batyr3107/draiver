import { PrismaClient, AchievementType, UserRole, RideStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // Удаляем существующие данные (для разработки)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Очистка базы данных...');
    await prisma.userAchievement.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.rating.deleteMany();
    await prisma.ride.deleteMany();
    await prisma.driverProfile.deleteMany();
    await prisma.passengerProfile.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.achievement.deleteMany();
    await prisma.promoCode.deleteMany();
    console.log('✅ База данных очищена');
  }

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

  // Создаем тестовых пользователей
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Админ
  const admin = await prisma.user.create({
    data: {
      phoneNumber: '+77001234567',
      passwordHash: hashedPassword,
      firstName: 'Админ',
      lastName: 'Системный',
      role: UserRole.ADMIN,
      email: 'admin@draiver.kz',
      isEmailVerified: true,
    },
  });

  // 2-4. Пассажиры
  const passenger1 = await prisma.user.create({
    data: {
      phoneNumber: '+77012345678',
      passwordHash: hashedPassword,
      firstName: 'Айжан',
      lastName: 'Сарсенова',
      role: UserRole.PASSENGER,
      email: 'aizhan@example.kz',
      avatarUrl: 'https://ui-avatars.com/api/?name=Aizhan+Sarsenova',
      passengerProfile: {
        create: {
          favoriteAddresses: ['Алматы, пр. Абая 1', 'Алматы, ул. Достык 50'],
          loyaltyPoints: 250,
          loyaltyTier: 'SILVER',
        },
      },
    },
  });

  const passenger2 = await prisma.user.create({
    data: {
      phoneNumber: '+77023456789',
      passwordHash: hashedPassword,
      firstName: 'Нурлан',
      lastName: 'Жумабеков',
      role: UserRole.PASSENGER,
      avatarUrl: 'https://ui-avatars.com/api/?name=Nurlan+Zhumabekov',
      passengerProfile: {
        create: {
          favoriteAddresses: ['Астана, пр. Мангилик Ел 10'],
          loyaltyPoints: 500,
          loyaltyTier: 'GOLD',
        },
      },
    },
  });

  const passenger3 = await prisma.user.create({
    data: {
      phoneNumber: '+77034567890',
      passwordHash: hashedPassword,
      firstName: 'Дина',
      lastName: 'Касымова',
      role: UserRole.PASSENGER,
      avatarUrl: 'https://ui-avatars.com/api/?name=Dina+Kasymova',
      passengerProfile: {
        create: {
          loyaltyPoints: 50,
          loyaltyTier: 'BRONZE',
        },
      },
    },
  });

  console.log('✅ Создано 4 пользователя (1 админ, 3 пассажира)');

  // 5-8. Водители
  const driver1 = await prisma.user.create({
    data: {
      phoneNumber: '+77045678901',
      passwordHash: hashedPassword,
      firstName: 'Ерлан',
      lastName: 'Алимов',
      role: UserRole.DRIVER,
      email: 'erlan@example.kz',
      avatarUrl: 'https://ui-avatars.com/api/?name=Erlan+Alimov',
      driverProfile: {
        create: {
          licenseNumber: 'AA1234567',
          vehicleMake: 'Toyota',
          vehicleModel: 'Camry',
          vehicleYear: 2020,
          vehicleColor: 'Белый',
          vehiclePlate: 'KZ777ABC',
          vehicleType: 'COMFORT',
          isVerified: true,
          isAvailable: true,
          currentLatitude: 43.238293,
          currentLongitude: 76.889709,
          totalEarnings: 150000,
        },
      },
    },
  });

  const driver2 = await prisma.user.create({
    data: {
      phoneNumber: '+77056789012',
      passwordHash: hashedPassword,
      firstName: 'Асем',
      lastName: 'Нурмуханова',
      role: UserRole.DRIVER,
      avatarUrl: 'https://ui-avatars.com/api/?name=Asem+Nurmukhanova',
      driverProfile: {
        create: {
          licenseNumber: 'BB2345678',
          vehicleMake: 'Hyundai',
          vehicleModel: 'Sonata',
          vehicleYear: 2021,
          vehicleColor: 'Черный',
          vehiclePlate: 'KZ555DEF',
          vehicleType: 'BUSINESS',
          isVerified: true,
          isAvailable: true,
          currentLatitude: 43.256847,
          currentLongitude: 76.928308,
          totalEarnings: 250000,
        },
      },
    },
  });

  const driver3 = await prisma.user.create({
    data: {
      phoneNumber: '+77067890123',
      passwordHash: hashedPassword,
      firstName: 'Марат',
      lastName: 'Бекбаев',
      role: UserRole.DRIVER,
      driverProfile: {
        create: {
          licenseNumber: 'CC3456789',
          vehicleMake: 'Kia',
          vehicleModel: 'Rio',
          vehicleYear: 2019,
          vehicleColor: 'Серебристый',
          vehiclePlate: 'KZ333GHI',
          vehicleType: 'ECONOMY',
          isVerified: true,
          isAvailable: false,
          currentLatitude: 43.222011,
          currentLongitude: 76.851250,
          totalEarnings: 85000,
        },
      },
    },
  });

  const driver4 = await prisma.user.create({
    data: {
      phoneNumber: '+77078901234',
      passwordHash: hashedPassword,
      firstName: 'Жанна',
      lastName: 'Токтарова',
      role: UserRole.DRIVER,
      driverProfile: {
        create: {
          licenseNumber: 'DD4567890',
          vehicleMake: 'Mercedes-Benz',
          vehicleModel: 'E-Class',
          vehicleYear: 2022,
          vehicleColor: 'Синий',
          vehiclePlate: 'KZ111JKL',
          vehicleType: 'PREMIUM',
          isVerified: false,
          isAvailable: false,
          currentLatitude: 43.263889,
          currentLongitude: 76.945278,
          totalEarnings: 0,
        },
      },
    },
  });

  console.log('✅ Создано 4 водителя');

  // Создаем тестовые поездки
  const ride1 = await prisma.ride.create({
    data: {
      passengerId: passenger1.id,
      driverId: driver1.id,
      pickupAddress: 'Алматы, пр. Абая 1',
      pickupLatitude: 43.238293,
      pickupLongitude: 76.889709,
      dropoffAddress: 'Алматы, ул. Достык 50',
      dropoffLatitude: 43.256847,
      dropoffLongitude: 76.928308,
      status: RideStatus.COMPLETED,
      requestedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
      acceptedAt: new Date(Date.now() - 86400000 * 2 + 60000),
      startedAt: new Date(Date.now() - 86400000 * 2 + 300000),
      completedAt: new Date(Date.now() - 86400000 * 2 + 1200000),
      passengerPrice: 1500,
      driverPrice: 1500,
      finalPrice: 1500,
      distance: 5.2,
      duration: 15,
      paymentMethod: 'CASH',
    },
  });

  const ride2 = await prisma.ride.create({
    data: {
      passengerId: passenger2.id,
      driverId: driver2.id,
      pickupAddress: 'Алматы, ТРЦ Mega',
      pickupLatitude: 43.222011,
      pickupLongitude: 76.851250,
      dropoffAddress: 'Алматы, Аэропорт',
      dropoffLatitude: 43.352139,
      dropoffLongitude: 77.040556,
      status: RideStatus.COMPLETED,
      requestedAt: new Date(Date.now() - 86400000), // 1 day ago
      acceptedAt: new Date(Date.now() - 86400000 + 120000),
      startedAt: new Date(Date.now() - 86400000 + 600000),
      completedAt: new Date(Date.now() - 86400000 + 2400000),
      passengerPrice: 3500,
      driverPrice: 3500,
      finalPrice: 3500,
      distance: 18.5,
      duration: 30,
      paymentMethod: 'CARD',
      promoCodeId: (await prisma.promoCode.findUnique({ where: { code: 'DRAIVER100' } }))?.id,
    },
  });

  const ride3 = await prisma.ride.create({
    data: {
      passengerId: passenger3.id,
      driverId: driver3.id,
      pickupAddress: 'Алматы, ул. Розыбакиева 247',
      pickupLatitude: 43.206944,
      pickupLongitude: 76.663889,
      dropoffAddress: 'Алматы, пр. Аль-Фараби 77',
      dropoffLatitude: 43.212778,
      dropoffLongitude: 76.851944,
      status: RideStatus.IN_PROGRESS,
      requestedAt: new Date(Date.now() - 600000), // 10 minutes ago
      acceptedAt: new Date(Date.now() - 300000), // 5 minutes ago
      startedAt: new Date(Date.now() - 120000), // 2 minutes ago
      passengerPrice: 1200,
      driverPrice: 1200,
      distance: 12.3,
      paymentMethod: 'CASH',
    },
  });

  const ride4 = await prisma.ride.create({
    data: {
      passengerId: passenger1.id,
      pickupAddress: 'Алматы, ул. Жандосова 98',
      pickupLatitude: 43.263889,
      pickupLongitude: 76.945278,
      dropoffAddress: 'Алматы, пр. Сейфуллина 531',
      dropoffLatitude: 43.256847,
      dropoffLongitude: 76.928308,
      status: RideStatus.PENDING,
      requestedAt: new Date(),
      passengerPrice: 800,
      driverPrice: 900,
      paymentMethod: 'CARD',
    },
  });

  console.log('✅ Создано 4 поездки');

  // Создаем рейтинги для завершенных поездок
  await prisma.rating.create({
    data: {
      rideId: ride1.id,
      fromUserId: passenger1.id,
      toUserId: driver1.id,
      rating: 5,
      comment: 'Отличный водитель! Аккуратная езда.',
    },
  });

  await prisma.rating.create({
    data: {
      rideId: ride1.id,
      fromUserId: driver1.id,
      toUserId: passenger1.id,
      rating: 5,
      comment: 'Приятный пассажир, вовремя.',
    },
  });

  await prisma.rating.create({
    data: {
      rideId: ride2.id,
      fromUserId: passenger2.id,
      toUserId: driver2.id,
      rating: 4,
      comment: 'Хорошо, но немного опоздал.',
    },
  });

  await prisma.rating.create({
    data: {
      rideId: ride2.id,
      fromUserId: driver2.id,
      toUserId: passenger2.id,
      rating: 5,
    },
  });

  console.log('✅ Создано 4 рейтинга');

  // Создаем уведомления
  await prisma.notification.createMany({
    data: [
      {
        userId: passenger1.id,
        type: 'RIDE_COMPLETED',
        title: 'Поездка завершена',
        message: 'Ваша поездка успешно завершена. Не забудьте оценить водителя!',
        isRead: true,
      },
      {
        userId: passenger1.id,
        type: 'PROMO_CODE',
        title: 'Новый промокод!',
        message: 'Используйте промокод WEEKEND50 для скидки 50%',
        isRead: false,
      },
      {
        userId: driver1.id,
        type: 'NEW_RIDE',
        title: 'Новая поездка',
        message: 'Новый запрос на поездку поблизости',
        isRead: true,
      },
      {
        userId: driver2.id,
        type: 'RATING_RECEIVED',
        title: 'Новая оценка',
        message: 'Вы получили оценку 4 звезды от пассажира',
        isRead: false,
      },
    ],
  });

  console.log('✅ Создано 4 уведомления');

  // Назначаем достижения
  const firstRideAchievement = await prisma.achievement.findUnique({
    where: { type: AchievementType.FIRST_RIDE },
  });

  if (firstRideAchievement) {
    await prisma.userAchievement.createMany({
      data: [
        {
          userId: passenger1.id,
          achievementId: firstRideAchievement.id,
        },
        {
          userId: passenger2.id,
          achievementId: firstRideAchievement.id,
        },
      ],
    });

    console.log('✅ Назначены достижения пользователям');
  }

  console.log('');
  console.log('🎉 База данных успешно заполнена!');
  console.log('');
  console.log('📊 Статистика:');
  console.log('  - Пользователей:', await prisma.user.count());
  console.log('  - Водителей:', await prisma.driverProfile.count());
  console.log('  - Пассажиров:', await prisma.passengerProfile.count());
  console.log('  - Поездок:', await prisma.ride.count());
  console.log('  - Достижений:', await prisma.achievement.count());
  console.log('  - Промокодов:', await prisma.promoCode.count());
  console.log('');
  console.log('👤 Тестовые аккаунты:');
  console.log('  Админ:     +77001234567 / password123');
  console.log('  Пассажир:  +77012345678 / password123 (Айжан)');
  console.log('  Пассажир:  +77023456789 / password123 (Нурлан)');
  console.log('  Водитель:  +77045678901 / password123 (Ерлан)');
  console.log('  Водитель:  +77056789012 / password123 (Асем)');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
