import type { Response } from 'express';

import { isAppError } from '../errors/AppError.js';
import type { AppError } from '../errors/AppError.js';

export type ErrorResponse = {
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: Record<string, unknown>;
  };
};

export type SuccessResponse<T> = {
  data: T;
};

/**
 * Send a structured error response.
 */
export const sendError = (res: Response, error: AppError | Error): Response => {
  if (isAppError(error)) {
    return res.status(error.statusCode).json(error.toJSON());
  }

  return res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    },
  });
};

/**
 * Send a structured success response.
 */
export const sendSuccess = <T>(res: Response, data: T, statusCode = 200): Response => {
  return res.status(statusCode).json({ data });
};
