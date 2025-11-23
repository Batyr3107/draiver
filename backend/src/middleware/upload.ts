import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from './errorHandler';

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Configure multer storage
 * Using memory storage for processing with Sharp
 */
const storage = multer.memoryStorage();

/**
 * File filter for images
 */
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(
      new AppError(
        'Неверный формат файла. Разрешены только JPEG, PNG и WebP',
        400
      )
    );
    return;
  }
  cb(null, true);
};

/**
 * File filter for documents
 */
const documentFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    cb(
      new AppError(
        'Неверный формат файла. Разрешены только PDF, JPEG и PNG',
        400
      )
    );
    return;
  }
  cb(null, true);
};

/**
 * Multer instance for avatar uploads
 */
export const uploadAvatar = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
}).single('avatar');

/**
 * Multer instance for vehicle photo uploads
 */
export const uploadVehiclePhoto = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
}).single('photo');

/**
 * Multer instance for driver document uploads
 */
export const uploadDriverDocuments = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 5,
  },
}).fields([
  { name: 'license', maxCount: 1 },
  { name: 'vehicleRegistration', maxCount: 1 },
  { name: 'insurance', maxCount: 1 },
  { name: 'technicalInspection', maxCount: 1 },
  { name: 'driverPhoto', maxCount: 1 },
]);

/**
 * Multer instance for multiple images
 */
export const uploadMultipleImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 10,
  },
}).array('images', 10);

/**
 * Generate unique filename
 */
export function generateFilename(
  userId: string,
  originalName: string,
  prefix?: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName);
  const base = prefix || 'file';
  return `${base}_${userId}_${timestamp}_${random}${ext}`;
}

/**
 * Get file extension from mimetype
 */
export function getExtensionFromMimetype(mimetype: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
  };
  return mimeMap[mimetype] || '.jpg';
}
