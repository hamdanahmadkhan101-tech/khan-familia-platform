# Schema Naming — Before/After Reference

**Quick lookup for developers implementing the normalization**

---

## Enums

| Category          | Before                   | After                     | Context                               |
| ----------------- | ------------------------ | ------------------------- | ------------------------------------- |
| Platform Access   | `Role`                   | `PlatformRole`            | User global access level              |
| Property Approval | N/A (boolean)            | `PropertyApprovalStatus`  | New enum: PENDING, APPROVED, REJECTED |
| Tenant Vendor     | `OwnerApplicationStatus` | `TenantApplicationStatus` | Vendor onboarding status              |
| Tour Capacity     | `TourAvailabilityStatus` | `TourDepartureStatus`     | Departure availability/status         |

---

## Models

| Before             | After               | Reason                                           |
| ------------------ | ------------------- | ------------------------------------------------ |
| `Room`             | `Unit`              | Hospitality standard for bookable accommodations |
| `RoomAmenity`      | `UnitAmenity`       | Align with Unit rename                           |
| `RoomInventory`    | `UnitInventory`     | Align with Unit rename                           |
| `RoomCategory`     | `UnitType`          | Hospitality standard terminology                 |
| `TourAvailability` | `TourDeparture`     | Name the concrete thing (departure instance)     |
| `OwnerApplication` | `TenantApplication` | Precise: business application to create org      |

---

## Key Field Renames

### Property Model

| Before                        | After                                    | Reason                             |
| ----------------------------- | ---------------------------------------- | ---------------------------------- |
| `isApproved: Boolean`         | `approvalStatus: PropertyApprovalStatus` | Express state machine explicitly   |
| `bookWholeProperty: Boolean`  | `isWholePropertyBookable: Boolean`       | Consistent naming convention       |
| `wholePropertyPrice: Decimal` | `wholePropertyBasePrice: Decimal`        | Clarify it's base price, not final |

### Unit Model (formerly Room)

| Before                    | After                     | Reason                 |
| ------------------------- | ------------------------- | ---------------------- |
| `roomNumber: String`      | `unitNumber: String`      | Align with Unit rename |
| `amenities RoomAmenity[]` | `amenities UnitAmenity[]` | Align with Unit rename |

### UnitType Model (formerly RoomCategory)

| Before                      | After                       | Reason                 |
| --------------------------- | --------------------------- | ---------------------- |
| `rooms Room[]`              | `units Unit[]`              | Align with Unit rename |
| `inventory RoomInventory[]` | `inventory UnitInventory[]` | Align with Unit rename |

### UnitInventory Model (formerly RoomInventory)

| Before                                        | After        | Reason                      |
| --------------------------------------------- | ------------ | --------------------------- |
| Table name                                    | Renamed      | Align with Unit terminology |
| `categoryId` → `unitTypeId` (already planned) | `unitTypeId` | Align with UnitType rename  |
| `category` → `unitType` (already planned)     | `unitType`   | Align with UnitType rename  |

### Booking Model

| Before                    | After                 | Reason                             |
| ------------------------- | --------------------- | ---------------------------------- |
| `categoryId: String?`     | `unitTypeId: String?` | Align with RoomCategory → UnitType |
| `category: RoomCategory?` | `unitType: UnitType?` | Align with model rename            |

### TourPackage Model

| Before                             | After                         | Reason                               |
| ---------------------------------- | ----------------------------- | ------------------------------------ |
| `availability: TourAvailability[]` | `departures: TourDeparture[]` | Name the concrete list of departures |

### TourBooking Model

| Before                               | After                          | Reason                  |
| ------------------------------------ | ------------------------------ | ----------------------- |
| `tourAvailabilityId: String`         | `tourDepartureId: String`      | Align with model rename |
| `tourAvailability: TourAvailability` | `tourDeparture: TourDeparture` | Align with model rename |

### User Model

| Before       | After                | Reason                               |
| ------------ | -------------------- | ------------------------------------ |
| `role: Role` | `role: PlatformRole` | Distinguish from tenant-scoped roles |

---

## Examples: Code Updates

### Before

```typescript
// Property approval check
if (property.isApproved) {
  // ...
}

// Whole property booking
if (property.bookWholeProperty) {
  const totalPrice = property.wholePropertyPrice * nights;
}

// Room category access
const rooms = await db.room.findMany({
  where: { categoryId: category.id },
});

// Tour availability
const tours = await db.tourAvailability.findMany({
  where: { tourPackageId: pkgId },
});

// User role check
if (user.role === Role.PROPERTY_OWNER) {
  // ...
}
```

### After

```typescript
// Property approval check
if (property.approvalStatus === PropertyApprovalStatus.APPROVED) {
  // ...
}

// Whole property booking
if (property.isWholePropertyBookable) {
  const totalPrice = property.wholePropertyBasePrice * nights;
}

// Unit access
const units = await db.unit.findMany({
  where: { unitTypeId: unitType.id },
});

// Unit amenities
const amenities = await db.unitAmenity.findMany({
  where: { unitId: unit.id },
});

// Tour departures
const departures = await db.tourDeparture.findMany({
  where: { tourPackageId: pkgId },
});

// User platform role check
if (user.role === PlatformRole.PROPERTY_OWNER) {
  // ...
}
```

---

## Database Queries

### Before

```sql
-- Property approval
SELECT * FROM "Property" WHERE "approvalStatus" = 'APPROVED';

-- Whole property bookable
SELECT * FROM "Property" WHERE "isWholePropertyBookable" = true;

-- Unit types
SELECT * FROM "UnitType" WHERE "propertyId" = $1;

-- Unit inventory
SELECT * FROM "UnitInventory" WHERE "unitTypeId" = $1 AND date = $2;

-- Tour departures
SELECT * FROM "TourDeparture" WHERE "status" = 'OPEN';
```

### After

```sql
-- Property approval
SELECT * FROM "Property" WHERE "approvalStatus" = 'APPROVED';

-- Whole property bookable
SELECT * FROM "Property" WHERE "isWholePropertyBookable" = true;

-- Unit types
SELECT * FROM "UnitType" WHERE "propertyId" = $1;

-- Tour departures
SELECT * FROM "TourDeparture" WHERE "status" = 'OPEN';
```

---

## Prisma Client Changes

### Before

```typescript
import { PrismaClient, Role, OwnerApplicationStatus, TourAvailabilityStatus } from '@prisma/client';

const user = await prisma.user.update({
  where: { id },
  data: { role: Role.PROPERTY_OWNER },
});

const app = await prisma.ownerApplication.findUnique({
  where: { id },
});

const tours = await prisma.tourAvailability.findMany({
  where: { status: TourAvailabilityStatus.OPEN },
});
```

### After

```typescript
import {
  PrismaClient,
  PlatformRole,
  TenantApplicationStatus,
  TourDepartureStatus,
} from '@prisma/client';

const user = await prisma.user.update({
  where: { id },
  data: { role: PlatformRole.PROPERTY_OWNER },
});

const app = await prisma.tenantApplication.findUnique({
  where: { id },
});

const departures = await prisma.tourDeparture.findMany({
  where: { status: TourDepartureStatus.OPEN },
});
```

---

## Migration Strategy

### PostgreSQL Level

The migration will use Prisma's native rename operations:

```sql
-- Enum renaming
ALTER TYPE "Role" RENAME TO "PlatformRole";
ALTER TYPE "OwnerApplicationStatus" RENAME TO "TenantApplicationStatus";
ALTER TYPE "TourAvailabilityStatus" RENAME TO "TourDepartureStatus";

-- Create new enum
CREATE TYPE "PropertyApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Model renaming
ALTER TABLE "Room" RENAME TO "Unit";
ALTER TABLE "RoomAmenity" RENAME TO "UnitAmenity";
ALTER TABLE "RoomInventory" RENAME TO "UnitInventory";
ALTER TABLE "RoomCategory" RENAME TO "UnitType";
ALTER TABLE "TourAvailability" RENAME TO "TourDeparture";
ALTER TABLE "OwnerApplication" RENAME TO "TenantApplication";

-- Column renaming in Unit
ALTER TABLE "Unit" RENAME COLUMN "roomNumber" TO "unitNumber";
ALTER TABLE "UnitAmenity" RENAME COLUMN "roomId" TO "unitId";
ALTER TABLE "UnitInventory" RENAME COLUMN "categoryId" TO "unitTypeId";

-- Column renaming in Booking
ALTER TABLE "Booking" RENAME COLUMN "roomId" TO "unitId";
ALTER TABLE "Booking" RENAME COLUMN "categoryId" TO "unitTypeId";

-- Column renaming in Reservation
ALTER TABLE "Reservation" RENAME COLUMN "roomId" TO "unitId";
ALTER TABLE "Reservation" RENAME COLUMN "roomInventoryId" TO "unitInventoryId";

-- Column renaming in TourBooking
ALTER TABLE "TourBooking" RENAME COLUMN "tourAvailabilityId" TO "tourDepartureId";

-- Add new column to Property, migrate data, drop old column
ALTER TABLE "Property" ADD COLUMN "approvalStatus" "PropertyApprovalStatus";
UPDATE "Property" SET "approvalStatus" = CASE WHEN "isApproved" THEN 'APPROVED' ELSE 'PENDING' END;
ALTER TABLE "Property" DROP COLUMN "isApproved";

-- Property boolean field renames
ALTER TABLE "Property" RENAME COLUMN "bookWholeProperty" TO "isWholePropertyBookable";
ALTER TABLE "Property" RENAME COLUMN "wholePropertyPrice" TO "wholePropertyBasePrice";
```

---

## Testing Checklist

- [ ] TypeScript compilation passes
- [ ] All imports of renamed enums/models resolve correctly
- [ ] Database queries execute successfully
- [ ] Prisma Client generation completes without warnings
- [ ] Existing data loads correctly (especially approval status migration)
- [ ] Foreign key constraints remain intact
- [ ] Indexes work on renamed columns
- [ ] API responses include new field names
- [ ] API clients can parse new response structure

---

## Common Pitfalls to Avoid

1. **Forgetting relation updates:** When renaming `categoryId` → `unitTypeId`, also update the relation name `category` → `unitType`
2. **Approval status migration:** Data must migrate from `isApproved: true/false` to `approvalStatus: APPROVED/PENDING`
3. **Import conflicts:** Ensure all imports use new enum names after migration
4. **API response mapping:** DTO serializers must use new field names
5. **Old field references:** Search codebase for `RoomCategory`, `TourAvailability`, `bookWholeProperty`, etc. to catch missed updates

---

## Files to Update (Summary)

| Category            | Files                                                 |
| ------------------- | ----------------------------------------------------- |
| **Schema**          | `packages/database/prisma/schema.prisma`              |
| **Generated Types** | `packages/database/src/generated/**` (auto-generated) |
| **Exports**         | `packages/types/src/index.ts`                         |
| **Repositories**    | `packages/database/src/repositories/`                 |
| **Services**        | `apps/api/src/services/`                              |
| **Routes**          | `apps/api/src/routes/`                                |
| **Middleware**      | `apps/api/src/middleware/`                            |
| **Tests**           | `**/__tests__/**/*.test.ts`                           |
| **Seeders**         | `packages/database/prisma/seed.ts`                    |
| **Docs**            | `docs/database/*.md`                                  |

---

## Validation Command Sequence

```bash
# 1. Update schema
# 2. Generate migration
cd packages/database
pnpm run prisma migrate dev --name normalize_schema_for_hospitality_standards

# 3. Validate type safety
pnpm run type-check

# 4. Fix linting
pnpm run lint --fix

# 5. Run tests
pnpm test

# 6. Verify database
pnpm run prisma:studio  # Open UI to verify tables

# 7. Check git changes
git diff packages/database/prisma/schema.prisma
git status
```
