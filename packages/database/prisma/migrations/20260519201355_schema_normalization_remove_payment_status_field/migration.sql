-- Drop index that includes paymentStatus
DROP INDEX IF EXISTS "Booking_status_paymentStatus_holdExpiresAt_idx";

-- Remove paymentStatus field from Booking (redundant cache of Payment.status)
ALTER TABLE "Booking" DROP COLUMN "paymentStatus";

-- Recreate the simplified index without paymentStatus
CREATE INDEX "Booking_status_holdExpiresAt_idx" ON "Booking" ("status", "holdExpiresAt");
