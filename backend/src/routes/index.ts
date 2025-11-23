import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import rideRoutes from './rideRoutes';
import bidRoutes from './bidRoutes';
import driverRoutes from './driverRoutes';
import reviewRoutes from './reviewRoutes';
import locationRoutes from './locationRoutes';
import promoCodeRoutes from './promoCodeRoutes';
import tipRoutes from './tipRoutes';
import notificationRoutes from './notificationRoutes';
import chatRoutes from './chatRoutes';
import achievementRoutes from './achievementRoutes';
import adminRoutes from './adminRoutes';
import uploadRoutes from './uploadRoutes';

const router = Router();

// Основные роуты
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/rides', rideRoutes);
router.use('/bids', bidRoutes);
router.use('/drivers', driverRoutes);
router.use('/reviews', reviewRoutes);

// Премиум функции
router.use('/locations', locationRoutes);
router.use('/promo-codes', promoCodeRoutes);
router.use('/tips', tipRoutes);
router.use('/notifications', notificationRoutes);
router.use('/chat', chatRoutes);
router.use('/achievements', achievementRoutes);

// File uploads
router.use('/upload', uploadRoutes);

// Админ панель
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Draiver API работает ✨' });
});

export default router;
