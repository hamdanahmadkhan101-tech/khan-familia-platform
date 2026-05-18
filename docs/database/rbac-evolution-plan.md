# RBAC Evolution Plan

Purpose

- Keep MVP authorization simple enough to ship while preserving a clean path to permission-based RBAC later.

## Final role boundaries

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

## Current MVP posture

- A user may belong to multiple tenants.
- A user may have one tenant role per tenant membership in MVP.
- Platform roles are global and intentionally minimal.
- Tenant roles are used for operational authorization inside a tenant only.

## Why this is the right compromise

- It keeps the model pragmatic now.
- It avoids the beginner mistake of hardcoding everything into global admin/user roles.
- It leaves a clean path to many-to-many role assignments later.

## How the future RBAC should look

Add these tables later:

- `Permission`
- `Role`
- `RolePermission`
- `UserRole`

Future capabilities

- A user can hold multiple roles in the same tenant.
- Roles can map to multiple permissions.
- Permissions can be reused across platform and tenant scopes.

## Migration direction

1. Keep enum-based tenant roles for MVP.
2. Centralize authorization checks in policy helpers now.
3. Introduce permission constants now so the codebase speaks in capabilities, not raw role checks.
4. Add RBAC tables later as an additive migration.
5. Backfill `UserRole` from existing tenant membership role values.
6. Move policy evaluation to RBAC-first when parity is proven.

## Recommended permission families

- `booking.manage`
- `booking.view`
- `inventory.manage`
- `payment.view`
- `payment.verify`
- `refund.issue`
- `property.manage`
- `tour.manage`
- `support.manage`
- `staff.manage`
- `audit.view`

## Tenant staff authorization strategy

- Owner can manage tenant-wide configuration and staff.
- Operations can manage bookings and inventory.
- Finance can verify payments and issue refunds.
- Support can respond to inquiries and operational tickets.
- Marketing can manage catalog content.
- Auditor can read sensitive operational data without write access.

## Platform authorization strategy

- `PLATFORM_ADMIN` is the only non-user global admin role.
- Platform actions should be rare, explicit, and audited.
- Platform staff should not be conflated with tenant ownership.

## Tradeoffs

- Enums are simpler now.
- Permission tables are more flexible later.
- A staged migration is safer than forcing a full RBAC rewrite too early.

## Operational checks before the RBAC phase changes

- Verify permission parity between enum paths and future role mappings.
- Verify tenant-boundary checks on membership and assignment queries.
- Verify role-change audit coverage.

## Explicit non-goals in this phase

- No platform role hierarchy explosion.
- No policy DSL.
- No enterprise IAM integration.
- No microservice authorization split.
