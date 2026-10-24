import { validateParams } from '../../shared/middleware/validate.js';
import { uploadIdParamsSchema } from '@khan-familia/validation';
import { Router, type RequestHandler } from 'express';
import { authenticateRequired } from '../../shared/middleware/authenticate.js';
import { resolveInternalUser } from '../../shared/middleware/resolve-user.js';
import { generateSignature, finishUpload, documentAccess } from './upload.controller.js';

export const uploadRouter = Router();

uploadRouter.post(
  '/signature',
  authenticateRequired as RequestHandler,
  resolveInternalUser as RequestHandler,
  generateSignature as RequestHandler,
);

const authenticated = [
  authenticateRequired as RequestHandler,
  resolveInternalUser as RequestHandler,
];
uploadRouter.post(
  '/:uploadId/complete',
  ...authenticated,
  validateParams(uploadIdParamsSchema),
  finishUpload,
);
uploadRouter.get(
  '/:uploadId/access',
  ...authenticated,
  validateParams(uploadIdParamsSchema),
  documentAccess,
);
