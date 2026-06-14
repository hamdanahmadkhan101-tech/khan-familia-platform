import Stripe from 'stripe';
import { env } from '../../env.js';

/**
 * Singleton Stripe client.
 * Swap this file for a different provider (JazzCash, EasyPaisa) in the future
 * without touching any business logic.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
});
