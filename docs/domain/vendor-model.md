# Vendor Model

## Overview

Vendors are independent suppliers who own inventory and pricing for properties and tours. The
platform provides onboarding, moderation, and payment facilitation.

## Vendor Onboarding (MVP)

- Account creation (Clerk + `User` sync)
- **Implemented:** self-serve workspace via `POST /tenants` (user becomes OWNER)
- **Planned:** `TenantApplication` submission and admin approval before tenant creation
- Payout setup (planned)
- Property listing moderation via `Property.approvalStatus` (API implemented; booking/public gating planned)

## Vendor Responsibilities

- Maintain accurate inventory and availability.
- Respond to manual confirmation requests.
- Set pricing rules within allowed constraints.
- Comply with platform policies and local regulations.

## Vendor Staff and Roles

- VendorAdmin: full control over inventory and pricing.
- VendorStaff: limited access for operations and confirmations.
- Invitations are tracked and scoped to a single vendor.

## Vendor Statuses

- Draft: profile created, not submitted
- PendingReview: submitted for moderation
- Active: approved and can publish
- Suspended: temporarily blocked

## Suspension Effects

- New bookings are blocked.
- Existing confirmed bookings require manual resolution.
- Inventory visibility can be hidden by moderators.

## Invariants

- Only active vendors can publish inventory.
- A vendor owns all inventory they create.
- Vendor users can access only their vendor data.
- Ownership transfer requires admin approval and audit.
