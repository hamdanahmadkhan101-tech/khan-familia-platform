import type { NextFunction, Response } from 'express';

import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../errors/AppError.js';
import type { AuthenticatedRequest } from '../types/request.js';

/**
 * Maps Clerk `auth.sub` to the internal `User.id` (cuid).
 * Must run after authenticateRequired (or authenticateOptional when a token is present).
 */
export const resolveInternalUser = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.auth?.sub) {
    throw AppError.unauthorized('Authentication required');
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: req.auth.sub },
    select: { id: true, status: true, isDeleted: true },
  });

  if (!user || user.isDeleted) {
    throw AppError.unauthorized('User account not found');
  }

  if (user.status !== 'ACTIVE') {
    throw AppError.forbidden('User account is not active');
  }

  req.userId = user.id;
  req.clerkId = req.auth.sub;
  next();
};
