# Sensitive data: rollout and verification

## What changed

Temporary hold guest details and special needs are encrypted JSON envelopes, verified against the
hold token and field name when read. Final guest ID encryption is unchanged. Hold status responses
contain only token and expiry. Shared log policies omit HTTP headers/URLs/bodies and raw error data.
See the [ADR](../decisions/adr-20261024-sensitive-data-protection.md) for exact limits.

There is **no new schema migration** for this phase. Do not run db push, reset, or reseed. Keep the
existing `ENCRYPTION_KEY`; API and worker keys must remain compatible with existing encrypted data.

## Development setup

The user confirmed the development database contains seeded users/properties but no holds, bookings,
or payment records. There is nothing to convert. No maintenance command, data backfill, database
reset, or new migration is required. The assistant has not queried or changed Neon.

Keep the existing valid `ENCRYPTION_KEY` in the API and worker environments. Build and restart the
updated API/web/worker together; no Cloudinary preset or credential change is needed for this phase.
Use your own environment for a build you intend to serve, rather than the assistant's dummy build
settings. Normal checkout creates protected payloads from the first write.

Runtime readers reject plaintext arrays and malformed envelopes instead of silently accepting them.
Do not run an old API version alongside the new one: it could write an incompatible plaintext payload.
Future environments with existing checkout data require an explicit transition plan before rollout.
The previously proposed converter was removed after the user clarified the actual development state.

## Automated checks

From the root, with Node 22 and Docker:

```bash
pnpm test:services:up
pnpm test:db:migrate
pnpm test
pnpm test:integration
pnpm lint
pnpm lint:test-infra
pnpm lint:deps
pnpm format:check
pnpm build --force
pnpm typecheck
pnpm test:services:down
```

Tests use isolated local PostgreSQL and dummy credentials. No tests load local API secret files.
The logging regression executes the actual API logger, pino-http, and worker logger with synthetic
credentials, URLs and errors. The expiry regression executes the actual worker fallback handler in a
separate process against the guarded test database, without cross-app source imports. Payment provider
responses and Clerk verification are controlled fixtures, not live provider interactions.

Coverage includes encrypted initial/replacement writes, owner-only status, safe responses, corrupt/
wrong-context/wrong-key/version rejection, rejection of unprotected/corrupt data before provider calls,
manual release, successful booking conversion, final guest-ID decryption, special-request preservation,
corrupt confirmation without partial booking, and worker expiry/inventory restoration.

## Manual development smoke check

Use harmless dummy identity data and a test payment method only. Create a checkout, submit guest details
and special needs, and complete the existing payment flow. Confirm the booking retains the expected
guest count/name and requests, and that the temporary hold disappears. Check hold status as a different
account is denied. Examine development logs for the dummy sentinels: they must not occur. Do not send
real identities, live payment credentials, full database URLs or signed document links in screenshots.

Expiry still depends on a functioning worker and Redis. Holds normally expire after 15 minutes; delayed
expiry and the five-minute fallback sweep perform deletion. Worker outages can delay physical cleanup.
This branch does not set final-booking, application-document, or hosted-log retention policy.

## Recorded verification — 24 October 2026

- All 10 existing migrations applied successfully to fresh guarded local PostgreSQL; no new schema
  migration was needed or added for Phase 3.
- Root workspace test command passed: 51 API unit/smoke tests across seven files. Other workspace
  test commands still report no test files; they do not constitute additional scenario coverage.
- Integration suite passed: 58 tests across six files. This includes five new privacy/database tests
  and the corrupt-confirmation regression; the existing payment conversion test also verifies final
  identity encryption, decrypted value, special requests and temporary deletion.
- Root lint, test-infrastructure lint, dependency consistency, formatting and final typecheck passed.
- Full workspace production build passed before converter removal: 10 tasks, all executed. The final
  API build passed again after removal. Dummy provider/public settings and
  a deliberately unavailable API were used with read-only Turbo caching. The web build emitted
  nonfatal API-fetch/dynamic-render diagnostics and existing webpack/Next ESLint-plugin warnings;
  this was compilation validation, not a live-provider or populated-page acceptance test.
- Existing guest-booking concurrency tests emit a pg concurrent-query deprecation warning. Those
  tests pass; payment/inventory concurrency refactoring is outside this privacy change.
- Test containers and network were removed after verification. No Neon data or credentials were
  changed, no real provider mutation was performed, and no Git state was mutated by the assistant.
