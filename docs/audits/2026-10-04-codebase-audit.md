# Codebase audit — 4 October 2026

Reviewed commit: `c86f3d3` (working tree initially clean). Review covered the three applications, shared packages, Prisma schema/migrations, tests, CI, and architecture/domain documentation. Three focused reviewers covered API security/tenancy, booking/payment/inventory integrity, and frontend/SDK integration; the primary reviewer verified findings and execution checks.

**Assessment:** this is a substantial accommodation marketplace MVP with useful architectural foundations. It is not ready for production booking/payment traffic. Stabilize the existing journeys before extending the feature surface. No application code, schema, or live data was changed during this audit; this report is the only intended tracked change.

## Architecture and product understanding

The intended product combines a multi-tenant online travel marketplace, property management, and tour operations. Implementation is concentrated on accommodations. The schema and domain documentation describe a considerably larger product than the exposed application currently delivers.

| Area            | Implementation and responsibility                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace       | pnpm 9.15.1, Node 22, Turborepo, strict TypeScript, shared lint/configuration                                                            |
| Web             | Next.js 15 App Router, React 19, Clerk, TanStack Query, Tailwind/Radix UI; server components/actions plus client checkout                |
| API             | Express 5 modular monolith; routes → controllers → services; shared Zod boundary contracts                                               |
| Identity        | Clerk authentication, internal User records, platform role, TenantUser membership and OWNER/STAFF authorization                          |
| Persistence     | PostgreSQL through Prisma 7 and pg adapter; tenant IDs on business entities; tenancy primarily enforced in application code              |
| Inventory       | UnitInventory rows per unit type and night; total, available, held, booked, blocked counters; price overrides                            |
| Checkout        | PropertyHold is canonical; payment intent → booking, reservations, guests, price snapshot, payment records                               |
| Payments        | Stripe adapter; automatic capture for immediate bookings, manual authorization for approval-required properties; Rapid gateway is a stub |
| Worker          | BullMQ/Redis hold expiry, repeatable hold cleanup, per-property inventory generation, notification handler                               |
| Shared packages | Database/client/inventory helpers; DTOs/job types; validation; SDK; UI; constants; money/date/encryption utilities                       |
| Operations      | Pino, OpenTelemetry, local observability compose; application containers/deployment runbooks remain incomplete                           |

The main guest flow is: browse approved property → authenticate → select a room/date range → acquire hold → collect guest details → create Stripe intent → pay/authorize → webhook or synchronous confirmation converts held inventory to booked inventory. Immediate capture creates CONFIRMED; manual authorization creates BOOKED awaiting host approval. Cancellation releases inventory and subsequently performs provider cancellation/refund. The separation between database commits and provider operations is the principal reliability risk.

Vendor flow: application with verification documents → SUPER_ADMIN review → tenant and owner membership provisioning → catalog/unit types → property approval → inventory generation. Public discovery is global, while management uses tenant context from route/query/header or the user's default tenant.

### Existing strengths

- Clear app/package boundaries and consistent module organization make incremental repair practical; a rewrite is not justified by this review.
- Clerk and Stripe webhooks use raw bodies for signature verification. Internal user and role checks supplement external authentication.
- Most catalog operations check resource ownership; this review did not establish a general cross-tenant property-write bypass.
- Hold conversion and release use transactions and guarded counter changes. Booking idempotency keys and deterministic release ordering provide useful protection.
- Monetary helpers and booking price snapshots exist. Booking guest IDs are encrypted when durable BookingGuest records are created.
- Schema migrations include uniqueness/index improvements and inventory counter conservation. Admin self-approval is explicitly prohibited.
- Linting, strict types, formatting, and production compilation provide a functioning engineering baseline.

## Feature readiness

| Journey                   | Current state                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Homepage                  | Polished marketing surface; main search is not wired; tours are promotional rather than an implemented booking journey      |
| Property discovery/detail | Real API integration; ambiguous slugs, incomplete search/pagination, no full availability-driven search                     |
| Authentication            | Integrated, but post-login role routing catches its own redirects                                                           |
| Guest checkout            | End-to-end code exists; payment recovery, concurrency, guest capacity, and approval-state presentation need fixes           |
| Guest account             | Booking listing/status cards exist; cancellation UI and pagination are missing                                              |
| Vendor onboarding         | Application wizard/review exist; required document upload is blocked by SDK request formatting                              |
| Vendor operations         | Property listing/photo attachment exist; property/room CRUD, inventory/rate management, and booking approval UI are missing |
| Host dashboard            | `/host` is a marketing page, despite dashboard navigation pointing there                                                    |
| Admin                     | Application moderation is implemented; tenants/users/settings navigation points to missing routes                           |
| Invitations/notifications | Invite tokens are not delivered; notification worker records success without sending email                                  |
| Tours/PMS extensions      | Rich schema/domain plans; corresponding operational API/UI journeys largely absent                                          |

## Findings requiring attention before release

P1 means a high-impact security, financial, inventory, or core-flow defect to resolve before release. P2 means a functional/reliability defect requiring planned correction. These are code-level findings, not claims that a live incident has occurred. Concurrency interleavings were traced statically, not executed against a live database.

### A01 · P1 · Arbitrary Cloudinary signatures cross the intended upload boundary

Evidence: [upload controller](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/upload/upload.controller.ts:9), [upload schema](/home/hamdan/projects/khan-familia-platform/packages/validation/src/upload.ts:3), [upload routes](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/upload/routes.ts:9).

Any active authenticated user can submit an arbitrary record of parameters, which is signed with the account secret. There is no server-owned parameter allowlist, owner namespace, tenant/role check, or asset ownership check. The installed Cloudinary SDK uses the same signing mechanism for destroy parameters (`timestamp`, `public_id`), so this grants more authority than a controlled upload. Public property responses expose image public IDs. A guest can obtain signatures for other assets or overwrite operations. No live exploit was attempted.

Fix: define narrow upload intents; derive timestamp, folder/public ID, resource/delivery type, and ownership server-side; prevent caller-controlled destructive/overwrite parameters. Separate private verification documents from public listing photos. Test rejection of arbitrary keys and another tenant's asset IDs.

### A02 · P1 · Refunds pass invalid Stripe reasons and failures are lost

Evidence: [Stripe adapter](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/payments/stripe.gateway.ts:67), [guest cancellation](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/booking/booking.service.ts:334), [orphan remediation](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/payments/payment.service.ts:445).

The adapter casts arbitrary application text to Stripe's reason type. Default strings such as “Guest cancellation” and “Hold expired before payment completed” are invalid provider values. Stripe accepts `duplicate`, `fraudulent`, or `requested_by_customer`. [Stripe refund API](https://docs.stripe.com/api/refunds/create).

Guest cancellation commits cancellation/inventory release, catches the refund failure, and still returns success. A second cancellation cannot resume the refund because the booking is already cancelled. Orphan recovery retries the same invalid reason. Zero-refund policies can also attempt a provider refund of zero.

Fix: map valid provider reasons, retain free text internally, handle zero refunds, persist provider refund ID/status, and implement a durable retry/reconciliation operation. Test adapter request parameters and transient failure recovery, not only mocked service methods.

### A03 · P1 · Concurrent intent creation permits multiple payments for one hold

Evidence: [intent lookup/create](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/payments/payment.service.ts:133), [provider creation](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/payments/stripe.gateway.ts:18), [existing-booking path](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/payments/payment.service.ts:410).

Two requests can both find no reusable intent and create separate Stripe intents. There is no unique checkout-attempt constraint or provider idempotency key. Automatic capture can charge twice; manual capture can create two authorizations. Once one intent creates the booking, confirmation of another simply returns that booking and can mark the extra intent PAID, without refunding/cancelling the extra payment or linking it correctly.

Fix: durable unique payment-attempt identity, provider idempotency, and explicit excess-payment remediation. Test parallel intent creation with distinct provider IDs and both webhook delivery orders.

### A04 · P1 · Host approval races guest cancellation across the provider boundary

Evidence: [capture before state claim](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/booking/booking.service.ts:400), [cancellation provider branch](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/booking/booking.service.ts:317).

Interleaving: host reads BOOKED; guest commits CANCELLED and releases inventory; host captures payment; guest's authorization cancellation fails; host's conditional booking update fails. The result can be a cancelled booking with resellable inventory and a captured charge. The existing-booking webhook path does not compensate. A crash after capture but before database confirmation is likewise unreconciled.

Fix: claim a durable intermediate payment operation before external work, use idempotent provider calls, and reconcile/compensate incomplete transitions. Merely moving a network call inside a long database transaction does not solve crash recovery. Add deterministic approval-versus-cancellation and post-capture crash tests.

### A05 · P1 · Provider cancellation leaves approval bookings reserving inventory

Evidence: [failed/cancelled webhook path](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/payments/payment.service.ts:573).

Manual authorization converts the hold to BOOKED and deletes the hold. Later cancellation/authorization expiry only attempts to release that deleted hold and updates PaymentIntent. The booking stays BOOKED and inventory remains booked. Hold cleanup cannot repair this because it scans PropertyHold, not bookings.

Fix: reconcile the linked eligible booking, status history, payment state, and booked inventory atomically, with race protection. Test authorization → BOOKED → provider cancellation, including duplicate events.

### A06 · P1 · Concurrent unit-count edits corrupt inventory

Evidence: [unit type update](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/catalog/unit-type.service.ts:108), [delta application](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/catalog/unit-type.service.ts:152).

The existing unit count and reduction conflicts are read outside the write transaction. From count 3, two concurrent requests setting count 2 both apply −1: UnitType ends at 2 while inventory total ends at 1. A hold created between the conflict check and decrement can also produce negative available inventory. The migration checks counter sums, not nonnegative individual values.

Fix: serialize or conditionally claim capacity edits; revalidate inside the transaction; update against authoritative totals; add nonnegative database constraints. Test simultaneous edits and reductions racing holds.

### A07 · P1 · Request logs retain bearer tokens and cookies

Evidence: [logger configuration](/home/hamdan/projects/khan-familia-platform/apps/api/src/logger.ts:9).

Pino HTTP uses the default request serializer with no redaction. Offline serialization with dummy values confirmed that authorization and cookie headers survive in log output. Anyone with access to request logs may receive reusable credentials; this review did not inspect historical logs for real tokens.

Fix: redact sensitive request/response headers and relevant query parameters, use deliberate serializers, and test logs with sentinel secrets. Review access/retention for existing logs as part of remediation.

### A08 · P1 · SDK upload requests are not parsed as JSON

Evidence: [SDK upload/image methods](/home/hamdan/projects/khan-familia-platform/packages/sdk/src/index.ts:194), [signature proxy](/home/hamdan/projects/khan-familia-platform/apps/web/src/app/api/cloudinary-signature/route.ts:17), [image action](/home/hamdan/projects/khan-familia-platform/apps/web/src/app/account/properties/actions.ts:16).

The SDK stringifies bodies but does not set `Content-Type: application/json`. Native fetch supplies text/plain for those strings, so Express's JSON parser leaves the body unparsed. An offline injected-fetch reproduction verified this for both signature requests and image attachment. Vendor supporting-document upload and listing photo attachment are blocked.

Fix: centralize JSON request construction and test both methods through the actual parser. Fix A01 before enabling unrestricted uploads.

### A09 · P2 · Public property slugs are ambiguous across tenants

Evidence: [public detail query](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/public/public.service.ts:101), [schema uniqueness](/home/hamdan/projects/khan-familia-platform/packages/database/prisma/schema.prisma:469).

The database permits the same slug in different tenants, but public routing queries only the slug with `findFirst`. Two “Mountain Lodge” listings can link to the same returned property. Adopt globally unique public identifiers or tenant-qualified routes; test two tenants with identical slugs.

### A10 · P2 · Tenant suspension and property eligibility are inconsistently enforced

Evidence: [tenant middleware](/home/hamdan/projects/khan-familia-platform/apps/api/src/shared/middleware/tenant.ts:47), [public filters](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/public/public.service.ts:35), [hold property lookup](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/booking/booking.service.ts:114).

Active membership is checked without checking the parent tenant's status, so suspended tenants retain catalog operations and approved listings remain public. Hold creation loads a property by ID without enforcing approved/non-deleted property eligibility. Soft deletion leaves inventory, permitting a known property/unit pair to continue entering checkout.

Fix: shared eligibility checks for management, discovery, hold creation, and payment, with an explicit policy for already-created holds. Test suspended tenants and deleted/rejected properties.

### A11 · P2 · Application approval can provision multiple tenants

Evidence: [admin approval](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/admin/admin.service.ts:128), [tenant creation guard](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/tenancy/tenant.service.ts:66).

Admin approval provisions a tenant but does not set `approvedTenantId`. The separate tenant-create endpoint treats the null field as unused approval and can create another tenant. Eligibility checks are also not atomically claimed, allowing duplicate provisioning under concurrent approvals/creation.

Fix: consolidate provisioning, record the resulting tenant, and conditionally transition the expected application state. Test repeat and concurrent requests.

### A12 · P2 · Inventory generation is incomplete

Evidence: [worker registration](/home/hamdan/projects/khan-familia-platform/apps/worker/src/runtime.ts:25), [horizon sweep](/home/hamdan/projects/khan-familia-platform/apps/worker/src/jobs/inventory-horizon.job.ts:134), [unit creation](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/catalog/unit-type.service.ts:66).

The horizon sweep exists but has no callers/schedule. Only hold cleanup is scheduled; per-property generation is enqueued at property approval. New unit types added after approval receive no inventory; existing inventory does not automatically roll forward.

Fix: recurring horizon sweep plus generation on unit creation, retryable and idempotent. Verify runtime scheduling and repair of missing dates.

### A13 · P2 · Checkout bypasses guest capacity validation

Evidence: [initial room hold](/home/hamdan/projects/khan-familia-platform/apps/web/src/components/property/RoomTypeCard.tsx:52), [hold check](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/booking/booking.service.ts:132), [payment-time replacement](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/payments/payment.service.ts:68).

The normal UI creates a hold without guest details, validating a default single guest. Checkout can then supply additional guests; payment creation overwrites guest details without checking capacity. Enforce capacity and primary/adult rules at every update boundary, and expose authoritative limits to the wizard.

### A14 · P2 · Provider and internal currency disagree

Evidence: [hardcoded provider currency](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/payments/payment.service.ts:163), [internal currency](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/payments/payment.service.ts:183).

Stripe receives PKR while internal intent, price snapshot, and response use the tenant's currency. A non-PKR tenant produces inconsistent charges and records. Either enforce a PKR-only product constraint or use one validated currency throughout, including currency-aware minor-unit conversion.

### A15 · P2 · Post-login redirects are caught as failures

Evidence: [sync page](/home/hamdan/projects/khan-familia-platform/apps/web/src/app/sync/page.tsx:8).

All intended role redirects are inside a broad try/catch. Next's redirect throws control flow, so each is caught and replaced by `/`. Move redirects outside the catch or rethrow framework control flow. Verified against installed Next source and [Next redirect documentation](https://nextjs.org/docs/app/api-reference/functions/redirect). Test admin, tenant owner, and guest destinations.

### A16 · P2 · Uploaded Cloudinary images are not allowed by Next Image

Evidence: [image configuration](/home/hamdan/projects/khan-familia-platform/apps/web/next.config.mjs:11).

Cloudinary secure URLs are persisted and rendered with next/image, but remotePatterns only permits Google, Unsplash, and Pexels. Add the intended Cloudinary host/path restrictions and test a real-shaped persisted asset URL.

### A17 · P2 · Checkout misstates authorization as confirmed payment

Evidence: [success toast](/home/hamdan/projects/khan-familia-platform/apps/web/src/app/checkout/success/page.tsx:34), [success presentation](/home/hamdan/projects/khan-familia-platform/apps/web/src/app/checkout/success/page.tsx:99).

The success page always says confirmed/paid, even when the backend returns BOOKED/PENDING for host approval. Render distinct authorized, awaiting approval, confirmed, failed, and refunded states from authoritative data.

### A18 · P2 · Search is incomplete and silently excludes inventory

Evidence: [catalog page](/home/hamdan/projects/khan-familia-platform/apps/web/src/app/properties/page.tsx:19), [homepage hero](/home/hamdan/projects/khan-familia-platform/apps/web/src/components/home/Hero.tsx), [API pagination](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/public/public.service.ts:31).

The catalog fetches the default first 20 properties, then filters location locally. Matches outside that page are invisible. The homepage Search button has no submission/navigation handler. Wire search state into validated API filters and pagination; test a matching property beyond the first page.

### A19 · P2 · Authenticated caches lack identity and mutation invalidation

Evidence: [booking query](/home/hamdan/projects/khan-familia-platform/apps/web/src/hooks/useGuestBookings.ts:8), [profile query](/home/hamdan/projects/khan-familia-platform/apps/web/src/components/layout/HeaderUserButton.tsx:13), [query provider](/home/hamdan/projects/khan-familia-platform/apps/web/src/components/providers/ReactQueryProvider.tsx:13).

Queries use generic keys such as `me` and `guestBookings` with five-minute freshness. Checkout does not invalidate booking lists. A previously empty list can remain empty after successful booking. An account switch that retains the root provider can show the prior account's cached information; the real Clerk switching journey was not exercised, so that exposure is conditional on provider preservation.

Fix: include user/tenant identity in sensitive keys, clear sensitive cache on identity changes, and invalidate booking queries on relevant mutations.

### A20 · P2 · SDK authentication contract is inconsistent

Evidence: [SDK tenant/upload methods](/home/hamdan/projects/khan-familia-platform/packages/sdk/src/index.ts:183).

`getTenantProperties`, `addPropertyImage`, and `getUploadSignature` use the unauthenticated helper and ignore configured `getToken`. Existing server callers manually add headers, but consumers following the SDK's declared contract receive 401. Offline fake-fetch checks reproduced omitted authorization. Use one authenticated transport and test every protected method.

### A21 · P2 · Invitations and notifications do not deliver

Evidence: [invite service](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/tenancy/invite.service.ts:70), [notification worker](/home/hamdan/projects/khan-familia-platform/apps/worker/src/jobs/notification.job.ts:36).

Invite creation stores a token, omits it from responses, and never sends/enqueues delivery; acceptance requires that unreachable token. The notification handler records a ProcessedEvent and logs successful delivery while the sending implementation is a TODO. Implement delivery with durable retry/idempotency and record success only after provider acceptance. Keep tokens out of normal list responses.

### A22 · P2 · Destructive test-database guard accepts credential substrings

Evidence: [database guard](/home/hamdan/projects/khan-familia-platform/apps/api/src/test/database.ts:19), [cleanup](/home/hamdan/projects/khan-familia-platform/apps/api/src/test/database.ts:52), [environment override](/home/hamdan/projects/khan-familia-platform/apps/api/src/test/setup-env.ts:34).

The guard searches the entire connection URL for `test`, `testing`, or `ci`. A production database URL whose password happens to contain `ci` passes. An offline dummy URL reproduced this without connecting. Cleanup truncates all public tables. Local test configuration is loaded with override=true and currently enables RUN_DB_TESTS, so a shell-level opt-out can be overwritten.

Fix: explicit isolated test database identity, parse host/database separately from credentials, fail closed, and avoid overriding safety controls. Add tests for misleading credentials and production-like hosts. Provide disposable local/CI Postgres and migration setup.

### A23 · P2 · Temporary checkout guest IDs remain plaintext

Evidence: [hold guest update](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/payments/payment.service.ts:74), [initial hold storage](/home/hamdan/projects/khan-familia-platform/apps/api/src/modules/inventory/inventory.service.ts:354).

Guest ID values enter PropertyHold JSON before the encrypted BookingGuest representation is created. This makes the documented PII protection incomplete for active/abandoned checkout and retained database backups. Minimize collected data, protect it consistently, and define retention for temporary checkout and verification documents.

## Testing and operational gaps

- CONTEXT.md claims comprehensive worker/API coverage and production readiness. Worker and web have no test files; `--passWithNoTests` succeeds without coverage.
- DB integration/flow tests are gated by RUN_DB_TESTS. CI does not configure an isolated database, migrate it, or enable that gate. Passing CI therefore does not validate inventory/payment/RBAC database behavior.
- Existing payment tests mock the gateway adapter, hiding invalid provider parameters. Existing intent-reuse tests are sequential.
- The orphan refund test at [payment flow test](/home/hamdan/projects/khan-familia-platform/apps/api/src/test/flows/payment-webhook.flow.test.ts:282) omits metadata userId and the event object's payment status. Processing returns before the refund branch; retrying the same processed event cannot exercise the asserted refund failure. This test was reviewed, not executed against a database.
- CI omits the documented format:check gate. Turbo test caching does not explicitly model RUN_DB_TESTS or test database setup; revise caching when splitting unit/integration suites.
- Health is liveness only: `/health` always returns OK without checking database/Redis readiness. Add separate readiness probes and operational alerts.
- Stripe webhooks pass through the global limiter even though Clerk webhooks are exempt. A webhook burst can receive 429; assess provider endpoint rate limits separately.
- OpenTelemetry shutdown and server shutdown both register handlers that can call process.exit independently; unify shutdown sequencing so telemetry completion cannot cut off in-flight HTTP/database work.
- Tenant scoping is manual; ownership prechecks often precede ID-only writes. Composite relational invariants are not comprehensively enforced. Treat this as defense-in-depth work, not a proven universal tenancy bypass.
- Property/staff quota count checks and hold limits are also vulnerable to concurrent requests. Lower priority than the financial/capacity races above.
- Missing routes include `/account/profile`, `/admin/tenants`, `/admin/users`, `/admin/settings`. Some API failures are presented as empty catalog/application lists instead of errors.
- Accessibility needs a focused browser pass: unlabeled icon controls, non-keyboard hero calendar trigger, toggle state semantics, and hover-dependent booking links.
- Documentation drift: README calls several implemented packages scaffolding; worker README describes a placeholder runtime; RULES incorrectly says encryption key is not Zod-validated; CONTEXT overstates readiness. Keep a capability matrix and tested-state record alongside future changes.

## Verification record

Execution used the repository's Node 22.22.3 and pnpm 9.15.1 from NVM. Secrets were not printed. Live database tests, migrations, resets, payment operations, and uploads were not performed.

| Check                                                | Result                                                                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Frozen lockfile consistency, offline, ignore scripts | Passed                                                                                                           |
| Dependency manifest consistency (`pnpm lint:deps`)   | Passed                                                                                                           |
| Formatting (`pnpm format:check`)                     | Passed; new report also formatted and checked                                                                    |
| Lint and TypeScript checks                           | Passed, final uncached run: 21 lint/typecheck tasks                                                              |
| Production build (`pnpm exec turbo build --force`)   | Passed, 10 tasks, no cache hits                                                                                  |
| API unit + smoke suites, explicitly selected         | 11 passed across 3 files                                                                                         |
| DB integration/flow suites                           | Not run; configured target isolation not established                                                             |
| Browser and live-provider acceptance                 | Not performed                                                                                                    |
| Dependency vulnerability advisory scan               | Unverified: initial DNS failure; external retry rejected by automatic approval review pending user authorization |

The dependency advisory retry would send the production dependency graph to the public npm advisory service. Automatic approval review rejected that external metadata transfer because it was not specifically authorized. Authorization has been requested; no workaround was attempted. Dependency consistency does not establish absence of vulnerabilities.

The first smoke attempt failed because the sandbox denied local socket binding (`listen EPERM`); the authorized local-port rerun passed. An uncached typecheck briefly overlapped Next build regeneration and observed a disappearing `.next/types` file; the checks were rerun after build completion to distinguish orchestration interference from a source defect.

Offline focused checks confirmed SDK JSON/auth omissions, default log serialization retaining dummy credentials, and the test URL heuristic false-positive. Other findings rely on cross-file source traces; races and provider failure scenarios require the regression tests described above.

## Recommended implementation order

1. **Establish safe verification:** disposable PostgreSQL/Redis, migrations in CI, clear unit/integration commands, fail-closed test safety, fix malformed payment fixtures, and disable inappropriate integration-test caching.
2. **Close security and money risks:** constrained upload signing and log redaction; correct refunds; durable payment attempts; capture/cancel/refund reconciliation; provider-cancellation inventory recovery.
3. **Protect inventory and tenant invariants:** concurrent capacity changes, booking eligibility/suspension, unique public identifiers, single application provisioning, horizon generation, guest limits, currency policy.
4. **Finish the existing vertical journey:** upload JSON/auth and image configuration, role routing, accurate checkout states, search/pagination, cache invalidation, invitations and notifications. Add browser tests for guest booking and vendor onboarding.
5. **Build vendor operations:** tenant-aware dashboard, property/room management, inventory/rate calendar, booking approval/cancellation UI, and explicit tenant switching. Expand tours after the accommodation lifecycle is reliable.

Each repair should carry its smallest meaningful regression test, with concurrency/crash cases executed against isolated infrastructure. Preserve the modular monolith; centralize shared rules and durable operations rather than introducing new services prematurely. Significant architecture changes should receive an ADR under the repository rules.

Before feature planning, clarify the release audience (demo/pilot/production), operating currency, host approval deadline/cancellation policy, tenant suspension behavior, verification-document retention, and whether the first release includes tours. These decisions can refine the roadmap without delaying the concrete repairs above.

## Qualification addendum — 6 October 2026

The original assessment and findings above are retained as the historical 4 October review. A
skeptical recheck of the reviewed source narrowed the claims below. Offline reproductions used actual
source functions with fake persistence/provider dependencies; they did not contact live services or
establish deployed exploitability. Temporary reproduction scripts are not a committed regression
suite.

- **A01:** The actual schema/controller signs arbitrary parameters, including another asset's
  destroy-shaped parameters, using a fake Cloudinary secret. This requires an authenticated active
  internal user. Live destruction was not attempted; provider acceptance, configuration, and target
  asset identity remain preconditions. The claim is excess signing authority, not unauthenticated
  access or proof that every Cloudinary operation is possible.
- **A09:** The schema permits duplicate slugs across tenants while the public URL/query identifies
  only a slug. This requires two approved, nondeleted matches. Selection is unspecified; no specific
  winner or randomly changing database behavior was demonstrated.
- **A10:** Actual soft deletion followed by validated hold creation and the inventory service can
  create a new hold with retained matching available inventory. The reproduction used an in-memory
  database and fake queue; it does not establish a completed payment. Missing inventory, insufficient
  availability, self-booking, and deletion's active-hold/future-booking guards still reject their
  respective cases. Active tenant membership and parent tenant status are separate checks. The
  suspension policy explicitly blocks new bookings, but says visibility _can_ be hidden and does not
  explicitly prohibit every management operation. Those broader policy choices need clarification.
- **A11:** Actual sequential approval then tenant creation produces two tenants from one approval.
  A third sequential creation is rejected once `approvedTenantId` is set. Unlimited sequential
  provisioning is not established. Concurrent duplication remains a static interleaving analysis,
  not a real-PostgreSQL reproduction.
- **A21:** Invitation creation and acceptance API routes exist and are mounted. The missing part is
  normal delivery of the stored token; a manually obtained token could be accepted. The notification
  handler separately records a processed event without implementing delivery. This does not imply
  every product notification is already queued or that live email was exercised.

Phase 1 hardens test execution in response to A22: isolated local services, exact database identity
checks, no local secret-file loading, and explicit suite selection. See
[Backend Test Workspace](../testing/backend-tests.md). This work does not resolve the application
findings above or establish comprehensive test coverage. Record actual validation results with the
implementing change; infrastructure availability alone is not proof of a passing integration run.
