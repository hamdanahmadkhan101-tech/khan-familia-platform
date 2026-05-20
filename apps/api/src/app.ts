import express from 'express';

import { requestLogger } from './logger.js';
import { errorHandler } from './middleware/error.js';
import { notFoundHandler } from './middleware/not-found.js';
import { clerkWebhookHandler } from './modules/iam/clerk-webhook.js';
import { iamRouter } from './modules/iam/routes.js';
import { healthRouter } from './routes/health.js';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');

  // Clerk webhooks require the raw body for Svix signature verification.
  app.post('/webhooks/clerk', express.raw({ type: 'application/json' }), clerkWebhookHandler);

  app.use(express.json());
  app.use(requestLogger);

  app.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/health', healthRouter);
  app.use('/iam', iamRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
