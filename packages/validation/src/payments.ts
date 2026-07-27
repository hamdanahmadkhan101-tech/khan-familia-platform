import { z } from 'zod';
import { guestDetailSchema } from './booking.js';

export const createPaymentIntentBodySchema = z.object({
  holdToken: z.string().uuid('holdToken must be a valid UUID'),
  guestDetails: z.array(guestDetailSchema).optional(),
  specialNeeds: z.array(z.string()).optional(),
});

export const stripeWebhookBodySchema = z.object({
  type: z.string(),
});

export type CreatePaymentIntentBody = z.infer<typeof createPaymentIntentBodySchema>;
