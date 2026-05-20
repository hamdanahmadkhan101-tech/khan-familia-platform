/**
 * Enforces explicit tenant scoping for repository/service data access.
 * Middleware alone is not sufficient for tenant isolation.
 */
export const requireTenantId = (tenantId: string | null | undefined): string => {
  if (!tenantId) {
    throw new Error('tenantId is required for tenant-scoped data access');
  }
  return tenantId;
};
