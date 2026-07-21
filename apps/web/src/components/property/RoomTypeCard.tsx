'use client';

import Image from 'next/image';
import { Users, LayoutTemplate, Coffee, Bed, ArrowRight } from 'lucide-react';
import type { PublicUnitType } from '@khan-familia/types';

interface RoomTypeCardProps {
  room: PublicUnitType;
}

export function RoomTypeCard({ room }: RoomTypeCardProps) {
  const primaryImage = room.images?.[0];

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50 sm:flex-row">
      {/* Image Section */}
      <div className="relative aspect-video w-full sm:w-1/3 sm:min-w-[240px]">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={room.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Bed className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="text-xl font-bold text-foreground">{room.name}</h3>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 opacity-70" />
              <span>Up to {room.capacity} guests</span>
            </div>
            <div className="flex items-center gap-1.5">
              <LayoutTemplate className="h-4 w-4 opacity-70" />
              <span>1 King Bed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coffee className="h-4 w-4 opacity-70" />
              <span>Breakfast included</span>
            </div>
          </div>

          {room.description && (
            <p className="mt-4 line-clamp-2 text-sm text-muted-foreground/80">{room.description}</p>
          )}
        </div>

        <div className="mt-6 flex flex-col justify-between gap-4 border-t border-border pt-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs text-muted-foreground">Price per night</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">
                PKR {room.defaultRate?.toLocaleString() ?? 'N/A'}
              </span>
            </div>
          </div>

          <button
            disabled
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            title="Booking will be available in the next phase"
          >
            Book Now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
