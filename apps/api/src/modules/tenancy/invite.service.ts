import type { PrismaClient } from '@khan-familia/database';
import { generateNanoId, addDays } from '@khan-familia/utils';

import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { CreateInviteBody } from '@khan-familia/validation';
import { countActiveMembers } from './tenant.service.js';

const INVITE_TTL_DAYS = 7;

const inviteSelect = {
  id: true,
  tenantId: true,
  email: true,
  role: true,
  status: true,
  expiresAt: true,
  createdAt: true,
} as const;

export const createTenantInvite = async (
  tenantId: string,
  createdById: string,
  input: CreateInviteBody,
  db: PrismaClient = prisma,
) => {
  if (input.role === 'OWNER') {
    throw AppError.badRequest('Cannot invite with owner role');
  }

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { staffLimit: true, status: true },
  });

  if (!tenant) {
    throw AppError.notFound('Tenant not found');
  }

  if (tenant.status !== 'ACTIVE') {
    throw AppError.forbidden('Tenant is not active');
  }

  const activeCount = await countActiveMembers(tenantId, db);
  const pendingInvites = await db.tenantInvite.count({
    where: { tenantId, status: 'PENDING', expiresAt: { gt: new Date() } },
  });

  if (activeCount + pendingInvites >= tenant.staffLimit) {
    throw AppError.conflict('Tenant staff limit reached');
  }

  const normalizedEmail = input.email.toLowerCase();

  const existingMember = await db.tenantUser.findFirst({
    where: {
      tenantId,
      status: 'ACTIVE',
      user: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    },
  });

  if (existingMember) {
    throw AppError.conflict('User is already a member of this tenant');
  }

  const expiresAt = addDays(new Date(), INVITE_TTL_DAYS);

  try {
    return await db.tenantInvite.create({
      data: {
        tenantId,
        email: normalizedEmail,
        role: input.role,
        token: generateNanoId(32),
        expiresAt,
        createdById,
      },
      select: inviteSelect,
    });
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002') {
      throw AppError.conflict('A pending invite already exists for this email');
    }
    throw err;
  }
};

export const listTenantInvites = async (tenantId: string, db: PrismaClient = prisma) => {
  return db.tenantInvite.findMany({
    where: {
      tenantId,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    select: inviteSelect,
    orderBy: { createdAt: 'desc' },
  });
};

export const acceptTenantInvite = async (
  userId: string,
  userEmail: string,
  token: string,
  db: PrismaClient = prisma,
) => {
  const invite = await db.tenantInvite.findUnique({
    where: { token },
    include: { tenant: { select: { id: true, status: true, staffLimit: true } } },
  });

  if (!invite) {
    throw AppError.notFound('Invite not found');
  }

  if (invite.status !== 'PENDING') {
    throw AppError.conflict('Invite is no longer valid');
  }

  if (invite.expiresAt < new Date()) {
    await db.tenantInvite.update({
      where: { id: invite.id },
      data: { status: 'EXPIRED' },
    });
    throw AppError.conflict('Invite has expired');
  }

  if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw AppError.forbidden('Invite email does not match your account');
  }

  if (invite.tenant.status !== 'ACTIVE') {
    throw AppError.forbidden('Tenant is not active');
  }

  const existing = await db.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId: invite.tenantId, userId } },
  });

  if (existing?.status === 'ACTIVE') {
    throw AppError.conflict('You are already a member of this tenant');
  }

  const activeCount = await countActiveMembers(invite.tenantId, db);
  if (activeCount >= invite.tenant.staffLimit) {
    throw AppError.conflict('Tenant staff limit reached');
  }

  return db.$transaction(async (tx) => {
    if (existing) {
      await tx.tenantUser.update({
        where: { tenantId_userId: { tenantId: invite.tenantId, userId } },
        data: { role: invite.role, status: 'ACTIVE' },
      });
    } else {
      await tx.tenantUser.create({
        data: {
          tenantId: invite.tenantId,
          userId,
          role: invite.role,
          status: 'ACTIVE',
        },
      });
    }

    await tx.tenantInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' },
    });

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { defaultTenantId: true },
    });

    if (!user?.defaultTenantId) {
      await tx.user.update({
        where: { id: userId },
        data: { defaultTenantId: invite.tenantId },
      });
    }

    return tx.tenant.findUniqueOrThrow({
      where: { id: invite.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        businessVertical: true,
      },
    });
  });
};

export const revokeTenantInvite = async (
  tenantId: string,
  inviteId: string,
  db: PrismaClient = prisma,
) => {
  const invite = await db.tenantInvite.findFirst({
    where: { id: inviteId, tenantId, status: 'PENDING' },
  });

  if (!invite) {
    throw AppError.notFound('Pending invite not found');
  }

  return db.tenantInvite.update({
    where: { id: inviteId },
    data: { status: 'REVOKED' },
    select: inviteSelect,
  });
};
