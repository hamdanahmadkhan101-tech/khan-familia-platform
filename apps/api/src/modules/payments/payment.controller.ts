import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import type { AuthenticatedRequest } from '../../shared/types/request.js';
import {
  confirmStripePaymentIntent,
  createPaymentIntent,
  handleStripeWebhookEvent,
} from './payment.service.js';
import {
  type CreatePaymentIntentBody,
  type ConfirmPaymentIntentBody,
} from '@khan-familia/validation';

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

    const result = await createPaymentIntent(
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
    const authReq = req as AuthenticatedRequest;
    if (!authReq.userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const body = req.body as ConfirmPaymentIntentBody;
    const booking = await confirmStripePaymentIntent(body.paymentIntentId, authReq.userId);

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

    const result = await handleStripeWebhookEvent(req.body as Buffer, signature);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
