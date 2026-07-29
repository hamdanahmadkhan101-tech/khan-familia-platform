import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export function TrendingDestinations() {
  return (
    <section className="w-full py-24 px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-secondary font-bold uppercase tracking-widest text-label-sm">
            Inspiration
          </span>
          <h2 className="text-headline-lg font-headline-lg text-primary mt-2">
            Trending Destinations
          </h2>
        </div>
        <button className="text-secondary font-button flex items-center gap-2 group">
          View all regions{' '}
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:auto-rows-[280px]">
        {/* Destination 1 */}
        <div className="lg:col-span-2 lg:row-span-2 relative rounded-xl overflow-hidden group cursor-pointer shadow-lg min-h-[300px] lg:min-h-0">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuZB-LmRZdBYr2okpi4ivfOtIUnL-ZmSvKUP0JeeHviIsoz_BwKS-zGgzr8w8kQAK2ak4QtiLwsV83DggKQCm8mWhhWVQDUVF8sMf-mhOpy9NHaBOzyljXUrW4hxPMWVFA3dQuUldcDy88LPP0XHfzwaX36gndn7FSse3njkfaClp6xQ2DQpIpE_UaPCz5aWdOWEjxKiFQimFFfbyvc2QVewjZVV7w2w7vuUtSJO826hEw7et7BuXtLIMn6lxbaBhV4RFCTjhs95w"
            alt="Swat Valley"
            fill
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
          <div className="absolute bottom-0 p-8">
            <h3 className="text-white text-headline-md font-headline-md">Swat Valley</h3>
            <p className="text-white/80 text-body-sm mt-2">The Switzerland of the East</p>
          </div>
        </div>

        {/* Destination 2 */}
        <div className="lg:col-span-2 relative rounded-xl overflow-hidden group cursor-pointer shadow-lg min-h-[300px] lg:min-h-0">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuWydaHfFZI4mmJHqDa004HPEIdJ7gdD0elULJC4lUSC50PsYHOd3ggQf6FDyZ3td9RUceLXC87-xnozoRA52YCOsnT5LUG_SMPBdxVSKMcwDMwMPmTwCaBeoM3mB-L2oT3iA4sitwAuOzPJfr3UFmZ6zTf1A-XldxHqJpr1O9vjsUj74NPo9bWXutRGjF3vi2k829BE4NXO8hegC44ohRQaMXfF1PS9El4SB057E6D0H9SB4rQHa-5ia5F4utYm9ih1bSjpuuLwY"
            alt="Kalam Forest"
            fill
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
          <div className="absolute bottom-0 p-8">
            <h3 className="text-white text-headline-sm font-headline-sm">Kalam Forest</h3>
            <p className="text-white/80 text-body-sm mt-2">Pristine Wilderness</p>
          </div>
        </div>

        {/* Destination 3 */}
        <div className="relative rounded-xl overflow-hidden group cursor-pointer shadow-lg min-h-[300px] lg:min-h-0">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCE62_cXxkZP1mDUAjX3LK1DCqKo_dO3fXK6UH4hmqOu_FdsLsPZh7p47ybb7aODpFKnteVIERkRDvBgvsHaF3oZpLyF_maje2TpmhqUhpeQsuQk_vOTgAtjS5KKZZY_laT5DamCqw1ptCtuhNdKkhqu8-JkNZJtC6_1UwxolSYbJGc0tmfzFKwkbGZ8KZ2odf85XVPOPhOlYbUxVG0yfJB2e29jKO-Oo6bEEoTzGyhsG-fPlk9wzIiLXoqiMltXgN_b3TROD-laMw"
            alt="Malam Jabba"
            fill
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
          <div className="absolute bottom-0 p-6">
            <h3 className="text-white text-headline-sm font-headline-sm">Malam Jabba</h3>
            <p className="text-white/80 text-body-sm mt-1">Ski Paradise</p>
          </div>
        </div>

        {/* Destination 4 */}
        <div className="relative rounded-xl overflow-hidden group cursor-pointer shadow-lg min-h-[300px] lg:min-h-0">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBg0N30v4gdYDvtAVFPAaBMnzRwNSOFTluKv2-GSx3Y69BUy8r973_VOUCr0E4Q34JbTOO050knkJaI8ekGfX157Vj3iXeEwy5ko-xyPQaCDC0JsooJlpFTeHjzkNX2ZcseR8xuWYjiM0NyOrJOQWIyB4iWPM5PsuC7Z_XWIZoD7mfHOQE0sYI-cRueYbqp30sGSY9vRf1zjH9o7Hfj-3Vo04EvculpUepVdg0J50ZDVr87T5gkS3BeD43VgF16jFghDrsmHjM6ywg"
            alt="Hunza Valley"
            fill
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
          <div className="absolute bottom-0 p-6">
            <h3 className="text-white text-headline-sm font-headline-sm">Hunza</h3>
            <p className="text-white/80 text-body-sm mt-1">Valley of Giants</p>
          </div>
        </div>
      </div>
    </section>
  );
}
