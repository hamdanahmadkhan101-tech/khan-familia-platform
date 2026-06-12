import type { NextFunction, Request, Response } from 'express';

import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { AuthenticatedRequest } from '../../shared/types/request.js';

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      throw AppError.unauthorized('User context required');
    }

    const user = await prisma.user.findUnique({
      where: { id: authReq.userId },
      select: {
        id: true,
        clerkId: true,
        username: true,
        email: true,
        avatarUrl: true,
        phone: true,
        role: true,
        status: true,
        defaultTenantId: true,
        preferredCurrency: true,
        preferredLanguage: true,
        preferredTimezone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};
