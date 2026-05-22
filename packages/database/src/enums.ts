/**
 * Re-export Prisma enums for consumers of @khan-familia/database.
 * Kept in a dedicated module so IDE/tsc reliably see all enum exports.
 */
export {
  AccommodationBookingStatus,
  BookingChannel,
  BookingType,
  BusinessVertical,
  PaymentStatus,
  PlatformRole,
  PropertyApprovalStatus,
  PropertyCategory,
  PropertyType,
  TenantInviteStatus,
  TenantRole,
  TenantStatus,
  TenantUserStatus,
  UserStatus,
} from '@prisma/client';
