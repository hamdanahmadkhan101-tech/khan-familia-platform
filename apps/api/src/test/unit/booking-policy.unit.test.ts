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
          new Date('2026-06-25T00:00:00.000Z'),
          new Date('2026-06-27T00:00:00.000Z'),
          new Date('2026-06-26T12:00:00.000Z'),
        ),
      'BAD_REQUEST',
      'startDate must be today or a future date',
    );
  });

  it('allows hold dates that start today or later', () => {
    expect(() =>
      assertHoldDatesAllowed(
        new Date('2026-06-26T00:00:00.000Z'),
        new Date('2026-06-28T00:00:00.000Z'),
        new Date('2026-06-26T12:00:00.000Z'),
      ),
    ).not.toThrow();
  });

  it('rejects hold dates where checkout is before checkin', () => {
    expectAppError(
      () =>
        assertHoldDatesAllowed(
          new Date('2026-06-28T00:00:00.000Z'),
          new Date('2026-06-27T00:00:00.000Z'),
          new Date('2026-06-26T12:00:00.000Z'),
        ),
      'BAD_REQUEST',
      'endDate must be greater than or equal to startDate',
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
      'Booking cannot be cancelled from CHECKED_IN status',
    );

    expectAppError(
      () => assertGuestCanCancelBookingStatus('CANCELLED'),
      'CONFLICT',
      'Booking is already cancelled',
    );
  });
});
