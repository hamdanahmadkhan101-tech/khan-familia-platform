import { afterAll, vi } from 'vitest';
import { createApiTestEnvironment } from '../../../../scripts/test-environment.mjs';
import { assertTestDatabaseEnvironment } from '../../../../scripts/test-database-safety.mjs';

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
const suite = process.env['API_TEST_SUITE'] ?? 'unit';
Object.assign(process.env, createApiTestEnvironment(process.env, suite));
if (suite === 'integration') {
  assertTestDatabaseEnvironment(process.env);
  afterAll(async () => {
    const { prisma } = await import('@khan-familia/database');
    await prisma.$disconnect();
  });
}
