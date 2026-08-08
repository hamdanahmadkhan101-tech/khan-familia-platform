import type { Job } from 'bullmq';
import { releaseHoldInventory } from '@khan-familia/database';
import { logger } from '../logger.js';
import { prisma } from '../infrastructure/database/client.js';
import type { HoldExpiryJobPayload } from '@khan-familia/types';

/**
 * Handle hold expiry: release unpaid property holds.
 */
export const handleHoldExpiryJob = async (
  payload: HoldExpiryJobPayload,
  job?: Job<HoldExpiryJobPayload>,
) => {
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
      const now = new Date();
      if (hold.expiresAt > now) {
        const remainingDelay = hold.expiresAt.getTime() - now.getTime();
        if (job) {
          logger.warn(
            { holdId: payload.holdId, remainingDelayMs: remainingDelay },
            'Hold expiry job ran before expiration time. Re-enqueueing.',
          );
          await job.moveToDelayed(Date.now() + remainingDelay, job.token);
        } else {
          logger.warn(
            { holdId: payload.holdId, remainingDelayMs: remainingDelay },
            'Hold cleanup found unexpired hold. Skipping.',
          );
        }
        return false;
      }

      // Atomically delete the hold to prevent race conditions with Stripe webhooks
      const deleteResult = await tx.propertyHold.deleteMany({
        where: { id: payload.holdId },
      });

      if (deleteResult.count === 0) {
        logger.info(
          { holdId: payload.holdId },
          'Hold was concurrently processed (e.g. converted to booking). Skipping inventory release.',
        );
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
