import { z } from 'zod';

const accommodationBookingStatusValues = [
  'PENDING',
  'BOOKED',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
  'NO_SHOW',
] as const;

const todayDateString = () => new Date().toISOString().slice(0, 10);

export const createHoldBodySchema = z
  .object({
    propertyId: z.string().min(1),
    unitTypeId: z.string().min(1),
    startDate: z.string().date(),
    endDate: z.string().date(),
    quantity: z.number().int().min(1).default(1),
  })
  .refine((data) => data.startDate >= todayDateString(), {
    message: 'startDate must be today or a future date',
    path: ['startDate'],
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

export const guestBookingListQuerySchema = z.object({
  status: z.enum(accommodationBookingStatusValues).optional(),
  scope: z.enum(['upcoming', 'past', 'cancelled', 'all']).default('upcoming'),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const bookingIdParamsSchema = z.object({
  bookingId: z.string().min(1),
});

export const cancelGuestBookingBodySchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

export const rejectBookingBodySchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

export type CreateHoldBody = z.infer<typeof createHoldBodySchema>;
export type ReleaseHoldParams = z.infer<typeof releaseHoldParamsSchema>;
export type GuestBookingListQuery = z.infer<typeof guestBookingListQuerySchema>;
export type BookingIdParams = z.infer<typeof bookingIdParamsSchema>;
export type CancelGuestBookingBody = z.infer<typeof cancelGuestBookingBodySchema>;
export type RejectBookingBody = z.infer<typeof rejectBookingBodySchema>;
