import { Router, type RequestHandler } from 'express';
import { authenticateRequired } from '../../shared/middleware/authenticate.js';
import { resolveInternalUser } from '../../shared/middleware/resolve-user.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { createPaymentIntentController } from './payment.controller.js';
import { createPaymentIntentBodySchema } from '@khan-familia/validation';

export const paymentsRouter = Router();

const requireAuth = authenticateRequired as RequestHandler;
const attachUser = resolveInternalUser as RequestHandler;

/**
 * POST /payments/intent
 * Authenticated guest creates a Stripe PaymentIntent for a held booking.
 * Returns `clientSecret` for the frontend Stripe.js Elements widget.
 */
paymentsRouter.post(
  '/intent',
  requireAuth,
  attachUser,
  validateBody(createPaymentIntentBodySchema),
  createPaymentIntentController,
);
