# ADR: Extract Controllers and Enforce Public Module Interfaces (Barrels)

- Status: accepted
- Date: 2026-06-13

## Context

As the API scales toward a modular monolithic architecture containing `iam`, `tenancy`, `catalog`, `inventory`, and `booking` bounded contexts, two patterns needed to be addressed:

1. **Inline Route Handlers:** Async logic was placed directly inside Express `routes.ts` files. This violated the Single Responsibility Principle, making routes hard to read and business logic impossible to unit test independently of the HTTP layer.
2. **Deep Imports:** Cross-module and application-level imports were referencing files deep inside other modules (e.g., `import { catalogRouter } from './modules/catalog/routes.js'`). This tightly coupled consumers to internal folder structures and risked circular dependencies.

## Decision

1. **Controller Layer:** We introduced a strict separation. `routes.ts` files now only define the HTTP path, HTTP verb, and attach middleware chains. All request-handling logic is extracted into dedicated `*.controller.ts` files.
2. **Public Interfaces (Barrels):** We adopted the "Public Interface" pattern. Each module has an `index.ts` file acting as its public contract. Internal files (like controllers or services) MUST NOT import from their own `index.ts`. External consumers (like `app.ts` or other modules) MUST ONLY import from the module's `index.ts`.

## Consequences

**Positive:**

- Business logic in controllers can be unit tested by mocking Express `req/res`.
- Route definitions are highly readable and clearly expose the active middleware chains.
- Strict module encapsulation. Internal changes to a module's folder structure will not break consumers as long as the `index.ts` contract remains the same.

**Negative:**

- Minor overhead in maintaining the `index.ts` export list.

## Alternatives

- **Fat Routes:** Keeping logic in routes was simpler but unsustainable for the impending `booking` and `inventory` complexities.
- **Strict Clean Architecture (Use Cases/Interactors):** Introducing an extra Use-Case layer for simple CRUD operations was deemed overkill for this stage. The Controller -> Service pattern is pragmatic and effective.

## Links

- Recommended by Code Review Analysis (`temp.md`).
