# Booking Payment Flow Runbook

This runbook documents the current backend-only accommodation checkout flow. It is meant for local development and agent handoffs before frontend checkout screens are built.

## Current Flow

1. A guest creates a temporary property hold with `POST /booking/holds`.
2. The API reserves inventory by decrementing `UnitInventory.availableCount` and incrementing `UnitInventory.bookedCount` for every date in the hold range.
3. The hold is stored in `PropertyHold` with a 15 minute expiry.
4. The guest creates a Stripe PaymentIntent with `POST /payments/intent` using the `holdToken`.
5. Stripe sends webhook events to `POST /payments/webhooks/stripe`.
6. On `payment_intent.succeeded`, the API creates an `AccommodationBooking`, creates a `BookingPriceSnapshot`, creates a `PaymentRecord`, marks the internal `PaymentIntent` as `PAID`, and deletes the `PropertyHold`.
7. On `payment_intent.payment_failed` or `payment_intent.canceled`, the API releases the hold, restores inventory, and marks the internal `PaymentIntent` as `FAILED` or `CANCELLED` while it is still pending.
8. The worker sweeps expired holds and restores inventory if the guest never pays or cancels manually.

## Important Invariants

- `PropertyHold` is the temporary reservation. A booking row is not created until successful payment.
- Hold creation should use `Idempotency-Key` for retry safety.
- Reusing the same `Idempotency-Key` with the same hold request returns the existing hold and does not reserve inventory twice.
- Reusing the same `Idempotency-Key` with a different hold request returns a conflict.
- Payment intent creation reuses an existing pending internal `PaymentIntent` for the same hold while the hold is still valid.
- Successful payment deletes the hold but does not restore inventory, because the reservation becomes a confirmed booking.
- Failed, canceled, manually released, and expired holds restore inventory before deleting the hold.
- Stripe webhook retries should be safe: successful payments use the hold token as the booking idempotency key.

## Local Services

Run the API:

```bash
pnpm --filter @khan-familia/api dev
```

Run the worker:

```bash
pnpm --filter @khan-familia/worker dev
```

Run Stripe CLI forwarding:

```bash
stripe listen --forward-to localhost:3001/payments/webhooks/stripe
```

The worker may print this Redis warning when using some hosted Redis providers:

```text
IMPORTANT! Eviction policy is optimistic-volatile. It should be "noeviction"
```

That warning is from BullMQ Redis requirements. It is not an application crash, but production Redis should use `noeviction` if the provider allows it.

## Manual Happy Path

1. Get a fresh guest JWT.
2. Create a hold:

```http
POST /booking/holds
Authorization: Bearer <guest-jwt>
Idempotency-Key: hold-local-001
Content-Type: application/json
```

```json
{
  "propertyId": "<property-id>",
  "unitTypeId": "<unit-type-id>",
  "startDate": "2026-07-01",
  "endDate": "2026-07-06",
  "quantity": 1
}
```

Expected database state:

- One `PropertyHold` row exists.
- Matching `UnitInventory` rows have `availableCount` decremented and `bookedCount` incremented.

3. Send the same hold request again with the same `Idempotency-Key`.

Expected result:

- Same `holdToken` is returned.
- No second `PropertyHold` row is created.
- Inventory is not decremented again.

4. Create a payment intent:

```http
POST /payments/intent
Authorization: Bearer <guest-jwt>
Content-Type: application/json
```

```json
{
  "holdToken": "<hold-token>"
}
```

5. Confirm the Stripe PaymentIntent from another terminal:

```bash
stripe payment_intents confirm <payment-intent-id> --payment-method pm_card_visa
```

Expected database state after the `payment_intent.succeeded` webhook:

- `PropertyHold` row is deleted.
- One `AccommodationBooking` row exists.
- One `BookingPriceSnapshot` row exists for the booking.
- One `PaymentRecord` row exists.
- Internal `PaymentIntent.status` is `PAID` and `bookingId` points to the real booking id.

## Failed Or Canceled Payment Path

Use Stripe CLI or API to trigger a failed or canceled PaymentIntent for an active hold.

Expected database state:

- `PropertyHold` row is deleted.
- Matching `UnitInventory` rows have `bookedCount` decremented and `availableCount` incremented.
- Internal `PaymentIntent.status` becomes `FAILED` or `CANCELLED` if it was still `PENDING`.
- No `AccommodationBooking` row is created.

## Expired Hold Path

1. Create a hold and do not pay.
2. Keep the worker running.
3. Wait until the hold expires. The normal hold TTL is 15 minutes.

Expected worker behavior:

- The hold sweeper runs every 30 seconds.
- Expired holds are deleted.
- Matching inventory rows are restored.

For local manual testing, avoid committing temporary TTL reductions. If the TTL is changed briefly to speed up testing, restore it before committing.

## Manual Release Path

The manual release endpoint should remain available even with the worker running. It is useful for guest cancellation, local recovery, and debugging.

```http
POST /booking/holds/<hold-token>/release
Authorization: Bearer <guest-jwt>
```

This endpoint does not need an `Idempotency-Key`. The `holdToken` identifies the release target. A repeated release after success can return `404 Hold not found` because the hold has already been deleted.

## Known Gaps

- No automated backend tests cover this flow yet. Add those in a dedicated tests branch.
- Notification jobs exist, but booking confirmation emails are not wired end-to-end yet.
- Frontend checkout screens are intentionally out of scope for this backend polish branch.
