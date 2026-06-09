import pino from 'pino';
import { pinoHttp, type GenReqId } from 'pino-http';
import { randomUUID } from 'node:crypto';

import { SERVICE_NAMES } from '@khan-familia/constants';

import { env } from './env.js';

export const logger = pino({
  name: SERVICE_NAMES.api,
  level: env.LOG_LEVEL,
  base: { service: SERVICE_NAMES.api, appEnv: env.APP_ENV },
});

const generateRequestId: GenReqId = (req, res) => {
  const requestIdHeader = req.headers['x-request-id'];

  if (typeof requestIdHeader === 'string' && requestIdHeader.length > 0) {
    return requestIdHeader;
  }

  if (Array.isArray(requestIdHeader) && requestIdHeader[0]) {
    return requestIdHeader[0];
  }

  return req.id ?? res.getHeader('x-request-id')?.toString() ?? randomUUID();
};

export const requestLogger = pinoHttp({
  logger,
  genReqId: generateRequestId,
  customProps: (req, res) => {
    void res;

    return { requestId: req.id };
  },
});
