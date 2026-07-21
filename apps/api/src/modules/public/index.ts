/**
 * Public endpoints — No authentication required.
 * Allows guests to discover properties and rooms.
 */
export const PUBLIC_MODULE = 'public' as const;

export { publicRouter } from './routes.js';
