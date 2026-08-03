'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useHoldSession } from '@/hooks/useHoldSession';
import { Clock, ArrowRight, X } from 'lucide-react';
import { Button } from '@khan-familia/ui';

export function PendingCheckoutBanner() {
  const { activeHold, clearHold } = useHoldSession();
  const pathname = usePathname();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide the banner if the user is already on the checkout page
  // (We don't want to show "Resume Checkout" when they are literally on the checkout page)
  const isCheckoutPage = pathname?.startsWith('/checkout/');

  useEffect(() => {
    if (!activeHold) return;

    const calculateTimeLeft = () => {
      const diff = new Date(activeHold.expiresAt).getTime() - new Date().getTime();
      if (diff <= 0) return '00:00';
      const minutes = Math.floor(diff / 1000 / 60);
      const seconds = Math.floor((diff / 1000) % 60);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeHold]);

  if (!mounted || !activeHold || isCheckoutPage) {
    return null;
  }

  return (
    <div className="relative flex w-full items-center justify-between bg-primary px-4 py-3 text-primary-foreground shadow-md transition-all sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-white/20">
          <Clock className="h-4 w-4" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-semibold">Pending Reservation</span>
          <span className="hidden text-primary-foreground/70 sm:inline">•</span>
          <span className="text-sm">
            {activeHold.roomName} is reserved for {timeLeft}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          asChild
          className="rounded-full px-4 font-bold transition-colors hover:bg-secondary/90"
        >
          <Link href={`/checkout/${activeHold.holdToken}`}>
            Resume <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => clearHold()}
          className="h-8 w-8 rounded-full text-primary-foreground/70 hover:bg-white/20 hover:text-white"
          aria-label="Cancel reservation"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
