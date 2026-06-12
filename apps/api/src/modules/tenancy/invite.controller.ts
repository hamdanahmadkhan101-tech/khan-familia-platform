import type { NextFunction, Request, Response } from 'express';

import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { AuthenticatedRequest, TenantRequest } from '../../shared/types/request.js';
import {
  acceptTenantInvite as acceptTenantInviteService,
  createTenantInvite as createTenantInviteService,
  listTenantInvites as listTenantInvitesService,
  revokeTenantInvite as revokeTenantInviteService,
} from './invite.service.js';
import type { AcceptInviteBody, CreateInviteBody } from './schemas.js';

export const acceptTenantInvite = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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
    const tenant = await acceptTenantInviteService(authReq.userId, user.email, body.token);
    res.status(200).json({ tenant });
  } catch (err) {
    next(err);
  }
};

export const createTenantInvite = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const { tenantId } = req.params as { tenantId: string };
    const invite = await createTenantInviteService(
      tenantId,
      tenantReq.userId,
      req.body as CreateInviteBody,
    );
    res.status(201).json(invite);
  } catch (err) {
    next(err);
  }
};

export const listTenantInvites = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { tenantId } = req.params as { tenantId: string };
    const invites = await listTenantInvitesService(tenantId);
    res.status(200).json({ invites });
  } catch (err) {
    next(err);
  }
};

export const revokeTenantInvite = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { tenantId, inviteId } = req.params as { tenantId: string; inviteId: string };
    const invite = await revokeTenantInviteService(tenantId, inviteId);
    res.status(200).json(invite);
  } catch (err) {
    next(err);
  }
};
