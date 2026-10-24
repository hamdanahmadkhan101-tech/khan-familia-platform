# Upload branch: reuse, boundaries, and storage review

Reviewed on 24 October 2026, on `fix/upload-authorization-and-integration`. This supplements the Phase
2 plan; it is not a new full-codebase security audit. The user confirmed all current database data
is seeded and there are no uploaded documents. No development migration, provider mutation, seeded
content deletion, or Git mutation was performed.

## Existing code inspected

- All `packages/utils/src` implementations: dates, finance, slugs/IDs, and encryption; no existing
  upload policy, storage adapter, or media-reference utility exists there.
- Constants, shared DTOs, validation schemas, SDK transport, database models, API storage modules,
  catalog/application upload consumers, and both frontend upload callers.
- Existing architecture rules, dependency governance, tenant role middleware, and payment gateway
  interface. The payment gateway provides an existing example of separating provider operations
  from domain behavior.

## Findings and changes

| Concern                                 | Evidence in the first implementation                                            | Reviewed result                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| File rules repeated across browser/API  | Format arrays and 5/10 MiB calculations appeared independently                  | One `UPLOAD_POLICIES` definition in `packages/constants` feeds both                           |
| Document validation repeated            | Serializer constructed its own weaker schema inside the map                     | Reuses the existing submission document schema in a lightweight domain helper                 |
| Unrelated provider loading              | Application/admin serialization imported the provider-backed upload service     | Imports the pure document helper instead                                                      |
| Storage coupling                        | Domain upload service directly signed/read/formatted Cloudinary objects         | Provider operations live behind API-side `MediaStorage`; Cloudinary has its own adapter       |
| Persisted provider identity missing     | New asset stored a Cloudinary public ID/type without provider identity          | Stores provider, opaque key, and semantic public/private visibility; provider/key pair unique |
| Repeated image scans                    | Property/room writes repeatedly used `some`/`find` and rebuilt candidate arrays | Shared catalog keys with Map/Set lookup; empty reference lists avoid an unnecessary query     |
| Potential unsupported provider fallback | A future default-provider change could otherwise reinterpret old keys           | Each record selects its own provider; unknown providers fail closed and have regression tests |

The shared upload request DTO is checked against its Zod request schema. Types and runtime validation
serve different purposes; both are intentional. Frontend advisory validation and backend authoritative
metadata validation remain at their respective trust boundaries, using the same policy values.

Existing encryption is already reused through the API environment-binding wrapper around
`packages/utils`. No encryption or signing algorithm was copied. Native UUID generation and the
Cloudinary SDK remain appropriate primitives; introducing wrappers around every library call would
not improve reuse.

## Placement decisions

- `packages/constants`: shared format/size policy, with no server secrets or SDK dependencies.
- `packages/types`: public upload request/response contracts.
- `packages/validation`: input parsing and document-reference schema.
- `packages/sdk`: shared HTTP authentication, JSON headers, and API operations.
- API domain modules: user/tenant authorization, ownership, claims, quotas, and attachment rules.
- API infrastructure: provider interface, Cloudinary implementation, and provider lookup.
- Web: a single reusable direct-upload component and authenticated app routes.

Catalog reference keys are reused within the catalog module. They were not placed in generic utilities
because their current consumers and compatibility semantics belong to this domain. Database-backed
authorization must not be moved into a general utility package. Middleware and service checks also
serve different contexts; invoking HTTP middleware inside a service would be the wrong reuse.

Only the API currently consumes storage-provider operations. No speculative shared storage package or
DI framework was introduced. If another app genuinely needs these operations, extract the interface
and adapter into a dedicated package rather than importing one application from another.

## Performance assessment

No end-user performance benchmark was conducted; this review does not claim measured speed gains.
Changes remove repeated array scans and unnecessary empty-list reads. Reference validation is linear
in the number of stored/submitted references rather than a repeated scan for every incoming item.
Property lookups select only the URL/key/upload reference columns they use.

The refactor adds no provider network request to ordinary public image rendering. Public URL building
and Cloudinary download-link signing are local operations. First upload completion still performs one
provider metadata lookup; completed verification retries skip it. Provider objects/policies are
module singletons. File bytes still travel browser → provider, not through Express.

## Future storage changes

Cloudinary is the only implemented provider. The interface permits asynchronous signing and carries
formats, size, and expiry to the adapter. The browser receives generic multipart upload fields rather
than depending on the Cloudinary widget/SDK. An S3 presigned POST adapter could use this transport;
presigned PUT would need an explicit contract extension.

An S3 implementation would still need credentials/IAM, private bucket and CDN access policy, checksum
and overwrite/replay behavior, authoritative file-content validation, download signing, tests, image
host configuration, and a data retention/migration decision. S3 client-declared Content-Type metadata
must not be mistaken for Cloudinary's detected file format. Cloudinary transformations are not a
feature of object storage alone. The optional numeric version is sufficient for today's adapter, not
a promise that every future provider version identifier fits it.

Keeping provider identity on each record allows existing Cloudinary assets to remain there when new
uploads use a different backend. It does not copy assets, rewrite old photo URLs, or implement S3.
The existing `PropertyImage.publicId` field is retained for compatibility and currently carries the
object key. It can be renamed through a separately reviewed migration if that becomes worthwhile.

## Verification

See the current results in [upload testing](../testing/uploads.md). New regressions cover unsupported
provider names, stored visibility, provider identity, schema reuse, image-key handling, and the
existing authorization/metadata/parser/concurrency cases. Provider calls use controlled responses;
real Cloudinary presets, delivery, and logged-in browser acceptance remain unverified.

## Current provider documentation

- [Cloudinary upload presets](https://cloudinary.com/documentation/upload_presets), fetched 24 October
  2026; page reports updated 19 October 2026.
- [Cloudinary access control](https://cloudinary.com/documentation/control_access_to_media).
- [S3 presigned access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html).
- [CloudFront private delivery](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PrivateContent.html).
