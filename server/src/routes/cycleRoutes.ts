import { Router } from 'express';
import { getMyCycle, updateMyCycle, addSymptomLog, getSharedCycle } from '../controllers/cycleController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

router.get('/me', isAuthenticated, getMyCycle);
router.put('/me', isAuthenticated, updateMyCycle);
router.post('/me/symptom', isAuthenticated, addSymptomLog);
router.get('/shared/:userId', isAuthenticated, getSharedCycle);

export default router;
