import type { NextFunction, Response } from 'express';

import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../errors/AppError.js';
import type { AuthenticatedRequest, TenantRequest } from '../types/request.js';

/**
 * Middleware to resolve tenantId from authenticated request.
 * Requires auth to be present; use after authenticateRequired.
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

  // Check query param or header
  let tenantId = (req.query['tenantId'] as string) || (req.headers['x-tenant-id'] as string);

  if (!tenantId) {
    // Resolve default tenant
    const user = await prisma.user.findUnique({
      where: { id: req.auth.sub },
      select: { defaultTenantId: true },
    });

    if (!user?.defaultTenantId) {
      throw AppError.badRequest('No tenant context available');
    }

    tenantId = user.defaultTenantId;
  }

  // Verify user has access to this tenant
  const tenantMember = await prisma.tenantUser.findFirst({
    where: {
      userId: req.auth.sub,
      tenantId,
      status: 'ACTIVE',
    },
  });

  if (!tenantMember) {
    throw AppError.forbidden('Access denied to this tenant');
  }

  (req as TenantRequest).tenantId = tenantId;
  next();
};
