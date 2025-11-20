import { Router } from 'express';
import {
  getPlatformStats,
  getRecentActivity,
  getUsers,
  blockUser,
  changeUserRole,
  getDrivers,
  verifyDriver,
  getRides,
  getRideStats,
} from '../controllers/adminController';
import { authenticate, authorizeRoles } from '../middleware/auth';

const router = Router();

/**
 * Все админ роуты защищены авторизацией и проверкой роли ADMIN
 */
router.use(authenticate);
router.use(authorizeRoles('ADMIN'));

/**
 * Статистика и активность
 */
// GET /api/admin/stats - Статистика платформы
router.get('/stats', getPlatformStats);

// GET /api/admin/activity - Последняя активность
router.get('/activity', getRecentActivity);

/**
 * Управление пользователями
 */
// GET /api/admin/users - Список пользователей с фильтрами
router.get('/users', getUsers);

// PUT /api/admin/users/:id/block - Блокировка/разблокировка пользователя
router.put('/users/:id/block', blockUser);

// PUT /api/admin/users/:id/role - Изменение роли пользователя
router.put('/users/:id/role', changeUserRole);

/**
 * Управление водителями
 */
// GET /api/admin/drivers - Список водителей с фильтрами
router.get('/drivers', getDrivers);

// PUT /api/admin/drivers/:id/verify - Верификация водителя
router.put('/drivers/:id/verify', verifyDriver);

/**
 * Управление поездками
 */
// GET /api/admin/rides - Список поездок с фильтрами
router.get('/rides', getRides);

// GET /api/admin/rides/stats - Статистика по поездкам
router.get('/rides/stats', getRideStats);

export default router;
