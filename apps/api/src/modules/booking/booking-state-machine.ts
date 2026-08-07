import type { AccommodationBookingStatus } from '@khan-familia/database';
import { AppError } from '../../shared/errors/AppError.js';

const VALID_TRANSITIONS: Record<AccommodationBookingStatus, AccommodationBookingStatus[]> = {
  PENDING: ['BOOKED', 'CANCELLED'],
  BOOKED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
  CHECKED_IN: ['CHECKED_OUT'],
  CHECKED_OUT: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export const assertValidTransition = (
  currentStatus: AccommodationBookingStatus,
  targetStatus: AccommodationBookingStatus,
): void => {
  const validTargets = VALID_TRANSITIONS[currentStatus];
  if (!validTargets || !validTargets.includes(targetStatus)) {
    throw AppError.conflict(`Cannot transition booking from ${currentStatus} to ${targetStatus}`);
  }
};

export const isTerminalStatus = (status: AccommodationBookingStatus): boolean => {
  return VALID_TRANSITIONS[status]?.length === 0;
};
