import { getBullMqConnectionOptions } from '../cache/redis.js';

import type { QueueName } from '@khan-familia/constants';

// ============================================================================
// Queue Configuration
// ============================================================================

export const getQueueConfig = (name: QueueName) => {
  const connectionOptions = getBullMqConnectionOptions();

  return {
    name,
    connection: connectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
    },
  };
};
