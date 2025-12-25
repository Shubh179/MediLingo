import { Router } from 'express';
import { doctorChat } from '../controllers/doctorController';

const router = Router();

router.post('/chat', doctorChat);

export default router;
