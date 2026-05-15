import { createApiClient } from '@khan-familia/sdk';

import { publicEnv } from '@/lib/env';

export const healthClient = createApiClient({ baseUrl: publicEnv.apiBaseUrl });

export const healthUrl = `${healthClient.baseUrl}/health`;
