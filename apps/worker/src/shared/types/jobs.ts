// ============================================================================
// Job Type Definitions (Mirror API definitions)
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

export interface InventoryHorizonJobPayload {
  propertyId: string;
}

export type JobPayload =
  | BookingExpiryJobPayload
  | NotificationJobPayload
  | InventoryHorizonJobPayload;

export const QUEUE_NAMES = {
  BOOKING_EXPIRY: 'booking-expiry',
  NOTIFICATIONS: 'notifications',
  INVENTORY_HORIZON: 'inventory-horizon',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
