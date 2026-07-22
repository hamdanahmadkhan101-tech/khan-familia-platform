import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { api } from '@/lib/api';
import { CheckoutWrapper } from '@/components/checkout/CheckoutWrapper';

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

  // Set the token for the SDK on this server request
  const client = {
    ...api,
    createPaymentIntent: async (holdToken: string) => {
      const res = await fetch(`${api.baseUrl}/payments/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ holdToken }),
      });
      if (!res.ok) {
        throw new Error('Failed to create payment intent');
      }
      return res.json();
    },
  };

  let paymentIntent;
  try {
    paymentIntent = await client.createPaymentIntent(params.holdToken);
  } catch {
    // Hold expired or not found
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold text-foreground">Checkout Expired</h1>
          <p className="mb-6 text-muted-foreground">
            Your temporary hold on this room has expired. Please go back to the property and try
            reserving it again.
          </p>
          <a
            href="/"
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 pb-24 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Complete Your Booking</h1>
          <p className="mt-2 text-muted-foreground">
            You are one step away from confirming your stay. Secure your reservation by completing
            the payment below.
          </p>
        </div>

        <CheckoutWrapper clientSecret={paymentIntent.clientSecret} amount={paymentIntent.amount} />
      </div>
    </main>
  );
}
