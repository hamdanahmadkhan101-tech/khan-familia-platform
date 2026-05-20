import type { NextFunction, Response } from 'express';

import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../errors/AppError.js';
import type { AuthenticatedRequest, TenantRequest } from '../types/request.js';

/**
 * Middleware to resolve tenantId from authenticated request.
 * Requires auth + internal user; use after authenticateRequired and resolveInternalUser.
 *
 * Resolution order:
 * 1. Query param: ?tenantId=xyz
 * 2. Header: X-Tenant-ID
 * 3. User's default tenant
 */
export const resolveTenant = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.auth) {
    throw AppError.unauthorized('Authentication required');
  }

  if (!req.userId) {
    throw AppError.unauthorized('Internal user context required; use resolveInternalUser first');
  }

  let tenantId = (req.query['tenantId'] as string) || (req.headers['x-tenant-id'] as string);

  if (!tenantId) {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { defaultTenantId: true },
    });

    if (!user?.defaultTenantId) {
      throw AppError.badRequest('No tenant context available');
    }

    tenantId = user.defaultTenantId;
  }

  const tenantMember = await prisma.tenantUser.findFirst({
    where: {
      userId: req.userId,
      tenantId,
      status: 'ACTIVE',
    },
  });

  if (!tenantMember) {
    throw AppError.forbidden('Access denied to this tenant');
  }

  const tenantRequest = req as TenantRequest;
  tenantRequest.userId = req.userId;
  tenantRequest.tenantId = tenantId;
  tenantRequest.tenantRole = tenantMember.role;
  next();
};
