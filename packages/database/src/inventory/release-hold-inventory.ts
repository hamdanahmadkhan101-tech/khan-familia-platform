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
import { requireTenantId } from '../repositories/tenant-scoped.js';

export const releaseHoldInventory = async (
  tx: Prisma.TransactionClient,
  params: ReleaseHoldInventoryParams,
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
      `No inventory rows found for hold on property=${params.propertyId} ` +
        `unitType=${params.unitTypeId} from=${params.startDate.toISOString()} to=${params.endDate.toISOString()}`,
    );
  }

  let releasedCount = 0;
  // Update sequentially to enforce deterministic locking order (avoid deadlocks)
  for (const row of inventoryRows) {
    const updated = await tx.unitInventory.updateMany({
      where: {
        id: row.id,
        heldCount: { gte: params.quantity },
      },
      data: {
        heldCount: { decrement: params.quantity },
        availableCount: { increment: params.quantity },
        version: { increment: 1 },
      },
    });
    releasedCount += updated.count;
  }

  if (releasedCount !== inventoryRows.length) {
    throw new Error(
      `Could not release all inventory rows for hold on property=${params.propertyId} ` +
        `(released=${releasedCount}, expected=${inventoryRows.length})`,
    );
  }
};
