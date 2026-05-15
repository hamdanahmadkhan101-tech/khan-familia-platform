import { logger } from './logger.js';
import { startWorker } from './runtime.js';

startWorker().catch((error) => {
  logger.error({ err: error }, 'Worker crashed');
  process.exit(1);
});
