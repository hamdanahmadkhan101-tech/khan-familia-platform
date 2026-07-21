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
