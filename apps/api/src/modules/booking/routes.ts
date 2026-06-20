import { Router, type RequestHandler } from 'express';

import { authenticateRequired } from '../../shared/middleware/authenticate.js';
import { resolveInternalUser } from '../../shared/middleware/resolve-user.js';
import { validateBody, validateParams, validateQuery } from '../../shared/middleware/validate.js';
import {
  cancelGuestBookingController,
  createHoldController,
  getGuestBookingController,
  listGuestBookingsController,
  releaseHoldController,
} from './booking.controller.js';
import {
  bookingIdParamsSchema,
  cancelGuestBookingBodySchema,
  createHoldBodySchema,
  guestBookingListQuerySchema,
  releaseHoldParamsSchema,
} from '@khan-familia/validation';

export const bookingRouter = Router();

const requireAuth = authenticateRequired as RequestHandler;
const attachUser = resolveInternalUser as RequestHandler;

const guestChain: RequestHandler[] = [requireAuth, attachUser];

/** List bookings for the authenticated guest. */
bookingRouter.get(
  '/me',
  ...guestChain,
  validateQuery(guestBookingListQuerySchema),
  listGuestBookingsController,
);

/** View one booking owned by the authenticated guest. */
bookingRouter.get(
  '/:bookingId',
  ...guestChain,
  validateParams(bookingIdParamsSchema),
  getGuestBookingController,
);

/** Cancel one booking owned by the authenticated guest. */
bookingRouter.post(
  '/:bookingId/cancel',
  ...guestChain,
  validateParams(bookingIdParamsSchema),
  validateBody(cancelGuestBookingBodySchema),
  cancelGuestBookingController,
);

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
