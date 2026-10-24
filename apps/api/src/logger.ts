import pino from 'pino';
import { pinoHttp, type GenReqId } from 'pino-http';
import { randomUUID } from 'node:crypto';

import { SERVICE_NAMES, LOG_REDACTION_PATHS } from '@khan-familia/constants';
import { SAFE_LOG_SERIALIZERS, safeLogMethod } from '@khan-familia/utils';

import { env } from './env.js';

export const logger = pino({
  name: SERVICE_NAMES.api,
  level: env.LOG_LEVEL,
  base: { service: SERVICE_NAMES.api, appEnv: env.APP_ENV },
  serializers: SAFE_LOG_SERIALIZERS,
  hooks: { logMethod: safeLogMethod },
  redact: { paths: LOG_REDACTION_PATHS, remove: true },
});

const generateRequestId: GenReqId = (req, res) => {
  const requestIdHeader = req.headers['x-request-id'];

  if (
    typeof requestIdHeader === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestIdHeader)
  ) {
    return requestIdHeader;
  }

  void res;
  return randomUUID();
};

export const requestLogger = pinoHttp({
  logger,
  serializers: SAFE_LOG_SERIALIZERS,
  genReqId: generateRequestId,
  customProps: (req, res) => {
    void res;

    const route = (req as { route?: { path?: unknown } }).route?.path;
    return { requestId: req.id, ...(typeof route === 'string' ? { route } : {}) };
  },
});
