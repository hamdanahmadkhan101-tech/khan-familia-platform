import { addDays, format } from 'date-fns';
import crypto from 'node:crypto';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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

import type Stripe from 'stripe';
import { StripeGateway } from '../../modules/payments/stripe.gateway.js';

import { authHeaderFor } from '../helpers/auth.js';
import { truncateTestDatabase, testPrisma } from '../database.js';
import { createBookableInventoryFixture } from '../helpers/fixtures.js';
import { createTestAgent } from '../helpers/http.js';
import { createPaymentIntent } from '../../modules/payments/payment.service.js';
import type { WebhookEventPayload } from '../../modules/payments/gateway.interface.js';

const runDbTests = process.env['RUN_DB_TESTS'] === 'true';
const describeDb = runDbTests ? describe : describe.skip;

describeDb('payment integration flow', () => {
  beforeAll(async () => {
    await truncateTestDatabase();
  });

  beforeEach(() => {
    const id = `pi_test_created_${crypto.randomUUID()}`;
    stripeState.event = undefined;
    stripeState.createdPaymentIntent = {
      id,
      client_secret: `${id}_secret`,
      amount_received: 0,
      payment_method: 'pm_card_visa',
    };

    vi.spyOn(StripeGateway.prototype, 'createIntent').mockImplementation(async (req) => ({
      gatewayIntentId: stripeState.createdPaymentIntent.id,
      clientSecret: stripeState.createdPaymentIntent.client_secret,
      metadata: req.metadata,
      amount: req.amountMinor,
      currency: req.currency,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    }));
    vi.spyOn(StripeGateway.prototype, 'retrieveIntent').mockImplementation(
      async () => stripeState.createdPaymentIntent as unknown as Stripe.PaymentIntent,
    );
    vi.spyOn(StripeGateway.prototype, 'confirmIntent').mockImplementation(async () => {});
    vi.spyOn(StripeGateway.prototype, 'cancelIntent').mockImplementation(async () => {});
    vi.spyOn(StripeGateway.prototype, 'parseWebhookEvent').mockImplementation(() => {
      const e = stripeState.event as unknown as Stripe.Event;
      const obj = e.data.object as unknown as Stripe.PaymentIntent;
      return {
        type: e.type,
        intentId: obj.id,
        amountCaptured: obj.amount_received || 0,
        metadata: obj.metadata || {},
        status: e.type === 'payment_intent.succeeded' ? 'succeeded' : 'failed',
        rawEvent: e, // Add this so event.rawEvent is defined
      } as WebhookEventPayload;
    });
  });

  const createPaidHold = async () => {
    const fixture = await createBookableInventoryFixture();
    const response = await createTestAgent()
      .post('/bookings/holds')
      .set('Authorization', authHeaderFor(fixture.guest.clerkId))
      .set('Idempotency-Key', `payment-flow-hold-${crypto.randomUUID()}`)
      .send({
        propertyId: fixture.property.id,
        unitTypeId: fixture.unitType.id,
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

    if (response.status !== 201) console.log('HOLD ERROR', response.body);
    expect(response.status).toBe(201);

    return { ...fixture, holdToken: response.body.holdToken as string };
  };

  it('reuses an existing pending payment intent for the same hold', async () => {
    const { guest, holdToken } = await createPaidHold();

    const firstIntent = await createPaymentIntent(holdToken, guest.id);
    const secondIntent = await createPaymentIntent(holdToken, guest.id);

    expect(firstIntent.paymentIntentId).toBe(stripeState.createdPaymentIntent.id);
    expect(secondIntent.paymentIntentId).toBe(stripeState.createdPaymentIntent.id);
    expect(secondIntent.clientSecret).toBe(`${stripeState.createdPaymentIntent.id}_secret`);

    const internalIntents = await testPrisma.paymentIntent.findMany({
      where: { metadata: { path: ['holdToken'], equals: holdToken } },
    });
    expect(internalIntents).toHaveLength(1);
  });

  it('converts a successful Stripe payment into a booking and deletes the hold', async () => {
    const { guest, holdToken, property, unitType } = await createPaidHold();
    await createPaymentIntent(holdToken, guest.id);

    stripeState.event = {
      id: `evt_test_${crypto.randomUUID()}`,
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: stripeState.createdPaymentIntent.id,
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

    if (webhookResponse.status !== 200) console.log('WEBHOOK 500 ERROR:', webhookResponse.body);
    expect(webhookResponse.status).toBe(200);
    expect(webhookResponse.body).toEqual({ received: true });

    const booking = await testPrisma.accommodationBooking.findUnique({
      where: { idempotencyKey: holdToken },
    });
    expect(booking).toMatchObject({
      userId: guest.id,
      propertyId: property.id,
      unitTypeId: unitType.id,
      status: 'CONFIRMED',
    });

    await expect(testPrisma.propertyHold.findUnique({ where: { holdToken } })).resolves.toBeNull();

    const paymentIntent = await testPrisma.paymentIntent.findUniqueOrThrow({
      where: { id: stripeState.createdPaymentIntent.id },
    });
    expect(paymentIntent.status).toBe('PAID');
    expect(paymentIntent.accommodationBookingId).toBe(booking?.id);

    const paymentRecord = await testPrisma.paymentRecord.findUnique({
      where: { transactionId: stripeState.createdPaymentIntent.id },
    });
    expect(paymentRecord).toMatchObject({ status: 'PAID', amountCaptured: 45_000 });
  });

  it('does not create duplicate bookings when Stripe retries a success webhook', async () => {
    const { guest, holdToken } = await createPaidHold();
    await createPaymentIntent(holdToken, guest.id);

    stripeState.event = {
      id: `evt_test_${crypto.randomUUID()}`,
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: stripeState.createdPaymentIntent.id,
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
    await createPaymentIntent(holdToken, guest.id);

    stripeState.event = {
      id: `evt_test_${crypto.randomUUID()}`,
      type: 'payment_intent.payment_failed',
      data: { object: { id: stripeState.createdPaymentIntent.id, metadata: { holdToken } } },
    };

    const response = await createTestAgent()
      .post('/payments/webhooks/stripe')
      .set('stripe-signature', 'test-signature')
      .send(Buffer.from('{}'));

    expect(response.status).toBe(200);
    await expect(testPrisma.propertyHold.findUnique({ where: { holdToken } })).resolves.toBeNull();

    const paymentIntent = await testPrisma.paymentIntent.findUniqueOrThrow({
      where: { id: stripeState.createdPaymentIntent.id },
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
    await createPaymentIntent(holdToken, guest.id);

    stripeState.event = {
      id: `evt_test_${crypto.randomUUID()}`,
      type: 'payment_intent.canceled',
      data: { object: { id: stripeState.createdPaymentIntent.id, metadata: { holdToken } } },
    };

    const response = await createTestAgent()
      .post('/payments/webhooks/stripe')
      .set('stripe-signature', 'test-signature')
      .send(Buffer.from('{}'));

    expect(response.status).toBe(200);

    const paymentIntent = await testPrisma.paymentIntent.findUniqueOrThrow({
      where: { id: stripeState.createdPaymentIntent.id },
    });
    expect(paymentIntent.status).toBe('CANCELLED');
  });
});
