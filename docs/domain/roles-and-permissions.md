# Roles and Permissions

## Roles (MVP)

The current Prisma schema implements a minimal **two-tier** RBAC model:

### Platform roles (`PlatformRole`)

- `USER`
- `SUPER_ADMIN`

### Tenant roles (`TenantRole`)

- `OWNER`
- `ADMIN`
- `STAFF`

Note: richer platform roles (Moderator/OperationsAgent) and permission matrices are planned but are **not implemented** as first-class DB tables yet.

## Permission Matrix (High Level)

This section is intentionally **non-binding** until permission tables are introduced. For now, authorization must be expressed using:

- platform role checks (`SUPER_ADMIN`)
- tenant membership + tenant role checks (`OWNER`/`ADMIN`/`STAFF`)

## Notes

- Vendor roles are scoped to a single vendor.
- Moderators cannot change pricing or payouts.
- Operations agents handle manual confirmations and payment verification.
