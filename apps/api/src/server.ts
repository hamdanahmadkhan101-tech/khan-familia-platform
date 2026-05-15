import type { Server } from 'node:http';

import { createApp } from './app.js';
import { env } from './env.js';
import { logger } from './logger.js';

export const startServer = (): Server => {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'API server listening');
  });

  return server;
};
