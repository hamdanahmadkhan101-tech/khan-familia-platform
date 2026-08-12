import { env } from '../../env.js';
import { encrypt as coreEncrypt, decrypt as coreDecrypt } from '@khan-familia/utils';

/**
 * Encrypts a plaintext string using AES-256-GCM and the application's environment key.
 * Returns the format `iv:authTag:encryptedData` (all hex).
 */
export const encrypt = (text: string): string => {
  if (!text) return text;
  return coreEncrypt(text, env.ENCRYPTION_KEY);
};

/**
 * Decrypts a previously encrypted string using the application's environment key.
 * Expects the format `iv:authTag:encryptedData` (all hex).
 */
export const decrypt = (text: string): string => {
  if (!text) return text;
  return coreDecrypt(text, env.ENCRYPTION_KEY);
};
