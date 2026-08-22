// Copyright (c) 2025 Khan Familia Travels — Hamdan Ahmad Khan
// All rights reserved.

import type { Server } from 'node:http';

import { createApp } from './app.js';
import { env } from './env.js';
import { logger } from './logger.js';
import { prisma } from './infrastructure/database/client.js';

export const startServer = (): Server => {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'API server listening');
  });

  const gracefulShutdown = (signal: string) => {
    logger.info({ signal }, 'Received kill signal, shutting down gracefully');
    server.close(() => {
      logger.info('Closed out remaining HTTP connections');
      void prisma.$disconnect().finally(() => {
        process.exit(0);
      });
    });

    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return server;
};
