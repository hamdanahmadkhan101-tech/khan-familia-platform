import { prisma as sharedPrisma, type Prisma } from '@khan-familia/database';

const globalForPrisma = global as unknown as { prisma: typeof sharedPrisma };

export const prisma = globalForPrisma.prisma || sharedPrisma;

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

export type { Prisma };
