# Phase 3: sensitive data protection

Branch: `fix/sensitive-data-protection`.

## Reverified findings and approved scope

- A07: executing the actual API logger with synthetic authorization, request-cookie and response-cookie
  sentinels retained all three. No historical logs or real credentials were inspected.
- A23: inspected hold creation and payment-intent replacement writes both persist guest arrays
  unchanged. Final `BookingGuest.idNumber` already uses the shared encryption utility.
- Hold reads already check ownership/expiry but returned the entire database record.
- Special-needs JSON is another temporary free-text payload; the user approved protecting it too.
- Existing expiry jobs and fallback scheduler already remove holds; reuse them.
- The user subsequently confirmed no holds, bookings, or payment data exist in development and
  approved removing the unnecessary legacy converter and its supporting command/tests/instructions.

## Implementation and acceptance

1. Common log serializers/redaction and implicit error-message protection for API, HTTP, and worker.
   Synthetic secrets must be absent while request ID, route template, status and timing remain useful.
2. Versioned, hold/field-bound encrypted temporary JSON for both write paths. Existing AES-GCM reused.
   Payment validation/confirmation must fail safely on invalid payloads and preserve booking behavior.
3. Explicit hold status DTO and SDK contract, with no returned identity payload or ciphertext.
4. No existing-data conversion for the confirmed empty checkout dataset. No runtime plaintext fallback,
   reset, forced schema push, broad deletion, new scheduler, or invented retention interval.
5. Real PostgreSQL regressions for invalid payload rejection, owner boundaries, updates, release and worker cleanup;
   provider-controlled payment-flow assertions for final encrypted IDs and corruption rejection.
6. Full lint/type/build/format/dependency checks and operator documentation.

## Boundaries

No Neon mutations, real provider payments/uploads, encryption-key rotation, Git mutations, or new
roles. Upload permissions/document delivery remain Phase 2. Payment recovery, idempotency races and
broader lifecycle fixes remain later phases. The existing pg concurrent-query deprecation warning
observed in guest booking tests is not a failed privacy assertion or an invitation to refactor payments.

The [ADR](../decisions/adr-20261024-sensitive-data-protection.md) records the storage/logging decisions;
the [runbook](../testing/sensitive-data.md) records setup and verification boundaries.
