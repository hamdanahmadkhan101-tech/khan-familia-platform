import {
  addDays as dfAddDays,
  addMinutes as dfAddMinutes,
  differenceInCalendarDays,
  differenceInDays as dfDifferenceInDays,
  differenceInMilliseconds,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfDay as dfStartOfDay,
} from 'date-fns';
export const formatIsoDate = (date: Date, pattern = 'yyyy-MM-dd'): string => format(date, pattern);

export const calculateNights = (checkIn: Date, checkOut: Date): number =>
  differenceInCalendarDays(checkOut, checkIn);

export const addDays = (date: Date, amount: number): Date => dfAddDays(date, amount);

export const differenceInDays = (dateLeft: Date, dateRight: Date): number =>
  dfDifferenceInDays(dateLeft, dateRight);

export const startOfDay = (date: Date): Date => dfStartOfDay(date);

export const isOverlappingDateRange = (
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean => isBefore(startA, endB) && isAfter(endA, startB);

export const parseIsoDate = (value: string): Date => parseISO(value);

export const addMinutes = (date: Date, amount: number): Date => dfAddMinutes(date, amount);

export const calculateDelayMs = (futureDate: Date, fromDate: Date = new Date()): number =>
  Math.max(0, differenceInMilliseconds(futureDate, fromDate));
