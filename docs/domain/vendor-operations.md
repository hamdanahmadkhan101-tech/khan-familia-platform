# Vendor Operations

## Operational Responsibilities

- Confirm holds that require manual approval.
- Maintain accurate availability and pricing.
- Respond to booking change requests.

## Vendor Confirmation Flow (MVP)

- Booking enters AwaitingVendorConfirmation.
- Vendor accepts or rejects within a defined SLA.
- Acceptance proceeds to payment; rejection cancels the hold.

## Vendor Staff Model

- VendorAdmin: full access
- VendorStaff: limited operational access

## Invariants

- Vendor users cannot access other vendor data.
- Confirmation actions are audited and time-stamped.
