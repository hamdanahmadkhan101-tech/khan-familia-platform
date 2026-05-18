# Schema Review v1

Purpose

- Audit the current Prisma schema conceptually against the finalized persistence design.
- Focus on tenancy boundaries, aggregate boundaries, naming drift, normalization, transaction safety, and migration readiness.
- This is a review, not a schema rewrite.

## Executive summary

The current schema has useful building blocks, but it still reflects the older concept model in several places. The design is directionally correct, but the following must be corrected before implementation work continues:

- Separate accommodation and tour booking aggregates must remain explicit.
- Tenant ownership must be explicit on tenant-owned operational tables.
- Platform roles must be minimal and tenant roles must be scoped.
- Booking, payment, inventory, and audit rules need stronger lifecycle boundaries.
- Some current names are legacy-friendly but not the long-term canonical names.

## Conceptual reconciliation with the old schema

- `Booking` should be treated as the accommodation aggregate, not a universal booking entity.
- `TourBooking` stays separate and should not be collapsed into accommodation booking.
- `RoomCategory` should map conceptually to `UnitType`.
- `TourAvailability` should map conceptually to `TourDeparture`.
- `TenantUser` should be treated as the membership boundary and later evolved toward richer role assignment.
- `Payment` and `TourPayment` should eventually become intent/record-style payment models.
- `Reservation` remains a per-night operational lock and audit record.

## Findings

### Critical

1. Role model is still not aligned with the final decision set

- Current schema still carries broader legacy role semantics.
- Target: global roles must remain minimal; tenant roles must stay scoped and operational.
- Impact: over-broad privileges and hard-to-audit authorization checks.

2. Tenant scoping is incomplete on tenant-owned operational rows

- Some operational rows still rely on joins rather than explicit tenant ownership.
- Impact: cross-tenant leakage risk and harder repository enforcement.
- Migration impact: backfill tenant IDs and add constraints before any behavioral cutover.

3. Reservation integrity needs direct enforcement

- Per-night inventory locks must be protected with direct uniqueness and date-validity constraints.
- Impact: double-booking can still slip through under concurrency if the only guard is application logic.

### High

4. Legacy naming obscures aggregate boundaries

- `RoomCategory`, `TourAvailability`, and `Booking` are legacy names that do not clearly reflect the final design.
- Impact: developer confusion and model drift.

5. Money handling is still too decimal-centric for ledger-critical paths

- Decimal is acceptable for display and legacy coexistence, but the final ledger direction is minor units.
- Impact: reconciliation and rounding risk during growth.

6. Soft-delete policy is not yet explicit enough in the docs-to-schema transition

- Booking and audit rows must not be soft-deleted.
- Only catalog-like rows may be archived.

### Medium

7. Migration notes are not yet layered by dependency order

- Identity/tenant foundations should come first.
- Booking/inventory should follow.
- Payment and audit should come after the core aggregates are stable.

8. RBAC evolution is still too abstract if left undocumented

- The schema needs a clear bridge from enum-based roles to future permission tables.

9. Search caches and operational source-of-truth are not always distinguished clearly enough

- Denormalized fields are useful, but only when they are clearly documented as caches.

## Strengths to keep

- Separate booking aggregates are already conceptually accepted.
- `RoomInventory` as source of truth is the right pattern for MVP.
- Audit logging is append-heavy and should remain append-only.
- Denormalized cache fields for search and listing remain appropriate.

## Recommended correction order

1. Finalize tenant and role boundaries.
2. Lock tenant scoping into repository/service query patterns.
3. Finalize accommodation and tour aggregate separation.
4. Tighten booking/inventory constraints.
5. Standardize the naming bridge from legacy schema terms to canonical terms.
6. Then prepare the Prisma schema foundation.

## Final implementation guidance

- Accommodation booking and tour booking stay separate.
- Tenant-owned rows must always carry explicit `tenantId`.
- Platform roles stay minimal.
- Tenant roles stay practical now and evolve later.
- Soft delete is for catalogs, not history.
- Audit logs and booking history are append-only.
- Denormalize only caches, not source-of-truth operational rows.

## Out of scope for this phase

- Routes, services, and controllers.
- CQRS, event sourcing, or microservices.
- Universal polymorphic booking abstractions.
