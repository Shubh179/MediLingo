interface PaymentOptions {
  amount: number;
  email?: string;
  name?: string;
  planType: 'premium' | 'pro';
}

interface PaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export const paymentService = {
  /**
   * Initialize and open Razorpay checkout
   */
  initiatePayment: async (options: PaymentOptions): Promise<PaymentResponse | null> => {
    return new Promise((resolve) => {
      try {
        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;

        script.onload = () => {
          const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RtYUA2drSIhQYW';

          const razorpayOptions = {
            key: razorpayKeyId,
            amount: options.amount * 100, // Convert to paise
            currency: 'INR',
            name: 'MediLingo',
            description: `${options.planType === 'premium' ? 'Premium' : 'Pro'} Plan Subscription`,
            image: '/medilingo-logo.png',
            prefill: {
              email: options.email || '',
              contact: '',
              name: options.name || '',
            },
            notes: {
              plan: options.planType,
            },
            theme: {
              color: '#16a34a',
            },
            handler: function (response: PaymentResponse) {
              console.log('Payment successful:', response);
              resolve(response);
            },
            modal: {
              ondismiss: function () {
                console.log('Payment modal closed');
                resolve(null);
              },
            },
          };

          const rzp = new (window as any).Razorpay(razorpayOptions);
          rzp.open();
        };

        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          resolve(null);
        };

        document.body.appendChild(script);
      } catch (error) {
        console.error('Payment error:', error);
        resolve(null);
      }
    });
  },

  /**
   * Verify payment with backend
   */
  verifyPayment: async (
    paymentResponse: PaymentResponse,
    userId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('http://localhost:5001/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentResponse,
          userId,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        message: 'Payment verification failed',
      };
    }
  },
};
