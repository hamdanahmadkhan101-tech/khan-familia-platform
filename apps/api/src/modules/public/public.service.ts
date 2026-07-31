import { prisma } from '../../infrastructure/database/client.js';
import { PropertyApprovalStatus } from '@khan-familia/database';
import { AppError } from '../../shared/errors/AppError.js';
import type { PublicPropertyDetails, PublicPropertySummary } from '@khan-familia/types';

/**
 * Lists all approved, non-deleted properties.
 * Returns only the fields needed to render a property card.
 */
export const listPublicProperties = async (): Promise<PublicPropertySummary[]> => {
  const rows = await prisma.property.findMany({
    where: {
      approvalStatus: PropertyApprovalStatus.APPROVED,
      isDeleted: false,
    },
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  // images is stored as Json in Prisma — cast to our typed shape
  return rows as unknown as PublicPropertySummary[];
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
