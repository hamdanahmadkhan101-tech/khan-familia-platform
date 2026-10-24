/** Deliberately omit raw error messages, stacks and provider payloads from operational logs. */
export const safeErrorSerializer = (error: unknown): Record<string, unknown> => {
  if (!error || typeof error !== 'object') return { type: 'UnknownError' };
  const record = error as Record<string, unknown>;
  const safeCode = (value: unknown) =>
    typeof value === 'string' && /^[A-Z][A-Z0-9_]{0,63}$/.test(value) ? value : undefined;
  return {
    type: error instanceof Error ? error.constructor.name : 'Error',
    code: safeCode(record['code']),
    statusCode: typeof record['statusCode'] === 'number' ? record['statusCode'] : undefined,
  };
};

/** Header/body allowlisting prevents credentials and token-bearing URLs reaching pino-http logs. */
export const safeRequestSerializer = (request: { method?: string }) => ({ method: request.method });
export const safeResponseSerializer = (response: { statusCode?: number }) => ({
  statusCode: response.statusCode,
});

export const SAFE_LOG_SERIALIZERS = {
  err: safeErrorSerializer,
  error: safeErrorSerializer,
  req: safeRequestSerializer,
  res: safeResponseSerializer,
};

/** Pino otherwise copies a raw Error.message into msg before applying serializers. */
export function safeLogMethod(
  this: unknown,
  args: unknown[],
  method: (...args: unknown[]) => void,
) {
  const first = args[0];
  if (first instanceof Error) {
    args[0] = { err: first };
    if (args.length === 1) args.push('Operation failed');
  } else if (first && typeof first === 'object' && args.length === 1) {
    const record = first as Record<string, unknown>;
    if (record['err'] || record['error']) args.push('Operation failed');
  }
  method.apply(this, args);
}
