import { Router } from 'express';
import { processPrescription } from '../controllers/prescriptionController';
import { handleChat } from '../controllers/chatController';

const router = Router();

router.post('/upload', processPrescription);
router.post('/chat', handleChat); // New Chatbot endpoint

export default router;