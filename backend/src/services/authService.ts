import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errorHandler';

/**
 * Проверяет владение ресурсом пользователем
 * @param resourceType - Тип ресурса (savedLocation, notification, etc.)
 * @param resourceId - ID ресурса
 * @param userId - ID пользователя
 * @returns Ресурс если пользователь владелец
 * @throws NotFoundError если ресурс не найден
 * @throws ForbiddenError если пользователь не владелец
 */
export const checkResourceOwnership = async <T>(
  resourceType: 'savedLocation' | 'notification' | 'tip' | 'ride',
  resourceId: string,
  userId: string
): Promise<T> => {
  let resource: any;

  switch (resourceType) {
    case 'savedLocation':
      resource = await prisma.savedLocation.findFirst({
        where: { id: resourceId, userId }
      });
      break;
    case 'notification':
      resource = await prisma.notification.findFirst({
        where: { id: resourceId, userId }
      });
      break;
    case 'tip':
      resource = await prisma.tip.findFirst({
        where: { id: resourceId, userId }
      });
      break;
    case 'ride':
      resource = await prisma.ride.findFirst({
        where: {
          id: resourceId,
          OR: [
            { passengerId: userId },
            { driver: { userId } }
          ]
        },
        include: { driver: true }
      });
      break;
    default:
      throw new Error(`Unknown resource type: ${resourceType}`);
  }

  if (!resource) {
    throw new NotFoundError(`${resourceType} не найден или доступ запрещен`);
  }

  return resource as T;
};

/**
 * Проверяет права администратора
 * @param user - Объект пользователя
 * @throws ForbiddenError если пользователь не админ
 */
export const requireAdmin = (user: any) => {
  if (user?.role !== 'ADMIN') {
    throw new ForbiddenError('Требуются права администратора');
  }
};

/**
 * Проверяет роль водителя
 * @param userId - ID пользователя
 * @returns DriverProfile если пользователь водитель
 * @throws ForbiddenError если пользователь не водитель
 */
export const requireDriverRole = async (userId: string) => {
  const driverProfile = await prisma.driverProfile.findUnique({
    where: { userId }
  });

  if (!driverProfile) {
    throw new ForbiddenError('Доступно только для водителей');
  }

  return driverProfile;
};
