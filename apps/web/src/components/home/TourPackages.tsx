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
      'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 2,
    title: 'Hunza Cultural Trail',
    description: 'Immerse yourself in the traditions of the Hunzakuts and the Attabad Lake.',
    duration: '7 Days / 6 Nights',
    price: 'PKR 110,000',
    image:
      'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 3,
    title: 'Nanga Parbat Trek',
    description: "A challenging trek to the base camp of the 'Killer Mountain'.",
    duration: '4 Days / 3 Nights',
    price: 'PKR 65,000',
    image:
      'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 4,
    title: 'Neelum Valley Retreat',
    description: "Experience the serenity of Kashmir's hidden jewel and Ratti Gali Lake.",
    duration: '6 Days / 5 Nights',
    price: 'PKR 78,000',
    image:
      'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

export function TourPackages() {
  return (
    <section className="w-full py-24 bg-background">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
          <div>
            <span className="text-secondary font-bold uppercase tracking-widest text-sm">
              Expeditions
            </span>
            <h2 className="text-4xl font-bold text-foreground mt-2">Popular Tour Packages</h2>
          </div>
          <div className="flex gap-2 bg-muted rounded-full p-1 border border-border">
            <button className="px-6 py-2 rounded-full bg-background text-foreground font-bold shadow-sm text-sm">
              All Tours
            </button>
            <button className="px-6 py-2 rounded-full text-muted-foreground hover:text-foreground transition-all font-medium text-sm">
              Adventure
            </button>
            <button className="px-6 py-2 rounded-full text-muted-foreground hover:text-foreground transition-all font-medium text-sm">
              Cultural
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DUMMY_TOURS.map((tour) => (
            <div
              key={tour.id}
              className="bg-card rounded-2xl overflow-hidden border border-border hover:border-secondary transition-all group flex flex-col h-full cursor-pointer shadow-sm"
            >
              <div className="h-48 overflow-hidden relative">
                <Image
                  src={tour.image}
                  alt={tour.title}
                  fill
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-3 left-3 bg-primary/90 backdrop-blur text-primary-foreground text-[10px] uppercase font-bold px-3 py-1.5 rounded-full shadow-sm">
                  {tour.duration}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-foreground font-bold text-lg mb-1">{tour.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {tour.description}
                </p>
                <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                  <div>
                    <p className="text-muted-foreground text-xs">Starting from</p>
                    <p className="text-foreground font-bold">{tour.price}</p>
                  </div>
                  <button
                    aria-label={`View details for ${tour.title}`}
                    className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm shrink-0"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
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
