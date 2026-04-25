import { Router } from 'express';
import {
  createLog,
  deleteLogById,
  getLogById,
  listLogs,
  updateLogById,
} from '../controllers/logController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.post('/', requireRole('USER'), createLog);
router.get('/', listLogs);
router.get('/:id', getLogById);
router.put('/:id', updateLogById);
router.delete('/:id', deleteLogById);

export default router;
