import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@khan-familia/ui';
import { Building2, Globe2, ShieldCheck, TrendingUp, Sparkles, MapPin } from 'lucide-react';

export default function HostMarketingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative px-6 lg:px-8 py-24 sm:py-32 overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800"
            alt="Beautiful resort"
            fill
            className="object-cover opacity-30 mix-blend-overlay"
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Open your doors to the world.
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join Khan Familia and turn your property, vehicle, or experience into a thriving
            business. We provide the tools, support, and audience you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Link href="/onboarding/apply">Get Started Today</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 rounded-full bg-white/10 border-white/20 hover:bg-white/20 text-white"
            >
              <Link href="#benefits">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            Why host on Khan Familia?
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Everything you need to succeed, all in one platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
              <Globe2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Global Reach</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Put your listings in front of millions of travelers looking for unique stays and
              experiences worldwide.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
              Secure & Protected
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Our industry-leading identity verification and secure payment infrastructure keeps
              your business safe.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
              Grow Your Revenue
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Access dynamic pricing tools and analytics dashboards built exclusively for
              professional vendors.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-white dark:bg-slate-900 py-24 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
                More than just accommodations.
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                Khan Familia is a unified platform for the modern hospitality industry. We support
                multiple business verticals to give guests a complete travel experience.
              </p>

              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="mt-1 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-700 dark:text-slate-300">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white block text-lg">
                      Accommodations & Stays
                    </strong>
                    <span className="text-slate-600 dark:text-slate-400">
                      Hotels, resorts, vacation rentals, and boutique stays.
                    </span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-700 dark:text-slate-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white block text-lg">
                      Experiences & Tours
                    </strong>
                    <span className="text-slate-600 dark:text-slate-400">
                      Guided city tours, culinary experiences, and local adventures.
                    </span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-700 dark:text-slate-300">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white block text-lg">
                      Venues & Events
                    </strong>
                    <span className="text-slate-600 dark:text-slate-400">
                      Rent out spaces for weddings, conferences, or corporate retreats.
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[600px]">
              <Image
                src="https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Modern apartment interior"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 text-center px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
          Ready to start earning?
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
          The application takes less than 5 minutes. Our onboarding team reviews applications within
          24 hours.
        </p>
        <Button
          asChild
          size="lg"
          className="text-lg px-10 py-6 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <Link href="/onboarding/apply">Apply Now</Link>
        </Button>
      </section>
    </div>
  );
}
