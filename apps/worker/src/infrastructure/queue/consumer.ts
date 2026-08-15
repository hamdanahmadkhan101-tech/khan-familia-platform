import type { Worker as BullWorker, Job } from 'bullmq';
import { Worker } from 'bullmq';

import { getBullMqConnectionOptions } from '../cache/redis.js';
import { logger } from '../../logger.js';

/**
 * Simple job processor registry for the worker.
 */
export type JobProcessor<T = unknown> = (payload: T, job: Job<T>) => Promise<void>;

const processors = new Map<string, JobProcessor>();

/**
 * Register a job processor for a queue.
 */
export const registerProcessor = <T>(queueName: string, processor: JobProcessor<T>) => {
  processors.set(queueName, processor as JobProcessor);
};

/**
 * Start consuming jobs from all registered queues.
 */
export const startWorker = (): BullWorker[] => {
  const workers: BullWorker[] = [];
  const connectionOptions = getBullMqConnectionOptions();

  for (const [queueName, processor] of processors.entries()) {
    const worker = new Worker(queueName, async (job) => processor(job.data, job), {
      connection: connectionOptions,
      concurrency: 5,
      stalledInterval: 300000, // 5 minutes
      maxStalledCount: 1,
      removeOnComplete: { count: 1000, age: 3600 },
      removeOnFail: { count: 5000 },
    });

    worker.on('failed', (job, err) => {
      logger.error({ queueName, jobId: job?.id, err }, 'Job failed');
    });

    workers.push(worker);
  }

  return workers;
};

/**
 * Cleanup: Close all worker connections.
 */
export const stopWorker = async (workers: BullWorker[]) => {
  for (const worker of workers) {
    await worker.close();
  }
};
