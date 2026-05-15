import pino from 'pino';

import { SERVICE_NAMES } from '@khan-familia/constants';
import type { ServiceName } from '@khan-familia/types';

import { env } from './env.js';

const serviceName: ServiceName = SERVICE_NAMES.worker;

export const logger = pino({
  name: env.WORKER_NAME,
  level: env.LOG_LEVEL,
  base: { service: serviceName, worker: env.WORKER_NAME },
});
