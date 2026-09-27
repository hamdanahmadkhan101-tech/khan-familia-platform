import type { Prisma } from '@khan-familia/database';
import { differenceInDays } from '@khan-familia/utils';
import { logger } from '../../logger.js';

import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../../shared/errors/AppError.js';
import { acquireHold, releaseHold, getHold } from '../inventory/inventory.service.js';
import {
  assertGuestCanCancelBookingStatus,
  assertGuestCanCreateHoldForTenant,
  assertHoldDatesAllowed,
  calculateRefundAmount,
} from './booking-policy.service.js';
import type {
  CancelGuestBookingBody,
  CreateHoldBody,
  GuestBookingListQuery,
  RejectBookingBody,
} from '@khan-familia/validation';
import {
  cancelPaymentIntent,
  capturePaymentIntent,
  refundPaymentIntent,
} from '../payments/payment.service.js';
import { assertValidTransition } from './booking-state-machine.js';
import { bookingSelect } from './booking.selectors.js';

type BookingDto = Prisma.AccommodationBookingGetPayload<{ select: typeof bookingSelect }>;

const listOrderBy = (
  scope: GuestBookingListQuery['scope'],
): Prisma.AccommodationBookingOrderByWithRelationInput[] => {
  if (scope === 'past') {
    return [{ checkOut: 'desc' }, { createdAt: 'desc' }];
  }

  return [{ checkIn: 'asc' }, { createdAt: 'desc' }];
};

const listWhere = (
  userId: string,
  query: GuestBookingListQuery,
): Prisma.AccommodationBookingWhereInput => {
  const now = new Date();
  const where: Prisma.AccommodationBookingWhereInput = { userId };

  if (query.status) {
    where.status = query.status;
  }

  if (query.scope === 'upcoming') {
    where.checkOut = { gte: now };
    where.status = { notIn: ['CANCELLED', 'NO_SHOW'] };
  }

  if (query.scope === 'past') {
    where.OR = [{ checkOut: { lt: now } }, { status: { in: ['CANCELLED', 'NO_SHOW'] } }];
  }

  if (query.scope === 'cancelled') {
    where.status = 'CANCELLED';
  }

  return where;
};

const attachPayments = async <T extends BookingDto>(booking: T) => {
  const paymentIntents = await prisma.paymentIntent.findMany({
    where: { accommodationBookingId: booking.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      amount: true,
      currency: true,
      provider: true,
      status: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      records: {
        select: {
          id: true,
          transactionId: true,
          amountCaptured: true,
          currency: true,
          status: true,
          paymentMethod: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      refunds: {
        select: {
          id: true,
          amount: true,
          reason: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return { ...booking, paymentIntents };
};

export const createGuestHold = async (userId: string, input: CreateHoldBody) => {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  assertHoldDatesAllowed(startDate, endDate);

  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: { tenantId: true },
  });

  if (!property) {
    throw AppError.notFound('Property not found');
  }

  const unitType = await prisma.unitType.findUnique({
    where: { id: input.unitTypeId },
    select: { capacity: true },
  });

  if (!unitType) {
    throw AppError.notFound('Unit Type not found');
  }

  const requestedGuests = input.guestDetails?.length || input.quantity;
  if (unitType.capacity !== null && requestedGuests > unitType.capacity * input.quantity) {
    throw AppError.badRequest('Requested guest count exceeds unit capacity');
  }

  const tenantMembership = await prisma.tenantUser.findFirst({
    where: { tenantId: property.tenantId, userId },
    select: { userId: true },
  });

  assertGuestCanCreateHoldForTenant({ isTenantStaff: Boolean(tenantMembership) });

  return acquireHold(
    userId,
    property.tenantId,
    input.propertyId,
    input.unitTypeId,
    startDate,
    endDate,
    input.quantity,
    input.guestDetails,
    input.specialNeeds,
    input.idempotencyKey,
  );
};

export const releaseGuestHold = async (holdToken: string, userId: string) => {
  await releaseHold(holdToken, userId);
};

export const getGuestHold = async (holdToken: string, userId: string) => {
  return await getHold(holdToken, userId);
};

export const listGuestBookings = async (userId: string, query: GuestBookingListQuery) => {
  const bookings = await prisma.accommodationBooking.findMany({
    where: listWhere(userId, query),
    select: bookingSelect,
    orderBy: listOrderBy(query.scope),
    take: query.limit,
    skip: query.offset,
  });

  return bookings;
};

export const getGuestBookingById = async (userId: string, bookingId: string) => {
  const booking = await prisma.accommodationBooking.findFirst({
    where: { id: bookingId, userId },
    select: bookingSelect,
  });

  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  return attachPayments(booking);
};

const releaseBookedInventory = async (
  tx: Prisma.TransactionClient,
  booking: Pick<
    BookingDto,
    'id' | 'propertyId' | 'unitTypeId' | 'checkIn' | 'checkOut' | 'unitQuantity'
  >,
) => {
  if (!booking.unitTypeId) {
    return;
  }

  const inventoryRows = await tx.unitInventory.findMany({
    where: {
      propertyId: booking.propertyId,
      unitTypeId: booking.unitTypeId,
      date: { gte: booking.checkIn, lt: booking.checkOut },
    },
    select: { id: true },
    orderBy: { date: 'asc' },
  });

  const expectedNights = differenceInDays(booking.checkOut, booking.checkIn);
  if (inventoryRows.length !== expectedNights) {
    throw AppError.conflict(
      'Inventory rows found do not match the expected night count for booking cancellation',
    );
  }

  await tx.reservation.deleteMany({
    where: { bookingId: booking.id },
  });

  let releasedCount = 0;
  for (const row of inventoryRows) {
    const updated = await tx.unitInventory.updateMany({
      where: {
        id: row.id,
        bookedCount: { gte: booking.unitQuantity },
      },
      data: {
        bookedCount: { decrement: booking.unitQuantity },
        availableCount: { increment: booking.unitQuantity },
        version: { increment: 1 },
      },
    });
    releasedCount += updated.count;
  }

  if (releasedCount !== inventoryRows.length) {
    throw AppError.conflict('Could not release every inventory row for this booking');
  }
};

export const cancelGuestBooking = async (
  userId: string,
  bookingId: string,
  input: CancelGuestBookingBody,
) => {
  // Phase 1: Validate and cancel booking + release inventory (in transaction)
  const {
    cancelled,
    previousStatus,
    propertyId,
    checkIn,
    paymentIntentId,
    gatewayIntentId,
    capturedAmount,
  } = await prisma.$transaction(
    async (tx) => {
      const booking = await tx.accommodationBooking.findFirst({
        where: { id: bookingId, userId },
        select: bookingSelect,
      });

      if (!booking) {
        throw AppError.notFound('Booking not found');
      }

      assertGuestCanCancelBookingStatus(booking.status);

      await releaseBookedInventory(tx, booking);

      const resultCount = await tx.accommodationBooking.updateMany({
        where: { id: booking.id, status: booking.status, tenantId: booking.tenantId },
        data: {
          status: 'CANCELLED',
          cancellationReason: input.reason,
          cancellationDate: new Date(),
        },
      });
      if (resultCount.count === 0) throw AppError.conflict('Booking was modified concurrently');
      const updated = (await tx.accommodationBooking.findUnique({
        where: { id: booking.id },
        select: bookingSelect,
      }))!;

      await tx.accommodationBookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          oldStatus: booking.status,
          newStatus: 'CANCELLED',
          changedById: userId,
          reason: input.reason,
        },
      });

      // Look up payment intent for Stripe operations
      const paymentIntent = await tx.paymentIntent.findFirst({
        where: { accommodationBookingId: booking.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, amount: true },
      });

      return {
        cancelled: updated,
        previousStatus: booking.status,
        propertyId: booking.propertyId,
        checkIn: booking.checkIn,
        paymentIntentId: paymentIntent?.id ?? null,
        gatewayIntentId: paymentIntent?.id ?? null,
        capturedAmount: paymentIntent?.amount ?? 0,
      };
    },
    { timeout: 15000 },
  );

  // Phase 2: Handle Stripe payment cancellation/refund OUTSIDE transaction
  if (paymentIntentId && gatewayIntentId) {
    try {
      if (previousStatus === 'BOOKED') {
        // Payment was authorized but not captured — cancel the authorization
        await cancelPaymentIntent(paymentIntentId);
        await prisma.paymentIntent.update({
          where: { id: paymentIntentId },
          data: { status: 'CANCELLED' },
        });
      } else if (previousStatus === 'CONFIRMED') {
        // Payment was captured — calculate refund based on cancellation policy
        const { refundAmountMinor: refundAmount } = await calculateRefundAmount(
          propertyId,
          checkIn,
          capturedAmount,
        );
        await refundPaymentIntent(
          paymentIntentId,
          refundAmount,
          input.reason ?? 'Guest cancellation',
        );
        await prisma.$transaction(
          async (tx) => {
            await tx.refund.create({
              data: {
                paymentIntentId,
                amount: refundAmount,
                reason: input.reason ?? 'Guest cancellation',
                status: 'REFUNDED',
              },
            });
            await tx.paymentIntent.update({
              where: { id: paymentIntentId },
              data: { status: 'REFUNDED' },
            });
            await tx.accommodationBooking.update({
              where: { id: cancelled.id },
              data: { refundAmount },
            });
          },
          { timeout: 15000 },
        );
      }
    } catch (error) {
      // Log but don't throw — the booking is already cancelled in our DB
      // The payment team can reconcile manually if Stripe call fails
      logger.error({ err: error }, 'Failed to process Stripe cancellation/refund');
    }
  }

  return attachPayments(cancelled);
};

export const approveGuestBooking = async (tenantId: string, bookingId: string, userId: string) => {
  // Phase 1: Validate state and fetch the payment record (short read, no external calls).
  const { booking, paymentRecord } = await prisma.$transaction(
    async (tx) => {
      const booking = await tx.accommodationBooking.findFirst({
        where: { id: bookingId, tenantId },
        select: bookingSelect,
      });

      if (!booking) {
        throw AppError.notFound('Booking not found');
      }

      assertValidTransition(booking.status, 'CONFIRMED');

      const paymentRecord = await tx.paymentRecord.findFirst({
        where: { paymentIntent: { accommodationBookingId: booking.id } },
        orderBy: { createdAt: 'desc' },
      });

      if (!paymentRecord?.paymentIntentId) {
        throw AppError.internal('Payment intent not found for booking');
      }

      return { booking, paymentRecord };
    },
    { timeout: 15000 },
  );

  // Phase 2: Call payment gateway OUTSIDE the transaction. Network latency must not
  // block a DB connection. If this throws, the booking stays BOOKED (safe).
  await capturePaymentIntent(paymentRecord.paymentIntentId);

  // Phase 3: Write the confirmed state now that Stripe has settled.
  const updated = await prisma.$transaction(
    async (tx) => {
      const resultCount = await tx.accommodationBooking.updateMany({
        where: { id: booking.id, status: booking.status, tenantId: booking.tenantId },
        data: { status: 'CONFIRMED' },
      });
      if (resultCount.count === 0) throw AppError.conflict('Booking was modified concurrently');
      const result = (await tx.accommodationBooking.findUnique({
        where: { id: booking.id },
        select: bookingSelect,
      }))!;

      await tx.accommodationBookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          oldStatus: booking.status,
          newStatus: 'CONFIRMED',
          changedById: userId,
          reason: 'Host approved booking',
        },
      });

      return result;
    },
    { timeout: 15000 },
  );

  return attachPayments(updated);
};

export const rejectGuestBooking = async (
  tenantId: string,
  bookingId: string,
  userId: string,
  input: RejectBookingBody,
) => {
  // Phase 1: Validate state and fetch payment record.
  const { booking, paymentRecord } = await prisma.$transaction(
    async (tx) => {
      const booking = await tx.accommodationBooking.findFirst({
        where: { id: bookingId, tenantId },
        select: bookingSelect,
      });

      if (!booking) {
        throw AppError.notFound('Booking not found');
      }

      assertValidTransition(booking.status, 'CANCELLED');

      const paymentRecord = await tx.paymentRecord.findFirst({
        where: { paymentIntent: { accommodationBookingId: booking.id } },
        orderBy: { createdAt: 'desc' },
      });

      return { booking, paymentRecord };
    },
    { timeout: 15000 },
  );

  // Phase 2: Cancel the authorization OUTSIDE the transaction.
  // If this fails, the booking stays BOOKED and no DB state is corrupted.
  if (paymentRecord?.paymentIntentId) {
    await cancelPaymentIntent(paymentRecord.paymentIntentId);
  }

  // Phase 3: Release inventory and write the cancelled state.
  const cancelled = await prisma.$transaction(
    async (tx) => {
      // Release the inventory slots that were held for this booking.
      await releaseBookedInventory(tx, booking);

      const resultCount = await tx.accommodationBooking.updateMany({
        where: { id: booking.id, status: booking.status, tenantId: booking.tenantId },
        data: {
          status: 'CANCELLED',
          cancellationReason: input.reason,
          cancellationDate: new Date(),
        },
      });
      if (resultCount.count === 0) throw AppError.conflict('Booking was modified concurrently');
      const updated = (await tx.accommodationBooking.findUnique({
        where: { id: booking.id },
        select: bookingSelect,
      }))!;

      await tx.accommodationBookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          oldStatus: booking.status,
          newStatus: 'CANCELLED',
          changedById: userId,
          reason: input.reason,
        },
      });

      return updated;
    },
    { timeout: 15000 },
  );

  return attachPayments(cancelled);
};

export const checkInBooking = async (tenantId: string, bookingId: string, userId: string) => {
  // Phase 1: Validate state
  const booking = await prisma.accommodationBooking.findFirst({
    where: { id: bookingId, tenantId },
    select: bookingSelect,
  });
  if (!booking) throw AppError.notFound('Booking not found');
  assertValidTransition(booking.status, 'CHECKED_IN');

  // Phase 2: Update
  const updated = await prisma.$transaction(async (tx) => {
    const resultCount = await tx.accommodationBooking.updateMany({
      where: { id: booking.id, status: booking.status, tenantId: booking.tenantId },
      data: { status: 'CHECKED_IN', checkedInAt: new Date(), checkedInById: userId },
    });
    if (resultCount.count === 0) throw AppError.conflict('Booking was modified concurrently');
    const result = (await tx.accommodationBooking.findUnique({
      where: { id: booking.id },
      select: bookingSelect,
    }))!;
    await tx.accommodationBookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        oldStatus: booking.status,
        newStatus: 'CHECKED_IN',
        changedById: userId,
        reason: 'Guest checked in',
      },
    });
    return result;
  });
  return attachPayments(updated);
};

export const checkOutBooking = async (tenantId: string, bookingId: string, userId: string) => {
  // Phase 1: Validate state
  const booking = await prisma.accommodationBooking.findFirst({
    where: { id: bookingId, tenantId },
    select: bookingSelect,
  });
  if (!booking) throw AppError.notFound('Booking not found');
  assertValidTransition(booking.status, 'CHECKED_OUT');

  // Phase 2: Update
  const updated = await prisma.$transaction(async (tx) => {
    const resultCount = await tx.accommodationBooking.updateMany({
      where: { id: booking.id, status: booking.status, tenantId: booking.tenantId },
      data: { status: 'CHECKED_OUT', checkedOutAt: new Date(), checkedOutById: userId },
    });
    if (resultCount.count === 0) throw AppError.conflict('Booking was modified concurrently');
    const result = (await tx.accommodationBooking.findUnique({
      where: { id: booking.id },
      select: bookingSelect,
    }))!;
    await tx.accommodationBookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        oldStatus: booking.status,
        newStatus: 'CHECKED_OUT',
        changedById: userId,
        reason: 'Guest checked out',
      },
    });
    return result;
  });
  return attachPayments(updated);
};

export const markNoShow = async (tenantId: string, bookingId: string, userId: string) => {
  // Phase 1: Validate state
  const booking = await prisma.accommodationBooking.findFirst({
    where: { id: bookingId, tenantId },
    select: bookingSelect,
  });
  if (!booking) throw AppError.notFound('Booking not found');
  assertValidTransition(booking.status, 'NO_SHOW');

  // Phase 2: Update
  const updated = await prisma.$transaction(async (tx) => {
    const resultCount = await tx.accommodationBooking.updateMany({
      where: { id: booking.id, status: booking.status, tenantId: booking.tenantId },
      data: { status: 'NO_SHOW' },
    });
    if (resultCount.count === 0) throw AppError.conflict('Booking was modified concurrently');
    const result = (await tx.accommodationBooking.findUnique({
      where: { id: booking.id },
      select: bookingSelect,
    }))!;
    await tx.accommodationBookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        oldStatus: booking.status,
        newStatus: 'NO_SHOW',
        changedById: userId,
        reason: 'Guest no-show',
      },
    });
    return result;
  });
  return attachPayments(updated);
};
