import type { Prisma } from '@khan-familia/database';

import { prisma } from '../infrastructure/database/client.js';
import { logger } from '../logger.js';
import type { InventoryHorizonJobPayload } from '@khan-familia/types';

import { addDays, differenceInDays, startOfDay } from '@khan-familia/utils';

/**
 * Helper to generate a range of midnight dates starting from a given date.
 */
const getDatesRange = (startDate: Date, days: number): Date[] => {
  const dates: Date[] = [];
  const start = startOfDay(startDate);
  for (let i = 0; i < days; i++) {
    dates.push(addDays(start, i));
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
          unitCount: true,
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
  const today = startOfDay(new Date());
  const endHorizonDate = addDays(today, horizonDays);

  const inventoryRecords = [];
  for (const unitType of property.unitTypes) {
    const latestInventory = await tx.unitInventory.findFirst({
      where: { propertyId: property.id, unitTypeId: unitType.id },
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    let startDate = today;
    if (latestInventory) {
      startDate = addDays(startOfDay(latestInventory.date), 1);
    }

    const daysToGenerate = differenceInDays(endHorizonDate, startDate);

    if (daysToGenerate > 0) {
      const dates = getDatesRange(startDate, daysToGenerate);
      for (const date of dates) {
        inventoryRecords.push({
          propertyId: property.id,
          unitTypeId: unitType.id,
          tenantId: property.tenantId,
          date,
          totalCount: unitType.unitCount,
          availableCount: unitType.unitCount,
          bookedCount: 0,
          blockedCount: 0,
        });
      }
    }
  }

  if (inventoryRecords.length === 0) {
    logger.debug({ propertyId }, 'Inventory horizon already up to date. No new records needed.');
    return;
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
    let cursor: string | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      const query: import('@khan-familia/database').Prisma.PropertyFindManyArgs = {
        where: {
          approvalStatus: 'APPROVED',
          isDeleted: false,
        },
        select: {
          id: true,
          name: true,
        },
        take: 100,
        orderBy: { id: 'asc' },
      };

      if (cursor) {
        query.skip = 1;
        query.cursor = { id: cursor };
      }

      const properties = (await prisma.property.findMany(query)) as Array<{
        id: string;
        name: string;
      }>;

      if (properties.length === 0) {
        hasMore = false;
        break;
      }

      logger.info(
        { propertiesCount: properties.length },
        'Processing batch of approved properties',
      );

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

      cursor = properties[properties.length - 1]?.id;
      if (properties.length < 100) {
        hasMore = false;
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
