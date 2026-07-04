import type { Prisma } from '@khan-familia/database';

import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { CreateUnitTypeBody, UpdateUnitTypeBody } from '@khan-familia/validation';

const unitTypeSelect = {
  id: true,
  propertyId: true,
  tenantId: true,
  name: true,
  unitCount: true,
  capacity: true,
  description: true,
  images: true,
  defaultRate: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UnitTypeSelect;

export type UnitTypeDto = Prisma.UnitTypeGetPayload<{ select: typeof unitTypeSelect }>;

const assertPropertyInTenant = async (tenantId: string, propertyId: string) => {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, tenantId, isDeleted: false },
    select: { id: true },
  });

  if (!property) {
    throw AppError.notFound('Property not found');
  }
};

export const createUnitType = async (
  tenantId: string,
  propertyId: string,
  body: CreateUnitTypeBody,
): Promise<UnitTypeDto> => {
  await assertPropertyInTenant(tenantId, propertyId);

  const existing = await prisma.unitType.findFirst({
    where: { propertyId, name: body.name },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict('Unit type name already exists for this property');
  }

  const createData: Prisma.UnitTypeUncheckedCreateInput = {
    tenantId,
    propertyId,
    name: body.name,
    unitCount: body.unitCount,
    capacity: body.capacity,
    images: body.images ?? [],
  };

  if (body.description !== undefined) {
    createData.description = body.description;
  }
  if (body.defaultRate !== undefined) {
    createData.defaultRate = body.defaultRate;
  }

  return prisma.unitType.create({
    data: createData,
    select: unitTypeSelect,
  });
};

export const listUnitTypesForProperty = async (
  tenantId: string,
  propertyId: string,
): Promise<UnitTypeDto[]> => {
  await assertPropertyInTenant(tenantId, propertyId);

  return prisma.unitType.findMany({
    where: { propertyId, tenantId },
    select: unitTypeSelect,
    orderBy: { name: 'asc' },
  });
};

export const getUnitType = async (
  tenantId: string,
  propertyId: string,
  unitTypeId: string,
): Promise<UnitTypeDto> => {
  const unitType = await prisma.unitType.findFirst({
    where: { id: unitTypeId, propertyId, tenantId },
    select: unitTypeSelect,
  });

  if (!unitType) {
    throw AppError.notFound('Unit type not found');
  }

  return unitType;
};

export const updateUnitType = async (
  tenantId: string,
  propertyId: string,
  unitTypeId: string,
  body: UpdateUnitTypeBody,
): Promise<UnitTypeDto> => {
  await getUnitType(tenantId, propertyId, unitTypeId);

  if (body.name) {
    const nameTaken = await prisma.unitType.findFirst({
      where: {
        propertyId,
        name: body.name,
        NOT: { id: unitTypeId },
      },
      select: { id: true },
    });

    if (nameTaken) {
      throw AppError.conflict('Unit type name already exists for this property');
    }
  }

  return prisma.unitType.update({
    where: { id: unitTypeId },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.unitCount !== undefined ? { unitCount: body.unitCount } : {}),
      ...(body.capacity !== undefined ? { capacity: body.capacity } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.defaultRate !== undefined ? { defaultRate: body.defaultRate } : {}),
      ...(body.images !== undefined ? { images: body.images } : {}),
    },
    select: unitTypeSelect,
  });
};

export const deleteUnitType = async (
  tenantId: string,
  propertyId: string,
  unitTypeId: string,
): Promise<void> => {
  await getUnitType(tenantId, propertyId, unitTypeId);

  const inventoryCount = await prisma.unitInventory.count({
    where: { unitTypeId },
  });

  if (inventoryCount > 0) {
    throw AppError.conflict('Cannot delete unit type with existing inventory rows');
  }

  const bookingCount = await prisma.accommodationBooking.count({
    where: { unitTypeId },
  });

  if (bookingCount > 0) {
    throw AppError.conflict('Cannot delete unit type with existing bookings');
  }

  await prisma.unitType.delete({ where: { id: unitTypeId } });
};
