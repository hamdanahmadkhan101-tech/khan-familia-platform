import type { Prisma } from '@khan-familia/database';
import { applicationDocumentSchema } from '@khan-familia/validation';

/** Compatibility boundary for seeded/old JSON. Never treat arbitrary URLs as private assets. */
export const documentReferences = (value: Prisma.JsonValue) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const parsed = applicationDocumentSchema.safeParse(item);
    return parsed.success ? parsed.data : { type: 'LEGACY_DOCUMENT', unavailable: true };
  });
};
