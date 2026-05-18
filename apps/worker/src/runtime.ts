import { SERVICE_NAMES } from '@khan-familia/constants';

import { env } from './env.js';
import { jobs } from './jobs/registry.js';
import { runJobs } from './jobs/runner.js';
import { logger } from './logger.js';

export const startWorker = async () => {
  logger.info(
    {
      appEnv: env.APP_ENV,
      service: SERVICE_NAMES.worker,
    },
    'Worker started',
  );

  await runJobs(jobs, logger);
};
