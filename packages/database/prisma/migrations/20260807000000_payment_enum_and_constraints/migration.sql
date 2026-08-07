-- AlterEnum
BEGIN;
CREATE TYPE "PaymentProvider_new" AS ENUM ('STRIPE', 'MANUAL', 'RAPID_GATEWAY');
ALTER TABLE "PaymentIntent" ALTER COLUMN "provider" TYPE "PaymentProvider_new" USING ("provider"::text::"PaymentProvider_new");
ALTER TYPE "PaymentProvider" RENAME TO "PaymentProvider_old";
ALTER TYPE "PaymentProvider_new" RENAME TO "PaymentProvider";
DROP TYPE "PaymentProvider_old";
COMMIT;

ALTER TABLE "UnitInventory" DROP CONSTRAINT "unit_inventory_counts_check";
ALTER TABLE "UnitInventory" ADD CONSTRAINT "unit_inventory_counts_check" CHECK ("availableCount" + "bookedCount" + "blockedCount" + "heldCount" = "totalCount");

ALTER TABLE "PropertyHold" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
