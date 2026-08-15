import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import { cloudinary } from '../../infrastructure/storage/cloudinary.js';
import { generateSignatureQuerySchema } from '@khan-familia/validation';
import { env } from '../../env.js';

export const generateSignature = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const parsed = generateSignatureQuerySchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid signature params');
    }

    const paramsToSign = parsed.data;

    // Ensure we don't sign with a fake api secret
    if (paramsToSign['api_secret']) {
      delete paramsToSign['api_secret'];
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, env.CLOUDINARY_API_SECRET);

    res.status(200).json({ signature, timestamp: Number(paramsToSign['timestamp']) });
  } catch (err) {
    next(err);
  }
};
