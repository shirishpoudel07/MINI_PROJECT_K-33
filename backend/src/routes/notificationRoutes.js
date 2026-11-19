import { Router } from 'express';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  createNotification 
} from '../controllers/notificationController.js';

const router = Router();

router.get('/', getNotifications);
router.post('/', createNotification);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

export default router;

