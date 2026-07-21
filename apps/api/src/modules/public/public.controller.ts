import type { NextFunction, Request, Response } from 'express';
import { getPublicPropertyBySlug, listPublicProperties } from './public.service.js';

/**
 * GET /public/properties
 * Controller is thin — delegates all logic to the service.
 */
export const listPublicPropertiesController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const properties = await listPublicProperties();
    res.status(200).json(properties);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /public/properties/:slug
 * Controller is thin — delegates all logic to the service.
 */
export const getPublicPropertyDetailsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const slug = req.params['slug'] as string;
    const property = await getPublicPropertyBySlug(slug);
    res.status(200).json(property);
  } catch (err) {
    next(err);
  }
};
