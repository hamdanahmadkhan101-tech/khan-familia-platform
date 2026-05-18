import type { Request } from 'express';

export interface AuthPayload {
  sub: string; // user id
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
  auth: AuthPayload;
}

export interface TenantRequest extends AuthenticatedRequest {
  tenantId: string;
}

export const isAuthenticatedRequest = (req: Request): req is AuthenticatedRequest => {
  return 'auth' in req && req.auth != null && 'sub' in (req.auth as object);
};

export const isTenantRequest = (req: Request): req is TenantRequest => {
  return isAuthenticatedRequest(req) && 'tenantId' in req;
};
