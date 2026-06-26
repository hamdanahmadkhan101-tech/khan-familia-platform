import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError.js';
import {
  cancelGuestBooking,
  createGuestHold,
  getGuestBookingById,
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

const getIdempotencyKey = (req: Request): string | undefined => {
  const value = req.headers['idempotency-key'];
  const key = Array.isArray(value) ? value[0] : value;

  if (key === undefined || key.trim().length === 0) {
    return undefined;
  }

  if (key.trim().length > 128) {
    throw AppError.badRequest('Idempotency-Key header must be 128 characters or fewer');
  }

  return key.trim();
};

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

    const hold = await createGuestHold(
      authReq.userId,
      req.body as CreateHoldBody,
      getIdempotencyKey(req),
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

    await releaseGuestHold(params.holdToken);

    res.status(200).json({ message: 'Hold released successfully' });
  } catch (err) {
    next(err);
  }
};
