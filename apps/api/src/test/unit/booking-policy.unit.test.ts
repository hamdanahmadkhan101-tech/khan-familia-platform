import { addDays } from 'date-fns';
import { describe, expect, it } from 'vitest';

import { AppError } from '../../shared/errors/AppError.js';
import {
  assertGuestCanCancelBookingStatus,
  assertGuestCanCreateHoldForTenant,
  assertHoldDatesAllowed,
} from '../../modules/booking/booking-policy.service.js';

const expectAppError = (fn: () => void, code: string, message: string) => {
  expect(fn).toThrow(AppError);

  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(code);
    expect((error as AppError).message).toBe(message);
  }
};

describe('booking policy service', () => {
  it('rejects hold dates that start before today', () => {
    expectAppError(
      () =>
        assertHoldDatesAllowed(
          addDays(new Date(), 10),
          addDays(new Date(), 12),
          addDays(new Date(), 11),
        ),
      'BAD_REQUEST',
      'startDate must be today or a future date',
    );
  });

  it('allows hold dates that start today or later', () => {
    expect(() =>
      assertHoldDatesAllowed(
        addDays(new Date(), 11),
        addDays(new Date(), 13),
        addDays(new Date(), 11),
      ),
    ).not.toThrow();
  });

  it('rejects hold dates where checkout is before checkin', () => {
    expectAppError(
      () =>
        assertHoldDatesAllowed(
          addDays(new Date(), 13),
          addDays(new Date(), 12),
          addDays(new Date(), 11),
        ),
      'BAD_REQUEST',
      'endDate must be greater than startDate',
    );
  });

  it('blocks tenant staff from creating guest holds for their own tenant', () => {
    expectAppError(
      () => assertGuestCanCreateHoldForTenant({ isTenantStaff: true }),
      'FORBIDDEN',
      'Staff cannot book their own properties as a guest. Please use the Block Inventory feature instead.',
    );
  });

  it('rejects guest cancellation from terminal booking states', () => {
    expectAppError(
      () => assertGuestCanCancelBookingStatus('CHECKED_IN'),
      'CONFLICT',
      'Cannot transition booking from CHECKED_IN to CANCELLED',
    );

    expectAppError(
      () => assertGuestCanCancelBookingStatus('CANCELLED'),
      'CONFLICT',
      'Booking is already cancelled',
    );
  });
});
