import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { vi } from 'vitest';

vi.mock('bullmq', () => {
  class MockQueue {
    add = vi.fn().mockResolvedValue({ id: 'mock-job-id' });
    close = vi.fn().mockResolvedValue(undefined);
  }
  class MockWorker {
    on = vi.fn();
    close = vi.fn().mockResolvedValue(undefined);
  }
  return { Queue: MockQueue, Worker: MockWorker };
});

vi.mock('ioredis', () => {
  const MockRedis = vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    quit: vi.fn(),
    disconnect: vi.fn(),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
  }));
  return {
    Redis: MockRedis,
    default: MockRedis,
  };
});
const dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(dirname, '../..');

config({ path: path.join(apiRoot, '.env.test.local'), override: true });
config({ path: path.join(apiRoot, '.env.test'), override: false });

const setDefaultEnv = (key: string, value: string) => {
  process.env[key] ??= value;
};

setDefaultEnv('APP_ENV', 'test');
if (process.env['APP_ENV'] === 'test' && process.env['NODE_ENV'] === 'development') {
  process.env['NODE_ENV'] = 'production';
}
setDefaultEnv('NODE_ENV', 'production');
if (process.env['LOG_LEVEL'] === 'silent') {
  process.env['LOG_LEVEL'] = 'error';
}
setDefaultEnv('LOG_LEVEL', 'error');
setDefaultEnv('PORT', '3001');
setDefaultEnv('RATE_LIMIT_WINDOW_MS', '60000');
setDefaultEnv('RATE_LIMIT_MAX', '100000');
setDefaultEnv('OTEL_ENABLED', 'false');
setDefaultEnv('OTEL_DIAGNOSTICS', 'false');
setDefaultEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
setDefaultEnv('OTEL_METRICS_EXPORT_INTERVAL_MS', '10000');
setDefaultEnv('REDIS_HOST', 'localhost');
setDefaultEnv('REDIS_PORT', '6379');
setDefaultEnv('CLERK_SECRET_KEY', 'sk_test_placeholder');
setDefaultEnv('CLERK_PUBLISHABLE_KEY', 'pk_test_placeholder');
setDefaultEnv('STRIPE_SECRET_KEY', 'sk_test_placeholder');
setDefaultEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test_placeholder');
setDefaultEnv('CLOUDINARY_CLOUD_NAME', 'test-cloud');
setDefaultEnv('CLOUDINARY_API_KEY', 'test-key');
setDefaultEnv('CLOUDINARY_API_SECRET', 'test-secret');
setDefaultEnv('RESEND_API_KEY', 're_test_placeholder');
setDefaultEnv('ENCRYPTION_KEY', '0000000000000000000000000000000000000000000000000000000000000000');
setDefaultEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/khan_familia_test');
