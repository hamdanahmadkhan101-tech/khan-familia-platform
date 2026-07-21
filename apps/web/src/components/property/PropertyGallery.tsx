'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
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
      <div className="flex h-[400px] w-full items-center justify-center rounded-2xl border border-border bg-card md:h-[600px]">
        <span className="text-muted-foreground">No images available</span>
      </div>
    );
  }

  return (
    <div className="group relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      {/* Embla Viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-[4/3] w-full min-w-0 flex-[0_0_100%] md:aspect-[16/9] lg:aspect-[21/9]"
            >
              <Image
                src={img.url}
                alt={`${propertyName} - Image ${idx + 1}`}
                fill
                className="object-cover"
                sizes="100vw"
                priority={idx === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60" />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      {images.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-border bg-background/80 p-3 text-foreground backdrop-blur-md transition-all hover:bg-background hover:scale-110 active:scale-95 disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-border bg-background/80 p-3 text-foreground backdrop-blur-md transition-all hover:bg-background hover:scale-110 active:scale-95 disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Counters and UI */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-between px-6">
        <div className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-md">
          {selectedIndex + 1} / {images.length}
        </div>

        <button className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-md transition-colors hover:bg-background">
          <Maximize2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">View fullscreen</span>
        </button>
      </div>
    </div>
  );
}
