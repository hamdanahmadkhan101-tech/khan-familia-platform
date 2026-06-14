import type { NextFunction, Request, Response } from 'express';
import { z } from '@khan-familia/validation';

import { AppError } from '../errors/AppError.js';

/**
 * Middleware factory to validate and parse JSON body with Zod schema.
 */
export const validateBody = <T extends z.ZodTypeAny>(schema: T) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsedBody = await schema.parseAsync(req.body);
      Object.defineProperty(req, 'body', {
        value: parsedBody,
        configurable: true,
        enumerable: true,
        writable: true,
      });
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
      const parsedQuery = await schema.parseAsync(req.query);
      Object.defineProperty(req, 'query', {
        value: parsedQuery,
        configurable: true,
        enumerable: true,
        writable: true,
      });
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
      const parsedParams = await schema.parseAsync(req.params);
      Object.defineProperty(req, 'params', {
        value: parsedParams,
        configurable: true,
        enumerable: true,
        writable: true,
      });
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
