import { z } from 'zod';
import { guestDetailSchema } from './booking.js';

export const createPaymentIntentBodySchema = z.object({
  holdToken: z.string().uuid('holdToken must be a valid UUID'),
  guestDetails: z.array(guestDetailSchema).optional(),
  specialNeeds: z.array(z.string()).optional(),
});

export const confirmPaymentIntentBodySchema = z.object({
  paymentIntentId: z.string().min(1, 'paymentIntentId is required'),
});

export const stripeWebhookBodySchema = z.object({
  type: z.string(),
});

export type CreatePaymentIntentBody = z.infer<typeof createPaymentIntentBodySchema>;
export type ConfirmPaymentIntentBody = z.infer<typeof confirmPaymentIntentBodySchema>;
