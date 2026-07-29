import type { Prisma } from '@prisma/client';

export type ReleaseHoldInventoryParams = {
  propertyId: string;
  unitTypeId: string;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  /** Number of units per night row to release back to available. */
  quantity: number;
};

/**
 * Releases inventory that was reserved for a property hold.
 *
 * Uses an optimistic-lock pattern (`bookedCount >= quantity` as the predicate)
 * combined with a row count assertion to detect concurrent modifications.
 * Designed to run inside an existing Prisma `$transaction`.
 *
 * Distinct from `releaseReservedInventoryForStay` (which handles confirmed booking
 * cancellations with per-row retry semantics). This utility targets hold release,
 * where the hold is about to be deleted atomically in the same transaction.
 *
 * @throws {Error} if no inventory rows are found for the hold window.
 * @throws {Error} if not all inventory rows could be released (concurrent write).
 */
export const releaseHoldInventory = async (
  tx: Prisma.TransactionClient,
  params: ReleaseHoldInventoryParams,
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
      `No inventory rows found for hold on property=${params.propertyId} ` +
        `unitType=${params.unitTypeId} from=${params.startDate.toISOString()} to=${params.endDate.toISOString()}`,
    );
  }

  const released = await tx.unitInventory.updateMany({
    where: {
      id: { in: inventoryRows.map((row) => row.id) },
      bookedCount: { gte: params.quantity },
    },
    data: {
      bookedCount: { decrement: params.quantity },
      availableCount: { increment: params.quantity },
      version: { increment: 1 },
    },
  });

  if (released.count !== inventoryRows.length) {
    throw new Error(
      `Could not release all inventory rows for hold on property=${params.propertyId} ` +
        `(released=${released.count}, expected=${inventoryRows.length})`,
    );
  }
};
