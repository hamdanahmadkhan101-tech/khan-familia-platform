# Assumptions

## Platform Architecture

- Modular monolith only; no microservices in MVP.
- Database schema and ORM models are fully implemented via Prisma (`packages/database`).
- API is built with Fastify/Express and deployed as a single Node.js application.
- Background workers use BullMQ with Redis (Upstash in production).
- Object storage uses Cloudinary (or equivalent).
- Recommended email provider: Resend or Postmark.
- Database: Neon (PostgreSQL) for both development and production.

## Booking and Payments

- Money is stored and calculated in **minor units** (e.g., 45000 = PKR 450.00). Never floats.
- All amounts are stored with an explicit `currency` field (default `PKR`).
- Booking confirmation requires payment resolution (automatic Stripe capture or manual capture after host approval).
- Price snapshots (`BookingPriceSnapshot`) are immutable once attached to a booking.
- Stripe is the primary payment provider for MVP. Local Pakistani gateways (JazzCash, EasyPaisa) are future work.
- Platform acts as the payment collector for v1. Tenant payouts are recorded as settlements.
- Idempotency keys are required for holds and payment intents to guard against retries and webhook replay.
- **Stripe API calls (capture, cancel) must never be placed inside a Prisma interactive transaction.** Network latency causes transaction timeouts. Use the Read → Act → Write pattern.

## Inventory and Availability

- Accommodation inventory uses quantity-based modeling: `UnitInventory` rows per date per unit type.
- Availability holds use a fixed 15-minute TTL. The worker sweeps expired holds every 30 seconds.
- Tour inventory uses departure-based capacity: `TourDeparture.bookedCount` vs `maxCapacity`.
- Tours do not use a hold system. Seat reservation is atomic with booking creation.
- `CHECK` constraints at the database level enforce that `bookedCount` never exceeds `maxCapacity` for tour departures.

## Multi-Tenancy and Vendor Model

- The platform is multi-tenant. Every property and tour package is owned by a specific `Tenant`.
- Tenant access to specific product domains is gated by `Tenant.businessVertical` (`ACCOMMODATIONS_STAYS` vs `EXPERIENCES_TOURS`).
- Vendors own and control their inventory and pricing; platform overrides require audit.
- Vendor suspension stops new bookings; existing confirmed bookings require manual resolution.
- Self-serve tenant creation via `POST /tenants` exists but the preferred production path is through `TenantApplication` (admin-reviewed onboarding). This is planned, not yet implemented.

## RBAC

- RBAC is two-tier: `PlatformRole` (global: `USER`, `SUPER_ADMIN`) and `TenantRole` (scoped: `OWNER`, `ADMIN`, `STAFF`).
- Role-to-permission mapping is enforced in middleware, not in the database as policy tables (future work).

## Concurrency

- Inventory writes use transactional or optimistic locking to prevent double-booking.
- Tour capacity writes use atomic transactions with DB-level check constraints.
- Reads may be eventually consistent.

## Manual Operations

- Manual operations (WhatsApp, phone, manual confirmation) are first-class in MVP.
- Host approval flow (`requiresApproval = true`) supports manual confirmation before Stripe capture.
- Manual payment proof submission and verification is future work.

## Out of Scope for MVP

- Custom tour requests (inquiry → quote → negotiation flow).
- Refund automation (stored as `refundAmount` for now, manual processing).
- Cancellation policy evaluation (fee schedules, refund windows).
- Date-change requests and amendment flows.
- Frontend/UI (backend API only).
- Multi-currency support (single-currency PKR for MVP).
- Payout automation (tenant settlements are future work).
