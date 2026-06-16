import { Queue } from 'bullmq';
import { calculateDelayMs } from '@khan-familia/utils';

import { getBullMqConnectionOptions } from '../cache/redis.js';
import { QUEUE_NAMES, type QueueName } from '@khan-familia/constants';
import type { BookingExpiryJobPayload, NotificationJobPayload } from '@khan-familia/types';

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
      }),
    );
  }

  return queueCache.get(name)!;
};

// ============================================================================
// Job Enqueueing Functions
// ============================================================================

export const enqueueBookingExpiryJob = async (payload: BookingExpiryJobPayload) => {
  const queue = getQueue(QUEUE_NAMES.BOOKING_EXPIRY);
  return queue.add(`booking-expiry-${payload.bookingId}`, payload, {
    delay: calculateDelayMs(new Date(payload.holdExpiresAt)),
  });
};

export const enqueueNotificationJob = async (payload: NotificationJobPayload) => {
  const queue = getQueue(QUEUE_NAMES.NOTIFICATIONS);
  return queue.add(`notification-${payload.userId}`, payload, {
    priority: payload.type === 'email' ? 5 : 1,
  });
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
