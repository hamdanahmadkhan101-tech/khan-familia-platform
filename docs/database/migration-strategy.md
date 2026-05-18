# Migration Strategy (Schema Foundation Phase)

Purpose

- Define the order and safety rules for the next Prisma implementation wave.
- Keep changes small, reversible, and auditable.

## Core migration rules

1. Additive before destructive.
2. Backfill before constraining.
3. One invariant per migration wave.
4. Do not mix naming refactors with behavioral changes.
5. Do not introduce business logic or route changes here.

## Prisma implementation order for the next phase

### Step 1: Identity and tenancy

- `Tenant`
- `User`
- `TenantMembership`
- `TenantInvite`

Why first

- Everything else depends on tenant scoping and user identity.

### Step 2: Vendor and catalog foundations

- `Vendor`
- `Property`
- `UnitType`
- `PropertyInventoryDay`
- `PropertyHold`

Why next

- These are the catalog and availability roots.

### Step 3: Accommodation booking aggregate

- `AccommodationBooking`
- `AccommodationBookingGuest`
- `BookingPriceSnapshot`
- `AccommodationBookingStatusHistory`

Why separate

- Accommodation booking rules are not the same as tour rules.

### Step 4: Tour booking aggregate

- `TourPackage`
- `TourDeparture`
- `TourHold`
- `TourBooking`
- `TourBookingStatusHistory`

Why separate

- Tour inventory and lifecycle are operationally different from accommodation.

### Step 5: Payments and operational history

- `PaymentIntent`
- `PaymentRecord`
- `Refund`
- `Inquiry`
- `Quote`
- `ManualTask`
- `AuditLog`
- `InventoryAdjustment`

Why later

- These depend on bookings and tenant boundaries already being stable.

## Wave plan

### Wave 1: Role alignment

Goals

- Normalize role boundaries before permission expansion.

Actions

- Keep global roles minimal.
- Keep tenant roles pragmatic but explicit.
- Preserve compatibility mapping for the existing role column until the next RBAC phase is ready.

Risks

- App code may still assume old role names.

Mitigation

- Compatibility mapping and explicit authorization tests.

### Wave 2: Tenant boundary hardening

Goals

- Make tenant ownership explicit in schema and queries.

Actions

- Add `tenantId` to any tenant-owned operational row that still relies on joins.
- Backfill tenant IDs from parents.
- Add NOT NULL and `@@index([tenantId])`.

Risks

- Orphaned records can block the migration.

Mitigation

- Run orphan reports before any constrained migration.

### Wave 3: Inventory and booking integrity

Goals

- Prevent double-booking and invalid state transitions.

Actions

- Add direct room-night uniqueness guard to reservation rows.
- Add booking date validity checks.
- Add constraints for nullable relationship combinations where whole-property reservations are allowed.

Risks

- Legacy data may violate the new constraints.

Mitigation

- Pre-clean data and use a staged rollout.

### Wave 4: Tenant-scoped uniqueness

Goals

- Remove unnecessary global coupling.

Actions

- Move tenant-local slugs and references to composite uniqueness with `tenantId`.

Risks

- Collisions during rollout.

Mitigation

- Pre-reserve conflicting slugs or remap them before constraint enforcement.

### Wave 5: Money and history strengthening

Goals

- Stabilize ledger and audit behavior.

Actions

- Move toward integer minor-unit columns for ledger-critical amounts.
- Keep payment and audit rows append-only or effectively immutable.
- Introduce explicit history tables for booking status, inventory changes, and refunds.

Risks

- Decimal/int transition drift.

Mitigation

- Dual-write window with reconciliation.

## Migration design rules

- Keep migrations named by intent, not by table list.
- Do not rename and retype the same field in one migration if avoidable.
- Never ship a uniqueness constraint without validation queries and backfill proof.
- Keep raw SQL migrations for checks that Prisma cannot express.

## Validation templates

- Orphan detection for tenant-owned rows.
- Duplicate room-night checks.
- Duplicate departure-date checks.
- Invalid date range checks.
- Slug collision checks per tenant.

## What must remain separate

- Accommodation booking and tour booking aggregates.
- Payment intent, payment record, and refund history.
- Catalog data and operational history.
- Tenant roles and platform roles.

## What should be deferred

- Full permission table rollout.
- Multi-currency accounting.
- Payout automation.
- Add-on/bundle systems for tours.
- Universal booking abstractions.

## What we are not doing in this phase

- Controller/service implementation.
- Event-driven redesign.
- CQRS or event sourcing.
- Microservices.
