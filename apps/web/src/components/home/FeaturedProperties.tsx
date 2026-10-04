import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import type { PublicPropertySummary } from '@khan-familia/types';

// High-quality Unsplash fallbacks for premium hospitality feel
const FALLBACK_IMAGES = [
  'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800',
];

interface FeaturedPropertiesProps {
  properties: PublicPropertySummary[];
}

export function FeaturedProperties({ properties }: FeaturedPropertiesProps) {
  // Take only the first 3 for the featured section
  const featured = properties.slice(0, 3);

  return (
    <section className="w-full py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-secondary font-bold uppercase tracking-widest text-sm">
              Featured Stays
            </span>
            <h2 className="text-4xl font-bold text-foreground mt-2">Curated Accommodations</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featured.map((property, index) => {
            const hasImages = property.images && property.images.length > 0;
            const heroImage =
              hasImages && property.images && property.images[0]?.url
                ? property.images[0].url
                : (FALLBACK_IMAGES[index % FALLBACK_IMAGES.length] as string);

            const amenities = ['Wifi', 'Heating', 'Breakfast'];

            return (
              <div
                key={property.id}
                className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-border group flex flex-col"
              >
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={heroImage}
                    alt={property.name}
                    fill
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-foreground flex items-center gap-1 shadow-sm">
                    <Star className="w-4 h-4 fill-secondary text-secondary" /> 4.9
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-foreground line-clamp-1">
                      {property.name}
                    </h3>
                  </div>

                  <p className="text-muted-foreground text-sm mb-4 flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {property.city}
                  </p>

                  <div className="flex gap-2 mb-6">
                    {amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <Link href={`/properties/${property.slug}`}>
                      <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-sm">
                        View Details
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
