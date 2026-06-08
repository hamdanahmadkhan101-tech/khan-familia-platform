import { Buffer } from 'buffer';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a colon-separated string: "iv:authTag:ciphertext" encoded in hex.
 *
 * @param plaintext The string to encrypt (e.g. government ID).
 * @param keyHex The encryption key as a 64-character hex string (32 bytes).
 */
export const encrypt = (plaintext: string, keyHex: string): string => {
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('Encryption key must be a 32-byte hex string (64 characters)');
  }

  const key = Buffer.from(keyHex, 'hex');
  const iv = randomBytes(12); // 12 bytes is standard for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts a ciphertext string formatted as "iv:authTag:encryptedText" using AES-256-GCM.
 *
 * @param encryptedPayload The format string returned by encrypt().
 * @param keyHex The encryption key as a 64-character hex string (32 bytes).
 */
export const decrypt = (encryptedPayload: string, keyHex: string): string => {
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('Encryption key must be a 32-byte hex string (64 characters)');
  }

  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format. Expected iv:authTag:ciphertext');
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error('Invalid encrypted payload parts');
  }

  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};
