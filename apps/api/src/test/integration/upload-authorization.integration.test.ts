import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiClient } from '@khan-familia/sdk';
import type { DirectUpload } from '@khan-familia/types';
import { cloudinary } from '../../infrastructure/storage/cloudinary.js';
import { testPrisma, truncateTestDatabase } from '../database.js';
import { createTestProperty, createTestTenant, createTestUser } from '../helpers/fixtures.js';
import { authHeaderFor } from '../helpers/auth.js';
import { createTestAgent } from '../helpers/http.js';
import { documentReferences } from '../../modules/upload/document-references.js';

vi.mock('@clerk/express', () => ({
  verifyToken: vi.fn((token: string) => Promise.resolve({ sub: token })),
}));

const body = {
  fullName: 'Test Applicant',
  phone: '03001234567',
  businessName: 'Test Lodge',
  businessVertical: 'ACCOMMODATIONS_STAYS',
  businessAddress: '123 Test Street',
  city: 'Lahore',
  country: 'Pakistan',
  govIdType: 'NATIONAL_ID',
  govIdNumber: 'synthetic-id',
  businessRegNumber: 'synthetic-reg',
  experience: 'Hospitality operations',
};

const setup = async () => {
  const owner = await createTestUser();
  const tenant = await createTestTenant(owner.id);
  const property = await createTestProperty(tenant.id);
  return { owner, tenant, property };
};
const authorize = (clerkId: string, input: object) =>
  createTestAgent()
    .post('/upload/signature')
    .set('Authorization', authHeaderFor(clerkId))
    .send(input);
const complete = (clerkId: string, uploadId: string) =>
  createTestAgent()
    .post(`/upload/${uploadId}/complete`)
    .set('Authorization', authHeaderFor(clerkId));
const access = (clerkId: string, uploadId: string) =>
  createTestAgent().get(`/upload/${uploadId}/access`).set('Authorization', authHeaderFor(clerkId));
const resource = (intent: DirectUpload, overrides: Record<string, unknown> = {}) => ({
  public_id: intent.fields['public_id'],
  resource_type: 'image',
  type: intent.fields['type'],
  format: intent.fields['type'] === 'authenticated' ? 'pdf' : 'jpg',
  bytes: 1024,
  version: 1234567890,
  ...overrides,
});

describe('controlled direct uploads with real database ownership', () => {
  beforeEach(async () => {
    await truncateTestDatabase();
  });

  it('requires authentication', async () => {
    expect(
      (await createTestAgent().post('/upload/signature').send({ purpose: 'APPLICATION_DOCUMENT' }))
        .status,
    ).toBe(401);
  });

  it.each([
    { timestamp: 123, public_id: 'another-tenant/asset' },
    { purpose: 'APPLICATION_DOCUMENT', public_id: 'foreign/asset' },
    { purpose: 'APPLICATION_DOCUMENT', overwrite: true },
    { purpose: 'APPLICATION_DOCUMENT', type: 'upload' },
    { purpose: 'APPLICATION_DOCUMENT', upload_preset: 'ml_default' },
    { purpose: 'APPLICATION_DOCUMENT', eager: 'arbitrary-transformation' },
  ])('rejects arbitrary signing parameters (%o)', async (input) => {
    const user = await createTestUser();
    expect((await authorize(user.clerkId, input)).status).toBe(400);
    expect(await testPrisma.uploadAsset.count()).toBe(0);
  });

  it.each(['OWNER', 'ADMIN'] as const)(
    'allows active %s to request a scoped property photo',
    async (role) => {
      const user = await createTestUser();
      const tenant = await createTestTenant(user.id, role);
      const property = await createTestProperty(tenant.id);
      const response = await authorize(user.clerkId, {
        purpose: 'PROPERTY_PHOTO',
        propertyId: property.id,
      });
      expect(response.status).toBe(201);
      const intent = response.body as DirectUpload;
      expect(intent.fields['public_id']).toContain(
        `khan-familia/properties/${tenant.id}/${property.id}/`,
      );
      expect(intent.fields['overwrite']).toBe('false');
      expect(intent.fields['type']).toBe('upload');
      expect(intent.fields['signature']).toBeTruthy();
      expect(JSON.stringify(response.body)).not.toContain('api_secret');
    },
  );

  it.each(['staff', 'outsider', 'disabled', 'suspended-tenant', 'deleted-property'] as const)(
    'rejects property upload from %s',
    async (scenario) => {
      const { owner, tenant, property } = await setup();
      let actor = owner;
      if (scenario === 'staff')
        await testPrisma.tenantUser.update({
          where: { tenantId_userId: { tenantId: tenant.id, userId: owner.id } },
          data: { role: 'STAFF' },
        });
      if (scenario === 'outsider') actor = await createTestUser();
      if (scenario === 'disabled')
        await testPrisma.tenantUser.update({
          where: { tenantId_userId: { tenantId: tenant.id, userId: owner.id } },
          data: { status: 'DISABLED' },
        });
      if (scenario === 'suspended-tenant')
        await testPrisma.tenant.update({ where: { id: tenant.id }, data: { status: 'SUSPENDED' } });
      if (scenario === 'deleted-property')
        await testPrisma.property.update({ where: { id: property.id }, data: { isDeleted: true } });
      expect([403, 404]).toContain(
        (await authorize(actor.clerkId, { purpose: 'PROPERTY_PHOTO', propertyId: property.id }))
          .status,
      );
      expect(await testPrisma.uploadAsset.count()).toBe(0);
    },
  );

  it('allows a non-tenant applicant to upload a private document; outsiders cannot complete or read it', async () => {
    const applicant = await createTestUser();
    const outsider = await createTestUser();
    const admin = await createTestUser({ role: 'SUPER_ADMIN' });
    const response = await authorize(applicant.clerkId, { purpose: 'APPLICATION_DOCUMENT' });
    expect(response.status).toBe(201);
    const intent = response.body as DirectUpload;
    expect(intent.fields['type']).toBe('authenticated');
    expect(intent.fields['public_id']).toContain(`/verification/${applicant.id}/`);
    const provider = vi.spyOn(cloudinary.api, 'resource').mockResolvedValue(resource(intent));
    expect((await complete(outsider.clerkId, intent.uploadId)).status).toBe(404);
    expect(provider).not.toHaveBeenCalled();
    expect((await complete(applicant.clerkId, intent.uploadId)).status).toBe(200);
    expect(provider).toHaveBeenCalledWith(intent.fields['public_id'], {
      resource_type: 'image',
      type: 'authenticated',
    });
    expect((await access(outsider.clerkId, intent.uploadId)).status).toBe(404);
    expect((await access(admin.clerkId, intent.uploadId)).status).toBe(404); // drafts aren't reviewable
    const download = await access(applicant.clerkId, intent.uploadId);
    expect(download.status).toBe(200);
    expect(download.headers['cache-control']).toBe('no-store');
    const url = new URL((download.body as { url: string }).url);
    expect(url.hostname).toBe('api.cloudinary.com');
    expect(url.searchParams.get('type')).toBe('authenticated');
    expect(url.searchParams.get('attachment')).toBe('true');
    expect(Number(url.searchParams.get('expires_at'))).toBeLessThanOrEqual(
      Math.floor(Date.now() / 1000) + 60,
    );
    expect(url.searchParams.get('signature')).toBeTruthy();
    const submitted = await createTestAgent()
      .post('/tenants/applications')
      .set('Authorization', authHeaderFor(applicant.clerkId))
      .send({ ...body, documents: [{ uploadId: intent.uploadId, type: 'REGISTRATION' }] });
    expect(submitted.status).toBe(201);
    expect((await access(admin.clerkId, intent.uploadId)).status).toBe(200);
    expect((await access(outsider.clerkId, intent.uploadId)).status).toBe(404);
    expect((await authorize(applicant.clerkId, { purpose: 'APPLICATION_DOCUMENT' })).status).toBe(
      409,
    );
  });

  it.each([
    { type: 'upload' },
    { public_id: 'foreign/asset' },
    { resource_type: 'raw' },
    { format: 'svg' },
    { bytes: 6 * 1024 * 1024 },
    { version: undefined },
  ])('rejects unverified document metadata (%o)', async (overrides) => {
    const applicant = await createTestUser();
    const intent = (await authorize(applicant.clerkId, { purpose: 'APPLICATION_DOCUMENT' }))
      .body as DirectUpload;
    vi.spyOn(cloudinary.api, 'resource').mockResolvedValue(resource(intent, overrides));
    expect((await complete(applicant.clerkId, intent.uploadId)).status).toBe(400);
    expect(
      (await testPrisma.uploadAsset.findUniqueOrThrow({ where: { id: intent.uploadId } }))
        .completedAt,
    ).toBeNull();
  });

  it('leaves provider failures retryable; expired incomplete uploads cannot be completed', async () => {
    const user = await createTestUser();
    const intent = (await authorize(user.clerkId, { purpose: 'APPLICATION_DOCUMENT' }))
      .body as DirectUpload;
    const provider = vi
      .spyOn(cloudinary.api, 'resource')
      .mockRejectedValueOnce(new Error('synthetic provider failure'))
      .mockResolvedValue(resource(intent));
    expect((await complete(user.clerkId, intent.uploadId)).status).toBe(503);
    expect((await complete(user.clerkId, intent.uploadId)).status).toBe(200);
    expect((await complete(user.clerkId, intent.uploadId)).status).toBe(200);
    expect(provider).toHaveBeenCalledTimes(2);
    const expired = (await authorize(user.clerkId, { purpose: 'APPLICATION_DOCUMENT' }))
      .body as DirectUpload;
    await testPrisma.uploadAsset.update({
      where: { id: expired.uploadId },
      data: { expiresAt: new Date(0) },
    });
    expect((await complete(user.clerkId, expired.uploadId)).status).toBe(409);
  });

  it('rechecks revoked photo permission before completion and attachment', async () => {
    const { owner, tenant, property } = await setup();
    const intent = (
      await authorize(owner.clerkId, { purpose: 'PROPERTY_PHOTO', propertyId: property.id })
    ).body as DirectUpload;
    await testPrisma.tenantUser.update({
      where: { tenantId_userId: { tenantId: tenant.id, userId: owner.id } },
      data: { role: 'STAFF' },
    });
    expect((await complete(owner.clerkId, intent.uploadId)).status).toBe(403);
    expect(
      (
        await createTestAgent()
          .post(`/properties/${property.id}/images`)
          .set('Authorization', authHeaderFor(owner.clerkId))
          .send({ uploadId: intent.uploadId })
      ).status,
    ).toBe(403);
  });

  it('attaches a verified photo idempotently, with SDK JSON passing the actual Express parser', async () => {
    const { owner, property } = await setup();
    const agent = createTestAgent();
    const api = createApiClient({
      baseUrl: 'http://api.test',
      getToken: () => Promise.resolve(owner.clerkId),
      fetcher: async (url, init) => {
        const request = new Request(url, init);
        const target = new URL(request.url);
        let operation =
          request.method === 'POST' ? agent.post(target.pathname) : agent.get(target.pathname);
        request.headers.forEach((value, key) => {
          operation = operation.set(key, value);
        });
        if (request.body) operation = operation.send(await request.text());
        const result = await operation;
        return Response.json(result.body as unknown, { status: result.status });
      },
    });
    const intent = await api.getUploadSignature({
      purpose: 'PROPERTY_PHOTO',
      propertyId: property.id,
    });
    vi.spyOn(cloudinary.api, 'resource').mockResolvedValue(resource(intent));
    await api.completeUpload(intent.uploadId);
    await Promise.all([
      api.addPropertyImage(property.id, intent.uploadId),
      api.addPropertyImage(property.id, intent.uploadId),
    ]);
    const images = await testPrisma.propertyImage.findMany({ where: { propertyId: property.id } });
    expect(images).toHaveLength(1);
    expect(images[0]?.publicId).toBe(intent.fields['public_id']);
    expect(images[0]?.url).toMatch(/^https:\/\/res\.cloudinary\.com\/test-cloud\/image\/upload\//);
    const otherProperty = await createTestProperty(property.tenantId);
    expect(
      (
        await agent
          .post(`/properties/${otherProperty.id}/images`)
          .set('Authorization', authHeaderFor(owner.clerkId))
          .send({ uploadId: intent.uploadId })
      ).status,
    ).toBe(400);
    expect(
      (
        await agent
          .post(`/properties/${property.id}/images`)
          .set('Authorization', authHeaderFor(owner.clerkId))
          .send({ url: 'https://foreign.test/photo.jpg', publicId: 'foreign/id' })
      ).status,
    ).toBe(400);
  });

  it('rejects forged application references and rolls back the entire submission', async () => {
    const applicant = await createTestUser();
    const foreign = await createTestUser();
    const intent = (await authorize(foreign.clerkId, { purpose: 'APPLICATION_DOCUMENT' }))
      .body as DirectUpload;
    vi.spyOn(cloudinary.api, 'resource').mockResolvedValue(resource(intent));
    await complete(foreign.clerkId, intent.uploadId);
    const result = await createTestAgent()
      .post('/tenants/applications')
      .set('Authorization', authHeaderFor(applicant.clerkId))
      .send({ ...body, documents: [{ uploadId: intent.uploadId, type: 'OTHER' }] });
    expect(result.status).toBe(400);
    expect(await testPrisma.tenantApplication.count()).toBe(0);
    const urlOnly = await createTestAgent()
      .post('/tenants/applications')
      .set('Authorization', authHeaderFor(applicant.clerkId))
      .send({ ...body, documents: [{ url: 'https://foreign.test/pii.pdf', type: 'OTHER' }] });
    expect(urlOnly.status).toBe(400);
  });

  it('rejects incomplete, duplicate, and wrong-purpose document references without claiming them', async () => {
    const { owner, property } = await setup();
    const intent = (await authorize(owner.clerkId, { purpose: 'APPLICATION_DOCUMENT' }))
      .body as DirectUpload;
    const document = { uploadId: intent.uploadId, type: 'ID' };
    const submit = (documents: object[]) =>
      createTestAgent()
        .post('/tenants/applications')
        .set('Authorization', authHeaderFor(owner.clerkId))
        .send({ ...body, documents });
    expect((await submit([document])).status).toBe(400);
    vi.spyOn(cloudinary.api, 'resource').mockResolvedValue(resource(intent));
    expect((await complete(owner.clerkId, intent.uploadId)).status).toBe(200);
    expect((await submit([document, document])).status).toBe(400);
    expect(
      (
        await createTestAgent()
          .post(`/properties/${property.id}/images`)
          .set('Authorization', authHeaderFor(owner.clerkId))
          .send({ uploadId: intent.uploadId })
      ).status,
    ).toBe(400);
    const photo = (
      await authorize(owner.clerkId, { purpose: 'PROPERTY_PHOTO', propertyId: property.id })
    ).body as DirectUpload;
    vi.mocked(cloudinary.api.resource).mockResolvedValue(resource(photo));
    expect((await complete(owner.clerkId, photo.uploadId)).status).toBe(200);
    expect((await submit([{ uploadId: photo.uploadId, type: 'ID' }])).status).toBe(400);
    expect(await testPrisma.tenantApplication.count()).toBe(0);
    expect(
      (await testPrisma.uploadAsset.findUniqueOrThrow({ where: { id: intent.uploadId } }))
        .applicationId,
    ).toBeNull();
  });

  it('enforces the per-user intent quota across parallel requests', async () => {
    const user = await createTestUser();
    await testPrisma.uploadAsset.createMany({
      data: Array.from({ length: 59 }, (_, index) => ({
        ownerId: user.id,
        purpose: 'APPLICATION_DOCUMENT' as const,
        storageKey: `quota-${user.id}-${index}`,
        visibility: 'PRIVATE',
        expiresAt: new Date(Date.now() + 60_000),
      })),
    });
    const results = await Promise.all([
      authorize(user.clerkId, { purpose: 'APPLICATION_DOCUMENT' }),
      authorize(user.clerkId, { purpose: 'APPLICATION_DOCUMENT' }),
    ]);
    expect(results.map((response) => response.status).sort()).toEqual([201, 429]);
    expect(await testPrisma.uploadAsset.count({ where: { ownerId: user.id } })).toBe(60);
  });

  it('rejects unverified photos through alternate catalog write endpoints', async () => {
    const { owner, property } = await setup();
    const agent = createTestAgent();
    const images = [{ url: 'https://foreign.test/photo.jpg', publicId: 'foreign/asset' }];
    expect(
      (
        await agent.post('/properties').set('Authorization', authHeaderFor(owner.clerkId)).send({
          name: 'New property',
          description: 'A sufficiently detailed description.',
          city: 'Lahore',
          country: 'Pakistan',
          images,
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await agent
          .patch(`/properties/${property.id}`)
          .set('Authorization', authHeaderFor(owner.clerkId))
          .send({ images })
      ).status,
    ).toBe(400);
    expect(
      (
        await agent
          .post(`/properties/${property.id}/unit-types`)
          .set('Authorization', authHeaderFor(owner.clerkId))
          .send({ name: 'Room', images })
      ).status,
    ).toBe(400);
  });

  it('strips legacy links from the actual admin application response', async () => {
    const applicant = await createTestUser();
    const admin = await createTestUser({ role: 'SUPER_ADMIN' });
    const application = await createTestAgent()
      .post('/tenants/applications')
      .set('Authorization', authHeaderFor(applicant.clerkId))
      .send(body);
    expect(application.status).toBe(201);
    const row = await testPrisma.tenantApplication.findFirstOrThrow({
      where: { userId: applicant.id },
    });
    await testPrisma.tenantApplication.update({
      where: { id: row.id },
      data: { documents: [{ url: 'https://legacy.test/pii.pdf', type: 'ID' }] },
    });
    const result = await createTestAgent()
      .get('/admin/applications/pending')
      .set('Authorization', authHeaderFor(admin.clerkId));
    expect(result.status).toBe(200);
    expect(JSON.stringify(result.body)).not.toContain('https://legacy.test');
    expect(JSON.stringify(result.body)).toContain('LEGACY_DOCUMENT');
  });

  it('retains provider identity per asset and never falls back to another provider', async () => {
    const user = await createTestUser();
    const intent = (await authorize(user.clerkId, { purpose: 'APPLICATION_DOCUMENT' }))
      .body as DirectUpload;
    const asset = await testPrisma.uploadAsset.findUniqueOrThrow({
      where: { id: intent.uploadId },
    });
    expect(asset.provider).toBe('cloudinary');
    expect(asset.visibility).toBe('PRIVATE');
    expect(asset.storageKey).toBe(intent.fields['public_id']);
    // The same opaque key can exist at a different provider without conflating the records.
    const other = await testPrisma.uploadAsset.create({
      data: {
        ownerId: user.id,
        purpose: 'APPLICATION_DOCUMENT',
        provider: 'not-installed',
        storageKey: asset.storageKey,
        visibility: 'PRIVATE',
        expiresAt: asset.expiresAt,
      },
    });
    const provider = vi.spyOn(cloudinary.api, 'resource');
    expect((await complete(user.clerkId, other.id)).status).toBe(503);
    expect(provider).not.toHaveBeenCalled();
  });

  it('never returns legacy document URLs as trusted references', () => {
    expect(documentReferences([{ url: 'https://legacy.test/pii.pdf', type: 'ID' }])).toEqual([
      { type: 'LEGACY_DOCUMENT', unavailable: true },
    ]);
  });
});
