import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-background pt-16 pb-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand & Description */}
          <div className="flex flex-col gap-4">
            <span className="text-xl font-bold tracking-tight text-foreground">
              Khan Familia Travels
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Experience the world with Khan Familia Travels. We offer premium stays, effortless
              booking, and unforgettable journeys tailored just for you.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-foreground">
              Explore
            </h3>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  href="/properties"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Browse Properties
                </Link>
              </li>
              <li>
                <Link
                  href="/destinations"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Popular Destinations
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-foreground">
              Account
            </h3>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  href="/sign-in"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Create Account
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  My Bookings
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact Us
            </h3>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Swat Valley, Khyber Pakhtunkhwa, Pakistan
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">+92 300 0000000</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  support@khanfamiliatravels.tech
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-border pt-8 sm:flex sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Khan Familia Travels. All rights reserved.
          </p>
          <div className="mt-4 flex gap-6 sm:mt-0">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
