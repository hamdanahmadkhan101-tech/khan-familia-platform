# Khan Familia Platform - Development Context

## What has been completed

1. **Controller & Barrel Refactor:** We moved all inline route handlers into dedicated `*.controller.ts` files and enforced a strict "Public Interface" pattern. External consumers (like `app.ts`) now only import from a module's `index.ts`.
2. **Express 5 Fixes:** We updated `validate.ts` middleware to use `Object.defineProperty` to bypass the new Express 5 getter-only request properties (`req.query`, `req.body`, `req.params`).
3. **Inventory Availability Read:** We successfully scaffolded the `inventory` module. We created Zod validation schemas and an endpoint (`GET /inventory/:propertyId/availability`) to query the `UnitInventory` Prisma table for available dates.

## Where we left off

We just finished `feature/inventory-availability-read`. The user is merging this into `develop`.

## What is next

The next branch to check out is:
**`feature/inventory-management`**

**Next Tasks for the AI Agent:**
In the new branch, we need to implement endpoints that allow property staff to mutate the `UnitInventory` model. This includes:

1. Blocking dates (e.g., for maintenance).
2. Unblocking dates.
3. Setting manual price overrides on specific dates (e.g., higher prices for holidays).

_Dear next AI Agent: Please read this file, verify the current branch is `feature/inventory-management`, and draft an Implementation Plan for these new endpoints._
