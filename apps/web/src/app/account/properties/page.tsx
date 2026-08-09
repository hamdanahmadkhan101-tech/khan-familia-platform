import { getTenantProperties } from './actions';
import { PropertyImageManager } from '../../../components/account/PropertyImageManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@khan-familia/ui';
import { Building2, MapPin } from 'lucide-react';
import Image from 'next/image';
import type { PublicPropertySummary, PropertyImage } from '@khan-familia/types';

export default async function PropertiesPage() {
  let properties: PublicPropertySummary[] = [];
  try {
    const data = await getTenantProperties();
    properties = data.properties || [];
  } catch (error) {
    console.error('Failed to fetch properties:', error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
        <p className="text-muted-foreground">Manage your properties and media assets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => {
          const primaryImage =
            property.images?.find((img: PropertyImage) => img.isPrimary)?.url ||
            property.images?.[0]?.url ||
            null;

          return (
            <Card key={property.id} className="overflow-hidden flex flex-col">
              <div className="aspect-video relative bg-muted w-full overflow-hidden">
                {primaryImage ? (
                  <Image src={primaryImage} alt={property.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                    <Building2 className="w-12 h-12 text-muted-foreground opacity-50" />
                  </div>
                )}
              </div>

              <CardHeader className="flex-1">
                <CardTitle className="line-clamp-1">{property.name}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {property.city || property.country || 'No location set'}
                </CardDescription>
              </CardHeader>

              <CardContent className="mt-auto border-t pt-4 bg-muted/20">
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-muted-foreground">
                    {property.images?.length || 0} image(s) attached
                  </div>
                  <PropertyImageManager propertyId={property.id} />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {properties.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-muted/10">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No properties found</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              You haven't created any properties yet, or you don't have permission to view them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
