import {
  PropertyApprovalStatus,
  TenantApplicationStatus,
  TenantRole,
} from '@khan-familia/database';
import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../../shared/errors/AppError.js';
import { enqueueInventoryHorizonJob } from '../../infrastructure/queue/producer.js';
import type { RejectPropertyBody } from '@khan-familia/validation';
import { propertySelect, type PropertyDto } from '../catalog/property.service.js';
import { decrypt } from '../../shared/utils/crypto.js';
import { generateSlug } from '@khan-familia/utils';

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

export const listPendingApplications = async () => {
  const applications = await prisma.tenantApplication.findMany({
    where: { status: TenantApplicationStatus.PENDING },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: { email: true, username: true },
      },
    },
  });

  return applications.map((app) => ({
    ...app,
    govIdNumber: decrypt(app.govIdNumber),
    businessRegNumber: decrypt(app.businessRegNumber),
  }));
};

export const approveApplication = async (
  applicationId: string,
  adminUserId: string,
  adminNotes?: string,
) => {
  const application = await prisma.tenantApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) throw AppError.notFound('Application not found');
  if (application.status !== TenantApplicationStatus.PENDING) {
    throw AppError.conflict('Application is not pending');
  }

  // Four-Eyes Principle: Admin cannot approve their own application
  if (application.userId === adminUserId) {
    throw AppError.conflict('Conflict of Interest: You cannot approve your own application.');
  }

  const slug = generateSlug(application.businessName);

  return prisma.$transaction(async (tx) => {
    // 1. Update application status
    const updatedApplication = await tx.tenantApplication.update({
      where: { id: applicationId },
      data: {
        status: TenantApplicationStatus.APPROVED,
        adminNotes: adminNotes ?? null,
        reviewedAt: new Date(),
      },
    });

    // 2. Provision Tenant
    const tenant = await tx.tenant.create({
      data: {
        name: application.businessName,
        slug: slug,
        businessVertical: application.businessVertical,
      },
    });

    // 3. Provision TenantUser (Owner)
    await tx.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: application.userId,
        role: TenantRole.OWNER,
      },
    });

    // 4. Set as default tenant for the user if they don't have one
    const user = await tx.user.findUnique({ where: { id: application.userId } });
    if (user && !user.defaultTenantId) {
      await tx.user.update({
        where: { id: application.userId },
        data: { defaultTenantId: tenant.id },
      });
    }

    return updatedApplication;
  });
};

export const rejectApplication = async (
  applicationId: string,
  adminUserId: string,
  adminNotes?: string,
) => {
  const application = await prisma.tenantApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) throw AppError.notFound('Application not found');
  if (application.status !== TenantApplicationStatus.PENDING) {
    throw AppError.conflict('Application is not pending');
  }

  return prisma.tenantApplication.update({
    where: { id: applicationId },
    data: {
      status: TenantApplicationStatus.REJECTED,
      adminNotes: adminNotes ?? null,
      reviewedAt: new Date(),
    },
  });
};
