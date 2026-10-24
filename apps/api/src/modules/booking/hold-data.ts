import { encrypt, decrypt } from '@khan-familia/utils';
import { guestDetailSchema, z } from '@khan-familia/validation';
import { env } from '../../env.js';
import { AppError } from '../../shared/errors/AppError.js';

const envelopeSchema = z
  .object({
    version: z.literal(1),
    ciphertext: z.string().min(1),
  })
  .strict();

const schemas = {
  guestDetails: z.array(guestDetailSchema),
  specialNeeds: z.array(z.string()),
};
export type HoldDataField = keyof typeof schemas;

/** Bind ciphertext to both this hold and this field; never interpret a string as plaintext. */
export const protectHoldData = (field: HoldDataField, value: unknown, holdToken: string) => {
  const parsed = schemas[field].safeParse(value);
  if (!parsed.success) throw AppError.badRequest('Invalid checkout details');
  return {
    version: 1,
    ciphertext: encrypt(
      JSON.stringify({ field, holdToken, value: parsed.data }),
      env.ENCRYPTION_KEY,
    ),
  };
};

export const readHoldData = (field: HoldDataField, value: unknown, holdToken: string) => {
  if (value === null || value === undefined) return undefined;
  try {
    const envelope = envelopeSchema.parse(value);
    const decoded: unknown = JSON.parse(decrypt(envelope.ciphertext, env.ENCRYPTION_KEY));
    const context = z
      .object({ field: z.literal(field), holdToken: z.literal(holdToken), value: z.unknown() })
      .strict()
      .parse(decoded);
    return schemas[field].parse(context.value);
  } catch {
    // Do not include ciphertext, parser diagnostics, or plaintext in the error.
    throw AppError.conflict('Checkout details unavailable; please start a new checkout');
  }
};

export const readHoldGuestDetails = (value: unknown, holdToken: string) => {
  const result = readHoldData('guestDetails', value, holdToken);
  // The field-specific schema is checked by readHoldData; preserve precise caller types.
  return result === undefined ? undefined : schemas.guestDetails.parse(result);
};
export const readHoldSpecialNeeds = (value: unknown, holdToken: string) => {
  const result = readHoldData('specialNeeds', value, holdToken);
  return result === undefined ? undefined : schemas.specialNeeds.parse(result);
};
