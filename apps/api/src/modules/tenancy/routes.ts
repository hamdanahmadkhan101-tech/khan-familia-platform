import { TenantRole } from '@khan-familia/database';
import { Router, type RequestHandler } from 'express';

import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../../shared/errors/AppError.js';
import { authenticateRequired } from '../../shared/middleware/authenticate.js';
import { resolveInternalUser } from '../../shared/middleware/resolve-user.js';
import { resolveTenant } from '../../shared/middleware/tenant.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { validateParams } from '../../shared/middleware/validate.js';
import type { AuthenticatedRequest, TenantRequest } from '../../shared/types/request.js';
import {
  acceptTenantInvite,
  createTenantInvite,
  listTenantInvites,
  revokeTenantInvite,
} from './invite.service.js';
import { requireTenantRole } from './middleware/require-tenant-role.js';
import {
  acceptInviteBodySchema,
  type AcceptInviteBody,
  createInviteBodySchema,
  type CreateInviteBody,
  createTenantBodySchema,
  type CreateTenantBody,
  tenantIdParamsSchema,
  tenantInviteParamsSchema,
  tenantMemberParamsSchema,
  type UpdateTenantBody,
  updateTenantBodySchema,
} from './schemas.js';
import {
  createTenant,
  getTenantById,
  listTenantMembers,
  listTenantsForUser,
  removeTenantMember,
  updateTenant,
} from './tenant.service.js';

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
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.userId) {
        throw AppError.unauthorized('User context required');
      }

      const tenant = await createTenant(authReq.userId, req.body as CreateTenantBody);
      res.status(201).json(tenant);
    } catch (err) {
      next(err);
    }
  },
);

/** List tenants the current user belongs to. */
tenancyRouter.get('/', requireAuth, attachUser, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.userId) {
      throw AppError.unauthorized('User context required');
    }

    const tenants = await listTenantsForUser(authReq.userId);
    res.status(200).json({ tenants });
  } catch (err) {
    next(err);
  }
});

/** Accept invite by token (email must match signed-in user). */
tenancyRouter.post(
  '/invites/accept',
  requireAuth,
  attachUser,
  validateBody(acceptInviteBodySchema),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.userId) {
        throw AppError.unauthorized('User context required');
      }

      const user = await prisma.user.findUnique({
        where: { id: authReq.userId },
        select: { email: true },
      });

      if (!user) {
        throw AppError.notFound('User not found');
      }

      const body = req.body as AcceptInviteBody;
      const tenant = await acceptTenantInvite(authReq.userId, user.email, body.token);
      res.status(200).json({ tenant });
    } catch (err) {
      next(err);
    }
  },
);

tenancyRouter.get(
  '/:tenantId',
  requireAuth,
  attachUser,
  validateParams(tenantIdParamsSchema),
  attachTenant,
  async (req, res, next) => {
    try {
      const { tenantId } = req.params as { tenantId: string };
      const tenant = await getTenantById(tenantId);
      res.status(200).json(tenant);
    } catch (err) {
      next(err);
    }
  },
);

tenancyRouter.patch(
  '/:tenantId',
  requireAuth,
  attachUser,
  validateParams(tenantIdParamsSchema),
  attachTenant,
  ownerOrAdmin,
  validateBody(updateTenantBodySchema),
  async (req, res, next) => {
    try {
      const { tenantId } = req.params as { tenantId: string };
      const tenant = await updateTenant(tenantId, req.body as UpdateTenantBody);
      res.status(200).json(tenant);
    } catch (err) {
      next(err);
    }
  },
);

tenancyRouter.get(
  '/:tenantId/members',
  requireAuth,
  attachUser,
  validateParams(tenantIdParamsSchema),
  attachTenant,
  async (req, res, next) => {
    try {
      const { tenantId } = req.params as { tenantId: string };
      const members = await listTenantMembers(tenantId);
      res.status(200).json({ members });
    } catch (err) {
      next(err);
    }
  },
);

tenancyRouter.post(
  '/:tenantId/invites',
  requireAuth,
  attachUser,
  validateParams(tenantIdParamsSchema),
  attachTenant,
  ownerOrAdmin,
  validateBody(createInviteBodySchema),
  async (req, res, next) => {
    try {
      const tenantReq = req as TenantRequest;
      const { tenantId } = req.params as { tenantId: string };
      const invite = await createTenantInvite(
        tenantId,
        tenantReq.userId,
        req.body as CreateInviteBody,
      );
      res.status(201).json(invite);
    } catch (err) {
      next(err);
    }
  },
);

tenancyRouter.get(
  '/:tenantId/invites',
  requireAuth,
  attachUser,
  validateParams(tenantIdParamsSchema),
  attachTenant,
  ownerOrAdmin,
  async (req, res, next) => {
    try {
      const { tenantId } = req.params as { tenantId: string };
      const invites = await listTenantInvites(tenantId);
      res.status(200).json({ invites });
    } catch (err) {
      next(err);
    }
  },
);

tenancyRouter.delete(
  '/:tenantId/invites/:inviteId',
  requireAuth,
  attachUser,
  validateParams(tenantInviteParamsSchema),
  attachTenant,
  ownerOrAdmin,
  async (req, res, next) => {
    try {
      const { tenantId, inviteId } = req.params as { tenantId: string; inviteId: string };
      const invite = await revokeTenantInvite(tenantId, inviteId);
      res.status(200).json(invite);
    } catch (err) {
      next(err);
    }
  },
);

tenancyRouter.delete(
  '/:tenantId/members/:userId',
  requireAuth,
  attachUser,
  validateParams(tenantMemberParamsSchema),
  attachTenant,
  ownerOrAdmin,
  async (req, res, next) => {
    try {
      const tenantReq = req as TenantRequest;
      const { tenantId, userId: targetUserId } = req.params as {
        tenantId: string;
        userId: string;
      };

      await removeTenantMember(tenantId, targetUserId, tenantReq.userId, tenantReq.tenantRole);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
