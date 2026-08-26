/**
 * Basco Sports – Payment Provider Adapter (DEMO MODE)
 *
 * This file defines a clean abstraction for future payment integration.
 * No live payment collection is performed. Checkout UI runs in demo mode.
 *
 * To enable real payments later:
 * 1. Choose provider (Stripe recommended)
 * 2. Add env vars in Vercel / Cloudflare Pages:
 *    - NEXT_PUBLIC_BASCO_PAYMENT_MODE=live
 *    - STRIPE_SECRET_KEY=sk_live_...
 *    - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
 *    - STRIPE_WEBHOOK_SECRET=whsec_...
 * 3. Implement StripePaymentProvider below (see TODO)
 * 4. Replace DemoPaymentProvider with StripePaymentProvider in checkout
 * 5. Add server action / API route at /app/api/checkout/route.ts to create PaymentIntent
 * 6. Never commit secret keys – use env vars only. Validate with zod.
 *
 * Architecture:
 * - PaymentProvider interface: createIntent, confirm, refund, webhook handling
 * - DemoProvider: simulates success, no network
 * - Future: StripeProvider, PayPalProvider, etc.
 */

export type PaymentMode = 'demo' | 'live';

export interface PaymentIntentRequest {
  amountCents: number;
  currency: string; // e.g. 'usd'
  orderId: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResponse {
  id: string;
  clientSecret?: string;
  amountCents: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'failed';
  demo?: boolean;
}

export interface PaymentProvider {
  readonly name: string;
  readonly mode: PaymentMode;
  createIntent(req: PaymentIntentRequest): Promise<PaymentIntentResponse>;
  // Future: confirmPayment, handleWebhook, etc.
}

export class DemoPaymentProvider implements PaymentProvider {
  readonly name = 'demo';
  readonly mode: PaymentMode = 'demo';

  async createIntent(req: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    // Simulate network latency
    await new Promise(r => setTimeout(r, 700));
    return {
      id: `demo_pi_${Date.now()}`,
      clientSecret: `demo_secret_${Math.random().toString(36).slice(2)}`,
      amountCents: req.amountCents,
      currency: req.currency,
      status: 'succeeded',
      demo: true,
    };
  }
}

// TODO: Implement when Stripe keys are provided
// export class StripePaymentProvider implements PaymentProvider {
//   readonly name = 'stripe';
//   readonly mode: PaymentMode = 'live';
//   private secretKey: string;
//   constructor(secretKey: string) { this.secretKey = secretKey; }
//   async createIntent(req: PaymentIntentRequest): Promise<PaymentIntentResponse> {
//     // const stripe = new Stripe(this.secretKey, { apiVersion: '2024-06-20' });
//     // const intent = await stripe.paymentIntents.create({ amount: req.amountCents, currency: req.currency, metadata: req.metadata });
//     // return { id: intent.id, clientSecret: intent.client_secret!, amountCents: intent.amount, currency: intent.currency, status: intent.status as any };
//     throw new Error('Stripe provider not configured – missing STRIPE_SECRET_KEY');
//   }
// }

export const paymentProvider: PaymentProvider = new DemoPaymentProvider();

// Helper to check mode
export const isDemoMode = () => {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASCO_PAYMENT_MODE) {
    return process.env.NEXT_PUBLIC_BASCO_PAYMENT_MODE !== 'live';
  }
  return true;
};
