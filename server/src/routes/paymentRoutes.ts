import express from 'express';
import { verifyPayment, createOrder } from '../controllers/paymentController';

const router = express.Router();

// POST /api/payment/verify - Verify Razorpay payment signature
router.post('/verify', verifyPayment);

// POST /api/payment/create-order - Create Razorpay order
router.post('/create-order', createOrder);

export default router;
