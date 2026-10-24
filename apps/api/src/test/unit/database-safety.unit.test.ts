import { describe, expect, it } from 'vitest';

import {
  assertIsolatedTestDatabaseUrl,
  assertTestDatabaseEnvironment,
  DEFAULT_TEST_DATABASE_URL,
} from '../../../../../scripts/test-database-safety.mjs';
import { createApiTestEnvironment } from '../../../../../scripts/test-environment.mjs';

const enabledEnvironment = () => ({
  APP_ENV: 'test',
  RUN_DB_TESTS: 'true',
  TEST_DATABASE_URL: DEFAULT_TEST_DATABASE_URL,
  DATABASE_URL: DEFAULT_TEST_DATABASE_URL,
});

describe('isolated test database guard', () => {
  it.each([
    undefined,
    '',
    'not a URL',
    'postgresql://user:contains-ci@localhost:55432/production',
    'postgresql://khan_familia_test:test@latest-production.example/production',
    'postgresql://khan_familia_test:test@neon-test.example/khan_familia_test',
    'postgresql://postgres:test@localhost:55432/khan_familia_test',
    'postgresql://khan_familia_test:test@localhost:55432/production_test',
    'postgresql://khan_familia_test:test@localhost:55432/khan_familia_test?options=-csearch_path=production',
    'postgresql://khan_familia_test:test@localhost:55432/khan_familia_test#test',
    'https://khan_familia_test:test@localhost/khan_familia_test',
  ])('rejects misleading or unsupported targets (%s)', (url) => {
    expect(() => assertIsolatedTestDatabaseUrl(url)).toThrow();
  });

  it.each(['localhost', '127.0.0.1', '[::1]'])('accepts dedicated local identity at %s', (host) => {
    expect(() =>
      assertIsolatedTestDatabaseUrl(
        `postgresql://khan_familia_test:test@${host}:55432/khan_familia_test`,
      ),
    ).not.toThrow();
  });

  it.each([
    { APP_ENV: 'development' },
    { RUN_DB_TESTS: 'false' },
    { TEST_DATABASE_URL: undefined },
    { DATABASE_URL: undefined },
    { DATABASE_URL: DEFAULT_TEST_DATABASE_URL.replace('55432', '5432') },
  ])('requires explicit matching environment (%o)', (overrides) => {
    expect(() =>
      assertTestDatabaseEnvironment({ ...enabledEnvironment(), ...overrides }),
    ).toThrow();
  });

  it('ignores the legacy confirmation bypass', () => {
    expect(() =>
      assertTestDatabaseEnvironment({
        ...enabledEnvironment(),
        DATABASE_URL: 'postgresql://prod:prod@production.example/production',
        TEST_DATABASE_CONFIRM: 'true',
      }),
    ).toThrow();
  });

  it('accepts a matching explicitly enabled disposable target', () => {
    expect(() => assertTestDatabaseEnvironment(enabledEnvironment())).not.toThrow();
  });
});

describe('test environment isolation', () => {
  const inherited = {
    DATABASE_URL: 'postgresql://real:secret@production.example/production',
    STRIPE_SECRET_KEY: 'sk_live_sentinel',
    CLERK_SECRET_KEY: 'sk_live_sentinel',
    ENCRYPTION_KEY: 'real-secret-sentinel',
    DOTENV_CONFIG_PATH: '/developer/.env',
    RUN_DB_TESTS: 'true',
  };

  it('keeps default tests database-free despite an inherited opt-in and secrets', () => {
    const environment = createApiTestEnvironment(inherited, 'unit');
    expect(environment['RUN_DB_TESTS']).toBe('false');
    expect(environment['DATABASE_URL']).toContain('@127.0.0.1:1/');
    expect(environment['STRIPE_SECRET_KEY']).toBe('sk_test_placeholder');
    expect(environment['CLERK_SECRET_KEY']).toBe('sk_test_placeholder');
    expect(environment['ENCRYPTION_KEY']).toBe('0'.repeat(64));
    expect(environment['DOTENV_CONFIG_PATH']).toBe('/dev/null');
    expect(inherited['STRIPE_SECRET_KEY']).toBe('sk_live_sentinel');
  });

  it('uses only the dedicated integration target rather than inherited DATABASE_URL', () => {
    const environment = createApiTestEnvironment(inherited, 'integration');
    expect(environment['DATABASE_URL']).toBe(DEFAULT_TEST_DATABASE_URL);
    expect(() => assertTestDatabaseEnvironment(environment)).not.toThrow();
  });

  it('preserves an explicit database-test opt-out', () => {
    expect(() =>
      createApiTestEnvironment({ ...inherited, RUN_DB_TESTS: 'false' }, 'integration'),
    ).toThrow('explicitly disables');
  });

  it('rejects an unsafe explicit target before provider/database initialization', () => {
    expect(() =>
      createApiTestEnvironment(
        {
          TEST_DATABASE_URL: inherited['DATABASE_URL'],
          TEST_DATABASE_CONFIRM: 'true',
        },
        'integration',
      ),
    ).toThrow();
  });

  it('rejects unknown suites instead of silently running or skipping tests', () => {
    expect(() => createApiTestEnvironment({}, 'integraiton')).toThrow();
  });
});
