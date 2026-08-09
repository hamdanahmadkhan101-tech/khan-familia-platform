import { Router, type RequestHandler } from 'express';
import { authenticateRequired } from '../../shared/middleware/authenticate.js';
import { resolveInternalUser } from '../../shared/middleware/resolve-user.js';
import { generateSignature } from './upload.controller.js';

export const uploadRouter = Router();

uploadRouter.post(
  '/signature',
  authenticateRequired as RequestHandler,
  resolveInternalUser as RequestHandler,
  generateSignature as RequestHandler,
);
