import { env } from '../../env.js';

export const shouldUseRedisTls = (): boolean => {
  if (env.REDIS_TLS === false) {
    return false;
  }
  if (env.REDIS_TLS === true) {
    return true;
  }
  return env.REDIS_HOST.endsWith('.upstash.io');
};
