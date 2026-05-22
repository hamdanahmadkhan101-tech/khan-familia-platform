# Core Entities and Aggregates

## Core Entities (MVP)

### Tenant (previously “Vendor” in older docs)

- Owns properties and tours (multi-tenant workspace).
- Controls pricing policies and availability edits.

### Property

- Represents a property listing.
- Contains unit types.
- API (implemented): create/list/get/update/soft-delete under `/properties` (tenant context via `X-Tenant-ID` or default tenant).
- New listings start with `approvalStatus=PENDING`; rejected listings return to `PENDING` on tenant update.

### UnitType

- Defines a sellable inventory class (e.g., Standard Room).
- Contains capacity and pricing defaults.
- API (implemented): CRUD under `/properties/:propertyId/unit-types` (delete blocked when inventory rows or bookings exist).

### Unit

Planned (not implemented in Prisma schema yet):

- Physical unit instance under a unit type.

### TourProduct

Represents a tour package or experience.

- Supports fixed departures and custom requests.

### CustomTourRequest

- Represents a bespoke tour inquiry with negotiated scope and pricing.

### Departure

- A dated tour occurrence with capacity.

### PropertyBooking

Implemented as `AccommodationBooking` in the Prisma schema.

### TourBooking

- Reservation for a tour departure.

### Inquiry

- Captures initial customer intent from web, phone, or WhatsApp.

Note: the current Prisma schema implements `PropertyInquiry` (property-scoped) but does not implement a generic `Inquiry` aggregate.

### Quote

- Negotiated offer with price snapshot and expiry.

Planned (not implemented in Prisma schema yet).

### BookingChangeRequest

- Captures modifications to dates, guests, or itinerary after booking.

Planned (not implemented in Prisma schema yet).

### PaymentIntent

Tracks payment status for a booking. Current Prisma `PaymentStatus` is: `PENDING`, `PAID`, `REFUNDED`, `FAILED`, `CANCELLED`.

### PaymentRecord

- Records manual or offline payment evidence and verification.

Note: the current Prisma schema has `PaymentRecord` but does not model a dedicated `ManualPaymentProof` entity yet.

### ManualTask

- Tracks operator work for confirmations, overrides, or exceptions.

Planned (not implemented in Prisma schema yet).

## Value Objects

- Money (amount + currency)
- DateRange (check-in/check-out, start/end)
- GuestCounts (adults, children)
- Location (region, address)
- ContactInfo (email, phone)
- BookingReference (immutable identifier)
- PriceBreakdown (base, fees, taxes, total)
- InventoryKey (property + unitType + date or departure)
- HoldToken (inventory hold reference)
- QuoteExpiry (timestamp and timezone)
- ManualDecision (operator, reason, timestamp)
- PaymentMethod (card, transfer, cash, wallet)

## Aggregates

### Vendor Aggregate

- Root: Tenant
- Enforces ownership, payout profile completeness, and publish eligibility.

### Property Aggregate

- Root: Property
- Contains UnitTypes.

### Property Availability Aggregate

Implemented as `UnitInventory` (per property + unit type + date) with DB invariants:

- `availableCount + bookedCount + blockedCount = totalCount` (check constraint in migration)

### Property Booking Aggregate

- Root: AccommodationBooking
- Invariant: booking requires a valid availability hold and price snapshot.

### Tour Booking Aggregate

- Root: TourBooking
- Invariant: booking requires a valid departure hold and price snapshot.

### Tour Aggregate

- Root: TourPackage
- Contains Departures.
- Invariant: departure capacity is non-negative.

### Inquiry Aggregate

Planned: Quote/inquiry aggregate is not implemented as a separate schema group yet.

### Payment Aggregate

- Root: PaymentIntent
- Invariant: booking has at most one active payment intent.

### Manual Operations Aggregate

Planned: manual tasking is not implemented as a DB aggregate yet.

## Aggregate Interaction Rules

- Booking aggregates reference inventory and pricing snapshots, not live mutable data.
- Inventory aggregates expose availability through explicit queries or snapshot exports.
- Cross-aggregate updates must be transactional where possible, or use explicit holds.
- Quotes and manual overrides generate new snapshots instead of mutating existing ones.
