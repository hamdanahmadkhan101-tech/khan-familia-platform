# Prisma Schema Naming Audit & Normalization Plan

**Date:** May 18, 2026  
**Status:** Professional normalization for v1  
**Scope:** Hospitality + tour platform naming standards

---

## 1. NAMING AUDIT LIST

### Current Issues Identified

| Enum / Model / Field | Current Name                  | Issue                                                          | Priority            |
| -------------------- | ----------------------------- | -------------------------------------------------------------- | ------------------- |
| Enum                 | `Role`                        | Generic; conflates platform and tenant roles                   | **HIGH**            |
| Model                | `OwnerApplication`            | Generic; doesn't reflect tenant/business context               | **HIGH**            |
| Model                | `RoomCategory`                | Imprecise; should be `UnitType` in hospitality                 | **HIGH**            |
| Field                | `Property.isApproved`         | Boolean; lacks approval workflow state                         | **HIGH**            |
| Model                | `TourAvailability`            | Vague; should be `TourDeparture` (specific departure instance) | **HIGH**            |
| Field                | `Property.bookWholeProperty`  | Unclear verb; should be `isWholePropertyBookable`              | **MEDIUM**          |
| Field                | `Property.wholePropertyPrice` | Vague; should be `wholePropertyBasePrice`                      | **MEDIUM**          |
| Model                | `Room`                        | Industry standard, but long-term rename to `Unit` noted        | **LOW** (v1 stable) |

---

## 2. RENAME PLAN & RATIONALE

### 2.1 `Role` → `PlatformRole`

**Current:**

```prisma
enum Role {
  USER
  PROPERTY_OWNER
  ADMIN
}
```

**Rationale:**

- Clarifies that this enum controls **platform-level** access only
- Distinguishes from `TenantRole` (org-scoped roles: OWNER, ADMIN, STAFF)
- Industry standard: platform roles are global; tenant roles are org-scoped
- Prevents confusion: "what role does the User have?" → Platform or Tenant?

**Impact:**

- Update `User.role` from `Role` to `PlatformRole`
- Update all references in services, middleware, and seeders
- **Breaking change:** Requires API version bump or migration guide

---

### 2.2 `OwnerApplication` → `TenantApplication`

**Current:**

```prisma
model OwnerApplication {
  id String @id
  userId String
  status OwnerApplicationStatus
  approvedTenantId String?
  // ... vendor details
}
```

**Rationale:**

- "Owner" is ambiguous: does it mean property owner, business owner, or platform owner?
- `TenantApplication` is precise: this is a request to create/join a **business tenant**
- Alternative: `BusinessApplication` (equally valid, but `TenantApplication` aligns with domain model)
- Hospitality standard: vendors apply to become "tenants" (organizational entities)

**Impact:**

- Rename model, update all relations and queries
- Rename enum: `OwnerApplicationStatus` → `TenantApplicationStatus`
- Update service layer and onboarding workflows

---

### 2.3 `RoomCategory` → `UnitType`

**Current:**

```prisma
model RoomCategory {
  id String @id
  propertyId String
  name String  // e.g., "Standard Room", "Deluxe Suite"
  rooms Room[]
  inventory RoomInventory[]
  bookings Booking[]
}
```

**Rationale:**

- Hospitality standard: "room type" or "unit type" classifies accommodations
- `RoomCategory` is imprecise; `UnitType` is industry-standard terminology
- Applies to hotels, resorts, villas, apartments (all unit-based inventory)
- More scalable: if we later add boat cabins, glamping units, etc., `UnitType` remains appropriate

**Impact:**

- Rename model from `RoomCategory` to `UnitType`
- Update relations: `Room.categoryId` → `Room.unitTypeId`, `Room.category` → `Room.unitType`
- Update `RoomInventory.categoryId` → `RoomInventory.unitTypeId`, etc.
- Update all indexes and unique constraints
- **Note:** Keep `Room` model name unchanged in v1 (see below)

---

### 2.4 `Property.isApproved` → `Property.approvalStatus` (Enum)

**Current:**

```prisma
model Property {
  // ...
  isApproved Boolean @default(false)
  approvedAt DateTime?
  approvedById String?
  approvedBy User?
  rejectedAt DateTime?
  rejectedById String?
  rejectedBy User?
  rejectionReason String?
}
```

**Problem:**

- Boolean only expresses two states; the schema tracks three (pending, approved, rejected)
- `rejectionReason` dangling when `isApproved=true` is confusing
- No way to distinguish "pending" from "rejected" without reading rejection fields

**Proposed Enum:**

```prisma
enum PropertyApprovalStatus {
  PENDING      // Initial state
  APPROVED     // Approved by admin
  REJECTED     // Rejected by admin; see rejectionReason
}
```

**Updated Field:**

```prisma
model Property {
  approvalStatus PropertyApprovalStatus @default(PENDING)
  approvedAt DateTime?
  approvedById String?
  approvedBy User?
  rejectedAt DateTime?
  rejectedById String?
  rejectedBy User?
  rejectionReason String?
  // Remove: isApproved Boolean
}
```

**Rationale:**

- Explicit state machine: PENDING → {APPROVED | REJECTED}
- Clears semantic ambiguity
- Aligns with `TenantStatus`, `TenantUserStatus`, `BookingStatus` patterns
- Easier to index and query: `WHERE approvalStatus = 'APPROVED'`

**Impact:**

- Create new enum `PropertyApprovalStatus`
- Rename/replace field in migrations
- Update all queries that check `isApproved`
- Update approval service layer

---

### 2.5 `TourAvailability` → `TourDeparture`

**Current:**

```prisma
model TourAvailability {
  id String @id
  tourPackageId String
  departureDate DateTime @db.Date
  returnDate DateTime @db.Date
  maxCapacity Int
  bookedCount Int
  status TourAvailabilityStatus
}
```

**Rationale:**

- `TourAvailability` is abstract; it doesn't name the **thing** it represents
- A row in this table is a **specific departure instance** (e.g., "Swat tour, June 15–22, 2026")
- Industry standard: tour operators refer to "departure dates" or "departures"
- More intuitive: "book a departure" vs. "book an availability"
- Example: `tour.departures.filter(d => d.departureDate >= today)`

**Enum Rename:**

```prisma
enum TourDepartureStatus {  // was TourAvailabilityStatus
  OPEN
  FULL
  CLOSED
  CANCELLED
}
```

**Updated Relations:**

```prisma
model TourPackage {
  // ...
  departures TourDeparture[]  // was: availability
}

model TourBooking {
  // ...
  tourDepartureId String  // was: tourAvailabilityId
  tourDeparture TourDeparture  // was: tourAvailability
}
```

**Impact:**

- Rename model, enum, and all FK fields
- Update relation names in TourPackage and TourBooking
- Update queries throughout tour booking flow
- Update API field names for consistency

---

### 2.6 `Property.bookWholeProperty` → `Property.isWholePropertyBookable`

**Current:**

```prisma
model Property {
  bookWholeProperty Boolean @default(false)
  wholePropertyPrice Decimal?
}
```

**Issue:**

- `bookWholeProperty` is a verb phrased as a boolean; reads awkwardly
- Should ask: "is this property bookable as a whole?"

**Renamed:**

```prisma
isWholePropertyBookable Boolean @default(false)
```

**Rationale:**

- Prefix `is` clarifies it's a state, not an action
- Consistent with other boolean flags: `isApproved`, `isDeleted`, `isPublished`, `isAvailable`, `hasBalcony`, etc.
- More readable: "If property.isWholePropertyBookable, show whole-property price"

**Impact:**

- Simple field rename; no structural change
- Update all queries and service logic
- Update API response mapping

---

### 2.7 `Property.wholePropertyPrice` → `Property.wholePropertyBasePrice`

**Current:**

```prisma
wholePropertyPrice Decimal? @db.Decimal(10, 2)
```

**Issue:**

- `wholePropertyPrice` is ambiguous: is it nightly? per stay? base or final?
- Schema has `pricePerNight` for rooms; what does "whole property price" mean?

**Rationale:**

- Hospitality standard: "base price" is the starting price before adjustments (discounts, taxes, fees)
- Clarifies: this is not the **final** price; it's subject to modifiers
- Naming pattern: matches `Room.pricePerNight` (field name includes unit: per night)
- For whole-property: base price is typically per stay/booking, not per night

**Renamed:**

```prisma
wholePropertyBasePrice Decimal? @db.Decimal(10, 2)
```

**Rationale for "base":**

- Signals: this is the starting point for calculation
- Prevents confusion: not a discounted price, not a final invoice price
- Consistent with financial/ecommerce patterns

**Impact:**

- Simple field rename
- Update all pricing logic and APIs
- Update documentation on booking price calculation flow

---

### 2.8 `Room` → `Unit` (and Related Renames)

**Current:**

```prisma
model Room {
  roomNumber String
  // ...
}

model RoomAmenity { }
model RoomInventory { }
```

**Updated (Now):**

```prisma
model Unit {
  unitNumber String
  // ...
}

model UnitAmenity { }
model UnitInventory { }
```

**Rationale for Full Rename (Phase 1):**

- `Unit` is the hospitality standard term for a bookable accommodation unit (applies to hotels, villas, apartments, cabins, houseboats, glamping, etc.)
- `Room` is too specific; not all properties have "rooms" (e.g., a villa rents as a whole unit; a houseboat cabin is a unit)
- `RoomAmenity` → `UnitAmenity`: clarity that amenities attach to units, not just rooms
- `RoomInventory` → `UnitInventory`: consistency with the unit-based inventory model
- Cleaner professional terminology from the start
- Once `UnitType` is named, the pair is clear: each `Unit` is an instance of a `UnitType`

**Decision:** Implement in this phase (v1 foundation), not deferred to v2

**Impact:** All related fields renamed:

- `roomNumber` → `unitNumber`
- `rooms Room[]` → `units Unit[]`
- `roomCategories` → `unitTypes`
- `roomInventory` → `unitInventory`
- Indexes and constraints updated

---

## 3. REVISED SCHEMA-V1 NAMING PROPOSAL

### 3.1 Affected Enums

```prisma
enum PlatformRole {
  USER
  PROPERTY_OWNER
  ADMIN
}

enum PropertyApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

enum TenantApplicationStatus {
  PENDING
  APPROVED
  REJECTED
}

enum TourDepartureStatus {
  OPEN
  FULL
  CLOSED
  CANCELLED
}
```

### 3.2 Affected Models & Fields

**User:**

```prisma
role PlatformRole @default(USER)  // was: Role
```

**Property:**

```prisma
approvalStatus PropertyApprovalStatus @default(PENDING)  // was: isApproved Boolean
isWholePropertyBookable Boolean @default(false)  // was: bookWholeProperty
wholePropertyBasePrice Decimal? @db.Decimal(10, 2)  // was: wholePropertyPrice
```

**Room:**

```prisma
unitTypeId String  // was: categoryId
unitType UnitType @relation(...)  // was: category
```

**UnitType** (renamed from RoomCategory):

```prisma
model UnitType {
  id String @id
  propertyId String
  property Property @relation(...)
  tenantId String
  tenant Tenant @relation(...)
  name String
  createdAt DateTime
  updatedAt DateTime

  rooms Room[]
  inventory RoomInventory[]
  bookings Booking[]

  @@unique([propertyId, name])
}
```

**RoomInventory:**

```prisma
unitTypeId String  // was: categoryId
unitType UnitType @relation(...)  // was: category RoomCategory
```

**Booking:**

```prisma
unitTypeId String?  // was: categoryId
unitType UnitType? @relation(...)  // was: category RoomCategory?
```

**TourDeparture** (renamed from TourAvailability):

```prisma
model TourDeparture {
  id String @id
  tourPackageId String
  tourPackage TourPackage @relation(...)
  departureDate DateTime @db.Date
  returnDate DateTime @db.Date
  maxCapacity Int
  bookedCount Int
  status TourDepartureStatus @default(OPEN)
  priceOverride Decimal?
  notes String?
  createdAt DateTime
  updatedAt DateTime

  bookings TourBooking[]

  @@unique([tourPackageId, departureDate])
}
```

**TourPackage:**

```prisma
departures TourDeparture[]  // was: availability
```

**TourBooking:**

```prisma
tourDepartureId String  // was: tourAvailabilityId
tourDeparture TourDeparture @relation(...)  // was: tourAvailability
```

**TenantApplication** (renamed from OwnerApplication):

```prisma
model TenantApplication {
  id String @id
  userId String
  user User @relation(...)
  status TenantApplicationStatus @default(PENDING)
  approvedTenantId String?

  fullName String
  phone String
  // ... rest of vendor details
}
```

---

## 4. IMPACT & MIGRATION STRATEGY

### 4.1 Code Changes Required

| Layer         | Changes                                                                                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Enums**     | `Role` → `PlatformRole`, add `PropertyApprovalStatus`, rename `TourAvailabilityStatus` → `TourDepartureStatus`, rename `OwnerApplicationStatus` → `TenantApplicationStatus`                                                                            |
| **Models**    | `RoomCategory` → `UnitType`, `TourAvailability` → `TourDeparture`, `OwnerApplication` → `TenantApplication`                                                                                                                                            |
| **Fields**    | `Property.isApproved` → `Property.approvalStatus`, `Property.bookWholeProperty` → `Property.isWholePropertyBookable`, `Property.wholePropertyPrice` → `Property.wholePropertyBasePrice`, all `categoryId` → `unitTypeId` in Room/RoomInventory/Booking |
| **Relations** | All relation names affected by model renames; FK updates throughout                                                                                                                                                                                    |
| **Services**  | Queries, filters, and business logic in repositories and service layer                                                                                                                                                                                 |
| **Seeders**   | Update initial data scripts                                                                                                                                                                                                                            |
| **Tests**     | Update test fixtures and assertions                                                                                                                                                                                                                    |
| **API**       | Field mappings in DTO/responses; client SDKs                                                                                                                                                                                                           |

### 4.2 Prisma Migration Approach

**Strategy:** One comprehensive migration covering all renames

```bash
# Create a single migration that:
# 1. Renames columns (Category → UnitType)
# 2. Renames enums
# 3. Adds PropertyApprovalStatus enum and approvalStatus field
# 4. Renames TourAvailability → TourDeparture
# 5. Renames OwnerApplication → TenantApplication
# 6. Renames boolean fields on Property

# Migration name: rename_schema_for_hospitality_standard
pnpm run prisma migrate dev --name rename_schema_for_hospitality_standard
```

### 4.3 Code Update Checklist

- [ ] Update `packages/database/prisma/schema.prisma` (enums, models, fields)
- [ ] Run Prisma migration generation
- [ ] Update `packages/types/src/index.ts` (if re-exporting types)
- [ ] Update all repository queries
- [ ] Update service layer logic (especially approval and pricing)
- [ ] Update middleware and utilities
- [ ] Update seeders and fixtures
- [ ] Update API route handlers and DTOs
- [ ] Update test fixtures
- [ ] Update `docs/database/schema-v1.md` to reflect naming
- [ ] Create `MIGRATION_GUIDE.md` for API consumers

---

## 5. WHAT REMAINS UNCHANGED

### 5.1 Architectural Decisions (Preserved)

✅ **Separate aggregates:** `Booking` and `TourBooking` remain independent  
✅ **Tenant scoping:** All operational tables retain `tenantId`  
✅ **Platform vs. tenant roles:** `PlatformRole` (global) + `TenantRole` (org-scoped) distinction  
✅ **Normalized relations:** Room → UnitType, Booking → Room, etc.  
✅ **Inventory model:** `RoomInventory` as source of truth (no changes)  
✅ **Payment separation:** `Payment` (accommodation) and `TourPayment` (tours) remain separate  
✅ **Audit & history:** Append-only audit logs, soft deletes for catalog rows  
✅ **Soft delete pattern:** Applied consistently to catalog/searchable rows

### 5.2 Models & Fields (No Changes)

**Fully stable:**

- `User`, `Tenant`, `TenantUser`, `TenantInvite` (no renames needed)
- `Booking`, `BookingGuest`, `BookingSpecialRequest`, `Reservation` (booking aggregate logic intact; field names updated to use `unitId` etc.)
- `TourBooking`, `TourPackage`, `TourItineraryDay` (tour aggregate intact; now uses `TourDeparture`)
- `Payment`, `TourPayment` (payment models stable)
- `Review`, `Notification`, `PromoCode`, `Wishlist`, `SearchHistory` (no changes)
- `AuditLog`, `ProcessedEvent`, `PropertyInquiry`, `SupportTicket` (no changes)
- `PropertyAmenity` (stable; only references updated)

**Minor updates only (FK/relation updates due to model renames):**

- `TenantRole` enum (keeps: OWNER, ADMIN, STAFF)
- `BookingStatus` enum (keeps: PENDING, BOOKED, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED, NO_SHOW)
- `TourBookingStatus` enum (no changes)
- Cancellation policy model (stable)
- Support ticket and inquiry models (stable)

### 5.3 Inventory, Payment, Audit Structures (Fully Preserved)

- `RoomInventory` check constraints and optimistic locking: **unchanged**
- `TourDeparture.bookedCount` invariant: **unchanged**
- Payment workflow (Payment → status progression): **unchanged**
- Audit log structure and access patterns: **unchanged**

---

## 6. SUMMARY

| Rename | From                 | To                                      | Reason                                             | Status               |
| ------ | -------------------- | --------------------------------------- | -------------------------------------------------- | -------------------- |
| 1      | `Role`               | `PlatformRole`                          | Distinguish platform-level from tenant-level roles | ✅ Implementing      |
| 2      | `OwnerApplication`   | `TenantApplication`                     | Precise: business application to create org        | ✅ Implementing      |
| 3      | `RoomCategory`       | `UnitType`                              | Hospitality standard terminology                   | ✅ Implementing      |
| 4      | `isApproved` (bool)  | `approvalStatus` (enum)                 | Express full state machine explicitly              | ✅ Implementing      |
| 5      | `bookWholeProperty`  | `isWholePropertyBookable`               | Clearer boolean naming convention                  | ✅ Implementing      |
| 6      | `wholePropertyPrice` | `wholePropertyBasePrice`                | Clarify it's base, not final                       | ✅ Implementing      |
| 7      | `TourAvailability`   | `TourDeparture`                         | Name the thing itself; industry standard           | ✅ Implementing      |
| 8      | `Room` + related     | `Unit` + `UnitAmenity`, `UnitInventory` | Hospitality standard; scalable terminology         | ✅ Implementing (v1) |

**Total Breaking Changes:** 8 (enums, model names, field names)  
**Stability Impact:** High (schema-wide); justify with naming standards doc  
**Timeline:** All complete in this phase before feature implementation  
**Status:** Schema changes ready in `feature/schema-implementation` branch
