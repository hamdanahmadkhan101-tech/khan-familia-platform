import { addDays, format } from 'date-fns';
import crypto from 'node:crypto';
import type Stripe from 'stripe';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

type PaymentIntentFixture = Pick<
  Stripe.PaymentIntent,
  | 'id'
  | 'amount'
  | 'amount_received'
  | 'amount_capturable'
  | 'currency'
  | 'metadata'
  | 'payment_method'
  | 'status'
> & { client_secret: string };

type PaymentEventFixture = {
  id: string;
  type: 'payment_intent.succeeded' | 'payment_intent.payment_failed' | 'payment_intent.canceled';
  data: { object: PaymentIntentFixture };
};

const stripeState = vi.hoisted(() => ({
  event: undefined as PaymentEventFixture | undefined,
  createdPaymentIntent: {
    id: 'pi_test_created',
    client_secret: 'pi_test_created_secret',
    amount: 45_000,
    amount_received: 0,
    amount_capturable: 0,
    currency: 'pkr',
    metadata: {},
    payment_method: 'pm_card_visa',
    status: 'requires_payment_method',
  } satisfies PaymentIntentFixture,
}));

const createPaymentEvent = (
  type: PaymentEventFixture['type'],
  holdToken: string,
  userId: string,
): PaymentEventFixture => {
  const statuses = {
    'payment_intent.succeeded': 'succeeded',
    'payment_intent.payment_failed': 'requires_payment_method',
    'payment_intent.canceled': 'canceled',
  } as const;

  return {
    id: `evt_test_${crypto.randomUUID()}`,
    type,
    data: {
      object: {
        ...stripeState.createdPaymentIntent,
        status: statuses[type],
        amount_received: type === 'payment_intent.succeeded' ? 45_000 : 0,
        metadata: { holdToken, userId },
      },
    },
  };
};

vi.mock('@clerk/express', () => ({
  verifyToken: vi.fn((token: string) => Promise.resolve({ sub: token })),
}));

import { StripeGateway } from '../../modules/payments/stripe.gateway.js';

import { authHeaderFor } from '../helpers/auth.js';
import { truncateTestDatabase, testPrisma } from '../database.js';
import { createBookableInventoryFixture } from '../helpers/fixtures.js';
import { createTestAgent } from '../helpers/http.js';
import { createPaymentIntent } from '../../modules/payments/payment.service.js';

describe('payment integration flow', () => {
  beforeAll(async () => {
    await truncateTestDatabase();
  });

  beforeEach(() => {
    const id = `pi_test_created_${crypto.randomUUID()}`;
    stripeState.event = undefined;
    stripeState.createdPaymentIntent = {
      ...stripeState.createdPaymentIntent,
      id,
      client_secret: `${id}_secret`,
      amount_received: 0,
      payment_method: 'pm_card_visa',
    };

    vi.spyOn(StripeGateway.prototype, 'createIntent').mockImplementation((req) =>
      Promise.resolve({
        gatewayIntentId: stripeState.createdPaymentIntent.id,
        clientSecret: stripeState.createdPaymentIntent.client_secret,
        metadata: req.metadata,
        amount: req.amountMinor,
        currency: req.currency,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      }),
    );
    vi.spyOn(StripeGateway.prototype, 'retrieveIntent').mockImplementation(() =>
      Promise.resolve(stripeState.createdPaymentIntent as Stripe.PaymentIntent),
    );
    vi.spyOn(StripeGateway.prototype, 'confirmIntent').mockImplementation(async () => {});
    vi.spyOn(StripeGateway.prototype, 'cancelIntent').mockImplementation(async () => {});
    vi.spyOn(StripeGateway.prototype, 'parseWebhookEvent').mockImplementation(() => {
      const e = stripeState.event;
      if (!e) throw new Error('Set a Stripe event fixture before delivering a webhook');
      const obj = e.data.object;
      return {
        type: e.type,
        intentId: obj.id,
        amountCaptured: obj.amount_received || 0,
        metadata: obj.metadata || {},
        status:
          obj.status === 'succeeded'
            ? 'succeeded'
            : obj.status === 'canceled'
              ? 'canceled'
              : 'failed',
        rawEvent: e,
      };
    });
  });

  const createPaidHold = async () => {
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
    const body = response.body as { holdToken: string };

    return { ...fixture, holdToken: body.holdToken };
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

    stripeState.event = createPaymentEvent('payment_intent.succeeded', holdToken, guest.id);

    const webhookResponse = await createTestAgent()
      .post('/payments/webhooks/stripe')
      .set('stripe-signature', 'test-signature')
      .send(Buffer.from('{}'));

    if (webhookResponse.status !== 200) {
      throw new Error(`Webhook failed: ${JSON.stringify(webhookResponse.body)}`);
    }
    const body = webhookResponse.body as { received: boolean };
    expect(webhookResponse.status).toBe(200);
    expect(body).toEqual({ received: true });

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

    stripeState.event = createPaymentEvent('payment_intent.succeeded', holdToken, guest.id);

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

    stripeState.event = createPaymentEvent('payment_intent.payment_failed', holdToken, guest.id);

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

    stripeState.event = createPaymentEvent('payment_intent.canceled', holdToken, guest.id);

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

  it('retries a failed orphan refund, then deduplicates the successful event', async () => {
    const { guest, holdToken } = await createPaidHold();
    await createPaymentIntent(holdToken, guest.id);

    // The refund branch needs an absent hold; this test isolates refund retry behavior.
    await testPrisma.propertyHold.delete({ where: { holdToken } });

    const refundSpy = vi
      .spyOn(StripeGateway.prototype, 'refundIntent')
      .mockRejectedValueOnce(new Error('Stripe API Network Error'))
      .mockResolvedValue(undefined);

    stripeState.event = createPaymentEvent('payment_intent.succeeded', holdToken, guest.id);
    const eventId = stripeState.event.id;
    const deliverEvent = () =>
      createTestAgent()
        .post('/payments/webhooks/stripe')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from('{}'));

    // A failed refund must remain retryable, rather than recording the event as processed.
    const failedResponse = await deliverEvent();
    expect(failedResponse.status).toBe(500);
    expect(refundSpy).toHaveBeenCalledTimes(1);
    await expect(testPrisma.processedEvent.findUnique({ where: { eventId } })).resolves.toBeNull();

    // Retry the same event successfully, then acknowledge its duplicate without refunding again.
    const retryResponse = await deliverEvent();
    expect(retryResponse.status).toBe(200);
    expect(refundSpy).toHaveBeenCalledTimes(2);
    expect(refundSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ intentId: stripeState.createdPaymentIntent.id }),
    );
    await expect(
      testPrisma.processedEvent.findUnique({ where: { eventId } }),
    ).resolves.toMatchObject({ eventId, type: 'payment_intent.succeeded' });

    const duplicateResponse = await deliverEvent();
    expect(duplicateResponse.status).toBe(200);
    expect(refundSpy).toHaveBeenCalledTimes(2);
    await expect(
      testPrisma.accommodationBooking.findUnique({ where: { idempotencyKey: holdToken } }),
    ).resolves.toBeNull();
  });
});
