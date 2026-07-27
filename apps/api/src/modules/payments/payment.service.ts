import { BookingType } from '@khan-familia/database';
import Stripe from 'stripe';
import { stripe } from '../../infrastructure/stripe/client.js';
import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../../shared/errors/AppError.js';
import { calculateNights, multiplyMoney, toMinorUnits, encrypt } from '@khan-familia/utils';
import { releaseHold } from '../inventory/inventory.service.js';

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
export const createStripePaymentIntent = async (
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
        ...(guestDetails ? { guestDetails: guestDetails as unknown as object } : {}),
        ...(specialNeeds ? { specialNeeds } : {}),
      },
    });

    // Mutate the local hold object so processPaymentIntentConfirmation sees them correctly
    if (guestDetails) hold.guestDetails = guestDetails as unknown as object;
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

  let totalCharge = 0;
  if (inventoryRows.length === nights) {
    totalCharge = inventoryRows.reduce(
      (sum, row) => sum + (row.priceOverride ?? defaultBaseRate),
      0,
    );
  } else {
    totalCharge = defaultBaseRate * nights;
  }

  const totalMinor = multiplyMoney(toMinorUnits(totalCharge), hold.quantity); // stored in minor units (paisa/cents)

  if (totalMinor <= 0) {
    throw AppError.badRequest(
      'Cannot create a payment for a zero-value booking. Please ensure the unit type has a baseRate configured.',
    );
  }

  const reusableIntent = await prisma.paymentIntent.findFirst({
    where: {
      bookingId: holdToken,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (reusableIntent) {
    const stripeIntent = await stripe.paymentIntents.retrieve(reusableIntent.id);

    return {
      clientSecret: stripeIntent.client_secret,
      paymentIntentId: reusableIntent.id,
      amount: reusableIntent.amount,
      currency: reusableIntent.currency,
      expiresAt: reusableIntent.expiresAt,
    };
  }

  // 3. Create Stripe PaymentIntent
  const stripeIntent = await stripe.paymentIntents.create({
    amount: totalMinor, // Stripe uses smallest currency unit
    currency: 'pkr',
    capture_method: hold.unitType.property.requiresApproval ? 'manual' : 'automatic',
    metadata: {
      holdToken,
      userId,
      tenantId: hold.tenantId,
      propertyId: hold.unitType.propertyId,
      unitTypeId: hold.unitTypeId,
      nights: nights.toString(),
    },
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
  });

  // 4. Persist an internal PaymentIntent record so we can reconcile webhooks
  const internalIntent = await prisma.paymentIntent.create({
    data: {
      id: stripeIntent.id, // use Stripe's pi_ ID as our PK for easy lookup
      tenantId: hold.tenantId,
      bookingType: BookingType.ACCOMMODATION,
      bookingId: holdToken, // will be updated to real bookingId on success
      amount: totalMinor,
      currency: 'PKR',
      provider: 'STRIPE',
      expiresAt: hold.expiresAt,
    },
  });

  return {
    clientSecret: stripeIntent.client_secret,
    paymentIntentId: internalIntent.id,
    amount: totalMinor,
    currency: 'PKR',
    expiresAt: hold.expiresAt,
  };
};

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
    include: { unitType: { select: { defaultRate: true, propertyId: true } } },
  });

  if (!hold) {
    return null;
  }

  const nights = Math.max(1, calculateNights(hold.startDate, hold.endDate));
  const baseRate = hold.unitType.defaultRate ?? 0;
  const baseRateMinor = toMinorUnits(baseRate);
  const totalMinor = multiplyMoney(baseRateMinor, nights * hold.quantity);

  const isCapturable = stripeIntent.status === 'requires_capture';
  const bookingStatus = isCapturable ? 'BOOKED' : 'CONFIRMED';
  const paymentStatus = isCapturable ? 'PENDING' : 'PAID';

  return prisma.$transaction(async (tx) => {
    const booking = await tx.accommodationBooking.create({
      data: {
        userId,
        propertyId: hold.unitType.propertyId,
        unitTypeId: hold.unitTypeId,
        tenantId: hold.tenantId,
        checkIn: hold.startDate,
        checkOut: hold.endDate,
        nights,
        guests: hold.quantity,
        status: bookingStatus,
        idempotencyKey: holdToken,
        confirmedAt: new Date(),
      },
    });

    const inventoryRows = await tx.unitInventory.findMany({
      where: {
        propertyId: hold.unitType.propertyId,
        unitTypeId: hold.unitTypeId,
        date: { gte: hold.startDate, lte: hold.endDate },
      },
      select: { id: true, date: true },
    });

    if (inventoryRows.length > 0) {
      await tx.reservation.createMany({
        data: inventoryRows.map((row) => ({
          bookingId: booking.id,
          unitInventoryId: row.id,
          date: row.date,
        })),
      });
    }

    await tx.bookingPriceSnapshot.create({
      data: {
        accommodationBookingId: booking.id,
        currency: 'PKR',
        totalMinor,
        breakdown: {
          base: baseRateMinor * nights * hold.quantity,
          taxes: 0,
          fees: 0,
          discount: 0,
        },
      },
    });

    const paymentRecordData = {
      paymentIntentId: stripeIntent.id,
      transactionId: stripeIntent.id,
      amountCaptured: stripeIntent.amount_received || stripeIntent.amount_capturable || 0,
      currency: 'PKR',
      status: paymentStatus as 'PAID' | 'PENDING',
      ...(stripeIntent.payment_method
        ? { paymentMethod: { id: stripeIntent.payment_method as string } }
        : {}),
    };
    await tx.paymentRecord.create({ data: paymentRecordData });

    if (hold.guestDetails && Array.isArray(hold.guestDetails)) {
      const encryptionKey = process.env['ENCRYPTION_KEY'];
      if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY is not configured');
      }

      await tx.bookingGuest.createMany({
        data: await Promise.all(
          (hold.guestDetails as Record<string, unknown>[]).map(async (guest) => {
            const g = guest as Record<string, string | number | boolean>;
            return {
              bookingId: booking.id,
              isPrimary: Boolean(g['isPrimary']),
              name: String(g['name']),
              age: Number(g['age']),
              idType: String(g['idType']),
              idNumber: g['idNumber'] ? await encrypt(String(g['idNumber']), encryptionKey) : null,
            };
          }),
        ),
      });
    }

    if (hold.specialNeeds && Array.isArray(hold.specialNeeds)) {
      await tx.bookingSpecialRequest.createMany({
        data: (hold.specialNeeds as unknown as string[]).map((need) => ({
          bookingId: booking.id,
          text: String(need),
        })),
      });
    }

    await tx.propertyHold.delete({ where: { id: hold.id } });

    await tx.paymentIntent.update({
      where: { id: stripeIntent.id },
      data: { bookingId: booking.id, status: paymentStatus },
    });

    return booking;
  });
};

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

  const { bookingSelect } = await import('../booking/booking.service.js');

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
export const handleStripeWebhookEvent = async (
  rawBody: Buffer,
  signature: string,
  webhookSecret: string,
) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    throw AppError.badRequest('Invalid Stripe webhook signature');
  }

  const isSucceeded = event.type === 'payment_intent.succeeded';
  const isCapturable = event.type === 'payment_intent.amount_capturable_updated';

  if (isSucceeded || isCapturable) {
    const stripeIntent = event.data.object as Stripe.PaymentIntent;
    await processPaymentIntentConfirmation(stripeIntent);
  }

  if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
    const stripeIntent = event.data.object;
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

  return { received: true };
};

export const captureStripePaymentIntent = async (paymentIntentId: string) => {
  try {
    return await stripe.paymentIntents.capture(paymentIntentId);
  } catch (error) {
    const stripeError = error as { code?: string; message?: string };
    if (
      stripeError.code === 'payment_intent_unexpected_state' &&
      stripeError.message?.includes('already been captured')
    ) {
      return; // Idempotent success
    }
    throw error;
  }
};

export const cancelStripePaymentIntent = async (paymentIntentId: string) => {
  try {
    return await stripe.paymentIntents.cancel(paymentIntentId);
  } catch (error) {
    const stripeError = error as { code?: string; message?: string };
    if (
      stripeError.code === 'payment_intent_unexpected_state' &&
      stripeError.message?.includes('already been canceled')
    ) {
      return; // Idempotent success
    }
    throw error;
  }
};
