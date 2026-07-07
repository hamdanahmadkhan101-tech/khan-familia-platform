# Booking & Payment Flow Runbook

This runbook documents the current backend-only checkout flows for both **Accommodation** and
**Tour** bookings. It is meant for local development and agent handoffs before frontend screens
are built.

---

## Accommodation Booking Flow

### Standard Properties (`requiresApproval = false`)

In this mode, the guest's card is charged immediately on payment confirmation. The booking
moves from `PENDING` → `BOOKED` → `CONFIRMED` automatically.

```
POST /bookings/holds          → PropertyHold created, inventory decremented
POST /payments/intent         → Stripe PaymentIntent created (capture_method: automatic)
  [Stripe CLI: confirm PI]
webhook: payment_intent.succeeded → AccommodationBooking created (BOOKED → auto-CONFIRMED)
```

### Approval-Required Properties (`requiresApproval = true`)

In this mode, Stripe **authorizes** the payment but does not capture it. The host must explicitly
approve (which captures the money) or reject (which voids the authorization).

```
POST /bookings/holds          → PropertyHold created, inventory decremented
POST /payments/intent         → Stripe PaymentIntent created (capture_method: manual)
  [Stripe CLI: confirm PI]
webhook: payment_intent.amount_capturable_updated → AccommodationBooking created (status: BOOKED)
POST /tenants/:id/bookings/:id/approve → Stripe capture, status: CONFIRMED
POST /tenants/:id/bookings/:id/reject  → Stripe cancel, inventory released, status: CANCELLED
```

> **Critical:** Stripe API calls happen **outside** Prisma transactions to avoid the 5-second
> transaction timeout. The pattern is: read → act (Stripe) → write.
> Both `captureStripePaymentIntent` and `cancelStripePaymentIntent` are idempotent — they
> gracefully handle "already captured/canceled" errors.

### Important Invariants

- `PropertyHold` is the temporary reservation. A booking row is **not** created until payment.
- Use `Idempotency-Key` header for hold creation (retry safety).
- Same idempotency key + same request body → returns existing hold, no duplicate reservation.
- Same idempotency key + different body → returns `409 Conflict`.
- Payment intent creation reuses an existing pending `PaymentIntent` for the same hold.
- Successful payment deletes the hold without restoring inventory (reservation becomes booking).
- Failed, canceled, expired, or manually released holds restore inventory.

---

## Tour Booking Flow

Tours do not use a hold system. Seat reservation is atomic with booking creation.

```
POST /tours/:id/departures/:departureId/book
  → Validate bookedCount + numberOfPeople <= maxCapacity (inside transaction)
  → Create TourBooking (status: PENDING)
  → Create TourParticipant rows (one per person)
  → Stripe PaymentIntent created
  [Stripe CLI: confirm PI]
webhook: payment_intent.succeeded → TourBooking status: CONFIRMED, bookedCount incremented
```

For `requiresApproval = true` tours, the same manual capture flow applies as accommodation.

---

## Local Development Setup

**Run the API:**

```bash
pnpm --filter @khan-familia/api dev
```

API runs on **port 3001**.

**Run the background worker:**

```bash
pnpm --filter @khan-familia/worker dev
```

**Run Stripe CLI forwarding (must point to port 3001):**

```bash
stripe listen \
  --api-key sk_test_YOUR_KEY \
  --forward-to localhost:3001/payments/webhooks/stripe
```

Copy the `whsec_...` secret printed by the CLI into your `.env` as `STRIPE_WEBHOOK_SECRET`.
Restart the API after updating `.env`.

> The worker may print: `Eviction policy is optimistic-volatile. It should be "noeviction"`.
> This is a BullMQ/Redis warning, not a crash. Production Redis should use `noeviction`.

---

## Manual Happy Path — Accommodation (No Approval)

**1. Create a hold:**

```http
POST /bookings/holds
Authorization: Bearer <guest-jwt>
Idempotency-Key: hold-local-001
Content-Type: application/json

{
  "propertyId": "<property-id>",
  "unitTypeId": "<unit-type-id>",
  "startDate": "2026-08-01",
  "endDate": "2026-08-06",
  "quantity": 1
}
```

Expected: `201` with `holdToken`.

**2. Create a payment intent:**

```http
POST /payments/intent
Authorization: Bearer <guest-jwt>
Content-Type: application/json

{
  "holdToken": "<hold-token-from-step-1>"
}
```

Expected: `201` with `stripeIntentId` (a `pi_...` value). Use **this** PI ID in the next step,
not the one printed by the Stripe CLI event log.

**3. Confirm the payment via Stripe CLI:**

```bash
stripe payment_intents confirm pi_XXXX \
  --payment-method pm_card_visa \
  --api-key sk_test_YOUR_KEY
```

Expected webhook: `payment_intent.succeeded` → `200` from API.

Expected DB state:

- `PropertyHold` deleted.
- `AccommodationBooking` with `status: CONFIRMED`.
- `BookingPriceSnapshot` attached.
- `PaymentRecord` with `status: PAID`.

---

## Manual Happy Path — Accommodation (With Approval)

Follow the same steps 1–3 above, but set `requiresApproval = true` on the property first
(directly in the database for testing).

Expected webhook after step 3: `payment_intent.amount_capturable_updated` (not `succeeded`).
Booking is created with `status: BOOKED` (not yet CONFIRMED).

**4. Approve the booking as the host:**

```http
POST /tenants/<tenant-id>/bookings/<booking-id>/approve
Authorization: Bearer <host-jwt>
```

Expected: `200` with booking at `status: CONFIRMED` and `paymentIntents[0].status: PAID`.

**5. (Alternative) Reject the booking as the host:**

```http
POST /tenants/<tenant-id>/bookings/<booking-id>/reject
Authorization: Bearer <host-jwt>
Content-Type: application/json

{
  "reason": "Property unavailable"
}
```

Expected: `200` with booking at `status: CANCELLED`. Stripe authorization voided. Inventory restored.

---

## Other Paths

### Failed or Canceled Payment

Trigger via Stripe CLI. Expected:

- `PropertyHold` deleted.
- Inventory restored.
- `PaymentIntent.status`: `FAILED` or `CANCELLED`.
- No `AccommodationBooking` created.

### Expired Hold (Worker Path)

- Create a hold and do not pay.
- Keep the worker running.
- Wait 15 minutes (or temporarily lower TTL for local testing — do not commit TTL changes).
- Worker sweeps every 30 seconds, deletes expired holds, restores inventory.

### Manual Hold Release

```http
DELETE /bookings/holds/<hold-token>
Authorization: Bearer <guest-jwt>
```

A second release after success returns `404 Hold not found`. That is correct — idempotent by design.

---

## Known Gaps

- Booking confirmation emails are not wired end-to-end (notification jobs exist but not triggered).
- Refund automation is not implemented (stored as `refundAmount`, manual processing).
- Frontend checkout screens are out of scope for the current backend branches.
- Tour booking endpoints are not yet implemented (planned in `feat/tour-module-*` branches).
