# Khan Familia Platform - Development Context

## What has been completed

1. **Architecture & Foundation:**
   - Monorepo setup with Turbo, Next.js 15, Express 5 API, and BullMQ worker.
   - Clean module/controller/service architecture.
2. **Inventory Management & Locking:**
   - Full implementation of `UnitInventory` reading and mutations (block, unblock, set pricing overrides).
   - Implementation of `PropertyHold` as the canonical checkout hold path. A Redis-backed worker automatically processes `hold-expiry` jobs to cleanly release unconfirmed holds.
   - Audit logging implemented for all staff inventory overrides.
3. **Payments & Checkout:**
   - Dynamic payment calculation that respects staff-configured `priceOverrides` on specific dates.
   - Stripe integration (PaymentIntents) for secure checkouts, with webhooks to auto-convert paid holds into confirmed bookings.
4. **Testing & QA:**
   - Comprehensive test coverage for the API and Background Worker using mocked ES6 instances of Redis and BullMQ to prevent CI failures.

## Where we left off

We just finished standardizing the backend architecture (`fix/architecture-and-audit`), establishing `PropertyHold` as the canonical flow and adding audit logs for staff modifications. The API and Worker are in a stable, production-ready shape for MVP checkout and payments.

## What is next

The API is ready for the frontend application to consume the new booking, checkout, and payments flows.
