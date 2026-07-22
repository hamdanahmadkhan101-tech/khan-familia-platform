'use client';

import { useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createApiClient } from '@khan-familia/sdk';
import { publicEnv } from '@/lib/env';

export function useApi() {
  const { getToken } = useAuth();

  const api = useMemo(() => {
    return createApiClient({
      baseUrl: publicEnv.apiBaseUrl,
      getToken: () => getToken(),
    });
  }, [getToken]);

  return api;
}
