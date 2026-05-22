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

## Implemented API authorization (MVP)

| Area             | Route prefix        | Who                                                 |
| ---------------- | ------------------- | --------------------------------------------------- |
| IAM              | `/iam/me`           | Authenticated user                                  |
| Tenancy          | `/tenants`          | Member; writes require OWNER/ADMIN                  |
| Catalog          | `/properties`       | Member read (OWNER/ADMIN/STAFF); writes OWNER/ADMIN |
| Admin moderation | `/admin/properties` | `User.role = SUPER_ADMIN` only                      |

Clerk provides authentication (JWT). Platform and tenant roles are stored in Postgres (`User.role`, `TenantUser.role`), not in Clerk org roles yet.

## Notes

- Vendor roles are scoped to a single vendor.
- Moderators cannot change pricing or payouts.
- Operations agents handle manual confirmations and payment verification.
