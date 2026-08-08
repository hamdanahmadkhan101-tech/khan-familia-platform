import { z } from 'zod';

const envSchema = z.object({
  appName: z.string().default('Khan Familia Platform'),
  apiBaseUrl: z.string().url().default('http://localhost:3001'),
  clerkPublishableKey: z.string().min(1),
});

export const publicEnv = envSchema.parse({
  appName: process.env['NEXT_PUBLIC_APP_NAME'],
  apiBaseUrl: process.env['NEXT_PUBLIC_API_BASE_URL'],
  clerkPublishableKey: process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'],
});
