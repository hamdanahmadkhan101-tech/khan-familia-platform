import pino from 'pino';

import { SERVICE_NAMES, LOG_REDACTION_PATHS } from '@khan-familia/constants';
import { SAFE_LOG_SERIALIZERS, safeLogMethod } from '@khan-familia/utils';
import type { ServiceName } from '@khan-familia/types';

import { env } from './env.js';

const serviceName: ServiceName = SERVICE_NAMES.worker;

export const logger = pino({
  name: serviceName,
  level: env.LOG_LEVEL,
  base: { service: serviceName },
  serializers: SAFE_LOG_SERIALIZERS,
  hooks: { logMethod: safeLogMethod },
  redact: { paths: LOG_REDACTION_PATHS, remove: true },
});
