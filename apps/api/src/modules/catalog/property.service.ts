import type { Prisma } from '@khan-familia/database';
import { PropertyApprovalStatus } from '@khan-familia/database';
import { generateShortId, generateSlug } from '@khan-familia/utils';

import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../../shared/errors/AppError.js';
import type {
  CreatePropertyBody,
  RejectPropertyBody,
  UpdatePropertyBody,
} from '@khan-familia/validation';

const propertySelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  address: true,
  city: true,
  country: true,
  images: true,
  starRating: true,
  propertyType: true,
  propertyCategory: true,
  isWholePropertyBookable: true,
  wholePropertyBasePrice: true,
  checkInTime: true,
  checkOutTime: true,
  timezone: true,
  minPricePerNight: true,
  averageRating: true,
  totalReviews: true,
  tenantId: true,
  approvalStatus: true,
  approvedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  location: {
    select: {
      id: true,
      state: true,
      zipCode: true,
      lat: true,
      lng: true,
      timezone: true,
    },
  },
} satisfies Prisma.PropertySelect;

export type PropertyDto = Prisma.PropertyGetPayload<{ select: typeof propertySelect }>;

const resolveUniquePropertySlug = async (
  tx: Prisma.TransactionClient,
  tenantId: string,
  baseName: string,
  preferredSlug?: string,
): Promise<string> => {
  let slug = preferredSlug ?? generateSlug(baseName);
  if (!slug) {
    slug = `property-${generateShortId()}`;
  }

  let candidate = slug;
  let attempt = 0;

  while (attempt < 10) {
    const existing = await tx.property.findFirst({
      where: { tenantId, slug: candidate, isDeleted: false },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    attempt += 1;
    candidate = `${slug}-${generateShortId()}`;
  }

  throw AppError.conflict('Could not generate a unique property slug');
};

const assertTenantPropertyCapacity = async (tenantId: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { propertyLimit: true },
  });

  if (!tenant) {
    throw AppError.notFound('Tenant not found');
  }

  const count = await prisma.property.count({
    where: { tenantId, isDeleted: false },
  });

  if (count >= tenant.propertyLimit) {
    throw AppError.conflict(`Property limit reached (${tenant.propertyLimit})`);
  }
};

export const createProperty = async (
  tenantId: string,
  body: CreatePropertyBody,
): Promise<PropertyDto> => {
  await assertTenantPropertyCapacity(tenantId);

  return prisma.$transaction(async (tx) => {
    const slug = await resolveUniquePropertySlug(tx, tenantId, body.name, body.slug);

    const createData: Prisma.PropertyUncheckedCreateInput = {
      tenantId,
      slug,
      name: body.name,
      description: body.description,
      city: body.city,
      country: body.country,
      images: body.images,
      isWholePropertyBookable: body.isWholePropertyBookable ?? false,
      approvalStatus: PropertyApprovalStatus.PENDING,
    };

    if (body.address !== undefined) {
      createData.address = body.address;
    }
    if (body.propertyType !== undefined) {
      createData.propertyType = body.propertyType;
    }
    if (body.propertyCategory !== undefined) {
      createData.propertyCategory = body.propertyCategory;
    }
    if (body.starRating !== undefined) {
      createData.starRating = body.starRating;
    }
    if (body.wholePropertyBasePrice !== undefined) {
      createData.wholePropertyBasePrice = body.wholePropertyBasePrice;
    }
    if (body.checkInTime !== undefined) {
      createData.checkInTime = body.checkInTime;
    }
    if (body.checkOutTime !== undefined) {
      createData.checkOutTime = body.checkOutTime;
    }
    if (body.timezone !== undefined) {
      createData.timezone = body.timezone;
    }
    if (body.location) {
      const locationCreate: Prisma.LocationUncheckedCreateWithoutPropertyInput = {};
      if (body.location.state !== undefined) {
        locationCreate.state = body.location.state;
      }
      if (body.location.zipCode !== undefined) {
        locationCreate.zipCode = body.location.zipCode;
      }
      if (body.location.lat !== undefined) {
        locationCreate.lat = body.location.lat;
      }
      if (body.location.lng !== undefined) {
        locationCreate.lng = body.location.lng;
      }
      if (body.location.timezone !== undefined) {
        locationCreate.timezone = body.location.timezone;
      }
      createData.location = { create: locationCreate };
    }

    const created = await tx.property.create({
      data: createData,
      select: { id: true },
    });

    return tx.property.findUniqueOrThrow({
      where: { id: created.id },
      select: propertySelect,
    });
  });
};

export const listPropertiesForTenant = async (tenantId: string): Promise<PropertyDto[]> => {
  return prisma.property.findMany({
    where: { tenantId, isDeleted: false },
    select: propertySelect,
    orderBy: { createdAt: 'desc' },
  });
};

export const getPropertyForTenant = async (
  tenantId: string,
  propertyId: string,
): Promise<PropertyDto> => {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, tenantId, isDeleted: false },
    select: propertySelect,
  });

  if (!property) {
    throw AppError.notFound('Property not found');
  }

  return property;
};

export const updateProperty = async (
  tenantId: string,
  propertyId: string,
  body: UpdatePropertyBody,
): Promise<PropertyDto> => {
  const existing = await prisma.property.findFirst({
    where: { id: propertyId, tenantId, isDeleted: false },
    select: { id: true, approvalStatus: true },
  });

  if (!existing) {
    throw AppError.notFound('Property not found');
  }

  const data: Prisma.PropertyUpdateInput = {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.city !== undefined ? { city: body.city } : {}),
    ...(body.country !== undefined ? { country: body.country } : {}),
    ...(body.address !== undefined ? { address: body.address } : {}),
    ...(body.propertyType !== undefined ? { propertyType: body.propertyType } : {}),
    ...(body.propertyCategory !== undefined ? { propertyCategory: body.propertyCategory } : {}),
    ...(body.images !== undefined ? { images: body.images } : {}),
    ...(body.starRating !== undefined ? { starRating: body.starRating } : {}),
    ...(body.isWholePropertyBookable !== undefined
      ? { isWholePropertyBookable: body.isWholePropertyBookable }
      : {}),
    ...(body.wholePropertyBasePrice !== undefined
      ? { wholePropertyBasePrice: body.wholePropertyBasePrice }
      : {}),
    ...(body.checkInTime !== undefined ? { checkInTime: body.checkInTime } : {}),
    ...(body.checkOutTime !== undefined ? { checkOutTime: body.checkOutTime } : {}),
    ...(body.timezone !== undefined ? { timezone: body.timezone } : {}),
  };

  if (existing.approvalStatus === PropertyApprovalStatus.REJECTED) {
    data.approvalStatus = PropertyApprovalStatus.PENDING;
    data.rejectedAt = null;
    data.rejectedBy = { disconnect: true };
    data.rejectionReason = null;
  }

  return prisma.$transaction(async (tx) => {
    if (body.slug) {
      const slugTaken = await tx.property.findFirst({
        where: {
          tenantId,
          slug: body.slug,
          isDeleted: false,
          NOT: { id: propertyId },
        },
        select: { id: true },
      });

      if (slugTaken) {
        throw AppError.conflict('Property slug already in use for this tenant');
      }

      data.slug = body.slug;
    }

    await tx.property.update({
      where: { id: propertyId },
      data,
    });

    if (body.location) {
      const locationData: Prisma.LocationUncheckedCreateWithoutPropertyInput = {};
      if (body.location.state !== undefined) {
        locationData.state = body.location.state;
      }
      if (body.location.zipCode !== undefined) {
        locationData.zipCode = body.location.zipCode;
      }
      if (body.location.lat !== undefined) {
        locationData.lat = body.location.lat;
      }
      if (body.location.lng !== undefined) {
        locationData.lng = body.location.lng;
      }
      if (body.location.timezone !== undefined) {
        locationData.timezone = body.location.timezone;
      }

      await tx.location.upsert({
        where: { propertyId },
        create: { propertyId, ...locationData },
        update: locationData,
      });
    }

    const property = await tx.property.findUniqueOrThrow({
      where: { id: propertyId },
      select: propertySelect,
    });

    return property;
  });
};

export const softDeleteProperty = async (tenantId: string, propertyId: string): Promise<void> => {
  const result = await prisma.property.updateMany({
    where: { id: propertyId, tenantId, isDeleted: false },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  if (result.count === 0) {
    throw AppError.notFound('Property not found');
  }
};

export const listPendingProperties = async (): Promise<PropertyDto[]> => {
  return prisma.property.findMany({
    where: { approvalStatus: PropertyApprovalStatus.PENDING, isDeleted: false },
    select: propertySelect,
    orderBy: { createdAt: 'asc' },
  });
};

export const approveProperty = async (
  propertyId: string,
  approverUserId: string,
): Promise<PropertyDto> => {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, isDeleted: false },
    select: { id: true, approvalStatus: true },
  });

  if (!property) {
    throw AppError.notFound('Property not found');
  }

  if (property.approvalStatus === PropertyApprovalStatus.APPROVED) {
    throw AppError.conflict('Property is already approved');
  }

  return prisma.property.update({
    where: { id: propertyId },
    data: {
      approvalStatus: PropertyApprovalStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: approverUserId,
      rejectedAt: null,
      rejectedById: null,
      rejectionReason: null,
    },
    select: propertySelect,
  });
};

export const rejectProperty = async (
  propertyId: string,
  rejectorUserId: string,
  body: RejectPropertyBody,
): Promise<PropertyDto> => {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, isDeleted: false },
    select: { id: true, approvalStatus: true },
  });

  if (!property) {
    throw AppError.notFound('Property not found');
  }

  if (property.approvalStatus === PropertyApprovalStatus.REJECTED) {
    throw AppError.conflict('Property is already rejected');
  }

  return prisma.property.update({
    where: { id: propertyId },
    data: {
      approvalStatus: PropertyApprovalStatus.REJECTED,
      rejectedAt: new Date(),
      rejectedById: rejectorUserId,
      rejectionReason: body.reason,
      approvedAt: null,
      approvedById: null,
    },
    select: propertySelect,
  });
};
