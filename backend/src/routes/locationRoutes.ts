import express from 'express';
import {
  getSavedLocations,
  createSavedLocation,
  updateSavedLocation,
  deleteSavedLocation
} from '../controllers/locationController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Все роуты защищены авторизацией
router.use(protect);

router.get('/', getSavedLocations);
router.post('/', createSavedLocation);
router.put('/:id', updateSavedLocation);
router.delete('/:id', deleteSavedLocation);

export default router;
