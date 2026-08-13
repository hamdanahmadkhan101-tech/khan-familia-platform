import 'dotenv/config';
import { SERVICE_NAMES } from '@khan-familia/constants';
import { appEnvSchema, logLevelSchema, z } from '@khan-familia/validation';

const parseBooleanEnv = (value: string | undefined) => {
  if (value === undefined || value.trim().length === 0) {
    return false;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === 'true' || normalized === '1') {
    return true;
  }

  if (normalized === 'false' || normalized === '0') {
    return false;
  }

  throw new Error(`Invalid boolean environment value: ${value}`);
};

const envSchema = z.object({
  // Application
  APP_ENV: appEnvSchema.default('local'),
  LOG_LEVEL: logLevelSchema.default('info'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),

  // HTTP
  CORS_ORIGIN: z.string().url().optional(),
  CORS_ORIGINS: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  // Observability
  OTEL_ENABLED: z.string().optional().transform(parseBooleanEnv),
  OTEL_SERVICE_NAME: z.string().default(SERVICE_NAMES.api),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().default('http://localhost:4318'),
  OTEL_METRICS_EXPORT_INTERVAL_MS: z.coerce.number().int().positive().default(10_000),
  OTEL_DIAGNOSTICS: z.string().optional().transform(parseBooleanEnv),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis (TLS auto-enabled for *.upstash.io unless REDIS_TLS=false)
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

  // Clerk Authentication
  CLERK_SECRET_KEY: z.string(),
  CLERK_PUBLISHABLE_KEY: z.string(),
  /** Signing secret from Clerk Dashboard → Webhooks → your endpoint (whsec_...) */
  CLERK_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Stripe Payments
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET must be set'),

  // Encryption
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be a 64-character hex string'),

  // Cloudinary Storage
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),

  // Reserved for future Svix-backed integrations (optional)
  SVIX_API_KEY: z.string().optional(),

  // Resend Email
  RESEND_API_KEY: z.string(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
