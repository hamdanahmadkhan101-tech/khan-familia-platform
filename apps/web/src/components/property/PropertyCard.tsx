'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import type { PublicPropertySummary } from '@khan-familia/types';
import { humanizeEnum } from '@/lib/utils';

interface PropertyCardProps {
  property: PublicPropertySummary;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const primaryImage = property.images.find((img) => img.isPrimary) || property.images[0];

  return (
    <Link href={`/properties/${property.slug}`} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        {/* Image Container */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={property.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-sm text-muted-foreground">No image available</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />

          {/* Rating Badge */}
          {property.averageRating > 0 && (
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-sm font-medium text-white backdrop-blur-md">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span>{property.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>
                {property.city}, {property.country}
              </span>
            </div>
            <h3 className="mb-2 line-clamp-1 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
              {property.name}
            </h3>
            <p className="line-clamp-1 text-xs uppercase tracking-wider text-muted-foreground">
              {humanizeEnum(property.propertyCategory)}
              {property.propertyType ? ` · ${humanizeEnum(property.propertyType)}` : ''}
            </p>
          </div>

          <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Starting from</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-foreground">
                  PKR {property.minPricePerNight?.toLocaleString() ?? 'N/A'}
                </span>
                <span className="text-sm text-muted-foreground">/night</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
