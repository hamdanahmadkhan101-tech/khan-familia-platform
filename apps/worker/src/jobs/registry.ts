import type { Logger } from 'pino';

export type JobContext = {
  logger: Logger;
};

export type JobDefinition = {
  name: string;
  run: (context: JobContext) => Promise<void> | void;
};

export const jobs: JobDefinition[] = [];
