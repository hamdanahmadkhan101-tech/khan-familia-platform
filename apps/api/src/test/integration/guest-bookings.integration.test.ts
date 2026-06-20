import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/express', () => ({
  verifyToken: vi.fn(async (token: string) => ({ sub: token })),
}));

import { truncateTestDatabase, testPrisma } from '../database.js';
import { authHeaderFor } from '../helpers/auth.js';
import {
  createBookableInventoryFixture,
  createInventoryRange,
  createTestProperty,
  createTestTenant,
  createTestUnitType,
  createTestUser,
  testDate,
} from '../helpers/fixtures.js';
import { createTestAgent } from '../helpers/http.js';

const runDbTests = process.env['RUN_DB_TESTS'] === 'true';
const describeDb = runDbTests ? describe : describe.skip;

const createConfirmedBookingFixture = async () => {
  const fixture = await createBookableInventoryFixture();

  await testPrisma.unitInventory.updateMany({
    where: {
      propertyId: fixture.property.id,
      unitTypeId: fixture.unitType.id,
      date: { gte: testDate('2026-08-01'), lte: testDate('2026-08-03') },
    },
    data: {
      availableCount: { decrement: 1 },
      bookedCount: { increment: 1 },
    },
  });

  const booking = await testPrisma.accommodationBooking.create({
    data: {
      userId: fixture.guest.id,
      propertyId: fixture.property.id,
      unitTypeId: fixture.unitType.id,
      tenantId: fixture.tenant.id,
      checkIn: testDate('2026-08-01'),
      checkOut: testDate('2026-08-03'),
      nights: 3,
      guests: 1,
      status: 'BOOKED',
      confirmedAt: new Date(),
      idempotencyKey: 'guest-booking-test-key',
      BookingPriceSnapshot: {
        create: {
          currency: 'PKR',
          totalMinor: 45_000,
          breakdown: { base: 45_000, taxes: 0, fees: 0, discount: 0 },
        },
      },
    },
  });

  await testPrisma.paymentIntent.create({
    data: {
      id: 'pi_guest_booking_test',
      tenantId: fixture.tenant.id,
      bookingType: 'ACCOMMODATION',
      bookingId: booking.id,
      amount: 45_000,
      currency: 'PKR',
      provider: 'STRIPE',
      status: 'PAID',
      records: {
        create: {
          transactionId: 'pi_guest_booking_test',
          amountCaptured: 45_000,
          currency: 'PKR',
          status: 'PAID',
        },
      },
    },
  });

  return { ...fixture, booking };
};

describeDb('guest booking management', () => {
  beforeEach(async () => {
    await truncateTestDatabase();
  });

  it('lists bookings owned by the authenticated guest', async () => {
    const { guest, booking } = await createConfirmedBookingFixture();

    const response = await createTestAgent()
      .get('/bookings/me?scope=all')
      .set('Authorization', authHeaderFor(guest.clerkId));

    expect(response.status).toBe(200);
    expect(response.body.bookings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: booking.id,
          status: 'BOOKED',
          property: expect.objectContaining({ name: expect.any(String) }),
          BookingPriceSnapshot: expect.objectContaining({ totalMinor: 45_000 }),
        }),
      ]),
    );
  });

  it('returns one booking with payment context for the owning guest', async () => {
    const { guest, booking } = await createConfirmedBookingFixture();

    const response = await createTestAgent()
      .get(`/bookings/${booking.id}`)
      .set('Authorization', authHeaderFor(guest.clerkId));

    expect(response.status).toBe(200);
    expect(response.body.booking).toMatchObject({
      id: booking.id,
      status: 'BOOKED',
      paymentIntents: [
        expect.objectContaining({
          id: 'pi_guest_booking_test',
          status: 'PAID',
          records: [expect.objectContaining({ amountCaptured: 45_000 })],
        }),
      ],
    });
  });

  it('does not expose another guest booking', async () => {
    const { booking } = await createConfirmedBookingFixture();
    const otherGuest = await createTestUser({ clerkId: 'other-guest-clerk' });

    const response = await createTestAgent()
      .get(`/bookings/${booking.id}`)
      .set('Authorization', authHeaderFor(otherGuest.clerkId));

    expect(response.status).toBe(404);
  });

  it('cancels an owned booking and restores inventory', async () => {
    const { guest, booking, property, unitType } = await createConfirmedBookingFixture();

    const response = await createTestAgent()
      .post(`/bookings/${booking.id}/cancel`)
      .set('Authorization', authHeaderFor(guest.clerkId))
      .send({ reason: 'Travel plans changed' });

    expect(response.status).toBe(200);
    expect(response.body.booking).toMatchObject({
      id: booking.id,
      status: 'CANCELLED',
      cancellationReason: 'Travel plans changed',
    });

    const history = await testPrisma.accommodationBookingStatusHistory.findMany({
      where: { bookingId: booking.id },
    });
    expect(history).toEqual([
      expect.objectContaining({
        oldStatus: 'BOOKED',
        newStatus: 'CANCELLED',
        changedById: guest.id,
        reason: 'Travel plans changed',
      }),
    ]);

    const inventoryRows = await testPrisma.unitInventory.findMany({
      where: { propertyId: property.id, unitTypeId: unitType.id },
      orderBy: { date: 'asc' },
    });
    expect(inventoryRows.slice(0, 3)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ availableCount: 3, bookedCount: 0 }),
        expect.objectContaining({ availableCount: 3, bookedCount: 0 }),
        expect.objectContaining({ availableCount: 3, bookedCount: 0 }),
      ]),
    );
  });

  it('rejects guest cancellation after check-in', async () => {
    const { guest, booking } = await createConfirmedBookingFixture();
    await testPrisma.accommodationBooking.update({
      where: { id: booking.id },
      data: { status: 'CHECKED_IN', checkedInAt: new Date() },
    });

    const response = await createTestAgent()
      .post(`/bookings/${booking.id}/cancel`)
      .set('Authorization', authHeaderFor(guest.clerkId))
      .send({ reason: 'Too late' });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toContain('CHECKED_IN');
  });

  it('filters cancelled bookings for the guest', async () => {
    const { guest, booking } = await createConfirmedBookingFixture();
    await testPrisma.accommodationBooking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED', cancellationDate: new Date(), cancellationReason: 'Changed' },
    });

    const owner = await createTestUser({ clerkId: 'second-owner-clerk' });
    const tenant = await createTestTenant(owner.id);
    const property = await createTestProperty(tenant.id);
    const unitType = await createTestUnitType(tenant.id, property.id);
    await createInventoryRange({
      tenantId: tenant.id,
      propertyId: property.id,
      unitTypeId: unitType.id,
      startDate: '2026-09-01',
      endDate: '2026-09-03',
    });
    await testPrisma.accommodationBooking.create({
      data: {
        userId: guest.id,
        propertyId: property.id,
        unitTypeId: unitType.id,
        tenantId: tenant.id,
        checkIn: testDate('2026-09-01'),
        checkOut: testDate('2026-09-03'),
        nights: 3,
        guests: 1,
        status: 'BOOKED',
      },
    });

    const response = await createTestAgent()
      .get('/bookings/me?scope=cancelled')
      .set('Authorization', authHeaderFor(guest.clerkId));

    expect(response.status).toBe(200);
    expect(response.body.bookings).toHaveLength(1);
    expect(response.body.bookings[0]).toMatchObject({ id: booking.id, status: 'CANCELLED' });
  });
});
