import { Router } from 'express';
import { getSharingCode, redeemAccessCode, getSharedProfiles, regenerateSharingCode } from '../controllers/shareController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Return sharing code for current (female) user
router.get('/code', isAuthenticated, getSharingCode);

// Regenerate a new unique sharing code (female only)
router.post('/regenerate-code', isAuthenticated, regenerateSharingCode);

// Redeem a sharing code to gain access
router.post('/access', isAuthenticated, redeemAccessCode);

// List profiles current user can access
router.get('/profiles', isAuthenticated, getSharedProfiles);

export default router;
