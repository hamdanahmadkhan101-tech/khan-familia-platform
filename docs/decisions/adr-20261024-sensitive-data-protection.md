# ADR: protect temporary checkout data and operational logs

- Date: 2026-10-24
- Status: Accepted

## Context

Reverification of A07 and A23 found missing credential redaction in the actual API logger and
plaintext guest identity numbers in both hold creation and payment-intent updates. Final booking
identity numbers were already encrypted. Temporary special-needs text can also contain sensitive
information. The user approved protecting both temporary payloads, minimizing hold responses, and
reusing existing encryption and expiry infrastructure. This does not establish historical disclosure.

## Decision

- Keep authorization and hold rules in the API. Use the existing shared AES-256-GCM utility with
  the existing application key; do not introduce another cryptographic primitive or storage service.
- Store each non-null `PropertyHold.guestDetails` / `specialNeeds` JSON field as
  `{ version: 1, ciphertext }`. Authenticated plaintext contains the field name, hold token, and
  validated payload, so ciphertext cannot be copied between holds or between fields successfully.
  Encrypt before both initial and replacement writes. Random nonces make repeated values distinct.
- Decrypt only on the server for payment validation and booking conversion. Preserve the existing
  final booking guest-ID encryption and special-request behavior; temporary encryption is not a
  claim that all final booking data or special requests are encrypted.
- Hold status returns only `{ hold: { holdToken, expiresAt } }` after the existing owner/expiry checks.
  Do not return database rows or introduce a general identity-decryption endpoint.
- Runtime readers fail closed on plaintext, malformed, unknown-version, or wrong-key payloads.
  The user confirmed the development database has no holds, bookings, or payment records. There is
  nothing to convert; no legacy converter, maintenance command, or plaintext-read fallback is included.
- Reuse hold release, conversion deletion, delayed expiry, and the five-minute fallback sweep. Do
  not invent another retention period or scheduler. Expiry is not guaranteed physical deletion at
  precisely 15 minutes; functioning workers/Redis/database and retries remain operational requirements.
- Share redaction paths in constants and serializer/log-hook functions in utils, without adding Pino
  to shared package dependencies. Configure both the parent API logger and pino-http explicitly;
  pino-http defaults otherwise override parent serializers. Worker logging uses the same policy.
- HTTP logs allowlist method, status, generated/validated UUID request ID, matched route template,
  and duration. Omit raw URLs, headers and bodies. Error logs retain type, safe code and numeric
  status, excluding raw messages/stacks/provider payloads. A hook prevents Pino copying implicit
  Error messages into `msg`. Known structured credential/payload keys are removed at supported paths.
- Remove raw error outputs in Redis and orphan-payment handling. Disable Prisma's implicit console
  query/error output, which may include query parameters and invocation data. The database package
  emits only a static pool-failure message and disposes its owned pool on Prisma disconnect.
- Validate encryption keys as 64 hexadecimal characters at API/worker startup and in shared crypto.

## Consequences

No schema migration, existing-data conversion, or new dependency is required for the confirmed
development dataset: both temporary fields are already JSON and there are no existing hold payloads.
Existing encrypted application IDs and final booking IDs keep the same format and key.

Old application versions cannot interpret the new temporary envelopes. Roll forward or drain active
checkouts before rolling back; do not mix old writers with the new encrypted format.
Key rotation, KMS integration, final-record retention/redaction and log-provider retention are separate
designs. Losing the existing key prevents decrypting existing data; this branch does not rotate it.

Allowlisting reduces raw diagnostic detail deliberately. Use stable error codes and request IDs for
support; do not add secret-bearing text to free-form log messages. This policy is not arbitrary-string
secret detection: a developer can still leak data by putting it directly in an explicit message or
an unrecognized structured field. Logging untrusted payloads wholesale remains prohibited.

See [operator and test instructions](../testing/sensitive-data.md).
