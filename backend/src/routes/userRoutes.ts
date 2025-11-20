import { Router } from 'express';
import { getProfile } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * Роуты пользователей
 */

// GET /api/users/profile - Получение профиля текущего пользователя
router.get('/profile', authenticate, getProfile);

export default router;
