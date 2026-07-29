# Khan Familia Platform — Project Rules & Operational Manual

> Canonical reference for naming conventions, architectural boundaries, testing commands, linting rules, and development practices.

---

## 1. Architecture Boundaries

### Monorepo Structure

| Layer    | Path                                  | Role                                              |
| -------- | ------------------------------------- | ------------------------------------------------- |
| Apps     | `apps/api`, `apps/web`, `apps/worker` | Deployable services — contain business logic      |
| Packages | `packages/*`                          | Shared libraries — reusable across apps           |
| Docs     | `docs/*`                              | Architecture decisions, domain models, governance |

### Dependency Rules

- ✅ **Apps → Packages** (allowed)
- ❌ **Packages → Apps** (forbidden)
- ❌ **Apps → Apps** (forbidden — enforced by ESLint `no-restricted-imports`)
- ✅ **Packages → Packages** (allowed, must be acyclic)

### Import Conventions

```typescript
// Shared packages (monorepo workspace)
import { something } from '@khan-familia/types';
import { validate } from '@khan-familia/validation';

// App-local imports (path alias)
import { myUtil } from '@/shared/utils/response';
```

---

## 2. Naming Conventions

### Files & Directories

| Type                   | Convention                      | Example                          |
| ---------------------- | ------------------------------- | -------------------------------- |
| **Modules**            | `kebab-case` directory          | `modules/booking/`               |
| **Services**           | `<entity>.service.ts`           | `booking.service.ts`             |
| **Controllers**        | `<entity>.controller.ts`        | `booking.controller.ts`          |
| **Routes**             | `routes.ts` (per module)        | `modules/booking/routes.ts`      |
| **Middleware**         | `<purpose>.ts`                  | `authenticate.ts`, `validate.ts` |
| **Types**              | `<scope>.ts`                    | `request.ts`, `jobs.ts`          |
| **Tests**              | `<name>.<type>.test.ts`         | `booking-policy.unit.test.ts`    |
| **React components**   | `PascalCase.tsx`                | `PropertyCard.tsx`               |
| **React pages**        | `page.tsx` (Next.js convention) | `app/properties/page.tsx`        |
| **Hooks**              | `use<Name>.ts`                  | `useApi.ts`                      |
| **Utilities**          | `kebab-case.ts`                 | `cloudinary-signature.ts`        |
| **Validation schemas** | `<domain>.ts`                   | `validation/src/booking.ts`      |

### Code Conventions

| Entity                    | Convention                 | Example                             |
| ------------------------- | -------------------------- | ----------------------------------- |
| **Interfaces/Types**      | PascalCase                 | `PublicPropertySummary`             |
| **Enums**                 | PascalCase (Prisma native) | `AccommodationBookingStatus`        |
| **Constants**             | SCREAMING_SNAKE_CASE       | `HOLD_EXPIRY`, `QUEUE_NAMES`        |
| **Functions**             | camelCase                  | `createBookingHold()`               |
| **Variables**             | camelCase                  | `tenantId`, `holdToken`             |
| **Environment variables** | SCREAMING_SNAKE_CASE       | `DATABASE_URL`, `STRIPE_SECRET_KEY` |
| **Database columns**      | camelCase (Prisma default) | `availableCount`, `createdAt`       |

---

## 3. TypeScript Rules

- **Strict mode enabled** — `strict: true` in base tsconfig
- **TypeScript version** — pinned to `5.9.3` via pnpm overrides
- **No `any`** — use `unknown` and type-narrow instead
- **Zod-first validation** — validate at the boundary, trust internally
- **Shared types** — define in `packages/types`, not in app code
- **Path aliases** — `@/` for app-local, `@khan-familia/*` for packages

---

## 4. Linting & Formatting

### ESLint (v9 flat config)

- Config: [`eslint.config.mjs`](eslint.config.mjs)
- TypeScript strict rules: `@typescript-eslint/recommended`
- Next.js rules: `@next/eslint-plugin-next` (for `apps/web`)
- Architectural enforcement: `no-restricted-imports` blocks cross-app imports
- Prettier integration: `eslint-config-prettier` disables conflicting rules

### Prettier

- Config: [`.prettierrc.json`](.prettierrc.json)
- Print width: 100
- Single quotes: yes
- Semicolons: yes
- Trailing commas: all

### Editor

- Config: [`.editorconfig`](.editorconfig)
- Indent: 2 spaces
- Line endings: LF
- Charset: UTF-8
- Final newline: yes

---

## 5. Git Hooks & Pre-Commit

- **Tool:** Husky + lint-staged
- **Pre-commit hook:** Runs ESLint `--fix` and Prettier `--write` on staged files
- **Node version:** Automatically loaded via NVM in pre-commit hook

---

## 6. Commands Reference

### Root-Level (Turborepo)

```bash
pnpm install          # Install all dependencies
pnpm dev              # Run all apps in parallel
pnpm build            # Build all apps and packages
pnpm lint             # Lint all workspaces
pnpm typecheck        # Type-check all workspaces
pnpm test             # Run all tests
pnpm format           # Format all files with Prettier
pnpm format:check     # Check formatting without writing
pnpm clean            # Remove all build artifacts + node_modules
```

### Per-App

```bash
pnpm --filter @khan-familia/api dev       # Run API server (tsx watch)
pnpm --filter @khan-familia/web dev       # Run Next.js dev server
pnpm --filter @khan-familia/worker dev    # Run worker process

pnpm --filter @khan-familia/api test              # Run API tests
pnpm --filter @khan-familia/api test:watch        # Watch mode
pnpm --filter @khan-familia/api test:coverage     # With coverage
```

### Node Version

```bash
nvm use    # Uses .nvmrc → Node 22.22.3
```

---

## 7. Environment Variables

### Strategy

- Root `.env.example` → shared defaults
- Each app has its own `.env.example` under `apps/<app>/`
- Public web variables use `NEXT_PUBLIC_` prefix
- **Never commit `.env` files with real values** — `.gitignore` excludes them

### Required Variables (API)

| Variable                                     | Purpose                              | Validated            |
| -------------------------------------------- | ------------------------------------ | -------------------- |
| `DATABASE_URL`                               | PostgreSQL connection string         | ✅ Zod               |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | Redis/Upstash connection             | ✅ Zod               |
| `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`  | Clerk authentication                 | ✅ Zod               |
| `CLERK_WEBHOOK_SECRET`                       | Clerk webhook signature verification | ✅ Zod               |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe payments                      | ✅ Zod               |
| `ENCRYPTION_KEY`                             | AES-256-GCM PII encryption           | ⚠️ Not Zod-validated |
| `CORS_ORIGIN`                                | Allowed CORS origin                  | ✅ Zod               |

---

## 8. Testing Practices

### Test Types

| Type        | Location                         | Purpose                                           |
| ----------- | -------------------------------- | ------------------------------------------------- |
| Unit        | `apps/api/src/test/unit/`        | Pure logic — policies, calculations               |
| Integration | `apps/api/src/test/integration/` | API endpoints with real test DB                   |
| Flow        | `apps/api/src/test/flows/`       | Multi-step business flows (e.g., payment webhook) |
| Smoke       | `apps/api/src/test/smoke/`       | App boot and health check                         |

### Test Conventions

- **Framework:** Vitest
- **HTTP testing:** Supertest
- **Mocking:** Vitest mocks for Redis, BullMQ
- **DB:** Real test database (Neon) with truncation between tests
- **Naming:** `<name>.<type>.test.ts` (e.g., `booking-policy.unit.test.ts`)
- **Setup:** Shared `setup-env.ts` for environment bootstrapping

---

## 9. Architectural Decision Records (ADRs)

- **Location:** `docs/decisions/`
- **Template:** Standard ADR format (Status, Context, Decision, Consequences)
- **Rule:** All significant architectural changes MUST be documented via an ADR

---

## 10. Multi-Tenancy Rules

- Every database mutation MUST include `tenantId` in the `where` clause
- Use `requireTenantId()` from `packages/database` to assert tenant context
- Tenant ID is resolved via middleware chain (header, query param, or user default)
- Never query across tenants unless in `SUPER_ADMIN` context

---

## 11. Security Practices

- **Authentication:** Clerk JWTs verified via `@clerk/express` middleware
- **Webhook verification:** Svix signatures for Clerk, Stripe signature for payments
- **PII encryption:** Guest ID numbers encrypted with AES-256-GCM before storage
- **Input validation:** Zod schemas enforced at middleware layer for all endpoints
- **Rate limiting:** Global rate limiter on all non-webhook, non-health endpoints
- **Security headers:** Helmet enabled (CSP disabled for API-only service)
- **Secrets management:** Environment variables, never hardcoded

---

## 12. Documentation Standards

| Type            | Location          | When Required         |
| --------------- | ----------------- | --------------------- |
| ADRs            | `docs/decisions/` | Architectural changes |
| Domain models   | `docs/domain/`    | New bounded contexts  |
| Database design | `docs/database/`  | Schema changes        |
| API docs        | `docs/api/`       | New endpoints         |
| AI governance   | `docs/ai-agents/` | AI workflow changes   |
