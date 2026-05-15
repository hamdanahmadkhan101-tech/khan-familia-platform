import { env } from './env.js';
import { jobs } from './jobs/registry.js';
import { runJobs } from './jobs/runner.js';
import { logger } from './logger.js';

export const startWorker = async () => {
  logger.info(
    {
      appEnv: env.APP_ENV,
      worker: env.WORKER_NAME,
    },
    'Worker started',
  );

  await runJobs(jobs, logger);
};
