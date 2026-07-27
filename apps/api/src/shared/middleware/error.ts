import type { NextFunction, Request, Response } from 'express';

import { logger } from '../../logger.js';
import { isAppError } from '../errors/AppError.js';

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response | void => {
  void _next;

  logger.error({ err: error, code: isAppError(error) ? error.code : 'UNKNOWN' }, 'Request error');

  if (error.name === 'PrismaClientKnownRequestError' && 'code' in error && error.code === 'P2002') {
    return res.status(409).json({
      error: {
        message: 'Resource already exists or request is currently processing.',
        code: 'CONFLICT',
        statusCode: 409,
      },
    });
  }

  if (isAppError(error)) {
    return res.status(error.statusCode).json(error.toJSON());
  }

  // Fallback for unexpected errors
  return res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    },
  });
};
