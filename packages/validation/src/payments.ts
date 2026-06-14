import { z } from 'zod';

export const createPaymentIntentBodySchema = z.object({
  holdToken: z.string().uuid('holdToken must be a valid UUID'),
});

export const stripeWebhookBodySchema = z.object({
  type: z.string(),
});

export type CreatePaymentIntentBody = z.infer<typeof createPaymentIntentBodySchema>;
