# ADR: controlled direct uploads and private application documents

- Date: 2026-10-24
- Status: Accepted

## Context

The API signed arbitrary browser-selected Cloudinary parameters. Uploading and linking were separate,
with the latter accepting arbitrary URLs/public IDs. Verification document input accepted public URL
JSON, while the application review UI linked directly to those URLs. Authentication alone did not
establish purpose, ownership, target permissions, or private delivery.

The user approved securing property photos and application documents using the existing role model.
The browser can continue to send file bytes directly to Cloudinary.

## Decision

Create durable `UploadAsset` records. Each record binds a generated asset ID to its applicant or
property scope and upload purpose. Photo authorization requires an active tenant and active
`OWNER`/`ADMIN` membership. No global admin bypass is introduced for tenant photo management.
Application documents belong to the applicant before any tenant exists.

Only strict purpose-specific input is accepted. The server chooses asset ID, timestamp, preset,
delivery type, formats, and `overwrite=false`. Photo delivery is public `upload`; documents use
`authenticated`, not merely a folder called private. Presets must be signed in the Cloudinary product
environment. The server never grants general-purpose signing authority.

Completion reads metadata using Cloudinary's Admin API for the reserved asset ID and expected delivery
type. Require image resources, permitted detected format, size, and version. This intentionally
includes PDF documents in Cloudinary's image resource type. Admission size limits are checked after
the direct upload; they do not prevent a malicious client from consuming provider upload bandwidth.

A verified photo can be linked only to its reserved property, by its uploader while still authorized.
The unique photo upload reference makes retries idempotent. New photos cannot enter through arbitrary
property create/update bodies. Room photos come from the property's photo library; existing room
images may be retained for compatibility.

Application submission transactionally claims completed, owned document records and stores upload
references instead of URLs. Draft document access belongs to the applicant only. A `SUPER_ADMIN` can
access submitted documents. Every access checks authentication/authorization before generating a
60-second signed attachment download URL. Responses use `no-store` and `no-referrer`. This URL is a
bearer capability during its lifetime, not continuous session authorization at Cloudinary.

A per-user rolling-hour quota uses a PostgreSQL transaction advisory lock so parallel API processes
cannot bypass its count. Upload signatures expire according to Cloudinary's one-hour validity; the
application refuses verification of expired incomplete intents. Membership changes cannot revoke
an already issued provider signature, but completion/attachment rechecks photo permissions.

Legacy document JSON is not silently converted to trusted private assets. API responses suppress old
URLs and the UI labels them unavailable. The user confirmed there are currently no documents and all database data is seeded. For any future
upgrade that does contain old assets, an authorized migration would be needed; this migration neither changes their Cloudinary access type nor purges
cached copies. Pending legacy applications need controlled remediation before normal review can use
their documents; the branch does not invent an applicant document-replacement workflow.

## Consequences

- Adds an additive schema migration and a workspace-only SDK test dependency; no external package
  version upgrade is needed.
- Changes upload/signature, image attachment, and application document input contracts. Deploy the
  API and web changes together. Old arbitrary parameter/URL callers must migrate.
- Requires two signed Cloudinary presets and consistent public/server cloud names.
- Adds an Admin API lookup per first completion; provider failure returns a retryable 503. Completed
  verification/attachment requests are idempotent where applicable.
- No premium token/CDN access-control feature is required. Authenticated delivery and signed download
  behavior must still be validated in the actual product environment.
- Abandoned intents/assets are not automatically deleted, and documents have no automatic retention
  deletion. Define retention/cleanup operationally before production; do not delete PII or existing
  assets under an assumed policy. No malware scanner or document authenticity verification is added.
- This branch does not add platform employee roles, decide tax-document requirements, fix sensitive
  request logging, or encrypt other temporary guest data. Those remain separately scoped work.

## References

- [Cloudinary client-side uploads](https://cloudinary.com/documentation/client_side_uploading)
- [Cloudinary delivery access](https://cloudinary.com/documentation/control_access_to_media)
- [Cloudinary upload presets](https://cloudinary.com/documentation/upload_presets)
- [Operator setup and acceptance checks](../testing/uploads.md)

## Monorepo review follow-up

File size/format rules have a single source in `packages/constants`; request/response types remain
in `packages/types`, and runtime schemas in `packages/validation`. The upload request schema is
checked against its shared request type. Document serialization reuses the submission schema in a
lightweight domain helper rather than importing the provider-backed upload service.

Provider signing, inspection, public URL construction, and private download generation are behind a
small API-side `MediaStorage` interface. Persist provider identity, an opaque storage key, and semantic
visibility rather than a Cloudinary delivery type. Retain the provider on existing records when new
uploads use a different provider. Only Cloudinary is implemented; adding another provider still
requires implementation, security configuration, delivery tests, and a data migration strategy.

The provider boundary is app infrastructure, not a new framework or shared package with no second
consumer. Generic utilities are not a home for database authorization or provider credentials.
Property/room reference comparisons share a catalog helper and indexed lookups rather than repeated
nested scans. This changes lookup complexity, not a claim of measured end-user speed improvement.
