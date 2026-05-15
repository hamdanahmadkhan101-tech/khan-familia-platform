import { Router } from 'express';

import { SERVICE_NAMES } from '@khan-familia/constants';
import type { HealthStatus } from '@khan-familia/types';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const payload: HealthStatus = {
    status: 'ok',
    service: SERVICE_NAMES.api,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(payload);
});
