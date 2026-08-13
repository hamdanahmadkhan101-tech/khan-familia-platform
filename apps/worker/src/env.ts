import 'dotenv/config';
import { appEnvSchema, logLevelSchema, z } from '@khan-familia/validation';

const envSchema = z.object({
  // Application
  APP_ENV: appEnvSchema.default('local'),
  LOG_LEVEL: logLevelSchema.default('info'),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z
    .string()
    .optional()
    .transform((s) => {
      if (s === undefined || s === '') {
        return undefined;
      }
      if (s === 'true' || s === '1') {
        return true;
      }
      if (s === 'false' || s === '0') {
        return false;
      }
      return undefined;
    }),

  // Resend Email
  RESEND_API_KEY: z.string().optional(),

  // Stripe (for payment webhook processing if needed)
  STRIPE_SECRET_KEY: z.string().optional(),

  // Encryption
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be a 64-character hex string'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
