CREATE TYPE "UploadPurpose" AS ENUM ('PROPERTY_PHOTO', 'APPLICATION_DOCUMENT');

CREATE TABLE "UploadAsset" (
    "id" TEXT NOT NULL,
    "purpose" "UploadPurpose" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "tenantId" TEXT,
    "propertyId" TEXT,
    "applicationId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'cloudinary',
    "storageKey" TEXT NOT NULL,
    "visibility" TEXT NOT NULL,
    "format" TEXT,
    "bytes" INTEGER,
    "version" INTEGER,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadAsset_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UploadAsset_scope_check" CHECK (
      ("purpose" = 'PROPERTY_PHOTO' AND "tenantId" IS NOT NULL AND "propertyId" IS NOT NULL AND "applicationId" IS NULL AND "visibility" = 'PUBLIC') OR
      ("purpose" = 'APPLICATION_DOCUMENT' AND "tenantId" IS NULL AND "propertyId" IS NULL AND "visibility" = 'PRIVATE')
    )
);
CREATE UNIQUE INDEX "UploadAsset_provider_storageKey_key" ON "UploadAsset"("provider", "storageKey");
CREATE INDEX "UploadAsset_ownerId_createdAt_idx" ON "UploadAsset"("ownerId", "createdAt");
CREATE INDEX "UploadAsset_applicationId_idx" ON "UploadAsset"("applicationId");
CREATE INDEX "UploadAsset_tenantId_propertyId_idx" ON "UploadAsset"("tenantId", "propertyId");
ALTER TABLE "UploadAsset" ADD CONSTRAINT "UploadAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UploadAsset" ADD CONSTRAINT "UploadAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UploadAsset" ADD CONSTRAINT "UploadAsset_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UploadAsset" ADD CONSTRAINT "UploadAsset_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "TenantApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PropertyImage" ADD COLUMN "uploadId" TEXT;
CREATE UNIQUE INDEX "PropertyImage_uploadId_key" ON "PropertyImage"("uploadId");
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "UploadAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
