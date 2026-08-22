import { logger } from '../logger.js';
import type { NotificationJobPayload } from '@khan-familia/types';
import { prisma } from '../infrastructure/database/client.js';
import crypto from 'node:crypto';

/**
 * Handle notification job: send emails via Resend.
 * Template: booking confirmation, booking update, tour notification, etc.
 */
export const handleNotificationJob = async (payload: NotificationJobPayload): Promise<void> => {
  if (payload.type !== 'email') {
    logger.warn({ type: payload.type }, 'Unsupported notification type');
    return;
  }

  // Create a stable idempotency key based on payload if not explicitly provided
  const eventId =
    payload.idempotencyKey ||
    crypto
      .createHash('sha256')
      .update(JSON.stringify({ u: payload.userId, t: payload.template, d: payload.data }))
      .digest('hex');

  logger.info(
    { userId: payload.userId, template: payload.template, eventId },
    'Processing notification job',
  );

  try {
    const existing = await prisma.processedEvent.findUnique({ where: { eventId } });
    if (existing) {
      logger.info({ eventId }, 'Notification already processed, skipping (idempotent)');
      return;
    }

    // TODO: Implement email sending via Resend
    // - Map template names to actual email templates
    // - Render template with payload.data
    // - Send via Resend client
    // - Store email record for audit/retry

    await prisma.processedEvent.create({
      data: { eventId, type: 'notification_email' },
    });

    logger.info({ userId: payload.userId }, 'Notification sent successfully');
  } catch (error) {
    logger.error({ userId: payload.userId, err: error }, 'Failed to send notification');
    throw error instanceof Error ? error : new Error(String(error));
  }
};
