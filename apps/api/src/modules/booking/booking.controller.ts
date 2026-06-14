import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../../infrastructure/database/client.js';
import { AppError } from '../../shared/errors/AppError.js';
import { acquireHold, releaseHold } from '../inventory/inventory.service.js';
import type { CreateHoldBody, ReleaseHoldParams } from './schemas.js';
import type { AuthenticatedRequest } from '../../shared/types/request.js';

export const createHoldController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as CreateHoldBody;

    // Fetch the property to get the tenantId
    const property = await prisma.property.findUnique({
      where: { id: body.propertyId },
      select: { tenantId: true },
    });

    if (!property) {
      throw AppError.notFound('Property not found');
    }

    const authReq = req as AuthenticatedRequest;
    if (authReq.userId) {
      const isOwner = await prisma.tenantUser.findFirst({
        where: { tenantId: property.tenantId, userId: authReq.userId },
      });

      if (isOwner) {
        throw AppError.forbidden(
          'Staff cannot book their own properties as a guest. Please use the Block Inventory feature instead.',
        );
      }
    }

    const hold = await acquireHold(
      property.tenantId,
      body.propertyId,
      body.unitTypeId,
      new Date(body.startDate),
      new Date(body.endDate),
      body.quantity,
    );

    res.status(201).json({
      message: 'Hold acquired successfully',
      holdToken: hold.holdToken,
      expiresAt: hold.expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

export const releaseHoldController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const params = req.params as ReleaseHoldParams;

    await releaseHold(params.holdToken);

    res.status(200).json({ message: 'Hold released successfully' });
  } catch (err) {
    next(err);
  }
};
