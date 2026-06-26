import type { AccommodationBookingStatus } from '@khan-familia/database';

import { AppError } from '../../shared/errors/AppError.js';

const terminalGuestCancellationStatuses: AccommodationBookingStatus[] = [
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
  'NO_SHOW',
];

const toDateOnlyString = (date: Date): string => date.toISOString().slice(0, 10);

export const assertHoldDatesAllowed = (startDate: Date, endDate: Date, now = new Date()) => {
  const start = toDateOnlyString(startDate);
  const end = toDateOnlyString(endDate);
  const today = toDateOnlyString(now);

  if (start < today) {
    throw AppError.badRequest('startDate must be today or a future date', {
      startDate: 'startDate must be today or a future date',
    });
  }

  if (end < start) {
    throw AppError.badRequest('endDate must be greater than or equal to startDate', {
      endDate: 'endDate must be greater than or equal to startDate',
    });
  }
};

export const assertGuestCanCreateHoldForTenant = (input: { isTenantStaff: boolean }) => {
  if (input.isTenantStaff) {
    throw AppError.forbidden(
      'Staff cannot book their own properties as a guest. Please use the Block Inventory feature instead.',
    );
  }
};

export const assertGuestCanCancelBookingStatus = (status: AccommodationBookingStatus) => {
  if (status === 'CANCELLED') {
    throw AppError.conflict('Booking is already cancelled');
  }

  if (terminalGuestCancellationStatuses.includes(status)) {
    throw AppError.conflict(`Booking cannot be cancelled from ${status} status`);
  }
};
