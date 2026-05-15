# Normalization Strategy

## Baseline

- Core transactional tables target 3NF.
- No universal listing or polymorphic mega-tables.

## Normalized Areas

- Vendor, Property, UnitType, TourPackage, TourDeparture
- Booking, PaymentIntent, Refund
- Inquiry and Quote

## Controlled Denormalization

- Search indexes (property_search, tour_search) for fast filtering.
- Aggregated ratings and review counts stored as cached columns.
- Booking and price snapshots stored as immutable records.

## Reporting Tradeoffs

- Use read-optimized summary tables for dashboards.
- Rebuildable aggregates are preferred over denormalizing core tables.

## Audit and History

- Append-only audit logs for sensitive changes.
- Price snapshots and booking state transitions are immutable.
- Historical bookings are never overwritten or deleted.
