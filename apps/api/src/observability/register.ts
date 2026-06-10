import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

import { SERVICE_NAMES } from '@khan-familia/constants';

import { env } from '../env.js';

let sdk: NodeSDK | undefined;
let shutdownHookRegistered = false;

const normalizeEndpoint = (endpoint: string) => endpoint.replace(/\/$/, '');

const registerShutdownHooks = () => {
  if (shutdownHookRegistered) {
    return;
  }

  shutdownHookRegistered = true;

  const shutdown = async () => {
    if (sdk === undefined) {
      return;
    }

    await sdk.shutdown();
    sdk = undefined;
  };

  process.once('SIGINT', () => {
    void shutdown().finally(() => process.exit(0));
  });

  process.once('SIGTERM', () => {
    void shutdown().finally(() => process.exit(0));
  });
};

export const startObservability = async () => {
  if (!env.OTEL_ENABLED) {
    return;
  }

  if (sdk !== undefined) {
    return;
  }

  if (env.OTEL_DIAGNOSTICS) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
  }

  const otlpEndpoint = normalizeEndpoint(env.OTEL_EXPORTER_OTLP_ENDPOINT);

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: env.OTEL_SERVICE_NAME || SERVICE_NAMES.api,
      [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'khan-familia',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: env.APP_ENV,
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${otlpEndpoint}/v1/traces`,
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${otlpEndpoint}/v1/metrics`,
      }),
      exportIntervalMillis: env.OTEL_METRICS_EXPORT_INTERVAL_MS,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  await sdk.start();
  registerShutdownHooks();
};
