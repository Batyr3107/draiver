import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate, registerSchema, loginSchema } from '../middleware/validation';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/profile', authenticate, getProfile);

export default router;
