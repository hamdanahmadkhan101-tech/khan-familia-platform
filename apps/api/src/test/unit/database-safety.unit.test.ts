import { afterEach, describe, expect, it } from 'vitest';

import { assertTestDatabaseUrl } from '../database.js';

const originalAppEnv = process.env['APP_ENV'];
const originalDatabaseUrl = process.env['DATABASE_URL'];
const originalTestDatabaseConfirm = process.env['TEST_DATABASE_CONFIRM'];

const restoreEnv = (key: string, value: string | undefined) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
};

afterEach(() => {
  restoreEnv('APP_ENV', originalAppEnv);
  restoreEnv('DATABASE_URL', originalDatabaseUrl);
  restoreEnv('TEST_DATABASE_CONFIRM', originalTestDatabaseConfirm);
});

describe('test database safety guard', () => {
  it('rejects cleanup outside APP_ENV=test', () => {
    process.env['APP_ENV'] = 'development';
    process.env['DATABASE_URL'] = 'postgresql://user:pass@localhost:5432/khan_familia_test';

    expect(() => assertTestDatabaseUrl()).toThrow('APP_ENV=test');
  });

  it('rejects database URLs that do not look test-only', () => {
    process.env['APP_ENV'] = 'test';
    process.env['DATABASE_URL'] = 'postgresql://user:pass@localhost:5432/khan_familia_dev';
    delete process.env['TEST_DATABASE_CONFIRM'];

    expect(() => assertTestDatabaseUrl()).toThrow('does not look like a test database');
  });

  it('allows clearly named test database URLs', () => {
    process.env['APP_ENV'] = 'test';
    process.env['DATABASE_URL'] = 'postgresql://user:pass@localhost:5432/khan_familia_test';

    expect(() => assertTestDatabaseUrl()).not.toThrow();
  });
});
