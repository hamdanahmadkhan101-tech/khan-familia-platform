import { addDays, format } from 'date-fns';
import crypto from 'node:crypto';
import { beforeAll, describe, expect, it, vi } from 'vitest';

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
  beforeAll(async () => {
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
        startDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 32), 'yyyy-MM-dd'),
        blockCount: 1,
        reason: 'Maintenance',
      });

    expect(blockResponse.status).toBe(200);
    expect(blockResponse.body).toMatchObject({ updatedDays: 2 });

    const blockedRows = await testPrisma.unitInventory.findMany({
      where: { propertyId: property.id, unitTypeId: unitType.id },
      orderBy: { date: 'asc' },
    });

    expect(blockedRows.slice(0, 2)).toEqual(
      expect.arrayContaining([
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
        startDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 32), 'yyyy-MM-dd'),
        unblockCount: 1,
      });

    expect(unblockResponse.status).toBe(200);
    expect(unblockResponse.body).toMatchObject({ updatedDays: 2 });

    const restoredRows = await testPrisma.unitInventory.findMany({
      where: { propertyId: property.id, unitTypeId: unitType.id },
      orderBy: { date: 'asc' },
    });

    expect(restoredRows.slice(0, 2)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ availableCount: 3, blockedCount: 0 }),
        expect.objectContaining({ availableCount: 3, blockedCount: 0 }),
      ]),
    );
  });

  it('creates idempotent holds and releases inventory manually', async () => {
    const { guest, property, unitType } = await createBookableInventoryFixture();
    const agent = createTestAgent();
    const idempotencyKey = crypto.randomUUID();
    const holdPayload = {
      propertyId: property.id,
      unitTypeId: unitType.id,
      idempotencyKey,
      startDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 32), 'yyyy-MM-dd'),
      quantity: 1,
      guestDetails: [
        {
          name: 'John Doe',
          age: 30,
          idType: 'CNIC',
          idNumber: '12345-1234567-1',
          isPrimary: true,
        },
      ],
    };

    const firstHold = await agent
      .post('/bookings/holds')
      .set('Authorization', authHeaderFor(guest.clerkId))
      .set('Idempotency-Key', idempotencyKey)
      .send(holdPayload);

    if (firstHold.status !== 201) {
      throw new Error(`First hold failed: ${JSON.stringify(firstHold.body)}`);
    }
    expect(firstHold.status).toBe(201);
    expect(firstHold.body.holdToken).toEqual(expect.any(String));

    const duplicateHold = await agent
      .post('/bookings/holds')
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

    expect(reservedRows.slice(0, 2)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ availableCount: 2, heldCount: 1 }),
        expect.objectContaining({ availableCount: 2, heldCount: 1 }),
      ]),
    );

    const releaseResponse = await agent
      .delete(`/bookings/holds/${firstHold.body.holdToken}`)
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

    expect(releasedRows.slice(0, 2)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ availableCount: 3, heldCount: 0 }),
        expect.objectContaining({ availableCount: 3, heldCount: 0 }),
      ]),
    );
  });

  it('rejects holds that start in the past', async () => {
    const { guest, property, unitType } = await createBookableInventoryFixture();

    const response = await createTestAgent()
      .post('/bookings/holds')
      .set('Authorization', authHeaderFor(guest.clerkId))
      .send({
        propertyId: property.id,
        unitTypeId: unitType.id,
        idempotencyKey: crypto.randomUUID(),
        startDate: format(addDays(new Date(), -2), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
        quantity: 1,
        guestDetails: [
          {
            name: 'John Doe',
            age: 30,
            idType: 'CNIC',
            idNumber: '12345-1234567-1',
            isPrimary: true,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('Validation failed');
    expect(response.body.error.details).toMatchObject({
      startDate: 'startDate must be today or a future date',
    });
  });

  it('rejects holds where guest count exceeds unit capacity', async () => {
    const { guest, property, unitType } = await createBookableInventoryFixture();

    // Assume unitType has capacity of 2
    await testPrisma.unitType.update({
      where: { id: unitType.id },
      data: { capacity: 2 },
    });

    const agent = createTestAgent();
    const response = await agent
      .post('/bookings/holds')
      .set('Authorization', authHeaderFor(guest.clerkId))
      .send({
        propertyId: property.id,
        unitTypeId: unitType.id,
        idempotencyKey: crypto.randomUUID(),
        startDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 32), 'yyyy-MM-dd'),
        quantity: 1,
        guestDetails: [
          { name: 'G1', age: 30, isPrimary: true, idType: 'CNIC', idNumber: '12345-1234567-1' },
          { name: 'G2', age: 30, idType: 'CNIC', idNumber: '12345-1234567-2' },
          { name: 'G3', age: 30, idType: 'CNIC', idNumber: '12345-1234567-3' }, // Exceeds maxGuests of 2
        ],
      });

    if (response.status !== 400 || response.body.error.message === 'Validation failed') {
      console.log('Validation Error Details:', response.body.error.details);
    }
    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('exceeds unit capacity');
  });

  it('prevents tenant staff from booking their own property as a guest', async () => {
    const { owner, property, unitType } = await createBookableInventoryFixture();

    const response = await createTestAgent()
      .post('/bookings/holds')
      .set('Authorization', authHeaderFor(owner.clerkId))
      .send({
        propertyId: property.id,
        unitTypeId: unitType.id,
        idempotencyKey: crypto.randomUUID(),
        startDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 32), 'yyyy-MM-dd'),
        quantity: 1,
        guestDetails: [
          {
            name: 'John Doe',
            age: 30,
            idType: 'CNIC',
            idNumber: '12345-1234567-1',
            isPrimary: true,
          },
        ],
      });

    expect(response.status).toBe(403);
    expect(response.body.error.message).toContain('Staff cannot book their own properties');
  });
});
