# Tour Domain

## Overview

Tours are a distinct product domain from accommodation bookings. They use a departure-based
inventory model (fixed-capacity dated slots) rather than calendar-based room availability.

The platform is designed to support **multiple tour operator tenants** in the future, but for
MVP, a single tour operator (family member of the platform owner) is the primary operator.

---

## Who Can Sell Tours?

Not every tenant on the platform can create and sell tours. Tour selling access is gated by the
`BusinessVertical` field on the `Tenant` model:

| Value                  | Who                               | Access                               |
| ---------------------- | --------------------------------- | ------------------------------------ |
| `ACCOMMODATIONS_STAYS` | Hotel / villa / apartment vendors | Property catalog, room bookings      |
| `EXPERIENCES_TOURS`    | Tour operators                    | Tour packages, departures, manifests |

Only tenants registered with `EXPERIENCES_TOURS` can access the Tour Operator API routes. This
is enforced at the middleware layer. Future tour operators are onboarded through the standard
`TenantApplication` process with the `EXPERIENCES_TOURS` vertical selected.

---

## Domain Separation

Tours do not share models with property bookings:

| Concept      | Accommodation                             | Tours                                           |
| ------------ | ----------------------------------------- | ----------------------------------------------- |
| Product      | `Property` + `UnitType`                   | `TourPackage`                                   |
| Inventory    | `UnitInventory` (per-date, per-unit-type) | `TourDeparture` (per-departure, capacity-based) |
| Hold         | `PropertyHold` (15-min TTL)               | None (atomic booking)                           |
| Booking      | `AccommodationBooking`                    | `TourBooking`                                   |
| Participants | `BookingGuest`                            | `TourParticipant` (per person)                  |
| Price record | `BookingPriceSnapshot`                    | `BookingPriceSnapshot`                          |

---

## Tour Package Types (MVP)

### Fixed Departure Tour

- Pre-scheduled departures with a fixed `maxCapacity` (e.g., seats in a 12-person Hiace).
- Guest books `numberOfPeople` seats on a specific `TourDeparture`.
- One person (the group leader) books and pays for the whole group.
- Participants enter individual details (name, age, emergency contact) at checkout.

### Approval-Required Tour

- A `TourPackage` with `requiresApproval = true`.
- Payment is authorized (not captured) at booking.
- The operator reviews participant details and confirms or rejects.
- On confirmation, Stripe captures the payment.
- Suitable for private charters, honeymoon packages, bespoke itineraries.

> **Note:** Custom Tour Requests (inquiry → quote → negotiation → hold) were considered in
> early design documents but are **out of scope for MVP**. All references to
> `CustomTourRequest` in older documents should be treated as future work.

---

## Core Aggregates

### TourPackage

The product definition: title, category, difficulty, duration, inclusions, highlights,
pricing type (`PER_PERSON` or `PER_GROUP`), and whether the tour requires operator approval.

### TourItineraryDay

One row per day in the tour. Describes what happens each day (accommodations, meals, activities,
transport notes). Can optionally link to a partner `Property` for overnight accommodation.

### TourDeparture

A specific dated instance of a `TourPackage`. Contains `departureDate`, `returnDate`,
`maxCapacity`, and `bookedCount`. When `bookedCount == maxCapacity`, the departure is full.
A database-level `CHECK` constraint enforces that `bookedCount` can never exceed `maxCapacity`.

### TourBooking

A reservation by a group leader for a specific `TourDeparture`. Contains `numberOfPeople`,
contact details, and the booking status/payment status.

### TourParticipant

One row per person in the booking. Contains first name, last name, age, phone, and
emergency contact. This data forms the **passenger manifest** visible to the operator.

---

## Tour Capacity Model

Unlike hotels (where you block specific calendar dates), tour capacity is managed at the
departure level:

```
TourDeparture.maxCapacity = 12
TourDeparture.bookedCount = 7   ← atomically incremented on successful payment
Available seats = 12 - 7 = 5
```

When a booking is made for `numberOfPeople = 3`, the system:

1. Validates `bookedCount + 3 <= maxCapacity` inside a transaction.
2. Increments `bookedCount` by 3.
3. The DB-level check constraint prevents overselling even under concurrent load.

---

## Tour Lifecycle States

```
TourPackage:    DRAFT → PUBLISHED → ARCHIVED
TourDeparture:  OPEN → FULL → COMPLETED → CANCELLED
TourBooking:    PENDING → CONFIRMED → COMPLETED / CANCELLED
```

### Departure Status Transitions

| Status      | Meaning                          |
| ----------- | -------------------------------- |
| `OPEN`      | Seats available                  |
| `FULL`      | `bookedCount == maxCapacity`     |
| `COMPLETED` | Departure date has passed        |
| `CANCELLED` | Operator cancelled the departure |

---

## Dashboard Separation

Tour Operator tenants (`EXPERIENCES_TOURS`) see a **completely different dashboard** from
accommodation vendors. Key features of the Tour Operator Dashboard:

- **Package Builder**: Create and publish tour packages with itinerary builder.
- **Departure Scheduler**: Schedule specific dates and set capacity.
- **Passenger Manifest**: Per-departure list of all participants with contact and ID details.
- **Booking Management**: Approve or reject bookings, view payment status.

This dashboard is separate from both the Accommodation Vendor Dashboard and the Super Admin
Dashboard by design.

---

## Invariants

- A `TourDeparture` cannot have its capacity reduced below its current `bookedCount`.
- `TourParticipant` rows must be created for every person in the booking.
- Tours and properties do not share availability or pricing rules.
- Publishing a `TourPackage` requires at least one `TourItineraryDay`.
- A departure can only be scheduled for a published tour package.
- Price snapshots are immutable once attached to a booking.
- Abandoned `PENDING` tour bookings without payment are swept after 30 minutes.
