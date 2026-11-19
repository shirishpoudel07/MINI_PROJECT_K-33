import { Router } from 'express';
import { getDashboardSummary, getAnalyticsData } from '../controllers/dashboardController.js';

const router = Router();

router.get('/summary', getDashboardSummary);
router.get('/analytics', getAnalyticsData);

export default router;

