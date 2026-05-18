import { logger } from '../logger.js';
import { prisma, type Prisma } from '../infrastructure/database/client.js';
import type { BookingExpiryJobPayload } from '../shared/types/jobs.js';

/**
 * Handle booking expiry: release hold and revert booking to CANCELLED.
 * Release inventory that was reserved during the hold period.
 */
export const handleBookingExpiryJob = async (payload: BookingExpiryJobPayload) => {
  logger.info({ bookingId: payload.bookingId }, 'Processing booking expiry job');

  try {
    // Transaction to atomically:
    // 1. Cancel booking if still PENDING
    // 2. Release reserved inventory
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const booking = await tx.booking.findUnique({
        where: { id: payload.bookingId },
        select: {
          id: true,
          status: true,
          propertyId: true,
          unitId: true,
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

      // Cancel the booking
      await tx.booking.update({
        where: { id: payload.bookingId },
        data: { status: 'CANCELLED', cancellationDate: new Date() },
      });

      // Release reserved inventory
      if (booking.unitTypeId) {
        const inventoryRecords = await tx.unitInventory.findMany({
          where: {
            propertyId: booking.propertyId,
            unitTypeId: booking.unitTypeId,
            date: {
              gte: booking.checkIn,
              lt: booking.checkOut,
            },
          },
        });

        for (const inv of inventoryRecords) {
          await tx.unitInventory.update({
            where: { id: inv.id },
            data: {
              bookedCount: Math.max(0, inv.bookedCount - 1),
              availableCount: inv.availableCount + 1,
            },
          });
        }
      }

      logger.info({ bookingId: payload.bookingId }, 'Booking expiry handled successfully');
    });
  } catch (error) {
    logger.error({ bookingId: payload.bookingId, err: error }, 'Failed to process booking expiry');
    throw error;
  }
};
