import type { ReactNode } from 'react';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { BookOpen, User, Settings, LayoutDashboard } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard/bookings', icon: BookOpen, label: 'My Bookings' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
] as const;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:w-60">
          {/* Panel heading */}
          <div className="mb-4 flex items-center gap-2 px-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Dashboard
            </span>
          </div>

          <nav className="flex flex-row gap-1 lg:flex-col">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
