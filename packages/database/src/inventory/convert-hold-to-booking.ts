import type { Prisma } from '@prisma/client';

export type ConvertHoldToBookingParams = {
  propertyId: string;
  unitTypeId: string;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  quantity: number;
};

export const convertHoldToBookingInventory = async (
  tx: Prisma.TransactionClient,
  params: ConvertHoldToBookingParams,
): Promise<void> => {
  const inventoryRows = await tx.unitInventory.findMany({
    where: {
      tenantId: params.tenantId,
      propertyId: params.propertyId,
      unitTypeId: params.unitTypeId,
      date: { gte: params.startDate, lt: params.endDate },
    },
    select: { id: true },
  });

  if (inventoryRows.length === 0) {
    throw new Error(
      `No inventory rows found for hold conversion on property=${params.propertyId} unitType=${params.unitTypeId}`,
    );
  }

  const converted = await tx.unitInventory.updateMany({
    where: {
      id: { in: inventoryRows.map((row) => row.id) },
      heldCount: { gte: params.quantity },
    },
    data: {
      heldCount: { decrement: params.quantity },
      bookedCount: { increment: params.quantity },
      version: { increment: 1 },
    },
  });

  if (converted.count !== inventoryRows.length) {
    throw new Error(
      `Could not convert all inventory rows (converted=${converted.count}, expected=${inventoryRows.length})`,
    );
  }
};
