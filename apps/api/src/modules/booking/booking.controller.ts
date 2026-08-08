import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import {
  cancelGuestBooking,
  createGuestHold,
  getGuestBookingById,
  getGuestHold,
  listGuestBookings,
  releaseGuestHold,
} from './booking.service.js';
import type {
  BookingIdParams,
  CancelGuestBookingBody,
  CreateHoldBody,
  GuestBookingListQuery,
  ReleaseHoldParams,
} from '@khan-familia/validation';
import type { AuthenticatedRequest } from '../../shared/types/request.js';

export const listGuestBookingsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const query = req.query as unknown as GuestBookingListQuery;
    const bookings = await listGuestBookings(authReq.userId, query);

    res.status(200).json({ bookings });
  } catch (err) {
    next(err);
  }
};

export const getGuestBookingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const params = req.params as BookingIdParams;
    const booking = await getGuestBookingById(authReq.userId, params.bookingId);

    res.status(200).json({ booking });
  } catch (err) {
    next(err);
  }
};

export const cancelGuestBookingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const params = req.params as BookingIdParams;
    const body = req.body as CancelGuestBookingBody;
    const booking = await cancelGuestBooking(authReq.userId, params.bookingId, body);

    res.status(200).json({ message: 'Booking cancelled successfully', booking });
  } catch (err) {
    next(err);
  }
};

export const createHoldController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const hold = await createGuestHold(authReq.userId, req.body as CreateHoldBody);

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
    const authReq = req as AuthenticatedRequest;
    if (!authReq.userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const params = req.params as ReleaseHoldParams;

    await releaseGuestHold(params.holdToken, authReq.userId);

    res.status(200).json({ message: 'Hold released successfully' });
  } catch (err) {
    next(err);
  }
};

export const getHoldController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.userId) {
      throw AppError.unauthorized('Authentication required');
    }

    const params = req.params as ReleaseHoldParams;

    const hold = await getGuestHold(params.holdToken, authReq.userId);

    res.status(200).json({ hold });
  } catch (err) {
    next(err);
  }
};
