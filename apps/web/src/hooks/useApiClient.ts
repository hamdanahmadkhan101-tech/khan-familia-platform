import { useAuth } from '@clerk/nextjs';
import { useMemo } from 'react';
import { createApiClient } from '@khan-familia/sdk';
import { publicEnv } from '@/lib/env';

/**
 * React hook that creates an authenticated API Client for Client Components.
 * Automatically attaches the Clerk token to requests.
 */
export function useApiClient() {
  const { getToken } = useAuth();

  const apiClient = useMemo(() => {
    return createApiClient({
      baseUrl: publicEnv.apiBaseUrl,
      getToken: async () => await getToken(),
    });
  }, [getToken]);

  return apiClient;
}
