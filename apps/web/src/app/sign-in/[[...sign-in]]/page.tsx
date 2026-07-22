import { SignIn } from '@clerk/nextjs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Khan Familia Travels',
  description: 'Sign in to your Khan Familia Travels account.',
};

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Branding header above the Clerk card */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to continue your journey with Khan Familia Travels.
          </p>
        </div>

        {/* Clerk's embedded sign-in component — handles all auth flows */}
        <div className="flex justify-center">
          <SignIn
            appearance={{
              variables: {
                colorPrimary: 'hsl(180, 30%, 25%)',
                colorText: 'hsl(222.2, 84%, 4.9%)',
                borderRadius: '0.75rem',
                fontFamily: 'var(--font-sans)',
              },
              elements: {
                card: 'shadow-md border border-border rounded-2xl',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'border border-border hover:bg-accent transition-colors',
                formButtonPrimary:
                  'bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl',
                footerActionLink: 'text-primary hover:underline',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
