import { env } from '../../env.js';

/** TLS for Upstash and other cloud Redis; disable with REDIS_TLS=false. */
export const shouldUseRedisTls = (): boolean => {
  if (env.REDIS_TLS === false) {
    return false;
  }
  if (env.REDIS_TLS === true) {
    return true;
  }
  return env.REDIS_HOST.endsWith('.upstash.io');
};
