import { Queue, type ConnectionOptions } from 'bullmq';

import { redis } from '../cache/redis.js';
import {
  QUEUE_NAMES,
  type BookingExpiryJobPayload,
  type NotificationJobPayload,
  type QueueName,
} from './queues.js';

// ============================================================================
// Queue Instances (Lazy Initialization)
// ============================================================================

const queueCache = new Map<QueueName, Queue>();

const getQueue = (name: QueueName): Queue => {
  if (!queueCache.has(name)) {
    const connectionOptions: ConnectionOptions = {
      host: redis.options.host || 'localhost',
      port: redis.options.port || 6379,
      ...(redis.options.password ? { password: redis.options.password } : {}),
    };

    queueCache.set(
      name,
      new Queue(name, {
        connection: connectionOptions,
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
    delay: new Date(payload.holdExpiresAt).getTime() - Date.now(),
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
