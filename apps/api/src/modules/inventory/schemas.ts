import { z } from 'zod';

export const propertyIdParamsSchema = z.object({
  propertyId: z.string().cuid(),
});

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
