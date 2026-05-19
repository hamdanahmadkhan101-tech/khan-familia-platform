-- Data integrity constraints
ALTER TABLE "UnitInventory"
ADD CONSTRAINT "unit_inventory_counts_check"
CHECK ("availableCount" + "bookedCount" + "blockedCount" = "totalCount");

ALTER TABLE "Review"
ADD CONSTRAINT "review_rating_range"
CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE "TourReview"
ADD CONSTRAINT "tour_review_rating_range"
CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE "TourDeparture"
ADD CONSTRAINT "tour_departure_capacity_check"
CHECK ("bookedCount" <= "maxCapacity");

CREATE UNIQUE INDEX "tenant_invite_pending_unique"
ON "TenantInvite" ("tenantId", "email")
WHERE status = 'PENDING';