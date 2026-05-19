DROP INDEX IF EXISTS "Booking_status_paymentStatus_holdExpiresAt_idx";
-- Remove paymentStatus field from Booking (redundant cache of Payment.status)
ALTER TABLE "Booking" DROP COLUMN IF EXISTS "paymentStatus";

-- Ensure simplified index does not already exist, then create it
DROP INDEX IF EXISTS "Booking_status_holdExpiresAt_idx";
CREATE INDEX IF NOT EXISTS "Booking_status_holdExpiresAt_idx" ON "Booking" ("status", "holdExpiresAt");
