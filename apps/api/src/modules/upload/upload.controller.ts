import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../shared/types/request.js';
import { createUploadBodySchema, uploadIdParamsSchema } from '@khan-familia/validation';
import { createUpload, completeUpload, getDocumentAccess } from './upload.service.js';
import { AppError } from '../../shared/errors/AppError.js';

const userId = (req: Request) => {
  const id = (req as AuthenticatedRequest).userId;
  if (!id) throw AppError.unauthorized();
  return id;
};
export const generateSignature = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createUploadBodySchema.safeParse(req.body);
    if (!input.success) throw AppError.badRequest('Specify an allowed upload purpose and target');
    res.set('Cache-Control', 'no-store');
    res.status(201).json(await createUpload(userId(req), input.data));
  } catch (error) {
    next(error);
  }
};
export const finishUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uploadId } = uploadIdParamsSchema.parse(req.params);
    res.set('Cache-Control', 'no-store');
    res.json(await completeUpload(userId(req), uploadId));
  } catch (error) {
    next(error);
  }
};
export const documentAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uploadId } = uploadIdParamsSchema.parse(req.params);
    res.set('Cache-Control', 'no-store');
    res.set('Referrer-Policy', 'no-referrer');
    res.json(await getDocumentAccess(userId(req), uploadId));
  } catch (error) {
    next(error);
  }
};
