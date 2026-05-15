import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Khan Familia Platform',
  description: 'Monorepo foundation scaffold',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
