# Booking Lifecycle

This platform supports automated and manual booking flows. Manual confirmations and offline
payments are first-class in MVP.

## Property Booking Lifecycle

### States

This document previously described a conceptual lifecycle (Inquiry/Quote/Held/etc.). The **implemented**
database lifecycle for accommodation bookings is the `AccommodationBookingStatus` enum in Prisma:

- `PENDING`: booking created, inventory reserved for a limited time (hold expiry applies)
- `BOOKED`: payment captured/recorded, awaiting property/operator confirmation
- `CONFIRMED`: property/operator confirmed
- `CHECKED_IN`: guest arrived
- `CHECKED_OUT`: guest departed
- `CANCELLED`: cancelled by guest/operator/system
- `NO_SHOW`: guest did not arrive

Anything not listed above is **not represented as a first-class booking status** yet.

### Automated Flow (Typical)

```mermaid
stateDiagram-v2
  [*] --> PENDING
  PENDING --> BOOKED
  BOOKED --> CONFIRMED
  CONFIRMED --> CHECKED_IN
  CHECKED_IN --> CHECKED_OUT
  PENDING --> CANCELLED
  BOOKED --> CANCELLED
  CONFIRMED --> CANCELLED
```

### Manual Confirmation Flow

```mermaid
stateDiagram-v2
  [*] --> PENDING
  PENDING --> BOOKED
  BOOKED --> CONFIRMED
  CONFIRMED --> CANCELLED
```

### Invariants

- A booking should not be moved forward in the lifecycle without an immutable price snapshot (`BookingPriceSnapshot`).
- Holds expire; pending bookings must be cancelled when the hold expires (worker expiry job).
- Booking status transitions should be append-only and audited (status history table exists).

## Tour Booking Lifecycle

Tours have two booking patterns: fixed departures and custom requests.

### Fixed Departure Flow (MVP)

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> HoldRequested
  HoldRequested --> Held
  Held --> PendingPayment
  PendingPayment --> Confirmed
  Held --> Expired
  PendingPayment --> Failed
  Confirmed --> Cancelled
  Expired --> [*]
  Failed --> [*]
```

### Custom Tour Request Flow

```mermaid
stateDiagram-v2
  [*] --> Inquiry
  Inquiry --> QuoteIssued
  QuoteIssued --> Negotiating
  Negotiating --> QuoteIssued
  QuoteIssued --> HoldRequested
  HoldRequested --> Held
  Held --> AwaitingVendorConfirmation
  AwaitingVendorConfirmation --> PendingPayment
  PendingPayment --> AwaitingManualPayment
  AwaitingManualPayment --> Confirmed
  QuoteIssued --> Expired
```

### Invariants

- Departure capacity is enforced for fixed tours.
- Custom tours require an accepted quote before holds.
- Manual confirmation is required when operators are coordinating.

## Concurrency and Holds

- Holds are first-come, first-served and time-boxed.
- Holds must be idempotent by client request ID.
- Confirmations re-validate hold ownership and quote validity.
- Booking status transitions are append-only and audited.
