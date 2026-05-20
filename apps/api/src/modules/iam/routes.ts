import { Router, type RequestHandler } from 'express';

import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../../shared/errors/AppError.js';
import { authenticateRequired } from '../../shared/middleware/authenticate.js';
import { resolveInternalUser } from '../../shared/middleware/resolve-user.js';
import type { AuthenticatedRequest } from '../../shared/types/request.js';

export const iamRouter = Router();

const requireAuth = authenticateRequired as RequestHandler;
const attachUser = resolveInternalUser as RequestHandler;

iamRouter.get('/me', requireAuth, attachUser, async (req, res, next) => {
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
});
