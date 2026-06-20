import type { AccommodationBookingStatus, Prisma } from '@khan-familia/database';

import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { CancelGuestBookingBody, GuestBookingListQuery } from '@khan-familia/validation';

const terminalGuestCancellationStatuses: AccommodationBookingStatus[] = [
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
  'NO_SHOW',
];

const bookingSelect = {
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
  booking: Pick<BookingDto, 'propertyId' | 'unitTypeId' | 'checkIn' | 'checkOut' | 'guests'>,
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

    if (booking.status === 'CANCELLED') {
      throw AppError.conflict('Booking is already cancelled');
    }

    if (terminalGuestCancellationStatuses.includes(booking.status)) {
      throw AppError.conflict(`Booking cannot be cancelled from ${booking.status} status`);
    }

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
