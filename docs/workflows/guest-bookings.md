# Guest Bookings Workflow

This workflow covers guest-owned booking management after checkout has created an `AccommodationBooking`.

## Implemented In Guest Booking Branch

### List My Bookings

```http
GET /bookings/me
Authorization: Bearer <guest-jwt>
```

Supported query parameters:

- `scope`: `upcoming`, `past`, `cancelled`, or `all` (default: `upcoming`)
- `status`: optional `AccommodationBookingStatus`
- `limit`: 1-100 (default: 25)
- `offset`: default 0

Guests only see bookings where `AccommodationBooking.userId` matches their authenticated internal user id.

### View My Booking

```http
GET /bookings/:bookingId
Authorization: Bearer <guest-jwt>
```

Returns booking details with property, unit type, price snapshot, guest details, special requests, and payment intent context.

### Cancel My Booking

```http
POST /bookings/:bookingId/cancel
Authorization: Bearer <guest-jwt>
Content-Type: application/json
```

```json
{
  "reason": "Travel plans changed"
}
```

Current cancellation behavior:

- Guest can cancel only their own booking.
- Cancellation is blocked once the booking is `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`, or `NO_SHOW`.
- Booking status becomes `CANCELLED`.
- `cancellationReason` and `cancellationDate` are stored.
- `AccommodationBookingStatusHistory` records the transition.
- Reserved inventory is restored for the booked stay dates.
- Refund automation is not implemented yet.

## Not Implemented Yet

These are intentionally future work:

- Date-change requests and amendment approval flow.
- Cancellation policy evaluation and refund automation.
- Guest details management after booking.
- Special request create/update flows.
- Invoice or receipt downloads.
- Reviews after checkout.
- Booking notifications by email or in-app notification.
- Guest support/contact-property conversation flow.

## Booking Policy Service

The booking-policy-service branch introduced a small domain-level policy layer so booking rules do not keep spreading through controllers. Current policy coverage:

- Past dates are not allowed for new guest holds.
- Checkout date must not be before check-in date.
- Tenant staff cannot create guest holds for their own tenant properties.
- Guest cancellation is blocked after terminal or operational states.

The booking controller now delegates guest hold creation and manual release to booking service functions instead of importing Prisma directly.

Policy work intentionally left for future branches:

- Same-day booking should be explicitly allowed or blocked per property policy.
- Minimum advance notice should be enforceable per property.
- Refund behavior should be policy-driven before Stripe refund automation is added.
- Payment webhook conversion should share core date and ownership assumptions with hold creation.
- Manual hold release should enforce ownership once PropertyHold stores the creating user id.

## Date Change Policy Direction

Guests should not directly edit `checkIn` and `checkOut` on a confirmed booking. A professional date-change flow should be modeled as a request/amendment:

1. Guest requests new dates.
2. System checks inventory availability.
3. System recalculates price difference.
4. Extra payment or refund/credit is resolved.
5. Tenant approval may be required depending on property policy.
6. Booking dates and inventory are changed atomically.
7. The amendment is audited.

Current Prisma schema does not have a dedicated booking amendment/request model, so date flexibility should be handled in a future branch.
