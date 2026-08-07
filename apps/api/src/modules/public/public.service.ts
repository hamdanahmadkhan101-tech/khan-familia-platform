import { prisma } from '../../infrastructure/database/client.js';
import type { Prisma } from '@khan-familia/database';
import { PropertyApprovalStatus } from '@khan-familia/database';
import { AppError } from '../../shared/errors/AppError.js';
import type { PublicPropertyDetails, PublicPropertySummary } from '@khan-familia/types';

/**
 * Lists all approved, non-deleted properties.
 * Returns only the fields needed to render a property card.
 */
export type PublicPropertyFilters = {
  city?: string | undefined;
  country?: string | undefined;
  propertyType?: string | undefined;
  propertyCategory?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  starRating?: number | undefined;
  query?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
};

/**
 * Lists all approved, non-deleted properties.
 * Returns only the fields needed to render a property card.
 */
export const listPublicProperties = async (
  filters: PublicPropertyFilters = {},
): Promise<{ properties: PublicPropertySummary[]; total: number; page: number; limit: number }> => {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(50, Math.max(1, filters.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Prisma.PropertyWhereInput = {
    approvalStatus: PropertyApprovalStatus.APPROVED,
    isDeleted: false,
  };

  if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
  if (filters.country) where.country = { contains: filters.country, mode: 'insensitive' };
  if (filters.propertyType)
    where.propertyType = filters.propertyType as import('@khan-familia/database').PropertyType;
  if (filters.propertyCategory)
    where.propertyCategory =
      filters.propertyCategory as import('@khan-familia/database').PropertyCategory;
  if (filters.starRating) where.starRating = { gte: filters.starRating };
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceFilter: Prisma.IntFilter = {};
    if (filters.minPrice !== undefined) priceFilter.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) priceFilter.lte = filters.maxPrice;
    where.minPricePerNight = priceFilter;
  }
  if (filters.query) {
    where.OR = [
      { name: { contains: filters.query, mode: 'insensitive' } },
      { description: { contains: filters.query, mode: 'insensitive' } },
      { city: { contains: filters.query, mode: 'insensitive' } },
    ];
  }

  const [rows, total] = await prisma.$transaction([
    prisma.property.findMany({
      where,
      select: {
        id: true,
        slug: true,
        name: true,
        city: true,
        country: true,
        starRating: true,
        minPricePerNight: true,
        averageRating: true,
        totalReviews: true,
        images: true,
        propertyType: true,
        propertyCategory: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.property.count({ where }),
  ]);

  return {
    properties: rows as unknown as PublicPropertySummary[],
    total,
    page,
    limit,
  };
};

/**
 * Returns full details of a single approved property by slug.
 * Amenities are flattened at the service layer — the join-table wrapper
 * is stripped so callers get a clean flat amenity object.
 * Throws AppError(404) if not found or not approved.
 */
export const getPublicPropertyBySlug = async (slug: string): Promise<PublicPropertyDetails> => {
  const property = await prisma.property.findFirst({
    where: {
      slug,
      approvalStatus: PropertyApprovalStatus.APPROVED,
      isDeleted: false,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      address: true,
      city: true,
      country: true,
      starRating: true,
      minPricePerNight: true,
      averageRating: true,
      totalReviews: true,
      images: true,
      propertyType: true,
      propertyCategory: true,
      checkInTime: true,
      checkOutTime: true,
      languages: true,
      houseRules: true,

      // Geo coordinates — no internal IDs or timestamps
      location: {
        select: {
          lat: true,
          lng: true,
          state: true,
          zipCode: true,
        },
      },

      // Only feature data, join-table fields excluded
      features: {
        select: {
          feature: {
            select: {
              id: true,
              name: true,
              icon: true,
              type: true,
              isPopular: true,
            },
          },
        },
      },

      // Room types — only what the UI renders, no tenantId or timestamps
      unitTypes: {
        where: { isDeleted: false },
        select: {
          id: true,
          name: true,
          capacity: true,
          description: true,
          images: true,
          defaultRate: true,
        },
        orderBy: {
          defaultRate: 'asc',
        },
      },
    },
  });

  if (!property) {
    throw AppError.notFound('Property not found');
  }

  // Flatten features and map to amenities for frontend compatibility
  const { features, ...rest } = property;
  return {
    ...rest,
    amenities: features.map((f) => ({
      id: f.feature.id,
      name: f.feature.name,
      icon: f.feature.icon,
      category: f.feature.type,
      isPopular: f.feature.isPopular,
    })),
  } as unknown as PublicPropertyDetails;
};
