-- AlterTable
ALTER TABLE "AccommodationBooking" ADD COLUMN     "unitQuantity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'PKR',
ADD COLUMN     "serviceFeePercentage" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
ADD COLUMN     "taxPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "UnitInventory" ADD COLUMN     "heldCount" INTEGER NOT NULL DEFAULT 0;
