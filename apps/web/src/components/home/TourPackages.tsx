import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

const DUMMY_TOURS = [
  {
    id: 1,
    title: 'Skardu Sky Adventure',
    description: 'Explore Shangrila Lake, Cold Desert and Shigar Fort with local experts.',
    duration: '5 Days / 4 Nights',
    price: 'PKR 85,000',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB2dXs8iF0pVcfwx-v2f5lv7pggCE8ZjzJLG9Gzb7mSeZBJNSdL1W6118OTacBnropkec3uDz_08Xy5hwESod5vukrDfPXIaOIx5R4RGoh9HfQghBJW-6aohw2NDA7ojsOKJ6jLTjD24Nl1D7asP3m3qNS2gJwggTEPHYi4r06JYg03l2apefyDLLQZeoX1A9SLW62LvHvsCdRmjBfYhscQQP3XxH3IDfV0SNGlS9yg2OIeGRkf6UQsdk5JNSlX31RHVXGV7Bk1eNc',
  },
  {
    id: 2,
    title: 'Hunza Cultural Trail',
    description: 'Immerse yourself in the traditions of the Hunzakuts and the Attabad Lake.',
    duration: '7 Days / 6 Nights',
    price: 'PKR 110,000',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC5uBhch1MV_oLfuv3-q9GMs2zbHAbUly2jjB10chqppwbvNJvI1ALGc7CTdyd_QJR9M2Ln6lXWi_SMjE617XL6pL58g7o2CtP_ZQd0SBuVvMHA8WcvlQ5XsZVt0R3KHeAq4VahmDqiyF2aVeyXObMd6UlB89-4G1ZSzleyYYXze88jpX9X4U5MUTCWg0V-rw_dJKry2MWc9r9m8E7hmAEXwYnJ7MT08qymMCpGZ46wSdTMppF5e4MGlW70HAYKUWN7wrPssSMqQM4',
  },
  {
    id: 3,
    title: 'Nanga Parbat Trek',
    description: "A challenging trek to the base camp of the 'Killer Mountain'.",
    duration: '4 Days / 3 Nights',
    price: 'PKR 65,000',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBduXziCJtJ8vRoL50fRMQ1gc4D0g_9wkksFd5ldJclaeCGtIADK4BsBcQGTURcNH5y0NsYMHDx5LjlIseEfmn5IcAu0pppKQe12vXsJ9mpD_oJV4R7fjBJNF_DAemuWm7LITVUivSIOGzSeyVkE0NFjWV7SgKUouwU-XPc41umhnZoFfFBDSbisevl259ED5CHAC11dOuPhojKMdfct84YViYsaZhyoTL5v-tVb9lAuL1eK_LICGbJnmLdx1ppZkIbXSafOiSfj20',
  },
  {
    id: 4,
    title: 'Neelum Valley Retreat',
    description: "Experience the serenity of Kashmir's hidden jewel and Ratti Gali Lake.",
    duration: '6 Days / 5 Nights',
    price: 'PKR 78,000',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCoDizK9xASKe0tQ3grmd5vvVieo_Rn0aiFfgSnlWPJ_cpYxBbsKXEQGW5xkseKyRYlo4bBcfX7WsdrWIl6I7BF6h5hdQ7wWBmoybx7vfOcNpRrwOP1UJ6q3bU3T8ATRx8Eop21p665lTPYL4xQH-vTGn4jTCP5NxyWdP3EhRn3YpIZyPyUmzIvgQInHRriDigObkp9U06X2RtzZ7q1Q967U8z1tRBhmdRMnI6G31_NKT58QSlZLcazmFTVE6IWBMnk8YDumUNsRJ4',
  },
];

export function TourPackages() {
  return (
    <section className="w-full py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
          <div>
            <span className="text-secondary font-bold uppercase tracking-widest text-label-sm">
              Expeditions
            </span>
            <h2 className="text-headline-lg font-headline-lg text-primary mt-2">
              Popular Tour Packages
            </h2>
          </div>
          <div className="flex gap-2 bg-surface-container rounded-full p-1 border border-outline-variant/30">
            <button className="px-6 py-2 rounded-full bg-white text-primary font-bold shadow-sm text-label-md">
              All Tours
            </button>
            <button className="px-6 py-2 rounded-full text-on-surface-variant hover:bg-white/50 transition-all font-medium text-label-md">
              Adventure
            </button>
            <button className="px-6 py-2 rounded-full text-on-surface-variant hover:bg-white/50 transition-all font-medium text-label-md">
              Cultural
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DUMMY_TOURS.map((tour) => (
            <div
              key={tour.id}
              className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/20 hover:border-secondary transition-all group flex flex-col h-full cursor-pointer"
            >
              <div className="h-48 overflow-hidden relative">
                <Image
                  src={tour.image}
                  alt={tour.title}
                  fill
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute bottom-2 left-2 bg-primary/80 backdrop-blur text-white text-[10px] uppercase font-bold px-2 py-1 rounded">
                  {tour.duration}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-primary font-bold text-body-lg mb-1">{tour.title}</h3>
                <p className="text-on-surface-variant text-body-sm mb-4 line-clamp-2">
                  {tour.description}
                </p>
                <div className="mt-auto pt-4 border-t border-outline-variant/30 flex justify-between items-center">
                  <div>
                    <p className="text-outline text-label-sm">Starting from</p>
                    <p className="text-primary font-bold">{tour.price}</p>
                  </div>
                  <button
                    aria-label={`View details for ${tour.title}`}
                    className="h-10 w-10 rounded-full bg-secondary text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shrink-0"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
