import { Router } from 'express';
import { getVideos, getVideoById, createVideo } from '../controllers/videoController.js';

const router = Router();

router.get('/', getVideos);
router.post('/', createVideo);
router.get('/:id', getVideoById);

export default router;

