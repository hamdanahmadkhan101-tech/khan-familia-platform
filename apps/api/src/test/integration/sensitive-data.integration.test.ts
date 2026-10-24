import { spawnSync } from 'node:child_process';
import path from 'node:path';
import crypto from 'node:crypto';
import { addDays, format } from 'date-fns';
import { beforeAll, describe, expect, it, vi } from 'vitest';
vi.mock('@clerk/express', () => ({
  verifyToken: vi.fn((token: string) => Promise.resolve({ sub: token })),
}));
import { truncateTestDatabase, testPrisma } from '../database.js';
import { createBookableInventoryFixture, createTestUser } from '../helpers/fixtures.js';
import { createTestAgent } from '../helpers/http.js';
import { authHeaderFor } from '../helpers/auth.js';
import { readHoldGuestDetails, readHoldSpecialNeeds } from '../../modules/booking/hold-data.js';
import { createPaymentIntent } from '../../modules/payments/payment.service.js';
import { StripeGateway } from '../../modules/payments/stripe.gateway.js';

const guests = [
  {
    name: 'Privacy Guest',
    age: 30,
    isPrimary: true,
    idType: 'CNIC',
    idNumber: 'IDENTITY_SENTINEL_73',
  },
];
const needs = ['MEDICAL_SENTINEL_73'];
const createHold = async () => {
  const fixture = await createBookableInventoryFixture();
  const response = await createTestAgent()
    .post('/bookings/holds')
    .set('Authorization', authHeaderFor(fixture.guest.clerkId))
    .send({
      propertyId: fixture.property.id,
      unitTypeId: fixture.unitType.id,
      idempotencyKey: crypto.randomUUID(),
      startDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 32), 'yyyy-MM-dd'),
      quantity: 1,
      guestDetails: guests,
      specialNeeds: needs,
    });
  expect(response.status).toBe(201);
  const body = response.body as { holdToken: string };
  const hold = await testPrisma.propertyHold.findUniqueOrThrow({
    where: { holdToken: body.holdToken },
  });
  return { ...fixture, hold };
};

describe('sensitive temporary data with real PostgreSQL', () => {
  beforeAll(truncateTestDatabase);

  it('encrypts both payloads, returns an allowlisted owner response, rejects foreign reads and deletes on release', async () => {
    const { hold, guest } = await createHold();
    const persisted = JSON.stringify(hold);
    expect(persisted).not.toContain('IDENTITY_SENTINEL_73');
    expect(persisted).not.toContain('Privacy Guest');
    expect(persisted).not.toContain('MEDICAL_SENTINEL_73');
    expect(readHoldGuestDetails(hold.guestDetails, hold.holdToken)).toEqual(guests);
    expect(readHoldSpecialNeeds(hold.specialNeeds, hold.holdToken)).toEqual(needs);
    const response = await createTestAgent()
      .get(`/bookings/holds/${hold.holdToken}`)
      .set('Authorization', authHeaderFor(guest.clerkId));
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      hold: { holdToken: hold.holdToken, expiresAt: hold.expiresAt.toISOString() },
    });
    const stranger = await createTestUser();
    const denied = await createTestAgent()
      .get(`/bookings/holds/${hold.holdToken}`)
      .set('Authorization', authHeaderFor(stranger.clerkId));
    expect(denied.status).toBe(403);
    expect(JSON.stringify(denied.body)).not.toContain('ciphertext');
    const released = await createTestAgent()
      .delete(`/bookings/holds/${hold.holdToken}`)
      .set('Authorization', authHeaderFor(guest.clerkId));
    expect(released.status).toBe(200);
    expect(await testPrisma.propertyHold.findUnique({ where: { id: hold.id } })).toBeNull();
  });

  it('encrypts replacement data before the provider call, and prevents foreign replacement', async () => {
    const { hold, guest } = await createHold();
    const replacement = guests.map((g) => ({ ...g, idNumber: 'REPLACEMENT_SENTINEL' }));
    const provider = vi
      .spyOn(StripeGateway.prototype, 'createIntent')
      .mockImplementation(async () => {
        const stored = await testPrisma.propertyHold.findUniqueOrThrow({ where: { id: hold.id } });
        expect(JSON.stringify(stored)).not.toContain('REPLACEMENT_SENTINEL');
        expect(JSON.stringify(stored)).not.toContain('REPLACEMENT_MEDICAL');
        expect(readHoldGuestDetails(stored.guestDetails, hold.holdToken)).toEqual(replacement);
        expect(readHoldSpecialNeeds(stored.specialNeeds, hold.holdToken)).toEqual([
          'REPLACEMENT_MEDICAL',
        ]);
        return { gatewayIntentId: `pi_${crypto.randomUUID()}`, clientSecret: 'synthetic-secret' };
      });
    const stranger = await createTestUser();
    await expect(
      createPaymentIntent(hold.holdToken, stranger.id, replacement, needs),
    ).rejects.toThrow('permission');
    expect(provider).not.toHaveBeenCalled();
    await createPaymentIntent(hold.holdToken, guest.id, replacement, ['REPLACEMENT_MEDICAL']);
    expect(provider).toHaveBeenCalledOnce();
  });

  it.each([
    { label: 'unprotected', payload: guests },
    { label: 'corrupted', payload: { version: 1, ciphertext: 'CORRUPT_SENTINEL' } },
  ])('rejects $label stored data before contacting the payment provider', async ({ payload }) => {
    const { hold, guest } = await createHold();
    await testPrisma.propertyHold.update({
      where: { id: hold.id },
      data: { guestDetails: payload },
    });
    const provider = vi.spyOn(StripeGateway.prototype, 'createIntent');
    await expect(createPaymentIntent(hold.holdToken, guest.id)).rejects.toThrow(
      'Checkout details unavailable',
    );
    expect(provider).not.toHaveBeenCalled();
    expect(
      (await testPrisma.propertyHold.findUniqueOrThrow({ where: { id: hold.id } })).guestDetails,
    ).toEqual(payload);
  });

  it('uses the real worker fallback to remove expired encrypted holds and restore inventory', async () => {
    const { hold } = await createHold();
    await testPrisma.propertyHold.update({
      where: { id: hold.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const result = spawnSync(
      process.execPath,
      [
        '--import',
        'tsx',
        '--input-type=module',
        '-e',
        `
      const { prisma } = await import('./src/infrastructure/database/client.ts');
      const identity = await prisma.$queryRaw\`SELECT current_database() AS database, current_user AS role\`;
      if (identity[0].database !== 'khan_familia_test' || identity[0].role !== 'khan_familia_test') throw new Error('Unsafe test database');
      const { handleHoldCleanupCronJob } = await import('./src/jobs/hold-cleanup.job.ts');
      try { await handleHoldCleanupCronJob(); } finally { await prisma.$disconnect(); }
    `,
      ],
      {
        cwd: path.resolve(process.cwd(), '../worker'),
        env: process.env,
        encoding: 'utf8',
        timeout: 15_000,
      },
    );
    expect(result.status, result.stderr).toBe(0);
    expect(await testPrisma.propertyHold.findUnique({ where: { id: hold.id } })).toBeNull();
    const inventory = await testPrisma.unitInventory.findMany({
      where: { propertyId: hold.propertyId, date: { gte: hold.startDate, lt: hold.endDate } },
    });
    expect(inventory).toHaveLength(2);
    expect(inventory.every((row) => row.heldCount === 0 && row.availableCount === 3)).toBe(true);
  });
});
