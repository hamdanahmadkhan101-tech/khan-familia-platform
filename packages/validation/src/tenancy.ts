import { z } from 'zod';

export const businessVerticalEnum = z.enum([
  'ACCOMMODATIONS_STAYS',
  'EXPERIENCES_TOURS',
  'VEHICLE_RENTALS',
  'VENUES_EVENTS',
  'FOOD_DINING',
]);

export const tenantRoleEnum = z.enum(['OWNER', 'ADMIN', 'STAFF']);

export const createTenantBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  businessVertical: businessVerticalEnum.optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
});

export const updateTenantBodySchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  businessVertical: businessVerticalEnum.optional(),
});

export const tenantIdParamsSchema = z.object({
  tenantId: z.string().min(1),
});

export const tenantMemberParamsSchema = tenantIdParamsSchema.extend({
  userId: z.string().min(1),
});

export const tenantInviteParamsSchema = tenantIdParamsSchema.extend({
  inviteId: z.string().min(1),
});

export const createInviteBodySchema = z.object({
  email: z.string().trim().email().max(255),
  role: tenantRoleEnum.default('STAFF'),
});

export const acceptInviteBodySchema = z.object({
  token: z.string().trim().min(10).max(128),
});

export type CreateTenantBody = z.infer<typeof createTenantBodySchema>;
export type UpdateTenantBody = z.infer<typeof updateTenantBodySchema>;
export type CreateInviteBody = z.infer<typeof createInviteBodySchema>;
export type AcceptInviteBody = z.infer<typeof acceptInviteBodySchema>;
