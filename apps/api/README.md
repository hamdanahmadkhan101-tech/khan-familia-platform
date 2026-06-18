# API App

Express 5 + TypeScript scaffold with structured logging.

## Scripts

- pnpm dev
- pnpm build
- pnpm start
- pnpm lint
- pnpm typecheck

## Endpoints

- `GET /health`
- `GET /iam/me` — current user (Clerk JWT)
- `POST /webhooks/clerk` — Clerk user sync
- `POST /tenants` — create tenant (becomes OWNER)
- `GET /tenants` — list my tenants
- `POST /tenants/invites/accept` — accept invite by token
- `GET /tenants/:tenantId` — tenant details (member)
- `PATCH /tenants/:tenantId` — update tenant (OWNER/ADMIN)
- `GET /tenants/:tenantId/members` — list members
- `POST /tenants/:tenantId/invites` — invite by email (OWNER/ADMIN)
- `GET /tenants/:tenantId/invites` — pending invites (OWNER/ADMIN)
- `DELETE /tenants/:tenantId/invites/:inviteId` — revoke invite (OWNER/ADMIN)
- `DELETE /tenants/:tenantId/members/:userId` — remove member (OWNER/ADMIN)

### Catalog (tenant context: `X-Tenant-ID` or default tenant)

- `POST /properties` — create property (OWNER/ADMIN); starts `PENDING` approval
- `GET /properties` — list tenant properties (OWNER/ADMIN/STAFF)
- `GET /properties/:propertyId` — property details
- `PATCH /properties/:propertyId` — update (OWNER/ADMIN); rejected → back to `PENDING`
- `DELETE /properties/:propertyId` — soft delete (OWNER/ADMIN)
- `POST /properties/:propertyId/unit-types` — create unit type (OWNER/ADMIN)
- `GET /properties/:propertyId/unit-types` — list unit types
- `GET /properties/:propertyId/unit-types/:unitTypeId` — unit type details
- `PATCH /properties/:propertyId/unit-types/:unitTypeId` — update unit type
- `DELETE /properties/:propertyId/unit-types/:unitTypeId` — delete (blocked if inventory/bookings exist)

### Platform moderation (`User.role` = `SUPER_ADMIN`)

- `GET /admin/properties/pending` — list properties awaiting approval
- `POST /admin/properties/:propertyId/approve` — approve listing
- `POST /admin/properties/:propertyId/reject` — reject with `{ "reason": "..." }`

## Backend tests

See `../../docs/testing/backend-tests.md` for the API test workspace setup, local `.env.test.local` guidance, and test database safety rules.

## Booking checkout flow

See `../../docs/workflows/booking-payment-flow.md` for the local backend runbook covering holds, Stripe PaymentIntents, webhooks, worker expiry cleanup, and expected database state changes.

## Environment

Copy apps/api/.env.example to apps/api/.env and adjust as needed.

For signed Cloudinary upload support, configure:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_SECRET`
