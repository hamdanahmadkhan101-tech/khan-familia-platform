# Upload setup, permissions, and acceptance checks

Phase 2 keeps browser-to-Cloudinary direct uploads, with API-owned intents, parameters, and attachment
validation. Read the [decision](../decisions/adr-20261024-controlled-upload-assets.md) and
[implementation plan](../plans/2026-10-24-controlled-uploads.md).

## Operator setup before using the changed flow

1. Install the updated workspace dependency links: `pnpm install --frozen-lockfile`.
2. Apply the committed migration to the intended **development** database using your normal reviewed
   configuration: `pnpm --filter @khan-familia/database prisma:migrate:deploy`. Regenerate the client
   with `pnpm --filter @khan-familia/database generate` if needed. The assistant only migrated the
   guarded disposable test database; it did not change your Neon databases.
3. In the same Cloudinary product environment used by the API, create two **signed** upload presets:

   | Preset name                          | Allowed formats   | Delivery type |
   | ------------------------------------ | ----------------- | ------------- |
   | `khan_familia_property_photos`       | jpg,jpeg,png,webp | upload        |
   | `khan_familia_application_documents` | jpg,jpeg,png,pdf  | authenticated |

   Keep overwrite disabled. Do not add automatic eager transformations, conversion to another
   format, public-access windows, or settings that change/ignore the requested public ID. No unsigned
   upload preset is required for this flow. If `ml_default` is unsigned, assess its other users before
   deciding whether to disable it; this code change cannot revoke an existing unsigned preset.

4. If choosing different preset names, set `CLOUDINARY_PHOTO_UPLOAD_PRESET` and
   `CLOUDINARY_DOCUMENT_UPLOAD_PRESET` in the API environment. The defaults match the table. Existing
   Cloudinary API credentials remain server-only. Set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` to the
   **same cloud name** as `CLOUDINARY_CLOUD_NAME`; rebuild web after changing the public value.
5. Check Cloudinary's PDF/security settings and whether your environment permits uploading and
   downloading private PDFs. Test with harmless disposable documents, never actual identity scans.
   Do not enable account-wide public PDF delivery merely to make a private-document test pass.
6. The user confirmed this project has seeded data only and no uploaded documents. There is no
   existing-document privacy migration to perform for that dataset. The compatibility fallback for
   older URL-only JSON remains defensive; it does not require resetting or deleting seeded data.

Cloudinary presets do not provide a per-preset file-size limit. The browser checks 10 MiB photos /
5 MiB documents, and the API enforces the same admission limit using actual resource metadata before
attachment/submission. Client validation is not a provider-side upload-bandwidth quota. Set account
limits/monitoring as appropriate. Oversized/unverified/orphaned assets may need controlled cleanup;
this branch does not automatically destroy files or assume a document retention period.

## Roles and contract

- Photo signing/verification/attachment: active tenant `OWNER`/`ADMIN`, correct property, active tenant,
  and nondeleted property. `STAFF`, unrelated users, disabled memberships, and standalone platform
  admin status do not grant photo-management permission.
- Document signing: active applicant account with no pending/approved application; no tenant needed.
- Document verification/submission: uploader-owned completed document records only; references are
  claimed transactionally by one application. Legacy URLs and foreign references are rejected.
- Document access: owner may read their completed uploads; `SUPER_ADMIN` may read submitted documents
  only. Tenant membership alone never grants access to another person's verification documents.

`POST /upload/signature` now accepts `{ purpose: 'APPLICATION_DOCUMENT' }` or
`{ purpose: 'PROPERTY_PHOTO', propertyId }`. It returns an upload ID, provider URL, signed multipart
fields, client limits, and expiry. It rejects arbitrary parameter objects, including caller-selected
asset IDs, presets, delivery types, transformations, and overwrite options.

After direct upload, `POST /upload/:uploadId/complete` verifies provider metadata. The browser does not
submit an asset URL as evidence. `POST /properties/:propertyId/images` accepts only `{ uploadId }`.
Application `documents` entries accept `{ uploadId, type }`; document categories remain labels, not a
new legal/tax-verification workflow.

Property creation must precede photo upload. Property updates can preserve/reorder/remove existing
images but cannot introduce arbitrary new URLs. Room create/update images must reference the parent
property's photo library (or preserve existing room images when updating).

`GET /upload/:uploadId/access` returns an authorized, signed attachment link valid for 60 seconds.
The authenticated web route `/api/uploads/:uploadId/document` redirects to it. Anyone possessing
that link can use it until expiry. Refresh the application link to obtain a new one. Do not put these
signed URLs in persistent JSON, logs, email templates, or public Next Image optimization.

## Automated verification

From the root, with Node 22 and Docker access:

```bash
pnpm test
pnpm test:services:up
pnpm test:db:migrate
pnpm test:integration
pnpm test:services:down
pnpm lint
pnpm lint:test-infra
pnpm lint:deps
pnpm format:check
pnpm build
pnpm typecheck
```

The integration tests use real isolated PostgreSQL, the actual Express parser/middleware and SDK,
actual signature/download-URL generation, and controlled Cloudinary metadata responses. They cover
permission rejection, tampered input, expiry/retry, document claims, legacy-link suppression, photo
attachment idempotency, alternate image-write paths, and a parallel quota boundary. They do **not**
prove live upload-preset enforcement or Cloudinary delivery configuration.

## Browser/provider acceptance after setup

Use disposable accounts and harmless sample JPG/PNG/PDF files:

1. A guest applicant without a tenant uploads a document, opens it, and submits an application.
2. A different guest and tenant owner cannot open the document through its application route.
3. A platform reviewer can open it after submission, but cannot open another applicant's draft.
4. An unsigned delivery URL for the protected asset fails. The authorized attachment link works,
   expires after its stated lifetime, and cannot be made public by changing delivery type in the URL.
5. A tenant owner/admin uploads a photo, attaches it once, and sees it in the existing property view.
   A staff account and an unrelated tenant cannot authorize/complete/attach that photo.
6. Repeated attachment produces one image; temporary completion failure offers retry without requiring
   another upload. Changing a signature parameter is rejected by the provider.
7. Unsupported file types and oversized assets cannot become accepted photos/documents. Confirm
   provider limits/monitoring separately from application admission limits.

No real provider mutations or logged-in browser acceptance were performed by the assistant. Complete
this checklist before describing the entire live upload journey as verified.

## Recorded local results — 24 October 2026

- All 10 committed migrations applied to a fresh guarded test database, including the additive upload
  migration. A read-only Prisma schema comparison reported no difference.
- `pnpm test` passed: 46 API unit/smoke tests, including five SDK transport and seven architecture regressions. Other
  workspaces still report no test files; their successful commands are not scenario coverage.
- `pnpm test:integration` passed: 52 tests across five files, including 31 upload regressions. These
  include real PostgreSQL parallel quota checks, parallel photo attachment, and rollback of invalid
  document claims, with controlled Cloudinary metadata responses.
- Workspace lint, test-infrastructure lint, dependency consistency, formatting, build, and typecheck
  passed. The workspace build used dummy provider/public settings and read-only Turbo cache access;
  changed tasks ran, with unchanged tasks reused where available.
- The actual Next Image loader accepted the configured cloud's public photo path and stock images,
  and rejected another cloud, authenticated document paths, and raw-file paths.
- No Neon migration, real Cloudinary upload/download, preset change, real PII transfer, or logged-in
  browser acceptance was performed. The operator checklist above remains required for the live flow.

## Storage boundary and future provider changes

Cloudinary SDK operations live in `apps/api/src/infrastructure/storage/cloudinary-storage.ts`, behind
`MediaStorage`. Upload authorization, purpose, user/tenant ownership, quota, and attachment rules stay
in the API domain modules. Every new upload record stores `provider`, opaque `storageKey`, and
`PUBLIC`/`PRIVATE` visibility. The provider/key pair is unique. Unknown providers fail closed; they
never fall back to whichever provider is currently selected for new uploads.

Cloudinary is the only implemented provider. Switching to S3 would require an adapter, credentials,
private-bucket/CDN policy, end-to-end tests, image-host configuration, and a decision to keep or migrate
existing assets. S3 presigned POST could use the current multipart browser contract; presigned PUT
would require an explicit transport-contract extension. Cloudinary transformations/delivery options
are not automatically reproduced by object storage. The optional numeric version field currently
serves Cloudinary; providers with different version metadata may need a schema extension. Existing
`PropertyImage.publicId` is retained for compatibility and currently holds the provider's object key.

No S3 SDK, bucket, provider toggle, storage migration, or additional shared storage package was added.
If a worker or another app later needs these provider operations, the adapter and interface can move
to a dedicated package; shared code should not import an API application module.

The [reuse and storage review](../audits/2026-10-24-upload-architecture-review.md) records the inspected
packages, justified consolidations, remaining provider coupling, and performance limits.
