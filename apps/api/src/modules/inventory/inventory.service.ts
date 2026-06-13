import type { Prisma } from '@khan-familia/database';
import { AppError } from '../../shared/errors/AppError.js';
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
