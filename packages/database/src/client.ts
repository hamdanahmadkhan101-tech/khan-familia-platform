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

  pool.on('error', (err) => console.error('pg Pool error:', err));

  const adapter = new PrismaPg(pool);

  prismaInstance = new PrismaClient({
    adapter,
    log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = prismaInstance;

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}
