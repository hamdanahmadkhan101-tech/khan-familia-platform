import { describe, expect, it } from 'vitest';

import { createTestAgent } from '../helpers/http.js';

describe('API smoke tests', () => {
  it('returns ok from the root endpoint', async () => {
    const response = await createTestAgent().get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns health status', async () => {
    const response = await createTestAgent().get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok' });
  });

  it('returns a structured 404 for unknown routes', async () => {
    const response = await createTestAgent().get('/not-a-real-route');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Not Found', path: '/not-a-real-route' });
  });
});
