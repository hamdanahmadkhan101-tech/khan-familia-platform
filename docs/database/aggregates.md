# Aggregates

This document defines aggregate roots, boundaries, and invariants for persistence design.

Note: All aggregates that represent operational data MUST include `tenantId` as part of their root.

## Vendor Aggregate

- Root: Vendor
- Entities: VendorProfile, VendorUser, PayoutProfile
- Invariants: approval required before publish; vendor ownership is exclusive.

## Property Aggregate

- Root: Property
- Entities: UnitType, PropertyMedia
- Invariants: unit types belong to one property; property belongs to one vendor.

## Property Inventory Aggregate

- Root: PropertyInventoryDay
- Entities: PropertyHold
- Invariants: availability cannot be negative; holds expire.

## Property Booking Aggregate

- Root: PropertyBooking
- Entities: BookingGuest, BookingSnapshot
- Invariants: booking requires valid hold and price snapshot.

## Identity & RBAC Aggregate

- Root: Tenant
- Entities: User, TenantMembership, TenantRole, PlatformRole, Permission, RolePermission
- Invariants: Role->Permission mapping must be consistent; user memberships scoped to tenants. Platform roles are separate from tenant roles.

## Tour Package Aggregate

- Root: TourPackage
- Entities: ItineraryItem, PickupPoint, Inclusion
- Invariants: package owned by vendor or admin; published packages are immutable without audit.

## Tour Departure Aggregate

- Root: TourDeparture
- Entities: TourHold
- Invariants: capacity cannot be exceeded; departures immutable after bookings.

## Tour Booking Aggregate

- Root: TourBooking
- Entities: Participant, BookingSnapshot
- Invariants: booking requires valid hold and price snapshot.

## Inquiry Aggregate

- Root: Inquiry
- Entities: Quote
- Invariants: quotes expire; accepted quote creates a hold request.

## Payment Aggregate

- Root: PaymentIntent
- Entities: PaymentRecord, Refund
- Invariants: one active payment intent per booking; refunds reference captured payments.

## Customer Aggregate

- Root: Customer
- Entities: ContactInfo
- Invariants: customer identity is stable and audited.

## Review Aggregate

- Root: Review
- Invariants: review references a completed booking; one review per booking.

## Manual Operations Aggregate

- Root: ManualTask
- Invariants: manual overrides require actor and reason.

## Transactional Consistency

- Aggregates listed above should be updated atomically within their boundaries.
- Cross-aggregate updates should use explicit holds or snapshots.

Important: Accommodation and Tour booking aggregates are separate roots (AccommodationBooking vs TourBooking). Cross-aggregate flows (e.g. quoting from property -> issuing tour add-on) must use explicit snapshots and idempotent hold tokens.
