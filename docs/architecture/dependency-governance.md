# Dependency Governance

## Purpose

This document defines how dependency versions are stabilized in the monorepo while preserving compatibility with the current platform baseline:

- Next.js 15
- React 19
- Prisma 5
- Turborepo 2

It is intentionally conservative: no architectural changes, no framework churn, no unnecessary tooling.

## What Was Stabilized

### Core version pins

- `next` pinned to `15.5.18` in web app.
- `react` / `react-dom` pinned to `19.2.6` in web app.
- `turbo` pinned to `2.9.14` at workspace root.
- `prisma` and `@prisma/client` pinned to `5.22.0` in database package.
- `typescript` pinned to `5.9.3`.
- `@types/node` pinned to `22.19.19`.

### Root override policy

Root `pnpm.overrides` now enforces:

- `typescript = 5.9.3`
- `@types/node = 22.19.19`

This prevents toolchain drift between packages and keeps TS/Node type behavior deterministic.

## Why These Versions

- They are already present in the lockfile and ecosystem-compatible with the existing workspace stack.
- They avoid accidental major/minor drift from broad ranges (`^`) during routine installs.
- They reduce "works-in-one-package, fails-in-another" issues in TypeScript-heavy monorepos.

## Why Newer Latest Versions Were Intentionally Avoided

- Latest releases can introduce subtle type-level breaking behavior in TypeScript and `@types/node`.
- Prisma minor upgrades can alter generated client behavior or migration semantics.
- Next.js + React + ESLint plugin compatibility must stay synchronized; jumping versions independently increases risk.
- This phase is schema implementation and stability, not framework upgrade work.

## Workspace Dependency Strategy

### 1) Prefer explicit pins for platform-critical dependencies

Pin exact versions for:

- framework/runtime foundations (Next/React/Turbo)
- schema tooling (Prisma)
- compiler/type foundations (TypeScript, `@types/node`)

### 2) Keep package responsibilities clear

- DB tooling lives in `packages/database`.
- Apps depend on the shared package, not ad-hoc Prisma setups.

### 3) Add operational dependencies only where needed

- API: validation/logging/security middleware (`zod`, `pino-http`, `cors`, `helmet`, `compression`, `cookie-parser`).
- Worker: queue + redis clients (`bullmq`, `ioredis`).

### 4) Keep architecture explicit and boring

- No new ORMs.
- No repository frameworks.
- No DI/CQRS/event abstractions.

## Upgrade Strategy Going Forward

### Cadence

- Monthly patch review window.
- Quarterly minor review for core stack (`next`, `react`, `prisma`, `turbo`, `typescript`).

### Process

1. Create dedicated upgrade branch.
2. Upgrade one ecosystem cluster at a time:
   - TS + `@types/node`
   - Prisma
   - Next/React
3. Regenerate lockfile and run workspace checks.
4. Document breakages and mitigation before merge.

### Safety checks required per upgrade

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- Prisma generate/migration dry checks in `packages/database`

### Rollback posture

- Keep upgrades small and isolated.
- Revert the single upgrade PR if runtime/type regressions appear.

## Operational Scripts Added in Database Package

`packages/database` now includes:

- `prisma:format`
- `prisma:migrate:dev`
- `prisma:migrate:deploy`
- `prisma:migrate:reset`
- `prisma:db:seed` (placeholder)

These scripts provide a consistent baseline for controlled schema operations without introducing business-layer changes.
