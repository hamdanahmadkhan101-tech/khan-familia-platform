# Phase 2: controlled uploads and document access

Branch: `fix/upload-authorization-and-integration`, from Phase 1 merge `cbcbc20` on `develop`.

## Rechecked scope

The current arbitrary signing schema/controller, unauthenticated SDK helpers for three protected
methods, missing JSON headers, and missing Cloudinary image host remain present in that base.
These correspond to A01, A08, A20, and A16 in the qualified audit. No live exploitation or provider
mutation was used to verify them.

The user authorized implementation after discussing these boundaries:

- Keep direct browser uploads; the API owns the authorization, signing parameters, and accepted asset.
- Active tenant owners/admins manage property photos; staff and unrelated users cannot upload them.
- Applicants can upload their own documents without tenant membership. Only the applicant and
  authorized platform reviewers can read them; reviewers currently means `SUPER_ADMIN`.
- Platform staff roles and broader onboarding/payment changes remain separate work.

## Implementation

1. Persist a server-issued upload intent with owner, purpose, target, generated public ID, delivery
   type, expiry, and verified metadata. Add an additive migration; retain existing photos and legacy
   document JSON without automatically asserting ownership or privacy for them.
2. Accept a strict purpose-specific request. Sign server-owned parameters, including disabled
   overwrite and restricted formats. Serialize a limit of 60 issued intents per user per rolling hour.
3. Verify the resource through Cloudinary's Admin API before marking completion. Never accept a
   client-provided asset URL, resource type, format, size, or success claim as authoritative.
4. Link verified photos idempotently. Validate target/ownership and recheck current photo permissions.
   Close alternate image-write paths; room photos use the property's photo library.
5. Claim applicant document references transactionally during submission. Protect document delivery
   with authenticated assets and authorization before issuing 60-second attachment download links.
6. Replace widget signing with a controlled file input/direct-upload flow and verification retry.
   Repair SDK JSON/auth handling and bounded Next Image configuration.
7. Exercise authorization, provider metadata rejection/retry, real SQL ownership/claims, quota
   concurrency, parser behavior, transport, legacy responses, and image-loader configuration.

## Completion boundary

Automated tests use isolated PostgreSQL and mocked provider resource responses. Real Cloudinary
upload/preset enforcement, private PDF delivery, Clerk browser sessions, and administrative handling
of old public documents require the operator checklist in `docs/testing/uploads.md`. Do not call
those externally configured steps verified merely because local code tests pass.

## Follow-up review requested by the user

- Verified existing constants, types, validation, utilities, SDK, database, and storage directories.
- Consolidated repeated upload admission policies in constants and reused the document schema.
- Removed provider dependencies from pure document serialization; retained domain rules in the API.
- Isolated Cloudinary operations behind a storage interface and recorded provider/key/visibility per
  new asset. No S3 implementation or speculative storage framework was added.
- Replaced repeated image-array scans with reusable catalog keys and indexed lookups.
- User confirmed no existing documents and seeded data only. No cleanup or content migration is
  required for the current dataset. Do not reset development data or apply its schema migration on
  the user's behalf.
