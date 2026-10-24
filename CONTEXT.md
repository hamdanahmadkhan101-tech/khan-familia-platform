# Khan Familia Platform — Development Context

Updated: 2026-10-06.

## Implemented foundations

- pnpm/Turborepo monorepo with Next.js web, Express API, BullMQ worker, and shared packages.
- Clerk-backed identity, database roles/memberships, vendor applications, property moderation,
  catalog/unit types, and public property discovery.
- PostgreSQL inventory counters, temporary `PropertyHold` checkout reservations, Stripe payment
  adapters, booking conversion, and worker jobs for expiry/cleanup and inventory generation.
- Unit, smoke, integration, and flow tests exist. External providers and queues are mocked in the
  API integration workflow; this is not a live payment or queue acceptance test.

## Current assessment

The [4 October audit](docs/audits/2026-10-04-codebase-audit.md) identified security, payment recovery,
inventory consistency, and incomplete user journeys. Its qualification addendum narrows findings
where evidence is conditional. Earlier statements that the API/worker were production-ready or had
comprehensive coverage were unsupported and are superseded by this assessment.

The project has useful foundations, but it is not established as ready for production booking/payment
traffic. A passing unit suite, typecheck, or build does not establish that readiness.

## Current work: Phase 1

Establish isolated test execution before repairing business behavior:

- Do not load local application secret files into automated API tests.
- Restrict destructive database operations to a reserved local test database/user identity.
- Separate default unit/smoke checks from explicitly requested integration/flow checks.
- Provide disposable PostgreSQL/Redis services and CI migration/integration execution.
- Document which boundaries are real and which are mocked.

See [Backend Test Workspace](docs/testing/backend-tests.md) and the
[isolated-test ADR](docs/decisions/adr-20261006-isolated-test-infrastructure.md). Actual command results
must be recorded by the implementing change; this context file is not a claim that all checks passed.

## Next work

Use the reverified audit findings to make small, related repairs with regression tests. Prioritize
upload authorization, checkout/property eligibility, and booking/payment/inventory correctness.
Address onboarding consistency and incomplete delivery/UI flows in their corresponding phases.
Do not treat Phase 1 infrastructure work as resolving those application defects.
