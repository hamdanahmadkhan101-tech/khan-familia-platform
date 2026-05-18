# Prisma Conventions (Modular Monolith)

Purpose

- Standardize Prisma usage in `packages/database` for maintainability and predictable migrations.

Repository location (required)

- Prisma lives in `packages/database/prisma`.
- Generated client and DB helpers are exported from `packages/database/src`.
- Apps consume DB access through this package; do not duplicate Prisma setup in app folders.

## 1. Naming

- Prisma model names: PascalCase singular.
- Field names: camelCase.
- DB table/column names: optional snake_case via `@@map`/`@map`, but apply consistently if used.
- Avoid parallel names for same concept. Preferred canonical names:
  - `UnitType` (not `RoomCategory` in new modules)
  - `TourDeparture` (not `TourAvailability` in new modules)

## 2. IDs and timestamps

- Keep one ID strategy per schema (current schema uses `cuid()`; if moving to UUID, do it as a planned migration only).
- Required fields on operational models:
  - `createdAt @default(now())`
  - `updatedAt @updatedAt`
- Soft-delete only where policy allows; avoid soft-delete on immutable finance/audit rows.

## 3. Tenancy

- Every operational model must include explicit `tenantId`.
- Add `@@index([tenantId])` on each operational model.
- Use tenant-scoped uniqueness where business scope is tenant-local:
  - `@@unique([tenantId, slug])`
  - `@@unique([tenantId, externalRef])` when relevant.

## 4. RBAC (MVP with forward path)

- Platform role remains minimal: `USER`, `PLATFORM_ADMIN`.
- Tenant role enum should be explicit for operations:
  - `OWNER`, `OPERATIONS`, `FINANCE`, `SUPPORT`, `MARKETING`, `AUDITOR`.
- Keep MVP enum-based checks, but isolate authorization code so future RBAC tables can be introduced without changing domain models.

## 5. Money and currency

- Ledger-critical values should migrate toward integer minor units (`amountMinor Int`).
- Keep `currency` explicit.
- If Decimal columns already exist, use additive migration strategy:
  - add minor-unit columns
  - dual-write
  - backfill
  - switch reads
  - retire old columns

## 6. Constraints and checks

- Encode invariants in DB where possible.
- For invariants Prisma cannot define directly, maintain raw SQL migration files with clear ownership and CI verification.
- Important checks for this platform:
  - inventory counters must sum to total
  - review rating bounded (1..5)
  - departure capacity cannot be exceeded
  - booking dates valid (`checkOut > checkIn`)

## 7. Indexing conventions

- Always index FK columns.
- Add composite indexes for frequent operational filters:
  - `tenantId, status, createdAt`
  - `propertyId, checkIn`
  - `tourDepartureId/departureDate` search patterns
- Add unique idempotency keys for retry-safe write APIs.

## 8. Relation safety

- Avoid nullable FKs unless there is a real business mode that requires them.
- If nullable is intentional, add explicit constraints for valid state combinations.
- Prefer explicit relation names on multi-relational models for readability.

## 9. Migration discipline

- Never mix broad refactor + semantic behavior change in one migration.
- One migration intent per change set.
- Include rollback and data-validation notes in migration PR description.

## 10. Package structure baseline

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/*`
- `packages/database/prisma/seed/*`
- `packages/database/src/client.ts`
- `packages/database/src/repositories/*`
- `packages/database/src/extensions/*` (optional)
- `packages/database/src/utils/*`
