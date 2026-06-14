import crypto from 'node:crypto';
import { redis } from './redis.js';

const DEFAULT_LOCK_EXPIRY = 30; // seconds
const DEFAULT_LOCK_TIMEOUT = 5000; // milliseconds

export interface LockOptions {
  expirySeconds?: number;
  timeoutMs?: number;
  retries?: number;
}

/**
 * Acquire a distributed lock using Redis SET NX with expiry.
 * Returns a unique token on success, null if lock acquisition failed.
 */
export const acquireLock = async (
  key: string,
  options: LockOptions = {},
): Promise<string | null> => {
  const { expirySeconds = DEFAULT_LOCK_EXPIRY, retries = 1 } = options;
  const token = crypto.randomUUID();

  for (let i = 0; i < retries; i++) {
    const result = await redis.set(key, token, 'EX', expirySeconds, 'NX');
    if (result === 'OK') {
      return token;
    }

    if (i < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return null;
};

/**
 * Release a distributed lock. Only succeeds if the token matches.
 */
export const releaseLock = async (key: string, token: string): Promise<boolean> => {
  const lua = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `;

  const result = await redis.eval(lua, 1, key, token);
  return Boolean(result);
};

/**
 * Execute a callback with an acquired lock. Releases lock on completion or error.
 */
export const withLock = async <T>(
  key: string,
  callback: () => Promise<T>,
  options: LockOptions = {},
): Promise<T> => {
  const { timeoutMs = DEFAULT_LOCK_TIMEOUT } = options;
  const token = await acquireLock(key, options);

  if (!token) {
    throw new Error(`Failed to acquire lock: ${key}`);
  }

  try {
    return await Promise.race([
      callback(),
      new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error(`Lock operation timeout: ${key}`)), timeoutMs),
      ),
    ]);
  } finally {
    await releaseLock(key, token);
  }
};
