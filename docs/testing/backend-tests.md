# Backend Test Workspace

API tests use disposable local infrastructure and fake external-provider credentials. They do not
load `.env`, `.env.test`, or `.env.test.local`. Existing local secret files are not part of this workflow.

## Run the suites

Use the Node version in `.nvmrc` and install workspace dependencies first. From the repository root:

```bash
pnpm test
pnpm test:services:up
pnpm test:db:migrate
pnpm test:integration
pnpm test:services:down
```

- `pnpm test`: default unit/smoke checks; no integration database is required.
- `pnpm test:services:up`: start disposable PostgreSQL and Redis using Docker Compose.
- `pnpm test:db:migrate`: validate the isolated target, then apply committed Prisma migrations.
- `pnpm test:integration`: explicitly select the API integration and flow suites against PostgreSQL.
- `pnpm test:services:down`: remove the test containers and their temporary data.

The integration command fails if `RUN_DB_TESTS=false` is explicitly set. It does not silently report
success after skipping the requested database suite. Clear that opt-out before deliberately running
integration tests. A missing database or failed migration is a failure to resolve, not a reason to use
the normal development database.

## Database boundary

The runner in `scripts/test-api.mjs` supplies placeholder credentials and an isolated environment to
the test process. Its default test connection is:

```text
postgresql://khan_familia_test:khan_familia_test@127.0.0.1:55432/khan_familia_test
```

`TEST_DATABASE_URL` is the explicit way to select another **local, isolated** test instance, such as
the CI service container. The guard accepts only:

- PostgreSQL URL protocols (`postgres:` or `postgresql:`).
- A loopback hostname.
- The exact database name and username `khan_familia_test`.
- No URL query parameters.

The runner replaces an inherited application `DATABASE_URL` with the selected test target. The
effective `DATABASE_URL` must satisfy the same boundary. Before integration or migration work, the
runner also checks `current_database()` and `current_user` against the reserved identity. A URL that happens to contain `test` or
`ci` in its password is not sufficient. `TEST_DATABASE_CONFIRM` is no longer an override; do not use
it. Remote Neon branches and other remote database hosts are intentionally unsupported by this
harness.

Unit/smoke execution uses a loopback connection on port 1 so an accidental database call fails
instead of using the integration instance.

Integration cleanup truncates application tables in the accepted database. These naming and host
checks reduce accidental targeting; they cannot determine the value of data stored behind a local
port or tunnel. Reserve the accepted database and username exclusively for disposable tests. Never
point a local tunnel or proxy at valuable data for these commands.

## What is exercised

| Suite                 | Persistence                                    | External boundaries                                                                                |
| --------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| API unit/smoke        | No real database required                      | Test doubles/placeholders                                                                          |
| API integration/flows | Real isolated PostgreSQL, committed migrations | Clerk verification, payment providers, Redis/BullMQ use test doubles where configured by the suite |
| Web/worker/packages   | No test files currently                        | Their successful test commands do not establish scenario coverage                                  |

Redis is available in the disposable stack for later integration coverage. Its presence does not
mean the current API suite exercises a live queue. Fake provider credentials are not permission to
call a provider sandbox; automated suites must mock external providers.

The integration tests can check HTTP/controller/service/database behavior while mocking queues and
payments. They do not establish real Stripe settlement/refunds, Clerk authentication, Cloudinary
permissions, email delivery, queue retries, or worker execution across process boundaries.

## Suite layout and CI

- `apps/api/src/test/unit`: focused logic and safety-guard tests.
- `apps/api/src/test/smoke`: app wiring checks.
- `apps/api/src/test/integration`: API/database scenarios.
- `apps/api/src/test/flows`: multi-step business scenarios with external-provider doubles.
- `apps/api/src/test/helpers`: authentication, HTTP, and fixture helpers.
- `apps/api/src/test/database.ts`: guarded database access and cleanup.

CI uses isolated PostgreSQL/Redis service containers, validates the target, applies migrations, and
runs the selected suites with placeholders rather than production secrets. Read the CI job results
for evidence of execution; a local unit pass is not evidence that integration tests passed.

Phase 1 establishes safer, repeatable test execution. It does not supply comprehensive scenario
coverage or establish booking/payment production readiness. Add regression coverage with each
subsequent repair, including the actual dependency boundary that repair affects.

## Phase 1 verification — 6 October 2026

Local verification on `chore/isolated-test-infrastructure`:

- PostgreSQL and Redis containers became healthy; Redis returned `PONG`.
- All nine committed migrations applied to a fresh database. The connected database and role were
  both verified as `khan_familia_test`.
- API unit/smoke: 34 tests passed across three files, including 26 guard/environment regressions.
- API integration/flows: 21 tests passed across four files; none skipped. The orphan-payment case
  exercised failed remediation, successful retry, and duplicate delivery with a mocked gateway.
- The root default test command passed. Other workspaces currently report no test files; that is
  not web, worker, or shared-package scenario coverage.
- Explicit opt-out and remote-target CLI checks both failed before database access, as intended.
- Workspace build, lint, typecheck, dependency consistency, test-infrastructure lint, and formatting
  passed. Unchanged workspace tasks reused existing Turbo artifacts; the changed API tasks ran.
- An additional uncached web build passed using the CI public values and dummy provider credentials.
  The invalid existing Clerk build placeholder was replaced with a valid-format dummy key.

These are local results. GitHub Actions must still execute the updated workflow after the user
pushes the branch. Providers and queues remain mocked in the API suites.
