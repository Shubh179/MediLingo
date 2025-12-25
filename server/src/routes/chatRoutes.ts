import { Router } from 'express';
import { handleChat } from '../controllers/chatController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Chat endpoint - requires authentication
router.post('/', authenticateToken, handleChat);

export default router;
