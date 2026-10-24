export const DEFAULT_TEST_DATABASE_URL: string;
export function assertIsolatedTestDatabaseUrl(value: string | undefined): string;
export function assertTestDatabaseEnvironment(
  environment: Record<string, string | undefined>,
): void;
