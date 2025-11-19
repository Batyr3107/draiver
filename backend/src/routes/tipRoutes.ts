import express from 'express';
import {
  createTip,
  getTipForRide,
  getDriverTipsStats
} from '../controllers/tipController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Все роуты защищены авторизацией
router.use(protect);

router.post('/', createTip);
router.get('/ride/:rideId', getTipForRide);
router.get('/stats', getDriverTipsStats);

export default router;
