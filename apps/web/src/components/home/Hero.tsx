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
        <h1 className="text-display font-display text-white mb-6 drop-shadow-lg leading-tight">
          Your Gateway to the <br />
          <span className="text-secondary-fixed">Pakistani Heavens</span>
        </h1>
        <p className="text-white/90 text-body-lg max-w-2xl mx-auto mb-12 drop-shadow-md">
          Directly book the finest stays and curated adventure tours across the majestic North.
        </p>

        {/* Universal Search Bar */}
        <div className="glass-effect p-2 rounded-full max-w-5xl mx-auto shadow-2xl flex flex-col md:flex-row items-stretch md:items-center gap-2 border border-white/20">
          <div className="flex-1 flex items-center px-6 gap-3 group">
            <MapPin className="w-6 h-6 text-secondary" />
            <div className="text-left w-full">
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                Location
              </p>
              <Input
                className="w-full bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-6 text-body-md font-semibold text-primary placeholder:text-outline/70"
                placeholder="Where to?"
                type="text"
              />
            </div>
          </div>

          <div className="hidden md:block w-px h-10 bg-outline-variant"></div>

          <Popover>
            <PopoverTrigger asChild>
              <div className="flex-1 flex items-center px-6 gap-3 group cursor-pointer hover:bg-white/10 rounded-xl transition-colors py-2">
                <CalendarIcon className="w-6 h-6 text-secondary" />
                <div className="text-left w-full">
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Dates
                  </p>
                  <p
                    className={cn(
                      'text-body-md font-semibold h-6 leading-6',
                      !date && 'text-outline/70 font-normal',
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

          <div className="hidden md:block w-px h-10 bg-outline-variant"></div>

          <div className="flex-1 flex items-center px-6 gap-3 group">
            <Users className="w-6 h-6 text-secondary" />
            <div className="text-left w-full">
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                Travelers
              </p>
              <Input
                className="w-full bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-6 text-body-md font-semibold text-primary placeholder:text-outline/70"
                placeholder="Add guests"
                type="text"
              />
            </div>
          </div>

          <Button
            size="lg"
            className="rounded-full px-8 py-7 flex items-center justify-center gap-2 shadow-lg shrink-0"
          >
            <Search className="w-5 h-5" />
            Search
          </Button>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 flex items-center gap-2 text-white text-label-md cursor-pointer hover:bg-white/20 transition-all">
            <Bed className="w-5 h-5 text-secondary-fixed" />
            Stays
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 flex items-center gap-2 text-white text-label-md cursor-pointer hover:bg-white/20 transition-all">
            <Compass className="w-5 h-5 text-secondary-fixed" />
            Expeditions
          </div>
        </div>
      </div>
    </section>
  );
}
