# ADR-20260514 Monorepo Foundation

- Status: accepted
- Date: 2026-05-14

## Context

We need a production-grade foundation that scales with a modular monolith, enables AI-assisted
workflows, and preserves strict boundaries between apps and shared packages.

## Decision

- Use pnpm workspaces with Turborepo for task orchestration.
- Enforce strict TypeScript across all apps and packages.
- Centralize tsconfig presets in a shared config package.
- Standardize import aliases: @khan-familia/\* for packages, @/ for app-local imports.
- Default to ESM with NodeNext and Bundler module resolution as appropriate.

## Consequences

- Faster, cacheable CI and local workflows.
- Consistent compiler and lint behavior across the monorepo.
- Clear separation of shared code from runtime apps.

## Alternatives

- Separate repos per app (rejected due to shared code duplication and coordination overhead).
- Yarn or npm workspaces (rejected due to less strict dependency isolation).

## Links

- docs/architecture/monorepo-architecture.md
