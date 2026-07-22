'use client';

import { useQueryState } from 'nuqs';
import { format, addDays } from 'date-fns';
import { CalendarRange } from 'lucide-react';

interface BookingSidebarProps {
  minPrice: number | null;
}

export function BookingSidebar({ minPrice }: BookingSidebarProps) {
  const [checkIn, setCheckIn] = useQueryState('checkIn');
  const [checkOut, setCheckOut] = useQueryState('checkOut');

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  return (
    <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 border-b border-border pb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">
            PKR {minPrice?.toLocaleString() ?? 'N/A'}
          </span>
          <span className="text-muted-foreground">/ night</span>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <CalendarRange className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-foreground">Select Dates</h4>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="checkIn" className="text-sm font-medium text-muted-foreground">
            Check-in
          </label>
          <input
            type="date"
            id="checkIn"
            min={today}
            value={checkIn || ''}
            onChange={(e) => {
              setCheckIn(e.target.value);
              // Ensure checkout is at least 1 day after checkin
              if (checkOut && e.target.value >= checkOut) {
                setCheckOut(format(addDays(new Date(e.target.value), 1), 'yyyy-MM-dd'));
              }
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="checkOut" className="text-sm font-medium text-muted-foreground">
            Check-out
          </label>
          <input
            type="date"
            id="checkOut"
            min={checkIn ? format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd') : tomorrow}
            value={checkOut || ''}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
        Select your travel dates above. Then, choose a room from the list and click Reserve to lock
        in your stay.
      </div>
    </div>
  );
}
