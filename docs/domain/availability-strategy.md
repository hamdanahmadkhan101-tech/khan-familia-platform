# Availability Strategy

## MVP Decision

- Quantity-based availability per unit type.
- Unit-level tracking is a future enhancement.

## Hold Strategy

- Holds are time-boxed and tracked by HoldToken.
- Holds prevent overbooking during negotiation and payment.
- Holds can be extended only by operators with audit.

## Reconciliation Rules

- Manual inventory adjustments do not modify historical bookings.
- Discrepancies trigger manual tasks rather than automatic cancellation.

## Invariants

- Availability cannot go below zero.
- A confirmed booking must reference a valid hold.
- Vendor and operator adjustments require reason codes.
