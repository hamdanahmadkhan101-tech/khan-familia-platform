import { logger } from '../logger.js';
import { prisma } from '../infrastructure/database/client.js';
import type { HoldExpiryJobPayload } from '@khan-familia/types';

/**
 * Handle hold expiry: release unpaid property holds.
 */
export const handleHoldExpiryJob = async (payload: HoldExpiryJobPayload) => {
  logger.info({ holdId: payload.holdId }, 'Processing hold expiry job');

  try {
    const released = await prisma.$transaction(async (tx) => {
      const hold = await tx.propertyHold.findUnique({
        where: { id: payload.holdId },
      });

      if (!hold) {
        logger.info({ holdId: payload.holdId }, 'Hold no longer exists, already processed or paid');
        return false;
      }

      // We explicitly check if it expired, just in case job fired early or delayed
      if (hold.expiresAt >= new Date()) {
        logger.warn({ holdId: payload.holdId }, 'Hold expiry job ran before expiration time');
        return false;
      }

      const deleted = await tx.propertyHold.delete({
        where: { id: payload.holdId },
      });

      const inventoryRows = await tx.unitInventory.findMany({
        where: {
          tenantId: deleted.tenantId,
          unitTypeId: deleted.unitTypeId,
          date: { gte: deleted.startDate, lt: deleted.endDate },
        },
        select: { id: true },
      });

      if (inventoryRows.length === 0) {
        throw new Error(`No inventory rows found for expired hold ${deleted.id}`);
      }

      const releasedInventory = await tx.unitInventory.updateMany({
        where: {
          id: { in: inventoryRows.map((row) => row.id) },
          bookedCount: { gte: deleted.quantity },
        },
        data: {
          bookedCount: { decrement: deleted.quantity },
          availableCount: { increment: deleted.quantity },
          version: { increment: 1 },
        },
      });

      if (releasedInventory.count !== inventoryRows.length) {
        throw new Error(`Could not release every inventory row for expired hold ${deleted.id}`);
      }

      return true;
    });

    if (released) {
      logger.info(
        { holdId: payload.holdId },
        'Hold expiry handled successfully, inventory released',
      );
    }
  } catch (error) {
    logger.error({ holdId: payload.holdId, err: error }, 'Failed to process hold expiry');
    throw error;
  }
};
