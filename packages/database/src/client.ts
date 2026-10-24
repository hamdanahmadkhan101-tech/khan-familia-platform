import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  prismaInstance = globalForPrisma.prisma;
} else {
  const isTest = process.env['NODE_ENV'] === 'test' || process.env['APP_ENV'] === 'test';

  const pool = new Pool({
    connectionString: process.env['DATABASE_URL'],
    max: isTest ? 3 : 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Driver errors may include connection strings or query parameters.
  pool.on('error', () => console.error('Database pool connection error'));

  const adapter = new PrismaPg(pool, { disposeExternalPool: true });

  prismaInstance = new PrismaClient({
    adapter,
    // Prisma's implicit console logger can print SQL parameters and invocation payloads.
    // Applications report failures through their own safe structured error logger.
    log: [],
  });
}

export const prisma = prismaInstance;

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}
