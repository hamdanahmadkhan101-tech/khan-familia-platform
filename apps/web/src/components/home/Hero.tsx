'use client';

import { MapPin, Calendar as CalendarIcon, Users, Search, Bed, Compass } from 'lucide-react';
import { Button, Input, Calendar, Popover, PopoverContent, PopoverTrigger } from '@khan-familia/ui';
import { useState } from 'react';
import { formatIsoDate } from '@khan-familia/utils';
import { cn } from '@khan-familia/ui';

export function Hero() {
  const [date, setDate] = useState<Date>();

  return (
    <section className="w-full relative min-h-[870px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 hero-gradient"></div>
      <div className="relative z-10 w-full max-w-7xl px-8 text-center mt-[72px]">
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg leading-tight">
          Your Gateway to the <br />
          <span className="text-secondary">Pakistani Heavens</span>
        </h1>
        <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto mb-12 drop-shadow-md">
          Directly book the finest stays and curated adventure tours across the majestic North.
        </p>

        {/* Universal Search Bar */}
        <div className="glass-effect p-2 rounded-full max-w-5xl mx-auto shadow-2xl flex flex-col md:flex-row items-stretch md:items-center gap-2 border border-white/20">
          <div className="flex-1 flex items-center px-6 gap-3 group">
            <MapPin className="w-6 h-6 text-secondary" />
            <div className="text-left w-full">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Location
              </p>
              <Input
                className="w-full bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-8 text-base font-semibold text-primary placeholder:text-primary/70"
                placeholder="Where to?"
                type="text"
              />
            </div>
          </div>

          <div className="hidden md:block w-px h-10 bg-white/20"></div>

          <Popover>
            <PopoverTrigger asChild>
              <div className="flex-1 flex items-center px-6 gap-3 group cursor-pointer hover:bg-white/10 rounded-full transition-colors py-2">
                <CalendarIcon className="w-6 h-6 text-secondary" />
                <div className="text-left w-full">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Dates
                  </p>
                  <p
                    className={cn(
                      'text-base font-semibold h-8 leading-8 text-primary',
                      !date && 'text-primary/70 font-normal',
                    )}
                  >
                    {date ? formatIsoDate(date, 'PPP') : 'Add dates'}
                  </p>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} autoFocus />
            </PopoverContent>
          </Popover>

          <div className="hidden md:block w-px h-10 bg-white/20"></div>

          <div className="flex-1 flex items-center px-6 gap-3 group">
            <Users className="w-6 h-6 text-secondary" />
            <div className="text-left w-full">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Travelers
              </p>
              <Input
                className="w-full bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-8 text-base font-semibold text-primary placeholder:text-primary/70"
                placeholder="Add guests"
                type="text"
              />
            </div>
          </div>

          <Button
            size="lg"
            className="rounded-full px-8 py-7 flex items-center justify-center gap-2 shadow-lg shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Search className="w-5 h-5" />
            Search
          </Button>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-full px-6 py-2.5 border border-white/20 flex items-center gap-2 text-white text-sm font-semibold cursor-pointer hover:bg-white/20 transition-all">
            <Bed className="w-5 h-5 text-secondary" />
            Stays
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-full px-6 py-2.5 border border-white/20 flex items-center gap-2 text-white text-sm font-semibold cursor-pointer hover:bg-white/20 transition-all">
            <Compass className="w-5 h-5 text-secondary" />
            Expeditions
          </div>
        </div>
      </div>
    </section>
  );
}
