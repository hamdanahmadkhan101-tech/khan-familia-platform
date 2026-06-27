/*
  Warnings:

  - Added the required column `propertyId` to the `PropertyHold` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `PropertyHold` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PropertyHold" ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "PropertyHold_userId_idx" ON "PropertyHold"("userId");

-- CreateIndex
CREATE INDEX "PropertyHold_propertyId_idx" ON "PropertyHold"("propertyId");

-- AddForeignKey
ALTER TABLE "PropertyHold" ADD CONSTRAINT "PropertyHold_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyHold" ADD CONSTRAINT "PropertyHold_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
