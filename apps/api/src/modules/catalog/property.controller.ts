import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError.js';

import type { TenantRequest } from '../../shared/types/request.js';
import {
  createProperty as createPropertyService,
  getPropertyForTenant as getPropertyForTenantService,
  listPropertiesForTenant as listPropertiesForTenantService,
  softDeleteProperty as softDeletePropertyService,
  updateProperty as updatePropertyService,
  addPropertyImage as addPropertyImageService,
  deletePropertyImage as deletePropertyImageService,
} from './property.service.js';
import { addPropertyImageBodySchema } from '@khan-familia/validation';

export const createProperty = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const property = await createPropertyService(
      tenantReq.tenantId,
      req.body as Parameters<typeof createPropertyService>[1],
    );
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
    const page = req.query['page'] ? Number(req.query['page']) : undefined;
    const limit = req.query['limit'] ? Number(req.query['limit']) : undefined;
    const result = await listPropertiesForTenantService(tenantReq.tenantId, { page, limit });
    res.status(200).json(result);
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
    const property = await updatePropertyService(
      tenantReq.tenantId,
      propertyId,
      req.body as Parameters<typeof updatePropertyService>[2],
    );
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

export const addPropertyImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const { propertyId } = req.params as { propertyId: string };

    const parsed = addPropertyImageBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid image data');
    }

    const { url, publicId } = parsed.data;
    const image = await addPropertyImageService(tenantReq.tenantId, propertyId, url, publicId);

    res.status(201).json(image);
  } catch (err) {
    next(err);
  }
};

export const deletePropertyImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const { propertyId, imageId } = req.params as { propertyId: string; imageId: string };

    await deletePropertyImageService(tenantReq.tenantId, propertyId, imageId);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
