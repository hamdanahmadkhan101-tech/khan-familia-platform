import { PropertyApprovalStatus } from '@khan-familia/database';
import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../../shared/errors/AppError.js';
import { enqueueInventoryHorizonJob } from '../../infrastructure/queue/producer.js';
import type { RejectPropertyBody } from '@khan-familia/validation';
import { propertySelect, type PropertyDto } from '../catalog/property.service.js';

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

  const updated = await prisma.property.update({
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

  await enqueueInventoryHorizonJob(propertyId);

  return updated;
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
