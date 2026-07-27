import crypto from 'node:crypto';
import type { Prisma } from '@khan-familia/database';
import { addMinutes } from '@khan-familia/utils';
import { AppError } from '../../shared/errors/AppError.js';
import { prisma } from '../../infrastructure/database/client.js';
import { enqueueHoldExpiryJob } from '../../infrastructure/queue/producer.js';

const HOLD_TTL_MINUTES = 15;

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

export const blockInventory = async (
  tenantId: string,
  propertyId: string,
  unitTypeId: string,
  startDate: Date,
  endDate: Date,
  blockCount: number,
  reason?: string,
) => {
  return await prisma.$transaction(async (tx) => {
    const rows = await tx.unitInventory.findMany({
      where: {
        tenantId,
        propertyId,
        unitTypeId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const overbooked = rows.filter((r) => r.availableCount < blockCount);
    if (overbooked.length > 0) {
      throw AppError.badRequest('Insufficient availability on some dates', {
        dates: overbooked.map((r) => r.date.toISOString().split('T')[0]).join(', '),
      });
    }

    const { count } = await tx.unitInventory.updateMany({
      where: {
        tenantId,
        propertyId,
        unitTypeId,
        date: { gte: startDate, lte: endDate },
        availableCount: { gte: blockCount },
      },
      data: {
        blockedCount: { increment: blockCount },
        availableCount: { decrement: blockCount },
        blockReason: reason || null,
        version: { increment: 1 },
      },
    });

    if (count !== rows.length) {
      throw AppError.conflict('Concurrency conflict during block operation. Please try again.');
    }

    return count;
  });
};

export const unblockInventory = async (
  tenantId: string,
  propertyId: string,
  unitTypeId: string,
  startDate: Date,
  endDate: Date,
  unblockCount: number,
) => {
  return await prisma.$transaction(async (tx) => {
    const rows = await tx.unitInventory.findMany({
      where: {
        tenantId,
        propertyId,
        unitTypeId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const underblocked = rows.filter((r) => r.blockedCount < unblockCount);
    if (underblocked.length > 0) {
      throw AppError.badRequest('Cannot unblock more units than currently blocked on some dates', {
        dates: underblocked.map((r) => r.date.toISOString().split('T')[0]).join(', '),
      });
    }

    const { count } = await tx.unitInventory.updateMany({
      where: {
        tenantId,
        propertyId,
        unitTypeId,
        date: { gte: startDate, lte: endDate },
        blockedCount: { gte: unblockCount },
      },
      data: {
        blockedCount: { decrement: unblockCount },
        availableCount: { increment: unblockCount },
        version: { increment: 1 },
      },
    });

    if (count !== rows.length) {
      throw AppError.conflict('Concurrency conflict during unblock operation. Please try again.');
    }

    return count;
  });
};

export const setPriceOverride = async (
  tenantId: string,
  propertyId: string,
  unitTypeId: string,
  startDate: Date,
  endDate: Date,
  priceOverride: number | null,
) => {
  const { count } = await prisma.unitInventory.updateMany({
    where: {
      tenantId,
      propertyId,
      unitTypeId,
      date: { gte: startDate, lte: endDate },
    },
    data: {
      priceOverride,
      version: { increment: 1 },
    },
  });

  return count;
};

export const acquireHold = async (
  userId: string,
  tenantId: string,
  propertyId: string,
  unitTypeId: string,
  startDate: Date,
  endDate: Date,
  quantity: number,
  guestDetails?: Record<string, unknown>[],
  specialNeeds?: string[],
  idempotencyKey?: string,
) => {
  return await prisma.$transaction(async (tx) => {
    if (idempotencyKey) {
      const existingHold = await tx.propertyHold.findUnique({
        where: { idempotencyKey },
      });

      if (existingHold) {
        const sameHoldRequest =
          existingHold.userId === userId &&
          existingHold.tenantId === tenantId &&
          existingHold.propertyId === propertyId &&
          existingHold.unitTypeId === unitTypeId &&
          existingHold.startDate.getTime() === startDate.getTime() &&
          existingHold.endDate.getTime() === endDate.getTime() &&
          existingHold.quantity === quantity;

        if (!sameHoldRequest) {
          throw AppError.conflict('Idempotency-Key already belongs to a different hold request');
        }

        if (existingHold.expiresAt <= new Date()) {
          throw AppError.conflict(
            'Idempotency-Key belongs to an expired hold; start a new checkout',
          );
        }

        return existingHold;
      }
    }

    const rows = await tx.unitInventory.findMany({
      where: {
        tenantId,
        propertyId,
        unitTypeId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const overbooked = rows.filter((r) => r.availableCount < quantity);
    if (overbooked.length > 0) {
      throw AppError.badRequest('Insufficient availability on some dates for hold', {
        dates: overbooked.map((r) => r.date.toISOString().split('T')[0]).join(', '),
      });
    }

    const { count } = await tx.unitInventory.updateMany({
      where: {
        tenantId,
        propertyId,
        unitTypeId,
        date: { gte: startDate, lte: endDate },
        availableCount: { gte: quantity },
      },
      data: {
        bookedCount: { increment: quantity },
        availableCount: { decrement: quantity },
        version: { increment: 1 },
      },
    });

    if (count !== rows.length) {
      throw AppError.conflict('Concurrency conflict during hold operation. Please try again.');
    }

    const holdToken = crypto.randomUUID();
    const expiresAt = addMinutes(new Date(), HOLD_TTL_MINUTES);

    const hold = await tx.propertyHold.create({
      data: {
        userId,
        tenantId,
        propertyId,
        unitTypeId,
        holdToken,
        startDate,
        endDate,
        quantity,
        expiresAt,
        ...(guestDetails ? { guestDetails: guestDetails as unknown as object } : {}),
        ...(specialNeeds ? { specialNeeds } : {}),
        ...(idempotencyKey ? { idempotencyKey } : {}),
      },
    });

    await enqueueHoldExpiryJob({
      holdId: hold.id,
      holdToken: hold.holdToken,
      holdExpiresAt: hold.expiresAt.toISOString(),
    });

    return hold;
  });
};

export const releaseHold = async (holdToken: string, userId?: string) => {
  return await prisma.$transaction(async (tx) => {
    const hold = await tx.propertyHold.findUnique({
      where: { holdToken },
    });

    if (!hold) {
      throw AppError.notFound('Hold not found');
    }

    if (userId && hold.userId !== userId) {
      throw AppError.forbidden('You do not have permission to release this hold');
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
      throw AppError.conflict('No inventory rows found for hold release');
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
      throw AppError.conflict('Could not release every inventory row for this hold');
    }

    await tx.propertyHold.delete({
      where: { id: hold.id },
    });
  });
};
