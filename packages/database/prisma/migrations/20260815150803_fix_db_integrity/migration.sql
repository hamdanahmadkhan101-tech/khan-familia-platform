/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,channel,externalBookingRef]` on the table `AccommodationBooking` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_userId_fkey";

-- DropForeignKey
ALTER TABLE "TenantApplication" DROP CONSTRAINT "TenantApplication_userId_fkey";

-- DropIndex
DROP INDEX "AccommodationBooking_externalBookingRef_idx";

-- AlterTable
ALTER TABLE "PropertyHold" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "AccommodationBooking_tenantId_channel_externalBookingRef_key" ON "AccommodationBooking"("tenantId", "channel", "externalBookingRef");

-- CreateIndex
CREATE INDEX "BookingGuest_bookingId_idx" ON "BookingGuest"("bookingId");

-- CreateIndex
CREATE INDEX "BookingSpecialRequest_bookingId_idx" ON "BookingSpecialRequest"("bookingId");

-- CreateIndex
CREATE INDEX "CancellationPolicyRule_policyId_idx" ON "CancellationPolicyRule"("policyId");

-- CreateIndex
CREATE INDEX "PaymentRecord_paymentIntentId_idx" ON "PaymentRecord"("paymentIntentId");

-- CreateIndex
CREATE INDEX "Refund_paymentIntentId_idx" ON "Refund"("paymentIntentId");

-- AddForeignKey
ALTER TABLE "TenantApplication" ADD CONSTRAINT "TenantApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
