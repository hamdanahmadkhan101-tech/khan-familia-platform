import { PropertyCategory, PropertyType } from '@khan-familia/database';
import { z } from 'zod';

const imageItemSchema = z.object({
  url: z.string().url(),
  publicId: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

const locationSchema = z.object({
  state: z.string().trim().max(120).optional(),
  zipCode: z.string().trim().max(32).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  timezone: z.string().trim().max(64).optional(),
});

export const createPropertyBodySchema = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().min(10).max(10000),
  city: z.string().trim().min(1).max(120),
  country: z.string().trim().min(2).max(120),
  address: z.string().trim().max(500).optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  propertyCategory: z.nativeEnum(PropertyCategory).optional(),
  images: z.array(imageItemSchema).default([]),
  starRating: z.number().int().min(1).max(5).optional(),
  isWholePropertyBookable: z.boolean().optional(),
  wholePropertyBasePrice: z.number().int().min(0).optional(),
  checkInTime: z.string().trim().max(16).optional(),
  checkOutTime: z.string().trim().max(16).optional(),
  timezone: z.string().trim().max(64).optional(),
  requiresApproval: z.boolean().optional(),
  location: locationSchema.optional(),
});

export const updatePropertyBodySchema = createPropertyBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const propertyIdParamsSchema = z.object({
  propertyId: z.string().cuid(),
});

export const unitTypeParamsSchema = propertyIdParamsSchema.extend({
  unitTypeId: z.string().cuid(),
});

export const createUnitTypeBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  unitCount: z.number().int().min(1).max(1000).default(1),
  capacity: z.number().int().min(1).max(50).default(2),
  description: z.string().trim().max(5000).optional(),
  defaultRate: z.number().int().min(0).optional(),
  images: z.array(imageItemSchema).optional(),
});

export const updateUnitTypeBodySchema = createUnitTypeBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const rejectPropertyBodySchema = z.object({
  reason: z.string().trim().min(3).max(2000),
});

export type CreatePropertyBody = z.infer<typeof createPropertyBodySchema>;
export type UpdatePropertyBody = z.infer<typeof updatePropertyBodySchema>;
export type CreateUnitTypeBody = z.infer<typeof createUnitTypeBodySchema>;
export type UpdateUnitTypeBody = z.infer<typeof updateUnitTypeBodySchema>;
export type RejectPropertyBody = z.infer<typeof rejectPropertyBodySchema>;
