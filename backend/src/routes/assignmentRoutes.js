import { Router } from 'express';
import { deleteAssignment } from '../controllers/assignmentController.js';

const router = Router();

router.delete('/:assignmentId', deleteAssignment);

export default router;

