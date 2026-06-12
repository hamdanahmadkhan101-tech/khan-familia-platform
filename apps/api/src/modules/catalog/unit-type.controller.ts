import type { NextFunction, Request, Response } from 'express';

import type { TenantRequest } from '../../shared/types/request.js';
import {
  createUnitType as createUnitTypeService,
  deleteUnitType as deleteUnitTypeService,
  getUnitType as getUnitTypeService,
  listUnitTypesForProperty as listUnitTypesForPropertyService,
  updateUnitType as updateUnitTypeService,
} from './unit-type.service.js';

export const createUnitType = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const { propertyId } = req.params as { propertyId: string };
    const unitType = await createUnitTypeService(tenantReq.tenantId, propertyId, req.body);
    res.status(201).json(unitType);
  } catch (err) {
    next(err);
  }
};

export const listUnitTypesForProperty = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const { propertyId } = req.params as { propertyId: string };
    const unitTypes = await listUnitTypesForPropertyService(tenantReq.tenantId, propertyId);
    res.status(200).json({ unitTypes });
  } catch (err) {
    next(err);
  }
};

export const getUnitType = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const { propertyId, unitTypeId } = req.params as {
      propertyId: string;
      unitTypeId: string;
    };
    const unitType = await getUnitTypeService(tenantReq.tenantId, propertyId, unitTypeId);
    res.status(200).json(unitType);
  } catch (err) {
    next(err);
  }
};

export const updateUnitType = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const { propertyId, unitTypeId } = req.params as {
      propertyId: string;
      unitTypeId: string;
    };
    const unitType = await updateUnitTypeService(
      tenantReq.tenantId,
      propertyId,
      unitTypeId,
      req.body,
    );
    res.status(200).json(unitType);
  } catch (err) {
    next(err);
  }
};

export const deleteUnitType = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const { propertyId, unitTypeId } = req.params as {
      propertyId: string;
      unitTypeId: string;
    };
    await deleteUnitTypeService(tenantReq.tenantId, propertyId, unitTypeId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
