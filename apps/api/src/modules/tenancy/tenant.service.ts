import type { Prisma, PrismaClient, TenantRole } from '@khan-familia/database';
import { generateShortId, generateSlug } from '@khan-familia/utils';

import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../../shared/errors/AppError.js';
import type { CreateTenantBody, UpdateTenantBody } from './schemas.js';

const tenantSelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  businessVertical: true,
  propertyLimit: true,
  staffLimit: true,
  inventoryHorizonDays: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TenantSelect;

export type TenantDto = Prisma.TenantGetPayload<{ select: typeof tenantSelect }>;

const memberUserSelect = {
  id: true,
  username: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

const resolveUniqueTenantSlug = async (
  tx: Prisma.TransactionClient,
  baseName: string,
  preferredSlug?: string,
): Promise<string> => {
  let slug = preferredSlug ?? generateSlug(baseName);
  if (!slug) {
    slug = `tenant-${generateShortId()}`;
  }

  let candidate = slug;
  let attempt = 0;

  while (attempt < 10) {
    const existing = await tx.tenant.findFirst({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${slug}-${generateShortId()}`;
    attempt += 1;
  }

  throw AppError.conflict('Could not generate a unique tenant slug');
};

export const createTenant = async (
  userId: string,
  input: CreateTenantBody,
  db: PrismaClient = prisma,
): Promise<TenantDto> => {
  return db.$transaction(async (tx) => {
    const slug = await resolveUniqueTenantSlug(tx, input.name, input.slug);

    const createData: Prisma.TenantCreateInput = {
      name: input.name,
      slug,
      users: {
        create: {
          userId,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      },
    };

    if (input.businessVertical !== undefined) {
      createData.businessVertical = input.businessVertical;
    }

    const tenant = await tx.tenant.create({
      data: createData,
      select: tenantSelect,
    });

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { defaultTenantId: true },
    });

    if (!user?.defaultTenantId) {
      await tx.user.update({
        where: { id: userId },
        data: { defaultTenantId: tenant.id },
      });
    }

    return tenant;
  });
};

export const listTenantsForUser = async (
  userId: string,
  db: PrismaClient = prisma,
): Promise<Array<TenantDto & { role: TenantRole }>> => {
  const memberships = await db.tenantUser.findMany({
    where: { userId, status: 'ACTIVE' },
    include: { tenant: { select: tenantSelect } },
    orderBy: { createdAt: 'asc' },
  });

  return memberships.map((m) => ({
    ...m.tenant,
    role: m.role,
  }));
};

export const getTenantById = async (
  tenantId: string,
  db: PrismaClient = prisma,
): Promise<TenantDto> => {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: tenantSelect,
  });

  if (!tenant) {
    throw AppError.notFound('Tenant not found');
  }

  if (tenant.status !== 'ACTIVE') {
    throw AppError.forbidden('Tenant is not active');
  }

  return tenant;
};

export const updateTenant = async (
  tenantId: string,
  input: UpdateTenantBody,
  db: PrismaClient = prisma,
): Promise<TenantDto> => {
  const data: Prisma.TenantUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name;
  }

  if (input.businessVertical !== undefined) {
    data.businessVertical = input.businessVertical;
  }

  if (Object.keys(data).length === 0) {
    throw AppError.badRequest('No fields to update');
  }

  try {
    return await db.tenant.update({
      where: { id: tenantId },
      data,
      select: tenantSelect,
    });
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2025') {
      throw AppError.notFound('Tenant not found');
    }
    throw err;
  }
};

export const listTenantMembers = async (tenantId: string, db: PrismaClient = prisma) => {
  return db.tenantUser.findMany({
    where: { tenantId, status: 'ACTIVE' },
    select: {
      tenantId: true,
      userId: true,
      role: true,
      status: true,
      createdAt: true,
      user: { select: memberUserSelect },
    },
    orderBy: { createdAt: 'asc' },
  });
};

export const countActiveMembers = async (tenantId: string, db: PrismaClient = prisma) => {
  return db.tenantUser.count({
    where: { tenantId, status: 'ACTIVE' },
  });
};

export const removeTenantMember = async (
  tenantId: string,
  targetUserId: string,
  actorUserId: string,
  actorRole: TenantRole,
  db: PrismaClient = prisma,
): Promise<void> => {
  if (targetUserId === actorUserId) {
    throw AppError.badRequest('Use leave-tenant flow instead of removing yourself');
  }

  const target = await db.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId, userId: targetUserId } },
  });

  if (!target || target.status !== 'ACTIVE') {
    throw AppError.notFound('Member not found');
  }

  if (actorRole === 'STAFF') {
    throw AppError.forbidden('Insufficient tenant permissions');
  }

  if (target.role === 'OWNER') {
    throw AppError.badRequest('Cannot remove an owner; transfer ownership first');
  }

  if (actorRole === 'ADMIN' && target.role === 'ADMIN') {
    throw AppError.forbidden('Admins cannot remove other admins');
  }

  await db.$transaction(async (tx) => {
    await tx.tenantUser.update({
      where: { tenantId_userId: { tenantId, userId: targetUserId } },
      data: { status: 'DISABLED' },
    });

    await tx.user.updateMany({
      where: { id: targetUserId, defaultTenantId: tenantId },
      data: { defaultTenantId: null },
    });
  });
};
