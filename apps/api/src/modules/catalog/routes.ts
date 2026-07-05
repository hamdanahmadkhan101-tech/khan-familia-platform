import { TenantRole } from '@khan-familia/database';
import { Router, type RequestHandler } from 'express';

import { authenticateRequired } from '../../shared/middleware/authenticate.js';
import { resolveInternalUser } from '../../shared/middleware/resolve-user.js';
import { resolveTenant } from '../../shared/middleware/tenant.js';
import { validateBody, validateParams } from '../../shared/middleware/validate.js';
import { requireTenantRole } from '../tenancy/middleware/require-tenant-role.js';
import {
  createProperty,
  getPropertyForTenant,
  listPropertiesForTenant,
  softDeleteProperty,
  updateProperty,
} from './property.controller.js';
import {
  createPropertyBodySchema,
  createUnitTypeBodySchema,
  propertyIdParamsSchema,
  unitTypeParamsSchema,
  updatePropertyBodySchema,
  updateUnitTypeBodySchema,
} from '@khan-familia/validation';
import {
  createUnitType,
  deleteUnitType,
  getUnitType,
  listUnitTypesForProperty,
  updateUnitType,
} from './unit-type.controller.js';

export const catalogRouter = Router();

const requireAuth = authenticateRequired as RequestHandler;
const attachUser = resolveInternalUser as RequestHandler;
const attachTenant = resolveTenant as RequestHandler;

const ownerAdminOrStaffRead = requireTenantRole(
  TenantRole.OWNER,
  TenantRole.ADMIN,
  TenantRole.STAFF,
) as RequestHandler;
const ownerOrAdminWrite = requireTenantRole(TenantRole.OWNER, TenantRole.ADMIN) as RequestHandler;

const tenantChain: RequestHandler[] = [requireAuth, attachUser, attachTenant];
const tenantReadChain: RequestHandler[] = [...tenantChain, ownerAdminOrStaffRead];
const tenantWriteChain: RequestHandler[] = [...tenantChain, ownerOrAdminWrite];

/** Create a property for the active tenant (starts PENDING approval). */
catalogRouter.post(
  '/',
  ...tenantWriteChain,
  validateBody(createPropertyBodySchema),
  createProperty,
);

/** List properties for the active tenant. */
catalogRouter.get('/', ...tenantReadChain, listPropertiesForTenant);

/** Get one property in the active tenant. */
catalogRouter.get(
  '/:propertyId',
  ...tenantReadChain,
  validateParams(propertyIdParamsSchema),
  getPropertyForTenant,
);

/** Update a property; rejected listings return to PENDING on edit. */
catalogRouter.patch(
  '/:propertyId',
  ...tenantWriteChain,
  validateParams(propertyIdParamsSchema),
  validateBody(updatePropertyBodySchema),
  updateProperty,
);

/** Soft-delete a property. */
catalogRouter.delete(
  '/:propertyId',
  ...tenantWriteChain,
  validateParams(propertyIdParamsSchema),
  softDeleteProperty,
);

const unitTypeRouter = Router({ mergeParams: true });

unitTypeRouter.post(
  '/',
  ...tenantWriteChain,
  validateParams(propertyIdParamsSchema),
  validateBody(createUnitTypeBodySchema),
  createUnitType,
);

unitTypeRouter.get(
  '/',
  ...tenantReadChain,
  validateParams(propertyIdParamsSchema),
  listUnitTypesForProperty,
);

unitTypeRouter.get(
  '/:unitTypeId',
  ...tenantReadChain,
  validateParams(unitTypeParamsSchema),
  getUnitType,
);

unitTypeRouter.patch(
  '/:unitTypeId',
  ...tenantWriteChain,
  validateParams(unitTypeParamsSchema),
  validateBody(updateUnitTypeBodySchema),
  updateUnitType,
);

unitTypeRouter.delete(
  '/:unitTypeId',
  ...tenantWriteChain,
  validateParams(unitTypeParamsSchema),
  deleteUnitType,
);

catalogRouter.use('/:propertyId/unit-types', unitTypeRouter);
