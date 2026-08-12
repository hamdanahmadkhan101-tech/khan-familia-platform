import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/express', () => ({
  verifyToken: vi.fn(async (token: string) => ({ sub: token })),
}));

import { authHeaderFor } from '../helpers/auth.js';
import { truncateTestDatabase } from '../database.js';
import { createTestAgent } from '../helpers/http.js';
import { createTestUser, createTestTenant, createTestProperty } from '../helpers/fixtures.js';

const runDbTests = process.env['RUN_DB_TESTS'] === 'true';
const describeDb = runDbTests ? describe : describe.skip;

describeDb('Section 6.4 RBAC Scenarios (401, 403, Cross-Tenant)', () => {
  let agent: ReturnType<typeof createTestAgent>;

  beforeAll(async () => {
    await truncateTestDatabase();
    agent = createTestAgent();
  });

  describe('Scenario 1: 401 Unauthorized (No Authentication)', () => {
    it('rejects API calls without an Authorization header', async () => {
      // Create a tenant just so we have a valid endpoint to call
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);
      const property = await createTestProperty(tenant.id);

      // Attempt to access a protected endpoint without any auth header
      const response = await agent
        .post(`/properties/${property.id}/images`)
        .set('X-Tenant-ID', tenant.id)
        .send({ url: 'http://test.com/img.jpg', publicId: 'img1' });

      // Verify it returns 401 Unauthorized
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Scenario 2: 403 Forbidden (Authenticated, but not a Tenant Member)', () => {
    it('rejects API calls if the user is authenticated but lacks tenant membership', async () => {
      // Tenant A
      const owner = await createTestUser();
      const tenant = await createTestTenant(owner.id);
      const property = await createTestProperty(tenant.id);

      // Random normal user (Guest) who is NOT part of Tenant A
      const randomGuest = await createTestUser();

      // The guest tries to add an image to Tenant A's property
      const response = await agent
        .post(`/properties/${property.id}/images`)
        .set('Authorization', authHeaderFor(randomGuest.clerkId)) // Authenticated
        .set('X-Tenant-ID', tenant.id)
        .send({ url: 'http://test.com/img.jpg', publicId: 'img1' });

      // Verify it returns 403 Forbidden
      expect(response.status).toBe(403);
      expect(response.body.error).toHaveProperty('message', 'Access denied to this tenant');
    });
  });

  describe('Scenario 3: Cross-Tenant Protection (403)', () => {
    it("prevents a valid Tenant Owner from modifying another Tenant's data", async () => {
      // Tenant A
      const ownerA = await createTestUser();
      await createTestTenant(ownerA.id);

      // Tenant B (completely unrelated)
      const ownerB = await createTestUser();
      const tenantB = await createTestTenant(ownerB.id);
      const propertyB = await createTestProperty(tenantB.id);

      // Owner A tries to modify Tenant B's actual property
      const response2 = await agent
        .post(`/properties/${propertyB.id}/images`)
        .set('Authorization', authHeaderFor(ownerA.clerkId)) // Valid owner of Tenant A
        .set('X-Tenant-ID', tenantB.id) // Passing Tenant B's ID
        .send({ url: 'http://test.com/img.jpg', publicId: 'img1' });

      // Attempt should be strictly rejected with 403 Forbidden
      expect(response2.status).toBe(403);
      expect(response2.body.error).toHaveProperty('message', 'Access denied to this tenant');
    });
  });
});
