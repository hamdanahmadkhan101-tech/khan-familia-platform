## Persistence Design Specification: Travel Booking Platform (v1)

This document is the canonical translation layer between the domain design and the next Prisma implementation. It is a design spec, not a runnable `schema.prisma` file.

## Final decisions

- Accommodation bookings and tour bookings remain separate aggregates for MVP.
- Every tenant-owned operational table must carry an explicit `tenantId`.
- Platform roles remain minimal: `USER` and `PLATFORM_ADMIN` only.
- Tenant roles remain pragmatic now, but the schema must leave a clean path to permission-based RBAC later.
- Middleware is only one enforcement layer; repository and service queries must also scope by tenant.
- Soft delete is allowed only for archive-friendly operational catalog rows.
- Audit logs remain append-only.
- Inventory is quantity-based for MVP and `RoomInventory` remains the source of truth.
- Denormalized caches are allowed only for search/performance fields such as `Property.minPricePerNight` and `Property.averageRating`.
- Single currency ledger for MVP, stored in minor units.

## Reconciliation with the current schema

Use the current schema as a compatibility reference only. The target concepts are:

- `TenantUser` becomes the tenant membership boundary; it should eventually evolve toward a user-tenant-role model.
- `RoomCategory` is conceptually the same as `UnitType`.
- `RoomInventory` remains the authoritative availability ledger.
- `Reservation` remains the immutable per-night lock/audit record.
- `Booking` becomes `AccommodationBooking`.
- `TourAvailability` becomes `TourDeparture`.
- `TourBooking` stays separate and must not be merged into accommodation booking models.
- `Payment` should be conceptually split into `PaymentIntent` and `PaymentRecord`.
- `AuditLog` stays append-only.
- `PropertyInquiry` and `SupportTicket` remain operational records, each with tenant scoping.

## Role model

### Platform roles

- `USER`
- `PLATFORM_ADMIN`

### Tenant roles

- `OWNER`
- `OPERATIONS`
- `FINANCE`
- `SUPPORT`
- `MARKETING`
- `AUDITOR`

### RBAC direction

- MVP: keep tenant roles as an enum on the membership record.
- Next RBAC step: add `Permission`, `Role`, `RolePermission`, and `UserRole` tables without rewriting the domain model.
- Future: allow one user to hold multiple roles per tenant.

## Canonical model groups

### Identity and tenancy

- Tenant
  - id, slug, name, billing_contact, created_at, updated_at
- User
  - id, email, full_name, platform roles, created_at
- TenantMembership
  - id, tenantId, userId, tenantRole, status, created_at, updated_at
- TenantInvite
  - invitation lifecycle for tenant onboarding, scoped by tenantId

### Vendor and catalog

- Vendor
  - id, tenantId, name, legal_name, status, payout_profile_id
- Property
  - id, tenantId, vendorId, title, slug, status, location_json
- UnitType
  - id, propertyId, code, title, capacity, default_rate_minor
- PropertyInventoryDay
  - id, unitTypeId, date, total_quantity, locked_quantity, booked_quantity
- PropertyHold
  - id, unitTypeId, tenantId, hold_token, start_date, end_date, quantity, status, expires_at, idempotency_key

### Accommodation booking aggregate

- AccommodationBooking
  - id, tenantId, propertyId, unitTypeId, booking_reference, customer_contact, status, checkin, checkout, guest_count_json, price_snapshot_id, created_by, created_at
- AccommodationBookingGuest
  - id, bookingId, name, age, contact
- BookingPriceSnapshot
  - id, bookingId, currency, total_minor, breakdown_json
- AccommodationBookingStatusHistory
  - id, bookingId, old_status, new_status, changed_by, reason, timestamp

### Tour booking aggregate

- TourPackage
  - id, tenantId, vendorId, title, slug, status, base_description
- TourDeparture
  - id, tourPackageId, departure_date, capacity_total, capacity_reserved, capacity_available, cutoff_time
- TourHold
  - id, departureId, hold_token, seats, status, expires_at, idempotency_key
- TourBooking
  - id, tenantId, departureId, booking_reference, customer_contact, participants_count, status, price_snapshot_id, created_at
- TourBookingStatusHistory
  - id, bookingId, old_status, new_status, changed_by, reason, timestamp

### Payments, inquiries, audit

- PaymentIntent
  - id, tenantId, booking_type, booking_id, amount_minor, currency, status, gateway_reference, idempotency_key
- PaymentRecord
  - id, paymentIntentId, method, amount_minor, proof_url, verified_by, verified_at
- Refund
  - id, paymentIntentId, amount_minor, reason, status
- Inquiry
  - id, tenantId, channel, requested_dates, party_size, notes, created_by, status
- Quote
  - id, inquiryId, tenantId, price_snapshot_id, expires_at, issued_by, status, negotiation_history_json
- AuditLog
  - id, tenantId, actor_id, actor_role, action, target_type, target_id, before_json, after_json, reason, timestamp
- ManualTask
  - id, tenantId, target_type, target_id, task_type, status, assigned_to, created_by, resolved_by, notes
- InventoryAdjustment
  - id, tenantId, unitTypeId, date, delta_quantity, reason, adjusted_by, created_at

## Constraints and uniqueness

- Use tenant-scoped uniqueness for tenant-local slugs: `(tenantId, slug)`.
- Keep booking references globally unique if practical; otherwise scope them by tenant.
- Keep `PropertyInventoryDay` unique per `(unitTypeId, date)`.
- Keep idempotency keys on holds and payment intents.
- Keep price snapshots immutable once written.

## Normalization and denormalization rules

- Normalize source-of-truth data: tenants, vendors, properties, unit types, bookings, payments, audit rows, inventory rows.
- Denormalize only for read performance and search UX: `Property.minPricePerNight`, `Property.averageRating`, `TourPackage.totalReviews`, `TourPackage.totalBookings`.
- Do not denormalize operational truth into search-only or report-only fields.
- Do not introduce generic universal booking or generic inventory entities.

## Soft delete policy

- Allowed: `Property`, `UnitType`, `TourPackage`, `TourDeparture`, `User` only when business rules allow and there are no active operational dependencies.
- Not allowed: bookings, payment intents, payment records, refunds, audit rows, booking status history, inventory adjustments.
- Soft delete must always preserve auditability; use `isDeleted`, `deletedAt`, and `deletedReason` where needed.

## Audit log policy

- `AuditLog` stays append-only.
- Capture actor, tenant, target type, target id, reason, before/after values, and timestamp.
- Prefer separate history tables for high-signal operational histories: booking status history, inventory adjustments, refunds.
- Do not rely on a generic JSON audit log as the only operational history source.

## Tenant enforcement

- Every tenant-owned operational row must include `tenantId`.
- Repositories and services must accept tenant context explicitly.
- Middleware is a guardrail, not the only enforcement mechanism.
- Row-level security is recommended later as defense in depth.

## Prisma implementation plan for the next phase

### Build order

1. Identity and tenancy: `Tenant`, `User`, `TenantMembership`, `TenantInvite`.
2. Vendor and catalog: `Vendor`, `Property`, `UnitType`, `PropertyInventoryDay`, `PropertyHold`.
3. Accommodation bookings: `AccommodationBooking`, `AccommodationBookingGuest`, `BookingPriceSnapshot`, `AccommodationBookingStatusHistory`.
4. Tour domain: `TourPackage`, `TourDeparture`, `TourHold`, `TourBooking`, `TourBookingStatusHistory`.
5. Payments and operational records: `PaymentIntent`, `PaymentRecord`, `Refund`, `Inquiry`, `Quote`, `ManualTask`, `AuditLog`, `InventoryAdjustment`.

### Must remain separate

- Accommodation booking and tour booking aggregates.
- Inventory ledgers and booking records.
- Payment intent, payment record, and refund history.
- Tenant roles and platform roles.
- Audit logs and booking status history.

### Should be deferred

- Permission tables for full RBAC.
- Multi-currency ledger support.
- Stripe Connect or payout automation complexity.
- Universal bookable entity abstractions.
- Add-on/bundle systems for tours.

## Open trade-offs and risks

- Single currency simplifies accounting but limits expansion.
- Enum-based tenant roles keep MVP simple but require a later RBAC migration.
- Denormalized caches improve search performance but require write-side maintenance.

## Next steps

1. Keep this doc as the authoritative target design.
2. Translate it into a phased Prisma schema only after consensus on the final model names.
3. Introduce migrations only after the schema foundation is approved.
