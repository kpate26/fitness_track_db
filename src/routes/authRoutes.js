import { Router } from 'express';
import { login, signup } from '../controllers/authController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.post('/signup', asyncHandler(signup));
router.post('/login', asyncHandler(login));

export default router;
