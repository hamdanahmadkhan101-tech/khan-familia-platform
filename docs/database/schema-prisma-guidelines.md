# Prisma Guidelines — Mapping schema-v1 to schema.prisma

Purpose

- Provide clear, implementation-focused guidance to translate `docs/database/schema-v1.md` into a safe, reviewable `schema.prisma` in `packages/database`.

Planned steps

1. Finalize this guidelines doc and the conceptual `schema-v1.md`.
2. Author `prisma/schema.prisma` in `packages/database` following these rules (do not run Prisma yet without final sign-off).
3. Initialize Prisma tooling and generate client only after schema review and approval.

Where to initialize Prisma

- Keep Prisma inside `packages/database` (not in app folders).
- Directory: `packages/database/prisma/`.
- Keep DB artifacts confined to this package so `apps/api` and workers consume a shared typed client/repository layer.

Naming & casing conventions

- Prisma model names: PascalCase singular (e.g., `AccommodationBooking`, `PaymentIntent`).
- Field names in Prisma: camelCase (e.g., `tenantId`, `createdAt`). Use `@@map` and `@map` to map to snake_case DB columns if you prefer snake_case in Postgres (recommended for DB admins).
- Table names: plural snake_case via `@@map("table_name")` or keep Prisma default (singular) — pick one and be consistent.
- Enum names: PascalCase in Prisma; map values to UPPER_SNAKE if needed for DB readability.

Primary keys & UUIDs

- Use UUID primary keys for all operational models: `id String @id @default(uuid()) @db.Uuid`.
- Use `@db.Uuid` mapping for Postgres compatibility (requires `provider = "postgresql"`).
- Avoid integer autoincrements for cross-tenant uniqueness and safer merges.

Timestamps, soft-delete, and audit fields

- Standard fields: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`.
- Soft delete pattern: `isDeleted Boolean @default(false)` and `deletedAt DateTime?`.
- Audit fields: keep `createdBy String?` and `updatedBy String?` (store user-id references). Use `AuditLog` append-only table for full before/after snapshots.

Tenant enforcement

- Include `tenantId String @db.Uuid` on every operational model and a FK where feasible.
- Consider adding composite unique indexes with `tenantId` where uniqueness is scoped to tenant.
- Enforce tenant constraints at application layer; consider Postgres RLS policies as an extra protection (document RLS separately in infra docs).

Money and currency

- Store money as integers in minor units: `amountMinor Int` (avoid Decimal for primary ledger columns in v1).
- Optionally add `currency String` or a `Currency` enum if multi-currency needed later.
- Example: `totalMinor Int` and `currency String`.

JSON snapshots and denormalized blobs

- Use `Json` type for price snapshots and negotiation histories: `breakdown Json`.
- Keep JSON blobs intentionally small and schema-stable; prefer explicit columns for frequently queried values (e.g., `totalMinor`).

Idempotency

- Add `idempotencyKey String? @unique` on `PropertyHold` and `PaymentIntent` where safe.
- On creation endpoints, check existing rows by idempotency key and return the persisted row.

Relations & foreign keys

- Model relations should use explicit foreign keys plus `@relation` blocks. Example:

```prisma
model Property {
  id        String     @id @default(uuid()) @db.Uuid
  tenantId  String     @db.Uuid
  vendorId  String     @db.Uuid
  unitTypes UnitType[]
  @@index([tenantId])
  @@map("properties")
}

model UnitType {
  id         String @id @default(uuid()) @db.Uuid
  propertyId String @db.Uuid
  property   Property @relation(fields: [propertyId], references: [id])
  @@index([propertyId])
  @@map("unit_types")
}
```

Indexes and constraints

- Use `@@unique` and `@@index` for frequent query patterns:
  - `@@unique([tenantId, slug])` for per-tenant slugs
  - `@@unique([unitTypeId, date])` for inventory rows
  - `@@index([tenantId, status, createdAt])` for operational lists
- Add specific single-column indexes for `bookingReference`, `gatewayReference`, and `idempotencyKey`.

Immutable vs mutable models

- Immutable/append-only: `AuditLog`, `PaymentRecord`, `Refund`, `BookingStatusHistory`, `InventoryAdjustment`.
- Soft-delete/archivable: `Property`, `UnitType`, `TourPackage`, `TourDeparture`, `User`.
- Enforce immutability via application logic and DB-level restrictions (e.g., deny updates to `BookingPriceSnapshot` once referenced).

Booking model guidance

- Keep `AccommodationBooking` and `TourBooking` separate Prisma models. Each booking references a `BookingPriceSnapshot` (Json) that is immutable.
- Avoid polymorphic foreign keys in Prisma; instead model explicit nullable FKs if cross-type reference needed, or separate models as decided in schema-v1.

Inventory and holds

- `PropertyInventoryDay` model: single row per `(unitTypeId, date)` with `totalQuantity Int`, `lockedQuantity Int`, `bookedQuantity Int`.
- `PropertyHold` model: `idempotencyKey`, `holdToken`, `expiresAt`, `quantity`, `status`.
- When creating a hold: transactionally insert `PropertyHold`, decrement `available` counters (or increment `lockedQuantity`) in the same DB transaction.

Row-Level Security (RLS)

- RLS is recommended for production Postgres to enforce tenant isolation at DB level. Document RLS policies separately in infra docs and enable per-environment.

Migrations & environment

- Keep `schema.prisma` in `packages/database/prisma/schema.prisma` and `prisma/migrations` under the same folder.
- Use package-local env loading strategy for DB URL and sensitive keys (do not commit `.env`).
- Migration flow (after spec is finalized):

```bash
cd packages/database
npx prisma migrate dev --name init
npx prisma generate
```

(Do NOT run migrations until this spec is approved and reviewed.)

Prisma client usage

- Export a single Prisma client instance from `packages/database/src/client.ts` and expose repository-oriented APIs from this package.

Testing & seeds

- Provide seed scripts under `packages/database/prisma/seed/` that create test tenants, roles, and minimal data for CI.
- Ensure seed data is idempotent and uses env guard to avoid running in production by accident.

Operational recommendations

- Partition or archive hot audit tables by time once retention windows require it.
- Monitor slow queries on inventory patterns and add materialized views or denormalized counters as needed.
- When moving to multi-currency, introduce a `Money` value object model and store original and ledger amounts.

Checklist before enabling Prisma in `packages/database`

- [ ] `docs/database/schema-v1.md` finalized and approved
- [ ] This guidelines doc reviewed
- [ ] Migration strategy and retention/archival policy agreed
- [ ] RLS and DB roles planned for production
- [ ] CI job to run migrations in a gated environment

Questions / Next steps

- Do you want me to scaffold `packages/database/prisma/schema.prisma` from `schema-v1` now or wait for your review? If you want scaffolded models, I can produce a draft `schema.prisma` ready for review (no migrations run).
