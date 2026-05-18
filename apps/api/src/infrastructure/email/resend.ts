import { env } from '../../env.js';

/**
 * Email sending is handled exclusively by the worker.
 * This provides the API key for worker-side email sending via Resend.
 * Do NOT send emails directly from the API.
 */
export const resendApiKey = env.RESEND_API_KEY;
