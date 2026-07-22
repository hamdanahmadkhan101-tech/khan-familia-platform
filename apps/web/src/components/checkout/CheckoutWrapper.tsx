'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

// Load Stripe outside of components to avoid recreating the object
const stripePromise = loadStripe(process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'] || '');

interface CheckoutWrapperProps {
  clientSecret: string;
  amount: number;
}

export function CheckoutWrapper({ clientSecret, amount }: CheckoutWrapperProps) {
  if (!process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY']) {
    return (
      <div className="rounded-xl border border-destructive bg-destructive/10 p-6 text-destructive">
        <h3 className="font-bold">Missing Stripe Configuration</h3>
        <p className="mt-2 text-sm">
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in your environment variables.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center gap-2 border-b border-border pb-4 text-primary">
              <ShieldCheck className="h-6 w-6" />
              <h2 className="text-xl font-bold">Secure Payment</h2>
            </div>
            <CheckoutForm />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground">Order Summary</h3>
            <div className="mt-6 space-y-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>PKR {(amount / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxes & Fees</span>
                <span>Included</span>
              </div>
              <div className="border-t border-border pt-4 flex justify-between font-bold text-foreground text-lg">
                <span>Total</span>
                <span>PKR {(amount / 100).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Elements>
  );
}

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    if (error) {
      toast.error(error.message || 'An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement className="min-h-[250px]" />

      <button
        disabled={isLoading || !stripe || !elements}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          'Pay & Confirm Booking'
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Your payment is securely processed by Stripe. We do not store your credit card details.
      </p>
    </form>
  );
}
