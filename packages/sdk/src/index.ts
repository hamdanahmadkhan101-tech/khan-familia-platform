import { healthStatusSchema } from '@khan-familia/validation';
import type { HealthStatus } from '@khan-familia/types';

export type FetchLike = typeof fetch;

export type ApiClient = {
  baseUrl: string;
  getHealth: () => Promise<HealthStatus>;
};

export type CreateApiClientOptions = {
  baseUrl: string;
  fetcher?: FetchLike;
};

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');

export const createApiClient = ({
  baseUrl,
  fetcher = globalThis.fetch,
}: CreateApiClientOptions): ApiClient => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  const apiFetch = async (path: string) => {
    const response = await fetcher(`${normalizedBaseUrl}${path}`, {
      headers: { accept: 'application/json' },
    });

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
  };
};
