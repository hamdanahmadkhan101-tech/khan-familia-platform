import { releaseHoldInventory } from '@khan-familia/database';
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

      await releaseHoldInventory(tx, {
        tenantId: hold.tenantId,
        propertyId: hold.propertyId,
        unitTypeId: hold.unitTypeId,
        startDate: hold.startDate,
        endDate: hold.endDate,
        quantity: hold.quantity,
      });

      await tx.propertyHold.delete({
        where: { id: payload.holdId },
      });

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
