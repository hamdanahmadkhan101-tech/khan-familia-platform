-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('USER', 'PROPERTY_OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TenantRole" AS ENUM ('OWNER', 'ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "TenantUserStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');

-- CreateEnum
CREATE TYPE "TenantInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BusinessVertical" AS ENUM ('ACCOMMODATIONS_STAYS', 'EXPERIENCES_TOURS', 'VEHICLE_RENTALS', 'VENUES_EVENTS', 'FOOD_DINING');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('HOTEL', 'APARTMENT', 'VILLA', 'RESORT', 'HOSTEL', 'GUESTHOUSE', 'MOTEL', 'CONDO', 'BUNGALOW', 'CABIN', 'FARMSTAY', 'HOUSEBOAT', 'TENT', 'TREEHOUSE', 'B_AND_B', 'PRIVATE_ROOM');

-- CreateEnum
CREATE TYPE "PropertyCategory" AS ENUM ('HOTELS_HOSPITALITY', 'VACATION_RENTALS', 'ALTERNATIVE_STAYS', 'SHARED_ACCOMMODATION');

-- CreateEnum
CREATE TYPE "AmenityCategory" AS ENUM ('PROPERTY', 'UNIT', 'BOTH');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'BOOKED', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "BookingChannel" AS ENUM ('DIRECT', 'MANUAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'MANUAL', 'JAZZCASH', 'EASYPAISA');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "CancellationPolicyType" AS ENUM ('FLEXIBLE', 'MODERATE', 'STRICT', 'NON_REFUNDABLE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_REMINDER', 'NEW_BOOKING', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'REFUND_PROCESSED', 'TOUR_BOOKING_CONFIRMED', 'TOUR_BOOKING_CANCELLED', 'REVIEW_REQUEST', 'REVIEW_RESPONSE', 'NEW_INQUIRY', 'INQUIRY_RESPONSE', 'TENANT_OWNER_REMOVED', 'TENANT_SUSPENDED', 'PROPERTY_APPROVED', 'PROPERTY_REJECTED', 'VENDOR_APPLICATION', 'NEW_SUPPORT_TICKET', 'SUPPORT_TICKET_RESPONSE');

-- CreateEnum
CREATE TYPE "PropertyApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TenantApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('GENERAL_ENQUIRY', 'BOOKING_SUPPORT', 'ACCESSIBILITY', 'COMPLAINT', 'REPORT');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportTicketType" AS ENUM ('GENERAL', 'INVENTORY_HORIZON_INCREASE', 'PROPERTY_LIMIT_INCREASE', 'STAFF_LIMIT_INCREASE');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TourCategory" AS ENUM ('ADVENTURE', 'FAMILY', 'HONEYMOON', 'CULTURAL', 'RELIGIOUS', 'NATURE', 'WILDLIFE', 'HISTORICAL', 'BUDGET', 'LUXURY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TourDifficultyLevel" AS ENUM ('EASY', 'MODERATE', 'CHALLENGING', 'EXTREME');

-- CreateEnum
CREATE TYPE "TourPricingType" AS ENUM ('PER_PERSON', 'PER_GROUP');

-- CreateEnum
CREATE TYPE "TourDepartureStatus" AS ENUM ('OPEN', 'FULL', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TourBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "preferredCurrency" TEXT NOT NULL DEFAULT 'PKR',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "preferredTimezone" TEXT NOT NULL DEFAULT 'Asia/Karachi',
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "role" "PlatformRole" NOT NULL DEFAULT 'USER',
    "defaultTenantId" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "statusReason" TEXT,
    "statusChangedAt" TIMESTAMP(3),
    "maxProperties" INTEGER NOT NULL DEFAULT 3,
    "inventoryHorizonDays" INTEGER NOT NULL DEFAULT 365,
    "recentSearchedCities" TEXT[],
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "businessVertical" "BusinessVertical",
    "propertyLimit" INTEGER NOT NULL DEFAULT 3,
    "staffLimit" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantUser" (
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TenantRole" NOT NULL DEFAULT 'STAFF',
    "status" "TenantUserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantUser_pkey" PRIMARY KEY ("tenantId","userId")
);

-- CreateTable
CREATE TABLE "TenantInvite" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "TenantRole" NOT NULL DEFAULT 'STAFF',
    "status" "TenantInviteStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "images" JSONB NOT NULL,
    "starRating" INTEGER,
    "propertyType" "PropertyType",
    "propertyCategory" "PropertyCategory",
    "propertyDetails" JSONB,
    "isWholePropertyBookable" BOOLEAN NOT NULL DEFAULT false,
    "wholePropertyBasePrice" DECIMAL(10,2),
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "timezone" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "houseRules" JSONB,
    "facilities" JSONB,
    "totalRooms" INTEGER,
    "propertySizeSqm" DOUBLE PRECISION,
    "bedroomsCount" INTEGER,
    "bathroomsCount" INTEGER,
    "kitchensCount" INTEGER,
    "livingRoomsCount" INTEGER,
    "diningRoomsCount" INTEGER,
    "totalFloors" INTEGER,
    "builtYear" INTEGER,
    "minPricePerNight" DECIMAL(10,2),
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "approvalStatus" "PropertyApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectionReason" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "state" TEXT,
    "zipCode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "timezone" TEXT,
    "nearbyAttractions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "unitTypeId" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "maxGuests" INTEGER NOT NULL,
    "beds" INTEGER NOT NULL DEFAULT 1,
    "pricePerNight" DECIMAL(10,2) NOT NULL,
    "images" JSONB NOT NULL,
    "bedType" TEXT,
    "viewType" TEXT,
    "floor" INTEGER,
    "sizeSqm" DOUBLE PRECISION,
    "bathroomsCount" INTEGER,
    "sofaBeds" INTEGER,
    "extraBeds" INTEGER,
    "hasBalcony" BOOLEAN NOT NULL DEFAULT false,
    "hasTerrace" BOOLEAN NOT NULL DEFAULT false,
    "hasWindow" BOOLEAN NOT NULL DEFAULT false,
    "hasKitchenette" BOOLEAN NOT NULL DEFAULT false,
    "breakfastIncluded" BOOLEAN NOT NULL DEFAULT false,
    "smokingAllowed" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitType" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amenity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "category" "AmenityCategory" NOT NULL,
    "description" TEXT,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyAmenity" (
    "propertyId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,

    CONSTRAINT "PropertyAmenity_pkey" PRIMARY KEY ("propertyId","amenityId")
);

-- CreateTable
CREATE TABLE "UnitAmenity" (
    "unitId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,

    CONSTRAINT "UnitAmenity_pkey" PRIMARY KEY ("unitId","amenityId")
);

-- CreateTable
CREATE TABLE "UnitInventory" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitTypeId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalCount" INTEGER NOT NULL DEFAULT 1,
    "availableCount" INTEGER NOT NULL DEFAULT 1,
    "bookedCount" INTEGER NOT NULL DEFAULT 0,
    "blockedCount" INTEGER NOT NULL DEFAULT 0,
    "priceOverride" DECIMAL(10,2),
    "blockReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "unitTypeId" TEXT,
    "tenantId" TEXT NOT NULL,
    "channel" "BookingChannel" NOT NULL DEFAULT 'DIRECT',
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "nights" INTEGER NOT NULL,
    "guests" INTEGER NOT NULL DEFAULT 1,
    "pricePerNight" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "priceBeforeDiscount" DECIMAL(10,2),
    "discountAmount" DECIMAL(10,2),
    "promoCodeId" TEXT,
    "promoUsageApplied" BOOLEAN NOT NULL DEFAULT false,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "confirmedAt" TIMESTAMP(3),
    "confirmedById" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "checkedInById" TEXT,
    "checkedOutAt" TIMESTAMP(3),
    "checkedOutById" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "holdExpiresAt" TIMESTAMP(3),
    "idempotencyKey" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "cancellationReason" TEXT,
    "cancellationDate" TIMESTAMP(3),
    "refundAmount" DECIMAL(10,2),
    "notes" TEXT,
    "externalBookingRef" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingGuest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "idType" TEXT,
    "idNumber" TEXT,

    CONSTRAINT "BookingGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingSpecialRequest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "BookingSpecialRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "unitInventoryId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "provider" "PaymentProvider",
    "transactionId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" JSONB,
    "refundAmount" DECIMAL(10,2),
    "refundReason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourPayment" (
    "id" TEXT NOT NULL,
    "tourBookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "provider" "PaymentProvider",
    "transactionId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" JSONB,
    "refundAmount" DECIMAL(10,2),
    "refundReason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "images" JSONB,
    "staffScore" DOUBLE PRECISION,
    "cleanlinessScore" DOUBLE PRECISION,
    "locationScore" DOUBLE PRECISION,
    "valueScore" DOUBLE PRECISION,
    "facilitiesScore" DOUBLE PRECISION,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "responseText" TEXT,
    "respondedAt" TIMESTAMP(3),
    "respondedById" TEXT,
    "isVerifiedStay" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tourPackageId" TEXT NOT NULL,
    "tourBookingId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "images" JSONB,
    "guideScore" DOUBLE PRECISION,
    "itineraryScore" DOUBLE PRECISION,
    "safetyScore" DOUBLE PRECISION,
    "paceScore" DOUBLE PRECISION,
    "valueScore" DOUBLE PRECISION,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "responseText" TEXT,
    "respondedAt" TIMESTAMP(3),
    "respondedById" TEXT,
    "isTourCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "minBookingAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "maxDiscount" DECIMAL(10,2),
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCodeProperty" (
    "promoCodeId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "PromoCodeProperty_pkey" PRIMARY KEY ("promoCodeId","propertyId")
);

-- CreateTable
CREATE TABLE "CancellationPolicy" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "policyType" "CancellationPolicyType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CancellationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancellationPolicyRule" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "daysBeforeCheckIn" INTEGER NOT NULL,
    "refundPercentage" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "CancellationPolicyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistProperty" (
    "wishlistId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistProperty_pkey" PRIMARY KEY ("wishlistId","propertyId")
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "query" TEXT,
    "city" TEXT,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "guests" INTEGER,
    "minPrice" DECIMAL(10,2),
    "maxPrice" DECIMAL(10,2),
    "starRating" INTEGER,
    "amenities" TEXT[],
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "clickedProperties" TEXT[],
    "clickedTours" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "TenantApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "approvedTenantId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessVertical" "BusinessVertical" NOT NULL,
    "businessAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL,
    "phoneCountryCode" TEXT,
    "govIdType" TEXT NOT NULL,
    "govIdNumber" TEXT NOT NULL,
    "businessRegNumber" TEXT NOT NULL,
    "taxId" TEXT,
    "businessWebsite" TEXT,
    "altEmail" TEXT,
    "experience" TEXT NOT NULL,
    "documents" JSONB NOT NULL DEFAULT '[]',
    "adminNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "tenantId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyInquiry" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "bookingId" TEXT,
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "type" "InquiryType" NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'OPEN',
    "message" TEXT NOT NULL,
    "responseText" TEXT,
    "respondedAt" TIMESTAMP(3),
    "respondedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "SupportTicketType" NOT NULL DEFAULT 'GENERAL',
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "requestedHorizonDays" INTEGER,
    "requestedPropertyLimit" INTEGER,
    "requestedStaffLimit" INTEGER,
    "responseText" TEXT,
    "respondedAt" TIMESTAMP(3),
    "respondedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourPackage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdById" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "summary" TEXT,
    "images" JSONB NOT NULL,
    "category" "TourCategory" NOT NULL,
    "difficultyLevel" "TourDifficultyLevel" NOT NULL DEFAULT 'EASY',
    "durationDays" INTEGER NOT NULL,
    "durationNights" INTEGER NOT NULL,
    "pricingType" "TourPricingType" NOT NULL DEFAULT 'PER_PERSON',
    "pricePerPerson" DECIMAL(10,2),
    "pricePerGroup" DECIMAL(10,2),
    "minGroupSize" INTEGER NOT NULL DEFAULT 1,
    "maxGroupSize" INTEGER NOT NULL DEFAULT 20,
    "departureCity" TEXT NOT NULL,
    "departurePoint" TEXT,
    "destinations" TEXT[],
    "inclusions" JSONB NOT NULL,
    "exclusions" JSONB NOT NULL DEFAULT '[]',
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requirements" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourItineraryDay" (
    "id" TEXT NOT NULL,
    "tourPackageId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "accommodationId" TEXT,
    "accommodationNote" TEXT,
    "meals" JSONB NOT NULL,
    "activities" JSONB NOT NULL,
    "transportNote" TEXT,

    CONSTRAINT "TourItineraryDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourDeparture" (
    "id" TEXT NOT NULL,
    "tourPackageId" TEXT NOT NULL,
    "departureDate" DATE NOT NULL,
    "returnDate" DATE NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "bookedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "TourDepartureStatus" NOT NULL DEFAULT 'OPEN',
    "priceOverride" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourDeparture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourBooking" (
    "id" TEXT NOT NULL,
    "tourPackageId" TEXT NOT NULL,
    "tourDepartureId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "numberOfPeople" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "priceSnapshot" DECIMAL(10,2) NOT NULL,
    "status" "TourBookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "specialRequests" TEXT,
    "idempotencyKey" TEXT,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "refundAmount" DECIMAL(10,2),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_isDeleted_idx" ON "User"("isDeleted");

-- CreateIndex
CREATE INDEX "User_defaultTenantId_idx" ON "User"("defaultTenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "TenantUser_userId_idx" ON "TenantUser"("userId");

-- CreateIndex
CREATE INDEX "TenantUser_tenantId_idx" ON "TenantUser"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantInvite_token_key" ON "TenantInvite"("token");

-- CreateIndex
CREATE INDEX "TenantInvite_tenantId_idx" ON "TenantInvite"("tenantId");

-- CreateIndex
CREATE INDEX "TenantInvite_email_idx" ON "TenantInvite"("email");

-- CreateIndex
CREATE INDEX "TenantInvite_status_idx" ON "TenantInvite"("status");

-- CreateIndex
CREATE INDEX "TenantInvite_tenantId_email_status_idx" ON "TenantInvite"("tenantId", "email", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");

-- CreateIndex
CREATE INDEX "Property_approvalStatus_idx" ON "Property"("approvalStatus");

-- CreateIndex
CREATE INDEX "Property_approvalStatus_city_idx" ON "Property"("approvalStatus", "city");

-- CreateIndex
CREATE INDEX "Property_averageRating_idx" ON "Property"("averageRating");

-- CreateIndex
CREATE INDEX "Property_minPricePerNight_idx" ON "Property"("minPricePerNight");

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "Property"("city");

-- CreateIndex
CREATE INDEX "Property_country_idx" ON "Property"("country");

-- CreateIndex
CREATE INDEX "Property_slug_idx" ON "Property"("slug");

-- CreateIndex
CREATE INDEX "Property_name_idx" ON "Property"("name");

-- CreateIndex
CREATE INDEX "Property_propertyCategory_idx" ON "Property"("propertyCategory");

-- CreateIndex
CREATE INDEX "Property_tenantId_idx" ON "Property"("tenantId");

-- CreateIndex
CREATE INDEX "Property_isDeleted_idx" ON "Property"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "Location_propertyId_key" ON "Location"("propertyId");

-- CreateIndex
CREATE INDEX "Location_lat_lng_idx" ON "Location"("lat", "lng");

-- CreateIndex
CREATE INDEX "Unit_propertyId_isAvailable_idx" ON "Unit"("propertyId", "isAvailable");

-- CreateIndex
CREATE INDEX "Unit_pricePerNight_idx" ON "Unit"("pricePerNight");

-- CreateIndex
CREATE INDEX "Unit_unitTypeId_idx" ON "Unit"("unitTypeId");

-- CreateIndex
CREATE INDEX "Unit_tenantId_idx" ON "Unit"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_propertyId_unitNumber_key" ON "Unit"("propertyId", "unitNumber");

-- CreateIndex
CREATE INDEX "UnitType_propertyId_idx" ON "UnitType"("propertyId");

-- CreateIndex
CREATE INDEX "UnitType_tenantId_idx" ON "UnitType"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitType_propertyId_name_key" ON "UnitType"("propertyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_name_key" ON "Amenity"("name");

-- CreateIndex
CREATE INDEX "UnitInventory_propertyId_date_idx" ON "UnitInventory"("propertyId", "date");

-- CreateIndex
CREATE INDEX "UnitInventory_unitTypeId_date_idx" ON "UnitInventory"("unitTypeId", "date");

-- CreateIndex
CREATE INDEX "UnitInventory_date_idx" ON "UnitInventory"("date");

-- CreateIndex
CREATE INDEX "UnitInventory_tenantId_idx" ON "UnitInventory"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitInventory_propertyId_unitTypeId_date_key" ON "UnitInventory"("propertyId", "unitTypeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Booking_userId_status_idx" ON "Booking"("userId", "status");

-- CreateIndex
CREATE INDEX "Booking_propertyId_idx" ON "Booking"("propertyId");

-- CreateIndex
CREATE INDEX "Booking_propertyId_checkIn_idx" ON "Booking"("propertyId", "checkIn");

-- CreateIndex
CREATE INDEX "Booking_unitId_status_checkIn_idx" ON "Booking"("unitId", "status", "checkIn");

-- CreateIndex
CREATE INDEX "Booking_status_holdExpiresAt_idx" ON "Booking"("status", "holdExpiresAt");

-- CreateIndex
CREATE INDEX "Booking_status_paymentStatus_holdExpiresAt_idx" ON "Booking"("status", "paymentStatus", "holdExpiresAt");

-- CreateIndex
CREATE INDEX "Booking_unitId_checkIn_checkOut_idx" ON "Booking"("unitId", "checkIn", "checkOut");

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");

-- CreateIndex
CREATE INDEX "Booking_tenantId_idx" ON "Booking"("tenantId");

-- CreateIndex
CREATE INDEX "Booking_promoCodeId_idx" ON "Booking"("promoCodeId");

-- CreateIndex
CREATE INDEX "Booking_externalBookingRef_idx" ON "Booking"("externalBookingRef");

-- CreateIndex
CREATE INDEX "Booking_channel_idx" ON "Booking"("channel");

-- CreateIndex
CREATE INDEX "Reservation_unitId_date_idx" ON "Reservation"("unitId", "date");

-- CreateIndex
CREATE INDEX "Reservation_bookingId_idx" ON "Reservation"("bookingId");

-- CreateIndex
CREATE INDEX "Reservation_unitInventoryId_idx" ON "Reservation"("unitInventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_bookingId_date_key" ON "Reservation"("bookingId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_tenantId_idx" ON "Payment"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TourPayment_tourBookingId_key" ON "TourPayment"("tourBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "TourPayment_transactionId_key" ON "TourPayment"("transactionId");

-- CreateIndex
CREATE INDEX "TourPayment_userId_idx" ON "TourPayment"("userId");

-- CreateIndex
CREATE INDEX "TourPayment_status_idx" ON "TourPayment"("status");

-- CreateIndex
CREATE INDEX "TourPayment_tenantId_idx" ON "TourPayment"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_propertyId_createdAt_idx" ON "Review"("propertyId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "TourReview_tourBookingId_key" ON "TourReview"("tourBookingId");

-- CreateIndex
CREATE INDEX "TourReview_tourPackageId_createdAt_idx" ON "TourReview"("tourPackageId", "createdAt");

-- CreateIndex
CREATE INDEX "TourReview_userId_idx" ON "TourReview"("userId");

-- CreateIndex
CREATE INDEX "TourReview_rating_idx" ON "TourReview"("rating");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_tenantId_idx" ON "Notification"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "PromoCode_tenantId_idx" ON "PromoCode"("tenantId");

-- CreateIndex
CREATE INDEX "PromoCode_isActive_validFrom_validUntil_idx" ON "PromoCode"("isActive", "validFrom", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "CancellationPolicy_propertyId_key" ON "CancellationPolicy"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_userId_key" ON "Wishlist"("userId");

-- CreateIndex
CREATE INDEX "SearchHistory_userId_idx" ON "SearchHistory"("userId");

-- CreateIndex
CREATE INDEX "SearchHistory_city_idx" ON "SearchHistory"("city");

-- CreateIndex
CREATE INDEX "SearchHistory_createdAt_idx" ON "SearchHistory"("createdAt");

-- CreateIndex
CREATE INDEX "TenantApplication_userId_idx" ON "TenantApplication"("userId");

-- CreateIndex
CREATE INDEX "TenantApplication_status_idx" ON "TenantApplication"("status");

-- CreateIndex
CREATE INDEX "TenantApplication_country_status_idx" ON "TenantApplication"("country", "status");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_resource_resourceId_idx" ON "AuditLog"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedEvent_eventId_key" ON "ProcessedEvent"("eventId");

-- CreateIndex
CREATE INDEX "PropertyInquiry_propertyId_status_idx" ON "PropertyInquiry"("propertyId", "status");

-- CreateIndex
CREATE INDEX "PropertyInquiry_userId_idx" ON "PropertyInquiry"("userId");

-- CreateIndex
CREATE INDEX "PropertyInquiry_tenantId_idx" ON "PropertyInquiry"("tenantId");

-- CreateIndex
CREATE INDEX "PropertyInquiry_status_createdAt_idx" ON "PropertyInquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_status_idx" ON "SupportTicket"("userId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_tenantId_idx" ON "SupportTicket"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TourPackage_slug_key" ON "TourPackage"("slug");

-- CreateIndex
CREATE INDEX "TourPackage_tenantId_idx" ON "TourPackage"("tenantId");

-- CreateIndex
CREATE INDEX "TourPackage_slug_idx" ON "TourPackage"("slug");

-- CreateIndex
CREATE INDEX "TourPackage_category_idx" ON "TourPackage"("category");

-- CreateIndex
CREATE INDEX "TourPackage_isPublished_idx" ON "TourPackage"("isPublished");

-- CreateIndex
CREATE INDEX "TourPackage_isPublished_departureCity_idx" ON "TourPackage"("isPublished", "departureCity");

-- CreateIndex
CREATE INDEX "TourPackage_departureCity_idx" ON "TourPackage"("departureCity");

-- CreateIndex
CREATE INDEX "TourPackage_isDeleted_idx" ON "TourPackage"("isDeleted");

-- CreateIndex
CREATE INDEX "TourItineraryDay_tourPackageId_idx" ON "TourItineraryDay"("tourPackageId");

-- CreateIndex
CREATE INDEX "TourItineraryDay_accommodationId_idx" ON "TourItineraryDay"("accommodationId");

-- CreateIndex
CREATE UNIQUE INDEX "TourItineraryDay_tourPackageId_dayNumber_key" ON "TourItineraryDay"("tourPackageId", "dayNumber");

-- CreateIndex
CREATE INDEX "TourDeparture_tourPackageId_departureDate_idx" ON "TourDeparture"("tourPackageId", "departureDate");

-- CreateIndex
CREATE INDEX "TourDeparture_departureDate_idx" ON "TourDeparture"("departureDate");

-- CreateIndex
CREATE INDEX "TourDeparture_status_idx" ON "TourDeparture"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TourDeparture_tourPackageId_departureDate_key" ON "TourDeparture"("tourPackageId", "departureDate");

-- CreateIndex
CREATE UNIQUE INDEX "TourBooking_idempotencyKey_key" ON "TourBooking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "TourBooking_userId_status_idx" ON "TourBooking"("userId", "status");

-- CreateIndex
CREATE INDEX "TourBooking_tourPackageId_idx" ON "TourBooking"("tourPackageId");

-- CreateIndex
CREATE INDEX "TourBooking_tourDepartureId_idx" ON "TourBooking"("tourDepartureId");

-- CreateIndex
CREATE INDEX "TourBooking_tenantId_idx" ON "TourBooking"("tenantId");

-- CreateIndex
CREATE INDEX "TourBooking_status_paymentStatus_idx" ON "TourBooking"("status", "paymentStatus");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_defaultTenantId_fkey" FOREIGN KEY ("defaultTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantUser" ADD CONSTRAINT "TenantUser_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantUser" ADD CONSTRAINT "TenantUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvite" ADD CONSTRAINT "TenantInvite_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvite" ADD CONSTRAINT "TenantInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_unitTypeId_fkey" FOREIGN KEY ("unitTypeId") REFERENCES "UnitType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitType" ADD CONSTRAINT "UnitType_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitType" ADD CONSTRAINT "UnitType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAmenity" ADD CONSTRAINT "PropertyAmenity_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAmenity" ADD CONSTRAINT "PropertyAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitAmenity" ADD CONSTRAINT "UnitAmenity_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitAmenity" ADD CONSTRAINT "UnitAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitInventory" ADD CONSTRAINT "UnitInventory_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitInventory" ADD CONSTRAINT "UnitInventory_unitTypeId_fkey" FOREIGN KEY ("unitTypeId") REFERENCES "UnitType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitInventory" ADD CONSTRAINT "UnitInventory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_unitTypeId_fkey" FOREIGN KEY ("unitTypeId") REFERENCES "UnitType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_checkedInById_fkey" FOREIGN KEY ("checkedInById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_checkedOutById_fkey" FOREIGN KEY ("checkedOutById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingGuest" ADD CONSTRAINT "BookingGuest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSpecialRequest" ADD CONSTRAINT "BookingSpecialRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_unitInventoryId_fkey" FOREIGN KEY ("unitInventoryId") REFERENCES "UnitInventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourPayment" ADD CONSTRAINT "TourPayment_tourBookingId_fkey" FOREIGN KEY ("tourBookingId") REFERENCES "TourBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourPayment" ADD CONSTRAINT "TourPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourPayment" ADD CONSTRAINT "TourPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourReview" ADD CONSTRAINT "TourReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourReview" ADD CONSTRAINT "TourReview_tourPackageId_fkey" FOREIGN KEY ("tourPackageId") REFERENCES "TourPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourReview" ADD CONSTRAINT "TourReview_tourBookingId_fkey" FOREIGN KEY ("tourBookingId") REFERENCES "TourBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourReview" ADD CONSTRAINT "TourReview_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeProperty" ADD CONSTRAINT "PromoCodeProperty_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeProperty" ADD CONSTRAINT "PromoCodeProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationPolicy" ADD CONSTRAINT "CancellationPolicy_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationPolicyRule" ADD CONSTRAINT "CancellationPolicyRule_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "CancellationPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistProperty" ADD CONSTRAINT "WishlistProperty_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "Wishlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistProperty" ADD CONSTRAINT "WishlistProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantApplication" ADD CONSTRAINT "TenantApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyInquiry" ADD CONSTRAINT "PropertyInquiry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyInquiry" ADD CONSTRAINT "PropertyInquiry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyInquiry" ADD CONSTRAINT "PropertyInquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyInquiry" ADD CONSTRAINT "PropertyInquiry_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyInquiry" ADD CONSTRAINT "PropertyInquiry_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourPackage" ADD CONSTRAINT "TourPackage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourPackage" ADD CONSTRAINT "TourPackage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourItineraryDay" ADD CONSTRAINT "TourItineraryDay_tourPackageId_fkey" FOREIGN KEY ("tourPackageId") REFERENCES "TourPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourItineraryDay" ADD CONSTRAINT "TourItineraryDay_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourDeparture" ADD CONSTRAINT "TourDeparture_tourPackageId_fkey" FOREIGN KEY ("tourPackageId") REFERENCES "TourPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourBooking" ADD CONSTRAINT "TourBooking_tourPackageId_fkey" FOREIGN KEY ("tourPackageId") REFERENCES "TourPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourBooking" ADD CONSTRAINT "TourBooking_tourDepartureId_fkey" FOREIGN KEY ("tourDepartureId") REFERENCES "TourDeparture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourBooking" ADD CONSTRAINT "TourBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourBooking" ADD CONSTRAINT "TourBooking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
