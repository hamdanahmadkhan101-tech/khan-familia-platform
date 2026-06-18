import type { PlatformRole, TenantRole } from '@khan-familia/database';

import { testPrisma } from '../database.js';

let sequence = 0;

const nextId = (prefix: string) => {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
};

export const testDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

export const createTestUser = async (overrides: { clerkId?: string; role?: PlatformRole } = {}) => {
  const suffix = nextId('user');
  const clerkId = overrides.clerkId ?? `clerk-${suffix}`;

  return testPrisma.user.create({
    data: {
      clerkId,
      username: `user_${suffix}`,
      email: `${suffix}@example.test`,
      role: overrides.role ?? 'USER',
      status: 'ACTIVE',
    },
  });
};

export const createTestTenant = async (ownerUserId: string, role: TenantRole = 'OWNER') => {
  const suffix = nextId('tenant');

  const tenant = await testPrisma.tenant.create({
    data: {
      name: `Tenant ${suffix}`,
      slug: suffix,
      users: {
        create: {
          userId: ownerUserId,
          role,
          status: 'ACTIVE',
        },
      },
    },
  });

  await testPrisma.user.update({
    where: { id: ownerUserId },
    data: { defaultTenantId: tenant.id },
  });

  return tenant;
};

export const createTestProperty = async (tenantId: string) => {
  const suffix = nextId('property');

  return testPrisma.property.create({
    data: {
      tenantId,
      slug: suffix,
      name: `Property ${suffix}`,
      description: 'A comfortable test property with enough detail for validation.',
      city: 'Lahore',
      country: 'Pakistan',
      images: [],
      approvalStatus: 'APPROVED',
      approvedAt: new Date(),
    },
  });
};

export const createTestUnitType = async (tenantId: string, propertyId: string) => {
  const suffix = nextId('unit');

  return testPrisma.unitType.create({
    data: {
      tenantId,
      propertyId,
      name: `Deluxe ${suffix}`,
      capacity: 2,
      defaultRate: 15_000,
      images: [],
    },
  });
};

export const createInventoryRange = async (input: {
  tenantId: string;
  propertyId: string;
  unitTypeId: string;
  startDate: string;
  endDate: string;
  totalCount?: number;
}) => {
  const start = testDate(input.startDate);
  const end = testDate(input.endDate);
  const rows = [];

  for (const date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
    rows.push({
      tenantId: input.tenantId,
      propertyId: input.propertyId,
      unitTypeId: input.unitTypeId,
      date: new Date(date),
      totalCount: input.totalCount ?? 3,
      availableCount: input.totalCount ?? 3,
      bookedCount: 0,
      blockedCount: 0,
    });
  }

  await testPrisma.unitInventory.createMany({ data: rows });

  return testPrisma.unitInventory.findMany({
    where: { propertyId: input.propertyId, unitTypeId: input.unitTypeId },
    orderBy: { date: 'asc' },
  });
};

export const createBookableInventoryFixture = async () => {
  const owner = await createTestUser({ clerkId: 'owner-clerk' });
  const guest = await createTestUser({ clerkId: 'guest-clerk' });
  const tenant = await createTestTenant(owner.id, 'OWNER');
  const property = await createTestProperty(tenant.id);
  const unitType = await createTestUnitType(tenant.id, property.id);

  await createInventoryRange({
    tenantId: tenant.id,
    propertyId: property.id,
    unitTypeId: unitType.id,
    startDate: '2026-08-01',
    endDate: '2026-08-05',
    totalCount: 3,
  });

  return { owner, guest, tenant, property, unitType };
};
