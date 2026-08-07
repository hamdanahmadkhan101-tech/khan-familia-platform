export interface PaymentGatewayConfig {
  apiKey: string;
  webhookSecret?: string;
}

export interface CreateIntentRequest {
  amountMinor: number;
  currency: string;
  captureMethod: 'automatic' | 'manual';
  metadata: Record<string, string>;
}

export interface CreateIntentResponse {
  gatewayIntentId: string;
  clientSecret: string;
}

export interface WebhookEventPayload {
  type: string;
  intentId: string;
  amountCaptured?: number;
  metadata?: Record<string, string>;
  status: 'requires_capture' | 'succeeded' | 'failed' | 'canceled';
  rawEvent?: unknown;
}

export interface RefundRequest {
  intentId: string;
  amountMinor?: number;
  reason?: string;
}

export interface PaymentGateway {
  createIntent(req: CreateIntentRequest): Promise<CreateIntentResponse>;
  retrieveIntent(intentId: string): Promise<unknown>;
  confirmIntent?(intentId: string): Promise<void>; // E.g., capturing a hold
  cancelIntent?(intentId: string): Promise<void>;
  refundIntent?(req: RefundRequest): Promise<void>;
  parseWebhookEvent(signature: string, rawBody: Buffer): WebhookEventPayload;
}
