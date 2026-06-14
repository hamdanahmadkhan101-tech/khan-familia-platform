import type { NextFunction, Request, Response } from 'express';
import { env } from '../../env.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { AuthenticatedRequest } from '../../shared/types/request.js';
import { createStripePaymentIntent, handleStripeWebhookEvent } from './payment.service.js';
import type { CreatePaymentIntentBody } from '@khan-familia/validation';

/** POST /payments/intent — Creates a Stripe PaymentIntent for a given hold */
export const createPaymentIntentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as CreatePaymentIntentBody;
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const result = await createStripePaymentIntent(body.holdToken, authReq.userId);

    res.status(201).json(result);
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
