'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
        Checkout Unavailable
      </h2>
      <p className="mt-4 max-w-sm text-muted-foreground">
        Something went wrong during checkout. Your payment has not been processed. Please try again
        or contact support if the issue persists.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={() => reset()}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
        >
          <RefreshCcw className="h-4 w-4" /> Try Again
        </button>
        <Link
          href="/properties"
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 font-semibold text-foreground transition-all hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Properties
        </Link>
      </div>
    </div>
  );
}
