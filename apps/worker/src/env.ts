import 'dotenv/config';
import { appEnvSchema, logLevelSchema, serviceNameSchema, z } from '@khan-familia/validation';

const envSchema = z.object({
  APP_ENV: appEnvSchema.default('local'),
  LOG_LEVEL: logLevelSchema.default('info'),
  WORKER_NAME: serviceNameSchema.default('worker'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
