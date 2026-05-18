import type { ConnectionOptions } from 'bullmq';

import { redis } from '../cache/redis.js';

// ============================================================================
// Job Type Definitions
// ============================================================================

export interface BookingExpiryJobPayload {
  bookingId: string;
  holdExpiresAt: string;
}

export interface NotificationJobPayload {
  type: 'email';
  userId: string;
  template: string;
  data: Record<string, unknown>;
}

export type JobPayload = BookingExpiryJobPayload | NotificationJobPayload;

// ============================================================================
// Queue Definitions
// ============================================================================

export const QUEUE_NAMES = {
  BOOKING_EXPIRY: 'booking-expiry',
  NOTIFICATIONS: 'notifications',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ============================================================================
// Queue Configuration
// ============================================================================

export const getQueueConfig = (name: QueueName) => {
  const connectionOptions: ConnectionOptions = {
    host: redis.options.host || 'localhost',
    port: redis.options.port || 6379,
    ...(redis.options.password ? { password: redis.options.password } : {}),
  };

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
