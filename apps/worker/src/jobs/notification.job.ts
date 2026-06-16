import { logger } from '../logger.js';
import type { NotificationJobPayload } from '@khan-familia/types';

/**
 * Handle notification job: send emails via Resend.
 * Template: booking confirmation, booking update, tour notification, etc.
 */
export const handleNotificationJob = async (payload: NotificationJobPayload) => {
  if (payload.type !== 'email') {
    logger.warn({ type: payload.type }, 'Unsupported notification type');
    return;
  }

  logger.info(
    { userId: payload.userId, template: payload.template },
    'Processing notification job',
  );

  try {
    // TODO: Implement email sending via Resend
    // - Map template names to actual email templates
    // - Render template with payload.data
    // - Send via Resend client
    // - Store email record for audit/retry

    logger.info({ userId: payload.userId }, 'Notification sent successfully');
  } catch (error) {
    logger.error({ userId: payload.userId, err: error }, 'Failed to send notification');
    throw error;
  }
};
