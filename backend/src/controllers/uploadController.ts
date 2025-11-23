import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import {
  processAvatar,
  processVehiclePhoto,
  saveDocument,
  deleteFileByUrl,
  getFileMetadata,
} from '../services/imageService';
import { getExtensionFromMimetype } from '../middleware/upload';
import prisma from '../config/database';

/**
 * Upload user avatar
 * POST /api/upload/avatar
 */
export const uploadUserAvatar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Не авторизован', 401);
    }

    if (!req.file) {
      throw new AppError('Файл не загружен', 400);
    }

    // Get file metadata
    const metadata = await getFileMetadata(req.file.buffer);
    console.log('Avatar metadata:', metadata);

    // Generate filename
    const ext = getExtensionFromMimetype(req.file.mimetype);
    const filename = `avatar_${userId}_${Date.now()}${ext}`;

    // Process and save avatar
    const { url } = await processAvatar(req.file.buffer, filename);

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Delete old avatar if exists
    if (user?.avatarUrl) {
      await deleteFileByUrl(user.avatarUrl);
    }

    // Update user avatar URL
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    res.json({
      success: true,
      message: 'Аватар успешно загружен',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload vehicle photo
 * POST /api/upload/vehicle-photo
 */
export const uploadVehiclePhotoHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Не авторизован', 401);
    }

    if (!req.file) {
      throw new AppError('Файл не загружен', 400);
    }

    // Check if user is a driver
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!driverProfile) {
      throw new AppError('Профиль водителя не найден', 404);
    }

    // Generate filename
    const ext = getExtensionFromMimetype(req.file.mimetype);
    const filename = `vehicle_${userId}_${Date.now()}${ext}`;

    // Process and save photo
    const { url, thumbnail } = await processVehiclePhoto(
      req.file.buffer,
      filename
    );

    // Delete old photo if exists
    if (driverProfile.vehiclePhotoUrl) {
      await deleteFileByUrl(driverProfile.vehiclePhotoUrl);
      // Also delete thumbnail
      const thumbUrl = driverProfile.vehiclePhotoUrl.replace(
        /([^/]+)$/,
        'thumb_$1'
      );
      await deleteFileByUrl(thumbUrl);
    }

    // Update driver profile
    const updatedProfile = await prisma.driverProfile.update({
      where: { userId },
      data: { vehiclePhotoUrl: url },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Фото автомобиля успешно загружено',
      photo: {
        url,
        thumbnail,
      },
      profile: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload driver documents
 * POST /api/upload/driver-documents
 */
export const uploadDriverDocumentsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Не авторизован', 401);
    }

    if (!req.files || typeof req.files !== 'object') {
      throw new AppError('Файлы не загружены', 400);
    }

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    // Check if user is a driver
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!driverProfile) {
      throw new AppError('Профиль водителя не найден', 404);
    }

    const uploadedDocuments: Record<string, string> = {};

    // Process each document type
    const documentTypes = [
      'license',
      'vehicleRegistration',
      'insurance',
      'technicalInspection',
      'driverPhoto',
    ];

    for (const docType of documentTypes) {
      if (files[docType] && files[docType].length > 0) {
        const file = files[docType][0];
        const ext = getExtensionFromMimetype(file.mimetype);
        const filename = `${docType}_${userId}_${Date.now()}${ext}`;

        const { url } = await saveDocument(file.buffer, filename, file.mimetype);
        uploadedDocuments[docType] = url;
      }
    }

    res.json({
      success: true,
      message: 'Документы успешно загружены',
      documents: uploadedDocuments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user avatar
 * DELETE /api/upload/avatar
 */
export const deleteUserAvatar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Не авторизован', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.avatarUrl) {
      throw new AppError('Аватар не найден', 404);
    }

    // Delete file
    await deleteFileByUrl(user.avatarUrl);

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });

    res.json({
      success: true,
      message: 'Аватар успешно удален',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get upload statistics (admin only)
 * GET /api/upload/stats
 */
export const getUploadStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Доступ запрещен', 403);
    }

    const [usersWithAvatars, driversWithPhotos] = await Promise.all([
      prisma.user.count({
        where: { avatarUrl: { not: null } },
      }),
      prisma.driverProfile.count({
        where: { vehiclePhotoUrl: { not: null } },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        usersWithAvatars,
        driversWithPhotos,
        totalUploads: usersWithAvatars + driversWithPhotos,
      },
    });
  } catch (error) {
    next(error);
  }
};
