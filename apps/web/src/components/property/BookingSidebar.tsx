'use client';

import { useQueryState } from 'nuqs';
import { format, addDays } from 'date-fns';
import { Info } from 'lucide-react';

interface BookingSidebarProps {
  minPrice: number | null;
}

export function BookingSidebar({ minPrice }: BookingSidebarProps) {
  const [checkIn, setCheckIn] = useQueryState('checkIn');
  const [checkOut, setCheckOut] = useQueryState('checkOut');

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  return (
    <div className="sticky top-24 overflow-hidden rounded-[2.5rem] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-black/40 p-8 shadow-2xl shadow-primary/5 backdrop-blur-2xl">
      {/* Subtle shine effect */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent" />

      <div className="relative mb-8 border-b border-border/50 pb-8">
        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
          Starting from
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-display font-bold tracking-tight text-foreground">
            PKR {minPrice?.toLocaleString() ?? 'N/A'}
          </span>
          <span className="text-base font-medium text-muted-foreground">/ night</span>
        </div>
      </div>

      <div className="relative mb-8 space-y-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="checkIn" className="text-sm font-semibold text-foreground">
            Check-in
          </label>
          <input
            type="date"
            id="checkIn"
            min={today}
            value={checkIn || ''}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (checkOut && e.target.value >= checkOut) {
                setCheckOut(format(addDays(new Date(e.target.value), 1), 'yyyy-MM-dd'));
              }
            }}
            className="w-full rounded-2xl border border-white/50 dark:border-white/10 bg-white/50 dark:bg-black/50 px-4 py-3.5 text-sm font-medium text-foreground backdrop-blur-md transition-all hover:bg-white/80 focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="checkOut" className="text-sm font-semibold text-foreground">
            Check-out
          </label>
          <input
            type="date"
            id="checkOut"
            min={checkIn ? format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd') : tomorrow}
            value={checkOut || ''}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full rounded-2xl border border-white/50 dark:border-white/10 bg-white/50 dark:bg-black/50 px-4 py-3.5 text-sm font-medium text-foreground backdrop-blur-md transition-all hover:bg-white/80 focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </div>

      <div className="relative flex items-start gap-3 rounded-2xl bg-primary/10 p-5 text-sm leading-relaxed text-primary">
        <Info className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Select your travel dates above. Then, choose a room from the list on the left and click{' '}
          <strong className="font-semibold">Reserve</strong> to lock in your stay.
        </p>
      </div>
    </div>
  );
}
