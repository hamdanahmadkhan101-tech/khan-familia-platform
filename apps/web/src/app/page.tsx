import { api } from '@/lib/api';
import { Hero } from '@/components/home/Hero';
import { TrendingDestinations } from '@/components/home/TrendingDestinations';
import { PhilosophySection } from '@/components/home/PhilosophySection';
import { FeaturedProperties } from '@/components/home/FeaturedProperties';
import { TourPackages } from '@/components/home/TourPackages';
import { AppCTA } from '@/components/home/AppCTA';

export default async function HomePage() {
  const properties = await api.getPublicProperties();

  return (
    <div className="flex flex-col bg-surface text-on-surface">
      <Hero />
      <TrendingDestinations />
      <PhilosophySection />
      <FeaturedProperties properties={properties} />
      <TourPackages />
      <AppCTA />
    </div>
  );
}
