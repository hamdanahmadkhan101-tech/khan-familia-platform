import Image from 'next/image';
import { Apple, Smartphone } from 'lucide-react';

export function AppCTA() {
  return (
    <section className="w-full py-24 px-8">
      <div className="max-w-7xl mx-auto bg-primary-container rounded-[40px] overflow-hidden relative min-h-[500px] flex items-center">
        <div className="absolute inset-0 opacity-40">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBs3Dfl0P_iVHUuMRNjYYlzwM3L3VyiyWYKBUAkr1uOBC1ssWzBH1GeLUs1Q5ZgYle7NMKPIiZ8Ufh9MlPWbtCAVnZHidO_KrOqmJrJlTzpeHuzeBUAUoFZsdaGJAsIc78I-4GtVtvJQ4Y3c9P3vlY7jRvRvmdRTCJhIhITCPBBle-ALaUDS1O2rGHg3iVcielJ0gR5xrUqTsBSGYAWxvYc-J1lnkSC92KV8kYPpI66zWbshXP5-je1xAm0FXLT1juVAyGbZDq6ank"
            alt="Abstract aerial pattern"
            fill
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 p-12 lg:p-24 max-w-3xl">
          <h2 className="text-display font-display text-white mb-6">
            Adventure in Your <br />
            Pocket.
          </h2>
          <p className="text-tertiary-fixed-dim text-body-lg mb-10">
            Manage your bookings, access offline maps, and get 24/7 support with our mobile app.
            Exclusively for Khan Familia travelers.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-white text-primary px-8 py-4 rounded-full font-button flex items-center gap-3 hover:bg-surface-container transition-all shadow-xl">
              <Apple className="w-6 h-6" />
              Download for iOS
            </button>
            <button className="bg-secondary text-on-secondary px-8 py-4 rounded-full font-button flex items-center gap-3 hover:opacity-90 transition-all shadow-xl">
              <Smartphone className="w-6 h-6" />
              Get for Android
            </button>
          </div>
        </div>

        <div className="hidden lg:block absolute right-24 bottom-0 w-[400px] h-[600px] translate-y-12">
          <div className="bg-surface-container rounded-[48px] w-full h-full border-[12px] border-primary-fixed shadow-2xl overflow-hidden relative">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCiauPct7Qx-QNFlod5VdtMIXxEiEy8ZzNzIjIrw0UJTv7imrMBwQI8M1ouNRMJZNpWA7X0nfIaaeEeTDd4PqQ9BODMCdvTyP_lWfyp3u4dgmci5EBClvOxnVQpbYMkjKc_KAh3KXeICkYjjTmSeoeCsKA0Gacviul932Jjf0kQXv3h6dMSHwdrxQZugRYQcCwfyOpKn6ix9GafXIcMa0zVR-cyjK9AjRgAABJbdjBu6Pq8AOg9I-wRfs0KQH45xlyCqbafH49lWvs"
              alt="Mobile app preview"
              fill
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
