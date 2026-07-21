import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { RoomTypeCard } from '@/components/property/RoomTypeCard';
import { DynamicIcon } from '@/components/property/DynamicIcon';
import { Star, MapPin, Info } from 'lucide-react';
import { humanizeEnum } from '@/lib/utils';
import type { Metadata } from 'next';

// Generate metadata dynamically for SEO
export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  try {
    const property = await api.getPublicPropertyDetails(params.slug);
    return {
      title: `${property.name} | Khan Familia Travels`,
      description: property.description.substring(0, 160),
    };
  } catch {
    return { title: 'Property Not Found' };
  }
}

export default async function PropertyDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;

  let property;
  try {
    property = await api.getPublicPropertyDetails(params.slug);
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background pb-24 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/properties" className="hover:text-foreground transition-colors">
            Properties
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium line-clamp-1">{property.name}</span>
        </nav>

        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground md:text-5xl">{property.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground md:text-base">
            {property.averageRating > 0 && (
              <div className="flex items-center gap-1 font-medium text-foreground">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{property.averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground underline decoration-border underline-offset-4">
                  ({property.totalReviews} reviews)
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="underline decoration-border underline-offset-4">
                {property.city}, {property.country}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary backdrop-blur-md">
              {humanizeEnum(property.propertyCategory)}
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="mb-12">
          <PropertyGallery images={property.images} propertyName={property.name} />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Main Content Column */}
          <div className="lg:col-span-2">
            <section className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-foreground">About this property</h2>
              <div className="prose prose-stone dark:prose-invert max-w-none text-muted-foreground">
                <p className="whitespace-pre-line leading-relaxed">{property.description}</p>
              </div>
            </section>

            <section className="mb-12 border-t border-border pt-12">
              <h2 className="mb-6 text-2xl font-bold text-foreground">What this place offers</h2>
              <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-3">
                {property.amenities.map((amenity) => (
                  <div key={amenity.id} className="flex items-center gap-3 text-muted-foreground">
                    <DynamicIcon name={amenity.icon} className="h-5 w-5 text-primary" />
                    <span>{amenity.name}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-t border-border pt-12">
              <h2 className="mb-6 text-2xl font-bold text-foreground">Available Rooms</h2>
              <div className="flex flex-col gap-6">
                {property.unitTypes.length > 0 ? (
                  property.unitTypes.map((room) => <RoomTypeCard key={room.id} room={room} />)
                ) : (
                  <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                    <p className="text-muted-foreground">
                      No rooms are currently available for booking.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 border-b border-border pb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">
                    PKR {property.minPricePerNight?.toLocaleString() ?? 'N/A'}
                  </span>
                  <span className="text-muted-foreground">/ night</span>
                </div>
              </div>

              <div className="mb-6 rounded-xl bg-primary/10 p-4 border border-primary/20">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h4 className="font-medium text-foreground">Booking Phase Upcoming</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      We are currently displaying properties for discovery. The full booking and
                      checkout experience will be enabled in the next phase.
                    </p>
                  </div>
                </div>
              </div>

              {property.houseRules && Object.keys(property.houseRules).length > 0 && (
                <div>
                  <h4 className="mb-3 font-semibold text-foreground">House Rules</h4>
                  <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {property.checkInTime && <li>Check-in: {property.checkInTime}</li>}
                    {property.checkOutTime && <li>Check-out: {property.checkOutTime}</li>}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
