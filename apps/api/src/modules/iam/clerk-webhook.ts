import type { Request, Response } from 'express';
import { Webhook } from 'svix';

import { env } from '../../env.js';
import { prisma } from '../../infrastructure/database/client.js';
import { logger } from '../../logger.js';
import { softDeleteUserByClerkId, upsertUserFromClerkPayload } from './sync-user.service.js';

type ClerkWebhookEvent = {
  type: string;
  data: unknown;
};

/**
 * Clerk → Postgres user sync. Mount with `express.raw({ type: 'application/json' })` before `express.json()`.
 */
export const clerkWebhookHandler = async (req: Request, res: Response): Promise<void> => {
  if (!env.CLERK_WEBHOOK_SECRET) {
    res.status(503).json({ error: 'CLERK_WEBHOOK_SECRET is not configured' });
    return;
  }

  const svixId = req.get('svix-id');
  const svixTimestamp = req.get('svix-timestamp');
  const svixSignature = req.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ error: 'Missing Svix headers' });
    return;
  }

  const payload = req.body;
  const body = Buffer.isBuffer(payload) ? payload.toString('utf8') : String(payload ?? '');

  let evt: ClerkWebhookEvent;

  try {
    const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    logger.warn({ err }, 'Clerk webhook signature verification failed');
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  try {
    switch (evt.type) {
      case 'user.created':
      case 'user.updated':
        await upsertUserFromClerkPayload(prisma, evt.data);
        break;
      case 'user.deleted':
        if (typeof evt.data === 'object' && evt.data !== null && 'id' in evt.data) {
          await softDeleteUserByClerkId(prisma, String((evt.data as { id: string }).id));
        }
        break;
      default:
        break;
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err, type: evt.type }, 'Clerk webhook handler failed');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
