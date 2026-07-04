import { Queue } from 'bullmq';
import { calculateDelayMs } from '@khan-familia/utils';

import { getBullMqConnectionOptions } from '../cache/redis.js';
import { QUEUE_NAMES, type QueueName } from '@khan-familia/constants';
import type { HoldExpiryJobPayload, NotificationJobPayload } from '@khan-familia/types';

// ============================================================================
// Queue Instances (Lazy Initialization)
// ============================================================================

const queueCache = new Map<QueueName, Queue>();

const getQueue = (name: QueueName): Queue => {
  if (!queueCache.has(name)) {
    queueCache.set(
      name,
      new Queue(name, {
        connection: getBullMqConnectionOptions(),
        defaultJobOptions: {
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      }),
    );
  }

  return queueCache.get(name)!;
};

// ============================================================================
// Job Enqueueing Functions
// ============================================================================

export const enqueueHoldExpiryJob = async (payload: HoldExpiryJobPayload) => {
  const queue = getQueue(QUEUE_NAMES.HOLD_EXPIRY);
  return queue.add(`hold-expiry-${payload.holdId}`, payload, {
    delay: calculateDelayMs(new Date(payload.holdExpiresAt)),
  });
};

export const enqueueNotificationJob = async (payload: NotificationJobPayload) => {
  const queue = getQueue(QUEUE_NAMES.NOTIFICATIONS);
  return queue.add(`notification-${payload.userId}`, payload, {
    priority: payload.type === 'email' ? 5 : 1,
  });
};

export const enqueueInventoryHorizonJob = async (propertyId: string) => {
  const queue = getQueue(QUEUE_NAMES.INVENTORY_HORIZON);
  return queue.add(`inventory-horizon-${propertyId}`, { propertyId });
};

/**
 * Cleanup: Close all queue connections.
 */
export const closeQueues = async () => {
  for (const queue of queueCache.values()) {
    await queue.close();
  }
  queueCache.clear();
};
