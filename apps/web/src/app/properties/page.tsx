import { Suspense } from 'react';
import { api } from '@/lib/api';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Search, Loader2, Map } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Properties | Khan Familia Travels',
  description: 'Find your perfect stay in Swat Valley and beyond.',
};

export default async function PropertiesPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const locationQuery = searchParams['location'] as string | undefined;

  // We fetch directly in the Server Component
  const properties = await api.getPublicProperties();

  // Basic filtering for MVP
  const filteredProperties = locationQuery
    ? properties.filter(
        (p) =>
          p.city.toLowerCase().includes(locationQuery.toLowerCase()) ||
          p.name.toLowerCase().includes(locationQuery.toLowerCase()),
      )
    : properties;

  return (
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              {locationQuery ? `Stays in ${locationQuery}` : 'Explore our properties'}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {filteredProperties.length}{' '}
              {filteredProperties.length === 1 ? 'property' : 'properties'} available
            </p>
          </div>

          <button className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent w-fit">
            <Map className="h-4 w-4" />
            Show Map
          </button>
        </div>

        {/* Results Grid */}
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <div className="min-h-[400px]">
            {filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-24 shadow-sm">
                <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-medium text-foreground">No properties found</h3>
                <p className="mt-2 text-muted-foreground max-w-md text-center">
                  We couldn't find any properties matching your search criteria. Try adjusting your
                  destination or dates.
                </p>
              </div>
            )}
          </div>
        </Suspense>
      </div>
    </main>
  );
}
