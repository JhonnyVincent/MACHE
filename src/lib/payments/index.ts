import { PaymentGateway, PaymentIntentInput, PaymentIntentResult } from "./types";

class MockStripeGateway implements PaymentGateway {
  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    return {
      provider: "stripe",
      paymentId: `pay_${input.orderId}`,
      status: "pending",
      clientSecret: `secret_${input.orderId}`
    };
  }

  async capture(paymentId: string): Promise<PaymentIntentResult> {
    return {
      provider: "stripe",
      paymentId,
      status: "paid"
    };
  }

  async refund(paymentId: string): Promise<PaymentIntentResult> {
    return {
      provider: "stripe",
      paymentId,
      status: "refunded"
    };
  }
}

export const paymentGateways = {
  stripe: new MockStripeGateway()
};
