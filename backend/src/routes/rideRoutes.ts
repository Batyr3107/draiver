import { Router } from 'express';
import {
  createRide,
  getActiveRides,
  getRideById,
  getMyRides,
  updateRideStatus,
  cancelRide,
} from '../controllers/rideController';
import { authenticate } from '../middleware/auth';
import { validate, createRideSchema } from '../middleware/validation';

const router = Router();

router.post('/', authenticate, validate(createRideSchema), createRide);
router.get('/active', authenticate, getActiveRides);
router.get('/my-rides', authenticate, getMyRides);
router.get('/:id', authenticate, getRideById);
router.patch('/:id/status', authenticate, updateRideStatus);
router.patch('/:id/cancel', authenticate, cancelRide);

export default router;
