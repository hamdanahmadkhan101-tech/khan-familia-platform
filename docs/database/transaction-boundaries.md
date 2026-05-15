# Transaction Boundaries

## Must Be Atomic

- Property booking creation: hold + booking + price snapshot.
- Tour booking creation: hold + booking + price snapshot.
- Payment state transitions: payment intent + booking status.
- Cancellation: booking state + inventory release + refund initiation.
- Vendor approval: vendor status + publish eligibility.

## Can Be Eventually Consistent

- Search index updates.
- Analytics and reporting aggregates.
- Notification delivery.

## Booking Lifecycle Boundaries

- A booking moves to Confirmed only after hold validation and payment resolution.
- Manual approvals are recorded before payment transitions.

## Payment Lifecycle Boundaries

- Authorization and capture are sequential and recorded.
- Manual payment verification is atomic with booking confirmation.

## Cancellation Flow

- Cancel booking -> release holds -> initiate refund.
- Refund settlement can be asynchronous but must be audited.
