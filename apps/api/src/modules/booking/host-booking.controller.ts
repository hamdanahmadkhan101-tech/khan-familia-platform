import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedRequest, TenantRequest } from '../../shared/types/request.js';
import {
  approveGuestBooking,
  rejectGuestBooking,
  checkInBooking,
  checkOutBooking,
  markNoShow,
} from './booking.service.js';
import type { RejectBookingBody } from '@khan-familia/validation';

export const approveBookingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const authReq = req as AuthenticatedRequest;
    const { bookingId } = req.params as { bookingId: string };

    const booking = await approveGuestBooking(tenantReq.tenantId, bookingId, authReq.userId!);
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const rejectBookingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const authReq = req as AuthenticatedRequest;
    const { bookingId } = req.params as { bookingId: string };

    const booking = await rejectGuestBooking(
      tenantReq.tenantId,
      bookingId,
      authReq.userId!,
      req.body as RejectBookingBody,
    );
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const checkInBookingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const authReq = req as AuthenticatedRequest;
    const { bookingId } = req.params as { bookingId: string };

    const booking = await checkInBooking(tenantReq.tenantId, bookingId, authReq.userId!);
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const checkOutBookingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const authReq = req as AuthenticatedRequest;
    const { bookingId } = req.params as { bookingId: string };

    const booking = await checkOutBooking(tenantReq.tenantId, bookingId, authReq.userId!);
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const markNoShowController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenantReq = req as TenantRequest;
    const authReq = req as AuthenticatedRequest;
    const { bookingId } = req.params as { bookingId: string };

    const booking = await markNoShow(tenantReq.tenantId, bookingId, authReq.userId!);
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};
