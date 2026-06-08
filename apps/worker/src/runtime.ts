import { SERVICE_NAMES } from '@khan-familia/constants';

import { env } from './env.js';
import { jobs } from './jobs/registry.js';
import { runJobs } from './jobs/runner.js';
import { logger } from './logger.js';
import {
  registerProcessor,
  startWorker as startQueueWorker,
} from './infrastructure/queue/consumer.js';
import { QUEUE_NAMES } from './shared/types/jobs.js';
import { handleBookingExpiryJob } from './jobs/booking-expiry.job.js';
import { handleNotificationJob } from './jobs/notification.job.js';
import { handleInventoryHorizonQueueJob } from './jobs/inventory-horizon.job.js';

export const startWorker = async () => {
  logger.info(
    {
      appEnv: env.APP_ENV,
      service: SERVICE_NAMES.worker,
    },
    'Worker started',
  );

  // Register BullMQ processors
  registerProcessor(QUEUE_NAMES.BOOKING_EXPIRY, handleBookingExpiryJob);
  registerProcessor(QUEUE_NAMES.NOTIFICATIONS, handleNotificationJob);
  registerProcessor(QUEUE_NAMES.INVENTORY_HORIZON, handleInventoryHorizonQueueJob);

  // Start BullMQ workers
  logger.info('Starting BullMQ queue consumers');
  const queueWorkers = await startQueueWorker();
  logger.info({ queuesCount: queueWorkers.length }, 'BullMQ queue consumers started successfully');

  // Run scheduler jobs
  await runJobs(jobs, logger);

  // Register shutdown hooks for graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down worker...');
    for (const w of queueWorkers) {
      await w.close();
    }
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};
