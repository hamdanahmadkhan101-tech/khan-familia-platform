import { createApiClient } from '@khan-familia/sdk';
import { publicEnv } from './env.js';

/**
 * Global API Client instance configured with the environment's base URL.
 * Safe to use in both Server Components and Client Components.
 */
export const api = createApiClient({
  baseUrl: publicEnv.apiBaseUrl,
});
