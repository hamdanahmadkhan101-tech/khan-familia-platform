import { Router } from 'express';
import { validateParams } from '../../shared/middleware/validate.js';
import { propertySlugParamsSchema } from '@khan-familia/validation';
import {
  getPublicPropertyDetailsController,
  listPublicPropertiesController,
} from './public.controller.js';

export const publicRouter = Router();

/** Get a list of all active/approved properties for discovery */
publicRouter.get('/properties', listPublicPropertiesController);

/** Get full details of a specific property by slug */
publicRouter.get(
  '/properties/:slug',
  validateParams(propertySlugParamsSchema),
  getPublicPropertyDetailsController,
);
