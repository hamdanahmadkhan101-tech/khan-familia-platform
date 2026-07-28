import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '@khan-familia/constants';

import { getBullMqConnectionOptions } from '../infrastructure/cache/redis.js';
import { logger } from '../logger.js';

/**
 * Schedules the hold-cleanup sweep as a BullMQ repeatable job.
 *
 * Using BullMQ's job scheduler (backed by Redis) instead of setInterval ensures
 * that in a horizontally-scaled deployment only ONE worker pod picks up and
 * executes the sweep at any given interval — preventing duplicated DB load.
 *
 * The scheduler upserts the schedule on every boot (idempotent), so restarting
 * worker pods does not create duplicate schedules.
 *
 * Returns the Queue instance so runtime.ts can close it during graceful shutdown.
 */
export const scheduleHoldCleanup = async (): Promise<Queue> => {
  const queue = new Queue(QUEUE_NAMES.HOLD_CLEANUP, {
    connection: getBullMqConnectionOptions(),
  });

  await queue.upsertJobScheduler(
    'hold-cleanup-every-5m',
    { every: 5 * 60 * 1000 }, // every 5 minutes
    {
      name: QUEUE_NAMES.HOLD_CLEANUP,
      opts: { removeOnComplete: 10, removeOnFail: 20 },
    },
  );

  logger.info('Hold-cleanup repeatable job scheduled via BullMQ (every 5 minutes)');

  return queue;
};
