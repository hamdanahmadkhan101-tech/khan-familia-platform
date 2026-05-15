# Pricing Model

## Principles

- Pricing is computed from a versioned rule set.
- Bookings use immutable price snapshots to prevent drift.
- Pricing remains separate for property and tour domains.
- Manual overrides are allowed but must be audited.

## Common Price Components

- Base rate
- Adjustments (seasonal, day-of-week)
- Occupancy or participant-based modifiers
- Fees (service, cleaning, booking)
- Taxes
- Commission and payout splits

## Property Pricing (MVP)

- Base nightly rate per unit type.
- Optional length-of-stay adjustments.
- Optional extra guest fees.
- Fees and taxes are applied at checkout.

## Tour Pricing (MVP)

- Base per-person rate per departure.
- Optional tiered pricing by participant count.
- Optional add-ons priced per booking.

## Negotiated Pricing (Operational)

- Inquiries can generate a Quote with a negotiated price.
- Quotes include expiry and a reason (e.g., custom itinerary, group rate).
- Manual overrides generate a new snapshot and never mutate past bookings.

## Pricing Workflow

1. Resolve applicable rate plan.
2. Apply calendar or seasonal overrides.
3. Apply occupancy or participant modifiers.
4. Add fees and taxes.
5. Apply commission and payout rules.
6. Output PriceBreakdown snapshot.

## Invariants

- Prices are non-negative and currency-consistent.
- All fees and taxes are explicit and itemized.
- Price snapshots are immutable once attached to a booking.
- Manual overrides require operator identity and reason.
