import { Router, type RequestHandler } from 'express';

import { authenticateRequired } from '../../shared/middleware/authenticate.js';
import { resolveInternalUser } from '../../shared/middleware/resolve-user.js';
import { validateBody, validateParams } from '../../shared/middleware/validate.js';
import { createHoldController, releaseHoldController } from './booking.controller.js';
import { createHoldBodySchema, releaseHoldParamsSchema } from '@khan-familia/validation';

export const bookingRouter = Router();

const requireAuth = authenticateRequired as RequestHandler;
const attachUser = resolveInternalUser as RequestHandler;

const guestChain: RequestHandler[] = [requireAuth, attachUser];

/** Place a temporary 15-minute hold on inventory during checkout */
bookingRouter.post(
  '/holds',
  ...guestChain,
  validateBody(createHoldBodySchema),
  createHoldController,
);

/** Manually release a hold (e.g. if user cancels checkout) */
bookingRouter.delete(
  '/holds/:holdToken',
  ...guestChain,
  validateParams(releaseHoldParamsSchema),
  releaseHoldController,
);
