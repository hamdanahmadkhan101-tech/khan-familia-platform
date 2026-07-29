import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { RoomTypeCard } from '@/components/property/RoomTypeCard';
import { BookingSidebar } from '@/components/property/BookingSidebar';
import { DynamicIcon } from '@/components/property/DynamicIcon';
import { Star, MapPin } from 'lucide-react';
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
    <main className="min-h-screen bg-background pb-32 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/properties" className="hover:text-primary transition-colors">
            Properties
          </Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{property.name}</span>
        </nav>

        {/* Header Section */}
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            {property.name}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground md:text-base">
            {property.averageRating > 0 && (
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg">{property.averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground underline decoration-border underline-offset-4">
                  ({property.totalReviews} reviews)
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="underline decoration-border/50 underline-offset-4 hover:decoration-border">
                {property.city}, {property.country}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold tracking-wide text-primary backdrop-blur-md">
              {humanizeEnum(property.propertyCategory)}
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="mb-16">
          <PropertyGallery images={property.images} propertyName={property.name} />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
          {/* Main Content Column */}
          <div className="lg:col-span-2">
            <section className="mb-16">
              <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight text-foreground">
                About this property
              </h2>
              <div className="prose prose-stone dark:prose-invert prose-lg max-w-none text-muted-foreground leading-relaxed">
                <p className="whitespace-pre-line">{property.description}</p>
              </div>
            </section>

            <section className="mb-16 border-t border-border/50 pt-16">
              <h2 className="mb-8 font-display text-3xl font-semibold tracking-tight text-foreground">
                What this place offers
              </h2>
              <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-3">
                {property.amenities.map((amenity) => (
                  <div
                    key={amenity.id}
                    className="flex items-center gap-4 text-foreground font-medium"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5">
                      <DynamicIcon name={amenity.icon} className="h-5 w-5 text-primary" />
                    </div>
                    <span>{amenity.name}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-t border-border/50 pt-16">
              <h2 className="mb-8 font-display text-3xl font-semibold tracking-tight text-foreground">
                Available Rooms
              </h2>
              <div className="flex flex-col gap-8">
                {property.unitTypes.length > 0 ? (
                  property.unitTypes.map((room) => (
                    <RoomTypeCard key={room.id} propertyId={property.id} room={room} />
                  ))
                ) : (
                  <div className="rounded-[2rem] border border-border bg-card p-12 text-center shadow-sm">
                    <p className="text-lg font-medium text-muted-foreground">
                      No rooms are currently available for booking.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-1">
            <BookingSidebar minPrice={property.minPricePerNight} />
          </div>
        </div>
      </div>
    </main>
  );
}
