import type {
  PaymentGateway,
  CreateIntentRequest,
  CreateIntentResponse,
  WebhookEventPayload,
  RefundRequest,
} from './gateway.interface.js';
import { AppError } from '../../shared/errors/AppError.js';

interface RapidWebhookEvent {
  status?: string;
  type?: string;
  intent_id?: string;
  amount_captured?: number;
  metadata?: Record<string, string>;
}

/**
 * Rapid Gateway Integration Placeholder
 * This is a stub for the Rapid Gateway integration.
 * It implements the PaymentGateway interface but does not yet contain real API calls.
 */
export class RapidGateway implements PaymentGateway {
  constructor() {}

  createIntent(req: CreateIntentRequest): Promise<CreateIntentResponse> {
    void req;
    // Generate a mock intent ID for now
    const mockIntentId = `rg_pi_${Math.random().toString(36).substring(2, 15)}`;

    // In a real integration, we would call the Rapid Gateway API here to create an intent
    // and return the required client secret or token for the frontend to complete payment.
    return Promise.resolve({
      gatewayIntentId: mockIntentId,
      clientSecret: `mock_secret_${mockIntentId}`,
    });
  }

  retrieveIntent(intentId: string): Promise<unknown> {
    // Return mock data for now
    return Promise.resolve({
      id: intentId,
      status: 'requires_capture',
      amount_capturable: 0,
      metadata: {},
    });
  }

  confirmIntent(intentId: string): Promise<void> {
    // Mock capturing a hold
    console.log(`[RapidGateway] Confirming intent: ${intentId}`);
    return Promise.resolve();
  }

  cancelIntent(intentId: string): Promise<void> {
    // Mock canceling an intent
    console.log(`[RapidGateway] Canceling intent: ${intentId}`);
    return Promise.resolve();
  }

  refundIntent(req: RefundRequest): Promise<void> {
    // Mock refunding an intent
    console.log(
      `[RapidGateway] Refunding intent: ${req.intentId} for amount ${req.amountMinor ?? 'FULL'}`,
    );
    return Promise.resolve();
  }

  parseWebhookEvent(signature: string, rawBody: Buffer): WebhookEventPayload {
    // Mock webhook parsing
    // A real implementation would verify the signature using the Rapid Gateway secret
    try {
      const event = JSON.parse(rawBody.toString('utf8')) as RapidWebhookEvent;

      // Default to failed if we can't determine status
      let status: WebhookEventPayload['status'] = 'failed';
      if (event.status === 'success') status = 'succeeded';
      else if (event.status === 'authorized') status = 'requires_capture';
      else if (event.status === 'cancelled') status = 'canceled';

      return {
        type: event.type ?? 'unknown',
        intentId: event.intent_id ?? 'unknown',
        amountCaptured: event.amount_captured ?? 0,
        metadata: event.metadata ?? {},
        status,
        rawEvent: event,
      };
    } catch (err) {
      void err;
      throw AppError.badRequest('Invalid Rapid Gateway webhook payload');
    }
  }
}
