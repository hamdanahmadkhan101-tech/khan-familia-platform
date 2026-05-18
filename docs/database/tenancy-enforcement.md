# Tenancy Enforcement

Purpose

- Define tenant isolation at schema, repository, service, and database layers.
- Treat middleware as one layer of defense, not the only layer.

## Tenant model

- Platform identities are global.
- Operational records are tenant-owned.
- Every query over tenant-owned data must be scoped by tenant context.

## Non-negotiable rules

1. Every tenant-owned operational table has explicit `tenantId`.
2. Every repository or service query for tenant-owned data receives an explicit `tenantId`.
3. Tenant-scoped uniqueness must include `tenantId`.
4. Cross-tenant access is only allowed through intentionally privileged admin paths and must be audited.
5. Middleware is helpful, but repository/service scoping is mandatory.

## Enforcement layers

### Schema layer

- Add `tenantId` to every tenant-owned operational table.
- Prefer foreign keys to `Tenant` where the relation is direct.
- Add `@@index([tenantId])` on all tenant-owned operational tables.
- Use composite unique constraints for tenant-local values such as slugs and local references.

### Repository layer

- Repositories must require `tenantId` in method signatures for tenant-scoped reads and writes.
- No repository method may return tenant-owned rows without applying tenant filtering.
- A repository may only skip tenant scoping if it is a dedicated platform-admin or system repository with explicit audit logging.

### Service layer

- Services must pass tenant context into repository calls.
- Services must reject operations that do not have a valid tenant context.
- Business rules should never infer tenant ownership through joins if the tenant is already known.

### Middleware layer

- Middleware may extract tenant context from auth/session claims and attach it to request state.
- Middleware may reject obviously invalid tenant contexts.
- Middleware must not be the only tenant guard.

### Database layer

- Use foreign keys and unique constraints where feasible.
- Consider Row-Level Security later as defense in depth.
- When RLS is introduced, keep application-layer tenant checks in place.

## Tables that must be tenant-owned

- Inventory and locking rows.
- Accommodation booking rows and their children.
- Tour booking rows and their children.
- Payment intents, payment records, refunds, payout batches.
- Inquiries, quotes, manual tasks, and audit rows tied to tenant activity.
- Catalog rows such as properties, unit types, vendors, tours, departures.

## Current schema risk hotspots

- Some existing tables are tenant-owned by design but rely on joins rather than direct `tenantId` filtering.
- Reservation-level integrity must be protected with direct constraints and not only application logic.
- Older names such as `RoomCategory` and `TourAvailability` must not be allowed to weaken the tenant scoping rules during transition.

## Audit and observability

- Every mutation should carry actor and tenant context.
- Cross-tenant admin actions should be traceable in audit logs.
- Prefer append-only history tables for high-signal operational events such as booking status changes and inventory adjustments.

## Recommended operational posture

- Repo/service tenant scoping is mandatory.
- Middleware is a convenience layer.
- RLS is an eventual defense-in-depth layer.
- Tenant isolation is a product requirement, not just an implementation detail.
