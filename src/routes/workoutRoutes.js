import { Router } from 'express';
import {
  createWorkout,
  deleteWorkout,
  getWorkoutById,
  getWorkouts,
  updateWorkout,
} from '../controllers/workoutController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(getWorkouts));
router.get('/:id', asyncHandler(getWorkoutById));
router.post('/', requireRole('TRAINER'), asyncHandler(createWorkout));
router.put('/:id', requireRole('TRAINER'), asyncHandler(updateWorkout));
router.delete('/:id', requireRole('TRAINER'), asyncHandler(deleteWorkout));

export default router;
