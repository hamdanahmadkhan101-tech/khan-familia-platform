-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "requiresApproval" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TourPackage" ADD COLUMN     "requiresApproval" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UnitType" ADD COLUMN     "unitCount" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "TourParticipant" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "isGroupLeader" BOOLEAN NOT NULL DEFAULT false,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "age" INTEGER,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "specialNeeds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TourParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TourParticipant_bookingId_idx" ON "TourParticipant"("bookingId");

-- AddForeignKey
ALTER TABLE "TourParticipant" ADD CONSTRAINT "TourParticipant_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "TourBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
