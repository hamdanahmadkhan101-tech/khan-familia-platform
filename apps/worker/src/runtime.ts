import { SERVICE_NAMES, QUEUE_NAMES } from '@khan-familia/constants';

import { env } from './env.js';
import { scheduleHoldCleanup } from './jobs/registry.js';
import { logger } from './logger.js';
import { redis } from './infrastructure/cache/redis.js';
import {
  registerProcessor,
  startWorker as startQueueWorker,
} from './infrastructure/queue/consumer.js';
import { handleHoldExpiryJob } from './jobs/hold-expiry.job.js';
import { handleNotificationJob } from './jobs/notification.job.js';
import { handleInventoryHorizonQueueJob } from './jobs/inventory-horizon.job.js';
import { handleHoldCleanupCronJob } from './jobs/hold-cleanup.job.js';

export const startWorker = async () => {
  logger.info(
    {
      appEnv: env.APP_ENV,
      service: SERVICE_NAMES.worker,
    },
    'Worker started',
  );

  // Register BullMQ processors
  registerProcessor(QUEUE_NAMES.HOLD_EXPIRY, handleHoldExpiryJob);
  registerProcessor(QUEUE_NAMES.NOTIFICATIONS, handleNotificationJob);
  registerProcessor(QUEUE_NAMES.INVENTORY_HORIZON, handleInventoryHorizonQueueJob);

  // Register hold-cleanup processor — triggered by the BullMQ repeatable job scheduler
  registerProcessor(QUEUE_NAMES.HOLD_CLEANUP, async () => {
    await handleHoldCleanupCronJob();
  });

  // Start BullMQ workers (one per registered queue)
  logger.info('Starting BullMQ queue consumers');
  const queueWorkers = startQueueWorker();
  logger.info({ queuesCount: queueWorkers.length }, 'BullMQ queue consumers started successfully');

  // Schedule hold-cleanup as a BullMQ repeatable job (distributed, Redis-backed)
  // Returns the Queue instance so we can close it on shutdown
  const holdCleanupQueue = await scheduleHoldCleanup();

  // Register shutdown hooks for graceful shutdown
  let isShuttingDown = false;

  const shutdown = async () => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    logger.info('Shutting down worker...');

    // Close all BullMQ queue workers
    for (const w of queueWorkers) {
      await w.close();
    }

    // Close the scheduler queue instance
    await holdCleanupQueue.close();

    // Close the shared Redis connection (was missing before — connection leak fix)
    await redis.quit();

    logger.info('Worker shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    void shutdown();
  });
  process.on('SIGINT', () => {
    void shutdown();
  });
};
