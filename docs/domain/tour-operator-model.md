# Tour Operator Model

This document describes the Tour Operator's role on the platform, how they differ from
accommodation vendors, and the design of the Tour Operator Dashboard.

---

## What Is a Tour Operator?

A Tour Operator is a business (or individual) registered on the Khan Familia platform with the
`EXPERIENCES_TOURS` business vertical. They are responsible for:

- Creating and publishing tour packages.
- Scheduling specific departure dates with a defined capacity.
- Managing participant bookings and passenger manifests.
- Confirming or rejecting bookings (for approval-required packages).
- Ensuring all trip logistics are met for each departure.

---

## How a Tour Operator Differs from an Accommodation Vendor

| Dimension    | Accommodation Vendor                 | Tour Operator                        |
| ------------ | ------------------------------------ | ------------------------------------ |
| Product      | `Property` + `UnitType` (rooms)      | `TourPackage` (experiences)          |
| Inventory    | Per-date, per-unit-type availability | Fixed-capacity dated departures      |
| Booking Unit | Nightly room reservation             | Seats on a departure                 |
| Guest Data   | Guest name + check-in time           | Full passenger manifest per person   |
| Dashboard    | Room calendar, occupancy, revenue    | Departure scheduler, manifest viewer |
| Approval     | Optional per property                | Optional per package                 |
| Hold Model   | `PropertyHold` (15-min TTL)          | None — atomic booking                |

---

## Tour Operator API Access

Tour Operator API routes are gated to tenants with `businessVertical = 'EXPERIENCES_TOURS'`.
Middleware enforces this check; accommodation vendor JWTs cannot access these routes.

### Planned API Surface (Tour Module — Phases A–D)

**Package Management:**

```
POST   /tenants/:tenantId/tours                         → Create draft package
PATCH  /tenants/:tenantId/tours/:id                     → Update package
POST   /tenants/:tenantId/tours/:id/itinerary           → Upsert itinerary days
POST   /tenants/:tenantId/tours/:id/publish             → Publish package
DELETE /tenants/:tenantId/tours/:id                     → Soft-delete package
```

**Departure Management:**

```
POST   /tenants/:tenantId/tours/:id/departures          → Schedule a departure
PATCH  /tenants/:tenantId/tours/:id/departures/:depId   → Update capacity or status
```

**Booking Management:**

```
GET    /tenants/:tenantId/tours/:id/departures/:depId/manifest  → Passenger manifest
POST   /tenants/:tenantId/tours/bookings/:id/approve            → Approve booking
POST   /tenants/:tenantId/tours/bookings/:id/reject             → Reject booking
```

**Public Discovery (Guest-Facing):**

```
GET    /tours                                           → Search published packages
GET    /tours/:slug                                     → Package detail + departures
POST   /tours/:id/departures/:departureId/book          → Book seats on a departure
```

---

## The Passenger Manifest

This is one of the most critical operational tools for a tour operator. It is a structured
list of every person confirmed on a specific departure. Your brother would use this to:

- Know exactly who is on the bus on departure day.
- Have emergency contact numbers for every participant.
- Verify government ID documents if required by law.
- Manage dietary requirements or special accommodations.

The manifest is populated from `TourParticipant` rows:

| Field              | Required | Purpose                     |
| ------------------ | -------- | --------------------------- |
| `firstName`        | Yes      | Identity                    |
| `lastName`         | Yes      | Identity                    |
| `age`              | Optional | Age-restricted tours        |
| `phone`            | Optional | Direct contact              |
| `emergencyContact` | Optional | Mountain/remote tours       |
| `isGroupLeader`    | Yes      | Who paid / point of contact |

---

## Group Booking Model

One person (the group leader) books on behalf of the whole party. This is the industry standard:

- A single `TourBooking` record with `numberOfPeople: 4`.
- Four `TourParticipant` records — one per person (one marked `isGroupLeader: true`).
- One Stripe payment charged to the group leader.
- The booking deducts `4` from `TourDeparture.bookedCount`.

The guest fills in participant details for all members at checkout. The operator sees the
full manifest.

---

## Package Types and Approval

Each `TourPackage` has a `requiresApproval` flag:

| `requiresApproval` | Behavior                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| `false` (default)  | Payment captured immediately on booking. Status → `CONFIRMED` automatically.                     |
| `true`             | Payment authorized only. Operator reviews participant details. Approve → capture. Reject → void. |

**Use `requiresApproval: true` for:**

- Private charters (the operator needs to agree on logistics).
- Honeymoon or bespoke packages.
- Tours with fitness/age requirements that need verification.

**Use `requiresApproval: false` for:**

- Standard group tours with a fixed van and fixed price.
- Any package where the operator is comfortable with automatic confirmation.

---

## Dashboard Separation

The Tour Operator Dashboard is a completely separate frontend from:

- The **Accommodation Vendor Dashboard** (room calendar, unit management).
- The **Super Admin Dashboard** (platform-wide moderation).

When a user with `businessVertical = 'EXPERIENCES_TOURS'` logs in, the frontend checks their
tenant's vertical and routes them exclusively to the Tour Operator interface. They will never
see hotel room management screens.

---

## Invariants

- A tour operator cannot access accommodation vendor API routes, and vice versa.
- A departure's `bookedCount` can never exceed `maxCapacity` (enforced by DB constraint).
- A tour package must have at least one `TourItineraryDay` before it can be published.
- Departures can only be scheduled for published packages.
- `TourParticipant` rows must match `TourBooking.numberOfPeople`.
- Price snapshots are immutable once attached to a booking.
