import { logger } from '../logger.js';
import { prisma } from '../infrastructure/database/client.js';
import { handleHoldExpiryJob } from './hold-expiry.job.js';

/**
 * Fallback Cron Job: Scans the database for any expired PropertyHolds
 * that the queue worker missed or dropped, and releases them.
 */
export const handleHoldCleanupCronJob = async (): Promise<void> => {
  logger.info('Starting fallback hold cleanup cron job');

  try {
    const expiredHolds = await prisma.propertyHold.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
      select: {
        id: true,
        holdToken: true,
        expiresAt: true,
      },
    });

    if (expiredHolds.length === 0) {
      logger.info('No orphaned expired holds found');
      return;
    }

    logger.info({ expiredCount: expiredHolds.length }, 'Found orphaned expired holds to clean up');

    for (const hold of expiredHolds) {
      try {
        await handleHoldExpiryJob({
          holdId: hold.id,
          holdToken: hold.holdToken,
          holdExpiresAt: hold.expiresAt.toISOString(),
        });
      } catch (error) {
        logger.error(
          { holdId: hold.id, err: error },
          'Failed to clean up expired hold during cron sweep',
        );
      }
    }

    logger.info('Completed fallback hold cleanup cron job');
  } catch (error) {
    logger.error({ err: error }, 'Fallback hold cleanup cron job crashed');
    throw error;
  }
};
