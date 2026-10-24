import { prisma } from '@khan-familia/database';
import { assertTestDatabaseEnvironment } from '../../../../scripts/test-database-safety.mjs';

export const testPrisma = prisma;

export const assertTestDatabaseUrl = () => assertTestDatabaseEnvironment(process.env);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const truncateTestDatabase = async () => {
  assertTestDatabaseUrl();

  const identity = await testPrisma.$queryRaw<Array<{ database: string; role: string }>>`
    SELECT current_database() AS database, current_user AS role
  `;
  if (identity[0]?.database !== 'khan_familia_test' || identity[0]?.role !== 'khan_familia_test') {
    throw new Error(
      'Refusing cleanup: connected database/role is not the disposable test identity.',
    );
  }

  const tables = await testPrisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;

  if (tables.length === 0) {
    return;
  }

  const tableList = tables
    .map(({ tablename }) => `"public"."${tablename.replaceAll('"', '""')}"`)
    .join(', ');

  // Retry up to 3 times on deadlock (PG code 40P01) or serialization failure (40001)
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
      return;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === '40P01' || code === '40001') {
        lastError = err;
        await sleep(50 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
};

export const disconnectTestDatabase = async () => {
  await testPrisma.$disconnect();
};
