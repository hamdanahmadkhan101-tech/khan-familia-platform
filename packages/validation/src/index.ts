import { z } from 'zod';

import { APP_ENV_VALUES, LOG_LEVEL_VALUES, SERVICE_NAME_VALUES } from '@khan-familia/constants';
import type { HealthStatus } from '@khan-familia/types';

export { z };

export const appEnvSchema = z.enum(APP_ENV_VALUES);
export const logLevelSchema = z.enum(LOG_LEVEL_VALUES);
export const serviceNameSchema = z.enum(SERVICE_NAME_VALUES);

export const healthStatusSchema: z.ZodType<HealthStatus> = z.object({
  status: z.literal('ok'),
  service: serviceNameSchema,
  timestamp: z.string(),
});
