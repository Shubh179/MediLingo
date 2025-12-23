import { Router } from 'express';
import { processPrescription, saveRawPrescription } from '../controllers/prescriptionController';
import { handleChat } from '../controllers/chatController';

const router = Router();

router.post('/upload', saveRawPrescription);  // Simple save without AI processing
router.post('/process', processPrescription); // Full AI-powered processing
router.post('/chat', handleChat); // New Chatbot endpoint

export default router;