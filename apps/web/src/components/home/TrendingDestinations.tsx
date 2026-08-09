import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export function TrendingDestinations() {
  return (
    <section className="w-full py-24 px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-secondary font-bold uppercase tracking-widest text-sm">
            Inspiration
          </span>
          <h2 className="text-4xl font-bold text-foreground mt-2">Trending Destinations</h2>
        </div>
        <button className="text-secondary font-semibold flex items-center gap-2 group">
          View all regions{' '}
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:auto-rows-[280px]">
        {/* Destination 1 */}
        <div className="lg:col-span-2 lg:row-span-2 relative rounded-2xl overflow-hidden group cursor-pointer shadow-sm border border-border min-h-[300px] lg:min-h-0">
          <Image
            src="https://images.unsplash.com/photo-1542314831-c6a4d27f6f2c?auto=format&fit=crop&w=1200&q=80"
            alt="Swat Valley"
            fill
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
          <div className="absolute bottom-0 p-8">
            <h3 className="text-white text-3xl font-bold">Swat Valley</h3>
            <p className="text-white/90 text-sm mt-2 font-medium">The Switzerland of the East</p>
          </div>
        </div>

        {/* Destination 2 */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden group cursor-pointer shadow-sm border border-border min-h-[300px] lg:min-h-0">
          <Image
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
            alt="Kalam Forest"
            fill
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
          <div className="absolute bottom-0 p-8">
            <h3 className="text-white text-2xl font-bold">Kalam Forest</h3>
            <p className="text-white/90 text-sm mt-2 font-medium">Pristine Wilderness</p>
          </div>
        </div>

        {/* Destination 3 */}
        <div className="relative rounded-2xl overflow-hidden group cursor-pointer shadow-sm border border-border min-h-[300px] lg:min-h-0">
          <Image
            src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80"
            alt="Malam Jabba"
            fill
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
          <div className="absolute bottom-0 p-6">
            <h3 className="text-white text-2xl font-bold">Malam Jabba</h3>
            <p className="text-white/90 text-sm mt-1 font-medium">Ski Paradise</p>
          </div>
        </div>

        {/* Destination 4 */}
        <div className="relative rounded-2xl overflow-hidden group cursor-pointer shadow-sm border border-border min-h-[300px] lg:min-h-0">
          <Image
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
            alt="Hunza Valley"
            fill
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
          <div className="absolute bottom-0 p-6">
            <h3 className="text-white text-2xl font-bold">Hunza</h3>
            <p className="text-white/90 text-sm mt-1 font-medium">Valley of Giants</p>
          </div>
        </div>
      </div>
    </section>
  );
}
