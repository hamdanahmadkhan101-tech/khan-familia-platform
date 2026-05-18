# Schema Normalization — Implementation Checklist

**Phase:** Foundation (v1)  
**Status:** Ready for implementation  
**Date:** May 18, 2026

---

## Quick Reference

### Enums to Update/Create

```prisma
// 1. RENAME
enum Role → enum PlatformRole

enum OwnerApplicationStatus → enum TenantApplicationStatus

enum TourAvailabilityStatus → enum TourDepartureStatus

// 2. CREATE NEW
enum PropertyApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}
```

### Models to Rename

```prisma
RoomCategory → UnitType
TourAvailability → TourDeparture
OwnerApplication → TenantApplication
```

### Field Changes

```prisma
// Property model
Property.role: Role → PlatformRole
Property.isApproved: Boolean → approvalStatus: PropertyApprovalStatus
Property.bookWholeProperty → isWholePropertyBookable
Property.wholePropertyPrice → wholePropertyBasePrice

// Room model
Room.categoryId → unitTypeId
Room.category → unitType

// RoomInventory model
RoomInventory.categoryId → unitTypeId
RoomInventory.category → unitType

// Booking model
Booking.categoryId → unitTypeId
Booking.category → unitType

// TourPackage model
TourPackage.availability[] → departures[]

// TourBooking model
TourBooking.tourAvailabilityId → tourDepartureId
TourBooking.tourAvailability → tourDeparture
```

---

## Implementation Steps

### Step 1: Update Prisma Schema

**File:** `packages/database/prisma/schema.prisma`

1. Add new `PropertyApprovalStatus` enum after existing enums
2. Rename `Role` → `PlatformRole`
3. Rename `OwnerApplicationStatus` → `TenantApplicationStatus`
4. Rename `TourAvailabilityStatus` → `TourDepartureStatus`
5. Rename `RoomCategory` → `UnitType` model
6. Rename all `categoryId` fields to `unitTypeId`
7. Rename all `category` relations to `unitType`
8. Rename `TourAvailability` → `TourDeparture` model
9. Update `TourPackage.availability[]` → `TourPackage.departures[]`
10. Update `TourBooking.tourAvailabilityId` → `TourBooking.tourDepartureId`
11. Update `TourBooking.tourAvailability` → `TourBooking.tourDeparture`
12. Update `User.role: Role` → `User.role: PlatformRole`
13. Replace `Property.isApproved: Boolean` with `Property.approvalStatus: PropertyApprovalStatus`
14. Rename `Property.bookWholeProperty` → `Property.isWholePropertyBookable`
15. Rename `Property.wholePropertyPrice` → `Property.wholePropertyBasePrice`
16. Update `OwnerApplication` → `TenantApplication` model

### Step 2: Generate Prisma Migration

```bash
cd packages/database
pnpm run prisma migrate dev --name normalize_schema_for_hospitality_standards
```

### Step 3: Update Type Exports

**File:** `packages/types/src/index.ts`

- Re-export new enum names: `PlatformRole`, `PropertyApprovalStatus`, `TenantApplicationStatus`, `TourDepartureStatus`
- Update type aliases if any (e.g., if `OwnerApplicationStatus` was aliased)

### Step 4: Update Repositories

**File:** `packages/database/src/repositories/`

For each model:

- Update field references
- Update relation names
- Update where/select clauses
- Update return types

**Models affected:**

- Property repository (approval status logic)
- Room repository (unit type relations)
- RoomInventory repository (unit type relations)
- Booking repository (unit type relations)
- TourPackage repository (departures)
- TourBooking repository (tour departure relations)
- Tenant/User repository (platform role references)

### Step 5: Update Service Layer

**File:** `apps/api/src/services/`

1. **Approval service:**
   - Replace `property.isApproved` checks with `property.approvalStatus === PropertyApprovalStatus.APPROVED`
   - Update rejection logic to explicitly set status + reason

2. **Booking service:**
   - Update pricing logic for `wholePropertyBasePrice`
   - Update "whole property bookable" checks to use `isWholePropertyBookable`

3. **Tour service:**
   - Update all `TourAvailability` references to `TourDeparture`
   - Update tour availability queries to use `tourPackage.departures`

4. **Tenant onboarding:**
   - Update `OwnerApplication` to `TenantApplication`
   - Update status references

5. **Auth/middleware:**
   - Update role checks to use `PlatformRole`
   - Update role-based access control

### Step 6: Update Middleware & Utilities

**Files affected:**

- Auth middleware (role checks)
- Request/response mapping utilities
- Validators and schemas
- Constants and defaults

### Step 7: Update Seeders

**File:** `packages/database/prisma/seed.ts`

- Update seed data with new enum values
- Update `RoomCategory` → `UnitType` in test data
- Update `OwnerApplication` → `TenantApplication`
- Update `TourAvailability` → `TourDeparture`

### Step 8: Update Tests

**Files affected:**

- `apps/api/src/__tests__/**/*.test.ts`
- `packages/database/src/__tests__/**/*.test.ts`

1. Update test fixtures to use new model/field names
2. Update assertions and queries
3. Update mock data generation

### Step 9: Update API Layer

**Files affected:** `apps/api/src/routes/`

1. Update DTO field mappings
2. Update OpenAPI/Swagger definitions
3. Update response serialization
4. Update error messages referencing old fields

### Step 10: Update Documentation

**Files:**

- `docs/database/schema-v1.md`: Reflect naming changes
- `docs/database/prisma-conventions.md`: Add examples using new names
- `packages/database/README.md`: Update any code samples
- Create `docs/MIGRATION_GUIDE_V1.md` for API consumers

### Step 11: Validate & Test

```bash
# Root workspace
pnpm install  # Sync lock file

# Type check all packages
pnpm run type-check

# Lint all packages
pnpm run lint

# Run tests
pnpm test --filter='@khan-familia/database'
pnpm test --filter='api'

# Verify schema
cd packages/database
pnpm run prisma:generate
```

---

## Verification Checklist

- [ ] `pnpm run type-check` passes with no errors
- [ ] `pnpm run lint` passes with no errors
- [ ] `pnpm test` passes (if tests exist)
- [ ] `prisma studio` opens and shows correct tables/fields
- [ ] `git status` shows only expected changed files (schema, generated types, migrations)
- [ ] New enum exports work: `import { PlatformRole } from '@prisma/client'`
- [ ] Old enum names cause TypeScript errors (confirmation of breaking change)
- [ ] API routes respond with new field names in JSON
- [ ] Database schema aligns with Prisma schema dump

---

## Rollback Plan (if needed)

```bash
# Revert migration
cd packages/database
pnpm run prisma migrate resolve --rolled-back <migration_name>

# Revert schema changes
git checkout HEAD -- prisma/schema.prisma

# Regenerate client
pnpm run prisma:generate
```

---

## Notes

- **All changes are breaking:** Version the API if this affects public consumers
- **No data migration:** Schema renames only; no data transformation (PostgreSQL handles column renames)
- **Testing:** Comprehensive testing required before merge to `develop`
- **Documentation:** Update all examples and guides post-rename
- **Timing:** Complete this phase before implementing data access layer / repositories
