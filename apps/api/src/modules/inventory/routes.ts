import { TenantRole } from '@khan-familia/database';
import { Router, type RequestHandler } from 'express';

import { authenticateRequired } from '../../shared/middleware/authenticate.js';
import { resolveInternalUser } from '../../shared/middleware/resolve-user.js';
import { resolveTenant } from '../../shared/middleware/tenant.js';
import { validateBody, validateParams, validateQuery } from '../../shared/middleware/validate.js';
import { requireTenantRole } from '../tenancy/middleware/require-tenant-role.js';
import {
  blockInventoryController,
  getAvailability,
  setPricingController,
  unblockInventoryController,
} from './inventory.controller.js';
import {
  blockInventoryBodySchema,
  getAvailabilityQuerySchema,
  propertyIdParamsSchema,
  setPricingBodySchema,
  unblockInventoryBodySchema,
} from '@khan-familia/validation';

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

const tenantWriteChain: RequestHandler[] = [
  requireAuth,
  attachUser,
  attachTenant,
  requireTenantRole(TenantRole.OWNER, TenantRole.ADMIN, TenantRole.STAFF) as RequestHandler,
];

/** Read inventory availability for a property over a date range. */
inventoryRouter.get(
  '/:propertyId/availability',
  ...tenantReadChain,
  validateParams(propertyIdParamsSchema),
  validateQuery(getAvailabilityQuerySchema),
  getAvailability,
);

/** Block specific inventory dates */
inventoryRouter.post(
  '/:propertyId/blocks',
  ...tenantWriteChain,
  validateParams(propertyIdParamsSchema),
  validateBody(blockInventoryBodySchema),
  blockInventoryController,
);

/** Unblock specific inventory dates */
inventoryRouter.post(
  '/:propertyId/unblock',
  ...tenantWriteChain,
  validateParams(propertyIdParamsSchema),
  validateBody(unblockInventoryBodySchema),
  unblockInventoryController,
);

/** Set manual price overrides for specific dates */
inventoryRouter.put(
  '/:propertyId/pricing',
  ...tenantWriteChain,
  validateParams(propertyIdParamsSchema),
  validateBody(setPricingBodySchema),
  setPricingController,
);
