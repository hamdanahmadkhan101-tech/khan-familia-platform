import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/express', () => ({
  verifyToken: vi.fn(async (token: string) => ({ sub: token })),
}));

import { authHeaderFor } from '../helpers/auth.js';
import { truncateTestDatabase, testPrisma } from '../database.js';
import { createTestAgent } from '../helpers/http.js';
import { createBookableInventoryFixture } from '../helpers/fixtures.js';

const runDbTests = process.env['RUN_DB_TESTS'] === 'true';
const describeDb = runDbTests ? describe : describe.skip;

describeDb('inventory and hold integration flow', () => {
  beforeEach(async () => {
    await truncateTestDatabase();
  });

  it('blocks and unblocks inventory for a tenant property', async () => {
    const { owner, property, unitType } = await createBookableInventoryFixture();
    const agent = createTestAgent();

    const blockResponse = await agent
      .post(`/inventory/${property.id}/blocks`)
      .set('Authorization', authHeaderFor(owner.clerkId))
      .set('X-Tenant-ID', property.tenantId)
      .send({
        unitTypeId: unitType.id,
        startDate: '2026-08-01',
        endDate: '2026-08-03',
        blockCount: 1,
        reason: 'Maintenance',
      });

    expect(blockResponse.status).toBe(200);
    expect(blockResponse.body).toMatchObject({ updatedDays: 3 });

    const blockedRows = await testPrisma.unitInventory.findMany({
      where: { propertyId: property.id, unitTypeId: unitType.id },
      orderBy: { date: 'asc' },
    });

    expect(blockedRows.slice(0, 3)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ availableCount: 2, blockedCount: 1 }),
        expect.objectContaining({ availableCount: 2, blockedCount: 1 }),
        expect.objectContaining({ availableCount: 2, blockedCount: 1 }),
      ]),
    );

    const unblockResponse = await agent
      .post(`/inventory/${property.id}/unblock`)
      .set('Authorization', authHeaderFor(owner.clerkId))
      .set('X-Tenant-ID', property.tenantId)
      .send({
        unitTypeId: unitType.id,
        startDate: '2026-08-01',
        endDate: '2026-08-03',
        unblockCount: 1,
      });

    expect(unblockResponse.status).toBe(200);
    expect(unblockResponse.body).toMatchObject({ updatedDays: 3 });

    const restoredRows = await testPrisma.unitInventory.findMany({
      where: { propertyId: property.id, unitTypeId: unitType.id },
      orderBy: { date: 'asc' },
    });

    expect(restoredRows.slice(0, 3)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ availableCount: 3, blockedCount: 0 }),
        expect.objectContaining({ availableCount: 3, blockedCount: 0 }),
        expect.objectContaining({ availableCount: 3, blockedCount: 0 }),
      ]),
    );
  });

  it('creates idempotent holds and releases inventory manually', async () => {
    const { guest, property, unitType } = await createBookableInventoryFixture();
    const agent = createTestAgent();
    const idempotencyKey = 'hold-flow-test-001';
    const holdPayload = {
      propertyId: property.id,
      unitTypeId: unitType.id,
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      quantity: 1,
    };

    const firstHold = await agent
      .post('/booking/holds')
      .set('Authorization', authHeaderFor(guest.clerkId))
      .set('Idempotency-Key', idempotencyKey)
      .send(holdPayload);

    expect(firstHold.status).toBe(201);
    expect(firstHold.body.holdToken).toEqual(expect.any(String));

    const duplicateHold = await agent
      .post('/booking/holds')
      .set('Authorization', authHeaderFor(guest.clerkId))
      .set('Idempotency-Key', idempotencyKey)
      .send(holdPayload);

    expect(duplicateHold.status).toBe(201);
    expect(duplicateHold.body.holdToken).toBe(firstHold.body.holdToken);

    const holds = await testPrisma.propertyHold.findMany({ where: { unitTypeId: unitType.id } });
    expect(holds).toHaveLength(1);

    const reservedRows = await testPrisma.unitInventory.findMany({
      where: { propertyId: property.id, unitTypeId: unitType.id },
      orderBy: { date: 'asc' },
    });

    expect(reservedRows.slice(0, 3)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ availableCount: 2, bookedCount: 1 }),
        expect.objectContaining({ availableCount: 2, bookedCount: 1 }),
        expect.objectContaining({ availableCount: 2, bookedCount: 1 }),
      ]),
    );

    const releaseResponse = await agent
      .delete(`/booking/holds/${firstHold.body.holdToken}`)
      .set('Authorization', authHeaderFor(guest.clerkId));

    expect(releaseResponse.status).toBe(200);

    const remainingHolds = await testPrisma.propertyHold.findMany({
      where: { unitTypeId: unitType.id },
    });
    expect(remainingHolds).toHaveLength(0);

    const releasedRows = await testPrisma.unitInventory.findMany({
      where: { propertyId: property.id, unitTypeId: unitType.id },
      orderBy: { date: 'asc' },
    });

    expect(releasedRows.slice(0, 3)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ availableCount: 3, bookedCount: 0 }),
        expect.objectContaining({ availableCount: 3, bookedCount: 0 }),
        expect.objectContaining({ availableCount: 3, bookedCount: 0 }),
      ]),
    );
  });

  it('prevents tenant staff from booking their own property as a guest', async () => {
    const { owner, property, unitType } = await createBookableInventoryFixture();

    const response = await createTestAgent()
      .post('/booking/holds')
      .set('Authorization', authHeaderFor(owner.clerkId))
      .send({
        propertyId: property.id,
        unitTypeId: unitType.id,
        startDate: '2026-08-01',
        endDate: '2026-08-03',
        quantity: 1,
      });

    expect(response.status).toBe(403);
    expect(response.body.error.message).toContain('Staff cannot book their own properties');
  });
});
