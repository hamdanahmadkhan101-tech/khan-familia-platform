import { z } from 'zod';

export const createHoldBodySchema = z
  .object({
    propertyId: z.string().cuid(),
    unitTypeId: z.string().cuid(),
    startDate: z.string().date(),
    endDate: z.string().date(),
    quantity: z.number().int().min(1).default(1),
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

export const releaseHoldParamsSchema = z.object({
  holdToken: z.string().uuid(),
});

export type CreateHoldBody = z.infer<typeof createHoldBodySchema>;
export type ReleaseHoldParams = z.infer<typeof releaseHoldParamsSchema>;
