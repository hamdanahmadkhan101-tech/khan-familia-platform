// ============================================================================
// Booking Constants
// ============================================================================

export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_OUT: 'CHECKED_OUT',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

/**
 * How long a pending booking hold lasts before automatic expiry (in minutes).
 * Default: 30 minutes for credit card bookings, 60 minutes for escrow/bank transfer.
 */
export const BOOKING_HOLD_MINUTES = 30;

/**
 * Payment status values.
 */
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  AUTHORIZED: 'AUTHORIZED',
  CAPTURED: 'CAPTURED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

/**
 * Inventory state for a unit on a given date.
 */
export const INVENTORY_STATE = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  BLOCKED: 'blocked',
} as const;

export type InventoryState = (typeof INVENTORY_STATE)[keyof typeof INVENTORY_STATE];
