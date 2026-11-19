import { Router } from 'express';
import { 
  getPatients, 
  getPatientById, 
  createPatient, 
  updatePatient, 
  deletePatient,
  completeExercise
} from '../controllers/patientController.js';
import { assignVideoToPatient } from '../controllers/assignmentController.js';
import { getPatientMessages, sendMessage } from '../controllers/messageController.js';

const router = Router();

// Patient CRUD
router.get('/', getPatients);
router.post('/', createPatient);
router.get('/:id', getPatientById);
router.patch('/:id', updatePatient);
router.delete('/:id', deletePatient);

// Nested resource: Exercises / Assignments
router.post('/:id/assignments', assignVideoToPatient);
router.post('/:id/complete-exercise', completeExercise);

// Nested resource: Messages / Chat
router.get('/:id/messages', getPatientMessages);
router.post('/:id/messages', sendMessage);

export default router;

