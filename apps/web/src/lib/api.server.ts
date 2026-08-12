import { createApiClient } from '@khan-familia/sdk';
import { auth } from '@clerk/nextjs/server';
import { publicEnv } from './env.js';

/**
 * Creates an API Client for Server Components that automatically attaches
 * the Clerk authentication token to requests.
 */
export const getServerApiClient = async () => {
  const { getToken } = await auth();
  return createApiClient({
    baseUrl: publicEnv.apiBaseUrl,
    getToken: async () => await getToken(),
  });
};
