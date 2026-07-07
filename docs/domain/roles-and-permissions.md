# Roles and Permissions

## Overview

Authorization on this platform is **two-tier**: a global platform layer and a tenant-scoped layer.
All authentication is handled by Clerk (JWT). Role data is stored in Postgres, not in Clerk.

---

## Platform Roles (`User.role` — `PlatformRole`)

| Role          | Description                                      |
| ------------- | ------------------------------------------------ |
| `USER`        | Any registered user. Default for all signups.    |
| `SUPER_ADMIN` | Platform owner. Full access to all admin routes. |

## Tenant Roles (`TenantUser.role` — `TenantRole`)

Scoped to a single tenant. A user can be a member of multiple tenants with different roles per tenant.

| Role    | Description                                                                        |
| ------- | ---------------------------------------------------------------------------------- |
| `OWNER` | Full control: billing, staff management, all settings. Created at tenant creation. |
| `ADMIN` | Manage inventory, bookings, and properties. Cannot manage billing or ownership.    |
| `STAFF` | Operations access: view bookings, manage check-ins. Cannot modify pricing.         |

> **Note:** The database uses the terms `OWNER`, `ADMIN`, and `STAFF` for tenant roles.
> Some older documentation used the terms `VendorAdmin` and `VendorStaff`. These are
> the same concepts — do not introduce new role enums; use `TenantRole`.

---

## Business Vertical Gating (`Tenant.businessVertical`)

Beyond RBAC roles, access to specific API surfaces is gated by the **tenant's business vertical**:

| Vertical               | Who                               | API Access                                                    |
| ---------------------- | --------------------------------- | ------------------------------------------------------------- |
| `ACCOMMODATIONS_STAYS` | Hotel / villa / apartment vendors | Property catalog, unit inventory, accommodation bookings      |
| `EXPERIENCES_TOURS`    | Tour operators                    | Tour packages, departures, passenger manifests, tour bookings |

A tenant with `ACCOMMODATIONS_STAYS` cannot access Tour Operator routes, and vice versa.
This is enforced in middleware, not just by convention.

---

## Implemented API Authorization (MVP)

| Area                    | Route prefix                        | Who                                           |
| ----------------------- | ----------------------------------- | --------------------------------------------- |
| IAM                     | `/iam/me`                           | Authenticated user                            |
| Tenancy                 | `/tenants`                          | Member; writes require `OWNER` or `ADMIN`     |
| Property catalog        | `/properties`                       | Member read; writes `OWNER`/`ADMIN`           |
| Admin moderation        | `/admin/properties`                 | `User.role = SUPER_ADMIN` only                |
| Host booking management | `/tenants/:id/bookings/:id/approve` | `OWNER` or `ADMIN` of matching tenant         |
| Host booking management | `/tenants/:id/bookings/:id/reject`  | `OWNER` or `ADMIN` of matching tenant         |
| Tour operations         | `/tenants/:id/tours`                | `OWNER`/`ADMIN` of `EXPERIENCES_TOURS` tenant |

---

## Tenant URL Pattern vs Header Pattern

- **URL-scoped routes** (e.g., `POST /tenants/:tenantId/bookings/:bookingId/approve`): The
  `tenantId` is part of the URL. No `x-tenant-id` header is required.
- **Global routes with tenant context** (e.g., `POST /properties` for a host): These require the
  `x-tenant-id` header for the middleware to determine which tenant context to apply.

---

## Planned (Not Implemented)

- Formal permission tables in the DB (fine-grained permission matrix).
- `Moderator` platform role for content review without billing access.
- `OperationsAgent` platform role for manual payment verification.
- Clerk organization roles synced to `TenantRole`.
- Per-property staff access restrictions.

---

## Notes

- Tenant staff cannot create guest holds for their own tenant's properties (conflict of interest guard).
- `SUPER_ADMIN` bypasses tenant membership checks for admin routes.
- Ownership transfer between users requires `SUPER_ADMIN` approval and creates an audit log entry.
