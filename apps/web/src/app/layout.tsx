import './globals.css';
import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';

import { siteMetadata } from '@/lib/metadata';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = siteMetadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="flex min-h-screen flex-col antialiased">
        <Header />
        <main className="flex-1 flex flex-col pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
