import type {
  CreateGuestHoldBody,
  GuestBooking,
  GuestBookingListResponse,
  HealthStatus,
  PaymentIntentResponse,
  PropertyHoldResponse,
  PublicPropertyDetails,
  PaginatedProperties,
  UserProfile,
} from '@khan-familia/types';
import type { SubmitApplicationBody, ApplicationReviewBody } from '@khan-familia/validation';

export type FetchLike = typeof fetch;

/**
 * Optional async function that returns a Bearer token for authenticated requests.
 * In practice, this is Clerk's `getToken()` from `useAuth()` or `auth()`.
 */
export type GetTokenFn = () => Promise<string | null>;

export type ApiClient = {
  baseUrl: string;
  getHealth: (options?: Parameters<FetchLike>[1]) => Promise<HealthStatus>;
  getPublicProperties: (options?: Parameters<FetchLike>[1]) => Promise<PaginatedProperties>;
  /** Requires authentication. Returns the tenant's properties. */
  getTenantProperties: (options?: Parameters<FetchLike>[1]) => Promise<PaginatedProperties>;
  /** Requires authentication. Adds an image to a property. */
  addPropertyImage: (
    propertyId: string,
    url: string,
    publicId: string,
    options?: Parameters<FetchLike>[1],
  ) => Promise<unknown>;
  /** Requires authentication. Generates a secure upload signature. */
  getUploadSignature: (
    paramsToSign: Record<string, unknown>,
    options?: Parameters<FetchLike>[1],
  ) => Promise<{ signature: string; timestamp: number }>;
  getPublicPropertyDetails: (
    slug: string,
    options?: Parameters<FetchLike>[1],
  ) => Promise<PublicPropertyDetails>;
  /** Requires authentication. Returns the currently signed-in user's profile. */
  getMe: () => Promise<UserProfile>;
  /** Requires authentication. Places a temporary hold on inventory. */
  createGuestHold: (body: CreateGuestHoldBody) => Promise<PropertyHoldResponse>;
  /** Requires authentication. Creates a Stripe payment intent for a hold. */
  createPaymentIntent: (
    holdToken: string,
    guestDetails?: Record<string, unknown>[],
    specialNeeds?: string[],
    options?: Parameters<FetchLike>[1],
  ) => Promise<PaymentIntentResponse>;
  /** Requires authentication. Synchronously verifies a Stripe payment and returns the confirmed booking. */
  confirmPaymentIntent: (
    paymentIntentId: string,
  ) => Promise<{ message: string; booking: GuestBooking }>;
  /** Requires authentication. Gets the status of a hold. */
  getHoldStatus: (
    holdToken: string,
    options?: Parameters<FetchLike>[1],
  ) => Promise<PropertyHoldResponse>;
  releaseGuestHold: (
    holdToken: string,
    options?: Parameters<FetchLike>[1],
  ) => Promise<{ message: string }>;
  /** Requires authentication. Lists the authenticated guest's bookings. */
  listGuestBookings: (query?: {
    scope?: 'upcoming' | 'past' | 'cancelled' | 'all';
    limit?: number;
    offset?: number;
  }) => Promise<GuestBookingListResponse>;

  /** Requires authentication. Submits a new vendor application. */
  submitApplication: (
    body: SubmitApplicationBody,
    options?: Parameters<FetchLike>[1],
  ) => Promise<unknown>;
  /** Requires authentication. Gets the status of the current user's application. */
  getMyApplicationStatus: (options?: Parameters<FetchLike>[1]) => Promise<{ application: unknown }>;

  /** Requires super admin. Gets pending applications. */
  getPendingApplications: (
    options?: Parameters<FetchLike>[1],
  ) => Promise<{ applications: unknown[] }>;
  /** Requires super admin. Approves an application. */
  approveApplication: (
    applicationId: string,
    body?: ApplicationReviewBody,
    options?: Parameters<FetchLike>[1],
  ) => Promise<unknown>;
  /** Requires super admin. Rejects an application. */
  rejectApplication: (
    applicationId: string,
    body?: ApplicationReviewBody,
    options?: Parameters<FetchLike>[1],
  ) => Promise<unknown>;
};

export type CreateApiClientOptions = {
  baseUrl: string;
  fetcher?: FetchLike;
  /**
   * Optional async function to retrieve the auth token on each authenticated request.
   * If omitted, authenticated endpoints will fail with 401.
   */
  getToken?: GetTokenFn;
};

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');

export const createApiClient = ({
  baseUrl,
  fetcher = globalThis.fetch,
  getToken,
}: CreateApiClientOptions): ApiClient => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  /** Unauthenticated fetch — for public endpoints */
  const apiFetch = async (path: string, options?: Parameters<FetchLike>[1]) => {
    const response = await fetcher(`${normalizedBaseUrl}${path}`, {
      ...options,
      headers: {
        accept: 'application/json',
        ...(options?.headers as Record<string, string>),
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response;
  };

  /** Authenticated fetch — automatically attaches Bearer token */
  const authFetch = async (path: string, options?: Parameters<FetchLike>[1]) => {
    const token = getToken ? await getToken() : null;

    const headers: Record<string, string> = {
      accept: 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetcher(`${normalizedBaseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Request failed with status ${response.status}: ${errBody}`);
    }

    return response;
  };

  return {
    baseUrl: normalizedBaseUrl,

    async getHealth(options?: Parameters<FetchLike>[1]) {
      const response = await apiFetch('/health', options);
      const payload: unknown = await response.json();
      return payload as HealthStatus;
    },

    async getPublicProperties(options?: Parameters<FetchLike>[1]) {
      try {
        const response = await apiFetch('/public/properties', options);
        return (await response.json()) as PaginatedProperties;
      } catch (error) {
        console.error('API client error (getPublicProperties):', error);
        // Fallback for graceful degradation in UI
        return { properties: [], total: 0, page: 1, limit: 20 };
      }
    },

    async getTenantProperties(options?: Parameters<FetchLike>[1]) {
      const response = await apiFetch('/properties', options);
      return (await response.json()) as PaginatedProperties;
    },

    async addPropertyImage(
      propertyId: string,
      url: string,
      publicId: string,
      options?: Parameters<FetchLike>[1],
    ) {
      const response = await apiFetch(`/properties/${propertyId}/images`, {
        ...options,
        method: 'POST',
        body: JSON.stringify({ url, publicId }),
      });
      const payload: unknown = await response.json();
      return payload;
    },

    async getUploadSignature(
      paramsToSign: Record<string, unknown>,
      options?: Parameters<FetchLike>[1],
    ) {
      const response = await apiFetch('/upload/signature', {
        ...options,
        method: 'POST',
        body: JSON.stringify(paramsToSign),
      });
      if (!response.ok) throw new Error('Failed to fetch signature');
      return response.json() as Promise<{ signature: string; timestamp: number }>;
    },

    async getPublicPropertyDetails(slug: string, options?: Parameters<FetchLike>[1]) {
      const response = await apiFetch(`/public/properties/${slug}`, options);
      return response.json() as Promise<PublicPropertyDetails>;
    },

    async getMe() {
      const response = await authFetch('/iam/me');
      return response.json() as Promise<UserProfile>;
    },

    async createGuestHold(body: CreateGuestHoldBody) {
      const response = await authFetch('/bookings/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { message?: string };
        throw new Error(errorData?.message || 'Failed to create hold');
      }

      return (await response.json()) as PropertyHoldResponse;
    },

    async createPaymentIntent(
      holdToken: string,
      guestDetails?: Record<string, unknown>[],
      specialNeeds?: string[],
      options?: Parameters<FetchLike>[1],
    ) {
      const response = await authFetch('/payments/intent', {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers as Record<string, string>),
        },
        body: JSON.stringify({ holdToken, guestDetails, specialNeeds }),
      });
      return response.json() as Promise<PaymentIntentResponse>;
    },

    async confirmPaymentIntent(paymentIntentId: string) {
      const response = await authFetch('/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId }),
      });
      return response.json() as Promise<{ message: string; booking: GuestBooking }>;
    },

    async getHoldStatus(holdToken: string, options?: Parameters<FetchLike>[1]) {
      const response = await authFetch(`/bookings/holds/${holdToken}`, options);
      return response.json() as Promise<PropertyHoldResponse>;
    },

    async releaseGuestHold(holdToken: string, options?: Parameters<FetchLike>[1]) {
      const response = await authFetch(`/bookings/holds/${holdToken}`, {
        ...options,
        method: 'DELETE',
      });
      return response.json() as Promise<{ message: string }>;
    },

    async listGuestBookings(query = {}) {
      const params = new URLSearchParams();
      if (query.scope) params.set('scope', query.scope);
      if (query.limit !== undefined) params.set('limit', String(query.limit));
      if (query.offset !== undefined) params.set('offset', String(query.offset));
      const qs = params.toString();
      const response = await authFetch(`/bookings/me${qs ? `?${qs}` : ''}`);
      return response.json() as Promise<GuestBookingListResponse>;
    },

    async submitApplication(body, options) {
      const response = await authFetch('/tenants/applications', {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers as Record<string, string>),
        },
        body: JSON.stringify(body),
      });
      const payload: unknown = await response.json();
      return payload;
    },

    async getMyApplicationStatus(options) {
      const response = await authFetch('/tenants/applications/my-status', options);
      return response.json() as Promise<{ application: unknown }>;
    },

    async getPendingApplications(options) {
      const response = await authFetch('/admin/applications/pending', options);
      return response.json() as Promise<{ applications: unknown[] }>;
    },

    async approveApplication(applicationId, body, options) {
      const response = await authFetch(`/admin/applications/${applicationId}/approve`, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers as Record<string, string>),
        },
        body: JSON.stringify(body || {}),
      });
      const payload: unknown = await response.json();
      return payload;
    },

    async rejectApplication(applicationId, body, options) {
      const response = await authFetch(`/admin/applications/${applicationId}/reject`, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers as Record<string, string>),
        },
        body: JSON.stringify(body || {}),
      });
      const payload: unknown = await response.json();
      return payload;
    },
  };
};
