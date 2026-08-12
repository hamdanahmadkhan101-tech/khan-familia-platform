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

export const submitApplicationBodySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(30),
  businessName: z.string().trim().min(2).max(120),
  businessVertical: businessVerticalEnum,
  businessAddress: z.string().trim().min(5).max(255),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().min(2).max(100),
  phoneCountryCode: z.string().trim().max(10).optional(),
  govIdType: z.enum(['PASSPORT', 'NATIONAL_ID', 'DRIVING_LICENSE']),
  govIdNumber: z.string().trim().min(4).max(100),
  businessRegNumber: z.string().trim().min(4).max(100),
  taxId: z.string().trim().max(100).optional(),
  businessWebsite: z.string().trim().url().max(255).optional().or(z.literal('')),
  altEmail: z.string().trim().email().max(255).optional().or(z.literal('')),
  experience: z.string().trim().min(2).max(500),
  documents: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.string(),
        publicId: z.string().optional(),
      }),
    )
    .max(10)
    .optional(),
});

export const applicationReviewBodySchema = z.object({
  adminNotes: z.string().trim().max(1000).optional(),
});

export type CreateTenantBody = z.infer<typeof createTenantBodySchema>;
export type UpdateTenantBody = z.infer<typeof updateTenantBodySchema>;
export type CreateInviteBody = z.infer<typeof createInviteBodySchema>;
export type AcceptInviteBody = z.infer<typeof acceptInviteBodySchema>;
export type SubmitApplicationBody = z.infer<typeof submitApplicationBodySchema>;
export type ApplicationReviewBody = z.infer<typeof applicationReviewBodySchema>;
