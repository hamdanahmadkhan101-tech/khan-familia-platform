import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import type { PublicPropertySummary } from '@khan-familia/types';

// Fallback images from Stitch design in case real properties don't have images
const FALLBACK_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAwxLyH28RCG61EkdUMuedzw1Miup5k5qiBS5h6gs8Dzii84jcBl1d-3F5gyE8otjVkxbD0TxJoJrNpqI7XKc1uH0esuPpzmHAbYt_iI5hZ2jbJci5KOhNUzqppKRucPu_ZCGuix47XWE-2Qifsmcr9u2dpZj5N0Jju3o96PdEUJa016cypMTRM9PhzOSETW819GxUFCnwLLAyf2kHlkp2dlXRWpRxKRaFb5ia4nvcdpnm08qzw9oqNEHg18plHwdRjjrzx8gjIrpw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDDt3ODmsb0IlrC_J0GCrTuY_phhAsVG_50Qcyd_1WhMZahYJHY5j_3xheHDFkZ9fT49Hb2kJUPfwal5B_FORFqHkGlSxNDEvfwTgY-ID9l6HQkd8BfaNPJ4wxwTyrl9DVB_qXlK9Jeol7JGkWYs7PA28EFMWY9D7LrgoM-SBljnKeotIwur90i1F_dyy_OsyVCnyjFlz5019hvnvZb8yZ69VNL0bSrOxpn_-vs9R7GvDy2tz764Q7mem2kGtah7y9RWkhTGTyO1Qg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA6t7fnm4bUu7hTe7yteb6mvSl3yhfTTp9AVaqAtAFtIFzAHTiu-rWiK2KPehvT3jWxw5z1P04-weAypxuPTm5oeVRC6mTDHbMxbdZGbB1t2V119bYRIDQNQ5FJ5S1zgoOZI7QZ3Wj0hrutyMiALMudZHEt85_c_P8f_FBo-JYWeInGlD8jNLMSCa6MvICbirg29XGy15dQ0M1D01VUfIlrcQEVcmx9mVyEKrFeU3H3-6ZKMjed-cifI3D5dwZTh7Sr8m2HLJFd3c4',
];

interface FeaturedPropertiesProps {
  properties: PublicPropertySummary[];
}

export function FeaturedProperties({ properties }: FeaturedPropertiesProps) {
  // Take only the first 3 for the featured section
  const featured = properties.slice(0, 3);

  return (
    <section className="w-full py-24 bg-surface-container-low">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-secondary font-bold uppercase tracking-widest text-label-sm">
              Stays
            </span>
            <h2 className="text-headline-lg font-headline-lg text-primary mt-2">
              Featured Properties
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featured.map((property, index) => {
            const hasImages = property.images && property.images.length > 0;
            // Ensure heroImage is always a valid string
            const heroImage =
              hasImages && property.images && property.images[0]?.url
                ? property.images[0].url
                : (FALLBACK_IMAGES[index % FALLBACK_IMAGES.length] as string);

            // Generate some dummy amenities if they don't exist yet to match the Stitch design
            const amenities = ['Wifi', 'Heating', 'Breakfast'];

            return (
              <div
                key={property.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-outline-variant/30 group flex flex-col"
              >
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={heroImage}
                    alt={property.name}
                    fill
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-label-sm font-bold text-primary flex items-center gap-1">
                    <Star className="w-4 h-4 fill-primary" /> 4.9
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-headline-sm font-headline-sm text-primary line-clamp-1">
                      {property.name}
                    </h3>
                  </div>

                  <p className="text-on-surface-variant text-body-sm mb-4 flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {property.city}
                  </p>

                  <div className="flex gap-2 mb-6">
                    {amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="bg-surface-container px-3 py-1 rounded-full text-label-sm text-on-surface-variant"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <Link href={`/properties/${property.slug}`}>
                      <button className="w-full py-3 rounded-xl border border-secondary text-secondary font-button hover:bg-secondary hover:text-white transition-all">
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
