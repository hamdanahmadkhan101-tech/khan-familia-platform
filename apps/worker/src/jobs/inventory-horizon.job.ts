import type { Prisma } from '@khan-familia/database';

import { prisma } from '../infrastructure/database/client.js';
import { logger } from '../logger.js';
import type { InventoryHorizonJobPayload } from '../shared/types/jobs.js';

/**
 * Timezone-safe helper to generate a range of UTC midnight dates starting from today.
 */
const getDatesRange = (startDate: Date, days: number): Date[] => {
  const dates: Date[] = [];
  const start = new Date(
    Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()),
  );
  for (let i = 0; i < days; i++) {
    const next = new Date(start);
    next.setUTCDate(start.getUTCDate() + i);
    dates.push(next);
  }
  return dates;
};

/**
 * Core business transaction: generates calendar days for a single property up to its horizon.
 */
export const generateInventoryHorizonForProperty = async (
  propertyId: string,
  tx: Prisma.TransactionClient,
): Promise<void> => {
  const property = await tx.property.findFirst({
    where: { id: propertyId, isDeleted: false },
    select: {
      id: true,
      tenantId: true,
      approvalStatus: true,
      tenant: {
        select: {
          inventoryHorizonDays: true,
        },
      },
      unitTypes: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!property) {
    logger.warn({ propertyId }, 'Property not found during inventory horizon pre-population');
    return;
  }

  if (property.approvalStatus !== 'APPROVED') {
    logger.info(
      { propertyId, approvalStatus: property.approvalStatus },
      'Property is not approved, skipping inventory horizon pre-population',
    );
    return;
  }

  if (property.unitTypes.length === 0) {
    logger.info(
      { propertyId },
      'Property has no unit types configured, skipping inventory pre-population',
    );
    return;
  }

  const horizonDays = property.tenant.inventoryHorizonDays ?? 365;
  const dates = getDatesRange(new Date(), horizonDays);

  const inventoryRecords = [];
  for (const unitType of property.unitTypes) {
    for (const date of dates) {
      inventoryRecords.push({
        propertyId: property.id,
        unitTypeId: unitType.id,
        tenantId: property.tenantId,
        date,
        totalCount: 1,
        availableCount: 1,
        bookedCount: 0,
        blockedCount: 0,
      });
    }
  }

  logger.debug(
    {
      propertyId,
      unitTypesCount: property.unitTypes.length,
      horizonDays,
      recordsCount: inventoryRecords.length,
    },
    'Generating inventory horizon records',
  );

  const result = await tx.unitInventory.createMany({
    data: inventoryRecords,
    skipDuplicates: true,
  });

  logger.info(
    { propertyId, createdCount: result.count },
    'Successfully pre-populated/extended inventory horizon for property',
  );
};

/**
 * Periodic/Cron Job Processor: Scans all approved properties and extends their inventory horizons.
 */
export const handleInventoryHorizonCronJob = async (): Promise<void> => {
  logger.info('Starting inventory horizon extension cron job');

  try {
    const properties = await prisma.property.findMany({
      where: {
        approvalStatus: 'APPROVED',
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
      },
    });

    logger.info({ propertiesCount: properties.length }, 'Found approved properties to process');

    for (const property of properties) {
      try {
        await prisma.$transaction(async (tx) => {
          await generateInventoryHorizonForProperty(property.id, tx);
        });
      } catch (error) {
        logger.error(
          { propertyId: property.id, propertyName: property.name, err: error },
          'Failed to generate inventory horizon for property',
        );
      }
    }

    logger.info('Completed inventory horizon extension cron job');
  } catch (error) {
    logger.error({ err: error }, 'Inventory horizon extension cron job crashed');
    throw error;
  }
};

/**
 * Queue Consumer Processor: Processes single property horizon generation via queue events.
 */
export const handleInventoryHorizonQueueJob = async (
  payload: InventoryHorizonJobPayload,
): Promise<void> => {
  logger.info({ propertyId: payload.propertyId }, 'Processing inventory horizon queue job');

  try {
    await prisma.$transaction(async (tx) => {
      await generateInventoryHorizonForProperty(payload.propertyId, tx);
    });
  } catch (error) {
    logger.error(
      { propertyId: payload.propertyId, err: error },
      'Failed to process inventory horizon queue job',
    );
    throw error;
  }
};
