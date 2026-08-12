import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import type { AuthenticatedRequest } from '../../shared/types/request.js';
import type { SubmitApplicationBody } from '@khan-familia/validation';
import {
  submitApplication as submitAppService,
  getApplicationStatus as getAppStatusService,
} from './application.service.js';

export const submitApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.userId) {
      throw AppError.unauthorized('User context required');
    }

    const application = await submitAppService(authReq.userId, req.body as SubmitApplicationBody);
    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
};

export const getApplicationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.userId) {
      throw AppError.unauthorized('User context required');
    }

    const status = await getAppStatusService(authReq.userId);
    res.status(200).json({ application: status });
  } catch (err) {
    next(err);
  }
};
