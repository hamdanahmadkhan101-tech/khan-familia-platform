import { prisma } from '../infrastructure/database/client.js';
import { logger } from '../logger.js';

const HOLD_SWEEP_INTERVAL_MS = 30_000;

export const sweepExpiredHolds = async (): Promise<void> => {
  const expiredHolds = await prisma.propertyHold.findMany({
    where: { expiresAt: { lt: new Date() } },
    orderBy: { expiresAt: 'asc' },
  });

  if (expiredHolds.length > 0) {
    logger.info({ count: expiredHolds.length }, 'Found expired holds to sweep');
  }

  for (const hold of expiredHolds) {
    try {
      const released = await prisma.$transaction(async (tx) => {
        const claimed = await tx.propertyHold.deleteMany({
          where: {
            id: hold.id,
            expiresAt: { lt: new Date() },
          },
        });

        if (claimed.count === 0) {
          return false;
        }

        const inventoryRows = await tx.unitInventory.findMany({
          where: {
            tenantId: hold.tenantId,
            unitTypeId: hold.unitTypeId,
            date: { gte: hold.startDate, lte: hold.endDate },
          },
          select: { id: true },
        });

        if (inventoryRows.length === 0) {
          throw new Error(`No inventory rows found for expired hold ${hold.id}`);
        }

        const releasedInventory = await tx.unitInventory.updateMany({
          where: {
            id: { in: inventoryRows.map((row) => row.id) },
            bookedCount: { gte: hold.quantity },
          },
          data: {
            bookedCount: { decrement: hold.quantity },
            availableCount: { increment: hold.quantity },
            version: { increment: 1 },
          },
        });

        if (releasedInventory.count !== inventoryRows.length) {
          throw new Error(`Could not release every inventory row for expired hold ${hold.id}`);
        }

        return true;
      });

      if (released) {
        logger.info({ holdToken: hold.holdToken }, 'Successfully released expired hold');
      }
    } catch (err) {
      logger.error({ err, holdToken: hold.holdToken }, 'Failed to release expired hold');
    }
  }
};

export const startHoldSweepInterval = (): ReturnType<typeof setInterval> => {
  logger.info('Starting expired hold sweeper (runs every 30 seconds)');

  sweepExpiredHolds().catch((err) => {
    logger.error({ err }, 'Initial hold sweep failed');
  });

  return setInterval(() => {
    sweepExpiredHolds().catch((err) => {
      logger.error({ err }, 'Sweep interval error');
    });
  }, HOLD_SWEEP_INTERVAL_MS);
};
