import { MapPin, Calendar, Users, Search } from 'lucide-react';

export function Hero() {
  return (
    <section className="w-full relative min-h-[870px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 hero-gradient"></div>
      <div className="relative z-10 w-full max-w-7xl px-8 text-center mt-[72px]">
        <h1 className="text-display font-display text-white mb-6 drop-shadow-lg leading-tight">
          Your Gateway to the <br />
          <span className="text-secondary-fixed">Pakistani Heavens</span>
        </h1>
        <p className="text-white/90 text-body-lg max-w-2xl mx-auto mb-12 drop-shadow-md">
          Directly book the finest stays and curated adventure tours across the majestic North.
        </p>

        {/* Universal Search Bar */}
        <div className="glass-effect p-2 rounded-full max-w-5xl mx-auto shadow-2xl flex flex-col md:flex-row items-stretch md:items-center gap-2 border border-white/20">
          <div className="flex-1 flex items-center px-6 gap-3 group">
            <MapPin className="w-6 h-6 text-secondary" />
            <div className="text-left w-full">
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                Location
              </p>
              <input
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-body-md font-semibold text-primary placeholder:text-outline/70 focus:outline-none"
                placeholder="Where to?"
                type="text"
              />
            </div>
          </div>

          <div className="hidden md:block w-px h-10 bg-outline-variant"></div>

          <div className="flex-1 flex items-center px-6 gap-3 group">
            <Calendar className="w-6 h-6 text-secondary" />
            <div className="text-left w-full">
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                Dates
              </p>
              <input
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-body-md font-semibold text-primary placeholder:text-outline/70 focus:outline-none"
                placeholder="Add dates"
                type="text"
              />
            </div>
          </div>

          <div className="hidden md:block w-px h-10 bg-outline-variant"></div>

          <div className="flex-1 flex items-center px-6 gap-3 group">
            <Users className="w-6 h-6 text-secondary" />
            <div className="text-left w-full">
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                Travelers
              </p>
              <input
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-body-md font-semibold text-primary placeholder:text-outline/70 focus:outline-none"
                placeholder="Add guests"
                type="text"
              />
            </div>
          </div>

          <button className="bg-primary text-white rounded-full px-8 py-4 flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg group shrink-0">
            <Search className="w-5 h-5" />
            <span className="font-button">Search</span>
          </button>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 flex items-center gap-2 text-white text-label-md cursor-pointer hover:bg-white/20 transition-all">
            <MapPin className="w-5 h-5 text-secondary-fixed" />
            Stays
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 flex items-center gap-2 text-white text-label-md cursor-pointer hover:bg-white/20 transition-all">
            <MapPin className="w-5 h-5 text-secondary-fixed" />
            Expeditions
          </div>
        </div>
      </div>
    </section>
  );
}
