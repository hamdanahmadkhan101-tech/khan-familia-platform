export const APP_ENV_VALUES = ['local', 'development', 'staging', 'production', 'test'] as const;

export const LOG_LEVEL_VALUES = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;

export const SERVICE_NAME_VALUES = ['web', 'api', 'worker'] as const;

export const SERVICE_NAMES = {
  web: SERVICE_NAME_VALUES[0],
  api: SERVICE_NAME_VALUES[1],
  worker: SERVICE_NAME_VALUES[2],
} as const;

export const DEFAULT_LOG_LEVEL = 'info';
