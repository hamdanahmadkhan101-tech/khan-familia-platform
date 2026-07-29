import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { CheckoutWizard } from '@/components/checkout/CheckoutWizard';

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
