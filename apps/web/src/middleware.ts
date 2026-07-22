import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Routes that are publicly accessible without authentication.
 * Everything else is implicitly private.
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/properties(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // If it's not a public route, enforce authentication.
  if (!isPublicRoute(req)) {
    const { userId } = await auth();

    if (!userId) {
      // Redirect unauthenticated users to sign-in, preserving the intended URL.
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  // Run middleware on all routes except Next.js internals and static files.
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
