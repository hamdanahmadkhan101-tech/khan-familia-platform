'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import type { PropertyImage } from '@khan-familia/types';

interface PropertyGalleryProps {
  images: PropertyImage[];
  propertyName: string;
}

export function PropertyGallery({ images, propertyName }: PropertyGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!images || images.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center rounded-[2rem] border border-border bg-card md:h-[600px]">
        <span className="text-muted-foreground">No images available</span>
      </div>
    );
  }

  // Ensure we have at least 3 images for the Bento Box, otherwise repeat the first one
  const bentoImages = [
    images[0],
    images[1] || images[0],
    images[2] || images[0],
    images[3],
    images[4],
  ].filter(Boolean);

  return (
    <div className="w-full">
      {/* Mobile Carousel (Hidden on md+) */}
      <div className="group relative w-full overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl shadow-primary/5 md:hidden">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square w-full min-w-0 flex-[0_0_100%]">
                <Image
                  src={img.url}
                  alt={`${propertyName} - Image ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={idx === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-40" />
              </div>
            ))}
          </div>
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/20 p-2 text-white backdrop-blur-md transition-all hover:bg-black/40 active:scale-95"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/20 p-2 text-white backdrop-blur-md transition-all hover:bg-black/40 active:scale-95"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        <div className="absolute bottom-4 right-4 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
          {selectedIndex + 1} / {images.length}
        </div>
      </div>

      {/* Desktop Bento Box (Hidden on sm-) */}
      <div className="hidden md:grid h-[500px] lg:h-[600px] grid-cols-4 grid-rows-2 gap-4 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/10">
        {/* Main Hero Image */}
        <div className="relative col-span-2 row-span-2 group overflow-hidden cursor-pointer">
          <Image
            src={bentoImages[0]?.url || ''}
            alt={`${propertyName} main`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
        </div>

        {/* Top Right Image (or top middle if 5 images) */}
        <div
          className={`relative ${bentoImages.length >= 5 ? 'col-span-1' : 'col-span-2'} row-span-1 group overflow-hidden cursor-pointer`}
        >
          <Image
            src={bentoImages[1]?.url || ''}
            alt={`${propertyName} gallery 1`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="25vw"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
        </div>

        {/* Optional Top Right Corner if 5+ images */}
        {bentoImages.length >= 5 && (
          <div className="relative col-span-1 row-span-1 group overflow-hidden cursor-pointer">
            <Image
              src={bentoImages[3]?.url || ''}
              alt={`${propertyName} gallery 2`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="25vw"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
          </div>
        )}

        {/* Bottom Right Image */}
        <div
          className={`relative ${bentoImages.length >= 5 ? 'col-span-1' : 'col-span-2'} row-span-1 group overflow-hidden cursor-pointer`}
        >
          <Image
            src={bentoImages[2]?.url || ''}
            alt={`${propertyName} gallery 3`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="25vw"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
        </div>

        {/* Optional Bottom Right Corner with "Show all photos" if 5+ images */}
        {bentoImages.length >= 5 && (
          <div className="relative col-span-1 row-span-1 group overflow-hidden cursor-pointer">
            <Image
              src={bentoImages[4]?.url || ''}
              alt={`${propertyName} gallery 4`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="25vw"
            />
            <div className="absolute inset-0 bg-black/40 transition-colors duration-500 group-hover:bg-black/20" />
          </div>
        )}

        {/* Floating "Show all photos" Button */}
        <button className="absolute bottom-6 right-6 z-10 flex items-center gap-2 rounded-2xl border border-white/20 bg-background/70 px-5 py-2.5 text-sm font-semibold text-foreground backdrop-blur-xl transition-all hover:bg-background hover:scale-105 shadow-xl shadow-black/10">
          <LayoutGrid className="h-4 w-4" />
          Show all photos
        </button>
      </div>
    </div>
  );
}
