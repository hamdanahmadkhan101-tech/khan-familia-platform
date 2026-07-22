import type {
  CreateGuestHoldBody,
  HealthStatus,
  PaymentIntentResponse,
  PropertyHoldResponse,
  PublicPropertyDetails,
  PublicPropertySummary,
  UserProfile,
} from '@khan-familia/types';

export type FetchLike = typeof fetch;

/**
 * Optional async function that returns a Bearer token for authenticated requests.
 * In practice, this is Clerk's `getToken()` from `useAuth()` or `auth()`.
 */
export type GetTokenFn = () => Promise<string | null>;

export type ApiClient = {
  baseUrl: string;
  getHealth: () => Promise<HealthStatus>;
  getPublicProperties: () => Promise<PublicPropertySummary[]>;
  getPublicPropertyDetails: (slug: string) => Promise<PublicPropertyDetails>;
  /** Requires authentication. Returns the currently signed-in user's profile. */
  getMe: () => Promise<UserProfile>;
  /** Requires authentication. Places a temporary hold on inventory. */
  createGuestHold: (body: CreateGuestHoldBody) => Promise<PropertyHoldResponse>;
  /** Requires authentication. Creates a Stripe payment intent for a hold. */
  createPaymentIntent: (holdToken: string) => Promise<PaymentIntentResponse>;
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
  const apiFetch = async (path: string) => {
    const response = await fetcher(`${normalizedBaseUrl}${path}`, {
      headers: { accept: 'application/json' },
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

    async getHealth() {
      const response = await apiFetch('/health');
      const payload = await response.json();
      return payload as HealthStatus;
    },

    async getPublicProperties() {
      const response = await apiFetch('/public/properties');
      return response.json() as Promise<PublicPropertySummary[]>;
    },

    async getPublicPropertyDetails(slug: string) {
      const response = await apiFetch(`/public/properties/${slug}`);
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
      return response.json() as Promise<PropertyHoldResponse>;
    },

    async createPaymentIntent(holdToken: string) {
      const response = await authFetch('/payments/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdToken }),
      });
      return response.json() as Promise<PaymentIntentResponse>;
    },
  };
};
