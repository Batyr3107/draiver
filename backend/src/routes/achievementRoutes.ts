import express from 'express';
import {
  getUserAchievements,
  getLoyaltyInfo,
  getReferralStats
} from '../controllers/achievementController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Все роуты защищены авторизацией
router.use(protect);

router.get('/', getUserAchievements);
router.get('/loyalty', getLoyaltyInfo);
router.get('/referrals', getReferralStats);

export default router;
