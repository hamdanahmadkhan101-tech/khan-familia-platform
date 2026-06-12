import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedRequest, TenantRequest } from '../../shared/types/request.js';
import {
  approveProperty as approvePropertyService,
  createProperty as createPropertyService,
  getPropertyForTenant as getPropertyForTenantService,
  listPendingProperties as listPendingPropertiesService,
  listPropertiesForTenant as listPropertiesForTenantService,
  rejectProperty as rejectPropertyService,
  softDeleteProperty as softDeletePropertyService,
  updateProperty as updatePropertyService,
} from './property.service.js';

export const createProperty = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const property = await createPropertyService(tenantReq.tenantId, req.body);
    res.status(201).json(property);
  } catch (err) {
    next(err);
  }
};

export const listPropertiesForTenant = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const properties = await listPropertiesForTenantService(tenantReq.tenantId);
    res.status(200).json({ properties });
  } catch (err) {
    next(err);
  }
};

export const getPropertyForTenant = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const { propertyId } = req.params as { propertyId: string };
    const property = await getPropertyForTenantService(tenantReq.tenantId, propertyId);
    res.status(200).json(property);
  } catch (err) {
    next(err);
  }
};

export const updateProperty = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const { propertyId } = req.params as { propertyId: string };
    const property = await updatePropertyService(tenantReq.tenantId, propertyId, req.body);
    res.status(200).json(property);
  } catch (err) {
    next(err);
  }
};

export const softDeleteProperty = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const { propertyId } = req.params as { propertyId: string };
    await softDeletePropertyService(tenantReq.tenantId, propertyId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const listPendingProperties = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const properties = await listPendingPropertiesService();
    res.status(200).json({ properties });
  } catch (err) {
    next(err);
  }
};

export const approveProperty = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { propertyId } = req.params as { propertyId: string };
    const property = await approvePropertyService(propertyId, authReq.userId!);
    res.status(200).json(property);
  } catch (err) {
    next(err);
  }
};

export const rejectProperty = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { propertyId } = req.params as { propertyId: string };
    const property = await rejectPropertyService(propertyId, authReq.userId!, req.body);
    res.status(200).json(property);
  } catch (err) {
    next(err);
  }
};
