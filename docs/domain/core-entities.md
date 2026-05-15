# Core Entities and Aggregates

## Core Entities (MVP)

### Vendor

- Owns properties and tours.
- Controls pricing policies and availability edits.

### Property

- Represents a property listing.
- Contains unit types and units.

### UnitType

- Defines a sellable inventory class (e.g., Standard Room).
- Contains capacity and pricing defaults.

### Unit

- Physical unit instance under a unit type.

### TourProduct

- Represents a tour package or experience.
- Supports fixed departures and custom requests.

### CustomTourRequest

- Represents a bespoke tour inquiry with negotiated scope and pricing.

### Departure

- A dated tour occurrence with capacity.

### PropertyBooking

- Reservation for a stay at a property.

### TourBooking

- Reservation for a tour departure.

### Inquiry

- Captures initial customer intent from web, phone, or WhatsApp.

### Quote

- Negotiated offer with price snapshot and expiry.

### BookingChangeRequest

- Captures modifications to dates, guests, or itinerary after booking.

### PaymentIntent

- Tracks payment authorization and capture for a booking.

### PaymentRecord

- Records manual or offline payment evidence and verification.

### ManualTask

- Tracks operator work for confirmations, overrides, or exceptions.

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

- Root: Vendor
- Enforces ownership, payout profile completeness, and publish eligibility.

### Property Aggregate

- Root: Property
- Contains UnitTypes and Units.
- Invariant: unit type capacity must be consistent across units.

### Property Availability Aggregate

- Root: AvailabilitySnapshot
- Manages holds and confirmed bookings for dates.
- Invariant: availability cannot go below zero.

### Property Booking Aggregate

- Root: PropertyBooking
- Invariant: booking requires a valid availability hold and price snapshot.

### Tour Booking Aggregate

- Root: TourBooking
- Invariant: booking requires a valid departure hold and price snapshot.

### Tour Aggregate

- Root: TourProduct
- Contains Departures.
- Invariant: departure capacity is non-negative.

### Inquiry Aggregate

- Root: Inquiry
- Invariant: a quote must reference a single inquiry and expire.

### Payment Aggregate

- Root: PaymentIntent
- Invariant: booking has at most one active payment intent.

### Manual Operations Aggregate

- Root: ManualTask
- Invariant: manual overrides must record operator and reason.

## Aggregate Interaction Rules

- Booking aggregates reference inventory and pricing snapshots, not live mutable data.
- Inventory aggregates expose availability through explicit queries or snapshot exports.
- Cross-aggregate updates must be transactional where possible, or use explicit holds.
- Quotes and manual overrides generate new snapshots instead of mutating existing ones.
