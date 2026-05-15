# Payment Domain

## Purpose

Payments handle authorization, capture, refunds, manual verification, and vendor payouts for both
property and tour bookings.

## Core Entities

- PaymentIntent
- PaymentRecord
- ManualPaymentProof
- Refund
- PayoutBatch

## Supported Methods (MVP)

- Card (gateway)
- Bank transfer
- Easypaisa / JazzCash
- Cash or in-person

## Payment Intent Lifecycle

```mermaid
stateDiagram-v2
  [*] --> Created
  Created --> Authorized
  Created --> AwaitingManualPayment
  Created --> Failed
  Authorized --> Captured
  Authorized --> Cancelled
  AwaitingManualPayment --> Verified
  AwaitingManualPayment --> Failed
  Verified --> Captured
  Captured --> Refunded
  Failed --> [*]
  Cancelled --> [*]
  Refunded --> [*]
```

## Manual Payment Flow

1. Booking enters AwaitingManualPayment.
2. Customer submits proof (receipt, transfer ID).
3. Operator verifies and records PaymentRecord.
4. Booking is confirmed once payment is verified.

## Invariants

- One active payment intent per booking.
- Capture only after booking confirmation or manual verification.
- Manual payments must store proof and operator identity.
- Refunds must reference a captured payment.

## Payouts (MVP)

- Payouts are aggregated by vendor.
- Platform fees are deducted prior to payout.
- Payouts are triggered after stay or tour completion.
