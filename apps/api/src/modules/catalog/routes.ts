import { PlatformRole, TenantRole } from '@khan-familia/database';
import { Router, type RequestHandler } from 'express';

import { authenticateRequired } from '../../shared/middleware/authenticate.js';
import { requirePlatformRole } from '../../shared/middleware/require-platform-role.js';
import { resolveInternalUser } from '../../shared/middleware/resolve-user.js';
import { resolveTenant } from '../../shared/middleware/tenant.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { validateParams } from '../../shared/middleware/validate.js';
import type { AuthenticatedRequest, TenantRequest } from '../../shared/types/request.js';
import { requireTenantRole } from '../tenancy/middleware/require-tenant-role.js';
import {
  approveProperty,
  createProperty,
  getPropertyForTenant,
  listPendingProperties,
  listPropertiesForTenant,
  rejectProperty,
  softDeleteProperty,
  updateProperty,
} from './property.service.js';
import {
  createUnitTypeBodySchema,
  createPropertyBodySchema,
  propertyIdParamsSchema,
  rejectPropertyBodySchema,
  unitTypeParamsSchema,
  updatePropertyBodySchema,
  updateUnitTypeBodySchema,
} from './schemas.js';
import {
  createUnitType,
  deleteUnitType,
  getUnitType,
  listUnitTypesForProperty,
  updateUnitType,
} from './unit-type.service.js';

export const catalogRouter = Router();
export const catalogAdminRouter = Router();

const requireAuth = authenticateRequired as RequestHandler;
const attachUser = resolveInternalUser as RequestHandler;
const attachTenant = resolveTenant as RequestHandler;
const requireSuperAdmin = requirePlatformRole(PlatformRole.SUPER_ADMIN) as RequestHandler;

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
  async (req, res, next) => {
    try {
      const tenantReq = req as TenantRequest;
      const property = await createProperty(tenantReq.tenantId, req.body);
      res.status(201).json(property);
    } catch (err) {
      next(err);
    }
  },
);

/** List properties for the active tenant. */
catalogRouter.get('/', ...tenantReadChain, async (req, res, next) => {
  try {
    const tenantReq = req as TenantRequest;
    const properties = await listPropertiesForTenant(tenantReq.tenantId);
    res.status(200).json({ properties });
  } catch (err) {
    next(err);
  }
});

/** Get one property in the active tenant. */
catalogRouter.get(
  '/:propertyId',
  ...tenantReadChain,
  validateParams(propertyIdParamsSchema),
  async (req, res, next) => {
    try {
      const tenantReq = req as TenantRequest;
      const { propertyId } = req.params as { propertyId: string };
      const property = await getPropertyForTenant(tenantReq.tenantId, propertyId);
      res.status(200).json(property);
    } catch (err) {
      next(err);
    }
  },
);

/** Update a property; rejected listings return to PENDING on edit. */
catalogRouter.patch(
  '/:propertyId',
  ...tenantWriteChain,
  validateParams(propertyIdParamsSchema),
  validateBody(updatePropertyBodySchema),
  async (req, res, next) => {
    try {
      const tenantReq = req as TenantRequest;
      const { propertyId } = req.params as { propertyId: string };
      const property = await updateProperty(tenantReq.tenantId, propertyId, req.body);
      res.status(200).json(property);
    } catch (err) {
      next(err);
    }
  },
);

/** Soft-delete a property. */
catalogRouter.delete(
  '/:propertyId',
  ...tenantWriteChain,
  validateParams(propertyIdParamsSchema),
  async (req, res, next) => {
    try {
      const tenantReq = req as TenantRequest;
      const { propertyId } = req.params as { propertyId: string };
      await softDeleteProperty(tenantReq.tenantId, propertyId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

const unitTypeRouter = Router({ mergeParams: true });

unitTypeRouter.post(
  '/',
  ...tenantWriteChain,
  validateParams(propertyIdParamsSchema),
  validateBody(createUnitTypeBodySchema),
  async (req, res, next) => {
    try {
      const tenantReq = req as TenantRequest;
      const { propertyId } = req.params as { propertyId: string };
      const unitType = await createUnitType(tenantReq.tenantId, propertyId, req.body);
      res.status(201).json(unitType);
    } catch (err) {
      next(err);
    }
  },
);

unitTypeRouter.get(
  '/',
  ...tenantReadChain,
  validateParams(propertyIdParamsSchema),
  async (req, res, next) => {
    try {
      const tenantReq = req as TenantRequest;
      const { propertyId } = req.params as { propertyId: string };
      const unitTypes = await listUnitTypesForProperty(tenantReq.tenantId, propertyId);
      res.status(200).json({ unitTypes });
    } catch (err) {
      next(err);
    }
  },
);

unitTypeRouter.get(
  '/:unitTypeId',
  ...tenantReadChain,
  validateParams(unitTypeParamsSchema),
  async (req, res, next) => {
    try {
      const tenantReq = req as TenantRequest;
      const { propertyId, unitTypeId } = req.params as {
        propertyId: string;
        unitTypeId: string;
      };
      const unitType = await getUnitType(tenantReq.tenantId, propertyId, unitTypeId);
      res.status(200).json(unitType);
    } catch (err) {
      next(err);
    }
  },
);

unitTypeRouter.patch(
  '/:unitTypeId',
  ...tenantWriteChain,
  validateParams(unitTypeParamsSchema),
  validateBody(updateUnitTypeBodySchema),
  async (req, res, next) => {
    try {
      const tenantReq = req as TenantRequest;
      const { propertyId, unitTypeId } = req.params as {
        propertyId: string;
        unitTypeId: string;
      };
      const unitType = await updateUnitType(tenantReq.tenantId, propertyId, unitTypeId, req.body);
      res.status(200).json(unitType);
    } catch (err) {
      next(err);
    }
  },
);

unitTypeRouter.delete(
  '/:unitTypeId',
  ...tenantWriteChain,
  validateParams(unitTypeParamsSchema),
  async (req, res, next) => {
    try {
      const tenantReq = req as TenantRequest;
      const { propertyId, unitTypeId } = req.params as {
        propertyId: string;
        unitTypeId: string;
      };
      await deleteUnitType(tenantReq.tenantId, propertyId, unitTypeId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

catalogRouter.use('/:propertyId/unit-types', unitTypeRouter);

/** List properties awaiting platform approval. */
catalogAdminRouter.get(
  '/pending',
  requireAuth,
  attachUser,
  requireSuperAdmin,
  async (_req, res, next) => {
    try {
      const properties = await listPendingProperties();
      res.status(200).json({ properties });
    } catch (err) {
      next(err);
    }
  },
);

/** Approve a property (platform moderator). */
catalogAdminRouter.post(
  '/:propertyId/approve',
  requireAuth,
  attachUser,
  requireSuperAdmin,
  validateParams(propertyIdParamsSchema),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { propertyId } = req.params as { propertyId: string };
      const property = await approveProperty(propertyId, authReq.userId!);
      res.status(200).json(property);
    } catch (err) {
      next(err);
    }
  },
);

/** Reject a property with a reason (platform moderator). */
catalogAdminRouter.post(
  '/:propertyId/reject',
  requireAuth,
  attachUser,
  requireSuperAdmin,
  validateParams(propertyIdParamsSchema),
  validateBody(rejectPropertyBodySchema),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { propertyId } = req.params as { propertyId: string };
      const property = await rejectProperty(propertyId, authReq.userId!, req.body);
      res.status(200).json(property);
    } catch (err) {
      next(err);
    }
  },
);
