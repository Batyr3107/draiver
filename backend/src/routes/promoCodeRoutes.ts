import express from 'express';
import {
  validatePromoCode,
  applyPromoCode,
  getAllPromoCodes,
  createPromoCode,
  deactivatePromoCode
} from '../controllers/promoCodeController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Все роуты защищены авторизацией
router.use(protect);

router.post('/validate', validatePromoCode);
router.post('/apply', applyPromoCode);
router.get('/admin/all', getAllPromoCodes);
router.post('/admin/create', createPromoCode);
router.patch('/admin/:id/deactivate', deactivatePromoCode);

export default router;
