import type { NextFunction, Request, Response } from 'express';

import type { TenantRequest } from '../../shared/types/request.js';
import type {
  BlockInventoryBody,
  GetAvailabilityQuery,
  SetPricingBody,
  UnblockInventoryBody,
} from './schemas.js';
import {
  blockInventory,
  getAvailabilityForProperty,
  setPriceOverride,
  unblockInventory,
} from './inventory.service.js';

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

export const blockInventoryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const { propertyId } = req.params as { propertyId: string };
    const body = req.body as BlockInventoryBody;

    const count = await blockInventory(
      tenantReq.tenantId,
      propertyId,
      body.unitTypeId,
      new Date(body.startDate),
      new Date(body.endDate),
      body.blockCount,
      body.reason,
    );

    res.status(200).json({ message: 'Inventory blocked successfully', updatedDays: count });
  } catch (err) {
    next(err);
  }
};

export const unblockInventoryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const { propertyId } = req.params as { propertyId: string };
    const body = req.body as UnblockInventoryBody;

    const count = await unblockInventory(
      tenantReq.tenantId,
      propertyId,
      body.unitTypeId,
      new Date(body.startDate),
      new Date(body.endDate),
      body.unblockCount,
    );

    res.status(200).json({ message: 'Inventory unblocked successfully', updatedDays: count });
  } catch (err) {
    next(err);
  }
};

export const setPricingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const { propertyId } = req.params as { propertyId: string };
    const body = req.body as SetPricingBody;

    const count = await setPriceOverride(
      tenantReq.tenantId,
      propertyId,
      body.unitTypeId,
      new Date(body.startDate),
      new Date(body.endDate),
      body.priceOverride,
    );

    res.status(200).json({ message: 'Pricing updated successfully', updatedDays: count });
  } catch (err) {
    next(err);
  }
};
