import type { NextFunction, Request, Response } from 'express';

import type { TenantRequest } from '../../shared/types/request.js';
import { getAvailabilityForProperty } from './inventory.service.js';
import type { GetAvailabilityQuery } from './schemas.js';

export const getAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const { propertyId } = req.params as { propertyId: string };
    const query = req.query as unknown as GetAvailabilityQuery;

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const availability = await getAvailabilityForProperty(
      tenantReq.tenantId,
      propertyId,
      startDate,
      endDate,
      query.unitTypeId,
    );

    res.status(200).json({ availability });
  } catch (err) {
    next(err);
  }
};
