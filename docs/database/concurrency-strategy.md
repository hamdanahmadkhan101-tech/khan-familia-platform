# Concurrency Strategy

## Double-Booking Prevention

- Inventory and departures use row-level locking or optimistic version checks.
- Holds reduce availability before booking confirmation.

## Locking Approach

- Property inventory: lock per unit type + date range.
- Tour departures: lock per departure and seat count.
- Avoid broad table locks; keep conflicts localized.

## Optimistic vs Pessimistic

- Use optimistic locking for most inventory updates.
- Escalate to row-level locks during hold creation and confirmation.

## Retry and Idempotency

- Hold creation and booking creation require idempotency keys.
- Retry on conflict with bounded attempts.
- If retries fail, return conflict and trigger re-quote.

## Race Conditions

- Parallel holds on the same inventory window.
- Payment callbacks arriving after cancellation.
- Manual overrides applied after auto-confirmation.

## Mitigations

- Snapshot pricing and availability at hold time.
- Validate hold ownership before confirmation.
- Audit all manual overrides.
