# ADR: Isolated backend test infrastructure

- Date: 2026-10-06
- Status: Accepted

## Context

Database-backed API tests truncate application tables. The previous harness could load local secret
files and decide that a target was safe because its URL contained `test`, `testing`, or `ci`, or because
an override was set. A credential substring does not identify a disposable database. Conditional
suite skipping also made a successful default run easy to mistake for executed integration coverage.

The October audit identified these issues separately from the booking, payment, and security defects.
A reliable test foundation is needed before implementing those repairs.

## Decision

Use an explicit runner (`scripts/test-api.mjs`) for API unit, integration, and migration commands. Test
execution must not load local dotenv secret files. The runner supplies test placeholders and validates
the effective database target before destructive operations.

The default target is PostgreSQL at `127.0.0.1:55432`, with both database and username exactly
`khan_familia_test`. `TEST_DATABASE_URL` may select an isolated local/CI instance, subject to the same
protocol, loopback-host, exact database/user, and no-query-parameters checks. Validate the effective
`DATABASE_URL` as well. Before integration/migration operations, verify `current_database()` and
`current_user` on the connection against the reserved identity. Remove the `TEST_DATABASE_CONFIRM` bypass. Remote database targets are outside
this harness's supported scope.

Keep default unit/smoke execution separate from explicitly selected integration/flow execution. An
explicit integration command must fail when `RUN_DB_TESTS=false` requests an incompatible opt-out,
rather than silently skipping its suites.

Provide disposable Docker Compose PostgreSQL 17 and Redis 7 services with loopback-bound ports,
temporary storage, and no persistent data volumes. CI uses isolated service containers and applies
committed Prisma migrations before integration tests. The guarded migration command uses
`prisma migrate deploy`; it must not use the application's ordinary database configuration.

Current API integration suites use real PostgreSQL while external providers and queues are mocked.
Document that distinction. Providing Redis does not constitute live queue/worker coverage.

## Consequences

- Default tests can run without application secrets or a remote database.
- Destructive integration cleanup is restricted to a predictable local test target.
- Local integration requires Docker or an equivalently isolated local instance with the accepted
  database/user identity. Containers are disposable; stopping/removing the stack loses its data.
- Database naming and loopback checks cannot detect a tunnel to valuable data. The reserved identity
  must never be used for development/production data.
- Explicit migration and suite selection make failures visible instead of hiding them as skipped tests.
- This is infrastructure hardening, not proof of comprehensive coverage or production readiness.
  Provider behavior, concurrency, and live worker recovery need dedicated later verification.

## Validation

Guard regressions must reject misleading credential substrings, remote hosts, wrong database/user
names, query parameters, and legacy override attempts. Runner checks must cover ignored local secret
files and incompatible suite opt-outs. Integration validation must apply migrations and run against
an isolated instance. Record actual execution results separately; this decision does not claim that
all environments have passed those checks.

See [Backend Test Workspace](../testing/backend-tests.md) for commands and boundaries.
