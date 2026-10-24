import type { UploadIntent } from '@khan-familia/types';
import { z } from 'zod';

export const createUploadBodySchema = z.discriminatedUnion('purpose', [
  z.object({ purpose: z.literal('PROPERTY_PHOTO'), propertyId: z.string().cuid() }).strict(),
  z.object({ purpose: z.literal('APPLICATION_DOCUMENT') }).strict(),
]) satisfies z.ZodType<UploadIntent>;
export const uploadIdParamsSchema = z.object({ uploadId: z.string().cuid() });
export const applicationDocumentSchema = z
  .object({
    uploadId: z.string().cuid(),
    type: z.string().trim().min(1).max(80),
  })
  .strict();
export type CreateUploadBody = z.infer<typeof createUploadBodySchema>;
