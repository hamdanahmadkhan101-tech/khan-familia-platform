import type { NextFunction, Response } from 'express';
import { UserStatus, type PlatformRole } from '@khan-familia/database';

import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../errors/AppError.js';
import type { AuthenticatedRequest } from '../types/request.js';

export const requirePlatformRole =
  (...allowed: PlatformRole[]) =>
  async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.userId) {
      throw AppError.unauthorized('User context required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true, status: true, isDeleted: true },
    });

    if (!user || user.isDeleted) {
      throw AppError.unauthorized('User not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw AppError.forbidden('User account is not active');
    }

    if (!allowed.includes(user.role)) {
      throw AppError.forbidden('Insufficient platform permissions');
    }

    next();
  };
