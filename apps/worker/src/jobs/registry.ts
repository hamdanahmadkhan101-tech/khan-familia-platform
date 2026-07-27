import type { Logger } from 'pino';
import { handleInventoryHorizonCronJob } from './inventory-horizon.job.js';
import { handleHoldCleanupCronJob } from './hold-cleanup.job.js';

export type JobContext = {
  logger: Logger;
};

export type JobDefinition = {
  name: string;
  run: (context: JobContext) => Promise<void> | void;
};

export const jobs: JobDefinition[] = [
  {
    name: 'inventory-horizon',
    run: async () => {
      await handleInventoryHorizonCronJob();
    },
  },
  {
    name: 'hold-cleanup',
    run: async () => {
      // Loop this job every 5 minutes within the continuous worker process
      setInterval(
        () => {
          handleHoldCleanupCronJob().catch((err) => console.error(err));
        },
        5 * 60 * 1000,
      );

      // Run once immediately on startup
      await handleHoldCleanupCronJob();
    },
  },
];
