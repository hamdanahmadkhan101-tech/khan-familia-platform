import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { AppError } from '../errors/AppError.js';

/**
 * Middleware factory to validate and parse JSON body with Zod schema.
 */
export const validateBody = <T extends z.ZodTypeAny>(schema: T) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.reduce(
          (acc, err) => {
            acc[err.path.join('.')] = err.message;
            return acc;
          },
          {} as Record<string, string>,
        );

        throw AppError.badRequest('Validation failed', details);
      }

      throw error;
    }
  };
};

/**
 * Middleware factory to validate and parse query parameters with Zod schema.
 */
export const validateQuery = <T extends z.ZodTypeAny>(schema: T) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.reduce(
          (acc, err) => {
            acc[err.path.join('.')] = err.message;
            return acc;
          },
          {} as Record<string, string>,
        );

        throw AppError.badRequest('Query validation failed', details);
      }

      throw error;
    }
  };
};

/**
 * Middleware factory to validate and parse path parameters with Zod schema.
 */
export const validateParams = <T extends z.ZodTypeAny>(schema: T) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.reduce(
          (acc, err) => {
            acc[err.path.join('.')] = err.message;
            return acc;
          },
          {} as Record<string, string>,
        );

        throw AppError.badRequest('Parameter validation failed', details);
      }

      throw error;
    }
  };
};
