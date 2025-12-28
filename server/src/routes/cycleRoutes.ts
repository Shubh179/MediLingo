import { Router } from 'express';
import { getMyCycle, updateMyCycle, addSymptomLog, getSharedCycle } from '../controllers/cycleController';

const router = Router();

router.get('/me', getMyCycle);
router.put('/me', updateMyCycle);
router.post('/me/symptom', addSymptomLog);
router.get('/shared/:userId', getSharedCycle);

export default router;
