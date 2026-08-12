import { type PrismaClient, TenantApplicationStatus } from '@khan-familia/database';
import { prisma } from '../../infrastructure/database/client.js';
import type { SubmitApplicationBody } from '@khan-familia/validation';
import { encrypt } from '../../shared/utils/crypto.js';
import { AppError } from '../../shared/errors/AppError.js';

export const submitApplication = async (
  userId: string,
  input: SubmitApplicationBody,
  db: PrismaClient = prisma,
) => {
  return db.$transaction(async (tx) => {
    // Check if user already has a pending or approved application
    const existing = await tx.tenantApplication.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existing) {
      throw AppError.conflict('You already have a pending or approved vendor application.');
    }

    // Encrypt sensitive fields
    const encryptedGovId = encrypt(input.govIdNumber);
    const encryptedRegNum = encrypt(input.businessRegNumber);

    const application = await tx.tenantApplication.create({
      data: {
        userId,
        fullName: input.fullName,
        phone: input.phone,
        businessName: input.businessName,
        businessVertical: input.businessVertical,
        businessAddress: input.businessAddress,
        city: input.city,
        state: input.state ?? null,
        postalCode: input.postalCode ?? null,
        country: input.country,
        phoneCountryCode: input.phoneCountryCode ?? null,
        govIdType: input.govIdType,
        govIdNumber: encryptedGovId,
        businessRegNumber: encryptedRegNum,
        taxId: input.taxId ?? null,
        businessWebsite: input.businessWebsite ?? null,
        altEmail: input.altEmail ?? null,
        experience: input.experience,
        documents: input.documents ? input.documents : [],
        status: TenantApplicationStatus.PENDING,
      },
    });

    return application;
  });
};

export const getApplicationStatus = async (userId: string, db: PrismaClient = prisma) => {
  const application = await db.tenantApplication.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      createdAt: true,
      businessName: true,
      approvedTenantId: true,
    },
  });

  return application;
};
