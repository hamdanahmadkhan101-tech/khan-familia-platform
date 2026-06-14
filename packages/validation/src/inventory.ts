import { z } from 'zod';

export const getAvailabilityQuerySchema = z
  .object({
    startDate: z.string().date(),
    endDate: z.string().date(),
    unitTypeId: z.string().cuid().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: 'endDate must be greater than or equal to startDate',
      path: ['endDate'],
    },
  );

export type GetAvailabilityQuery = z.infer<typeof getAvailabilityQuerySchema>;

const baseDateRangeSchema = z
  .object({
    unitTypeId: z.string().cuid(),
    startDate: z.string().date(),
    endDate: z.string().date(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: 'endDate must be greater than or equal to startDate',
      path: ['endDate'],
    },
  );

export const blockInventoryBodySchema = baseDateRangeSchema.and(
  z.object({
    blockCount: z.number().int().min(1).default(1),
    reason: z.string().trim().max(500).optional(),
  }),
);

export const unblockInventoryBodySchema = baseDateRangeSchema.and(
  z.object({
    unblockCount: z.number().int().min(1).default(1),
  }),
);

export const setPricingBodySchema = baseDateRangeSchema.and(
  z.object({
    priceOverride: z.number().int().min(0).nullable(),
  }),
);

export type BlockInventoryBody = z.infer<typeof blockInventoryBodySchema>;
export type UnblockInventoryBody = z.infer<typeof unblockInventoryBodySchema>;
export type SetPricingBody = z.infer<typeof setPricingBodySchema>;
