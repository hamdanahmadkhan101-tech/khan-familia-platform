import type { GuestBooking, BookingStatus } from '@khan-familia/types';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, MapPin, Users, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@khan-familia/ui';

// ---------------------------------------------------------------------------
// Status badge config — single source of truth, no duplication
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30' },
  BOOKED: {
    label: 'Awaiting Approval',
    className: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  },
  CONFIRMED: {
    label: 'Confirmed',
    className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  },
  CHECKED_IN: { label: 'Checked In', className: 'bg-teal-500/15 text-teal-600 border-teal-500/30' },
  CHECKED_OUT: {
    label: 'Checked Out',
    className: 'bg-slate-500/15 text-slate-500 border-slate-500/30',
  },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-500/15 text-red-600 border-red-500/30' },
  NO_SHOW: { label: 'No Show', className: 'bg-rose-500/15 text-rose-600 border-rose-500/30' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const formatPrice = (snapshot: GuestBooking['BookingPriceSnapshot']) => {
  if (!snapshot) return null;
  // totalMinor is in paisa — divide by 100 to get PKR
  const total = (snapshot.totalMinor / 100).toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${snapshot.currency} ${total}`;
};

// ---------------------------------------------------------------------------
// BookingCard
// ---------------------------------------------------------------------------

interface BookingCardProps {
  booking: GuestBooking;
}

export function BookingCard({ booking }: BookingCardProps) {
  const statusCfg = STATUS_CONFIG[booking.status];
  const primaryImage =
    booking.property.images?.find((img) => img.isPrimary) ?? booking.property.images?.[0];
  const price = formatPrice(booking.BookingPriceSnapshot);

  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 sm:flex-row">
      {/* Property image */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden sm:h-auto sm:w-52">
        {primaryImage?.url ? (
          <Image
            src={primaryImage.url}
            alt={booking.property.name}
            fill
            sizes="(max-width: 640px) 100vw, 208px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
            <span className="text-4xl">🏡</span>
          </div>
        )}

        {/* Status badge — overlaid on image for compact feel */}
        <span
          className={`absolute left-3 top-3 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.className}`}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Body */}
      <CardContent className="flex flex-1 flex-col justify-between gap-4 p-5 pb-5">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
              {booking.property.name}
            </h3>
            {price && <span className="shrink-0 text-sm font-bold text-foreground">{price}</span>}
          </div>

          {booking.unitType && (
            <p className="text-sm text-muted-foreground">{booking.unitType.name}</p>
          )}

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>
              {booking.property.city}, {booking.property.country}
            </span>
          </div>
        </div>

        {/* Dates & guests row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {formatDate(booking.checkIn)}
            <span className="mx-0.5">→</span>
            {formatDate(booking.checkOut)}
          </span>

          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
          </span>

          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0" />
            {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
          </span>

          <Link
            href={`/properties/${booking.property.slug}`}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
          >
            View property <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
