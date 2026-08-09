import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { CheckoutWizard } from '@/components/checkout/CheckoutWizard';
import { verifyHoldStatusAction } from './actions';
import Link from 'next/link';
import { Clock, Home, CalendarDays } from 'lucide-react';
import { ClearHoldSession } from '@/components/checkout/ClearHoldSession';

export default async function CheckoutPage(props: { params: Promise<{ holdToken: string }> }) {
  const params = await props.params;
  const { getToken, userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const token = await getToken();
  if (!token) {
    redirect('/sign-in');
  }

  const { isValid } = await verifyHoldStatusAction(params.holdToken);

  if (!isValid) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center p-4">
        <ClearHoldSession />
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Clock className="h-10 w-10" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Session Expired
          </h1>
          <p className="mt-4 text-muted-foreground">
            Your checkout session has expired, or the booking has already been confirmed. Holds are
            only valid for 15 minutes to ensure fair availability.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
            <Link
              href="/account/bookings"
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
            >
              <CalendarDays className="h-4 w-4" /> My Bookings
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 font-semibold text-foreground hover:bg-muted transition-all"
            >
              <Home className="h-4 w-4" /> Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background pb-32 pt-24">
      {/* Soft glowing ambient background */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 opacity-50 blur-[120px] mix-blend-screen" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Let's get you booked! 🌴
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Provide guest details and securely complete your payment to confirm the reservation.
          </p>
        </div>

        <CheckoutWizard holdToken={params.holdToken} />
      </div>
    </main>
  );
}
