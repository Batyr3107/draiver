import { Router } from 'express';
import { createReview, getReviewsForUser } from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createReview);
router.get('/user/:userId', authenticate, getReviewsForUser);

export default router;
