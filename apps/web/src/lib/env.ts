export const publicEnv = {
  appName: process.env['NEXT_PUBLIC_APP_NAME'] ?? 'Khan Familia Platform',
  apiBaseUrl: process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3001',
  clerkPublishableKey: process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'] ?? '',
};
