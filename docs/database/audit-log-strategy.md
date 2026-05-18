# Audit Log Strategy

## What Must Be Audited

- Vendor status changes and approvals
- Inventory adjustments and overrides
- Booking state transitions
- Payment state transitions and refunds
- Manual confirmations and quote overrides
- Payout approvals and settlement changes

Also record:

- Booking status history rows (append-only) for all booking aggregates.
- InventoryAdjustment entries with delta and actor for every manual or system-driven change.
- Refund history and payout batch changes.

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

Implementation notes

- Use separate append-only tables for `AuditLog`, `BookingStatusHistory`, and `InventoryAdjustment` to keep hot paths lean.
- Keep `before_json` and `after_json` limited to relevant fields (avoid dumping full objects at scale).
- Consider partitioning `AuditLog` by `tenantId` and time to support multi-tenant retention policies.
