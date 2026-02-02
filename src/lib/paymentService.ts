export interface PaymentService {
  createCheckoutSession(
    orderId: string,
    amount: number,
    userId: string,
    returnUrl: string
  ): Promise<{ url: string | null; error: string | null }>;
}

class StripePaymentService implements PaymentService {
  async createCheckoutSession(
    orderId: string,
    amount: number,
    userId: string,
    returnUrl: string
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount,
          userId,
          returnUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      return { url: data.url, error: null };
    } catch (error) {
      return { url: null, error: (error as Error).message };
    }
  }
}

export const paymentService: PaymentService = new StripePaymentService();
