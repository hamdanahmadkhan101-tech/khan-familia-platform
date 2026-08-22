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
    let lastId: string | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      const query: import('@khan-familia/database').Prisma.PropertyHoldFindManyArgs = {
        where: {
          expiresAt: { lt: new Date() },
        },
        select: {
          id: true,
          holdToken: true,
          expiresAt: true,
        },
        take: 100,
        orderBy: { id: 'asc' },
      };

      if (lastId) {
        query.where!.id = { gt: lastId };
      }

      const holds = (await prisma.propertyHold.findMany(query)) as Array<{
        id: string;
        holdToken: string;
        expiresAt: Date;
      }>;

      if (holds.length === 0) {
        hasMore = false;
        break;
      }

      logger.info({ batchSize: holds.length }, 'Processing batch of orphaned expired holds');

      for (const hold of holds) {
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

      lastId = holds[holds.length - 1]?.id;
      if (holds.length < 100) {
        hasMore = false;
      }
    }

    logger.info('Completed fallback hold cleanup cron job');
  } catch (error) {
    logger.error({ err: error }, 'Fallback hold cleanup cron job crashed');
    throw error;
  }
};
