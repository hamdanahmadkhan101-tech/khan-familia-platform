# Monorepo Architecture

This document explains the foundational architecture choices for the platform and why they exist.

## Scope

The repository is a modular monolith focused on shared foundations only. Business logic, database
schemas, and feature modules are intentionally excluded at this stage.

## Major Decisions and Rationale

### pnpm workspaces

Decision: Use pnpm workspaces for dependency management.
Rationale: pnpm provides deterministic installs, strict node_modules isolation, and fast workspace
resolution at scale.

### Turborepo task orchestration

Decision: Use Turborepo to coordinate build, lint, test, and typecheck tasks.
Rationale: Turbo caches work across apps/packages, enabling scalable CI and faster local iteration.

### Strict TypeScript everywhere

Decision: Enforce strict TypeScript across all apps and packages.
Rationale: Strict typing reduces runtime risk and provides safer refactoring as the monolith grows.

### Shared config package

Decision: Centralize tsconfig presets in packages/config.
Rationale: A single source of truth keeps compiler behavior consistent while avoiding duplication.

### ESM-first module strategy

Decision: Default to ESM with NodeNext settings for server packages and Bundler resolution for web.
Rationale: ESM aligns with modern tooling, Next.js defaults, and long-term Node support.

### Import boundaries

Decision: Apps may depend on packages; packages must not import from apps.
Rationale: This enforces modular layering and prevents coupling of shared libraries to runtime apps.

### Alias conventions

Decision: Use @khan-familia/\* for shared packages and @/ for app-local imports.
Rationale: Clear import prefixes prevent accidental cross-app dependencies.

### Environment strategy

Decision: Each app owns its .env.example; root .env.example holds shared defaults.
Rationale: Keeps runtime configuration explicit per app while preserving shared conventions.

## Hosting Alignment

- Web: Vercel (Next.js)
- API/Worker: Render (Node)

This split matches current deployment needs while preserving a unified architecture.
