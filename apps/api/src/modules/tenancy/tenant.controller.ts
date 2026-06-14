import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../shared/errors/AppError.js';
import type { AuthenticatedRequest, TenantRequest } from '../../shared/types/request.js';
import type { CreateTenantBody, UpdateTenantBody } from '@khan-familia/validation';
import {
  createTenant as createTenantService,
  getTenantById as getTenantByIdService,
  listTenantMembers as listTenantMembersService,
  listTenantsForUser as listTenantsForUserService,
  removeTenantMember as removeTenantMemberService,
  updateTenant as updateTenantService,
} from './tenant.service.js';

export const createTenant = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.userId) {
      throw AppError.unauthorized('User context required');
    }

    const tenant = await createTenantService(authReq.userId, req.body as CreateTenantBody);
    res.status(201).json(tenant);
  } catch (err) {
    next(err);
  }
};

export const listTenantsForUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.userId) {
      throw AppError.unauthorized('User context required');
    }

    const tenants = await listTenantsForUserService(authReq.userId);
    res.status(200).json({ tenants });
  } catch (err) {
    next(err);
  }
};

export const getTenantById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { tenantId } = req.params as { tenantId: string };
    const tenant = await getTenantByIdService(tenantId);
    res.status(200).json(tenant);
  } catch (err) {
    next(err);
  }
};

export const updateTenant = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { tenantId } = req.params as { tenantId: string };
    const tenant = await updateTenantService(tenantId, req.body as UpdateTenantBody);
    res.status(200).json(tenant);
  } catch (err) {
    next(err);
  }
};

export const listTenantMembers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { tenantId } = req.params as { tenantId: string };
    const members = await listTenantMembersService(tenantId);
    res.status(200).json({ members });
  } catch (err) {
    next(err);
  }
};

export const removeTenantMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const { tenantId, userId: targetUserId } = req.params as {
      tenantId: string;
      userId: string;
    };

    await removeTenantMemberService(tenantId, targetUserId, tenantReq.userId, tenantReq.tenantRole);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
