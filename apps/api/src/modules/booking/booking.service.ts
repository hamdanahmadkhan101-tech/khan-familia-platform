import type { Prisma } from '@khan-familia/database';

import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../../shared/errors/AppError.js';
import { acquireHold, releaseHold } from '../inventory/inventory.service.js';
import {
  assertGuestCanCancelBookingStatus,
  assertGuestCanCreateHoldForTenant,
  assertHoldDatesAllowed,
} from './booking-policy.service.js';
import type {
  CancelGuestBookingBody,
  CreateHoldBody,
  GuestBookingListQuery,
  RejectBookingBody,
} from '@khan-familia/validation';
import {
  cancelStripePaymentIntent,
  captureStripePaymentIntent,
} from '../payments/payment.service.js';

export const bookingSelect = {
  id: true,
  userId: true,
  tenantId: true,
  propertyId: true,
  unitTypeId: true,
  channel: true,
  checkIn: true,
  checkOut: true,
  nights: true,
  guests: true,
  status: true,
  confirmedAt: true,
  checkedInAt: true,
  checkedOutAt: true,
  cancellationReason: true,
  cancellationDate: true,
  refundAmount: true,
  contactName: true,
  contactEmail: true,
  contactPhone: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  property: {
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      country: true,
      address: true,
      images: true,
      checkInTime: true,
      checkOutTime: true,
      timezone: true,
    },
  },
  unitType: {
    select: {
      id: true,
      name: true,
      capacity: true,
      defaultRate: true,
      images: true,
    },
  },
  BookingPriceSnapshot: {
    select: {
      id: true,
      currency: true,
      totalMinor: true,
      breakdown: true,
      createdAt: true,
    },
  },
  guestDetails: {
    select: {
      id: true,
      name: true,
      age: true,
      idType: true,
      idNumber: true,
    },
    orderBy: { id: 'asc' },
  },
  specialRequests: {
    select: {
      id: true,
      text: true,
    },
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.AccommodationBookingSelect;

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
    where: { bookingId: booking.id },
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

export const createGuestHold = async (
  userId: string,
  input: CreateHoldBody,
  idempotencyKey?: string,
) => {
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
    idempotencyKey,
  );
};

export const releaseGuestHold = async (holdToken: string, userId: string) => {
  await releaseHold(holdToken, userId);
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
  booking: Pick<BookingDto, 'id' | 'propertyId' | 'unitTypeId' | 'checkIn' | 'checkOut' | 'guests'>,
) => {
  if (!booking.unitTypeId) {
    return;
  }

  const inventoryRows = await tx.unitInventory.findMany({
    where: {
      propertyId: booking.propertyId,
      unitTypeId: booking.unitTypeId,
      date: { gte: booking.checkIn, lte: booking.checkOut },
    },
    select: { id: true },
  });

  if (inventoryRows.length === 0) {
    throw AppError.conflict('No inventory rows found for booking cancellation');
  }

  await tx.reservation.deleteMany({
    where: { bookingId: booking.id },
  });

  const released = await tx.unitInventory.updateMany({
    where: {
      id: { in: inventoryRows.map((row) => row.id) },
      bookedCount: { gte: booking.guests },
    },
    data: {
      bookedCount: { decrement: booking.guests },
      availableCount: { increment: booking.guests },
      version: { increment: 1 },
    },
  });

  if (released.count !== inventoryRows.length) {
    throw AppError.conflict('Could not release every inventory row for this booking');
  }
};

export const cancelGuestBooking = async (
  userId: string,
  bookingId: string,
  input: CancelGuestBookingBody,
) => {
  const cancelled = await prisma.$transaction(async (tx) => {
    const booking = await tx.accommodationBooking.findFirst({
      where: { id: bookingId, userId },
      select: bookingSelect,
    });

    if (!booking) {
      throw AppError.notFound('Booking not found');
    }

    assertGuestCanCancelBookingStatus(booking.status);

    await releaseBookedInventory(tx, booking);

    const updated = await tx.accommodationBooking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
        cancellationReason: input.reason,
        cancellationDate: new Date(),
      },
      select: bookingSelect,
    });

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
  });

  return attachPayments(cancelled);
};

export const approveGuestBooking = async (tenantId: string, bookingId: string, userId: string) => {
  // Phase 1: Validate state and fetch the payment record (short read, no external calls).
  const { booking, paymentRecord } = await prisma.$transaction(async (tx) => {
    const booking = await tx.accommodationBooking.findFirst({
      where: { id: bookingId, tenantId },
      select: bookingSelect,
    });

    if (!booking) {
      throw AppError.notFound('Booking not found');
    }

    if (booking.status !== 'BOOKED') {
      throw AppError.conflict('Only BOOKED status can be approved');
    }

    const paymentRecord = await tx.paymentRecord.findFirst({
      where: { paymentIntent: { bookingId: booking.id } },
      orderBy: { createdAt: 'desc' },
    });

    if (!paymentRecord?.paymentIntentId) {
      throw AppError.internal('Payment intent not found for booking');
    }

    return { booking, paymentRecord };
  });

  // Phase 2: Call Stripe OUTSIDE the transaction. Network latency must not
  // block a DB connection. If this throws, the booking stays BOOKED (safe).
  await captureStripePaymentIntent(paymentRecord.paymentIntentId);

  // Phase 3: Write the confirmed state now that Stripe has settled.
  const updated = await prisma.accommodationBooking.update({
    where: { id: booking.id },
    data: { status: 'CONFIRMED' },
    select: bookingSelect,
  });

  await prisma.accommodationBookingStatusHistory.create({
    data: {
      bookingId: booking.id,
      oldStatus: booking.status,
      newStatus: 'CONFIRMED',
      changedById: userId,
      reason: 'Host approved booking',
    },
  });

  return attachPayments(updated);
};

export const rejectGuestBooking = async (
  tenantId: string,
  bookingId: string,
  userId: string,
  input: RejectBookingBody,
) => {
  // Phase 1: Validate state and fetch payment record.
  const { booking, paymentRecord } = await prisma.$transaction(async (tx) => {
    const booking = await tx.accommodationBooking.findFirst({
      where: { id: bookingId, tenantId },
      select: bookingSelect,
    });

    if (!booking) {
      throw AppError.notFound('Booking not found');
    }

    if (booking.status !== 'BOOKED') {
      throw AppError.conflict('Only BOOKED status can be rejected');
    }

    const paymentRecord = await tx.paymentRecord.findFirst({
      where: { paymentIntent: { bookingId: booking.id } },
      orderBy: { createdAt: 'desc' },
    });

    return { booking, paymentRecord };
  });

  // Phase 2: Cancel the Stripe authorization OUTSIDE the transaction.
  // If this fails, the booking stays BOOKED and no DB state is corrupted.
  if (paymentRecord?.paymentIntentId) {
    await cancelStripePaymentIntent(paymentRecord.paymentIntentId);
  }

  // Phase 3: Release inventory and write the cancelled state.
  const cancelled = await prisma.$transaction(async (tx) => {
    // Release the inventory slots that were held for this booking.
    await releaseBookedInventory(tx, booking);

    const updated = await tx.accommodationBooking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
        cancellationReason: input.reason,
        cancellationDate: new Date(),
      },
      select: bookingSelect,
    });

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
  });

  return attachPayments(cancelled);
};
