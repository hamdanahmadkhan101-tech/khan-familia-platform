import { prisma } from '@khan-familia/database';

const TEST_DATABASE_HINTS = ['test', 'testing', 'ci'];
const TEST_DATABASE_CONFIRMATION_FLAG = 'TEST_DATABASE_CONFIRM';

export const testPrisma = prisma;

export const assertTestDatabaseUrl = () => {
  if (process.env['APP_ENV'] !== 'test') {
    throw new Error('Refusing to run database tests unless APP_ENV=test.');
  }

  const databaseUrl = process.env['DATABASE_URL'];

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for database tests.');
  }

  const normalizedUrl = databaseUrl.toLowerCase();
  const isClearlyTestDatabase = TEST_DATABASE_HINTS.some((hint) => normalizedUrl.includes(hint));
  const isExplicitlyConfirmedTestDatabase = process.env[TEST_DATABASE_CONFIRMATION_FLAG] === 'true';

  if (!isClearlyTestDatabase && !isExplicitlyConfirmedTestDatabase) {
    throw new Error(
      'Refusing to run database tests because DATABASE_URL does not look like a test database. Include "test", "testing", or "ci" in the database name, Neon branch, or host, or set TEST_DATABASE_CONFIRM=true for an isolated test database.',
    );
  }
};

export const truncateTestDatabase = async () => {
  assertTestDatabaseUrl();

  const tables = await testPrisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;

  if (tables.length === 0) {
    return;
  }

  const tableList = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ');
  await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
};

export const disconnectTestDatabase = async () => {
  await testPrisma.$disconnect();
};
