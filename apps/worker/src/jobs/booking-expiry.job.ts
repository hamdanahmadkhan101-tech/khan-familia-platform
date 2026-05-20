import { releaseReservedInventoryForStay } from '@khan-familia/database';

import { logger } from '../logger.js';
import { prisma, type Prisma } from '../infrastructure/database/client.js';
import type { BookingExpiryJobPayload } from '../shared/types/jobs.js';

/**
 * Handle booking expiry: cancel PENDING booking and release reserved inventory.
 */
export const handleBookingExpiryJob = async (payload: BookingExpiryJobPayload) => {
  logger.info({ bookingId: payload.bookingId }, 'Processing booking expiry job');

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const booking = await tx.accommodationBooking.findUnique({
        where: { id: payload.bookingId },
        select: {
          id: true,
          status: true,
          propertyId: true,
          unitTypeId: true,
          checkIn: true,
          checkOut: true,
        },
      });

      if (!booking) {
        logger.warn({ bookingId: payload.bookingId }, 'Booking not found during expiry');
        return;
      }

      if (booking.status !== 'PENDING') {
        logger.info(
          { bookingId: payload.bookingId, status: booking.status },
          'Booking already processed, skipping expiry',
        );
        return;
      }

      await tx.accommodationBooking.update({
        where: { id: payload.bookingId },
        data: { status: 'CANCELLED', cancellationDate: new Date() },
      });

      if (booking.unitTypeId) {
        await releaseReservedInventoryForStay(tx, {
          propertyId: booking.propertyId,
          unitTypeId: booking.unitTypeId,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
        });
      }

      logger.info({ bookingId: payload.bookingId }, 'Booking expiry handled successfully');
    });
  } catch (error) {
    logger.error({ bookingId: payload.bookingId, err: error }, 'Failed to process booking expiry');
    throw error;
  }
};
