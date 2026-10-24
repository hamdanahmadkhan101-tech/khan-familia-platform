export const DEFAULT_TEST_DATABASE_URL =
  'postgresql://khan_familia_test:khan_familia_test@127.0.0.1:55432/khan_familia_test';

/** Only the disposable local/CI database and its dedicated role are supported. */
export const assertIsolatedTestDatabaseUrl = (value) => {
  let url;
  try {
    url = new URL(value ?? '');
  } catch {
    throw new Error('A valid TEST_DATABASE_URL is required.');
  }

  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.pathname !== '/khan_familia_test' ||
    url.username !== 'khan_familia_test' ||
    url.search !== '' ||
    url.hash !== ''
  ) {
    throw new Error(
      'Refusing database tests: use a loopback PostgreSQL URL with database and role khan_familia_test, without query parameters.',
    );
  }

  return url.toString();
};

export const assertTestDatabaseEnvironment = (environment) => {
  if (environment['APP_ENV'] !== 'test' || environment['RUN_DB_TESTS'] !== 'true') {
    throw new Error('Database tests require APP_ENV=test and RUN_DB_TESTS=true.');
  }

  const target = assertIsolatedTestDatabaseUrl(environment['TEST_DATABASE_URL']);
  const effective = assertIsolatedTestDatabaseUrl(environment['DATABASE_URL']);
  if (effective !== target) {
    throw new Error('DATABASE_URL must match the explicit TEST_DATABASE_URL.');
  }
};
