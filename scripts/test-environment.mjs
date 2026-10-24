import {
  assertIsolatedTestDatabaseUrl,
  DEFAULT_TEST_DATABASE_URL,
} from './test-database-safety.mjs';

export const createApiTestEnvironment = (inherited, suite) => {
  if (!['unit', 'integration'].includes(suite)) {
    throw new Error('API_TEST_SUITE must be unit or integration.');
  }
  if (suite === 'integration' && inherited['RUN_DB_TESTS'] === 'false') {
    throw new Error('RUN_DB_TESTS=false explicitly disables integration tests.');
  }

  const target =
    suite === 'integration'
      ? assertIsolatedTestDatabaseUrl(inherited['TEST_DATABASE_URL'] ?? DEFAULT_TEST_DATABASE_URL)
      : DEFAULT_TEST_DATABASE_URL;

  return {
    ...inherited,
    API_TEST_SUITE: suite,
    APP_ENV: 'test',
    NODE_ENV: 'test',
    RUN_DB_TESTS: suite === 'integration' ? 'true' : 'false',
    TEST_DATABASE_URL: target,
    // No unit/smoke test should ever connect to a database, even by accident.
    DATABASE_URL:
      suite === 'integration'
        ? target
        : 'postgresql://khan_familia_test:khan_familia_test@127.0.0.1:1/khan_familia_test',
    // Prevent app-level dotenv/config from reading a developer's .env files.
    DOTENV_CONFIG_PATH: '/dev/null',
    DOTENV_CONFIG_OVERRIDE: 'false',
    LOG_LEVEL: 'error',
    PORT: '3001',
    CORS_ORIGIN: 'http://localhost:3000',
    CORS_ORIGINS: '',
    RATE_LIMIT_WINDOW_MS: '60000',
    RATE_LIMIT_MAX: '100000',
    OTEL_ENABLED: 'false',
    OTEL_DIAGNOSTICS: 'false',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
    OTEL_METRICS_EXPORT_INTERVAL_MS: '10000',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: inherited['TEST_REDIS_PORT'] ?? '56379',
    REDIS_PASSWORD: '',
    REDIS_TLS: 'false',
    CLERK_SECRET_KEY: 'sk_test_placeholder',
    CLERK_PUBLISHABLE_KEY: 'pk_test_placeholder',
    CLERK_WEBHOOK_SECRET: 'whsec_test_placeholder',
    STRIPE_SECRET_KEY: 'sk_test_placeholder',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_placeholder',
    CLOUDINARY_CLOUD_NAME: 'test-cloud',
    CLOUDINARY_API_KEY: 'test-key',
    CLOUDINARY_API_SECRET: 'test-secret',
    CLOUDINARY_PHOTO_UPLOAD_PRESET: 'khan_familia_property_photos',
    CLOUDINARY_DOCUMENT_UPLOAD_PRESET: 'khan_familia_application_documents',
    RESEND_API_KEY: 're_test_placeholder',
    ENCRYPTION_KEY: '0'.repeat(64),
  };
};
