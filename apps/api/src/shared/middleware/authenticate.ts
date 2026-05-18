import type { NextFunction } from 'express';
import { verifyToken } from '@clerk/express';

import { env } from '../../env.js';
import { AppError } from '../errors/AppError.js';
import type { AuthenticatedRequest, AuthPayload } from '../types/request.js';

/**
 * Middleware to verify Clerk JWT and attach auth payload to request.
 * Optional by default; use `requireAuth()` for protected routes.
 */
export const authenticateOptional = async (
  req: AuthenticatedRequest,
  _res: unknown,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next();
    }

    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });

    (req as AuthenticatedRequest).auth = {
      ...payload,
      sub: payload.sub as string,
    } as AuthPayload;

    next();
  } catch {
    // If verification fails, continue without auth (optional flow)
    next();
  }
};

/**
 * Middleware to require Clerk JWT authentication.
 */
export const authenticateRequired = async (
  req: AuthenticatedRequest,
  _res: unknown,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw AppError.unauthorized('Missing authorization token');
    }

    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });

    (req as AuthenticatedRequest).auth = {
      ...payload,
      sub: payload.sub as string,
    } as AuthPayload;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw AppError.unauthorized('Invalid or expired token');
  }
};
