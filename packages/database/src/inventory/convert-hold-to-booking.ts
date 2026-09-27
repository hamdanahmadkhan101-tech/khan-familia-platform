import type { Prisma } from '@prisma/client';

export type ConvertHoldToBookingParams = {
  propertyId: string;
  unitTypeId: string;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  quantity: number;
};

import { requireTenantId } from '../repositories/tenant-scoped.js';

export const convertHoldToBookingInventory = async (
  tx: Prisma.TransactionClient,
  params: ConvertHoldToBookingParams,
): Promise<void> => {
  requireTenantId(params.tenantId);
  const inventoryRows = await tx.unitInventory.findMany({
    where: {
      tenantId: params.tenantId,
      propertyId: params.propertyId,
      unitTypeId: params.unitTypeId,
      date: { gte: params.startDate, lt: params.endDate },
    },
    select: { id: true },
    orderBy: { date: 'asc' },
  });

  if (inventoryRows.length === 0) {
    throw new Error(
      `No inventory rows found for hold conversion on property=${params.propertyId} unitType=${params.unitTypeId}`,
    );
  }

  let convertedCount = 0;
  for (const row of inventoryRows) {
    const updated = await tx.unitInventory.updateMany({
      where: {
        id: row.id,
        heldCount: { gte: params.quantity },
      },
      data: {
        heldCount: { decrement: params.quantity },
        bookedCount: { increment: params.quantity },
        version: { increment: 1 },
      },
    });
    convertedCount += updated.count;
  }

  if (convertedCount !== inventoryRows.length) {
    throw new Error(
      `Could not convert all inventory rows (converted=${convertedCount}, expected=${inventoryRows.length})`,
    );
  }
};
