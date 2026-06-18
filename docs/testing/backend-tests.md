# Backend Test Workspace

This document explains the local setup for API integration tests. The test suite should never run against the normal development or production database.

## Local Secret File

Create this file locally when you are ready to run backend tests:

```bash
cp apps/api/.env.test.example apps/api/.env.test.local
```

Then edit `apps/api/.env.test.local` and set `DATABASE_URL` to a dedicated test database.

Do not commit `apps/api/.env.test.local`. It is ignored by git.

## Test Database Recommendation

Use one of these, in order of preference:

1. Local Postgres in Docker for fast repeatable test runs.
2. A dedicated Neon branch in the same project, named with `test` in the branch or database name.
3. A separate Neon project for tests.

The test database URL must clearly look like a test database, or you must explicitly confirm that it is isolated. The helper in `apps/api/src/test/database.ts` refuses destructive cleanup unless `APP_ENV=test` and `DATABASE_URL` contains one of these hints:

- `test`
- `testing`
- `ci`

This is intentional. Test cleanup truncates tables. Some Neon branch URLs do not visibly include the branch name; for those, set `TEST_DATABASE_CONFIRM=true` in `apps/api/.env.test.local` only after confirming the URL points at your dedicated test branch.

## Stripe, Clerk, Cloudinary, And Resend Values

Automated tests should mock external providers by default. Use placeholder or test-mode values in `apps/api/.env.test.local` unless a specific test intentionally calls a provider sandbox.

Safe defaults:

```env
CLERK_SECRET_KEY=sk_test_placeholder
CLERK_PUBLISHABLE_KEY=pk_test_placeholder
CLERK_WEBHOOK_SECRET=whsec_test_placeholder
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_test_placeholder
CLOUDINARY_CLOUD_NAME=test-cloud
CLOUDINARY_API_KEY=test-key
CLOUDINARY_API_SECRET=test-secret
RESEND_API_KEY=re_test_placeholder
```

Do not use production keys in tests. If you use real Stripe credentials for a manual sandbox test, use Stripe test-mode keys only.

## Commands

Run the default API test suite. This runs smoke/unit tests and skips DB-backed integration/flow tests unless explicitly enabled:

```bash
pnpm --filter @khan-familia/api test
```

Run DB-backed integration and payment flow tests after `apps/api/.env.test.local` points at a dedicated test database:

```bash
TEST_DATABASE_CONFIRM=true RUN_DB_TESTS=true pnpm --filter @khan-familia/api test
```

Run in watch mode:

```bash
pnpm --filter @khan-familia/api test:watch
```

Run coverage:

```bash
pnpm --filter @khan-familia/api test:coverage
```

## Test Suite Layout

- `apps/api/src/test/smoke`: app wiring checks that do not need the database.
- `apps/api/src/test/unit`: small focused unit tests that do not need the database.
- `apps/api/src/test/integration`: API + database tests for module behavior. Requires `RUN_DB_TESTS=true`.
- `apps/api/src/test/flows`: backend end-to-end style business flow tests, still using mocks for external providers. Requires `RUN_DB_TESTS=true`.
- `apps/api/src/test/helpers`: shared test auth, HTTP, and fixture helpers.

## Files Added For The Test Harness

- `apps/api/vitest.config.ts`: API Vitest configuration.
- `apps/api/src/test/setup-env.ts`: loads `.env.test.local`, then `.env.test`, then safe placeholders.
- `apps/api/src/test/database.ts`: Prisma test client plus safety-guarded cleanup helpers.
- `apps/api/src/test/http.ts`: Supertest helper around `createApp()`.
- `apps/api/.env.test.example`: committed example env file for local test setup.
