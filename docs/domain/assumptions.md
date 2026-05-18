# Assumptions

- Modular monolith only; no microservices in MVP.
- No database schema or ORM models are defined yet.
- Manual operations are first-class in MVP (WhatsApp, phone, manual confirmation).
- Availability holds use a fixed TTL (e.g., 10-20 minutes) and are audited if extended.
- Money is stored and calculated in minor units with explicit currency.
- Vendors own and control their inventory and pricing; platform overrides require audit.
- Tours and properties remain separate domains.
- Custom tour requests exist alongside fixed departures.
- Booking confirmation requires a valid hold and a payment resolution (automatic or manual).
- Price snapshots are immutable once attached to a booking.
- Manual payment methods are supported with proof and verification.
- Inventory uses quantity-based modeling in MVP; unit-level tracking is optional later.
- Vendor suspension stops new bookings; existing confirmed bookings require manual resolution.
- Concurrency uses transactional or optimistic locking for writes; reads may be eventual.

- RBAC is two-tier: `Platform` roles (global) and `Tenant` roles (scoped). Role->permission mapping is explicit and stored in the DB.
- Platform will act as the payment collector for v1 (tenant payouts recorded as settlements). Keep ledger single-currency for MVP and store amounts in minor units.
- Use idempotency keys for holds and payment intents to guard retries and webhook replay.
- Recommend BullMQ for background processing, Cloudinary (or equivalent) for object storage, and a reliable email provider (Resend/Postmark). Prefer Neon for Postgres in infra documentation.
