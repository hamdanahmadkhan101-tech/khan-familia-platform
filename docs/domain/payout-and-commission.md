# Payout and Commission

## Commission Model (MVP)

- Platform commission is applied after base pricing and fees.
- Commission is transparent to vendors in settlement statements.

## Payout Timing

- Payouts occur after stay or tour completion.
- Manual holds on payouts are allowed for disputes.

## Payout Workflow

1. Booking completes.
2. Payment is captured or verified.
3. Platform fees are deducted.
4. Payout is scheduled to the vendor.

## Invariants

- Payouts reference captured or verified payments only.
- Adjustments are recorded as separate entries, not overwrites.
- Disputes pause payouts but do not delete booking history.
