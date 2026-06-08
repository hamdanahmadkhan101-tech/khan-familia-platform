import type { Logger } from 'pino';
import { handleInventoryHorizonCronJob } from './inventory-horizon.job.js';

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
];
