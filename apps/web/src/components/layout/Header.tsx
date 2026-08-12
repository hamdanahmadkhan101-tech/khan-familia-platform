'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { HeaderUserButton } from './HeaderUserButton';
import { cn } from '@khan-familia/ui';
import { Bell, HelpCircle } from 'lucide-react';
import { Button, Skeleton } from '@khan-familia/ui';

export function Header() {
  const { isSignedIn, isLoaded } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Explore', href: '/' },
    { name: 'Destinations', href: '#', disabled: true },
    { name: 'Hotels', href: '/properties' },
    { name: 'Packages', href: '#', disabled: true },
    { name: 'Support', href: '#', disabled: true },
  ];

  return (
    <header
      className={cn(
        'relative w-full border-b border-outline-variant flex justify-between items-center px-4 md:px-8 max-w-full mx-auto transition-all duration-300',
        scrolled ? 'shadow-md py-3 bg-white/95 backdrop-blur-md' : 'py-4 bg-surface',
      )}
    >
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-12 h-12 rounded-full overflow-hidden mix-blend-multiply">
            <Image src="/logo.jpeg" alt="Khan Familia Travels Logo" fill className="object-cover" />
          </div>
          <span className="text-headline-sm font-headline-sm font-bold text-primary hidden sm:block">
            Khan Familia Travels
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = link.href === '/' ? pathname === '/' : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  'font-label-md transition-colors',
                  isActive
                    ? 'text-secondary font-bold border-b-2 border-secondary pb-1'
                    : 'text-on-surface-variant font-medium',
                  link.disabled
                    ? 'opacity-50 cursor-not-allowed pointer-events-none'
                    : 'hover:text-primary',
                )}
                aria-disabled={link.disabled}
                tabIndex={link.disabled ? -1 : undefined}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 mr-4">
          <Link
            href="/host"
            className="text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2 rounded-full transition-colors hidden xl:block"
          >
            Become a Host
          </Link>
          <button className="p-2 hover:bg-surface-container-low transition-colors rounded-full text-on-surface-variant">
            <Bell className="w-6 h-6 stroke-[1.5px]" />
          </button>
          <button className="p-2 hover:bg-surface-container-low transition-colors rounded-full text-on-surface-variant">
            <HelpCircle className="w-6 h-6 stroke-[1.5px]" />
          </button>
        </div>

        {!isLoaded ? (
          <Skeleton className="h-10 w-10 rounded-full" />
        ) : isSignedIn ? (
          <HeaderUserButton />
        ) : (
          <>
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild className="rounded-full px-6">
              <Link href="/sign-up">Join Now</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
