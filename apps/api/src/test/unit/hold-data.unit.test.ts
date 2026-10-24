import { describe, expect, it } from 'vitest';
import { encrypt, decrypt } from '@khan-familia/utils';
import {
  protectHoldData,
  readHoldGuestDetails,
  readHoldSpecialNeeds,
} from '../../modules/booking/hold-data.js';

const token = '11111111-1111-4111-8111-111111111111';
const guests = [
  { name: 'Test Guest', age: 30, isPrimary: true, idType: 'CNIC', idNumber: 'IDENTITY_SENTINEL' },
];

describe('temporary checkout protection', () => {
  it('encrypts the entire payload with randomized ciphertext and restores validated data', () => {
    const first = protectHoldData('guestDetails', guests, token);
    const second = protectHoldData('guestDetails', guests, token);
    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(JSON.stringify(first)).not.toContain('IDENTITY_SENTINEL');
    expect(JSON.stringify(first)).not.toContain('Test Guest');
    expect(readHoldGuestDetails(first, token)).toEqual(guests);
    const needs = protectHoldData('specialNeeds', ['MEDICAL_SENTINEL'], token);
    expect(JSON.stringify(needs)).not.toContain('MEDICAL_SENTINEL');
    expect(readHoldSpecialNeeds(needs, token)).toEqual(['MEDICAL_SENTINEL']);
  });
  it('rejects copied, tampered, unknown-version and legacy plaintext payloads', () => {
    const envelope = protectHoldData('guestDetails', guests, token);
    expect(() => readHoldGuestDetails(envelope, 'another-hold')).toThrow(
      'Checkout details unavailable',
    );
    expect(() => readHoldSpecialNeeds(envelope, token)).toThrow('Checkout details unavailable');
    expect(() =>
      readHoldGuestDetails({ ...envelope, ciphertext: `${envelope.ciphertext}ff` }, token),
    ).toThrow();
    expect(() => readHoldGuestDetails({ ...envelope, version: 2 }, token)).toThrow();
    expect(() => readHoldGuestDetails(guests, token)).toThrow();
  });
  it('accepts absent or empty payloads and rejects invalid input before encryption', () => {
    expect(readHoldGuestDetails(null, token)).toBeUndefined();
    expect(readHoldSpecialNeeds(undefined, token)).toBeUndefined();
    expect(readHoldSpecialNeeds(protectHoldData('specialNeeds', [], token), token)).toEqual([]);
    expect(() => protectHoldData('guestDetails', [{ idNumber: 'invalid' }], token)).toThrow(
      'Invalid checkout details',
    );
  });
  it('rejects malformed encryption keys and wrong-key decryption', () => {
    expect(() => encrypt('value', 'x'.repeat(64))).toThrow('Encryption key');
    expect(() => decrypt(encrypt('value', '0'.repeat(64)), '1'.repeat(64))).toThrow();
  });
});
