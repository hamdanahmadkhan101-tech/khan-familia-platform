'use client';

import { useEffect, useState } from 'react';
import type { GuestBooking } from '@khan-familia/types';
import { useApi } from '@/hooks/useApi';
import { BookingCard } from '@/components/dashboard/BookingCard';
import { Loader2, CalendarX } from 'lucide-react';

// ---------------------------------------------------------------------------
// Scope tabs config
// ---------------------------------------------------------------------------

type Scope = 'upcoming' | 'past' | 'cancelled';

const TABS: { value: Scope; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BookingsPage() {
  const client = useApi();
  const [scope, setScope] = useState<Scope>('upcoming');
  const [bookings, setBookings] = useState<GuestBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    client
      .listGuestBookings({ scope })
      .then(({ bookings: data }) => {
        if (!cancelled) setBookings(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load bookings.';
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [client, scope]);

  return (
    <section>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage all your property reservations.
        </p>
      </div>

      {/* Scope tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-muted/40 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            id={`bookings-tab-${tab.value}`}
            onClick={() => setScope(tab.value)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              scope === tab.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[50vh]">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState scope={scope} />
        ) : (
          <ul className="space-y-4">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <BookingCard booking={booking} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ scope }: { scope: Scope }) {
  const messages: Record<Scope, { title: string; body: string }> = {
    upcoming: {
      title: 'No upcoming bookings',
      body: 'Browse our properties and make your first reservation!',
    },
    past: {
      title: 'No past stays yet',
      body: 'Your completed stays will appear here.',
    },
    cancelled: {
      title: 'No cancelled bookings',
      body: 'Cancelled reservations will appear here.',
    },
  };

  const { title, body } = messages[scope];

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 py-20 text-center">
      <CalendarX className="h-10 w-10 text-muted-foreground/50" />
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      {scope === 'upcoming' && (
        <a
          href="/properties"
          className="mt-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Browse Properties
        </a>
      )}
    </div>
  );
}
