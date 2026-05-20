import type { TenantRole } from '@khan-familia/database';
import type { Request } from 'express';

export interface AuthPayload {
  /** Clerk subject (`sub` claim) — not the internal User.id. */
  sub: string;
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
  auth: AuthPayload;
  /** Internal User.id (cuid), set by resolveInternalUser middleware. */
  userId?: string;
  /** Clerk subject, duplicated for convenience after resolveInternalUser. */
  clerkId?: string;
}

export interface TenantRequest extends AuthenticatedRequest {
  userId: string;
  tenantId: string;
  /** Set by resolveTenant from TenantUser membership. */
  tenantRole: TenantRole;
}

export const isAuthenticatedRequest = (req: Request): req is AuthenticatedRequest => {
  return 'auth' in req && req.auth != null && 'sub' in (req.auth as object);
};

export const isTenantRequest = (req: Request): req is TenantRequest => {
  return (
    isAuthenticatedRequest(req) &&
    typeof req.userId === 'string' &&
    typeof (req as TenantRequest).tenantId === 'string'
  );
};
