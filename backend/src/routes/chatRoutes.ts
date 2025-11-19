import express from 'express';
import {
  getRideMessages,
  sendMessage,
  getUnreadMessagesCount,
  markRideMessagesAsRead
} from '../controllers/chatController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Все роуты защищены авторизацией
router.use(protect);

router.get('/ride/:rideId', getRideMessages);
router.post('/send', sendMessage);
router.get('/unread-count', getUnreadMessagesCount);
router.patch('/ride/:rideId/mark-read', markRideMessagesAsRead);

export default router;
