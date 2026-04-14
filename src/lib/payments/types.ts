import { PaymentStatus } from "@/types";

export type PaymentProvider =
  | "stripe"
  | "paypal"
  | "local_method"
  | "cash_on_delivery";

export interface PaymentIntentInput {
  orderId: string;
  amount: number;
  currency: string;
  customerId: string;
  provider: PaymentProvider;
}

export interface PaymentIntentResult {
  provider: PaymentProvider;
  paymentId: string;
  status: PaymentStatus;
  redirectUrl?: string;
  clientSecret?: string;
}

export interface PaymentGateway {
  createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  capture(paymentId: string): Promise<PaymentIntentResult>;
  refund(paymentId: string, amount?: number): Promise<PaymentIntentResult>;
}
