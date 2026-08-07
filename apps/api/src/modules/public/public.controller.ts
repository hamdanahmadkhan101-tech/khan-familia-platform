import type { NextFunction, Request, Response } from 'express';
import { getPublicPropertyBySlug, listPublicProperties } from './public.service.js';

/**
 * GET /public/properties
 * Controller is thin — delegates all logic to the service.
 */
export const listPublicPropertiesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const filters = {
      city: req.query['city'] as string,
      country: req.query['country'] as string,
      propertyType: req.query['propertyType'] as string,
      propertyCategory: req.query['propertyCategory'] as string,
      minPrice: req.query['minPrice'] ? Number(req.query['minPrice']) : undefined,
      maxPrice: req.query['maxPrice'] ? Number(req.query['maxPrice']) : undefined,
      starRating: req.query['starRating'] ? Number(req.query['starRating']) : undefined,
      query: req.query['query'] as string,
      page: req.query['page'] ? Number(req.query['page']) : undefined,
      limit: req.query['limit'] ? Number(req.query['limit']) : undefined,
    };
    const result = await listPublicProperties(filters);
    res.status(200).json(result);
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
