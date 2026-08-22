import type { ConnectionOptions } from 'bullmq';
import type { Redis as RedisType } from 'ioredis';
import { Redis } from 'ioredis';

import { env } from '../../env.js';
import { shouldUseRedisTls } from './redis-tls.js';
import { logger } from '../../logger.js';

const globalForRedis = global as unknown as { redis: RedisType };

const tlsOptions = shouldUseRedisTls() ? { tls: {} } : {};

const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  username: 'default',
  lazyConnect: false,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  maxRetriesPerRequest: 3,
  ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
  ...tlsOptions,
};

export const redis: RedisType = globalForRedis.redis || new Redis(redisConfig);

redis.on('error', (err: Error) => {
  logger.error({ err }, 'Redis connection error');
});

if (process.env['NODE_ENV'] !== 'production') globalForRedis.redis = redis;

export const getBullMqConnectionOptions = (): ConnectionOptions => ({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  username: 'default',
  maxRetriesPerRequest: null,
  ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
  ...tlsOptions,
});

export type { RedisType as Redis };
