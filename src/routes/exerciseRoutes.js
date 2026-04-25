import { Router } from 'express';
import {
  createExercise,
  deleteExerciseById,
  getExerciseById,
  listExercises,
  updateExerciseById,
} from '../controllers/exerciseController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(listExercises));
router.get('/:id', asyncHandler(getExerciseById));
router.post('/', requireRole('TRAINER'), asyncHandler(createExercise));
router.put('/:id', requireRole('TRAINER'), asyncHandler(updateExerciseById));
router.delete('/:id', requireRole('TRAINER'), asyncHandler(deleteExerciseById));

export default router;
