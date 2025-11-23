import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { AppError } from '../middleware/errorHandler';

// Image processing configurations
const AVATAR_CONFIG = {
  width: 400,
  height: 400,
  quality: 85,
  format: 'jpeg' as const,
};

const VEHICLE_PHOTO_CONFIG = {
  width: 800,
  height: 600,
  quality: 85,
  format: 'jpeg' as const,
};

const THUMBNAIL_CONFIG = {
  width: 150,
  height: 150,
  quality: 80,
  format: 'jpeg' as const,
};

/**
 * Upload directory setup
 */
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const AVATARS_DIR = path.join(UPLOAD_DIR, 'avatars');
const VEHICLES_DIR = path.join(UPLOAD_DIR, 'vehicles');
const DOCUMENTS_DIR = path.join(UPLOAD_DIR, 'documents');

/**
 * Ensure upload directories exist
 */
export async function ensureUploadDirs(): Promise<void> {
  const dirs = [UPLOAD_DIR, AVATARS_DIR, VEHICLES_DIR, DOCUMENTS_DIR];

  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

/**
 * Process and save avatar image
 */
export async function processAvatar(
  buffer: Buffer,
  filename: string
): Promise<{ path: string; url: string }> {
  await ensureUploadDirs();

  const filepath = path.join(AVATARS_DIR, filename);

  await sharp(buffer)
    .resize(AVATAR_CONFIG.width, AVATAR_CONFIG.height, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: AVATAR_CONFIG.quality })
    .toFile(filepath);

  return {
    path: filepath,
    url: `/uploads/avatars/${filename}`,
  };
}

/**
 * Process and save vehicle photo
 */
export async function processVehiclePhoto(
  buffer: Buffer,
  filename: string
): Promise<{ path: string; url: string; thumbnail: string }> {
  await ensureUploadDirs();

  const filepath = path.join(VEHICLES_DIR, filename);
  const thumbnailFilename = `thumb_${filename}`;
  const thumbnailPath = path.join(VEHICLES_DIR, thumbnailFilename);

  // Process main image
  await sharp(buffer)
    .resize(VEHICLE_PHOTO_CONFIG.width, VEHICLE_PHOTO_CONFIG.height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: VEHICLE_PHOTO_CONFIG.quality })
    .toFile(filepath);

  // Process thumbnail
  await sharp(buffer)
    .resize(THUMBNAIL_CONFIG.width, THUMBNAIL_CONFIG.height, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: THUMBNAIL_CONFIG.quality })
    .toFile(thumbnailPath);

  return {
    path: filepath,
    url: `/uploads/vehicles/${filename}`,
    thumbnail: `/uploads/vehicles/${thumbnailFilename}`,
  };
}

/**
 * Save document (PDF or image)
 */
export async function saveDocument(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<{ path: string; url: string }> {
  await ensureUploadDirs();

  const filepath = path.join(DOCUMENTS_DIR, filename);

  if (mimetype === 'application/pdf') {
    // Save PDF as is
    await fs.writeFile(filepath, buffer);
  } else {
    // Process image document
    await sharp(buffer)
      .resize(1200, 1600, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 90 })
      .toFile(filepath);
  }

  return {
    path: filepath,
    url: `/uploads/documents/${filename}`,
  };
}

/**
 * Delete file
 */
export async function deleteFile(filepath: string): Promise<void> {
  try {
    await fs.unlink(filepath);
  } catch (error) {
    console.error('Failed to delete file:', filepath, error);
  }
}

/**
 * Delete file by URL
 */
export async function deleteFileByUrl(url: string): Promise<void> {
  if (!url || !url.startsWith('/uploads/')) {
    return;
  }

  const filepath = path.join(__dirname, '../..', url);
  await deleteFile(filepath);
}

/**
 * Get file metadata
 */
export async function getFileMetadata(
  buffer: Buffer
): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
}> {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length,
    };
  } catch (error) {
    throw new AppError('Не удалось обработать изображение', 400);
  }
}

/**
 * Validate image dimensions
 */
export async function validateImageDimensions(
  buffer: Buffer,
  minWidth: number,
  minHeight: number
): Promise<boolean> {
  const metadata = await getFileMetadata(buffer);
  return metadata.width >= minWidth && metadata.height >= minHeight;
}

/**
 * Convert image to WebP (for modern browsers)
 */
export async function convertToWebP(
  buffer: Buffer,
  filename: string,
  directory: string
): Promise<{ path: string; url: string }> {
  await ensureUploadDirs();

  const webpFilename = filename.replace(/\.[^.]+$/, '.webp');
  const filepath = path.join(directory, webpFilename);

  await sharp(buffer)
    .webp({ quality: 85 })
    .toFile(filepath);

  return {
    path: filepath,
    url: filepath.replace(UPLOAD_DIR, '/uploads'),
  };
}

/**
 * Clean up old files (older than specified days)
 */
export async function cleanupOldFiles(
  directory: string,
  daysOld: number
): Promise<number> {
  const files = await fs.readdir(directory);
  const now = Date.now();
  const maxAge = daysOld * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  for (const file of files) {
    const filepath = path.join(directory, file);
    const stats = await fs.stat(filepath);

    if (now - stats.mtimeMs > maxAge) {
      await deleteFile(filepath);
      deletedCount++;
    }
  }

  return deletedCount;
}
