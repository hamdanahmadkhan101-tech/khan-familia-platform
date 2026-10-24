import { describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient } from '@khan-familia/sdk';

const id = 'cm123456789012345678901234';

describe('protected SDK transport', () => {
  it.each(['getTenantProperties', 'getUploadSignature', 'addPropertyImage'] as const)(
    '%s uses the configured token and preserves Headers instances',
    async (method) => {
      const requests: Request[] = [];
      const getToken = vi.fn().mockResolvedValue('synthetic-token');
      const api = createApiClient({
        baseUrl: 'https://api.example.test',
        getToken,
        fetcher: (url, init) => {
          requests.push(new Request(url, init));
          return Promise.resolve(Response.json({}));
        },
      });
      const options = { headers: new Headers({ 'X-Tenant-ID': id }) };
      if (method === 'getTenantProperties') await api.getTenantProperties(options);
      if (method === 'getUploadSignature')
        await api.getUploadSignature({ purpose: 'APPLICATION_DOCUMENT' }, options);
      if (method === 'addPropertyImage') await api.addPropertyImage(id, id, options);
      expect(getToken).toHaveBeenCalledOnce();
      const request = requests[0]!;
      expect(request.headers.get('authorization')).toBe('Bearer synthetic-token');
      expect(request.headers.get('x-tenant-id')).toBe(id);
      if (method !== 'getTenantProperties') {
        expect(request.headers.get('content-type')).toBe('application/json');
        expect(JSON.parse(await request.text())).toEqual(
          method === 'getUploadSignature' ? { purpose: 'APPLICATION_DOCUMENT' } : { uploadId: id },
        );
      }
    },
  );

  it('preserves an explicitly supplied token when no token callback exists', async () => {
    let authorization: string | null = null;
    const api = createApiClient({
      baseUrl: 'https://api.example.test',
      fetcher: (url, init) => {
        authorization = new Request(url, init).headers.get('authorization');
        return Promise.resolve(Response.json({}));
      },
    });
    await api.getUploadSignature(
      { purpose: 'APPLICATION_DOCUMENT' },
      { headers: { Authorization: 'Bearer explicit' } },
    );
    expect(authorization).toBe('Bearer explicit');
  });

  it('retains HTTP status without exposing upstream error bodies', async () => {
    const api = createApiClient({
      baseUrl: 'https://api.example.test',
      fetcher: () => Promise.resolve(new Response('private sentinel', { status: 403 })),
    });
    await expect(api.getTenantProperties()).rejects.toMatchObject({ status: 403 });
    await expect(api.getTenantProperties()).rejects.toBeInstanceOf(ApiError);
    await expect(api.getTenantProperties()).rejects.not.toThrow('private sentinel');
  });
});
