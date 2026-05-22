# Bounded Contexts

## Scope

This platform is a modular monolithic, multi-vendor travel commerce system. The MVP scope includes
property booking, vendor onboarding, admin moderation, and tour package management. Tours are a
separate domain from property booking.

## Contexts (MVP oriented)

### Vendor Management

- Purpose: vendor onboarding, compliance, and ownership of catalogs.
- Aggregates (implemented): Tenant, TenantUser, TenantInvite, TenantApplication (schema only).
- API (implemented): `POST/GET/PATCH /tenants`, invites, members (`apps/api/src/modules/tenancy`).
- API (planned): `TenantApplication` submit/review before tenant creation.
- Note (MVP): `POST /tenants` is self-serve today (caller becomes OWNER); platform approval of vendors is **not** enforced yet.
- Aggregates (planned): PayoutProfile and payout automation.
- Invariants: a vendor must be approved before publishing inventory (enforcement planned); ownership boundaries are strict.
- Interactions: provides vendor identity to Inventory and Tour contexts.

### Property Inventory

- Purpose: property catalog, unit types, capacity, and availability.
- Aggregates (implemented): Property, UnitType, UnitInventory, PropertyHold.
- API (implemented): tenant-scoped property + unit type CRUD under `/properties` (`apps/api/src/modules/catalog`).
- API (planned): `UnitInventory` horizon management, public discovery/search.
- Aggregates (planned): Unit (physical rooms), AvailabilitySnapshot exports/materializations.
- Invariants: inventory is owned by a vendor; availability cannot be negative.
- Interactions: supplies availability to Property Booking and Pricing.

### Property Booking

- Purpose: guest reservations for property stays.
- Aggregates (implemented): AccommodationBooking, BookingGuest, Reservation, BookingPriceSnapshot.
- Invariants: bookings require a valid hold and price snapshot; overlap is prevented by availability.
- Interactions: consumes Inventory, Pricing, and Payments.

### Tour Product

- Purpose: tour packages, itineraries, and departure schedules.
- Aggregates (implemented): TourPackage, TourDeparture, TourItineraryDay.
- Invariants: departures are owned by a vendor; capacity is per departure.
- Interactions: supplies availability to Tour Booking and Pricing.

### Tour Booking

- Purpose: guest reservations for tour departures.
- Aggregates (implemented): TourBooking (participants are represented by `numberOfPeople` for now).
- Invariants: bookings require a valid hold and price snapshot; capacity cannot be exceeded.
- Interactions: consumes Tour Product, Pricing, and Payments.

### Inquiry and Operations

- Purpose: handle inquiries, quotes, negotiations, and manual tasking.
- Aggregates (implemented): PropertyInquiry, SupportTicket, AuditLog.
- Aggregates (planned): Quote and ManualTask.
- Invariants: quotes expire; manual overrides are audited.
- Interactions: feeds Booking, Pricing, and Vendor contexts.

### Pricing and Offers

- Purpose: compute prices from rate plans, seasonal rules, fees, and taxes.
- Aggregates (planned): RatePlan, PriceRule, FeeSchedule.
- Invariants: pricing is deterministic for a given snapshot and rule set.
- Interactions: provides price snapshots to booking contexts.

### Payments and Payouts

- Purpose: payment intents, captures, refunds, and vendor payouts.
- Aggregates (implemented): PaymentIntent, PaymentRecord, Refund.
- Aggregates (planned): PayoutBatch / payout automation.
- Invariants: a booking must have exactly one active payment intent at a time.
- Interactions: consumes Booking data, exposes payment status.

### Admin Moderation

- Purpose: review vendors and listings, enforce policies.
- Aggregates (implemented): Property approval and tenant application review are modeled via status fields (PropertyApprovalStatus, TenantApplicationStatus) + AuditLog.
- API (implemented): `GET /admin/properties/pending`, `POST /admin/properties/:id/approve|reject` (`SUPER_ADMIN` via `User.role`).
- API (planned): tenant application review endpoints; public/booking enforcement of `APPROVED` listings.
- Aggregates (planned): ModerationCase.
- Invariants: only moderators can change approval state.
- Interactions: reads Vendor, Property Inventory, Tour Product.

### Identity and Access

- Purpose: roles and permissions across the platform.
- Aggregates (implemented): PlatformRole enum (User/Super Admin), TenantRole enum (Owner/Admin/Staff) via TenantUser.
- Aggregates (planned): permission tables and role assignments.
- Invariants: least-privilege access; vendor users cannot access other vendors.
- Interactions: used by all contexts for authorization decisions.

## Context Map (MVP)

```mermaid
flowchart LR
  IAM[Identity & Access]
  Vendor[Vendor Management]
  PropertyInv[Property Inventory]
  PropertyBooking[Property Booking]
  TourProduct[Tour Product]
  TourBooking[Tour Booking]
  Ops[Inquiry & Operations]
  Pricing[Pricing & Offers]
  Payments[Payments & Payouts]
  Moderation[Admin Moderation]

  IAM --> Vendor
  IAM --> PropertyBooking
  IAM --> TourBooking
  IAM --> Ops
  Vendor --> PropertyInv
  Vendor --> TourProduct
  Ops --> PropertyBooking
  Ops --> TourBooking
  Ops --> Pricing
  Moderation --> Vendor
  Moderation --> PropertyInv
  Moderation --> TourProduct
  PropertyInv --> PropertyBooking
  TourProduct --> TourBooking
  Pricing --> PropertyBooking
  Pricing --> TourBooking
  Payments --> PropertyBooking
  Payments --> TourBooking
```

## Boundary Notes

- Contexts are conceptual boundaries inside a modular monolith.
- No microservices, event sourcing, or cross-context circular ownership.
- Tours and properties remain separate domains to avoid premature abstraction.
