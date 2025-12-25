import { Request, Response } from 'express';
import { RAZORPAY_KEY_SECRET } from '../config/env';
import crypto from 'crypto';
import { User } from '../models/User';

interface PaymentRequest extends Request {
  body: {
    paymentResponse: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    };
    userId: string;
  };
}

/**
 * Verify Razorpay payment signature and update user plan
 */
export const verifyPayment = async (req: PaymentRequest, res: Response): Promise<void> => {
  try {
    const { paymentResponse, userId } = req.body;

    if (!paymentResponse || !userId) {
      res.status(400).json({
        success: false,
        message: 'Missing payment response or user ID',
      });
      return;
    }

    // Verify signature
    const signature = paymentResponse.razorpay_signature;
    const orderId = paymentResponse.razorpay_order_id;
    const paymentId = paymentResponse.razorpay_payment_id;

    // Create signature hash
    const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET || '');
    hmac.update(`${orderId}|${paymentId}`);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== signature) {
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
      return;
    }

    // Update user's plan (implementation depends on your User model)
    // For now, just verify the signature
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      paymentId,
      orderId,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
    });
  }
};

/**
 * Create Razorpay order
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, planType } = req.body;

    if (!amount || !planType) {
      res.status(400).json({
        success: false,
        message: 'Missing amount or plan type',
      });
      return;
    }

    // In production, you should use Razorpay SDK to create orders
    // For now, return a placeholder order ID
    const orderId = `order_${Date.now()}`;

    res.status(200).json({
      success: true,
      orderId,
      amount,
      currency: 'INR',
      planType,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
    });
  }
};
