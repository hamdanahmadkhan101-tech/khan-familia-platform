export type AppEnv = 'local' | 'development' | 'staging' | 'production' | 'test';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type ServiceName = 'web' | 'api' | 'worker';

export * from './jobs.js';

export type HealthStatus = {
  status: 'ok';
  service: ServiceName;
  timestamp: string;
};

export type ApiErrorPayload = {
  message: string;
  requestId?: string;
};

// ---------------------------------------------------------------------------
// Public Catalog Types — used by the SDK and frontend (no auth required)
// ---------------------------------------------------------------------------

export type PropertyImage = {
  url: string;
  publicId?: string;
  isPrimary?: boolean;
};

/** Shape returned by GET /public/properties (list card) */
export type PublicPropertySummary = {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  starRating: number | null;
  minPricePerNight: number | null;
  averageRating: number;
  totalReviews: number;
  images: PropertyImage[];
  propertyType: string | null;
  propertyCategory: string | null;
};

export type PublicUnitType = {
  id: string;
  name: string;
  unitCount: number;
  capacity: number;
  description: string | null;
  images: PropertyImage[] | null;
  defaultRate: number | null;
};

/** Flattened amenity — backend maps join table away, so frontend gets this directly */
export type PublicAmenity = {
  id: string;
  name: string;
  icon: string | null;
  category: string;
  isPopular: boolean;
};

export type PublicLocation = {
  lat: number | null;
  lng: number | null;
  state: string | null;
  zipCode: string | null;
};

/** Shape returned by GET /public/properties/:slug (detail page) */
export type PublicPropertyDetails = PublicPropertySummary & {
  description: string;
  address: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  languages: string[];
  houseRules: Record<string, unknown> | null;
  location: PublicLocation | null;
  amenities: PublicAmenity[];
  unitTypes: PublicUnitType[];
};

// ---------------------------------------------------------------------------
// IAM / Auth Types
// ---------------------------------------------------------------------------

/** Shape returned by GET /iam/me (authenticated user profile) */
export type UserProfile = {
  id: string;
  clerkId: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  role: string;
  status: string;
  defaultTenantId: string | null;
  preferredCurrency: string | null;
  preferredLanguage: string | null;
  preferredTimezone: string | null;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Booking & Payments Types
// ---------------------------------------------------------------------------

export type PropertyHoldResponse = {
  holdToken: string;
  expiresAt: string;
};

export type PaymentIntentResponse = {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  expiresAt: string;
};

export type CreateGuestHoldBody = {
  propertyId: string;
  unitTypeId: string;
  startDate: string;
  endDate: string;
  quantity: number;
};

// ---------------------------------------------------------------------------
// Guest Dashboard — Booking list / detail types
// ---------------------------------------------------------------------------

export type BookingStatus =
  | 'PENDING'
  | 'BOOKED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'NO_SHOW';

export type BookingPriceSnapshot = {
  id: string;
  currency: string;
  totalMinor: number;
  breakdown: Record<string, number>;
  createdAt: string;
};

export type GuestBookingProperty = {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  address: string | null;
  images: PropertyImage[];
  checkInTime: string | null;
  checkOutTime: string | null;
  timezone: string | null;
};

export type GuestBookingUnitType = {
  id: string;
  name: string;
  capacity: number;
  defaultRate: number | null;
  images: PropertyImage[] | null;
};

/** Shape returned by GET /bookings/me and GET /bookings/:id */
export type GuestBooking = {
  id: string;
  userId: string;
  tenantId: string;
  propertyId: string;
  unitTypeId: string | null;
  channel: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  status: BookingStatus;
  confirmedAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  cancellationReason: string | null;
  cancellationDate: string | null;
  refundAmount: number | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  property: GuestBookingProperty;
  unitType: GuestBookingUnitType | null;
  BookingPriceSnapshot: BookingPriceSnapshot | null;
};

export type GuestBookingListResponse = {
  bookings: GuestBooking[];
};

export type GuestBookingDetailResponse = {
  booking: GuestBooking;
};
