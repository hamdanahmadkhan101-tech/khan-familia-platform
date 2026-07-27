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
    <main className="min-h-screen bg-muted/30 pb-24 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Complete Your Booking</h1>
          <p className="mt-2 text-muted-foreground">
            Provide guest details and securely complete your payment to confirm the reservation.
          </p>
        </div>

        <CheckoutWizard holdToken={params.holdToken} />
      </div>
    </main>
  );
}
