import Image from 'next/image';
import { Verified, Compass, Star } from 'lucide-react';

export function PhilosophySection() {
  return (
    <section className="w-full bg-primary py-24">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-secondary-fixed font-bold uppercase tracking-widest text-label-sm">
            Our Philosophy
          </span>
          <h2 className="text-display font-display text-white mt-4 mb-8">
            Travel Logistics, <br />
            Refined.
          </h2>
          <p className="text-tertiary-fixed-dim text-body-lg mb-12">
            Khan Familia Travels bridges the gap between independent discovery and curated safety.
            We offer a hybrid platform where high-trust logistics meet the soul of exploration.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0 border border-secondary/30">
                <Verified className="w-6 h-6 text-secondary-fixed" />
              </div>
              <div>
                <h4 className="text-white font-headline-sm text-body-md mb-2">Direct Booking</h4>
                <p className="text-tertiary-fixed-dim text-body-sm">
                  Verified properties with instant confirmation and no hidden fees.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0 border border-secondary/30">
                <Compass className="w-6 h-6 text-secondary-fixed" />
              </div>
              <div>
                <h4 className="text-white font-headline-sm text-body-md mb-2">Curated Tours</h4>
                <p className="text-tertiary-fixed-dim text-body-sm">
                  Hand-picked itineraries led by local experts for authentic experiences.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
          <Image
            className="rounded-2xl shadow-2xl relative z-10 border border-white/10 w-full h-auto"
            alt="Premium travel equipment flat-lay"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBTpWJs3FE9ZaNdfyN-k1sQ7FDUIB0bNJDptnuHVJb-gVvw0hgr5btSLNHF7PFwezWgvKfGb9dPa_FinpQq_6UCZUQxQezYiSFmWa8vgED-K2C7R1o1zlIVpC-Saw-XT_V6Pwwdw4pjppkoo8-8h1VJvCKlBsPmTFTdctbwZjtYH3UK9XthZ9Ss5CJ6G-eZ0GX9I84zkAVEq9-QU-XN9iUB6CGeJg-n6REs2FvxJg3eGGt0QGjMO365Nl7VVNL-QS6ihX1rGK4OdI"
            width={600}
            height={800}
          />
          <div className="absolute -bottom-8 -right-8 glass-effect p-6 rounded-2xl shadow-xl z-20 max-w-xs border border-white/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex text-secondary">
                <Star className="w-4 h-4 fill-secondary" />
                <Star className="w-4 h-4 fill-secondary" />
                <Star className="w-4 h-4 fill-secondary" />
                <Star className="w-4 h-4 fill-secondary" />
                <Star className="w-4 h-4 fill-secondary" />
              </div>
              <span className="text-primary font-bold">4.9/5</span>
            </div>
            <p className="text-on-surface-variant text-body-sm font-medium">
              "The most seamless booking experience I've had in Pakistan. Truly premium service."
            </p>
            <p className="text-secondary text-label-sm mt-3">— Arslan K., Luxury Traveler</p>
          </div>
        </div>
      </div>
    </section>
  );
}
