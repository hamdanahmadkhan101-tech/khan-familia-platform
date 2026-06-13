import type { Prisma } from '@khan-familia/database';
import { prisma } from '../../infrastructure/database/client.js';

export const getAvailabilityForProperty = async (
  tenantId: string,
  propertyId: string,
  startDate: Date,
  endDate: Date,
  unitTypeId?: string,
) => {
  const whereClause: Prisma.UnitInventoryWhereInput = {
    tenantId,
    propertyId,
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (unitTypeId) {
    whereClause.unitTypeId = unitTypeId;
  }

  const inventory = await prisma.unitInventory.findMany({
    where: whereClause,
    orderBy: [{ date: 'asc' }, { unitTypeId: 'asc' }],
    select: {
      id: true,
      unitTypeId: true,
      date: true,
      totalCount: true,
      availableCount: true,
      bookedCount: true,
      blockedCount: true,
      priceOverride: true,
      blockReason: true,
    },
  });

  return inventory;
};
