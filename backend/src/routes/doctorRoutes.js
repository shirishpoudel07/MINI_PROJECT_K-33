import { Router } from 'express';
import { getDoctorProfile, updateDoctorProfile } from '../controllers/doctorController.js';

const router = Router();

router.get('/profile', getDoctorProfile);
router.put('/profile', updateDoctorProfile);

export default router;

