'use client';

import { useQueryState } from 'nuqs';
import { formatIsoDate, addDays } from '@khan-familia/utils';
import { Info, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent, Calendar, Button, Label } from '@khan-familia/ui';
import { cn } from '@khan-familia/ui';

interface BookingSidebarProps {
  minPrice: number | null;
}

export function BookingSidebar({ minPrice }: BookingSidebarProps) {
  const [checkIn, setCheckIn] = useQueryState('checkIn');
  const [checkOut, setCheckOut] = useQueryState('checkOut');

  const today = formatIsoDate(new Date(), 'yyyy-MM-dd');
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
          <Label htmlFor="checkIn" className="text-sm font-semibold text-foreground">
            Check-in
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal rounded-2xl border border-white/50 dark:border-white/10 bg-white/50 dark:bg-black/50 px-4 py-6 text-sm backdrop-blur-md transition-all hover:bg-white/80 focus:border-primary focus:bg-background',
                  !checkIn && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkIn ? formatIsoDate(new Date(checkIn), 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={checkIn ? new Date(checkIn) : undefined}
                onSelect={(date) => {
                  if (date) {
                    const newCheckIn = formatIsoDate(date, 'yyyy-MM-dd');
                    setCheckIn(newCheckIn);
                    if (checkOut && newCheckIn >= checkOut) {
                      setCheckOut(formatIsoDate(addDays(date, 1), 'yyyy-MM-dd'));
                    }
                  } else {
                    setCheckIn(null);
                  }
                }}
                disabled={(date) => date < new Date(today)}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="checkOut" className="text-sm font-semibold text-foreground">
            Check-out
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal rounded-2xl border border-white/50 dark:border-white/10 bg-white/50 dark:bg-black/50 px-4 py-6 text-sm backdrop-blur-md transition-all hover:bg-white/80 focus:border-primary focus:bg-background',
                  !checkOut && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkOut ? formatIsoDate(new Date(checkOut), 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={checkOut ? new Date(checkOut) : undefined}
                onSelect={(date) => {
                  if (date) {
                    setCheckOut(formatIsoDate(date, 'yyyy-MM-dd'));
                  } else {
                    setCheckOut(null);
                  }
                }}
                disabled={(date) => (checkIn ? date <= new Date(checkIn) : date <= new Date())}
                autoFocus
              />
            </PopoverContent>
          </Popover>
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
