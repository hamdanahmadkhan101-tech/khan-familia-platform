# Transaction Boundaries

## Must Be Atomic

- Property booking creation: hold + booking + price snapshot.
- Tour booking creation: hold + booking + price snapshot.
- Payment state transitions: payment intent + booking status.
- Cancellation: booking state + inventory release + refund initiation.
- Vendor approval: vendor status + publish eligibility.

Tenant & safety controls

- All 'must be atomic' operations must include `tenantId` in the guarded transaction. Enforce tenant filters at the application layer and consider Postgres Row-Level Security (RLS) for additional safety.
- Use idempotency keys for holds and payment intents. Transactions that create holds or payment intents should persist an `idempotency_key` and return the existing resource when the same key is used.

## Can Be Eventually Consistent

- Search index updates.
- Analytics and reporting aggregates.
- Notification delivery.

## Booking Lifecycle Boundaries

- A booking moves to Confirmed only after hold validation and payment resolution.
- Manual approvals are recorded before payment transitions.

Note: Booking creation, hold acquisition and the initial price snapshot must be in the same DB transaction to avoid stale availability reads.

## Payment Lifecycle Boundaries

- Authorization and capture are sequential and recorded.
- Manual payment verification is atomic with booking confirmation.

## Cancellation Flow

- Cancel booking -> release holds -> initiate refund.
- Refund settlement can be asynchronous but must be audited.
