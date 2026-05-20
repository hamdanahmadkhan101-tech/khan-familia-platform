import type { Prisma } from '@prisma/client';

const DEFAULT_MAX_RETRIES = 5;

export type ReleaseReservedInventoryParams = {
  propertyId: string;
  unitTypeId: string;
  checkIn: Date;
  checkOut: Date;
  /** Units to release per night row (MVP default: 1). */
  quantity?: number;
  maxRetries?: number;
};

/**
 * Releases inventory reserved for a stay window using optimistic locking on `UnitInventory.version`.
 */
export const releaseReservedInventoryForStay = async (
  tx: Prisma.TransactionClient,
  params: ReleaseReservedInventoryParams,
): Promise<void> => {
  const quantity = params.quantity ?? 1;
  const maxRetries = params.maxRetries ?? DEFAULT_MAX_RETRIES;

  const inventoryRecords = await tx.unitInventory.findMany({
    where: {
      propertyId: params.propertyId,
      unitTypeId: params.unitTypeId,
      date: {
        gte: params.checkIn,
        lt: params.checkOut,
      },
    },
  });

  for (const initial of inventoryRecords) {
    let current = initial;
    let attempt = 0;

    while (attempt < maxRetries) {
      const bookedCount = Math.max(0, current.bookedCount - quantity);
      const released = current.bookedCount - bookedCount;
      const availableCount = current.availableCount + released;

      const result = await tx.unitInventory.updateMany({
        where: { id: current.id, version: current.version },
        data: {
          bookedCount,
          availableCount,
          version: { increment: 1 },
        },
      });

      if (result.count === 1) {
        break;
      }

      const refreshed = await tx.unitInventory.findUnique({ where: { id: current.id } });
      if (!refreshed) {
        throw new Error(`UnitInventory row disappeared during release: ${current.id}`);
      }

      current = refreshed;
      attempt += 1;
    }

    if (attempt >= maxRetries) {
      throw new Error(
        `Failed to release inventory for ${current.id} after ${maxRetries} optimistic-lock retries`,
      );
    }
  }
};
