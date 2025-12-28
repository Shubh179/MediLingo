import { Router } from 'express';
import { getSharingCode, redeemAccessCode, getSharedProfiles } from '../controllers/shareController';

const router = Router();

// Return sharing code for current (female) user
router.get('/code', getSharingCode);

// Redeem a sharing code to gain access
router.post('/access', redeemAccessCode);

// List profiles current user can access
router.get('/profiles', getSharedProfiles);

export default router;
