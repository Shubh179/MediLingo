import express, { Router } from 'express';
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  logout,
  getProfile,
} from '../controllers/authController';
import { isAuthenticated } from '../middleware/auth';

const router: Router = express.Router();

/**
 * Public Routes (No authentication required)
 */

/**
 * POST /api/auth/signup
 * Register a new user
 * Body: { email, password, age, name? }
 */
router.post('/signup', signup);

/**
 * POST /api/auth/login
 * Authenticate user and create session
 * Body: { email, password }
 */
router.post('/login', login);

/**
 * POST /api/auth/forgot-password
 * Send OTP to user's email for password reset
 * Body: { email }
 */
router.post('/forgot-password', forgotPassword);

/**
 * POST /api/auth/reset-password
 * Verify OTP and reset password
 * Body: { email, otp, newPassword }
 */
router.post('/reset-password', resetPassword);

/**
 * Protected Routes (Authentication required)
 */

/**
 * POST /api/auth/logout
 * Destroy user session
 * Headers: Requires valid session cookie
 */
router.post('/logout', isAuthenticated, logout);

/**
 * GET /api/auth/profile
 * Get current user's profile
 * Headers: Requires valid session cookie
 */
router.get('/profile', isAuthenticated, getProfile);

export default router;
