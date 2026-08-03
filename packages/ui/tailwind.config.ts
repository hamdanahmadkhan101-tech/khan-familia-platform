import type { Config } from 'tailwindcss';
import sharedConfig from '@khan-familia/config/tailwind.config';

const config = {
  ...sharedConfig,
  content: ['./src/**/*.{ts,tsx}'],
} satisfies Config;

export default config;
