import Image from 'next/image';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';

/**
 * Server Component — uses auth() to check sign-in state on the server.
 * Renders UserButton for signed-in users, Sign In/Sign Up links for guests.
 */
export async function Header() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background/60 backdrop-blur-md border-b border-border shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border shadow-sm bg-white">
            <Image
              src="/logo.jpeg"
              alt="Khan Familia Travels Logo"
              fill
              className="object-cover mix-blend-multiply"
              priority
            />
          </div>
          <span className="hidden sm:block text-xl font-bold tracking-tight text-foreground">
            Khan Familia Travels
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/properties"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Properties
          </Link>

          {isSignedIn ? (
            /* Authenticated — show Clerk's UserButton (avatar + dropdown) */
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-9 w-9 rounded-full border border-border shadow-sm',
                },
              }}
            />
          ) : (
            /* Guest — show Sign In / Sign Up buttons */
            <div className="flex items-center gap-3">
              <Link
                href="/sign-in"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-full shadow hover:bg-primary/90 transition-transform hover:scale-105"
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
