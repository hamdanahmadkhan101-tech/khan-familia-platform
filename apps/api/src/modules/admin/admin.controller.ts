import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../shared/types/request.js';
import {
  approveProperty as approvePropertyService,
  listPendingProperties as listPendingPropertiesService,
  rejectProperty as rejectPropertyService,
} from './admin.service.js';

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
