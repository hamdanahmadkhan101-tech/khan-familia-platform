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
