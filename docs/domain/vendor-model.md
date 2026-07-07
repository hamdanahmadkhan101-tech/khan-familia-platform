# Vendor Model

## Overview

Vendors are businesses (or individuals) approved to supply inventory on the Khan Familia platform.
The platform provides onboarding (via admin-reviewed applications), moderation, and payment facilitation.

There are two vendor types, distinguished by `Tenant.businessVertical`:

- **Accommodation Vendors** (`ACCOMMODATIONS_STAYS`): Hotels, villas, guest houses, apartments.
- **Tour Operators** (`EXPERIENCES_TOURS`): Tour agencies, experience providers.

See `docs/domain/vendor-onboarding.md` for the onboarding flow.
See `docs/domain/tour-operator-model.md` for tour-specific details.

---

## Tenant Roles

All vendor staff use the standard `TenantRole` enum (not a separate vendor-specific enum):

| Role    | Access                                                                             |
| ------- | ---------------------------------------------------------------------------------- |
| `OWNER` | Full control: settings, billing, staff management, all operations.                 |
| `ADMIN` | Manage inventory, bookings, listings. Cannot transfer ownership or manage billing. |
| `STAFF` | Operations access: view bookings, manage check-ins. Cannot modify pricing.         |

Invitations to staff are scoped to a single tenant.

---

## Vendor Responsibilities

- Maintain accurate inventory and availability.
- Respond to manual booking confirmation requests promptly.
- Set pricing within allowed platform constraints.
- Comply with platform policies and local regulations.
- Provide accurate and legal business identity documents during onboarding.

---

## Suspension Effects

If suspended by the platform admin:

- New bookings are blocked immediately.
- Existing confirmed bookings require manual resolution with affected guests.
- Inventory and listing visibility can be hidden from public search.

---

## Invariants

- Only tenants with an active status can publish inventory or accept bookings.
- A vendor owns all inventory and listings they create.
- Vendor users can only access data scoped to their own tenant.
- Ownership transfer between users requires `SUPER_ADMIN` approval and creates an audit log entry.
