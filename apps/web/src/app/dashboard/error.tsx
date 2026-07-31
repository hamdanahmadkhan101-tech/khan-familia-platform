'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
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
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
        Dashboard Unavailable
      </h2>
      <p className="mt-4 max-w-sm text-muted-foreground">
        We couldn't load your dashboard data. Please check your connection or try again.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={() => reset()}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
        >
          <RefreshCcw className="h-4 w-4" /> Refresh Dashboard
        </button>
        <Link
          href="/"
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 font-semibold text-foreground transition-all hover:bg-muted"
        >
          <Home className="h-4 w-4" /> Go Home
        </Link>
      </div>
    </div>
  );
}
