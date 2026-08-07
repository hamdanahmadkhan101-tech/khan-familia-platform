import type { AccommodationBookingStatus, CancellationPolicyType } from '@khan-familia/database';
import { differenceInDays } from '@khan-familia/utils';

import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../../shared/errors/AppError.js';
import { assertValidTransition } from './booking-state-machine.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const toDateOnlyString = (date: Date): string => date.toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Hold date validation
// ---------------------------------------------------------------------------

export const assertHoldDatesAllowed = (startDate: Date, endDate: Date, now = new Date()) => {
  const start = toDateOnlyString(startDate);
  const end = toDateOnlyString(endDate);
  const today = toDateOnlyString(now);

  if (start < today) {
    throw AppError.badRequest('startDate must be today or a future date', {
      startDate: 'startDate must be today or a future date',
    });
  }

  if (end <= start) {
    throw AppError.badRequest('endDate must be greater than startDate', {
      endDate: 'endDate must be greater than startDate',
    });
  }
};

// ---------------------------------------------------------------------------
// Self-booking prevention
// ---------------------------------------------------------------------------

export const assertGuestCanCreateHoldForTenant = (input: { isTenantStaff: boolean }) => {
  if (input.isTenantStaff) {
    throw AppError.forbidden(
      'Staff cannot book their own properties as a guest. Please use the Block Inventory feature instead.',
    );
  }
};

// ---------------------------------------------------------------------------
// Cancellation status validation
// ---------------------------------------------------------------------------

export const assertGuestCanCancelBookingStatus = (status: AccommodationBookingStatus) => {
  if (status === 'CANCELLED') {
    throw AppError.conflict('Booking is already cancelled');
  }

  assertValidTransition(status, 'CANCELLED');
};

// ---------------------------------------------------------------------------
// Default refund percentages per policy type — used when no rules are defined
// ---------------------------------------------------------------------------

const DEFAULT_REFUND_PERCENTAGES: Record<CancellationPolicyType, number> = {
  FLEXIBLE: 100,
  MODERATE: 50,
  STRICT: 0,
  NON_REFUNDABLE: 0,
};

// ---------------------------------------------------------------------------
// Cancellation policy enforcement — refund calculation
// ---------------------------------------------------------------------------

export type RefundCalculation = {
  refundAmountMinor: number;
  refundPercentage: number;
  policyType: CancellationPolicyType;
  daysBeforeCheckIn: number;
};

/**
 * Calculate the refund amount for a booking cancellation based on the
 * property's cancellation policy.
 *
 * Algorithm:
 * 1. Load the property's CancellationPolicy and its rules.
 * 2. If no policy exists, default to FLEXIBLE (100% refund).
 * 3. Compute `daysBeforeCheckIn` = difference between checkIn and now.
 * 4. Sort rules ascending by `daysBeforeCheckIn` threshold.
 * 5. Find the applicable rule: the rule with the highest threshold that
 *    is ≤ actual daysBeforeCheckIn. If no rule matches, use the policy
 *    type's default refund percentage.
 * 6. Return refund amount = totalMinor × (refundPercentage / 100).
 */
export const calculateRefundAmount = async (
  propertyId: string,
  checkIn: Date,
  totalMinor: number,
  now = new Date(),
): Promise<RefundCalculation> => {
  const policy = await prisma.cancellationPolicy.findUnique({
    where: { propertyId },
    select: {
      policyType: true,
      rules: {
        select: { daysBeforeCheckIn: true, refundPercentage: true },
        orderBy: { daysBeforeCheckIn: 'asc' },
      },
    },
  });

  const daysBeforeCheckIn = Math.max(0, differenceInDays(checkIn, now));

  // No policy configured — default to FLEXIBLE (full refund)
  if (!policy) {
    return {
      refundAmountMinor: totalMinor,
      refundPercentage: 100,
      policyType: 'FLEXIBLE',
      daysBeforeCheckIn,
    };
  }

  let refundPercentage: number;

  if (policy.rules.length === 0) {
    // Policy exists but no rules — use the policy type default
    refundPercentage = DEFAULT_REFUND_PERCENTAGES[policy.policyType];
  } else {
    // Find the applicable rule: highest threshold ≤ actual days before check-in
    const applicableRule = policy.rules
      .filter((rule) => daysBeforeCheckIn >= rule.daysBeforeCheckIn)
      .at(-1); // Last match after ascending sort = highest matching threshold

    refundPercentage = applicableRule ? applicableRule.refundPercentage : 0; // If guest cancels closer than the earliest rule threshold, no refund
  }

  const refundAmountMinor = Math.round(totalMinor * (refundPercentage / 100));

  return {
    refundAmountMinor,
    refundPercentage,
    policyType: policy.policyType,
    daysBeforeCheckIn,
  };
};
