import { PlatformRole } from '@khan-familia/database';
import { Router, type RequestHandler } from 'express';
import { authenticateRequired } from '../../shared/middleware/authenticate.js';
import { requirePlatformRole } from '../../shared/middleware/require-platform-role.js';
import { resolveInternalUser } from '../../shared/middleware/resolve-user.js';
import { validateBody, validateParams } from '../../shared/middleware/validate.js';
import {
  applicationReviewBodySchema,
  propertyIdParamsSchema,
  rejectPropertyBodySchema,
} from '@khan-familia/validation';
import {
  approveProperty,
  listPendingProperties,
  rejectProperty,
  listPendingApplications,
  approveApplication,
  rejectApplication,
} from './admin.controller.js';
import { z } from 'zod';

const applicationIdParamsSchema = z.object({
  applicationId: z.string().cuid(),
});

export const adminRouter = Router();

const requireAuth = authenticateRequired as RequestHandler;
const attachUser = resolveInternalUser as RequestHandler;
const requireSuperAdmin = requirePlatformRole(PlatformRole.SUPER_ADMIN) as RequestHandler;

/** List properties awaiting platform approval. */
adminRouter.get(
  '/properties/pending',
  requireAuth,
  attachUser,
  requireSuperAdmin,
  listPendingProperties,
);

/** Approve a property (platform moderator). */
adminRouter.post(
  '/properties/:propertyId/approve',
  requireAuth,
  attachUser,
  requireSuperAdmin,
  validateParams(propertyIdParamsSchema),
  approveProperty,
);

/** Reject a property with a reason (platform moderator). */
adminRouter.post(
  '/properties/:propertyId/reject',
  requireAuth,
  attachUser,
  requireSuperAdmin,
  validateParams(propertyIdParamsSchema),
  validateBody(rejectPropertyBodySchema),
  rejectProperty,
);

/** List applications awaiting admin approval. */
adminRouter.get(
  '/applications/pending',
  requireAuth,
  attachUser,
  requireSuperAdmin,
  listPendingApplications,
);

/** Approve an application. */
adminRouter.post(
  '/applications/:applicationId/approve',
  requireAuth,
  attachUser,
  requireSuperAdmin,
  validateParams(applicationIdParamsSchema),
  validateBody(applicationReviewBodySchema),
  approveApplication,
);

/** Reject an application. */
adminRouter.post(
  '/applications/:applicationId/reject',
  requireAuth,
  attachUser,
  requireSuperAdmin,
  validateParams(applicationIdParamsSchema),
  validateBody(applicationReviewBodySchema),
  rejectApplication,
);
