import { Router } from 'express';
import {
  createDriverProfile,
  getDriverProfile,
  updateDriverProfile,
  toggleAvailability,
  updateLocation,
  getNearbyDrivers,
} from '../controllers/driverController';
import { authenticate, authorizeRoles } from '../middleware/auth';

const router = Router();

router.post('/profile', authenticate, authorizeRoles('DRIVER'), createDriverProfile);
router.get('/profile', authenticate, authorizeRoles('DRIVER'), getDriverProfile);
router.patch('/profile', authenticate, authorizeRoles('DRIVER'), updateDriverProfile);
router.patch('/availability', authenticate, authorizeRoles('DRIVER'), toggleAvailability);
router.patch('/location', authenticate, authorizeRoles('DRIVER'), updateLocation);
router.get('/nearby', authenticate, getNearbyDrivers);

export default router;
