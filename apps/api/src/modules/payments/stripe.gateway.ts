import Stripe from 'stripe';
import { stripe } from '../../infrastructure/stripe/client.js';
import { env } from '../../env.js';
import { AppError } from '../../shared/errors/AppError.js';
import type {
  PaymentGateway,
  CreateIntentRequest,
  CreateIntentResponse,
  WebhookEventPayload,
  RefundRequest,
} from './gateway.interface.js';

export class StripeGateway implements PaymentGateway {
  private stripe = stripe;

  constructor() {}

  async createIntent(req: CreateIntentRequest): Promise<CreateIntentResponse> {
    const stripeIntent = await this.stripe.paymentIntents.create({
      amount: req.amountMinor,
      currency: req.currency.toLowerCase(),
      capture_method: req.captureMethod,
      metadata: req.metadata,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    });

    return {
      gatewayIntentId: stripeIntent.id,
      clientSecret: stripeIntent.client_secret!,
    };
  }

  async retrieveIntent(intentId: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(intentId);
  }

  async confirmIntent(intentId: string): Promise<void> {
    try {
      await this.stripe.paymentIntents.capture(intentId);
    } catch (error) {
      const stripeError = error as { code?: string; message?: string };
      if (
        stripeError.code === 'payment_intent_unexpected_state' &&
        stripeError.message?.includes('already been captured')
      ) {
        return; // Idempotent success
      }
      throw error;
    }
  }

  async cancelIntent(intentId: string): Promise<void> {
    try {
      await this.stripe.paymentIntents.cancel(intentId);
    } catch (error) {
      const stripeError = error as { code?: string; message?: string };
      if (
        stripeError.code === 'payment_intent_unexpected_state' &&
        stripeError.message?.includes('already been canceled')
      ) {
        return; // Idempotent success
      }
      throw error;
    }
  }

  async refundIntent(req: RefundRequest): Promise<void> {
    await this.stripe.refunds.create({
      payment_intent: req.intentId,
      ...(req.amountMinor !== undefined && { amount: req.amountMinor }),
      ...(req.reason && { reason: req.reason as Stripe.RefundCreateParams.Reason }),
    });
  }

  parseWebhookEvent(signature: string, rawBody: Buffer): WebhookEventPayload {
    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );

      const validTypes = [
        'payment_intent.succeeded',
        'payment_intent.amount_capturable_updated',
        'payment_intent.payment_failed',
        'payment_intent.canceled',
      ];
      if (!validTypes.includes(event.type)) {
        throw new Error(`Unhandled event type: ${event.type}`);
      }

      const intent = event.data.object as Stripe.PaymentIntent;

      let status: WebhookEventPayload['status'];
      if (intent.status === 'requires_capture') status = 'requires_capture';
      else if (intent.status === 'succeeded') status = 'succeeded';
      else if (intent.status === 'canceled') status = 'canceled';
      else status = 'failed';

      return {
        type: event.type,
        intentId: intent.id,
        amountCaptured: intent.amount_received || intent.amount_capturable,
        metadata: intent.metadata,
        status,
        rawEvent: event,
      };
    } catch (err) {
      if (err instanceof Error) {
        throw AppError.badRequest(`Webhook Error: ${err.message}`);
      }
      throw err;
    }
  }
}
