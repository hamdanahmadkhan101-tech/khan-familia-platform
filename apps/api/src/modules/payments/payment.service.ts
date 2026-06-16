import { BookingType } from '@khan-familia/database';
import { stripe } from '../../infrastructure/stripe/client.js';
import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../../shared/errors/AppError.js';
import { calculateNights, multiplyMoney } from '@khan-familia/utils';
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
export const createStripePaymentIntent = async (holdToken: string, userId: string) => {
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
        },
      },
    },
  });

  if (!hold) {
    throw AppError.notFound('Hold not found or has already expired');
  }

  if (hold.expiresAt < new Date()) {
    throw AppError.badRequest('This hold has expired. Please start a new checkout.');
  }

  // 2. Calculate price using centralized utilities
  const nights = Math.max(1, calculateNights(hold.startDate, hold.endDate));
  const baseRate = hold.unitType.defaultRate ?? 0;
  const totalMinor = multiplyMoney(baseRate, nights * hold.quantity); // stored in minor units (paisa/cents)

  if (totalMinor <= 0) {
    throw AppError.badRequest(
      'Cannot create a payment for a zero-value booking. Please ensure the unit type has a baseRate configured.',
    );
  }

  // 3. Create Stripe PaymentIntent
  const stripeIntent = await stripe.paymentIntents.create({
    amount: totalMinor, // Stripe uses smallest currency unit
    currency: 'pkr',
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

  if (event.type === 'payment_intent.succeeded') {
    const stripeIntent = event.data.object;
    const { holdToken, userId } = stripeIntent.metadata;

    if (!holdToken || !userId) {
      // Not one of our holds; ignore
      return { received: true };
    }

    // Idempotency: if a booking for this holdToken already exists, skip
    const existing = await prisma.accommodationBooking.findFirst({
      where: { idempotencyKey: holdToken },
    });
    if (existing) {
      return { received: true };
    }

    // Fetch the hold to get all the data needed to create the booking
    const hold = await prisma.propertyHold.findUnique({
      where: { holdToken },
      include: { unitType: { select: { defaultRate: true, propertyId: true } } },
    });

    if (!hold) {
      // Hold expired and was cleaned up; nothing to do
      return { received: true };
    }

    const nights = Math.max(1, calculateNights(hold.startDate, hold.endDate));
    const baseRate = hold.unitType.defaultRate ?? 0;
    const totalMinor = multiplyMoney(baseRate, nights * hold.quantity);

    // Run everything as a transaction: create booking, record payment, clean up hold
    await prisma.$transaction(async (tx) => {
      // Create the confirmed booking
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
          status: 'BOOKED',
          idempotencyKey: holdToken,
          confirmedAt: new Date(),
        },
      });

      // Persist price snapshot
      await tx.bookingPriceSnapshot.create({
        data: {
          accommodationBookingId: booking.id,
          currency: 'PKR',
          totalMinor,
          breakdown: {
            base: baseRate * nights * hold.quantity,
            taxes: 0,
            fees: 0,
            discount: 0,
          },
        },
      });

      // Record the payment against the booking
      const paymentRecordData = {
        paymentIntentId: stripeIntent.id,
        transactionId: stripeIntent.id,
        amountCaptured: stripeIntent.amount_received,
        currency: 'PKR',
        status: 'PAID' as const,
        ...(stripeIntent.payment_method
          ? { paymentMethod: { id: stripeIntent.payment_method as string } }
          : {}),
      };
      await tx.paymentRecord.create({ data: paymentRecordData });

      // Delete the hold (inventory stays as bookedCount — booking is confirmed)
      await tx.propertyHold.delete({ where: { id: hold.id } });

      // Update the PaymentIntent record to reference the real booking ID
      await tx.paymentIntent.update({
        where: { id: stripeIntent.id },
        data: { bookingId: booking.id, status: 'PAID' },
      });
    });
  }

  if (event.type === 'payment_intent.payment_failed') {
    const stripeIntent = event.data.object;
    const { holdToken } = stripeIntent.metadata;

    if (holdToken) {
      try {
        await releaseHold(holdToken);
      } catch (error) {
        if (!(error instanceof AppError && error.code === 'NOT_FOUND')) {
          throw error;
        }
      }

      await prisma.paymentIntent.updateMany({
        where: { id: stripeIntent.id },
        data: { status: 'FAILED' },
      });
    }
  }

  return { received: true };
};
