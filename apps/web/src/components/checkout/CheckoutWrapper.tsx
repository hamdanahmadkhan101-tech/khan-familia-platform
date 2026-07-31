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
        <h3 className="font-bold">Payment System Unavailable</h3>
        <p className="mt-2 text-sm">
          We are currently unable to process payments. Please try again later or contact support if
          the issue persists.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-[2rem] border border-white/40 dark:border-white/10 bg-white/50 dark:bg-black/50 p-6 sm:p-8 shadow-lg backdrop-blur-md">
            <div className="mb-8 flex items-center gap-3 border-b border-border/50 pb-6 text-primary">
              <ShieldCheck className="h-7 w-7" />
              <h2 className="font-display text-2xl font-bold">Secure Payment</h2>
            </div>
            <CheckoutForm />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 overflow-hidden rounded-[2rem] border border-white/40 dark:border-white/10 bg-white/50 dark:bg-black/50 p-6 shadow-lg backdrop-blur-md">
            <h3 className="font-display text-xl font-bold text-foreground">Order Summary</h3>
            <div className="mt-8 space-y-5">
              <div className="flex justify-between text-muted-foreground">
                <span className="font-medium">Subtotal</span>
                <span className="font-semibold text-foreground">
                  PKR {(amount / 100).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span className="font-medium">Taxes & Fees</span>
                <span className="font-semibold text-foreground">Included</span>
              </div>
              <div className="border-t border-border/50 pt-5 flex justify-between font-display text-xl font-bold text-foreground">
                <span>Total</span>
                <span className="text-primary">PKR {(amount / 100).toLocaleString()}</span>
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
