export type AppEnv = 'local' | 'development' | 'staging' | 'production' | 'test';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type ServiceName = 'web' | 'api' | 'worker';

export type HealthStatus = {
  status: 'ok';
  service: ServiceName;
  timestamp: string;
};

export type ApiErrorPayload = {
  message: string;
  requestId?: string;
};
