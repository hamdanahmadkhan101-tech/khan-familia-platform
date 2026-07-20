import Image from 'next/image';
import { Search, MapPin, Calendar, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative isolate flex flex-col">
      {/* Hero Section */}
      <section className="relative flex h-[80vh] min-h-[600px] w-full flex-col items-center justify-center pt-16">
        {/* Background Image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/nature.png"
            alt="Beautiful mountain landscape in Swat Valley"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-background" />
        </div>

        {/* Hero Content */}
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center sm:px-6">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Find Your Perfect Stay
          </h1>
          <p className="max-w-2xl text-lg text-white/90 sm:text-xl">
            Experience the breathtaking beauty of Pakistan. From luxury hotels to cozy cabins, book
            your next adventure with Khan Familia Travels.
          </p>
        </div>

        {/* Search Bar */}
        <div className="absolute -bottom-8 w-full max-w-5xl px-4 sm:px-6">
          <div className="mx-auto flex flex-col items-center gap-4 rounded-2xl bg-white p-4 shadow-xl sm:flex-row sm:p-2 border border-border">
            <div className="flex w-full flex-1 items-center gap-3 rounded-xl hover:bg-slate-50 p-3 transition-colors">
              <MapPin className="h-5 w-5 text-primary" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Location
                </span>
                <input
                  type="text"
                  placeholder="Where are you going?"
                  className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="hidden h-10 w-px bg-border sm:block" />

            <div className="flex w-full flex-1 items-center gap-3 rounded-xl hover:bg-slate-50 p-3 transition-colors">
              <Calendar className="h-5 w-5 text-primary" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Dates
                </span>
                <input
                  type="text"
                  placeholder="Add dates"
                  className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="hidden h-10 w-px bg-border sm:block" />

            <div className="flex w-full flex-1 items-center gap-3 rounded-xl hover:bg-slate-50 p-3 transition-colors">
              <Users className="h-5 w-5 text-primary" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Guests
                </span>
                <input
                  type="text"
                  placeholder="Add guests"
                  className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95 sm:w-auto sm:px-6">
              <Search className="h-5 w-5" />
              <span>Search</span>
            </button>
          </div>
        </div>
      </section>

      {/* Featured Properties Spacer */}
      <section className="mt-32 min-h-[400px] w-full px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Trending Accommodations
          </h2>
          <p className="mt-2 text-muted-foreground">Handpicked properties for your next getaway.</p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Placeholder for Property Cards */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
