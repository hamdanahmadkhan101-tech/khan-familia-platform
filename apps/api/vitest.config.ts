import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, '../..');

export default defineConfig({
  resolve: {
    alias: {
      '@khan-familia/validation': path.join(repoRoot, 'packages/validation/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include:
      process.env['API_TEST_SUITE'] === 'integration'
        ? ['src/test/integration/**/*.test.ts', 'src/test/flows/**/*.test.ts']
        : ['src/test/unit/**/*.test.ts', 'src/test/smoke/**/*.test.ts'],
    passWithNoTests: false,
    fileParallelism: false,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    setupFiles: ['./src/test/setup-env.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    clearMocks: true,
    restoreMocks: true,
  },
});
