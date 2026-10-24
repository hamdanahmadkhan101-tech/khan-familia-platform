import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createApiTestEnvironment } from './test-environment.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiRoot = path.join(repoRoot, 'apps/api');
const mode = process.argv[2] ?? 'unit';
if (!['unit', 'integration', 'migrate'].includes(mode)) {
  throw new Error('Expected unit, integration, or migrate.');
}
const environment = createApiTestEnvironment(
  process.env,
  mode === 'migrate' ? 'integration' : mode,
);
const databaseRequire = createRequire(path.join(repoRoot, 'packages/database/package.json'));

if (mode !== 'unit') {
  // Verify actual database identity before migrations or the first fixture write.
  const { Pool } = databaseRequire('pg');
  const pool = new Pool({
    connectionString: environment['DATABASE_URL'],
    connectionTimeoutMillis: 5000,
  });
  try {
    const result = await pool.query('SELECT current_database() AS database, current_user AS role');
    if (
      result.rows[0]?.database !== 'khan_familia_test' ||
      result.rows[0]?.role !== 'khan_familia_test'
    ) {
      throw new Error('The connected database/role does not match the disposable test identity.');
    }
  } finally {
    await pool.end();
  }
}

const requireTool =
  mode === 'migrate' ? databaseRequire : createRequire(path.join(repoRoot, 'package.json'));
const entry = requireTool.resolve(
  mode === 'migrate' ? 'prisma/build/index.js' : 'vitest/vitest.mjs',
);
const args =
  mode === 'migrate'
    ? ['migrate', 'deploy']
    : [
        ...(process.argv.slice(3).includes('--watch') ? [] : ['run']),
        '--config',
        'vitest.config.ts',
        ...process.argv.slice(3),
      ];
const result = spawnSync(process.execPath, [entry, ...args], {
  cwd: mode === 'migrate' ? path.join(repoRoot, 'packages/database') : apiRoot,
  env: environment,
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
