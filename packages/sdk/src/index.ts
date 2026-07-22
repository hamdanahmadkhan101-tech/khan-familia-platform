import { healthStatusSchema } from '@khan-familia/validation';
import type {
  HealthStatus,
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
  const authFetch = async (path: string) => {
    const token = getToken ? await getToken() : null;

    const headers: Record<string, string> = { accept: 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetcher(`${normalizedBaseUrl}${path}`, { headers });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response;
  };

  return {
    baseUrl: normalizedBaseUrl,

    async getHealth() {
      const response = await apiFetch('/health');
      const payload = await response.json();
      return healthStatusSchema.parse(payload);
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
  };
};
