import pino from 'pino';
import type { NextFunction, Request, Response } from 'express';

import { SERVICE_NAMES } from '@khan-familia/constants';

import { env } from './env.js';

export const logger = pino({
  name: SERVICE_NAMES.api,
  level: env.LOG_LEVEL,
  base: { service: SERVICE_NAMES.api, appEnv: env.APP_ENV },
});

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;

    logger.info(
      {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
      },
      'request completed',
    );
  });

  next();
};
