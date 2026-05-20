/**
 * Booking and payment enums — sourced from Prisma to avoid drift with schema.prisma.
 */
import {
  AccommodationBookingStatus,
  BookingChannel,
  BookingType,
  PaymentStatus,
} from '@khan-familia/database';

export const BOOKING_STATUS = AccommodationBookingStatus;
export type BookingStatus = AccommodationBookingStatus;

export const PAYMENT_STATUS = PaymentStatus;
export type PaymentStatusValue = PaymentStatus;

export const BOOKING_CHANNEL = BookingChannel;
export type BookingChannelValue = BookingChannel;

export const BOOKING_TYPE = BookingType;
export type BookingTypeValue = BookingType;

/**
 * How long a pending booking hold lasts before automatic expiry (in minutes).
 */
export const BOOKING_HOLD_MINUTES = 30;

/**
 * Application-level inventory bucket labels (not Prisma enums).
 */
export const INVENTORY_STATE = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  BLOCKED: 'blocked',
} as const;

export type InventoryState = (typeof INVENTORY_STATE)[keyof typeof INVENTORY_STATE];
