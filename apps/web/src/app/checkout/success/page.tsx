'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { GuestBooking } from '@khan-familia/types';
import { useApi } from '@/hooks/useApi';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, CalendarDays, MapPin, Users, ArrowRight, Home } from 'lucide-react';

import { useHoldSession } from '@/hooks/useHoldSession';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const client = useApi();
  const { clearHold } = useHoldSession();

  const paymentIntentId = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  const [booking, setBooking] = useState<GuestBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentIntentId) {
      setError('No payment intent found in URL.');
      setIsLoading(false);
      return;
    }

    if (redirectStatus && redirectStatus !== 'succeeded') {
      setError(`Payment status is ${redirectStatus}. Please try again.`);
      setIsLoading(false);
      return;
    }

    if (!client) return;

    let isSubscribed = true;

    client
      .confirmPaymentIntent(paymentIntentId)
      .then(({ booking: confirmedBooking }) => {
        if (!isSubscribed) return;
        setBooking(confirmedBooking);
        clearHold();
        toast.success('Payment successful! Your booking is confirmed 🎉');
      })
      .catch((err: unknown) => {
        if (!isSubscribed) return;
        const msg = err instanceof Error ? err.message : 'Could not confirm booking.';
        setError(msg);
      })
      .finally(() => {
        if (isSubscribed) setIsLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [client, paymentIntentId, redirectStatus]);

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h2 className="mt-4 text-xl font-semibold text-foreground">Confirming your booking...</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We are verifying your payment with Stripe. Please wait a moment.
        </p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8">
          <h2 className="text-xl font-bold text-destructive">Booking Confirmation Issue</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {error || 'Unable to retrieve booking details.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => router.push('/dashboard/bookings')}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go to My Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  const priceSnapshot = booking.BookingPriceSnapshot;
  const formattedPrice = priceSnapshot
    ? `${priceSnapshot.currency} ${(priceSnapshot.totalMinor / 100).toLocaleString('en-PK')}`
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-xl md:p-10">
        {/* Celebration Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-500/5">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
            Booking Confirmed!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Thank you for booking with Khan Familia Travels. We have reserved your accommodation.
          </p>
          <div className="mt-3 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            Reference ID: <span className="font-mono text-foreground">{booking.id}</span>
          </div>
        </div>

        {/* Property & Stay Summary */}
        <div className="mt-8 space-y-6 border-t border-border pt-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">{booking.property.name}</h2>
            {booking.unitType && (
              <p className="text-sm text-muted-foreground">{booking.unitType.name}</p>
            )}
            <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span>
                {booking.property.address || booking.property.city}, {booking.property.country}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-muted/20 p-4 text-sm">
            <div>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 text-primary" /> Check-in
              </span>
              <p className="mt-1 font-semibold text-foreground">
                {new Date(booking.checkIn).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              {booking.property.checkInTime && (
                <p className="text-xs text-muted-foreground">From {booking.property.checkInTime}</p>
              )}
            </div>

            <div>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 text-primary" /> Check-out
              </span>
              <p className="mt-1 font-semibold text-foreground">
                {new Date(booking.checkOut).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              {booking.property.checkOutTime && (
                <p className="text-xs text-muted-foreground">
                  Until {booking.property.checkOutTime}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-between border-t border-border pt-4 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" /> Guests & Duration
            </span>
            <span className="font-medium text-foreground">
              {booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'} • {booking.nights}{' '}
              {booking.nights === 1 ? 'Night' : 'Nights'}
            </span>
          </div>

          {formattedPrice && (
            <div className="flex justify-between border-t border-border pt-4 text-base font-bold text-foreground">
              <span>Total Paid</span>
              <span className="text-emerald-600">{formattedPrice}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/bookings"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            View in My Bookings <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted"
          >
            <Home className="h-4 w-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center p-6 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">Loading confirmation...</h2>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
