import type { Logger } from 'pino';

import type { JobDefinition } from './registry.js';

export const runJobs = async (jobs: JobDefinition[], logger: Logger) => {
  if (jobs.length === 0) {
    logger.info('No jobs registered. Worker idle.');
    return;
  }

  for (const job of jobs) {
    logger.info({ job: job.name }, 'Running job');

    try {
      await job.run({ logger });
      logger.info({ job: job.name }, 'Job completed');
    } catch (error) {
      logger.error({ err: error, job: job.name }, 'Job failed');
    }
  }
};
