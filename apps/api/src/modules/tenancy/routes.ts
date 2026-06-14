import { TenantRole } from '@khan-familia/database';
import { Router, type RequestHandler } from 'express';

import { authenticateRequired } from '../../shared/middleware/authenticate.js';
import { resolveInternalUser } from '../../shared/middleware/resolve-user.js';
import { resolveTenant } from '../../shared/middleware/tenant.js';
import { validateBody, validateParams } from '../../shared/middleware/validate.js';

import {
  acceptTenantInvite,
  createTenantInvite,
  listTenantInvites,
  revokeTenantInvite,
} from './invite.controller.js';
import { requireTenantRole } from './middleware/require-tenant-role.js';
import {
  acceptInviteBodySchema,
  createInviteBodySchema,
  createTenantBodySchema,
  tenantIdParamsSchema,
  tenantInviteParamsSchema,
  tenantMemberParamsSchema,
  updateTenantBodySchema,
} from '@khan-familia/validation';
import {
  createTenant,
  getTenantById,
  listTenantMembers,
  listTenantsForUser,
  removeTenantMember,
  updateTenant,
} from './tenant.controller.js';

export const tenancyRouter = Router();

const requireAuth = authenticateRequired as RequestHandler;
const attachUser = resolveInternalUser as RequestHandler;
const attachTenant = resolveTenant as RequestHandler;

const ownerOrAdmin = requireTenantRole(TenantRole.OWNER, TenantRole.ADMIN) as RequestHandler;

/** Create a tenant; caller becomes OWNER. */
tenancyRouter.post(
  '/',
  requireAuth,
  attachUser,
  validateBody(createTenantBodySchema),
  createTenant,
);

/** List tenants the current user belongs to. */
tenancyRouter.get('/', requireAuth, attachUser, listTenantsForUser);

/** Accept invite by token (email must match signed-in user). */
tenancyRouter.post(
  '/invites/accept',
  requireAuth,
  attachUser,
  validateBody(acceptInviteBodySchema),
  acceptTenantInvite,
);

tenancyRouter.get(
  '/:tenantId',
  requireAuth,
  attachUser,
  validateParams(tenantIdParamsSchema),
  attachTenant,
  getTenantById,
);

tenancyRouter.patch(
  '/:tenantId',
  requireAuth,
  attachUser,
  validateParams(tenantIdParamsSchema),
  attachTenant,
  ownerOrAdmin,
  validateBody(updateTenantBodySchema),
  updateTenant,
);

tenancyRouter.get(
  '/:tenantId/members',
  requireAuth,
  attachUser,
  validateParams(tenantIdParamsSchema),
  attachTenant,
  listTenantMembers,
);

tenancyRouter.post(
  '/:tenantId/invites',
  requireAuth,
  attachUser,
  validateParams(tenantIdParamsSchema),
  attachTenant,
  ownerOrAdmin,
  validateBody(createInviteBodySchema),
  createTenantInvite,
);

tenancyRouter.get(
  '/:tenantId/invites',
  requireAuth,
  attachUser,
  validateParams(tenantIdParamsSchema),
  attachTenant,
  ownerOrAdmin,
  listTenantInvites,
);

tenancyRouter.delete(
  '/:tenantId/invites/:inviteId',
  requireAuth,
  attachUser,
  validateParams(tenantInviteParamsSchema),
  attachTenant,
  ownerOrAdmin,
  revokeTenantInvite,
);

tenancyRouter.delete(
  '/:tenantId/members/:userId',
  requireAuth,
  attachUser,
  validateParams(tenantMemberParamsSchema),
  attachTenant,
  ownerOrAdmin,
  removeTenantMember,
);
