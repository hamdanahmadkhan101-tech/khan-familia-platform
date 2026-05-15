# Audit Log Strategy

## What Must Be Audited

- Vendor status changes and approvals
- Inventory adjustments and overrides
- Booking state transitions
- Payment state transitions and refunds
- Manual confirmations and quote overrides
- Payout approvals and settlement changes

## Audit Fields

- Actor (user/service)
- Action type
- Target aggregate
- Timestamp
- Reason and notes
- Before/after values (when relevant)

## Storage Strategy

- Append-only audit table.
- Immutable records with reference IDs.
- Partition by time if volume grows.
