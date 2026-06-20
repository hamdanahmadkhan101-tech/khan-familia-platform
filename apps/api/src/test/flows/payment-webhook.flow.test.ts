import { beforeEach, describe, expect, it, vi } from 'vitest';

const stripeState = vi.hoisted(() => ({
  event: undefined as unknown,
  createdPaymentIntent: {
    id: 'pi_test_created',
    client_secret: 'pi_test_created_secret',
    amount_received: 0,
    payment_method: 'pm_card_visa',
  },
}));

vi.mock('@clerk/express', () => ({
  verifyToken: vi.fn(async (token: string) => ({ sub: token })),
}));

vi.mock('../../infrastructure/stripe/client.js', () => ({
  stripe: {
    paymentIntents: {
      create: vi.fn(async () => stripeState.createdPaymentIntent),
      retrieve: vi.fn(async (id: string) => ({
        id,
        client_secret: `${id}_secret`,
      })),
    },
    webhooks: {
      constructEvent: vi.fn(() => stripeState.event),
    },
  },
}));

import { authHeaderFor } from '../helpers/auth.js';
import { truncateTestDatabase, testPrisma } from '../database.js';
import { createBookableInventoryFixture } from '../helpers/fixtures.js';
import { createTestAgent } from '../helpers/http.js';
import { createStripePaymentIntent } from '../../modules/payments/payment.service.js';

const runDbTests = process.env['RUN_DB_TESTS'] === 'true';
const describeDb = runDbTests ? describe : describe.skip;

describeDb('payment integration flow', () => {
  beforeEach(async () => {
    stripeState.event = undefined;
    stripeState.createdPaymentIntent = {
      id: 'pi_test_created',
      client_secret: 'pi_test_created_secret',
      amount_received: 0,
      payment_method: 'pm_card_visa',
    };
    await truncateTestDatabase();
  });

  const createPaidHold = async () => {
    const fixture = await createBookableInventoryFixture();
    const response = await createTestAgent()
      .post('/bookings/holds')
      .set('Authorization', authHeaderFor(fixture.guest.clerkId))
      .set('Idempotency-Key', 'payment-flow-hold')
      .send({
        propertyId: fixture.property.id,
        unitTypeId: fixture.unitType.id,
        startDate: '2026-08-01',
        endDate: '2026-08-03',
        quantity: 1,
      });

    expect(response.status).toBe(201);

    return { ...fixture, holdToken: response.body.holdToken as string };
  };

  it('reuses an existing pending payment intent for the same hold', async () => {
    const { guest, holdToken } = await createPaidHold();

    const firstIntent = await createStripePaymentIntent(holdToken, guest.id);
    const secondIntent = await createStripePaymentIntent(holdToken, guest.id);

    expect(firstIntent.paymentIntentId).toBe('pi_test_created');
    expect(secondIntent.paymentIntentId).toBe('pi_test_created');
    expect(secondIntent.clientSecret).toBe('pi_test_created_secret');

    const internalIntents = await testPrisma.paymentIntent.findMany({
      where: { bookingId: holdToken },
    });
    expect(internalIntents).toHaveLength(1);
  });

  it('converts a successful Stripe payment into a booking and deletes the hold', async () => {
    const { guest, holdToken, property, unitType } = await createPaidHold();
    await createStripePaymentIntent(holdToken, guest.id);

    stripeState.event = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_created',
          amount_received: 45_000,
          payment_method: 'pm_card_visa',
          metadata: { holdToken, userId: guest.id },
        },
      },
    };

    const webhookResponse = await createTestAgent()
      .post('/payments/webhooks/stripe')
      .set('stripe-signature', 'test-signature')
      .send(Buffer.from('{}'));

    expect(webhookResponse.status).toBe(200);
    expect(webhookResponse.body).toEqual({ received: true });

    const booking = await testPrisma.accommodationBooking.findUnique({
      where: { idempotencyKey: holdToken },
    });
    expect(booking).toMatchObject({
      userId: guest.id,
      propertyId: property.id,
      unitTypeId: unitType.id,
      status: 'BOOKED',
    });

    await expect(testPrisma.propertyHold.findUnique({ where: { holdToken } })).resolves.toBeNull();

    const paymentIntent = await testPrisma.paymentIntent.findUniqueOrThrow({
      where: { id: 'pi_test_created' },
    });
    expect(paymentIntent.status).toBe('PAID');
    expect(paymentIntent.bookingId).toBe(booking?.id);

    const paymentRecord = await testPrisma.paymentRecord.findUnique({
      where: { transactionId: 'pi_test_created' },
    });
    expect(paymentRecord).toMatchObject({ status: 'PAID', amountCaptured: 45_000 });
  });

  it('does not create duplicate bookings when Stripe retries a success webhook', async () => {
    const { guest, holdToken } = await createPaidHold();
    await createStripePaymentIntent(holdToken, guest.id);

    stripeState.event = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_created',
          amount_received: 45_000,
          payment_method: 'pm_card_visa',
          metadata: { holdToken, userId: guest.id },
        },
      },
    };

    const agent = createTestAgent();
    expect(
      await agent
        .post('/payments/webhooks/stripe')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from('{}')),
    ).toMatchObject({ status: 200 });
    expect(
      await agent
        .post('/payments/webhooks/stripe')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from('{}')),
    ).toMatchObject({ status: 200 });

    const bookings = await testPrisma.accommodationBooking.findMany({
      where: { idempotencyKey: holdToken },
    });
    expect(bookings).toHaveLength(1);
  });

  it('releases inventory and marks pending intent failed on payment failure', async () => {
    const { guest, holdToken, property, unitType } = await createPaidHold();
    await createStripePaymentIntent(holdToken, guest.id);

    stripeState.event = {
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_test_created', metadata: { holdToken } } },
    };

    const response = await createTestAgent()
      .post('/payments/webhooks/stripe')
      .set('stripe-signature', 'test-signature')
      .send(Buffer.from('{}'));

    expect(response.status).toBe(200);
    await expect(testPrisma.propertyHold.findUnique({ where: { holdToken } })).resolves.toBeNull();

    const paymentIntent = await testPrisma.paymentIntent.findUniqueOrThrow({
      where: { id: 'pi_test_created' },
    });
    expect(paymentIntent.status).toBe('FAILED');

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

  it('marks pending intents canceled when Stripe cancels payment', async () => {
    const { guest, holdToken } = await createPaidHold();
    await createStripePaymentIntent(holdToken, guest.id);

    stripeState.event = {
      type: 'payment_intent.canceled',
      data: { object: { id: 'pi_test_created', metadata: { holdToken } } },
    };

    const response = await createTestAgent()
      .post('/payments/webhooks/stripe')
      .set('stripe-signature', 'test-signature')
      .send(Buffer.from('{}'));

    expect(response.status).toBe(200);

    const paymentIntent = await testPrisma.paymentIntent.findUniqueOrThrow({
      where: { id: 'pi_test_created' },
    });
    expect(paymentIntent.status).toBe('CANCELLED');
  });
});
