import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../shared/types/request.js';
import {
  approveProperty as approvePropertyService,
  listPendingProperties as listPendingPropertiesService,
  rejectProperty as rejectPropertyService,
  listPendingApplications as listPendingApplicationsService,
  approveApplication as approveApplicationService,
  rejectApplication as rejectApplicationService,
} from './admin.service.js';
import type { ApplicationReviewBody } from '@khan-familia/validation';

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
    const reqBody = req.body as { reason: string };
    const property = await rejectPropertyService(propertyId, authReq.userId!, reqBody);
    res.status(200).json(property);
  } catch (err) {
    next(err);
  }
};

export const listPendingApplications = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const applications = await listPendingApplicationsService();
    res.status(200).json({ applications });
  } catch (err) {
    next(err);
  }
};

export const approveApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { applicationId } = req.params as { applicationId: string };
    const { adminNotes } = req.body as ApplicationReviewBody;
    const application = await approveApplicationService(applicationId, authReq.userId!, adminNotes);
    res.status(200).json(application);
  } catch (err) {
    next(err);
  }
};

export const rejectApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { applicationId } = req.params as { applicationId: string };
    const { adminNotes } = req.body as ApplicationReviewBody;
    const application = await rejectApplicationService(applicationId, authReq.userId!, adminNotes);
    res.status(200).json(application);
  } catch (err) {
    next(err);
  }
};
