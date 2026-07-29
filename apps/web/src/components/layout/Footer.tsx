import Link from 'next/link';
import Image from 'next/image';
import { Globe, Share2, MessageSquare, CreditCard, Building2, Receipt } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary text-on-primary w-full px-8 pt-16 pb-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start gap-12">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-3 mb-6">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white">
              <Image
                src="/logo.jpeg"
                alt="Khan Familia Travels Logo"
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-headline-sm font-headline-sm text-on-primary font-bold">
              Khan Familia Travels
            </h2>
          </Link>
          <p className="text-tertiary-fixed-dim text-body-sm leading-relaxed">
            Redefining luxury travel in the heart of Northern Pakistan. We handle the logistics so
            you can focus on the journey.
          </p>
          <div className="flex gap-4 mt-8">
            <Link
              href="#"
              className="h-10 w-10 rounded-full border border-tertiary-fixed-dim/30 flex items-center justify-center hover:bg-secondary transition-colors group"
            >
              <Globe className="h-5 w-5 text-tertiary-fixed-dim group-hover:text-white" />
            </Link>
            <Link
              href="#"
              className="h-10 w-10 rounded-full border border-tertiary-fixed-dim/30 flex items-center justify-center hover:bg-secondary transition-colors group"
            >
              <Share2 className="h-5 w-5 text-tertiary-fixed-dim group-hover:text-white" />
            </Link>
            <Link
              href="#"
              className="h-10 w-10 rounded-full border border-tertiary-fixed-dim/30 flex items-center justify-center hover:bg-secondary transition-colors group"
            >
              <MessageSquare className="h-5 w-5 text-tertiary-fixed-dim group-hover:text-white" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:gap-16 w-full lg:w-auto">
          <div>
            <h4 className="text-white font-bold mb-6 text-label-md">Company</h4>
            <ul className="space-y-4">
              <li>
                <Link
                  href="#"
                  className="text-tertiary-fixed-dim hover:text-on-primary transition-colors text-body-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-tertiary-fixed-dim hover:text-on-primary transition-colors text-body-sm"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-tertiary-fixed-dim hover:text-on-primary transition-colors text-body-sm"
                >
                  Partners
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-tertiary-fixed-dim hover:text-on-primary transition-colors text-body-sm"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-label-md">Legal</h4>
            <ul className="space-y-4">
              <li>
                <Link
                  href="#"
                  className="text-tertiary-fixed-dim hover:text-on-primary transition-colors text-body-sm"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-tertiary-fixed-dim hover:text-on-primary transition-colors text-body-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-tertiary-fixed-dim hover:text-on-primary transition-colors text-body-sm"
                >
                  Cookie Settings
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-tertiary-fixed-dim hover:text-on-primary transition-colors text-body-sm"
                >
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-white font-bold mb-6 text-label-md">Support</h4>
            <ul className="space-y-4">
              <li>
                <Link
                  href="#"
                  className="text-tertiary-fixed-dim hover:text-on-primary transition-colors text-body-sm"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-tertiary-fixed-dim hover:text-on-primary transition-colors text-body-sm"
                >
                  Travel Insurance
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-tertiary-fixed-dim hover:text-on-primary transition-colors text-body-sm"
                >
                  Safety Guidelines
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-tertiary-fixed-dim hover:text-on-primary transition-colors text-body-sm"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full pt-8 border-t border-tertiary-fixed-dim/20 mt-16 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-tertiary-fixed-dim text-body-sm">
          © {new Date().getFullYear()} Khan Familia Travels. All rights reserved.
        </p>
        <div className="flex gap-8">
          <CreditCard className="h-6 w-6 text-tertiary-fixed-dim" />
          <Building2 className="h-6 w-6 text-tertiary-fixed-dim" />
          <Receipt className="h-6 w-6 text-tertiary-fixed-dim" />
        </div>
      </div>
    </footer>
  );
}
