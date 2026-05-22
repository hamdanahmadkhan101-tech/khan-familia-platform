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

## Environment

Copy apps/api/.env.example to apps/api/.env and adjust as needed.

For signed Cloudinary upload support, configure:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_SECRET`
