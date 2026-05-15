# Khan Familia Platform

Production-grade modular monorepo foundation for a multi-tenant OTA + PMS + tour operations platform.
This repository currently contains infrastructure and scaffolding only (no business logic, no schema).

## Goals

- Modular monolith with strict boundaries
- TypeScript everywhere
- AI-assisted workflow with governance
- Enterprise-grade maintainability

## Repository layout

- apps/web: Next.js app (App Router)
- apps/api: Express API service
- apps/worker: Node.js worker runtime
- packages/config: shared configs (tsconfig presets)
- packages/types: shared types scaffolding
- packages/validation: validation scaffolding
- packages/constants: constants scaffolding
- packages/sdk: SDK scaffolding
- packages/ui: UI scaffolding (React)
- docs/ai-agents: AI governance and quality gates
- docs/decisions: architecture decision records (ADRs)
- docs/architecture: architecture guidance
- docs/domain: domain modeling and architecture (MVP)
- docs/database: database and persistence design (MVP)

## Commands

- pnpm install
- pnpm dev
- pnpm build
- pnpm lint
- pnpm format
- pnpm typecheck
- pnpm test

## Running apps

- pnpm dev (all apps)
- pnpm --filter @khan-familia/web dev
- pnpm --filter @khan-familia/api dev
- pnpm --filter @khan-familia/worker dev

## Health checks

- Web: /health
- API: /health

## Node version

This repo uses Node 22 (see .nvmrc). If you use nvm:

- nvm use

## Import conventions

- Internal packages: @khan-familia/<package>
- App-local alias: @/...

## Environment strategy

- Root .env.example shows shared defaults
- Each app has its own .env.example under apps/<app>
- Public web variables use the NEXT*PUBLIC* prefix

## AI governance

See docs/ai-agents for policies, quality gates, and runbooks.

## ADRs

See docs/decisions for the ADR template and process.

## Architecture docs

See [docs/architecture/monorepo-architecture.md](docs/architecture/monorepo-architecture.md) for the
monorepo rationale and boundaries.

## Domain docs

- [docs/domain/bounded-contexts.md](docs/domain/bounded-contexts.md)
- [docs/domain/core-entities.md](docs/domain/core-entities.md)
- [docs/domain/booking-lifecycle.md](docs/domain/booking-lifecycle.md)
- [docs/domain/inventory-model.md](docs/domain/inventory-model.md)
- [docs/domain/availability-strategy.md](docs/domain/availability-strategy.md)
- [docs/domain/pricing-model.md](docs/domain/pricing-model.md)
- [docs/domain/vendor-model.md](docs/domain/vendor-model.md)
- [docs/domain/vendor-operations.md](docs/domain/vendor-operations.md)
- [docs/domain/tour-domain.md](docs/domain/tour-domain.md)
- [docs/domain/payment-domain.md](docs/domain/payment-domain.md)
- [docs/domain/payout-and-commission.md](docs/domain/payout-and-commission.md)
- [docs/domain/inquiry-workflow.md](docs/domain/inquiry-workflow.md)
- [docs/domain/manual-operations.md](docs/domain/manual-operations.md)
- [docs/domain/roles-and-permissions.md](docs/domain/roles-and-permissions.md)
- [docs/domain/glossary.md](docs/domain/glossary.md)
- [docs/domain/assumptions.md](docs/domain/assumptions.md)

## Database docs

- [docs/database/erd-v1.md](docs/database/erd-v1.md)
- [docs/database/aggregates.md](docs/database/aggregates.md)
- [docs/database/normalization.md](docs/database/normalization.md)
- [docs/database/transaction-boundaries.md](docs/database/transaction-boundaries.md)
- [docs/database/concurrency-strategy.md](docs/database/concurrency-strategy.md)
- [docs/database/indexing-strategy.md](docs/database/indexing-strategy.md)
- [docs/database/inventory-locking.md](docs/database/inventory-locking.md)
- [docs/database/soft-delete-policy.md](docs/database/soft-delete-policy.md)
- [docs/database/audit-log-strategy.md](docs/database/audit-log-strategy.md)
- [docs/database/tour-domain-design.md](docs/database/tour-domain-design.md)
