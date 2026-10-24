import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('actual API and worker logging', () => {
  it('omits credentials, request URLs, payloads and raw errors while retaining operational context', () => {
    const script = `
      const { logger, requestLogger } = await import('./src/logger.ts');
      const { logger: workerLogger } = await import('../worker/src/logger.ts');
      const { default: express } = await import('express');
      const { default: request } = await import('supertest');
      const marker = 'PRIVATE_SENTINEL_73';
      for (const current of [logger, workerLogger]) {
        current.info({authorization:marker, cookie:marker, holdToken:marker, clientSecret:marker,
          details:{guestDetails:[{idNumber:marker}],specialNeeds:[marker]}, jobId:'safe-job'}, 'safe operational event');
        const err = Object.assign(new Error(marker), { config: {headers: {authorization:marker}}, code:'ECONNRESET' });
        current.error({err}, 'provider request failed');
        current.error({err});
        current.error(err);
      }
      const app = express();
      app.use(requestLogger);
      app.get('/audit/:token', (_req,res) => res.setHeader('set-cookie',marker).status(200).end());
      await request(app).get('/audit/'+marker+'?token='+marker).set('authorization',marker).set('cookie',marker).set('x-request-id',marker);
    `;
    const result = spawnSync(
      process.execPath,
      ['--import', 'tsx', '--input-type=module', '-e', script],
      {
        cwd: process.cwd(),
        env: { ...process.env, LOG_LEVEL: 'info', RESEND_API_KEY: '' },
        encoding: 'utf8',
      },
    );
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).not.toContain('PRIVATE_SENTINEL_73');
    expect(result.stderr).not.toContain('PRIVATE_SENTINEL_73');
    const records = result.stdout
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ service: 'api', jobId: 'safe-job' }),
        expect.objectContaining({ service: 'worker', jobId: 'safe-job' }),
        expect.objectContaining({ err: { type: 'Error', code: 'ECONNRESET' } }),
        expect.objectContaining({
          req: { method: 'GET' },
          res: { statusCode: 200 },
          route: '/audit/:token',
        }),
      ]),
    );
    const httpRecord = records.find((record) => record['res']);
    expect(httpRecord?.['responseTime']).toEqual(expect.any(Number));
    expect(httpRecord?.['requestId']).toEqual(expect.any(String));
  });
});
