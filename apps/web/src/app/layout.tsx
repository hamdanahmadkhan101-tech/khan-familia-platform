import './globals.css';
import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

import { siteMetadata } from '@/lib/metadata';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

import { NuqsAdapter } from 'nuqs/adapters/next/app';

export const metadata: Metadata = siteMetadata;

import { Toaster } from 'sonner';

import { PendingCheckoutBanner } from '@/components/checkout/PendingCheckoutBanner';
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      afterSignOutUrl="/"
    >
      <html lang="en" className={spaceGrotesk.variable}>
        <body className="flex min-h-screen flex-col antialiased">
          <ReactQueryProvider>
            <NuqsAdapter>
              <div className="sticky top-0 z-50 flex w-full flex-col">
                <PendingCheckoutBanner />
                <Header />
              </div>
              <main className="flex-1 flex flex-col">{children}</main>
              <Footer />
              <Toaster position="bottom-right" richColors />
            </NuqsAdapter>
          </ReactQueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
