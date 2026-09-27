import { BookingType, convertHoldToBookingInventory } from '@khan-familia/database';
import Stripe from 'stripe';
import { stripe } from '../../infrastructure/stripe/client.js';
import { prisma } from '../../infrastructure/database/client.js';
import { env } from '../../env.js';
import { AppError } from '../../shared/errors/AppError.js';
import { calculateNights, multiplyMoney, toMinorUnits, encrypt } from '@khan-familia/utils';
import { releaseHold } from '../inventory/inventory.service.js';
import { bookingSelect } from '../booking/booking.selectors.js';
import { PaymentGatewayFactory } from './gateway.factory.js';

/**
 * Payment Service — Provider-agnostic layer.
 *
 * All Stripe-specific code lives in this file so that adding JazzCash or
 * EasyPaisa later only requires adding a new branch here (and a new client
 * in infrastructure/), NOT touching controllers or routes.
 */

// ---------------------------------------------------------------------------
// Create Stripe PaymentIntent + internal PaymentIntent record
// ---------------------------------------------------------------------------
export const createPaymentIntent = async (
  holdToken: string,
  userId: string,
  guestDetails?: Record<string, unknown>[],
  specialNeeds?: string[],
) => {
  // 1. Look up the hold
  const hold = await prisma.propertyHold.findUnique({
    where: { holdToken },
    include: {
      unitType: {
        select: {
          id: true,
          name: true,
          defaultRate: true,
          propertyId: true,
          property: {
            select: {
              requiresApproval: true,
            },
          },
        },
      },
      tenant: {
        select: {
          currency: true,
          serviceFeePercentage: true,
          taxPercentage: true,
        },
      },
    },
  });

  if (!hold) {
    throw AppError.notFound('Hold not found or has already expired');
  }

  if (hold.userId !== userId) {
    throw AppError.forbidden('You do not have permission to pay for this hold');
  }

  if (hold.expiresAt < new Date()) {
    throw AppError.badRequest('This hold has expired. Please start a new checkout.');
  }

  // Optional: Update the hold with guest details and special needs before creating the intent
  if (guestDetails || specialNeeds) {
    await prisma.propertyHold.update({
      where: { id: hold.id },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
        ...(guestDetails ? { guestDetails: guestDetails as any } : {}),
        ...(specialNeeds ? { specialNeeds } : {}),
      },
    });

    // Mutate the local hold object so processPaymentIntentConfirmation sees them correctly
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    if (guestDetails) hold.guestDetails = guestDetails as any;
    if (specialNeeds) hold.specialNeeds = specialNeeds;
  }

  // 2. Calculate price using centralized utilities
  const nights = Math.max(1, calculateNights(hold.startDate, hold.endDate));
  const defaultBaseRate = hold.unitType.defaultRate ?? 0;

  // Calculate exact total based on UnitInventory priceOverrides
  const inventoryRows = await prisma.unitInventory.findMany({
    where: {
      propertyId: hold.propertyId,
      unitTypeId: hold.unitTypeId,
      date: {
        gte: hold.startDate,
        lt: hold.endDate,
      },
    },
    select: { priceOverride: true },
  });

  if (inventoryRows.length !== nights) {
    throw AppError.conflict(
      'Inventory records do not match the expected night count. Please try again.',
      { expected: nights, actual: inventoryRows.length },
    );
  }

  const baseTotal = inventoryRows.reduce(
    (sum, row) => sum + (row.priceOverride ?? defaultBaseRate),
    0,
  );

  const baseMinor = multiplyMoney(toMinorUnits(baseTotal), hold.quantity);
  const serviceFeeMinor = Math.round(baseMinor * ((hold.tenant.serviceFeePercentage ?? 5) / 100));
  const taxesMinor = Math.round(baseMinor * ((hold.tenant.taxPercentage ?? 0) / 100));

  const totalMinor = baseMinor + serviceFeeMinor + taxesMinor;

  const breakdown = {
    base: baseMinor,
    taxes: taxesMinor,
    fees: serviceFeeMinor,
    discount: 0,
  };

  if (totalMinor <= 0) {
    throw AppError.badRequest(
      'Cannot create a payment for a zero-value booking. Please ensure the unit type has a baseRate configured.',
    );
  }

  const reusableIntent = await prisma.paymentIntent.findFirst({
    where: {
      metadata: { path: ['holdToken'], equals: holdToken },
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  const provider = 'STRIPE'; // Default to stripe for now
  const gateway = PaymentGatewayFactory.getGateway(provider);

  if (reusableIntent) {
    const gatewayIntent = (await gateway.retrieveIntent(reusableIntent.id)) as {
      client_secret?: string;
      clientSecret?: string;
    };

    return {
      clientSecret: gatewayIntent.client_secret || gatewayIntent.clientSecret || '',
      paymentIntentId: reusableIntent.id,
      amount: reusableIntent.amount,
      currency: reusableIntent.currency,
      expiresAt: reusableIntent.expiresAt,
    };
  }

  // 3. Create Gateway PaymentIntent
  const gatewayIntent = await gateway.createIntent({
    amountMinor: totalMinor, // Gateway uses smallest currency unit
    currency: 'pkr',
    captureMethod: hold.unitType.property.requiresApproval ? 'manual' : 'automatic',
    metadata: {
      holdToken,
      userId,
      tenantId: hold.tenantId,
      propertyId: hold.propertyId,
      unitTypeId: hold.unitTypeId,
      nights: nights.toString(),
      breakdown: JSON.stringify(breakdown),
    },
  });

  // 4. Persist an internal PaymentIntent record so we can reconcile webhooks
  const internalIntent = await prisma.paymentIntent.create({
    data: {
      id: gatewayIntent.gatewayIntentId, // use Gateway's ID as our PK for easy lookup
      tenantId: hold.tenantId,
      bookingType: BookingType.ACCOMMODATION,
      amount: totalMinor,
      currency: hold.tenant.currency,
      provider: provider,
      expiresAt: hold.expiresAt,
      metadata: { holdToken, breakdown },
    },
  });

  return {
    clientSecret: gatewayIntent.clientSecret,
    paymentIntentId: internalIntent.id,
    amount: totalMinor,
    currency: hold.tenant.currency,
    expiresAt: hold.expiresAt,
  };
};

// ---------------------------------------------------------------------------
// processPaymentIntentConfirmation — sub-functions
//
// Each function handles exactly one concern within the booking creation
// transaction. All accept `tx` (the transaction client) so they participate
// in the same atomic unit.
// ---------------------------------------------------------------------------

type HoldWithUnitType = {
  id: string;
  tenantId: string;
  propertyId: string;
  unitTypeId: string;
  startDate: Date;
  endDate: Date;
  quantity: number;
  guestDetails: unknown;
  specialNeeds: unknown;
  unitType: { defaultRate: number | null; propertyId: string };
};

type BookingStatusTuple = {
  bookingStatus: 'BOOKED' | 'CONFIRMED';
  paymentStatus: 'PENDING' | 'PAID';
};

/** Derive booking/payment status from the Stripe intent status. */
const deriveStatuses = (stripeStatus: Stripe.PaymentIntent['status']): BookingStatusTuple => {
  const isCapturable = stripeStatus === 'requires_capture';
  return {
    bookingStatus: isCapturable ? 'BOOKED' : 'CONFIRMED',
    paymentStatus: isCapturable ? 'PENDING' : 'PAID',
  };
};

/** Step 1 inside transaction: create the AccommodationBooking record. */
const createBookingRecord = async (
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  hold: HoldWithUnitType,
  userId: string,
  nights: number,
  bookingStatus: 'BOOKED' | 'CONFIRMED',
  holdToken: string,
) => {
  const finalGuestCount =
    hold.guestDetails && Array.isArray(hold.guestDetails)
      ? hold.guestDetails.length
      : hold.quantity;

  return tx.accommodationBooking.create({
    data: {
      userId,
      propertyId: hold.unitType.propertyId,
      unitTypeId: hold.unitTypeId,
      tenantId: hold.tenantId,
      checkIn: hold.startDate,
      checkOut: hold.endDate,
      nights,
      guests: finalGuestCount,
      unitQuantity: hold.quantity,
      status: bookingStatus,
      idempotencyKey: holdToken,
      ...(bookingStatus === 'CONFIRMED' ? { confirmedAt: new Date() } : {}),
    },
  });
};

/** Step 2 inside transaction: link inventory rows to the new booking via Reservation records. */
const createReservations = async (
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  hold: HoldWithUnitType,
  bookingId: string,
) => {
  const inventoryRows = await tx.unitInventory.findMany({
    where: {
      propertyId: hold.unitType.propertyId,
      unitTypeId: hold.unitTypeId,
      date: { gte: hold.startDate, lt: hold.endDate },
    },
    select: { id: true, date: true },
  });

  if (inventoryRows.length > 0) {
    await tx.reservation.createMany({
      data: inventoryRows.map((row) => ({
        bookingId,
        unitInventoryId: row.id,
        date: row.date,
      })),
    });
  }
};

const createPriceSnapshot = async (
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  bookingId: string,
  /** The authoritative total in minor units — taken from Stripe's settled amount. */
  chargedMinor: number,
  currency: string,
  breakdown?: { base: number; taxes: number; fees: number; discount: number },
) => {
  await tx.bookingPriceSnapshot.create({
    data: {
      accommodationBookingId: bookingId,
      currency,
      totalMinor: chargedMinor,
      breakdown: breakdown ?? {
        base: chargedMinor,
        taxes: 0,
        fees: 0,
        discount: 0,
      },
    },
  });
};

/** Step 4 inside transaction: create the PaymentRecord linked to the Stripe intent. */
const createPaymentRecord = async (
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  stripeIntent: Stripe.PaymentIntent,
  paymentStatus: 'PAID' | 'PENDING',
  currency: string,
) => {
  await tx.paymentRecord.create({
    data: {
      paymentIntentId: stripeIntent.id,
      transactionId: stripeIntent.id,
      amountCaptured: stripeIntent.amount_received || stripeIntent.amount_capturable || 0,
      currency,
      status: paymentStatus,
      ...(stripeIntent.payment_method
        ? { paymentMethod: { id: stripeIntent.payment_method as string } }
        : {}),
    },
  });
};

/** Step 5 inside transaction: encrypt and persist guest PII. */
const createBookingGuests = async (
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  bookingId: string,
  guestDetails: unknown,
) => {
  if (!guestDetails) return;
  if (!Array.isArray(guestDetails)) {
    throw AppError.internal('Corrupted guest details: expected an array');
  }

  const encryptionKey = env.ENCRYPTION_KEY;

  await tx.bookingGuest.createMany({
    data: (guestDetails as Record<string, unknown>[]).map((guest) => {
      const g = guest as Record<string, string | number | boolean>;
      return {
        bookingId,
        isPrimary: Boolean(g['isPrimary']),
        name: String(g['name']),
        age: Number(g['age']),
        idType: String(g['idType']),
        idNumber: g['idNumber'] ? encrypt(String(g['idNumber']), encryptionKey) : null,
      };
    }),
  });
};

/** Step 6 inside transaction: persist free-text special requests. */
const createSpecialRequests = async (
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  bookingId: string,
  specialNeeds: unknown,
) => {
  if (!specialNeeds) return;
  if (!Array.isArray(specialNeeds)) {
    throw AppError.internal('Corrupted special needs: expected an array');
  }

  await tx.bookingSpecialRequest.createMany({
    data: (specialNeeds as string[]).map((need) => ({
      bookingId,
      text: String(need),
    })),
  });
};

/** Step 7 inside transaction: clean up the hold and finalise PaymentIntent status. */
const finaliseHoldAndIntent = async (
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  holdId: string,
  stripeIntentId: string,
  bookingId: string,
  paymentStatus: 'PAID' | 'PENDING',
) => {
  await tx.propertyHold.delete({ where: { id: holdId } });

  await tx.paymentIntent.update({
    where: { id: stripeIntentId },
    data: { accommodationBookingId: bookingId, status: paymentStatus },
  });
};

// ---------------------------------------------------------------------------
// processPaymentIntentConfirmation — orchestrator (called by webhook + confirm)
// ---------------------------------------------------------------------------

export const processPaymentIntentConfirmation = async (stripeIntent: Stripe.PaymentIntent) => {
  const { holdToken, userId } = stripeIntent.metadata;

  if (!holdToken || !userId) {
    return null;
  }

  // Idempotency check: if booking already exists for this holdToken, return it
  const existing = await prisma.accommodationBooking.findFirst({
    where: { idempotencyKey: holdToken },
  });

  if (existing) {
    // Ensure payment records reflect the latest Stripe status on repeated calls
    if (stripeIntent.status === 'succeeded') {
      await prisma.paymentRecord.updateMany({
        where: { paymentIntentId: stripeIntent.id },
        data: {
          status: 'PAID',
          amountCaptured: stripeIntent.amount_received,
        },
      });
      await prisma.paymentIntent.updateMany({
        where: { id: stripeIntent.id },
        data: { status: 'PAID' },
      });
    }
    return existing;
  }

  const hold = await prisma.propertyHold.findUnique({
    where: { holdToken },
    include: {
      unitType: { select: { defaultRate: true, propertyId: true } },
      tenant: { select: { currency: true } },
    },
  });

  if (!hold) {
    // The hold expired and was cleaned up by the worker, but the user paid.
    // We must refund or cancel the intent to prevent silent charges.
    try {
      if (stripeIntent.status === 'succeeded') {
        await refundPaymentIntent(
          stripeIntent.id,
          undefined,
          'Hold expired before payment completed',
        );
      } else if (stripeIntent.status === 'requires_capture') {
        await cancelPaymentIntent(stripeIntent.id);
      }
    } catch (err) {
      console.error('Failed to refund/cancel orphaned payment intent:', err);
      // Throw error so Stripe automatically retries the webhook with exponential backoff
      throw AppError.internal(
        'Failed to remediate orphaned payment, throwing to trigger Stripe webhook retry',
      );
    }
    // Only return null if the refund/cancel succeeded, confirming we safely handled the orphan
    return null;
  }

  const nights = Math.max(1, calculateNights(hold.startDate, hold.endDate));
  const { bookingStatus, paymentStatus } = deriveStatuses(stripeIntent.status);

  const chargedMinor =
    stripeIntent.amount_received || stripeIntent.amount_capturable || stripeIntent.amount || 0;
  let breakdownObj: { base: number; taxes: number; fees: number; discount: number } | undefined;
  try {
    const breakdownStr = stripeIntent.metadata['breakdown'];
    breakdownObj = breakdownStr
      ? (JSON.parse(breakdownStr) as {
          base: number;
          taxes: number;
          fees: number;
          discount: number;
        })
      : undefined;
  } catch {
    // Ignore parse error
  }

  return prisma.$transaction(async (tx) => {
    const booking = await createBookingRecord(tx, hold, userId, nights, bookingStatus, holdToken);

    // Standardize lock order: PropertyHold must be locked/deleted BEFORE UnitInventory
    // to prevent cross-table deadlocks with the hold-expiry worker.
    await finaliseHoldAndIntent(tx, hold.id, stripeIntent.id, booking.id, paymentStatus);

    await convertHoldToBookingInventory(tx, {
      propertyId: hold.propertyId,
      unitTypeId: hold.unitTypeId,
      tenantId: hold.tenantId,
      startDate: hold.startDate,
      endDate: hold.endDate,
      quantity: hold.quantity,
    });

    await createReservations(tx, hold, booking.id);
    await createPriceSnapshot(tx, booking.id, chargedMinor, hold.tenant.currency, breakdownObj);
    await createPaymentRecord(tx, stripeIntent, paymentStatus, hold.tenant.currency);
    await createBookingGuests(tx, booking.id, hold.guestDetails);
    await createSpecialRequests(tx, booking.id, hold.specialNeeds);

    return booking;
  });
};

// ---------------------------------------------------------------------------
// confirmStripePaymentIntent — default confirmation mechanism
// Called by the frontend after Stripe redirect (not relying solely on webhook)
// ---------------------------------------------------------------------------
export const confirmStripePaymentIntent = async (paymentIntentId: string, userId: string) => {
  const stripeIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (!['succeeded', 'requires_capture'].includes(stripeIntent.status)) {
    throw AppError.badRequest(`Payment has not been completed (Status: ${stripeIntent.status})`);
  }

  if (stripeIntent.metadata['userId'] && stripeIntent.metadata['userId'] !== userId) {
    throw AppError.forbidden('You do not have permission to confirm this payment');
  }

  const booking = await processPaymentIntentConfirmation(stripeIntent);
  if (!booking) {
    throw AppError.badRequest('Booking hold expired or payment details mismatch');
  }

  const hydratedBooking = await prisma.accommodationBooking.findUnique({
    where: { id: booking.id },
    select: bookingSelect,
  });

  if (!hydratedBooking) {
    throw AppError.internal('Could not retrieve confirmed booking details');
  }

  return hydratedBooking;
};

// ---------------------------------------------------------------------------
// Handle Stripe webhook event — converts hold → confirmed AccommodationBooking
// ---------------------------------------------------------------------------
export const handleStripeWebhookEvent = async (rawBody: Buffer, signature: string) => {
  const gateway = PaymentGatewayFactory.getGateway('STRIPE');
  let event;

  try {
    event = gateway.parseWebhookEvent(signature, rawBody);
  } catch {
    throw AppError.badRequest('Invalid Stripe webhook signature');
  }

  const rawEvent = event.rawEvent as Stripe.Event;

  const existingEvent = await prisma.processedEvent.findUnique({
    where: { eventId: rawEvent.id },
  });
  if (existingEvent) {
    return { received: true };
  }

  const isSucceeded = event.type === 'payment_intent.succeeded';
  const isCapturable = event.type === 'payment_intent.amount_capturable_updated';

  if (isSucceeded || isCapturable) {
    const stripeIntent = rawEvent.data.object as Stripe.PaymentIntent;
    await processPaymentIntentConfirmation(stripeIntent);
  }

  if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
    const stripeIntent = rawEvent.data.object as Stripe.PaymentIntent;
    const { holdToken } = stripeIntent.metadata;

    if (holdToken) {
      const paymentStatus = event.type === 'payment_intent.canceled' ? 'CANCELLED' : 'FAILED';

      try {
        await releaseHold(holdToken);
      } catch (error) {
        if (!(error instanceof AppError && error.code === 'NOT_FOUND')) {
          throw error;
        }
      }

      await prisma.paymentIntent.updateMany({
        where: { id: stripeIntent.id, status: 'PENDING' },
        data: { status: paymentStatus },
      });
    }
  }

  await prisma.processedEvent.create({
    data: { eventId: rawEvent.id, type: event.type },
  });

  return { received: true };
};

// ---------------------------------------------------------------------------
// Payment intent lifecycle operations (Provider-Agnostic)
// ---------------------------------------------------------------------------

export const capturePaymentIntent = async (paymentIntentId: string) => {
  const intent = await prisma.paymentIntent.findUnique({
    where: { id: paymentIntentId },
    select: { provider: true },
  });
  if (!intent?.provider) throw AppError.notFound('Payment intent or provider not found');
  const gateway = PaymentGatewayFactory.getGateway(intent.provider);
  if (gateway.confirmIntent) {
    await gateway.confirmIntent(paymentIntentId);
  }
};

export const cancelPaymentIntent = async (paymentIntentId: string) => {
  const intent = await prisma.paymentIntent.findUnique({
    where: { id: paymentIntentId },
    select: { provider: true },
  });
  if (!intent?.provider) throw AppError.notFound('Payment intent or provider not found');
  const gateway = PaymentGatewayFactory.getGateway(intent.provider);
  if (gateway.cancelIntent) {
    await gateway.cancelIntent(paymentIntentId);
  }
};

export const refundPaymentIntent = async (
  paymentIntentId: string,
  amountMinor?: number,
  reason?: string,
) => {
  const intent = await prisma.paymentIntent.findUnique({
    where: { id: paymentIntentId },
    select: { provider: true },
  });
  if (!intent?.provider) throw AppError.notFound('Payment intent or provider not found');
  const gateway = PaymentGatewayFactory.getGateway(intent.provider);
  if (gateway.refundIntent) {
    await gateway.refundIntent({
      intentId: paymentIntentId,
      ...(amountMinor !== undefined && { amountMinor }),
      ...(reason !== undefined && { reason }),
    });
  }
};
