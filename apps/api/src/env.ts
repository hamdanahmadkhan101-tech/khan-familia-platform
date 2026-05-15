import 'dotenv/config';
import { appEnvSchema, logLevelSchema, z } from '@khan-familia/validation';

const envSchema = z.object({
  APP_ENV: appEnvSchema.default('local'),
  LOG_LEVEL: logLevelSchema.default('info'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
