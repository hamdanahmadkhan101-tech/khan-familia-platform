// Copyright (c) 2025 Khan Familia Travels — Hamdan Ahmad Khan
// All rights reserved.

import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { env } from './env.js';
import { requestLogger } from './logger.js';
import { notFoundHandler } from './middleware/not-found.js';
import { clerkWebhookHandler, iamRouter } from './modules/iam/index.js';
import { catalogAdminRouter, catalogRouter } from './modules/catalog/index.js';
import { tenancyRouter } from './modules/tenancy/index.js';
import { inventoryRouter } from './modules/inventory/index.js';
import { bookingRouter } from './modules/booking/index.js';
import { paymentsRouter } from './modules/payments/index.js';
import { stripeWebhookController } from './modules/payments/payment.controller.js';
import { healthRouter } from './routes/health.js';
import { errorHandler } from './shared/middleware/error.js';

const allowedOrigins = [env.CORS_ORIGIN, ...(env.CORS_ORIGINS?.split(',') ?? [])]
  .filter((origin): origin is string => typeof origin === 'string' && origin.trim().length > 0)
  .map((origin) => origin.trim());

const corsOptions =
  allowedOrigins.length > 0
    ? {
        origin: allowedOrigins,
        credentials: true,
      }
    : {
        origin: false,
      };

const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/webhooks/clerk',
});

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(requestLogger);
  app.use(rateLimiter);

  // Clerk webhooks require the raw body for Svix signature verification.
  app.post('/webhooks/clerk', express.raw({ type: 'application/json' }), clerkWebhookHandler);

  // Stripe webhooks require the raw body for signature verification.
  // This MUST be registered BEFORE express.json() is applied globally.
  app.post(
    '/payments/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    stripeWebhookController,
  );

  // Parse JSON bodies for all other routes
  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/health', healthRouter);
  app.use('/iam', iamRouter);
  app.use('/tenants', tenancyRouter);
  app.use('/properties', catalogRouter);
  app.use('/admin/properties', catalogAdminRouter);
  app.use('/inventory', inventoryRouter);
  app.use('/bookings', bookingRouter);
  app.use('/payments', paymentsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
