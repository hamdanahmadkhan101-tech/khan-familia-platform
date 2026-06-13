import { TenantRole } from '@khan-familia/database';
import { Router, type RequestHandler } from 'express';

import { authenticateRequired } from '../../shared/middleware/authenticate.js';
import { resolveInternalUser } from '../../shared/middleware/resolve-user.js';
import { resolveTenant } from '../../shared/middleware/tenant.js';
import { validateParams, validateQuery } from '../../shared/middleware/validate.js';
import { requireTenantRole } from '../tenancy/middleware/require-tenant-role.js';
import { getAvailability } from './inventory.controller.js';
import { getAvailabilityQuerySchema, propertyIdParamsSchema } from './schemas.js';

export const inventoryRouter = Router();

const requireAuth = authenticateRequired as RequestHandler;
const attachUser = resolveInternalUser as RequestHandler;
const attachTenant = resolveTenant as RequestHandler;
const ownerAdminOrStaffRead = requireTenantRole(
  TenantRole.OWNER,
  TenantRole.ADMIN,
  TenantRole.STAFF,
) as RequestHandler;

const tenantReadChain: RequestHandler[] = [
  requireAuth,
  attachUser,
  attachTenant,
  ownerAdminOrStaffRead,
];

/** Read inventory availability for a property over a date range. */
inventoryRouter.get(
  '/:propertyId/availability',
  ...tenantReadChain,
  validateParams(propertyIdParamsSchema),
  validateQuery(getAvailabilityQuerySchema),
  getAvailability,
);
