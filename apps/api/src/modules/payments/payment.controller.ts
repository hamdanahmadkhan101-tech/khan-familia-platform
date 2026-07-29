import type { NextFunction, Request, Response } from 'express';
import { env } from '../../env.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { AuthenticatedRequest } from '../../shared/types/request.js';
import {
  confirmStripePaymentIntent,
  createStripePaymentIntent,
  handleStripeWebhookEvent,
} from './payment.service.js';
import {
  createPaymentIntentBodySchema,
  confirmPaymentIntentBodySchema,
} from '@khan-familia/validation';

/** POST /payments/intent — Creates a Stripe PaymentIntent for a given hold */
export const createPaymentIntentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = createPaymentIntentBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(`Invalid request body: ${parsed.error.message}`);
    }
    const body = parsed.data;

    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const result = await createStripePaymentIntent(
      body.holdToken,
      authReq.userId,
      body.guestDetails,
      body.specialNeeds,
    );

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/** POST /payments/confirm — Synchronously verifies Stripe payment and creates booking */
export const confirmPaymentIntentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = confirmPaymentIntentBodySchema.safeParse(req.body);

    if (!parsed.success) {
      throw AppError.badRequest(`Invalid request body: ${parsed.error.message}`);
    }

    const authReq = req as AuthenticatedRequest;
    if (!authReq.userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const booking = await confirmStripePaymentIntent(parsed.data.paymentIntentId, authReq.userId);

    res.status(200).json({ message: 'Booking confirmed successfully', booking });
  } catch (err) {
    next(err);
  }
};

/** POST /payments/webhooks/stripe — Stripe sends payment confirmation here */
export const stripeWebhookController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      throw AppError.badRequest('Missing stripe-signature header');
    }

    const result = await handleStripeWebhookEvent(
      req.body as Buffer,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
