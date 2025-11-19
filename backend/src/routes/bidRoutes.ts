import { Router } from 'express';
import {
  createBid,
  acceptBid,
  getBidsForRide,
  deleteBid,
} from '../controllers/bidController';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validate, createBidSchema } from '../middleware/validation';

const router = Router();

router.post('/', authenticate, authorizeRoles('DRIVER'), validate(createBidSchema), createBid);
router.post('/:bidId/accept', authenticate, acceptBid);
router.get('/ride/:rideId', authenticate, getBidsForRide);
router.delete('/:bidId', authenticate, deleteBid);

export default router;
