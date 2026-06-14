import {
  addMinutes as dfAddMinutes,
  differenceInCalendarDays,
  differenceInMilliseconds,
  format,
  isAfter,
  isBefore,
  parseISO,
} from 'date-fns';
export const formatIsoDate = (date: Date, pattern = 'yyyy-MM-dd'): string => format(date, pattern);

export const calculateNights = (checkIn: Date, checkOut: Date): number =>
  differenceInCalendarDays(checkOut, checkIn);

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
