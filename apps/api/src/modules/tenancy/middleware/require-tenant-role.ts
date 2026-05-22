import type { NextFunction, Response } from 'express';
import type { TenantRole } from '@khan-familia/database';

import { AppError } from '../../../shared/errors/AppError.js';
import { isTenantRequest, type TenantRequest } from '../../../shared/types/request.js';

export const requireTenantRole =
  (...allowed: TenantRole[]) =>
  (req: TenantRequest, _res: Response, next: NextFunction) => {
    if (!isTenantRequest(req)) {
      throw AppError.badRequest('Tenant context required');
    }

    if (!allowed.includes(req.tenantRole)) {
      throw AppError.forbidden('Insufficient tenant permissions');
    }

    next();
  };
