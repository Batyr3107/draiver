import { Router } from 'express';
import authRoutes from './authRoutes';
import rideRoutes from './rideRoutes';
import bidRoutes from './bidRoutes';
import driverRoutes from './driverRoutes';
import reviewRoutes from './reviewRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/rides', rideRoutes);
router.use('/bids', bidRoutes);
router.use('/drivers', driverRoutes);
router.use('/reviews', reviewRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Draiver API работает' });
});

export default router;
