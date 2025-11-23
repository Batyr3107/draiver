import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  uploadAvatar,
  uploadVehiclePhoto,
  uploadDriverDocuments,
} from '../middleware/upload';
import {
  uploadUserAvatar,
  uploadVehiclePhotoHandler,
  uploadDriverDocumentsHandler,
  deleteUserAvatar,
  getUploadStats,
} from '../controllers/uploadController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Avatar uploads
 */
router.post('/avatar', uploadAvatar, uploadUserAvatar);
router.delete('/avatar', deleteUserAvatar);

/**
 * Vehicle photo uploads
 */
router.post('/vehicle-photo', uploadVehiclePhoto, uploadVehiclePhotoHandler);

/**
 * Driver document uploads
 */
router.post(
  '/driver-documents',
  uploadDriverDocuments,
  uploadDriverDocumentsHandler
);

/**
 * Upload statistics (admin only)
 */
router.get('/stats', getUploadStats);

export default router;
