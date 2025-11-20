import express from 'express';
import {
  getSavedLocations,
  createSavedLocation,
  updateSavedLocation,
  deleteSavedLocation
} from '../controllers/locationController';
import { protect } from '../middleware/auth';
import { validate, createLocationSchema, updateLocationSchema, idSchema } from '../utils/validation';

const router = express.Router();

// Все роуты защищены авторизацией
router.use(protect);

router.get('/', getSavedLocations);
router.post('/', validate(createLocationSchema), createSavedLocation);
router.put('/:id', validate(idSchema.merge(updateLocationSchema)), updateSavedLocation);
router.delete('/:id', validate(idSchema), deleteSavedLocation);

export default router;
