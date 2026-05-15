import type { NextFunction, Request, Response } from 'express';

import { logger } from '../logger.js';

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  void _next;
  logger.error({ err: error }, 'Unhandled error');
  res.status(500).json({ message: 'Internal Server Error' });
};
